/**
 * Creator Routes — Discord OAuth + Dashboard
 *
 * GET  /api/creator/auth/discord          → redirect to Discord OAuth
 * GET  /api/creator/auth/discord/callback  → handle OAuth callback
 * GET  /api/creator/me                     → get creator dashboard data (protected)
 */
import { Router } from 'express';
import jwt from 'jsonwebtoken';
import ReferralPartner from '../models/ReferralPartner.js';
import Order from '../models/Order.js';
import PayoutRequest from '../models/PayoutRequest.js';
import { getSettings } from '../models/Settings.js';
import creatorAuthMiddleware from '../middleware/creatorAuth.js';
import { sendDiscordEvent } from '../utils/discord.js';

const router = Router();

// ─── Discord OAuth Config ─────────────────────────────────
function getDiscordConfig() {
  const clientId = process.env.DISCORD_CLIENT_ID;
  const clientSecret = process.env.DISCORD_CLIENT_SECRET;
  const redirectUri = process.env.DISCORD_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error('Discord OAuth env vars not configured (DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET, DISCORD_REDIRECT_URI)');
  }

  return { clientId, clientSecret, redirectUri };
}

// ─── 1. Redirect to Discord ──────────────────────────────
router.get('/auth/discord', (req, res) => {
  try {
    const { clientId, redirectUri } = getDiscordConfig();
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'identify',
    });
    res.redirect(`https://discord.com/api/oauth2/authorize?${params.toString()}`);
  } catch (err) {
    console.error('[Creator Auth] Discord redirect error:', err.message);
    res.status(500).json({ message: 'Discord OAuth not configured' });
  }
});

// ─── 2. Discord OAuth Callback ────────────────────────────
router.get('/auth/discord/callback', async (req, res) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

  try {
    const { code } = req.query;
    if (!code) {
      return res.redirect(`${frontendUrl}/creator/login?error=no_code`);
    }

    const { clientId, clientSecret, redirectUri } = getDiscordConfig();

    // Exchange code for access token
    const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenRes.ok) {
      console.error('[Creator Auth] Token exchange failed:', await tokenRes.text());
      return res.redirect(`${frontendUrl}/creator/login?error=token_failed`);
    }

    const tokenData = await tokenRes.json();

    // Fetch Discord user profile (identify scope)
    const userRes = await fetch('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    if (!userRes.ok) {
      console.error('[Creator Auth] User fetch failed:', await userRes.text());
      return res.redirect(`${frontendUrl}/creator/login?error=user_failed`);
    }

    const discordUser = await userRes.json();
    const discordId = discordUser.id;

    // Check if a referral partner exists with this discordId
    const partner = await ReferralPartner.findOne({ discordId });

    if (!partner) {
      return res.redirect(`${frontendUrl}/creator/login?error=not_partner`);
    }

    // Save/refresh Discord display name on every login
    const displayName = discordUser.global_name || discordUser.username || '';
    if (displayName && partner.discordUsername !== displayName) {
      partner.discordUsername = displayName;
      await partner.save();
    }

    // Issue JWT for creator session
    const token = jwt.sign(
      { id: partner._id, discordId, type: 'creator' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Redirect to frontend with token
    res.redirect(`${frontendUrl}/creator/callback?token=${token}`);
  } catch (err) {
    console.error('[Creator Auth] Callback error:', err);
    res.redirect(`${frontendUrl}/creator/login?error=server_error`);
  }
});

