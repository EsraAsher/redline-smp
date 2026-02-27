import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import ReferralApplication from '../models/ReferralApplication.js';
import ReferralPartner from '../models/ReferralPartner.js';
import CommissionAdjustment from '../models/CommissionAdjustment.js';
import authMiddleware from '../middleware/auth.js';
import { sendMail, referralApplicationReceivedHTML, referralApplicationAdminHTML, referralApprovedHTML, referralRejectedHTML } from '../utils/mailer.js';
import { sendDiscordEvent } from '../utils/discord.js';

const router = Router();

// ─── Rate limiter for applications (S4) ─────────────────
const applyLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many applications. Please try again later.' },
});

// ─── Helper: auto-generate a unique referral code ─────────
async function generateUniqueCode(baseName) {
  const prefix = baseName
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 6) || 'REDLINE';

  for (let attempt = 0; attempt < 10; attempt++) {
    const suffix = Math.random().toString(36).substring(2, 5).toUpperCase();
    const code = `${prefix}${suffix}`;
    const exists = await ReferralPartner.findOne({ referralCode: code });
    if (!exists) return code;
  }
  // Fallback: timestamp-based
  return `RL${Date.now().toString(36).toUpperCase()}`;
}

// ═══════════════════════════════════════════════════════════
// PUBLIC — Creator submits application
// POST /api/referrals/apply
// ═══════════════════════════════════════════════════════════
router.post('/apply', applyLimiter, async (req, res) => {
  try {
    const { creatorName, email, minecraftUsername, discordId, channelLink, description } = req.body;

    // ── Validation ──────────────────────────────────────────
    if (!creatorName || !email || !minecraftUsername || !discordId || !channelLink) {
      return res.status(400).json({ message: 'Creator name, email, Minecraft username, Discord ID and channel link are required.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email address.' });
    }

    // ── Duplicate check ─────────────────────────────────────
    const existing = await ReferralApplication.findOne({
      $or: [
        { email: email.toLowerCase() },
        { discordId: discordId.trim() },
        { minecraftUsername: { $regex: new RegExp(`^${minecraftUsername}$`, 'i') } },
      ],
      status: { $in: ['pending', 'approved'] },
    });

    if (existing) {
      if (existing.status === 'pending') {
        return res.status(409).json({ message: 'You already have a pending application. Please wait for review.' });
      }
      if (existing.status === 'approved') {
        return res.status(409).json({ message: 'You are already an approved referral partner.' });
      }
    }

    // ── Create application ──────────────────────────────────
    const application = await ReferralApplication.create({
      creatorName: creatorName.trim(),
      email: email.trim().toLowerCase(),
      minecraftUsername: minecraftUsername.trim(),
      discordId: discordId.trim(),
      channelLink: channelLink.trim(),
      description: description?.trim() || '',
    });

    // ── Notifications (fire-and-forget) ─────────────────────
    const templateData = {
      creatorName: application.creatorName,
      email: application.email,
      minecraftUsername: application.minecraftUsername,
      discordId: application.discordId,
      channelLink: application.channelLink,
      description: application.description,
    };

    // Email to creator
    sendMail({
      to: application.email,
      subject: '📋 Referral Application Received — Redline SMP',
      html: referralApplicationReceivedHTML({ creatorName: application.creatorName }),
    }).catch(() => {});

    // Email to admin
    const adminEmail = process.env.ADMIN_EMAIL;
    if (adminEmail) {
      sendMail({
        to: adminEmail,
        subject: '🔔 New Referral Application — Redline SMP',
        html: referralApplicationAdminHTML(templateData),
      }).catch(() => {});
    }

    // Discord notification
    sendDiscordEvent('referral_application', templateData).catch(() => {});

    res.status(201).json({
      message: 'Application submitted successfully! You will receive an email once it is reviewed.',
      id: application._id,
    });
  } catch (err) {
    console.error('[Referrals] Apply error:', err);
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
});

// ═══════════════════════════════════════════════════════════
// ADMIN — List all referral applications
// GET /api/referrals/admin/applications
// ═══════════════════════════════════════════════════════════
router.get('/admin/applications', authMiddleware, async (req, res) => {
  try {
    const applications = await ReferralApplication.find()
      .sort({ createdAt: -1 })
      .populate('reviewedBy', 'username');

    res.json(applications);
  } catch (err) {
    console.error('[Referrals] List applications error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ═══════════════════════════════════════════════════════════
// ADMIN — List all active referral partners
// GET /api/referrals/admin/partners
// ═══════════════════════════════════════════════════════════
router.get('/admin/partners', authMiddleware, async (req, res) => {
  try {
    const partners = await ReferralPartner.find()
      .sort({ createdAt: -1 });

    res.json(partners);
  } catch (err) {
    console.error('[Referrals] List partners error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ═══════════════════════════════════════════════════════════
// ADMIN — Approve application
// PATCH /api/referrals/admin/:id/approve
// Body: { referralCode?, discountPercent?, commissionPercent?, reviewReason? }
// ═══════════════════════════════════════════════════════════
router.patch('/admin/:id/approve', authMiddleware, async (req, res) => {
  try {
    const { referralCode, discountPercent, commissionPercent, reviewReason } = req.body;

    const application = await ReferralApplication.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ message: 'Application not found.' });
    }
    if (application.status === 'approved') {
      return res.status(400).json({ message: 'Already approved.' });
    }

    // ── Generate or validate referral code ──────────────────
    let code;
    if (referralCode && referralCode.trim().length >= 3) {
      code = referralCode.trim().toUpperCase();
      const codeExists = await ReferralPartner.findOne({ referralCode: code });
      if (codeExists) {
        return res.status(409).json({ message: `Code "${code}" is already in use.` });
      }
    } else {
      code = await generateUniqueCode(application.creatorName);
    }

    // ── Create referral partner document ────────────────────
    const partner = await ReferralPartner.create({
      creatorName: application.creatorName,
      discordId: application.discordId,
      minecraftUsername: application.minecraftUsername,
      referralCode: code,
      discountPercent: discountPercent ?? 10,
      commissionPercent: commissionPercent ?? 10,
      totalUses: 0,
      totalRevenueGenerated: 0,
      totalCommissionEarned: 0,
      pendingCommission: 0,
      totalPaidOut: 0,
      payoutThreshold: 0,
      status: 'active',
      applicationId: application._id,
    });

    // ── Mark application as approved ────────────────────────
    application.status = 'approved';
    application.reviewedBy = req.admin._id;
    application.reviewReason = reviewReason?.trim() || '';
    application.reviewedAt = new Date();
    await application.save();

    // ── Notifications ───────────────────────────────────────
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
      reviewedBy: req.admin.username,
    }).catch(() => {});

    res.json({
      message: 'Referral approved successfully.',
      application,
      partner,
    });
  } catch (err) {
    console.error('[Referrals] Approve error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ═══════════════════════════════════════════════════════════
// ADMIN — Reject application
// PATCH /api/referrals/admin/:id/reject
// Body: { reviewReason? }
// ═══════════════════════════════════════════════════════════
router.patch('/admin/:id/reject', authMiddleware, async (req, res) => {
  try {
    const application = await ReferralApplication.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ message: 'Application not found.' });
    }
    if (application.status === 'approved') {
      return res.status(400).json({ message: 'Cannot reject an already approved application.' });
    }

    application.status = 'rejected';
    application.reviewReason = req.body.reviewReason?.trim() || '';
    application.reviewedBy = req.admin._id;
    application.reviewedAt = new Date();
    await application.save();

    // ── Notifications ───────────────────────────────────────
    sendMail({
      to: application.email,
      subject: '📋 Referral Application Update — Redline SMP',
      html: referralRejectedHTML({ creatorName: application.creatorName }),
    }).catch(() => {});

    sendDiscordEvent('referral_rejected', {
      creatorName: application.creatorName,
      reviewedBy: req.admin.username,
    }).catch(() => {});

    res.json({ message: 'Application rejected.', application });
  } catch (err) {
    console.error('[Referrals] Reject error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ═══════════════════════════════════════════════════════════
// ADMIN — Update partner settings (S3)
// PATCH /api/referrals/admin/partner/:id/update
// ═══════════════════════════════════════════════════════════
router.patch('/admin/partner/:id/update', authMiddleware, async (req, res) => {
  try {
    const { discountPercent, commissionPercent, maxUses, expiresAt, referralCode } = req.body;
    const partner = await ReferralPartner.findById(req.params.id);
    if (!partner) return res.status(404).json({ message: 'Partner not found.' });

    if (discountPercent !== undefined) partner.discountPercent = Math.min(100, Math.max(0, Number(discountPercent)));
    if (commissionPercent !== undefined) partner.commissionPercent = Math.min(100, Math.max(0, Number(commissionPercent)));
    if (maxUses !== undefined) partner.maxUses = maxUses === null || maxUses === '' ? null : Math.max(0, Number(maxUses));
    if (expiresAt !== undefined) partner.expiresAt = expiresAt || null;

    // Regenerate / change referral code
    if (referralCode && referralCode.trim()) {
      const newCode = referralCode.trim().toUpperCase();
      if (newCode !== partner.referralCode) {
        const exists = await ReferralPartner.findOne({ referralCode: newCode, _id: { $ne: partner._id } });
        if (exists) return res.status(409).json({ message: `Code "${newCode}" is already in use.` });
        partner.referralCode = newCode;
      }
    }

    await partner.save();
    res.json({ message: 'Partner updated.', partner });
  } catch (err) {
    console.error('[Referrals] Update partner error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ═══════════════════════════════════════════════════════════
// ADMIN — Change partner status (S3)
// PATCH /api/referrals/admin/partner/:id/status
// ═══════════════════════════════════════════════════════════
router.patch('/admin/partner/:id/status', authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['active', 'paused', 'banned'].includes(status)) {
      return res.status(400).json({ message: 'Status must be active, paused, or banned.' });
    }

    const partner = await ReferralPartner.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!partner) return res.status(404).json({ message: 'Partner not found.' });

    res.json({ message: `Partner status changed to ${status}.`, partner });
  } catch (err) {
    console.error('[Referrals] Status change error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ═══════════════════════════════════════════════════════════
// ADMIN — Adjust pending commission manually with audit (S3)
// PATCH /api/referrals/admin/partner/:id/adjust-commission
// ═══════════════════════════════════════════════════════════
router.patch('/admin/partner/:id/adjust-commission', authMiddleware, async (req, res) => {
  try {
    const { amount, note } = req.body;
    const adjustAmount = Number(amount);
    if (!Number.isFinite(adjustAmount) || adjustAmount === 0) {
      return res.status(400).json({ message: 'Amount must be a non-zero number.' });
    }

    const partner = await ReferralPartner.findById(req.params.id);
    if (!partner) return res.status(404).json({ message: 'Partner not found.' });

    const previousBalance = partner.pendingCommission;
    const newBalance = Math.max(0, Math.round((previousBalance + adjustAmount) * 100) / 100);

    partner.pendingCommission = newBalance;
    if (adjustAmount > 0) {
      partner.totalCommissionEarned = Math.round((partner.totalCommissionEarned + adjustAmount) * 100) / 100;
    }
    await partner.save();

    // Audit log
    await CommissionAdjustment.create({
      partnerId: partner._id,
      amount: adjustAmount,
      previousBalance,
      newBalance: partner.pendingCommission,
      note: note?.trim() || '',
      adjustedBy: req.admin._id,
    });

    console.log(`[Referrals] Commission adjusted for ${partner.creatorName}: ₹${previousBalance} → ₹${partner.pendingCommission} (${adjustAmount > 0 ? '+' : ''}${adjustAmount}) by ${req.admin.username}`);

    res.json({
      message: `Commission adjusted: ₹${previousBalance} → ₹${partner.pendingCommission}`,
      partner,
    });
  } catch (err) {
    console.error('[Referrals] Adjust commission error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ═══════════════════════════════════════════════════════════
// ADMIN — Referral analytics summary (S7)
// GET /api/referrals/admin/analytics
// ═══════════════════════════════════════════════════════════
router.get('/admin/analytics', authMiddleware, async (req, res) => {
  try {
    const [totals] = await ReferralPartner.aggregate([
      {
        $group: {
          _id: null,
          totalPartners: { $sum: 1 },
          activePartners: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
          totalRevenueGenerated: { $sum: '$totalRevenueGenerated' },
          totalCommissionLiability: { $sum: '$pendingCommission' },
          totalCommissionPaid: { $sum: '$totalPaidOut' },
        },
      },
    ]);

    res.json(totals || {
      totalPartners: 0,
      activePartners: 0,
      totalRevenueGenerated: 0,
      totalCommissionLiability: 0,
      totalCommissionPaid: 0,
    });
  } catch (err) {
    console.error('[Referrals] Analytics error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
