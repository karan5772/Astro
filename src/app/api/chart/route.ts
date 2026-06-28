import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse('Unauthorized', { status: 401 });

    const body = await req.json();
    const {
      date, // YYYY-MM-DD
      time, // HH:MM
      timezoneOffset, // e.g., "+05:30", "-08:00"
      locationName,
      latitude,
      longitude,
    } = body;

    // Validate required fields
    if (!date || !time || !timezoneOffset || !locationName || latitude === undefined || longitude === undefined) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Format Date from YYYY-MM-DD to DD/MM/YYYY
    const [year, month, day] = date.split('-');
    const formattedDate = `${day}/${month}/${year}`;

    // Format StdTime to match: "HH:MM DD/MM/YYYY +HH:MM"
    const stdTime = `${time} ${formattedDate} ${timezoneOffset}`;

    // Construct VedAstro payload
    const payload = {
      Time: {
        StdTime: stdTime,
        Location: {
          Name: locationName,
          Latitude: parseFloat(latitude),
          Longitude: parseFloat(longitude),
        },
      },
      ChartType: 'RasiD1',
      Ayanamsa: 'RAMAN',
    };

    console.log('Sending payload to VedAstro:', JSON.stringify(payload, null, 2));

    // Request chart from VedAstro API
    const response = await fetch('https://api.vedastro.org/api/Calculate/SouthIndianChart', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`VedAstro API responded with status ${response.status}: ${errorText}`);
    }

    const svgString = await response.text();

    if (!svgString || !svgString.includes('<svg')) {
      // Sometimes APIs might return empty responses or invalid formats
      throw new Error('Invalid SVG returned from chart calculator');
    }

    return NextResponse.json({ svg: svgString });
  } catch (error: any) {
    console.error('Birth Chart API error:', error);
    return NextResponse.json({ error: error.message || 'Failed to calculate birth chart' }, { status: 500 });
  }
}
