/**
 * Vimshottari Dasha, computed locally from the Moon's sidereal longitude.
 *
 * This replaces the upstream DasaForNow call, which returned the same
 * Mahadasha and Bhukti for every birth chart we tested and so could not have
 * been deriving them from the person's Moon. Everything here is deterministic
 * arithmetic over one stored number, which also means no API call, no rate
 * limit, and real period start and end dates rather than lord names alone.
 *
 * The system: a 120-year cycle divided between nine lords in a fixed order.
 * The lord whose nakshatra the Moon occupied at birth runs first, but only for
 * the portion of its period still unspent — proportional to how far the Moon
 * had already travelled through that nakshatra.
 */

export const NAKSHATRA_SPAN = 360 / 27; // 13°20'
const PADA_SPAN = NAKSHATRA_SPAN / 4;

/**
 * A solar year. Some traditions reckon Dasha years as 360 days instead, which
 * shifts long-range dates by months; this is the convention modern Jyotish
 * software generally uses.
 */
export const DASHA_YEAR_DAYS = 365.2425;
const YEAR_MS = DASHA_YEAR_DAYS * 24 * 60 * 60 * 1000;

const TOTAL_YEARS = 120;

export type PlanetName =
  | 'Ketu' | 'Venus' | 'Sun' | 'Moon' | 'Mars' | 'Rahu' | 'Jupiter' | 'Saturn' | 'Mercury';

/** The cycle order, with each lord's share of the 120 years. */
const SEQUENCE: { lord: PlanetName; years: number }[] = [
  { lord: 'Ketu', years: 7 },
  { lord: 'Venus', years: 20 },
  { lord: 'Sun', years: 6 },
  { lord: 'Moon', years: 10 },
  { lord: 'Mars', years: 7 },
  { lord: 'Rahu', years: 18 },
  { lord: 'Jupiter', years: 16 },
  { lord: 'Saturn', years: 19 },
  { lord: 'Mercury', years: 17 },
];

export const NAKSHATRAS = [
  'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra', 'Punarvasu',
  'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni', 'Hasta',
  'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha', 'Mula', 'Purva Ashadha',
  'Uttara Ashadha', 'Shravana', 'Dhanishta', 'Shatabhisha', 'Purva Bhadrapada',
  'Uttara Bhadrapada', 'Revati',
] as const;

/** Sidereal signs, in order from 0°. */
export const RASHIS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
] as const;

export type Nature = 'Good' | 'Neutral' | 'Challenging';

/**
 * Classical benefic/malefic grouping, kept deliberately coarse. It exists to
 * colour the reading's tone, not to stand in for real chart analysis.
 */
const PLANET_NATURE: Record<PlanetName, Nature> = {
  Jupiter: 'Good', Venus: 'Good', Mercury: 'Good', Moon: 'Good',
  Sun: 'Neutral',
  Mars: 'Challenging', Saturn: 'Challenging', Rahu: 'Challenging', Ketu: 'Challenging',
};

const PLANET_THEME: Record<PlanetName, string> = {
  Ketu: 'detachment, endings, and turning inward; material things loosen their grip',
  Venus: 'relationships, comfort, beauty and material ease; a period that wants to be enjoyed',
  Sun: 'authority, recognition, and the question of who you are without your roles',
  Moon: 'emotional life, home, mother, and the tides of mood and intuition',
  Mars: 'drive, conflict, courage and impatience; energy that must be aimed somewhere',
  Rahu: 'ambition, foreign things, sudden rise and restlessness; hunger without a floor',
  Jupiter: 'growth, teachers, faith, children and expansion; doors tend to open',
  Saturn: 'discipline, delay, endurance and consequence; slow reward for real work',
  Mercury: 'intellect, commerce, communication and learning; the mind moves quickly',
};

export type DashaPeriod = {
  lord: PlanetName;
  nature: Nature;
  theme: string;
  start: Date;
  end: Date;
};

