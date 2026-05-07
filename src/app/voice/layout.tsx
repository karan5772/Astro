import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import connectToDatabase from '@/lib/mongodb';
import User from '@/lib/models/User';

export default async function VoiceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect('/');
  }

  await connectToDatabase();
  const dbUser = await User.findOne({ clerkId: userId });

  if (!dbUser || !dbUser.isPro) {
    redirect('/pricing');
  }

  // Check if pro membership expired
  if (dbUser.isPro && dbUser.proUntil && new Date(dbUser.proUntil) < new Date()) {
    dbUser.isPro = false;
    await dbUser.save();
    redirect('/pricing');
  }

  return <>{children}</>;
}
