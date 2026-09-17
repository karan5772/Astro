/**
 * Checks the Vimshottari module against known values and internal invariants.
 *
 * Run with:
 *   node --experimental-strip-types --import ./scripts/_register.mjs scripts/test-vimshottari.ts
 *
 * The nakshatra fixtures come from the upstream MoonConstellation calculator,
 * which is an independent implementation — if our nakshatra and pada agree with
 * it, the input to the whole Dasha sequence is sound.
 */
import {
  computeVimshottari,
  nakshatraOf,
  rashiOf,
  NAKSHATRA_SPAN,
  DASHA_YEAR_DAYS,
} from '../src/lib/vimshottari.ts';

let failures = 0;
function check(label: string, actual: unknown, expected: unknown) {
  const ok = String(actual) === String(expected);
  if (!ok) failures++;
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${label}${ok ? '' : `\n          expected ${expected}, got ${actual}`}`);
}
function assert(label: string, cond: boolean) {
  if (!cond) failures++;
  console.log(`  ${cond ? 'PASS' : 'FAIL'}  ${label}`);
}
const day = (d: Date) => d.toISOString().slice(0, 10);

console.log('\nNakshatra placement (fixtures from the upstream MoonConstellation calculator)');
// 1995-05-12 14:30 +05:30, Pilani — upstream returned "Hasta - 4"
check('172.9489° → Hasta', nakshatraOf(172.9488888888889).name, 'Hasta');
check('172.9489° → pada 4', nakshatraOf(172.9488888888889).pada, 4);
// 1988-01-20 06:15 +05:30, Delhi — upstream returned "Shravana - 3"
check('286.9336° → Shravana', nakshatraOf(286.9336).name, 'Shravana');
check('286.9336° → pada 3', nakshatraOf(286.9336).pada, 3);

console.log('\nBoundaries');
check('0° → Ashwini pada 1', `${nakshatraOf(0).name} ${nakshatraOf(0).pada}`, 'Ashwini 1');
check('359.99° → Revati pada 4', `${nakshatraOf(359.99).name} ${nakshatraOf(359.99).pada}`, 'Revati 4');
check('exactly 13°20\' → Bharani pada 1', `${nakshatraOf(NAKSHATRA_SPAN).name} ${nakshatraOf(NAKSHATRA_SPAN).pada}`, 'Bharani 1');
check('172.9489° → Virgo', rashiOf(172.9488888888889), 'Virgo');
check('0° → Aries', rashiOf(0), 'Aries');
check('359.9° → Pisces', rashiOf(359.9), 'Pisces');

console.log('\nWorked example: Moon 172.9489° (Hasta, Moon-ruled), born 1995-05-12 09:00 UTC');
const birth = new Date('1995-05-12T09:00:00Z');
const snap = computeVimshottari(172.9488888888889, birth, new Date('2026-09-18T00:00:00Z'))!;
assert('produces a snapshot', !!snap);

// Expectations are rederived here from the raw definition rather than copied
// from the module's output, so this is an independent arithmetic path.
const MOON_LON = 172.9488888888889;
const YEAR_MS = DASHA_YEAR_DAYS * 86400000;
const degreesInto = MOON_LON - 12 * NAKSHATRA_SPAN;               // 12 = Hasta's index
const unspent = (NAKSHATRA_SPAN - degreesInto) / NAKSHATRA_SPAN;  // fraction of Hasta left
const moonBalanceYears = unspent * 10;                            // Hasta is Moon-ruled, 10y
console.log(`         Moon balance at birth: ${(moonBalanceYears * DASHA_YEAR_DAYS).toFixed(1)} days`);

// Moon (balance) → Mars 7y → Rahu 18y → Jupiter 16y
const moonEnds = birth.getTime() + moonBalanceYears * YEAR_MS;
const jupiterStarts = moonEnds + (7 + 18) * YEAR_MS;
const jupiterEnds = jupiterStarts + 16 * YEAR_MS;

check('Mahadasha now', snap.mahadasha.lord, 'Jupiter');
check('Mahadasha starts where the sequence puts it', day(snap.mahadasha.start), day(new Date(jupiterStarts)));
check('Mahadasha ends 16 years later', day(snap.mahadasha.end), day(new Date(jupiterEnds)));
check('next Mahadasha', snap.nextMahadasha.lord, 'Saturn');
console.log(`         Bhukti ${snap.bhukti.lord} (${day(snap.bhukti.start)} → ${day(snap.bhukti.end)})`);
console.log(`         Antaram ${snap.antaram.lord} (${day(snap.antaram.start)} → ${day(snap.antaram.end)})`);

console.log('\nInvariants');
assert('Mahadasha contains today', snap.mahadasha.start <= new Date('2026-09-18') && snap.mahadasha.end > new Date('2026-09-18'));
assert('Bhukti sits inside its Mahadasha', snap.bhukti.start >= snap.mahadasha.start && snap.bhukti.end <= snap.mahadasha.end);
assert('Antaram sits inside its Bhukti', snap.antaram.start >= snap.bhukti.start && snap.antaram.end <= snap.bhukti.end);
assert('next Mahadasha begins when this one ends', snap.nextMahadasha.start.getTime() === snap.mahadasha.end.getTime());
assert('Jupiter Mahadasha spans 16 years',
  Math.abs((snap.mahadasha.end.getTime() - snap.mahadasha.start.getTime()) / (DASHA_YEAR_DAYS * 86400000) - 16) < 0.01);

console.log('\nEvery starting longitude yields a coherent snapshot');
let coherent = 0, boundary = 0;
for (let lon = 0; lon < 360; lon += 0.25) {
  const s = computeVimshottari(lon, birth, new Date('2026-09-18'));
  if (!s) continue;
  if (s.bhukti.start >= s.mahadasha.start && s.bhukti.end <= s.mahadasha.end &&
      s.antaram.start >= s.bhukti.start && s.antaram.end <= s.bhukti.end) coherent++;
  if (s.boundaryUncertain) boundary++;
}
check('all 1440 sampled longitudes coherent', coherent, 1440);
console.log(`         ${(100 * boundary / 1440).toFixed(0)}% flagged boundaryUncertain (ayanamsa ambiguity)`);

console.log('\nRejects bad input');
assert('negative longitude → null', computeVimshottari(-5, birth) === null);
assert('longitude 360 → null', computeVimshottari(360, birth) === null);
assert('NaN longitude → null', computeVimshottari(NaN, birth) === null);
assert('invalid birth date → null', computeVimshottari(100, new Date('nope')) === null);

console.log(failures === 0 ? '\nAll checks passed.\n' : `\n${failures} CHECK(S) FAILED\n`);
process.exit(failures === 0 ? 0 : 1);
