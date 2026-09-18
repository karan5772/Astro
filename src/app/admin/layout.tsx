import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { checkAdmin } from '@/lib/admin-auth';

export const metadata: Metadata = {
  title: 'Admin',
  // Never index an internal dashboard, even though it is behind auth.
  robots: { index: false, follow: false },
};

/**
 * Guards the dashboard at the page level as well as the API level. Without
 * this a non-admin would load the whole UI and only discover it was empty when
 * every fetch came back 403.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await checkAdmin();

  if (!admin.ok) {
    if (admin.reason === 'unauthenticated') redirect('/sign-in');
    redirect('/');
  }

  return <>{children}</>;
}
