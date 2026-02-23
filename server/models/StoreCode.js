import mongoose from 'mongoose';

const storeCodeSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    trim: true,
  },
  code: {
    type: String,
    required: true,
    trim: true,
  },
  expiresAt: {
    type: Date,
    required: true,
    expires: 0,
  },
  used: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model('StoreCode', storeCodeSchema);
