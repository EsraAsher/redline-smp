import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  title: String,
  price: Number,
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  // Commands to run via RCON when delivered
  commands: [String],
});

const orderSchema = new mongoose.Schema({
  // ─── Customer ─────────────────────────────
  mcUsername: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    default: '',
    trim: true,
  },

  // ─── Cart ─────────────────────────────────
  items: [orderItemSchema],
  total: {
    type: Number,
    required: true,
  },
  currency: {
    type: String,
    default: 'INR',
  },

  // ─── Razorpay ─────────────────────────────
  razorpayOrderId: {
    type: String,
    index: true,
  },
  razorpayPaymentId: String,
  razorpaySignature: String,

  // ─── Status tracking ─────────────────────
  status: {
    type: String,
    enum: ['created', 'pending', 'paid', 'delivered', 'failed', 'refunded'],
    default: 'created',
  },
  paymentStatus: {
    type: String,
    enum: ['created', 'attempted', 'paid', 'failed'],
    default: 'created',
  },
  deliveryStatus: {
    type: String,
    enum: ['pending', 'delivered', 'failed', 'skipped'],
    default: 'pending',
  },
  deliveryLog: [String],

  // ─── Metadata ─────────────────────────────
  webhookVerified: {
    type: Boolean,
    default: false,
  },
  paidAt: Date,
  deliveredAt: Date,
}, { timestamps: true });

export default mongoose.model('Order', orderSchema);
