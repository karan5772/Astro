/** Shape of a payment row as returned by GET /api/user. */
export type PaymentRecord = {
  _id?: string;
  plan?: string | null;
  /** Rupees. */
  amount?: number;
  currency?: string;
  messagesGranted?: number;
  durationInMinutes?: number;
  date?: string | null;
  createdAt?: string | null;
};

/**
 * The Dasha periods currently running, as GET /api/user returns them.
 * Dates are ISO strings and are omitted from display when `datesUncertain`.
 */
export type Dasha = {
  mahadasha: string;
  bhukti: string;
  antaram: string;
  mahadashaNature: string;
  bhuktiNature: string;
  mahadashaTheme: string;
  bhuktiTheme: string;
  mahadashaStarts: string;
  mahadashaEnds: string;
  bhuktiStarts: string;
  bhuktiEnds: string;
  nextMahadasha: string;
  nextMahadashaStarts: string;
  datesUncertain: boolean;
};

/** The response body of GET /api/user, shared by every page that reads it. */
export type AppUser = {
  clerkId: string;
  email: string;
  isPro: boolean;
  messageCount: number;
  messageBalance: number;
  voiceBalanceInSeconds: number;
  birthDate: string | null;
  birthTime: string | null;
  birthTimezone: string | null;
  birthLocation: string | null;
  birthLatitude: number | null;
  birthLongitude: number | null;
  hasBirthDetails: boolean;
  predictionsCount: number;
  currentDasha: Dasha | null;
  rashiName: string | null;
  payments: PaymentRecord[];
};

/** The subset POST /api/user echoes back after onboarding. */
export type OnboardingResult = {
  clerkId: string;
  email: string;
  isPro: boolean;
  birthDate: string;
  birthTime: string;
  birthLocation: string;
  hasBirthDetails: true;
  rashiName: string | null;
};
