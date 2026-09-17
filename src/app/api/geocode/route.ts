import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { rateLimit, tooManyRequests } from '@/lib/rate-limit';
import { MAX_LOCATION_LENGTH } from '@/lib/validate-birth';

// Nominatim's usage policy caps clients at roughly one request per second and
// will block the origin IP for sustained abuse, so this proxy is throttled both
// per-user and globally rather than passing every keystroke straight through.
const PER_USER_LIMIT = 20;
const GLOBAL_LIMIT = 50;

type NominatimResult = { display_name?: string; lat?: string; lon?: string };

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse('Unauthorized', { status: 401 });

    const perUser = rateLimit(`geocode:${userId}`, PER_USER_LIMIT, 60_000);
    if (!perUser.ok) return tooManyRequests(perUser);

    const global = rateLimit('geocode:global', GLOBAL_LIMIT, 60_000);
    if (!global.ok) return tooManyRequests(global);

    const q = req.nextUrl.searchParams.get('q')?.trim() ?? '';
    if (q.length < 2) return NextResponse.json([]);
    if (q.length > MAX_LOCATION_LENGTH) {
      return NextResponse.json({ error: 'Search query is too long' }, { status: 400 });
    }

    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=5&addressdetails=1`,
      { headers: { 'User-Agent': 'AstraeusAstrologyApp/1.0 (contact@astraeus-app-dev.local)' } }
    );

    if (!response.ok) {
      console.error('[geocode] Nominatim error', response.status);
      return NextResponse.json({ error: 'Location search is unavailable' }, { status: 502 });
    }

    const data: NominatimResult[] = await response.json();

    const results = data
      .map(item => ({
        name: item.display_name ?? '',
        latitude: Number(item.lat),
        longitude: Number(item.lon),
      }))
      .filter(r => r.name && Number.isFinite(r.latitude) && Number.isFinite(r.longitude));

    return NextResponse.json(results);
  } catch (error) {
    console.error('[geocode]', error);
    return NextResponse.json({ error: 'Failed to search locations' }, { status: 500 });
  }
}
