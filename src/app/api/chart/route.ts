import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { parseBirthDetails, toVedAstroStdTime } from '@/lib/validate-birth';
import { rateLimit, tooManyRequests } from '@/lib/rate-limit';
import { calcPostRaw, RateLimitedError } from '@/lib/vedastro';

// Room for the upstream calculation queue to drain before responding.
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse('Unauthorized', { status: 401 });

    // Every call is a request against a free third-party service on our behalf.
    const limit = rateLimit(`chart:${userId}`, 10, 60_000);
    if (!limit.ok) return tooManyRequests(limit);

    const body = await req.json().catch(() => null);

    // The page uses its own field names; normalise before validating.
    const parsed = parseBirthDetails({
      birthDate: body?.date,
      birthTime: body?.time,
      birthTimezone: body?.timezoneOffset,
      birthLocation: body?.locationName,
      birthLatitude: body?.latitude,
      birthLongitude: body?.longitude,
    });

    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }
    const details = parsed.value;

    const svgString = await calcPostRaw('SouthIndianChart', {
      Time: {
        StdTime: toVedAstroStdTime(details),
        Location: {
          Name: details.birthLocation,
          Latitude: details.birthLatitude,
          Longitude: details.birthLongitude,
        },
      },
      ChartType: 'RasiD1',
      Ayanamsa: 'RAMAN',
    });

    if (!svgString.includes('<svg')) {
      console.error('[chart] calculation service returned a non-SVG payload');
      return NextResponse.json({ error: 'Could not calculate the chart right now' }, { status: 502 });
    }

    return NextResponse.json({ svg: svgString });
  } catch (error) {
    if (error instanceof RateLimitedError) {
      console.error('[chart] upstream rate limit reached — set VEDASTRO_API_KEY');
      return NextResponse.json(
        { error: 'The chart service is busy right now. Please try again in a minute.' },
        { status: 503 },
      );
    }
    console.error('[chart]', error);
    return NextResponse.json({ error: 'Failed to calculate birth chart' }, { status: 500 });
  }
}
