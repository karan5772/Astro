import mongoose from 'mongoose';

const { Schema, model, models } = mongoose;

const PaymentSchema = new Schema(
  {
    clerkId: { type: String, required: true, index: true },
    // Idempotency key: the unique index is what makes credit-granting safe to
    // run from both the checkout callback and the webhook.
    paymentId: { type: String, required: true, unique: true },
    orderId: { type: String, required: true, index: true },
    plan: { type: String },
    // `amount` is the plan's USD list price (this is what it has always held).
    amount: { type: Number, required: true },
    amountInr: { type: Number },
    exchangeRate: { type: Number },
    currency: { type: String, default: 'INR' },
    messagesGranted: { type: Number, default: 0 },
    durationInMinutes: { type: Number, required: true },
    // Which path recorded it first — useful when reconciling with Razorpay.
    source: { type: String, enum: ['checkout', 'webhook'], default: 'checkout' },
    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default models.Payment || model('Payment', PaymentSchema);
