import mongoose from 'mongoose';

const payoutSchema = new mongoose.Schema({
  // ─── Partner reference ────────────────────────────────────
  partnerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ReferralPartner',
    required: true,
  },

  // ─── Payout details ──────────────────────────────────────
  amount: {
    type: Number,
    required: true,
    min: 1,
  },

  // ─── Snapshot of partner state at payout time ─────────────
  creatorName: {
    type: String,
    required: true,
  },
  referralCode: {
    type: String,
    required: true,
  },

  // ─── Admin who processed it ───────────────────────────────
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true,
  },

  note: {
    type: String,
    default: '',
    trim: true,
  },
}, { timestamps: true });

// Index for quick partner-specific lookups
payoutSchema.index({ partnerId: 1, createdAt: -1 });

const Payout = mongoose.model('Payout', payoutSchema);

export default Payout;
