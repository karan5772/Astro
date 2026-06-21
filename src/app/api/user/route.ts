import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import connectToDatabase from '@/lib/mongodb';
import User from '@/lib/models/User';

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
      
      const email = user.emailAddresses[0]?.emailAddress || '';
      
      dbUser = await User.create({
        clerkId: userId,
        email: email,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        isPro: false,
      });
    }

    // Check if pro membership expired
    if (dbUser.isPro && dbUser.proUntil && new Date(dbUser.proUntil) < new Date()) {
      dbUser.isPro = false;
      await dbUser.save();
    }

    return NextResponse.json({
      clerkId: dbUser.clerkId,
      email: dbUser.email,
      isPro: dbUser.isPro,
      proUntil: dbUser.proUntil,
      birthDate: dbUser.birthDate || null,
      birthTime: dbUser.birthTime || null,
      birthTimezone: dbUser.birthTimezone || null,
      birthLocation: dbUser.birthLocation || null,
      birthLatitude: dbUser.birthLatitude !== undefined ? dbUser.birthLatitude : null,
      birthLongitude: dbUser.birthLongitude !== undefined ? dbUser.birthLongitude : null,
      ayanamsa: dbUser.ayanamsa || 'RAMAN',
      hasBirthDetails: !!dbUser.birthDate,
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await req.json();
    const {
      birthDate, // YYYY-MM-DD
      birthTime, // HH:MM
      birthTimezone, // e.g. "+05:30"
      birthLocation, // e.g. "Pilani, Surajgarh, Rajasthan, India"
      birthLatitude,
      birthLongitude,
      ayanamsa = 'RAMAN',
    } = body;

    // Validate inputs
    if (
      !birthDate ||
      !birthTime ||
      !birthTimezone ||
      !birthLocation ||
      birthLatitude === undefined ||
      birthLongitude === undefined
    ) {
      return NextResponse.json({ error: 'Missing required birth details parameters' }, { status: 400 });
    }

    await connectToDatabase();

    // 1. Format date from YYYY-MM-DD to DD/MM/YYYY
    const [year, month, day] = birthDate.split('-');
    const formattedDate = `${day}/${month}/${year}`;
    const stdTime = `${birthTime} ${formattedDate} ${birthTimezone}`;

    // 2. Query VedAstro Horoscope Predictions API
    const predictionsUrl = 'https://api.vedastro.org/api/Calculate/HoroscopePredictions';
    const apiPayload = {
      BirthTime: {
        StdTime: stdTime,
        Location: {
          Name: birthLocation,
          Latitude: parseFloat(birthLatitude),
          Longitude: parseFloat(birthLongitude),
        },
      },
      FilterTags: [],
      SortByWeight: false,
      Ayanamsa: ayanamsa,
    };

    console.log('Fetching horoscope predictions from VedAstro for user:', userId);
    
    const response = await fetch(predictionsUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(apiPayload),
    });

    if (!response.ok) {
      throw new Error(`VedAstro predictions API returned status ${response.status}`);
    }

    const resJson = await response.json();
    
    // Parse the Payload array
    const rawPredictions = resJson.Payload || [];
    console.log(`Fetched ${rawPredictions.length} predictions from VedAstro.`);

    // Map to our schema format: keep it clean and lightweight
    const mappedPredictions = rawPredictions.map((item: any) => ({
      name: item.Name || '',
      description: item.Description ? item.Description.trim() : '',
      tags: item.Tags || [],
    }));

    // 3. Update the user in the database
    const updatedUser = await User.findOneAndUpdate(
      { clerkId: userId },
      {
        $set: {
          birthDate,
          birthTime,
          birthTimezone,
          birthLocation,
          birthLatitude: parseFloat(birthLatitude),
          birthLongitude: parseFloat(birthLongitude),
          ayanamsa,
          predictions: mappedPredictions,
        },
      },
      { new: true, upsert: true }
    );

    return NextResponse.json({
      clerkId: updatedUser.clerkId,
      email: updatedUser.email,
      isPro: updatedUser.isPro,
      birthDate: updatedUser.birthDate,
      birthTime: updatedUser.birthTime,
      birthLocation: updatedUser.birthLocation,
      ayanamsa: updatedUser.ayanamsa,
      hasBirthDetails: true,
    });
  } catch (error: any) {
    console.error('Error saving birth details and predictions:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
