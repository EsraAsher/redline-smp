/**
 * Payment Routes — Razorpay integration (Webhook-Only Confirmation)
 *
 * POST /api/payments/create-order   → create Razorpay order + DB order
 * POST /api/payments/webhook        → Razorpay webhook (server-to-server) — ONLY way to confirm payment
 * GET  /api/payments/order/:id      → get order status (for polling / thank-you page)
 *
 * ⚠️  Frontend NEVER confirms payment. Only Razorpay webhook marks orders as paid.
 */
import { Router } from 'express';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import StoreCode from '../models/StoreCode.js';
import ReferralPartner from '../models/ReferralPartner.js';

const router = Router();

// ─── Razorpay instance ────────────────────────────────────
function getRazorpay() {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_id || !key_secret) {
    throw new Error('Razorpay keys not configured in server/.env');
  }
  return new Razorpay({ key_id, key_secret });
}

// ─── 1. Create Razorpay Order ─────────────────────────────
router.post('/create-order', async (req, res) => {
  try {
    const { mcUsername, email, items, storeCode, referralCode } = req.body;

    if (!mcUsername || !items?.length) {
      return res.status(400).json({ message: 'mcUsername and items are required' });
    }

    if (!storeCode) {
      return res.status(400).json({ message: 'Store code is required. Use /storecode in-game to get one.' });
    }

    // Find valid, unused, unexpired store code and consume it atomically
    const validCode = await StoreCode.findOneAndUpdate(
      {
        username: mcUsername,
        code: storeCode,
        used: false,
        expiresAt: { $gt: new Date() },
      },
      { used: true },
      { new: true }
    );

    if (!validCode) {
      return res.status(403).json({ message: 'Invalid or expired store code. Please generate a new one in-game.' });
    }

    // Validate products exist & are active, get real prices
    const productIds = items.map((i) => i.productId);
    const products = await Product.find({ _id: { $in: productIds }, isActive: true });

    if (products.length !== productIds.length) {
      return res.status(400).json({ message: 'One or more products are unavailable' });
    }

    // Build order items with server-side prices (never trust client prices)
    let total = 0;
    const orderItems = items.map((clientItem) => {
      const prod = products.find((p) => p._id.toString() === clientItem.productId);
      const qty = Math.max(1, parseInt(clientItem.quantity) || 1);
      total += prod.price * qty;
      return {
        product: prod._id,
        title: prod.title,
        price: prod.price,
        quantity: qty,
        commands: prod.commands || [],
      };
    });

    // Round to 2 decimals
    total = Math.round(total * 100) / 100;

    // ── Referral code validation (Phase 2) ──────────────────
    let referralSnapshot = null;

    if (referralCode && referralCode.trim()) {
      const code = referralCode.trim().toUpperCase();

      // Find the referral partner
      const partner = await ReferralPartner.findOne({ referralCode: code });
      if (!partner) {
        return res.status(400).json({ message: `Referral code "${code}" does not exist.` });
      }

      // Status must be active (not paused or banned)
      if (partner.status !== 'active') {
        return res.status(400).json({ message: 'This referral code is currently inactive.' });
      }

      // Check expiry
      if (partner.expiresAt && new Date() > partner.expiresAt) {
        return res.status(400).json({ message: 'This referral code has expired.' });
      }

      // Check max uses
      if (partner.maxUses !== null && partner.totalUses >= partner.maxUses) {
        return res.status(400).json({ message: 'This referral code has reached its maximum usage limit.' });
      }

      // Prevent self-use: buyer's mcUsername must not match creator's
      if (partner.minecraftUsername && mcUsername.trim().toLowerCase() === partner.minecraftUsername.trim().toLowerCase()) {
        return res.status(400).json({ message: 'You cannot use your own referral code.' });
      }

      // Calculate discount server-side
      const discountAmount = Math.round(total * (partner.discountPercent / 100) * 100) / 100;

      referralSnapshot = {
        referralCodeUsed: code,
        referralCreatorId: partner._id,
        referralDiscountApplied: discountAmount,
        referralCommissionSnapshot: partner.commissionPercent,
        referralTracked: false,
      };

      // Apply discount
      total = Math.round((total - discountAmount) * 100) / 100;
      if (total < 1) total = 1; // Razorpay minimum ₹1
    }
    // ── End referral validation ─────────────────────────────

    // Create Razorpay order (amount in smallest unit — paise for INR)
    const rz = getRazorpay();
    const rzOrder = await rz.orders.create({
      amount: Math.round(total * 100), // paise
      currency: 'INR',
      receipt: `rcpt_${Date.now()}`,
      notes: {
        mcUsername,
        email: email || '',
      },
    });

    // Persist order in DB
    const order = await Order.create({
      mcUsername,
      email: email || '',
      items: orderItems,
      total,
      currency: 'INR',
      razorpayOrderId: rzOrder.id,
      status: 'created',
      paymentStatus: 'created',
      // Referral snapshot (null-safe spread)
      ...(referralSnapshot || {}),
    });

    res.json({
      orderId: order._id,
      razorpayOrderId: rzOrder.id,
      razorpayKeyId: process.env.RAZORPAY_KEY_ID,
      amount: rzOrder.amount,
      currency: rzOrder.currency,
      mcUsername,
      // Return discount info so frontend can display it (not used for calculation)
      ...(referralSnapshot ? {
        referralApplied: true,
        referralCode: referralSnapshot.referralCodeUsed,
        discountAmount: referralSnapshot.referralDiscountApplied,
      } : {}),
    });
  } catch (err) {
    console.error('[Payment] create-order error:', err);
    res.status(500).json({ message: err.message || 'Failed to create order' });
  }
});

