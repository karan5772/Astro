/**
 * One-time migration: populate currentDasha for all existing users who have
 * birth details but no Dasha data yet.
 *
 * Run with:
 *   npx tsx scripts/backfill-dasha.ts
 */

import mongoose from 'mongoose';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI!;
if (!MONGODB_URI) throw new Error('MONGODB_URI not set in .env.local');

const UserSchema = new mongoose.Schema({
  clerkId: String,
  birthDate: String,
  birthTime: String,
  birthTimezone: String,
  birthLocation: String,
  currentDasha: mongoose.Schema.Types.Mixed,
}, { strict: false });

const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function fetchDasha(user: {
  birthDate: string;
  birthTime: string;
  birthTimezone: string;
  birthLocation: string;
}): Promise<Record<string, string> | null> {
  try {
    const [y, m, d] = user.birthDate.split('-');
    const stdTime = `${user.birthTime} ${d}/${m}/${y} ${user.birthTimezone}`;
    const url = `https://api.vedastro.org/api/Calculate/DasaForNow/Location/${encodeURIComponent(user.birthLocation)}/Time/${encodeURIComponent(stdTime)}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const json = await res.json();
    const payload = json?.Payload?.DasaForNow;
    if (!payload) return null;
    const mahaKey = Object.keys(payload)[0];
    const maha = payload[mahaKey];
    const bhuktiKey = maha?.SubDasas ? Object.keys(maha.SubDasas)[0] : '';
    const bhukti = bhuktiKey ? maha.SubDasas[bhuktiKey] : null;
    const antaramKey = bhukti?.SubDasas ? Object.keys(bhukti.SubDasas)[0] : '';
    return {
      mahadasha: mahaKey || '',
      bhukti: bhuktiKey || '',
      antaram: antaramKey || '',
      mahadashaNature: maha?.Nature || '',
      bhuktiNature: bhukti?.Nature || '',
      mahadashaDescription: maha?.Description || '',
      bhuktiDescription: bhukti?.Description || '',
    };
  } catch {
    return null;
  }
}

async function run() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  const users = await User.find({
    birthDate: { $exists: true, $ne: null },
    'currentDasha.mahadasha': { $exists: false },
  }).lean();

  console.log(`Found ${users.length} users needing Dasha backfill`);

  let success = 0, failed = 0;

  for (const user of users as any[]) {
    if (!user.birthDate || !user.birthTime || !user.birthTimezone || !user.birthLocation) {
      failed++;
      continue;
    }
    const dasha = await fetchDasha(user);
    if (dasha) {
      await User.updateOne({ _id: user._id }, { $set: { currentDasha: dasha } });
      console.log(`✓ ${user.clerkId} → ${dasha.mahadasha}-${dasha.bhukti}`);
      success++;
    } else {
      console.log(`✗ ${user.clerkId} — VedAstro fetch failed`);
      failed++;
    }
    // Small delay to avoid hammering VedAstro
    await new Promise(r => setTimeout(r, 200));
  }

  console.log(`\nDone: ${success} updated, ${failed} skipped/failed`);
  await mongoose.disconnect();
}

run().catch(console.error);
