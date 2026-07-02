/**
 * Fetches the current Vimshottari Dasha period for a user from VedAstro.
 * Returns null silently on any failure — Dasha is enrichment, not critical.
 */
export async function fetchDasaForUser(user: {
  birthDate?: string | null;
  birthTime?: string | null;
  birthTimezone?: string | null;
  birthLocation?: string | null;
}): Promise<Record<string, string> | null> {
  if (!user.birthDate || !user.birthTime || !user.birthTimezone || !user.birthLocation) {
    return null;
  }

  try {
    const [y, m, d] = user.birthDate.split('-');
    const stdTime = `${user.birthTime} ${d}/${m}/${y} ${user.birthTimezone}`;
    const locationEncoded = encodeURIComponent(user.birthLocation);
    const timeEncoded = encodeURIComponent(stdTime);

    const res = await fetch(
      `https://api.vedastro.org/api/Calculate/DasaForNow/Location/${locationEncoded}/Time/${timeEncoded}`
    );
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
