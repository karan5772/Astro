import { calcPost } from './vedastro';
import { toVedAstroStdTime } from './validate-birth';

/**
 * The Moon's sidereal longitude at birth, in degrees.
 *
 * This single number drives the entire Vimshottari sequence and the Moon sign,
 * so it is fetched once at onboarding and stored. Everything downstream is
 * local arithmetic — no repeat calls, and no dependence on an upstream Dasha
 * calculator that proved not to vary with the birth chart.
 *
 * Note: the calculator ignores an ayanamsa argument and returns its own, which
 * is why `nearNakshatraBoundary` exists to flag placements that a different
 * ayanamsa would move.
 */
export async function fetchMoonLongitude(user: {
  birthDate?: string | null;
  birthTime?: string | null;
  birthTimezone?: string | null;
  birthLocation?: string | null;
  birthLatitude?: number | null;
  birthLongitude?: number | null;
}): Promise<number | null> {
  if (!user.birthDate || !user.birthTime || !user.birthTimezone || !user.birthLocation) return null;

  try {
    const payload = await calcPost('PlanetNirayanaLongitude', {
      time: {
        StdTime: toVedAstroStdTime({
          birthDate: user.birthDate,
          birthTime: user.birthTime,
          birthTimezone: user.birthTimezone,
        }),
        Location: {
          Name: user.birthLocation,
          Latitude: user.birthLatitude ?? 0,
          Longitude: user.birthLongitude ?? 0,
        },
      },
      planetName: 'Moon',
    }) as { PlanetNirayanaLongitude?: { TotalDegrees?: string } } | null;

    const degrees = Number(payload?.PlanetNirayanaLongitude?.TotalDegrees);
    if (!Number.isFinite(degrees) || degrees < 0 || degrees >= 360) return null;
    return degrees;
  } catch {
    return null;
  }
}
