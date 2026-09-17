import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { parseBirthDetails, toVedAstroStdTime } from '@/lib/validate-birth';
import { rateLimit, tooManyRequests } from '@/lib/rate-limit';

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

    const response = await fetch('https://api.vedastro.org/api/Calculate/SouthIndianChart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
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
      }),
    });

    if (!response.ok) {
      console.error('[chart] VedAstro error', response.status, await response.text());
      return NextResponse.json({ error: 'Could not calculate the chart right now' }, { status: 502 });
    }

    const svgString = await response.text();

    if (!svgString || !svgString.includes('<svg')) {
      console.error('[chart] VedAstro returned a non-SVG payload');
      return NextResponse.json({ error: 'Could not calculate the chart right now' }, { status: 502 });
    }

    return NextResponse.json({ svg: svgString });
  } catch (error) {
    console.error('[chart]', error);
    return NextResponse.json({ error: 'Failed to calculate birth chart' }, { status: 500 });
  }
}
