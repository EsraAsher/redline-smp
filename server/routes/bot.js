/**
 * Bot API Routes — internal endpoints consumed by the Discord bot.
 * All routes require x-bot-secret header matching BOT_INTERNAL_SECRET.
 */
import { Router } from 'express';
import ReferralPartner from '../models/ReferralPartner.js';

const router = Router();

// ─── Bot auth middleware ──────────────────────────────────
function botAuth(req, res, next) {
  const secret = req.headers['x-bot-secret'];
  if (!secret || secret !== process.env.BOT_INTERNAL_SECRET) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  next();
}

// All bot routes require auth
router.use(botAuth);

// ═══════════════════════════════════════════════════════════
// GET /api/bot/referral/:discordId
// Returns safe subset of partner data for the bot embed.
// ═══════════════════════════════════════════════════════════
router.get('/referral/:discordId', async (req, res) => {
  try {
    const partner = await ReferralPartner.findOne({ discordId: req.params.discordId });

    if (!partner) {
      return res.status(404).json({ message: 'Partner not found.' });
    }

    res.json({
      creatorName: partner.creatorName,
      referralCode: partner.referralCode,
      totalUses: partner.totalUses,
      totalRevenueGenerated: partner.totalRevenueGenerated,
      pendingCommission: partner.pendingCommission,
      payoutThreshold: partner.payoutThreshold,
      status: partner.status,
    });
  } catch (err) {
    console.error('[Bot API] Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
