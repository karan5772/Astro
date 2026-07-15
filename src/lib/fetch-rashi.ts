/**
 * Fetches the sidereal Moon sign (Chandra Rashi) from VedAstro via POST.
 * Returns the English sign name (e.g. "Gemini") or null on failure.
 */
export async function fetchRashiForUser(user: {
  birthDate?: string | null;
  birthTime?: string | null;
  birthTimezone?: string | null;
  birthLocation?: string | null;
  birthLatitude?: number | null;
  birthLongitude?: number | null;
}): Promise<string | null> {
  if (!user.birthDate || !user.birthTime || !user.birthTimezone || !user.birthLocation) return null;
  try {
    const [y, m, d] = user.birthDate.split('-');
    const stdTime = `${user.birthTime} ${d}/${m}/${y} ${user.birthTimezone}`;

    const res = await fetch('https://api.vedastro.org/api/Calculate/MoonSignName', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        time: {
          StdTime: stdTime,
          Location: {
            Name: user.birthLocation,
            Latitude: user.birthLatitude ?? 0,
            Longitude: user.birthLongitude ?? 0,
          },
        },
      }),
    });
    if (!res.ok) return null;
    const json = await res.json();
    if (json?.Status !== 'Pass') return null;

    const name = json?.Payload?.MoonSignName ?? null;
    return typeof name === 'string' ? name.trim() : null;
  } catch {
    return null;
  }
}
