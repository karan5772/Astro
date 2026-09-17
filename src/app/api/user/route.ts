import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import connectToDatabase from '@/lib/mongodb';
import User from '@/lib/models/User';
import Payment from '@/lib/models/Payment';
import { logEvent } from '@/lib/log-event';
import { backfillMoonLongitude } from '@/lib/backfill-moon';
import { fetchMoonLongitude } from '@/lib/fetch-moon';
import { rashiOf, dashaSummaryFor } from '@/lib/vimshottari';
import { birthInstantUtc } from '@/lib/validate-birth';
import { parseBirthDetails, toVedAstroStdTime } from '@/lib/validate-birth';
import { rateLimit, tooManyRequests } from '@/lib/rate-limit';
import { settleVoiceSession, derivePro } from '@/lib/voice-session';
import { calcPost, RateLimitedError } from '@/lib/vedastro';

// Room for the upstream calculation queue to drain before responding.
export const maxDuration = 30;

type VedAstroPrediction = { Name?: string; Description?: string; Tags?: string[] };

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    await connectToDatabase();

    let dbUser = await User.findOne({ clerkId: userId });

    if (!dbUser) {
      const user = await currentUser();
      if (!user) return new NextResponse('User not found', { status: 404 });

      const email = user.emailAddresses[0]?.emailAddress;
      if (!email) return new NextResponse('An email address is required', { status: 400 });

      dbUser = await User.create({
        clerkId: userId,
        email,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        isPro: false,
      });
    }

    // If a voice call was left open (tab closed, network dropped), bill it now
    // rather than letting the unreported time be free.
    if (dbUser.voiceSessionStartedAt) {
      await settleVoiceSession(userId);
      dbUser = await User.findOne({ clerkId: userId });
      if (!dbUser) return new NextResponse('User not found', { status: 404 });
    }

    // Pro means "has paid balance left", in voice or messages.
    const shouldBePro = derivePro(dbUser);
    if (dbUser.isPro !== shouldBePro) {
      User.updateOne({ clerkId: userId }, { $set: { isPro: shouldBePro } }).catch(console.error);
      dbUser.isPro = shouldBePro;
    }

    // Backfill the Moon longitude for accounts onboarded before it was stored.
    // Rate-limited by the same cooldown, since the upstream ceiling is shared.
    if (dbUser.birthDate && typeof dbUser.moonSiderealLongitude !== 'number') {
      const moon = await backfillMoonLongitude(userId, dbUser);
      if (moon !== null) {
        dbUser.moonSiderealLongitude = moon;
        dbUser.rashiName = rashiOf(moon);
      }
    }

    const payments = await Payment.find({ clerkId: userId }).sort({ date: -1 }).limit(50).lean();

    return NextResponse.json({
      clerkId: dbUser.clerkId,
      email: dbUser.email,
      isPro: dbUser.isPro,
      messageCount: dbUser.messageCount || 0,
      messageBalance: dbUser.messageBalance || 0,
      voiceBalanceInSeconds: dbUser.voiceBalanceInSeconds || 0,
      birthDate: dbUser.birthDate || null,
      birthTime: dbUser.birthTime || null,
      birthTimezone: dbUser.birthTimezone || null,
      birthLocation: dbUser.birthLocation || null,
      birthLatitude: dbUser.birthLatitude ?? null,
      birthLongitude: dbUser.birthLongitude ?? null,
      hasBirthDetails: !!dbUser.birthDate,
      predictionsCount: (dbUser.predictions || []).length,
      currentDasha: dashaSummaryFor(dbUser, birthInstantUtc(dbUser)),
      rashiName: dbUser.rashiName || null,
      payments: payments || [],
    });
  } catch (error) {
    console.error('[user:GET]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Each save fans out to three VedAstro calls, so it is throttled.
    const limit = rateLimit(`onboard:${userId}`, 5, 60_000);
    if (!limit.ok) return tooManyRequests(limit);

    const body = await req.json().catch(() => null);
    const parsed = parseBirthDetails(body);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }
    const details = parsed.value;

    await connectToDatabase();

    // The account must already exist (GET /api/user creates it on first load).
    // An upsert here could mint a User with no email, which the schema requires.
    const existing = await User.findOne({ clerkId: userId }).select('_id');
    if (!existing) {
      return NextResponse.json({ error: 'Account not initialised' }, { status: 404 });
    }

    const payload = await calcPost('HoroscopePredictions', {
      BirthTime: {
        StdTime: toVedAstroStdTime(details),
        Location: {
          Name: details.birthLocation,
          Latitude: details.birthLatitude,
          Longitude: details.birthLongitude,
        },
      },
      FilterTags: [],
      SortByWeight: false,
    });

    const rawPredictions: VedAstroPrediction[] = Array.isArray(payload) ? payload : [];

    const mappedPredictions = rawPredictions.map(item => ({
      name: item.Name || '',
      description: item.Description ? item.Description.trim() : '',
      tags: Array.isArray(item.Tags) ? item.Tags : [],
    }));

    // One call gives the Moon's sidereal longitude, from which the Dasha
    // sequence and the Moon sign are both derived locally, forever.
    const moonLongitude = await fetchMoonLongitude(details).catch(() => null);
    const fetchedRashi = moonLongitude !== null ? rashiOf(moonLongitude) : null;

    const updatedUser = await User.findOneAndUpdate(
      { clerkId: userId },
      {
        $set: {
          ...details,
          predictions: mappedPredictions,
          // Start the retry cooldown even if the lookup came back empty.
          dashaFetchedAt: new Date(),
          ...(moonLongitude !== null ? { moonSiderealLongitude: moonLongitude } : {}),
          ...(fetchedRashi ? { rashiName: fetchedRashi } : {}),
        },
      },
      { returnDocument: 'after' }
    );

    if (!updatedUser) {
      return NextResponse.json({ error: 'Account not initialised' }, { status: 404 });
    }

    logEvent(userId, 'onboarding_completed', {
      birthLocation: details.birthLocation,
      predictionsCount: mappedPredictions.length,
    });

    return NextResponse.json({
      clerkId: updatedUser.clerkId,
      email: updatedUser.email,
      isPro: updatedUser.isPro,
      birthDate: updatedUser.birthDate,
      birthTime: updatedUser.birthTime,
      birthLocation: updatedUser.birthLocation,
      hasBirthDetails: true,
      rashiName: updatedUser.rashiName || null,
    });
  } catch (error) {
    if (error instanceof RateLimitedError) {
      console.error('[user:POST] upstream rate limit reached — set VEDASTRO_API_KEY');
      return NextResponse.json(
        { error: 'Our chart service is busy right now. Please try again in a minute.' },
        { status: 503 },
      );
    }
    console.error('[user:POST]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
