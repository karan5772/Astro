import { NextResponse } from 'next/server';
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
      proUntil: dbUser.proUntil
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