export type VimshottariSnapshot = {
  nakshatra: string;
  pada: number;
  moonSign: string;
  mahadasha: DashaPeriod;
  bhukti: DashaPeriod;
  antaram: DashaPeriod;
  /** The lord that takes over when the current Mahadasha ends. */
  nextMahadasha: { lord: PlanetName; theme: string; start: Date };
  /**
   * True when the Moon sat close enough to a nakshatra boundary that a
   * different ayanamsa would put it in the neighbouring one — which would
   * change the entire sequence. Callers should soften timing claims.
   */
  boundaryUncertain: boolean;
};

/**
 * How close to a nakshatra edge counts as uncertain. The longitude source uses
 * a fixed ayanamsa we cannot select, and common ayanamsas differ by up to
 * roughly 1.2°, so a Moon within that distance of an edge is not safely placed.
 */
const AYANAMSA_UNCERTAINTY_DEG = 1.2;

function periodOf(lord: PlanetName, start: number, lengthMs: number): DashaPeriod {
  return {
    lord,
    nature: PLANET_NATURE[lord],
    theme: PLANET_THEME[lord],
    start: new Date(start),
    end: new Date(start + lengthMs),
  };
}

function yearsFor(lord: PlanetName): number {
  return SEQUENCE.find(s => s.lord === lord)!.years;
}

function indexOf(lord: PlanetName): number {
  return SEQUENCE.findIndex(s => s.lord === lord);
}

/** Mahadashas from birth onwards, the first one truncated to its balance. */
function mahadashas(moonLongitude: number, birth: number): DashaPeriod[] {
  const nakIndex = Math.floor(moonLongitude / NAKSHATRA_SPAN);
  const degreesInto = moonLongitude - nakIndex * NAKSHATRA_SPAN;
  const unspentFraction = (NAKSHATRA_SPAN - degreesInto) / NAKSHATRA_SPAN;

  const firstLordIndex = nakIndex % 9;
  const out: DashaPeriod[] = [];
  let cursor = birth;

  // Ten covers 120+ years from birth, which outlasts any reading.
  for (let i = 0; i < 10; i++) {
    const { lord, years } = SEQUENCE[(firstLordIndex + i) % 9];
    const lengthMs = (i === 0 ? years * unspentFraction : years) * YEAR_MS;
    out.push(periodOf(lord, cursor, lengthMs));
    cursor += lengthMs;
  }
  return out;
}

/**
 * Sub-periods of a period, in cycle order starting from its own lord.
 *
 * For the first Mahadasha — which is truncated — the sub-periods still belong
 * to the full nominal period, so they are laid out from where that period
 * *would* have begun. The ones already elapsed at birth simply fall behind us.
 */
function subPeriods(parent: DashaPeriod, parentYears: number): DashaPeriod[] {
  const nominalStart = parent.end.getTime() - parentYears * YEAR_MS;
  const startIndex = indexOf(parent.lord);
  const out: DashaPeriod[] = [];
  let cursor = nominalStart;

  for (let i = 0; i < 9; i++) {
    const { lord, years } = SEQUENCE[(startIndex + i) % 9];
    const lengthMs = (parentYears * years / TOTAL_YEARS) * YEAR_MS;
    out.push(periodOf(lord, cursor, lengthMs));
    cursor += lengthMs;
  }
  return out;
}

function covering(periods: DashaPeriod[], at: number): DashaPeriod | null {
  return periods.find(p => at >= p.start.getTime() && at < p.end.getTime()) ?? null;
}

export function nakshatraOf(moonLongitude: number): { name: string; pada: number; index: number } {
  const index = Math.floor(moonLongitude / NAKSHATRA_SPAN);
  const degreesInto = moonLongitude - index * NAKSHATRA_SPAN;
  return {
    name: NAKSHATRAS[index] ?? '',
    pada: Math.floor(degreesInto / PADA_SPAN) + 1,
    index,
  };
}