// ─── 2. (REMOVED) Client-side Verification ───────────────
// Frontend no longer confirms payment. Only Razorpay webhook can mark orders as paid.
// This route has been intentionally removed for security.

// ─── 3. Razorpay Webhook (ONLY way to confirm payment) ───
// POST /api/payments/webhook — called by Razorpay servers
// ⚠️  Raw body parsing is handled in server/index.js BEFORE express.json()
router.post('/webhook', async (req, res) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error('[Webhook] RAZORPAY_WEBHOOK_SECRET is not configured!');
      return res.status(500).send('Webhook secret not configured');
    }

    console.log('Webhook received');
    console.log('Headers:', req.headers);
    console.log('Raw body length:', req.body?.length ?? 0);

    // Verify webhook signature using raw body buffer
    const signature = req.headers['x-razorpay-signature'];
    if (!signature) {
      console.warn('[Webhook] Missing x-razorpay-signature header');
      return res.status(400).send('Missing webhook signature');
    }

    if (!Buffer.isBuffer(req.body)) {
      console.error('[Webhook] req.body is not a raw Buffer. Check middleware order/path.');
      return res.status(400).send('Invalid webhook payload format');
    }

    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(req.body)
      .digest('hex');

    if (signature !== expectedSignature) {
      console.warn('[Webhook] Invalid signature — rejecting');
      return res.status(400).send('Invalid webhook signature');
    }

    // Parse the event only after signature verification
    const event = JSON.parse(req.body.toString('utf8'));
    console.log('Event:', event?.event);
    console.log('[Webhook] Received:', event.event);

    // Only process payment.captured events
    if (event.event !== 'payment.captured') {
      console.log(`[Webhook] Ignoring event: ${event.event}`);
      return res.status(200).send('Event ignored');
    }

    // Extract payment data
    const payment = event.payload.payment.entity;
    const paymentId = payment.id;
    const razorpayOrderId = payment.order_id;
    const notes = payment.notes || {};
    const mcUsername = notes.mcUsername;

    console.log('[Webhook] Processing payment ID:', paymentId);
    console.log('[Webhook] Razorpay Order ID:', razorpayOrderId);
    console.log('[Webhook] MC Username:', mcUsername);

    // Prevent duplicate processing
    const existing = await Order.findOne({ razorpayPaymentId: paymentId });
    if (existing) {
      console.log('[Webhook] Already processed payment:', paymentId);
      return res.status(200).send('Already processed');
    }

    // Find and update order — ONLY set paid + pending delivery
    const order = await Order.findOneAndUpdate(
      { razorpayOrderId: razorpayOrderId },
      {
        status: 'paid',
        paymentStatus: 'paid',
        webhookVerified: true,
        deliveryStatus: 'pending',
        razorpayPaymentId: paymentId,
        paidAt: new Date(),
      },
      { new: true }
    );

    if (!order) {
      console.warn(`[Webhook] Order not found for razorpayOrderId: ${razorpayOrderId}`);
      return res.status(200).send('Order not found'); // 200 so Razorpay doesn't retry
    }

    console.log(`[Webhook] ✅ Order ${order._id} marked as PAID (webhook verified)`);

    // Update product analytics
    await updateProductAnalytics(order);

    // Track referral commission (Phase 3)
    await trackReferralCommission(order);

    res.status(200).send('OK');
  } catch (err) {
    console.error('[Webhook] Error:', err);
    res.status(200).send('Error handled'); // always 200 to prevent Razorpay retries
  }
});

// ─── 4. Get Order Status ──────────────────────────────────
router.get('/order/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).select(
      'mcUsername items total status paymentStatus deliveryStatus createdAt paidAt deliveredAt'
    );
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── Helpers ───────────────────────────────────────────────

/**
 * Update totalSold / totalRevenue on each Product after a successful payment.
 */
async function updateProductAnalytics(order) {
  try {
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: {
          totalSold: item.quantity,
          totalRevenue: item.price * item.quantity,
        },
      });
    }
  } catch (err) {
    console.error('[Analytics] Failed to update product stats:', err.message);
  }
}

/**
 * Track referral commission after a verified payment.
 * Only runs if:
 *   - order has referralCodeUsed
 *   - referralTracked is false (prevents duplicate commission)
 *   - paymentStatus is 'paid' and webhookVerified is true
 *   - order is not refunded or failed
 */
async function trackReferralCommission(order) {
  try {
    // Guard: must have referral code and not already tracked
    if (!order.referralCodeUsed || order.referralTracked) return;

    // Guard: only process fully verified paid orders
    if (order.paymentStatus !== 'paid' || !order.webhookVerified) return;

    // Guard: skip refunded / failed orders
    if (order.status === 'refunded' || order.status === 'failed') return;

    // Calculate commission from the snapshot stored at checkout
    const commission = Math.round(order.total * (order.referralCommissionSnapshot / 100) * 100) / 100;

    // Atomically update the referral partner's tracking counters
    const updated = await ReferralPartner.findByIdAndUpdate(
      order.referralCreatorId,
      {
        $inc: {
          totalUses: 1,
          totalRevenueGenerated: order.total,
          totalCommissionEarned: commission,
          pendingCommission: commission,
        },
      },
      { new: true }
    );

    if (!updated) {
      console.warn(`[Referral] Partner ${order.referralCreatorId} not found — skipping commission for order ${order._id}`);
      return;
    }

    // Mark order as tracked so commission is never applied twice
    order.referralTracked = true;
    await order.save();

    console.log(`[Referral] ✅ Commission ₹${commission} tracked for code ${order.referralCodeUsed} (order ${order._id})`);
  } catch (err) {
    // Non-fatal: log but don't break the webhook response
    console.error('[Referral] Commission tracking error:', err.message);
  }
}

export default router;
