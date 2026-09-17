import { computeVimshottari } from './vimshottari';
import { birthInstantUtc } from './validate-birth';

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

export type KnownFact = { question?: string; answer?: string };

export type ChartUser = {
  moonSiderealLongitude?: number | null;
  birthDate?: string | null;
  birthTime?: string | null;
  birthTimezone?: string | null;
  birthLocation?: string | null;
  birthLatitude?: number | null;
  birthLongitude?: number | null;
  rashiName?: string | null;
  predictions?: PredictionLike[];
  currentDasha?: DashaLike | null;
  knownFacts?: KnownFact[];
};

export function safeField(value: unknown, max = 120): string {
  return typeof value === 'string' ? value.replace(/[\r\n]/g, ' ').slice(0, max) : '';
}

function safeCoord(value: unknown): string {
  return Number.isFinite(value) ? String(value) : 'unknown';
}

/** Caps how much chart data we push into the context window. */
const MAX_PREDICTIONS = 40;
const MAX_KNOWN_FACTS = 25;

export function buildBirthContext(user: ChartUser): string {
  if (!user?.birthDate) return '';

  let context = `\n\nUser's Birth Details (Vedic/Jyotish parameters):
- Date of Birth: ${safeField(user.birthDate, 20)}
- Time of Birth: ${safeField(user.birthTime, 10)}
- Location: ${safeField(user.birthLocation)} (Latitude: ${safeCoord(user.birthLatitude)}°, Longitude: ${safeCoord(user.birthLongitude)}°)
- Timezone Offset: ${safeField(user.birthTimezone, 10)}`;

  const predictions = (user.predictions ?? []).slice(0, MAX_PREDICTIONS);
  if (predictions.length > 0) {
    const lines = predictions
      .map(p => `- [${safeField(p.name, 80)}]: ${safeField(p.description, 400)}`)
      .join('\n');
    context += `\n\nCalculated Vedic horoscope indications for this person's chart. Reference them naturally and contextually — never list them out, and never name or describe the system that produced them:\n${lines}`;
  }

  const facts = (user.knownFacts ?? []).slice(-MAX_KNOWN_FACTS);
  if (facts.length > 0) {
    const lines = facts
      .filter(f => f.question && f.answer)
      .map(f => `- ${safeField(f.question, 200)} → ${safeField(f.answer, 300)}`)
      .join('\n');
    if (lines) {
      context += `\n\nWhat this person has already told you in past conversations. Treat it as known — do NOT ask about any of it again, and reference it naturally so they feel remembered:\n${lines}`;
    }
  }

  const dasha = buildDashaContext(user);
  if (dasha) {
    context += dasha;
  } else if (user.rashiName) {
    // No Moon longitude stored, so no periods — but the sign is still known.
    context += `\n- Chandra Rashi (Moon Sign): ${safeField(user.rashiName, 20)}`;
  }

  return context;
}

/** "August 2036" — the precision a reading should quote. */
function monthYear(d: Date): string {
  return d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' });
}

/**
 * The Dasha block, with real start and end dates computed from the stored Moon
 * longitude. Returns an empty string when we cannot place the Moon, so the
 * astrologer simply says nothing about timing rather than inventing it.
 */
function buildDashaContext(user: ChartUser): string {
  if (typeof user.moonSiderealLongitude !== 'number') return '';

  const birth = birthInstantUtc(user);
  if (!birth) return '';

  const v = computeVimshottari(user.moonSiderealLongitude, birth);
  if (!v) return '';

  const { mahadasha: maha, bhukti, antaram, nextMahadasha: next } = v;
  const placement = `\n- Moon in ${v.nakshatra} nakshatra (pada ${v.pada}), sign ${v.moonSign}.`;

  // A Moon this close to a nakshatra edge could belong to the neighbouring one
  // under a different ayanamsa — which would change the whole sequence, not
  // just the dates. So the dates are withheld entirely rather than shown with a
  // warning attached: a prompt that states dates and then forbids quoting them
  // is asking the model to resolve a contradiction, and it will sometimes
  // resolve it the wrong way.
  if (v.boundaryUncertain) {
    return `\n\nThis person's Vimshottari Dasha periods. Their birth Moon sits on a nakshatra boundary, so the timing cannot be pinned down:
- Mahadasha: ${maha.lord} (${maha.nature}). Signifies ${maha.theme}.
- Bhukti (sub-period): ${bhukti.lord} (${bhukti.nature}). Signifies ${bhukti.theme}.
- Antaram: ${antaram.lord}.${placement}
- You have deliberately NOT been given dates for this chart. Do not state or estimate any month or year. Speak only in periods and phases.`;
  }

  return `\n\nThis person's Vimshottari Dasha, calculated from their chart. These dates are real — quote them:
- Mahadasha: ${maha.lord} (${maha.nature}) — runs ${monthYear(maha.start)} to ${monthYear(maha.end)}. Signifies ${maha.theme}.
- Bhukti (sub-period): ${bhukti.lord} (${bhukti.nature}) — runs ${monthYear(bhukti.start)} to ${monthYear(bhukti.end)}. Signifies ${bhukti.theme}.
- Antaram: ${antaram.lord} — runs ${monthYear(antaram.start)} to ${monthYear(antaram.end)}.
- After this Mahadasha, ${next.lord} takes over from ${monthYear(next.start)}, bringing ${next.theme}.${placement}`;
}

/** The month + year string every prompt uses to anchor its predictions. */
export function currentMonthYear(): string {
  return new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
}
