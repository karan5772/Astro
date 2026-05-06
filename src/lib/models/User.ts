import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  clerkId: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  firstName: { type: String },
  lastName: { type: String },
  isPro: { type: Boolean, default: false },
  payments: [{
    paymentId: String,
    orderId: String,
    amount: Number,
    date: { type: Date, default: Date.now }
  }],
}, { timestamps: true });

export default mongoose.models.User || mongoose.model('User', UserSchema);
