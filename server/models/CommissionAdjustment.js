import mongoose from 'mongoose';

const commissionAdjustmentSchema = new mongoose.Schema({
  partnerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ReferralPartner',
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  previousBalance: {
    type: Number,
    required: true,
  },
  newBalance: {
    type: Number,
    required: true,
  },
  note: {
    type: String,
    default: '',
    trim: true,
  },
  adjustedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true,
  },
}, { timestamps: true });

commissionAdjustmentSchema.index({ partnerId: 1, createdAt: -1 });

const CommissionAdjustment = mongoose.model('CommissionAdjustment', commissionAdjustmentSchema);

export default CommissionAdjustment;
