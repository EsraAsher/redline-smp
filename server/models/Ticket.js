import mongoose from 'mongoose';

const ticketSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ['open', 'resolved', 'declined'],
      default: 'open',
    },
  },
  { timestamps: true }
);

export default mongoose.model('Ticket', ticketSchema);
