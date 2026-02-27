import mongoose from 'mongoose';

const payoutRequestSchema = new mongoose.Schema({
  // ─── Partner Reference ────────────────────────────────────
  partnerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ReferralPartner',
    required: true,
  },

  // ─── Amount (snapshot of pendingCommission at request time) ─
  amount: {
    type: Number,
    required: true,
    min: 1,
  },

  // ─── Creator Info Snapshot ────────────────────────────────
  creatorName: {
    type: String,
    required: true,
  },
  referralCode: {
    type: String,
    required: true,
  },

  // ─── Payout Details (from creator) ────────────────────────
  realName: {
    type: String,
    required: true,
    trim: true,
  },
  method: {
    type: String,
    enum: ['bank', 'upi', 'qr'],
    required: true,
  },
  payoutDetails: {
    // UPI: { upiId: "..." }
    // Bank: { accountNumber, ifsc, accountHolder }
    // QR: { note (optional) }
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  qrImageUrl: {
    type: String,
    default: '',
    trim: true,
  },

  // ─── Status Machine ──────────────────────────────────────
  // pending → processing → completed
  // pending → rejected
  // processing → completed
  // processing → rejected
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'rejected'],
    default: 'pending',
  },

  // ─── Admin Handling ───────────────────────────────────────
  transactionId: {
    type: String,
    default: '',
    trim: true,
  },
  rejectionReason: {
    type: String,
    default: '',
    trim: true,
  },
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    default: null,
  },
  processedAt: {
    type: Date,
    default: null,
  },

  // ─── Timestamps ───────────────────────────────────────────
  requestedAt: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

// Only ONE open request per partner at a time
payoutRequestSchema.index({ partnerId: 1, status: 1 });
payoutRequestSchema.index({ status: 1, requestedAt: -1 });

const PayoutRequest = mongoose.model('PayoutRequest', payoutRequestSchema);

export default PayoutRequest;
