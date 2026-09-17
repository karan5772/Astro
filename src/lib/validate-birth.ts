/**
 * Validation for the birth details every astrology calculation depends on.
 * These values are forwarded to VedAstro and interpolated into model prompts,
 * so they are validated at the edge rather than trusted from the client.
 */

export type BirthDetails = {
  birthDate: string;      // YYYY-MM-DD
  birthTime: string;      // HH:MM
  birthTimezone: string;  // +HH:MM / -HH:MM
  birthLocation: string;
  birthLatitude: number;
  birthLongitude: number;
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const TZ_RE = /^[+-](0\d|1[0-4]):[0-5]\d$/;

export const MAX_LOCATION_LENGTH = 200;

function isRealDate(value: string): boolean {
  const [y, m, d] = value.split('-').map(Number);
  if (y < 1900 || y > new Date().getFullYear()) return false;
  const dt = new Date(Date.UTC(y, m - 1, d));
  return (
    dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d
  );
}

/**
 * Returns the normalised details, or an error string naming the bad field.
 */
export function parseBirthDetails(input: unknown):
  | { ok: true; value: BirthDetails }
  | { ok: false; error: string } {
  if (!input || typeof input !== 'object') return { ok: false, error: 'Invalid request body' };
  const body = input as Record<string, unknown>;

  const birthDate = typeof body.birthDate === 'string' ? body.birthDate.trim() : '';
  const birthTime = typeof body.birthTime === 'string' ? body.birthTime.trim() : '';
  const birthTimezone = typeof body.birthTimezone === 'string' ? body.birthTimezone.trim() : '';
  const birthLocation = typeof body.birthLocation === 'string' ? body.birthLocation.trim() : '';

  if (!DATE_RE.test(birthDate) || !isRealDate(birthDate)) {
    return { ok: false, error: 'birthDate must be a real date in YYYY-MM-DD format' };
  }
  if (!TIME_RE.test(birthTime)) {
    return { ok: false, error: 'birthTime must be in 24-hour HH:MM format' };
  }
  if (!TZ_RE.test(birthTimezone)) {
    return { ok: false, error: 'birthTimezone must be a UTC offset such as +05:30' };
  }
  if (birthLocation.length < 2 || birthLocation.length > MAX_LOCATION_LENGTH) {
    return { ok: false, error: `birthLocation must be 2-${MAX_LOCATION_LENGTH} characters` };
  }

  const birthLatitude = Number(body.birthLatitude);
  const birthLongitude = Number(body.birthLongitude);
  if (!Number.isFinite(birthLatitude) || birthLatitude < -90 || birthLatitude > 90) {
    return { ok: false, error: 'birthLatitude must be a number between -90 and 90' };
  }
  if (!Number.isFinite(birthLongitude) || birthLongitude < -180 || birthLongitude > 180) {
    return { ok: false, error: 'birthLongitude must be a number between -180 and 180' };
  }

  return {
    ok: true,
    value: { birthDate, birthTime, birthTimezone, birthLocation, birthLatitude, birthLongitude },
  };
}

/** VedAstro wants "HH:MM DD/MM/YYYY +HH:MM". */
export function toVedAstroStdTime(d: Pick<BirthDetails, 'birthDate' | 'birthTime' | 'birthTimezone'>): string {
  const [year, month, day] = d.birthDate.split('-');
  return `${d.birthTime} ${day}/${month}/${year} ${d.birthTimezone}`;
}
