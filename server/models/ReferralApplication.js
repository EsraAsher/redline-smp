import mongoose from 'mongoose';

const referralApplicationSchema = new mongoose.Schema({
  creatorName: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
  },
  minecraftUsername: {
    type: String,
    required: true,
    trim: true,
  },
  discordId: {
    type: String,
    required: true,
    trim: true,
  },
  channelLink: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
    default: '',
  },

  // ─── Lifecycle ────────────────────────────────────────────
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
  },
  reviewReason: {
    type: String,
    trim: true,
    default: '',
  },
  reviewedAt: {
    type: Date,
  },
}, { timestamps: true });

// Indexes
referralApplicationSchema.index({ status: 1 });
referralApplicationSchema.index({ email: 1 });
referralApplicationSchema.index({ discordId: 1 });

const ReferralApplication = mongoose.model('ReferralApplication', referralApplicationSchema);

export default ReferralApplication;
