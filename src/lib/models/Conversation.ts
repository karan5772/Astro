import mongoose, { Schema, model, models } from 'mongoose';

const MessageSchema = new Schema(
  { role: { type: String, enum: ['user', 'assistant'], required: true }, content: { type: String, required: true } },
  { _id: false }
);

const ConversationSchema = new Schema(
  {
    clerkId: { type: String, required: true, index: true },
    title: { type: String, default: 'New Reading' },
    messages: [MessageSchema],
  },
  { timestamps: true }
);

export default models.Conversation || model('Conversation', ConversationSchema);
