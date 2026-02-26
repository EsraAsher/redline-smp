import mongoose from 'mongoose';

const referralFraudLogSchema = new mongoose.Schema({
  referralCode: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['code_usage', 'self_use', 'rapid_repeat', 'suspicious_pattern'],
    required: true,
  },
  metadata: {
    ip: String,
    email: String,
    mcUsername: String,
    partnerCreatorName: String,
    details: String,
  },
}, { timestamps: true });

// Lookup indexes
referralFraudLogSchema.index({ referralCode: 1, type: 1, createdAt: -1 });
referralFraudLogSchema.index({ 'metadata.ip': 1, referralCode: 1, createdAt: -1 });

// Auto-delete entries older than 90 days
referralFraudLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

const ReferralFraudLog = mongoose.model('ReferralFraudLog', referralFraudLogSchema);

export default ReferralFraudLog;
