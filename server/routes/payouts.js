import { Router } from 'express';
import ReferralPartner from '../models/ReferralPartner.js';
import ReferralApplication from '../models/ReferralApplication.js';
import Payout from '../models/Payout.js';
import authMiddleware from '../middleware/auth.js';
import { sendMail, payoutProcessedHTML } from '../utils/mailer.js';
import { sendDiscordEvent } from '../utils/discord.js';

const router = Router();

// ═══════════════════════════════════════════════════════════
// ADMIN — List creators eligible for payout
// GET /api/payouts/eligible
// ═══════════════════════════════════════════════════════════
router.get('/eligible', authMiddleware, async (req, res) => {
  try {
    const partners = await ReferralPartner.find({
      pendingCommission: { $gte: 300 },
      status: { $in: ['active', 'paused'] },        // banned creators excluded
    })
      .sort({ pendingCommission: -1 })
      .select('creatorName discordId referralCode pendingCommission totalPaidOut totalCommissionEarned totalUses totalRevenueGenerated payoutThreshold status');

    res.json(partners);
  } catch (err) {
    console.error('[Payouts] Eligible error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ═══════════════════════════════════════════════════════════
// ADMIN — Get payout history (all or for a specific partner)
// GET /api/payouts/history?partnerId=xxx
// ═══════════════════════════════════════════════════════════
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const filter = {};
    if (req.query.partnerId) filter.partnerId = req.query.partnerId;

    const payouts = await Payout.find(filter)
      .sort({ createdAt: -1 })
      .populate('processedBy', 'username')
      .limit(200);

    res.json(payouts);
  } catch (err) {
    console.error('[Payouts] History error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ═══════════════════════════════════════════════════════════
// ADMIN — Process a payout
// POST /api/payouts/process
// Body: { partnerId, amount, note? }
// ═══════════════════════════════════════════════════════════
router.post('/process', authMiddleware, async (req, res) => {
  try {
    const { partnerId, amount, note } = req.body;

    // ── Validation ──────────────────────────────────────────
    if (!partnerId || !amount) {
      return res.status(400).json({ message: 'partnerId and amount are required.' });
    }

    const payoutAmount = Number(amount);
    if (!Number.isFinite(payoutAmount) || payoutAmount <= 0) {
      return res.status(400).json({ message: 'Amount must be a positive number.' });
    }

    // ── Find partner ────────────────────────────────────────
    const partner = await ReferralPartner.findById(partnerId);
    if (!partner) {
      return res.status(404).json({ message: 'Referral partner not found.' });
    }

    if (partner.status === 'banned') {
      return res.status(400).json({ message: 'Cannot process payout for a banned partner.' });
    }

    // ── Prevent over-paying ─────────────────────────────────
    if (payoutAmount > partner.pendingCommission) {
      return res.status(400).json({
        message: `Payout amount (₹${payoutAmount}) exceeds pending commission (₹${partner.pendingCommission}).`,
      });
    }

    // ── Atomic update on partner ────────────────────────────
    const updated = await ReferralPartner.findOneAndUpdate(
      {
        _id: partnerId,
        pendingCommission: { $gte: payoutAmount },       // double-check concurrency
      },
      {
        $inc: {
          pendingCommission: -payoutAmount,
          totalPaidOut: payoutAmount,
        },
      },
      { new: true }
    );

    if (!updated) {
      return res.status(409).json({ message: 'Payout failed — pending commission changed. Please refresh and retry.' });
    }

    // ── Create payout record ────────────────────────────────
    const payout = await Payout.create({
      partnerId: partner._id,
      amount: payoutAmount,
      creatorName: partner.creatorName,
      referralCode: partner.referralCode,
      processedBy: req.admin._id,
      note: note?.trim() || '',
    });

    // ── Notifications (fire-and-forget) ─────────────────────
    // Fetch creator email from linked application
    let creatorEmail = null;
    if (partner.applicationId) {
      const app = await ReferralApplication.findById(partner.applicationId).select('email');
      creatorEmail = app?.email;
    }

    if (creatorEmail) {
      sendMail({
        to: creatorEmail,
        subject: '💸 Payout Processed — Redline SMP',
        html: payoutProcessedHTML({
          creatorName: partner.creatorName,
          amount: payoutAmount,
          referralCode: partner.referralCode,
          remainingBalance: updated.pendingCommission,
          totalPaidOut: updated.totalPaidOut,
        }),
      }).catch(() => {});
    }

    sendDiscordEvent('payout_processed', {
      creatorName: partner.creatorName,
      referralCode: partner.referralCode,
      amount: payoutAmount,
      remainingBalance: updated.pendingCommission,
      processedBy: req.admin.username,
    }).catch(() => {});

    res.json({
      message: `Payout of ₹${payoutAmount} processed for ${partner.creatorName}.`,
      payout,
      partner: {
        pendingCommission: updated.pendingCommission,
        totalPaidOut: updated.totalPaidOut,
      },
    });
  } catch (err) {
    console.error('[Payouts] Process error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
