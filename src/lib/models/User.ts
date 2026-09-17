import mongoose from 'mongoose';

const { Schema, model, models } = mongoose;

const UserSchema = new Schema({
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
  // Server-side record of the voice call currently in flight. Billing is
  // settled against `voiceSessionStartedAt` wall-clock, not client heartbeats,
  // so a client that stops reporting still gets charged for the time it used.
  voiceSessionId: { type: String, default: null },
  voiceSessionStartedAt: { type: Date, default: null },
  voiceSessionBilledSeconds: { type: Number, default: 0 },
  // Uncharged rounds left for answering the astrologer's follow-up questions.
  freeAnswerRounds: { type: Number, default: null },
  // What the person has told us about themselves, gathered from those answers.
  // Carried across conversations so the astrologer stops asking the same things.
  knownFacts: [{
    question: { type: String },
    answer: { type: String },
    at: { type: Date, default: Date.now },
  }],
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
  currentDasha: {
    mahadasha: { type: String },
    bhukti: { type: String },
    antaram: { type: String },
    mahadashaNature: { type: String },
    bhuktiNature: { type: String },
    mahadashaDescription: { type: String },
    bhuktiDescription: { type: String },
  },
  // The Moon's sidereal longitude at birth, in degrees. Source of truth for the
  // Vimshottari Dasha sequence and the Moon sign, both computed locally.
  moonSiderealLongitude: { type: Number, default: null },
  rashiName: { type: String },
  // When we last *attempted* a Dasha lookup. Without this, a user whose lookup
  // keeps failing triggers a fresh upstream call on every single request.
  dashaFetchedAt: { type: Date, default: null },
  limitReadingClaimedAt: { type: Date },
}, { timestamps: true });

export default models.User || model('User', UserSchema);
