import mongoose, { Schema, model, models } from 'mongoose';

const EventSchema = new Schema(
  {
    clerkId:  { type: String, required: true },
    type:     { type: String, required: true },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

// Indexes that power the analytics page queries
EventSchema.index({ clerkId: 1, createdAt: -1 });
EventSchema.index({ type: 1, createdAt: -1 });
EventSchema.index({ type: 1, clerkId: 1 });

export default models.Event || model('Event', EventSchema);