// ─── 3. Get Creator Dashboard Data ────────────────────────
router.get('/me', creatorAuthMiddleware, async (req, res) => {
  try {
    const c = req.creator;
    const settings = await getSettings();
    const threshold = settings.globalPayoutThreshold;

    res.json({
      creatorName: c.creatorName,
      discordId: c.discordId,
      discordUsername: c.discordUsername || null,
      referralCode: c.referralCode,
      discountPercent: c.discountPercent,
      commissionPercent: c.commissionPercent,
      totalUses: c.totalUses,
      totalRevenueGenerated: c.totalRevenueGenerated,
      totalCommissionEarned: c.totalCommissionEarned,
      pendingCommission: c.pendingCommission,
      totalPaidOut: c.totalPaidOut,
      payoutThreshold: threshold,
      payoutEligible: c.pendingCommission >= threshold,
      maxUses: c.maxUses || null,
      expiresAt: c.expiresAt || null,
      status: c.status,
    });
  } catch (err) {
    console.error('[Creator] Dashboard error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── 4. Performance Insights (no order-level data exposed) ─
router.get('/me/insights', creatorAuthMiddleware, async (req, res) => {
  try {
    const partnerId = req.creator._id;
    const now = new Date();
    const day7Ago = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const day30Ago = new Date(now - 30 * 24 * 60 * 60 * 1000);

    const [last7Uses, last30Agg] = await Promise.all([
      Order.countDocuments({
        referralCreatorId: partnerId,
        status: 'paid',
        paidAt: { $gte: day7Ago },
      }),
      Order.aggregate([
        {
          $match: {
            referralCreatorId: partnerId,
            status: 'paid',
            paidAt: { $gte: day30Ago },
          },
        },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),
    ]);

    res.json({
      last7DaysUses: last7Uses,
      last30DaysRevenue: last30Agg[0]?.total ?? 0,
    });
  } catch (err) {
    console.error('[Creator] Insights error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── 5. Verify creator token (used by frontend on reload) ─
router.get('/verify', creatorAuthMiddleware, async (req, res) => {
  res.json({ valid: true, creatorName: req.creator.creatorName });
});

// ─── 6. Submit Payout Request ─────────────────────────────
router.post('/me/payout-request', creatorAuthMiddleware, async (req, res) => {
  try {
    const c = req.creator;

    // Status check
    if (c.status !== 'active') {
      return res.status(403).json({ message: 'Your account is not active. Contact an admin.' });
    }

    // Dynamic threshold
    const settings = await getSettings();
    const threshold = settings.globalPayoutThreshold;

    if (c.pendingCommission < threshold) {
      return res.status(400).json({
        message: `You need at least ₹${threshold} pending commission. Current: ₹${c.pendingCommission}.`,
      });
    }

    // Check for existing open request
    const existing = await PayoutRequest.findOne({
      partnerId: c._id,
      status: { $in: ['pending', 'processing'] },
    });
    if (existing) {
      return res.status(409).json({
        message: 'You already have an open payout request. Wait for it to be processed before submitting another.',
      });
    }

    // Validate fields
    const { realName, method, payoutDetails } = req.body;

    if (!realName?.trim()) {
      return res.status(400).json({ message: 'Real name is required.' });
    }

    const validMethods = ['bank', 'upi', 'qr'];
    if (!validMethods.includes(method)) {
      return res.status(400).json({ message: 'Payment method must be bank, upi, or qr.' });
    }

    // Validate payment details per method
    if (method === 'bank') {
      if (!payoutDetails?.accountNumber || !payoutDetails?.ifscCode || !payoutDetails?.accountHolderName) {
        return res.status(400).json({ message: 'Bank details require accountNumber, ifscCode, and accountHolderName.' });
      }
    } else if (method === 'upi') {
      if (!payoutDetails?.upiId) {
        return res.status(400).json({ message: 'UPI ID is required.' });
      }
    } else if (method === 'qr') {
      if (!payoutDetails?.qrImageUrl) {
        return res.status(400).json({ message: 'QR code image URL is required.' });
      }
    }

    // Create payout request — amount is the full pending commission (backend decides)
    const pr = await PayoutRequest.create({
      partnerId: c._id,
      amount: c.pendingCommission,
      creatorName: c.creatorName,
      referralCode: c.referralCode,
      realName: realName.trim(),
      method,
      payoutDetails: payoutDetails || {},
      qrImageUrl: method === 'qr' ? payoutDetails?.qrImageUrl : undefined,
    });

    // Discord notification (fire-and-forget)
    sendDiscordEvent('payout_requested', {
      creatorName: c.creatorName,
      referralCode: c.referralCode,
      amount: c.pendingCommission,
      method: method.toUpperCase(),
    }).catch(() => {});

    res.status(201).json({
      message: 'Payout request submitted successfully. You will be notified once it is processed.',
      request: {
        _id: pr._id,
        amount: pr.amount,
        method: pr.method,
        status: pr.status,
        requestedAt: pr.requestedAt,
      },
    });
  } catch (err) {
    console.error('[Creator] Payout request error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── 7. Get Payout Request Status ─────────────────────────
router.get('/me/payout-request', creatorAuthMiddleware, async (req, res) => {
  try {
    // Return the most recent request (or the active one)
    const pr = await PayoutRequest.findOne({ partnerId: req.creator._id })
      .sort({ requestedAt: -1 })
      .select('amount method status transactionId rejectionReason requestedAt processedAt');

    res.json({ request: pr || null });
  } catch (err) {
    console.error('[Creator] Payout status error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