export function rashiOf(moonLongitude: number): string {
  return RASHIS[Math.floor(moonLongitude / 30)] ?? '';
}

/** True when a neighbouring ayanamsa would move the Moon to another nakshatra. */
export function nearNakshatraBoundary(moonLongitude: number): boolean {
  const degreesInto = moonLongitude % NAKSHATRA_SPAN;
  return (
    degreesInto < AYANAMSA_UNCERTAINTY_DEG ||
    degreesInto > NAKSHATRA_SPAN - AYANAMSA_UNCERTAINTY_DEG
  );
}

/**
 * The periods running at `at` (default: now), with real dates.
 * Returns null when the inputs are unusable.
 */
export function computeVimshottari(
  moonLongitude: number,
  birthUtc: Date,
  at: Date = new Date(),
): VimshottariSnapshot | null {
  if (!Number.isFinite(moonLongitude) || moonLongitude < 0 || moonLongitude >= 360) return null;
  const birth = birthUtc.getTime();
  if (!Number.isFinite(birth)) return null;

  const when = at.getTime();
  const majors = mahadashas(moonLongitude, birth);

  const mahadasha = covering(majors, when);
  if (!mahadasha) return null;

  const bhukti = covering(subPeriods(mahadasha, yearsFor(mahadasha.lord)), when);
  if (!bhukti) return null;

  // An Antaram divides its Bhukti the same way the Bhukti divides the Mahadasha.
  const bhuktiYears = (yearsFor(mahadasha.lord) * yearsFor(bhukti.lord)) / TOTAL_YEARS;
  const antaram = covering(subPeriods(bhukti, bhuktiYears), when);
  if (!antaram) return null;

  const next = majors[majors.indexOf(mahadasha) + 1];
  const { name, pada } = nakshatraOf(moonLongitude);

  return {
    nakshatra: name,
    pada,
    moonSign: rashiOf(moonLongitude),
    mahadasha,
    bhukti,
    antaram,
    nextMahadasha: {
      lord: next.lord,
      theme: PLANET_THEME[next.lord],
      start: next.start,
    },
    boundaryUncertain: nearNakshatraBoundary(moonLongitude),
  };
}

/**
 * A compact, serialisable view of the current periods for API responses and UI.
 * Shaped like the Dasha object the client already reads, plus real dates.
 */
export function dashaSummaryFor(user: {
  moonSiderealLongitude?: number | null;
  birthDate?: string | null;
  birthTime?: string | null;
  birthTimezone?: string | null;
}, birthUtc: Date | null): {
  mahadasha: string;
  bhukti: string;
  antaram: string;
  mahadashaNature: Nature;
  bhuktiNature: Nature;
  mahadashaTheme: string;
  bhuktiTheme: string;
  mahadashaStarts: string;
  mahadashaEnds: string;
  bhuktiStarts: string;
  bhuktiEnds: string;
  nextMahadasha: string;
  nextMahadashaStarts: string;
  datesUncertain: boolean;
} | null {
  if (typeof user.moonSiderealLongitude !== 'number' || !birthUtc) return null;
  const v = computeVimshottari(user.moonSiderealLongitude, birthUtc);
  if (!v) return null;
  return {
    mahadasha: v.mahadasha.lord,
    bhukti: v.bhukti.lord,
    antaram: v.antaram.lord,
    mahadashaNature: v.mahadasha.nature,
    bhuktiNature: v.bhukti.nature,
    mahadashaTheme: v.mahadasha.theme,
    bhuktiTheme: v.bhukti.theme,
    mahadashaStarts: v.mahadasha.start.toISOString(),
    mahadashaEnds: v.mahadasha.end.toISOString(),
    bhuktiStarts: v.bhukti.start.toISOString(),
    bhuktiEnds: v.bhukti.end.toISOString(),
    nextMahadasha: v.nextMahadasha.lord,
    nextMahadashaStarts: v.nextMahadasha.start.toISOString(),
    datesUncertain: v.boundaryUncertain,
  };
}
