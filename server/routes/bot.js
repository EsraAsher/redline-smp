/**
 * Bot API Routes — internal endpoints consumed by the Discord bot.
 * All routes require x-bot-secret header matching BOT_INTERNAL_SECRET.
 */
import { Router } from 'express';
import ReferralPartner from '../models/ReferralPartner.js';
import ReferralApplication from '../models/ReferralApplication.js';
import PayoutRequest from '../models/PayoutRequest.js';
import Payout from '../models/Payout.js';
import { getSettings } from '../models/Settings.js';
import { sendMail, payoutProcessedHTML, payoutRejectedHTML, referralApprovedHTML, referralRejectedHTML } from '../utils/mailer.js';
import { sendDiscordEvent } from '../utils/discord.js';
import { generateUniqueCode } from '../utils/referralCode.js';

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

// ═══════════════════════════════════════════════════════════
// POST /api/bot/request-payout
// Body: { discordId, realName, method, payoutDetails }
// Creator requests a payout via the Discord bot.
// ═══════════════════════════════════════════════════════════
router.post('/request-payout', async (req, res) => {
  try {
    const { discordId, realName, method, payoutDetails } = req.body;

    if (!discordId) {
      return res.status(400).json({ message: 'discordId is required.' });
    }

    const partner = await ReferralPartner.findOne({ discordId });
    if (!partner) {
      return res.status(404).json({ message: 'Partner not found.' });
    }

    // Status check
    if (partner.status !== 'active') {
      return res.status(403).json({ message: `Account is ${partner.status}. Cannot request payout.` });
    }

    // Dynamic threshold
    const settings = await getSettings();
    const threshold = settings.globalPayoutThreshold;

    if (partner.pendingCommission < threshold) {
      return res.status(400).json({
        message: `Need at least ₹${threshold} pending commission. Current: ₹${partner.pendingCommission}.`,
      });
    }

    // Check for existing open request
    const existing = await PayoutRequest.findOne({
      partnerId: partner._id,
      status: { $in: ['pending', 'processing'] },
    });
    if (existing) {
      return res.status(409).json({
        message: 'An open payout request already exists. Wait for it to be processed.',
        existingRequest: {
          _id: existing._id,
          amount: existing.amount,
          status: existing.status,
          requestedAt: existing.requestedAt,
        },
      });
    }

    // Validate fields
    if (!realName?.trim()) {
      return res.status(400).json({ message: 'realName is required.' });
    }

    const validMethods = ['bank', 'upi', 'qr'];
    if (!validMethods.includes(method)) {
      return res.status(400).json({ message: 'method must be bank, upi, or qr.' });
    }

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

    // Create payout request — amount is the full pending commission
    const pr = await PayoutRequest.create({
      partnerId: partner._id,
      amount: partner.pendingCommission,
      creatorName: partner.creatorName,
      referralCode: partner.referralCode,
      realName: realName.trim(),
      method,
      payoutDetails: payoutDetails || {},
      qrImageUrl: method === 'qr' ? payoutDetails?.qrImageUrl : undefined,
    });

    // Discord notification (fire-and-forget)
    sendDiscordEvent('payout_requested', {
      creatorName: partner.creatorName,
      referralCode: partner.referralCode,
      amount: partner.pendingCommission,
      method: method.toUpperCase(),
    }).catch(() => {});

    res.status(201).json({
      message: `Payout request submitted for ₹${partner.pendingCommission}.`,
      request: {
        _id: pr._id,
        amount: pr.amount,
        method: pr.method,
        status: pr.status,
        requestedAt: pr.requestedAt,
      },
    });
  } catch (err) {
    console.error('[Bot API] request-payout error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ═══════════════════════════════════════════════════════════
// POST /api/bot/admin/payout-approve
// Body: { discordId }
// Approves the pending payout request for a creator.
// ═══════════════════════════════════════════════════════════
router.post('/admin/payout-approve', async (req, res) => {
  try {
    const { discordId } = req.body;
    if (!discordId) {
      return res.status(400).json({ message: 'discordId is required.' });
    }

    const partner = await ReferralPartner.findOne({ discordId });
    if (!partner) {
      return res.status(404).json({ message: 'Partner not found.' });
    }

    // Find the pending payout request
    const pr = await PayoutRequest.findOne({
      partnerId: partner._id,
      status: 'pending',
    });
    if (!pr) {
      return res.status(404).json({ message: 'No pending payout request found for this creator.' });
    }

    // Move to processing (approved by admin, awaiting payment)
    pr.status = 'processing';
    await pr.save();

    res.json({
      message: `Payout request for ${partner.creatorName} approved and marked as processing.`,
      request: {
        _id: pr._id,
        amount: pr.amount,
        method: pr.method,
        status: pr.status,
        creatorName: pr.creatorName,
        referralCode: pr.referralCode,
      },
    });
  } catch (err) {
    console.error('[Bot API] admin/payout-approve error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ═══════════════════════════════════════════════════════════
// POST /api/bot/admin/approve
// Body: { discordId, approvedBy }
// Approves a pending referral application by discordId.
// ═══════════════════════════════════════════════════════════
router.post('/admin/approve', async (req, res) => {
  try {
    const { discordId, approvedBy } = req.body;
    if (!discordId) {
      return res.status(400).json({ message: 'discordId is required.' });
    }

    const application = await ReferralApplication.findOne({ discordId, status: 'pending' });
    if (!application) {
      return res.status(404).json({ message: 'No pending application found.' });
    }

    // Generate referral code (shared util)
    const code = await generateUniqueCode(application.creatorName);

    // Create partner document (mirrors dashboard approval)
    const partner = await ReferralPartner.create({
      creatorName: application.creatorName,
      discordId: application.discordId,
      minecraftUsername: application.minecraftUsername,
      referralCode: code,
      discountPercent: 10,
      commissionPercent: 10,
      totalUses: 0,
      totalRevenueGenerated: 0,
      totalCommissionEarned: 0,
      pendingCommission: 0,
      totalPaidOut: 0,
      payoutThreshold: 0,
      status: 'active',
      applicationId: application._id,
    });

    // Mark application approved
    application.status = 'approved';
    application.reviewedAt = new Date();
    // reviewedBy is ObjectId ref to Admin — omitted for bot (no admin identity)
    await application.save();

    // Notifications (fire-and-forget)
    sendMail({
      to: application.email,
      subject: '🎉 You\'re Approved! — Redline SMP Referral Program',
      html: referralApprovedHTML({
        creatorName: application.creatorName,
        referralCode: code,
        discountPercent: partner.discountPercent,
        commissionPercent: partner.commissionPercent,
      }),
    }).catch(() => {});

    sendDiscordEvent('referral_approved', {
      creatorName: application.creatorName,
      referralCode: code,
      discountPercent: partner.discountPercent,
      commissionPercent: partner.commissionPercent,
      reviewedBy: approvedBy || 'Bot Admin',
    }).catch(() => {});

    // Notify Discord bot of approval
    const botUrl = process.env.BOT_ENDPOINT_URL;
    if (botUrl) {
      fetch(`${botUrl}/application-status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-bot-secret': process.env.BOT_INTERNAL_SECRET,
        },
        body: JSON.stringify({
          discordId: application.discordId,
          status: 'approved',
          referralCode: code,
        }),
      }).catch(() => {});
    }

    res.json({
      success: true,
      referralCode: code,
      creatorName: application.creatorName,
    });
  } catch (err) {
    console.error('[Bot API] admin/approve error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ═══════════════════════════════════════════════════════════
// POST /api/bot/admin/reject
// Body: { discordId, reason?, rejectedBy }
// Rejects a pending referral application by discordId.
// ═══════════════════════════════════════════════════════════
router.post('/admin/reject', async (req, res) => {
  try {
    const { discordId, reason, rejectedBy } = req.body;
    if (!discordId) {
      return res.status(400).json({ message: 'discordId is required.' });
    }

    const application = await ReferralApplication.findOne({ discordId, status: 'pending' });
    if (!application) {
      return res.status(404).json({ message: 'No pending application found.' });
    }

    application.status = 'rejected';
    application.reviewReason = reason?.trim() || '';
    application.reviewedAt = new Date();
    await application.save();

    // Notifications (fire-and-forget)
    sendMail({
      to: application.email,
      subject: '📋 Referral Application Update — Redline SMP',
      html: referralRejectedHTML({ creatorName: application.creatorName }),
    }).catch(() => {});

    sendDiscordEvent('referral_rejected', {
      creatorName: application.creatorName,
      reviewedBy: rejectedBy || 'Bot Admin',
    }).catch(() => {});

    res.json({
      success: true,
      message: `Application for ${application.creatorName} rejected.`,
    });
  } catch (err) {
    console.error('[Bot API] admin/reject error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ═══════════════════════════════════════════════════════════
// POST /api/bot/admin/payout-reject
// Body: { discordId, reason? }
// Rejects the open payout request for a creator.
// ═══════════════════════════════════════════════════════════
router.post('/admin/payout-reject', async (req, res) => {
  try {
    const { discordId, reason } = req.body;
    if (!discordId) {
      return res.status(400).json({ message: 'discordId is required.' });
    }

    const partner = await ReferralPartner.findOne({ discordId });
    if (!partner) {
      return res.status(404).json({ message: 'Partner not found.' });
    }

    // Find the open (pending or processing) payout request
    const pr = await PayoutRequest.findOne({
      partnerId: partner._id,
      status: { $in: ['pending', 'processing'] },
    });
    if (!pr) {
      return res.status(404).json({ message: 'No open payout request found for this creator.' });
    }

    pr.status = 'rejected';
    pr.rejectionReason = reason?.trim() || '';
    pr.processedAt = new Date();
    await pr.save();

    // Send rejection email (fire-and-forget)
    if (partner.applicationId) {
      const app = await ReferralApplication.findById(partner.applicationId).select('email');
      if (app?.email) {
        sendMail({
          to: app.email,
          subject: '❌ Payout Request Rejected — Redline SMP',
          html: payoutRejectedHTML({
            creatorName: pr.creatorName,
            amount: pr.amount,
            reason: pr.rejectionReason || 'No reason provided.',
          }),
        }).catch(() => {});
      }
    }

    sendDiscordEvent('payout_rejected', {
      creatorName: pr.creatorName,
      referralCode: pr.referralCode,
      amount: pr.amount,
      reason: pr.rejectionReason || 'No reason provided.',
      rejectedBy: 'Bot Admin',
    }).catch(() => {});

    res.json({
      message: `Payout request for ${partner.creatorName} rejected.`,
      request: {
        _id: pr._id,
        amount: pr.amount,
        status: pr.status,
        rejectionReason: pr.rejectionReason,
      },
    });
  } catch (err) {
    console.error('[Bot API] admin/reject error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ═══════════════════════════════════════════════════════════
// POST /api/bot/admin/payout-complete
// Body: { discordId, transactionId }
// Completes the open payout request — moves commission, creates
// Payout record, triggers email + Discord webhook.
// ═══════════════════════════════════════════════════════════
router.post('/admin/payout-complete', async (req, res) => {
  try {
    const { discordId, transactionId } = req.body;
    if (!discordId) {
      return res.status(400).json({ message: 'discordId is required.' });
    }
    if (!transactionId?.trim()) {
      return res.status(400).json({ message: 'transactionId is required.' });
    }

    const partner = await ReferralPartner.findOne({ discordId });
    if (!partner) {
      return res.status(404).json({ message: 'Partner not found.' });
    }

    // Find the open (pending or processing) payout request
    const pr = await PayoutRequest.findOne({
      partnerId: partner._id,
      status: { $in: ['pending', 'processing'] },
    });
    if (!pr) {
      return res.status(404).json({ message: 'No open payout request found for this creator.' });
    }

    // Verify sufficient pending commission
    if (pr.amount > partner.pendingCommission) {
      return res.status(400).json({
        message: `Payout amount (₹${pr.amount}) exceeds current pending commission (₹${partner.pendingCommission}).`,
      });
    }

    // Atomic update on partner — move pending → paid
    const updated = await ReferralPartner.findOneAndUpdate(
      { _id: partner._id, pendingCommission: { $gte: pr.amount } },
      { $inc: { pendingCommission: -pr.amount, totalPaidOut: pr.amount } },
      { new: true }
    );

    if (!updated) {
      return res.status(409).json({ message: 'Payout failed — pending commission changed. Refresh and retry.' });
    }

    // Update payout request
    pr.status = 'completed';
    pr.transactionId = transactionId.trim();
    pr.processedAt = new Date();
    await pr.save();

    // Create Payout record (for history)
    await Payout.create({
      partnerId: partner._id,
      amount: pr.amount,
      creatorName: pr.creatorName,
      referralCode: pr.referralCode,
      processedVia: 'bot',
      note: `Bot payout request #${pr._id} — ${pr.method.toUpperCase()} — Txn: ${transactionId.trim()}`,
    });

    // Notifications (fire-and-forget)
    if (partner.applicationId) {
      const app = await ReferralApplication.findById(partner.applicationId).select('email');
      if (app?.email) {
        sendMail({
          to: app.email,
          subject: '💸 Payout Processed — Redline SMP',
          html: payoutProcessedHTML({
            creatorName: partner.creatorName,
            amount: pr.amount,
            referralCode: partner.referralCode,
            remainingBalance: updated.pendingCommission,
            totalPaidOut: updated.totalPaidOut,
          }),
        }).catch(() => {});
      }
    }

    sendDiscordEvent('payout_processed', {
      creatorName: partner.creatorName,
      referralCode: partner.referralCode,
      amount: pr.amount,
      remainingBalance: updated.pendingCommission,
      processedBy: 'Bot Admin',
    }).catch(() => {});

    res.json({
      message: `Payout of ₹${pr.amount} completed for ${partner.creatorName}.`,
      request: {
        _id: pr._id,
        amount: pr.amount,
        status: pr.status,
        transactionId: pr.transactionId,
      },
      partner: {
        pendingCommission: updated.pendingCommission,
        totalPaidOut: updated.totalPaidOut,
      },
    });
  } catch (err) {
    console.error('[Bot API] admin/payout-complete error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ═══════════════════════════════════════════════════════════
// POST /api/bot/admin/pause
// Body: { discordId }
// Sets partner status to "paused".
// ═══════════════════════════════════════════════════════════
router.post('/admin/pause', async (req, res) => {
  try {
    const { discordId } = req.body;
    if (!discordId) {
      return res.status(400).json({ message: 'discordId is required.' });
    }

    const partner = await ReferralPartner.findOne({ discordId });
    if (!partner) {
      return res.status(404).json({ message: 'Partner not found.' });
    }

    if (partner.status === 'paused') {
      return res.status(400).json({ message: `${partner.creatorName} is already paused.` });
    }
    if (partner.status === 'banned') {
      return res.status(400).json({ message: `${partner.creatorName} is banned. Unban first.` });
    }

    partner.status = 'paused';
    await partner.save();

    res.json({
      message: `${partner.creatorName} has been paused.`,
      partner: {
        creatorName: partner.creatorName,
        referralCode: partner.referralCode,
        status: partner.status,
      },
    });
  } catch (err) {
    console.error('[Bot API] admin/pause error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ═══════════════════════════════════════════════════════════
// POST /api/bot/admin/ban
// Body: { discordId }
// Sets partner status to "banned".
// ═══════════════════════════════════════════════════════════
router.post('/admin/ban', async (req, res) => {
  try {
    const { discordId } = req.body;
    if (!discordId) {
      return res.status(400).json({ message: 'discordId is required.' });
    }

    const partner = await ReferralPartner.findOne({ discordId });
    if (!partner) {
      return res.status(404).json({ message: 'Partner not found.' });
    }

    if (partner.status === 'banned') {
      return res.status(400).json({ message: `${partner.creatorName} is already banned.` });
    }

    partner.status = 'banned';
    await partner.save();

    res.json({
      message: `${partner.creatorName} has been banned.`,
      partner: {
        creatorName: partner.creatorName,
        referralCode: partner.referralCode,
        status: partner.status,
      },
    });
  } catch (err) {
    console.error('[Bot API] admin/ban error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
