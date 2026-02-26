import { Router } from 'express';
import ReferralApplication from '../models/ReferralApplication.js';
import ReferralPartner from '../models/ReferralPartner.js';
import authMiddleware from '../middleware/auth.js';
import { sendMail, referralApplicationReceivedHTML, referralApplicationAdminHTML, referralApprovedHTML, referralRejectedHTML } from '../utils/mailer.js';
import { sendDiscordWebhook, referralApplicationEmbed, referralApprovedEmbed, referralRejectedEmbed } from '../utils/discord.js';

const router = Router();

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
router.post('/apply', async (req, res) => {
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
    sendDiscordWebhook(referralApplicationEmbed(templateData)).catch(() => {});

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
      payoutThreshold: 300,
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

    sendDiscordWebhook(referralApprovedEmbed({
      creatorName: application.creatorName,
      referralCode: code,
      discountPercent: partner.discountPercent,
      commissionPercent: partner.commissionPercent,
      reviewedBy: req.admin.username,
    })).catch(() => {});

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

    sendDiscordWebhook(referralRejectedEmbed({
      creatorName: application.creatorName,
      reviewedBy: req.admin.username,
    })).catch(() => {});

    res.json({ message: 'Application rejected.', application });
  } catch (err) {
    console.error('[Referrals] Reject error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
