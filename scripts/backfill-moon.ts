/**
 * One-time migration: store the Moon's sidereal longitude for every user who
 * has birth details but no `moonSiderealLongitude` yet, and clear the stale
 * `currentDasha` values.
 *
 * Those stored Dashas came from an upstream calculator that returned the same
 * Mahadasha and Bhukti regardless of birth chart, so they are not merely
 * outdated — they are wrong, and are better removed than left to be read.
 *
 * Calls go through the shared rate limiter, so this paces itself against the
 * upstream per-minute ceiling. Expect roughly one user every twelve seconds.
 *
 * Run with:
 *   node --experimental-strip-types --import ./scripts/_register.mjs scripts/backfill-moon.ts
 */

import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import User from '../src/lib/models/User.ts';
import { fetchMoonLongitude } from '../src/lib/fetch-moon.ts';
import { computeVimshottari, rashiOf, nakshatraOf } from '../src/lib/vimshottari.ts';
import { birthInstantUtc } from '../src/lib/validate-birth.ts';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

type Row = {
  _id: unknown;
  clerkId?: string;
  birthDate?: string;
  birthTime?: string;
  birthTimezone?: string;
  birthLocation?: string;
  birthLatitude?: number;
  birthLongitude?: number;
};

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is not set');
  await mongoose.connect(uri);

  const users = await User.find({
    birthDate: { $exists: true, $ne: null },
    $or: [{ moonSiderealLongitude: null }, { moonSiderealLongitude: { $exists: false } }],
  }).lean() as Row[];

  console.log(`${users.length} user(s) need a Moon longitude\n`);

  let done = 0, failed = 0, uncertain = 0;

  for (const user of users) {
    const label = user.clerkId ?? String(user._id);
    const moon = await fetchMoonLongitude(user).catch(() => null);

    if (moon === null) {
      console.log(`  ✗ ${label} — lookup failed`);
      failed++;
      continue;
    }

    const birth = birthInstantUtc(user);
    const snapshot = birth ? computeVimshottari(moon, birth) : null;
    const nak = nakshatraOf(moon);

    await User.updateOne(
      { _id: user._id },
      {
        $set: { moonSiderealLongitude: moon, rashiName: rashiOf(moon) },
        // The old values were not derived from this person's chart.
        $unset: { currentDasha: '' },
      },
    );

    if (snapshot?.boundaryUncertain) uncertain++;
    console.log(
      `  ✓ ${label} — Moon ${moon.toFixed(3)}° (${nak.name} pada ${nak.pada}, ${rashiOf(moon)})` +
      (snapshot
        ? ` → ${snapshot.mahadasha.lord}/${snapshot.bhukti.lord}` +
          ` to ${snapshot.mahadasha.end.toISOString().slice(0, 7)}` +
          (snapshot.boundaryUncertain ? '  [boundary — dates suppressed]' : '')
        : ''),
    );
    done++;
  }

  console.log(`\ndone: ${done}  failed: ${failed}  on a nakshatra boundary: ${uncertain}`);
  if (failed > 0) console.log('Re-run to retry the failures.');
  await mongoose.disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
