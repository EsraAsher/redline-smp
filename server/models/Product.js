import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  image: {
    type: String,
    default: '',
  },
  features: [{
    type: String,
  }],
  collection: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Collection',
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  isFeatured: {
    type: Boolean,
    default: false,
  },
  order: {
    type: Number,
    default: 0,
  },
  totalSold: {
    type: Number,
    default: 0,
  },
  totalRevenue: {
    type: Number,
    default: 0,
  },
  commands: {
    type: [String],
    default: [],
  },
}, { timestamps: true, suppressReservedKeysWarning: true });

export default mongoose.model('Product', productSchema);
