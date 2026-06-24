import mongoose from 'mongoose';

const PaymentSchema = new mongoose.Schema({
  clerkId: { type: String, required: true, index: true },
  paymentId: { type: String, required: true, unique: true },
  orderId: { type: String, required: true },
  amount: { type: Number, required: true },
  durationInMinutes: { type: Number, required: true },
  date: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.models.Payment || mongoose.model('Payment', PaymentSchema);
