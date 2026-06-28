import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  clerkId: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  firstName: { type: String },
  lastName: { type: String },
  isPro: { type: Boolean, default: false },
  messageCount: { type: Number, default: 0 },
  totalChatMessages: { type: Number, default: 0 },
  messageBalance: { type: Number, default: 0 },
  voiceBalanceInSeconds: { type: Number, default: 0 },
  totalVoiceSecondsConsumed: { type: Number, default: 0 },
  voiceSessionCount: { type: Number, default: 0 },
  lastActiveAt: { type: Date },
  birthDate: { type: String },
  birthTime: { type: String },
  birthTimezone: { type: String },
  birthLocation: { type: String },
  birthLatitude: { type: Number },
  birthLongitude: { type: Number },
  predictions: [{
    name: { type: String },
    description: { type: String },
    tags: [{ type: String }]
  }],
}, { timestamps: true });

export default mongoose.models.User || mongoose.model('User', UserSchema);
