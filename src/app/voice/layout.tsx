import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Voice',
  robots: { index: false, follow: false },
};

export default async function VoiceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect('/');
  }

  return <>{children}</>;
}
