import mongoose from 'mongoose';

const referralPartnerSchema = new mongoose.Schema({
  // ─── Creator Identity ─────────────────────────────────────
  creatorName: {
    type: String,
    required: true,
    trim: true,
  },
  discordId: {
    type: String,
    required: true,
    trim: true,
  },
  discordUsername: {
    type: String,
    trim: true,
    default: '',
  },

  minecraftUsername: {
    type: String,
    trim: true,
    default: '',
  },

  // ─── Referral Config ──────────────────────────────────────
  referralCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
  },
  discountPercent: {
    type: Number,
    default: 10,
    min: 0,
    max: 100,
  },
  commissionPercent: {
    type: Number,
    default: 10,
    min: 0,
    max: 100,
  },

  // ─── Tracking (updated by commission engine in Phase 3) ───
  totalUses: {
    type: Number,
    default: 0,
  },
  totalRevenueGenerated: {
    type: Number,
    default: 0,
  },
  totalCommissionEarned: {
    type: Number,
    default: 0,
  },
  pendingCommission: {
    type: Number,
    default: 0,
  },
  totalPaidOut: {
    type: Number,
    default: 0,
  },
  payoutThreshold: {
    type: Number,
    default: 300,
  },

  // ─── Limits (optional) ────────────────────────────────────
  maxUses: {
    type: Number,
    default: null,
  },
  expiresAt: {
    type: Date,
    default: null,
  },

  // ─── Status ───────────────────────────────────────────────
  status: {
    type: String,
    enum: ['active', 'paused', 'banned'],
    default: 'active',
  },

  // ─── Link back to application ─────────────────────────────
  applicationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ReferralApplication',
  },
}, { timestamps: true });

// Indexes (referralCode unique index is auto-created by schema unique:true)
referralPartnerSchema.index({ status: 1 });
referralPartnerSchema.index({ discordId: 1 });

const ReferralPartner = mongoose.model('ReferralPartner', referralPartnerSchema);

export default ReferralPartner;
