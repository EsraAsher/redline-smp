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
import creatorAuthMiddleware from '../middleware/creatorAuth.js';

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

    res.json({
      creatorName: c.creatorName,
      discordId: c.discordId,
      referralCode: c.referralCode,
      discountPercent: c.discountPercent,
      commissionPercent: c.commissionPercent,
      totalUses: c.totalUses,
      totalRevenueGenerated: c.totalRevenueGenerated,
      totalCommissionEarned: c.totalCommissionEarned,
      pendingCommission: c.pendingCommission,
      totalPaidOut: c.totalPaidOut,
      payoutThreshold: c.payoutThreshold,
      payoutEligible: c.pendingCommission >= c.payoutThreshold,
      status: c.status,
    });
  } catch (err) {
    console.error('[Creator] Dashboard error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── 4. Verify creator token (used by frontend on reload) ─
router.get('/verify', creatorAuthMiddleware, async (req, res) => {
  res.json({ valid: true, creatorName: req.creator.creatorName });
});

export default router;
