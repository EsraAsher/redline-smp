/**
 * Payment Routes — Razorpay integration
 *
 * POST /api/payments/create-order   → create Razorpay order + DB order
 * POST /api/payments/verify         → client-side verify after checkout popup
 * POST /api/payments/webhook        → Razorpay webhook (server-to-server)
 * GET  /api/payments/order/:id      → get order status (for polling / thank-you page)
 */
import { Router } from 'express';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import { deliverOrder, isRconConfigured } from '../services/rcon.js';

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
    const { mcUsername, email, items } = req.body;

    if (!mcUsername || !items?.length) {
      return res.status(400).json({ message: 'mcUsername and items are required' });
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
        commands: clientItem.commands || [],
      };
    });

    // Round to 2 decimals
    total = Math.round(total * 100) / 100;

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
    });

    res.json({
      orderId: order._id,
      razorpayOrderId: rzOrder.id,
      razorpayKeyId: process.env.RAZORPAY_KEY_ID,
      amount: rzOrder.amount,
      currency: rzOrder.currency,
      mcUsername,
    });
  } catch (err) {
    console.error('[Payment] create-order error:', err);
    res.status(500).json({ message: err.message || 'Failed to create order' });
  }
});

// ─── 2. Client-side Verification ──────────────────────────
// Called after Razorpay checkout popup succeeds, for instant UX.
// The webhook is the authoritative source — this is a convenience.
router.post('/verify', async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: 'Missing payment verification fields' });
    }

    // Verify signature
    const secret = process.env.RAZORPAY_KEY_SECRET;
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSig = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex');

    if (expectedSig !== razorpay_signature) {
      return res.status(400).json({ message: 'Invalid payment signature' });
    }

    // Update order
    const order = await Order.findOne({ razorpayOrderId: razorpay_order_id });
    if (!order) return res.status(404).json({ message: 'Order not found' });

    // Only process if not already paid (webhook may have beaten us)
    if (order.paymentStatus !== 'paid') {
      order.razorpayPaymentId = razorpay_payment_id;
      order.razorpaySignature = razorpay_signature;
      order.paymentStatus = 'paid';
      order.status = 'paid';
      order.paidAt = new Date();
      await order.save();

      // Update product analytics
      await updateProductAnalytics(order);

      // Deliver via RCON
      await attemptDelivery(order);
    }

    res.json({
      success: true,
      orderId: order._id,
      status: order.status,
      deliveryStatus: order.deliveryStatus,
    });
  } catch (err) {
    console.error('[Payment] verify error:', err);
    res.status(500).json({ message: 'Verification failed' });
  }
});

// ─── 3. Razorpay Webhook ──────────────────────────────────
// POST /api/payments/webhook — called by Razorpay servers
router.post('/webhook', express_raw_body, async (req, res) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (webhookSecret) {
      const shasum = crypto.createHmac('sha256', webhookSecret);
      shasum.update(req.rawBody);
      const digest = shasum.digest('hex');

      if (digest !== req.headers['x-razorpay-signature']) {
        console.warn('[Webhook] Invalid signature — ignoring');
        return res.status(400).json({ message: 'Invalid webhook signature' });
      }
    }

    const event = req.body;
    const eventType = event.event;
    console.log(`[Webhook] Received: ${eventType}`);

    if (eventType === 'payment.captured') {
      const payment = event.payload.payment.entity;
      const rzOrderId = payment.order_id;

      const order = await Order.findOne({ razorpayOrderId: rzOrderId });
      if (!order) {
        console.warn(`[Webhook] Order not found for ${rzOrderId}`);
        return res.json({ status: 'ok' }); // still 200 so Razorpay doesn't retry
      }

      if (order.paymentStatus !== 'paid') {
        order.razorpayPaymentId = payment.id;
        order.paymentStatus = 'paid';
        order.status = 'paid';
        order.webhookVerified = true;
        order.paidAt = new Date();
        await order.save();

        await updateProductAnalytics(order);
        await attemptDelivery(order);
      } else {
        // Already processed (verify route beat us)
        order.webhookVerified = true;
        await order.save();
      }
    }

    if (eventType === 'payment.failed') {
      const payment = event.payload.payment.entity;
      const rzOrderId = payment.order_id;
      const order = await Order.findOne({ razorpayOrderId: rzOrderId });
      if (order && order.paymentStatus !== 'paid') {
        order.paymentStatus = 'failed';
        order.status = 'failed';
        await order.save();
      }
    }

    res.json({ status: 'ok' });
  } catch (err) {
    console.error('[Webhook] Error:', err);
    res.json({ status: 'ok' }); // always 200 to prevent Razorpay retries
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
 * Middleware to capture raw body for webhook signature verification.
 * Express normally parses JSON, which destroys the raw body.
 */
function express_raw_body(req, res, next) {
  // If rawBody already exists (set by express.raw), use it
  if (req.rawBody) return next();

  // Otherwise reconstruct from parsed body
  req.rawBody = JSON.stringify(req.body);
  next();
}

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
 * Attempt RCON delivery. Updates order delivery status.
 */
async function attemptDelivery(order) {
  try {
    const { success, log } = await deliverOrder(order.mcUsername, order.items);
    order.deliveryLog = log;

    if (!isRconConfigured()) {
      order.deliveryStatus = 'skipped';
      order.status = 'paid'; // still paid, just not delivered via RCON
    } else if (success) {
      order.deliveryStatus = 'delivered';
      order.status = 'delivered';
      order.deliveredAt = new Date();
    } else {
      order.deliveryStatus = 'failed';
      // status stays 'paid' — admin can retry manually
    }

    await order.save();
  } catch (err) {
    console.error('[Delivery] Error:', err.message);
    order.deliveryStatus = 'failed';
    order.deliveryLog = [...(order.deliveryLog || []), `ERROR: ${err.message}`];
    await order.save();
  }
}

export default router;
