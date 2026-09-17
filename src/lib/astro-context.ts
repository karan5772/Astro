/**
 * Builds the birth-chart context block that gets appended to every model
 * prompt (text chat, the limit reading, and the realtime voice session).
 *
 * Everything here is user-controlled data being interpolated into a system
 * prompt, so each field is stripped of line breaks and length-capped — a stray
 * newline is all it takes to fake a new instruction section.
 */

export type PredictionLike = { name?: string; description?: string };

export type DashaLike = {
  mahadasha?: string;
  bhukti?: string;
  antaram?: string;
  mahadashaNature?: string;
  bhuktiNature?: string;
  mahadashaDescription?: string;
  bhuktiDescription?: string;
};

export type ChartUser = {
  birthDate?: string | null;
  birthTime?: string | null;
  birthTimezone?: string | null;
  birthLocation?: string | null;
  birthLatitude?: number | null;
  birthLongitude?: number | null;
  rashiName?: string | null;
  predictions?: PredictionLike[];
  currentDasha?: DashaLike | null;
};

export function safeField(value: unknown, max = 120): string {
  return typeof value === 'string' ? value.replace(/[\r\n]/g, ' ').slice(0, max) : '';
}

function safeCoord(value: unknown): string {
  return Number.isFinite(value) ? String(value) : 'unknown';
}

/** Caps how much chart data we push into the context window. */
const MAX_PREDICTIONS = 40;

export function buildBirthContext(
  user: ChartUser,
  opts: { includeDashaDescriptions?: boolean; includeRashi?: boolean } = {}
): string {
  if (!user?.birthDate) return '';

  let context = `\n\nUser's Birth Details (Vedic/Jyotish parameters):
- Date of Birth: ${safeField(user.birthDate, 20)}
- Time of Birth: ${safeField(user.birthTime, 10)}
- Location: ${safeField(user.birthLocation)} (Latitude: ${safeCoord(user.birthLatitude)}°, Longitude: ${safeCoord(user.birthLongitude)}°)
- Timezone Offset: ${safeField(user.birthTimezone, 10)}`;

  if (opts.includeRashi && user.rashiName) {
    context += `\n- Chandra Rashi (Moon Sign): ${safeField(user.rashiName, 20)}`;
  }

  const predictions = (user.predictions ?? []).slice(0, MAX_PREDICTIONS);
  if (predictions.length > 0) {
    const lines = predictions
      .map(p => `- [${safeField(p.name, 80)}]: ${safeField(p.description, 400)}`)
      .join('\n');
    context += `\n\nHere are the calculated Vedic Horoscope Predictions for this user from the VedAstro engine. Reference these predictions naturally in your conversation to show your astrological accuracy. Do NOT list them all out in one reply; use them contextually to guide the user's reading:\n${lines}`;
  }

  const d = user.currentDasha;
  if (d?.mahadasha) {
    context += `\n\nCurrent Vimshottari Dasha (as of today):
- Mahadasha: ${safeField(d.mahadasha, 40)} (${safeField(d.mahadashaNature, 40)})${
      opts.includeDashaDescriptions ? ` — ${safeField(d.mahadashaDescription, 500)}` : ''
    }
- Bhukti (sub-period): ${safeField(d.bhukti, 40)} (${safeField(d.bhuktiNature, 40)})${
      opts.includeDashaDescriptions ? ` — ${safeField(d.bhuktiDescription, 500)}` : ''
    }
- Antaram: ${safeField(d.antaram, 40)}`;
  }

  return context;
}

/** The month + year string every prompt uses to anchor its predictions. */
export function currentMonthYear(): string {
  return new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
}
