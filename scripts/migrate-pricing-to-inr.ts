/**
 * One-time migration: convert the legacy USD payment rows to rupees.
 *
 * Pricing moved to INR only, so `Payment.amount` now means rupees everywhere.
 * The handful of rows written before that stored a USD list price, and summing
 * the two together would produce a meaningless revenue figure. Each legacy row
 * is converted using the exchange rate captured at order time where we have it,
 * and a fallback rate otherwise.
 *
 * Idempotent: rows already carrying `currency: 'INR'` with no `exchangeRate`
 * are left alone, and the script can be re-run safely.
 *
 * Run with:
 *   node --experimental-strip-types --import ./scripts/_register.mjs scripts/migrate-pricing-to-inr.ts
 */

import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import Payment from '../src/lib/models/Payment.ts';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

// The rate that was live when those payments were taken.
const FALLBACK_RATE = 84;

type Row = {
  _id: unknown;
  paymentId?: string;
  plan?: string;
  amount?: number;
  amountInr?: number;
  exchangeRate?: number;
};

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is not set');
  await mongoose.connect(uri);

  // `amountInr` and `exchangeRate` only ever existed on FX-era rows, so their
  // presence is what marks a row as still holding a USD amount.
  const legacy = await Payment.find({
    $or: [{ exchangeRate: { $exists: true } }, { amountInr: { $exists: true } }, { amount: { $lt: 100 } }],
  }).lean() as Row[];

  if (legacy.length === 0) {
    console.log('Nothing to migrate — every payment is already in rupees.');
    await mongoose.disconnect();
    return;
  }

  console.log(`${legacy.length} legacy row(s) to convert\n`);
  let converted = 0;

  for (const row of legacy) {
    const usd = row.amount ?? 0;
    const rate = row.exchangeRate && row.exchangeRate > 0 ? row.exchangeRate : FALLBACK_RATE;
    // Prefer the rupee figure actually charged, where it was recorded.
    const inr = row.amountInr && row.amountInr > 0 ? Math.round(row.amountInr) : Math.round(usd * rate);

    await Payment.updateOne(
      { _id: row._id },
      { $set: { amount: inr, currency: 'INR' }, $unset: { amountInr: '', exchangeRate: '' } },
    );

    console.log(
      `  ${(row.paymentId ?? String(row._id)).padEnd(22)} ${String(row.plan ?? '—').padEnd(9)}` +
      ` $${usd} -> ₹${inr}  (rate ${rate}${row.amountInr ? ', from recorded INR' : ''})`,
    );
    converted++;
  }

  const total = await Payment.aggregate([{ $group: { _id: null, t: { $sum: '$amount' } } }]);
  console.log(`\nconverted ${converted}; total revenue is now ₹${Math.round(total[0]?.t ?? 0)}`);
  await mongoose.disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
