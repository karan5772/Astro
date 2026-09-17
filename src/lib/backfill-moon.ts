import User from './models/User';
import { fetchMoonLongitude } from './fetch-moon';
import { rashiOf } from './vimshottari';

/**
 * Fills in a user's Moon longitude if we don't have it, at most once per
 * cooldown. Several request paths want it, and the upstream service allows
 * only a handful of calls a minute across the whole account — without the
 * cooldown, one user whose lookup fails re-attempts on every request and
 * starves everyone else's onboarding.
 */
const RETRY_COOLDOWN_MS = 6 * 60 * 60 * 1000; // 6 hours

type BackfillableUser = {
  birthDate?: string | null;
  birthTime?: string | null;
  birthTimezone?: string | null;
  birthLocation?: string | null;
  birthLatitude?: number | null;
  birthLongitude?: number | null;
  moonSiderealLongitude?: number | null;
  dashaFetchedAt?: Date | null;
};

export async function backfillMoonLongitude(
  clerkId: string,
  user: BackfillableUser,
): Promise<number | null> {
  if (!user.birthDate) return null;
  if (typeof user.moonSiderealLongitude === 'number') return user.moonSiderealLongitude;

  const lastTry = user.dashaFetchedAt ? new Date(user.dashaFetchedAt).getTime() : 0;
  if (Date.now() - lastTry < RETRY_COOLDOWN_MS) return null;

  // Stamp the attempt before making it, so a failure still starts the cooldown.
  await User.updateOne({ clerkId }, { $set: { dashaFetchedAt: new Date() } }).catch(() => {});

  const moon = await fetchMoonLongitude(user);
  if (moon === null) return null;

  User.updateOne(
    { clerkId },
    { $set: { moonSiderealLongitude: moon, rashiName: rashiOf(moon) }, $unset: { currentDasha: '' } },
  ).catch(() => {});

  return moon;
}
