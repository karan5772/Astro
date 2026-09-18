import { auth, currentUser } from '@clerk/nextjs/server';

/**
 * Admin access is granted by email, checked against Clerk's copy rather than
 * our mirror of it — the identity provider is the source of truth, and the
 * local `email` field is only a cache of it.
 *
 * An unset ADMIN_EMAILS locks everyone out rather than defaulting to some
 * address baked into the source.
 */
function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean);
}

export type AdminCheck =
  | { ok: true; userId: string; email: string }
  | { ok: false; reason: 'unauthenticated' | 'not_configured' | 'forbidden' };

export async function checkAdmin(): Promise<AdminCheck> {
  const { userId } = await auth();
  if (!userId) return { ok: false, reason: 'unauthenticated' };

  const allowed = adminEmails();
  if (allowed.length === 0) {
    console.error('[admin] ADMIN_EMAILS is not configured — refusing all access');
    return { ok: false, reason: 'not_configured' };
  }

  type ClerkEmail = { id: string; emailAddress: string };
  const clerkUser = await currentUser();
  const addresses: ClerkEmail[] = clerkUser?.emailAddresses ?? [];
  const email =
    addresses.find(a => a.id === clerkUser?.primaryEmailAddressId)?.emailAddress ??
    addresses[0]?.emailAddress;

  if (!email || !allowed.includes(email.toLowerCase())) {
    return { ok: false, reason: 'forbidden' };
  }
  return { ok: true, userId, email };
}

/** Status code for an API route to return when the check fails. */
export function adminDenialStatus(reason: Exclude<AdminCheck, { ok: true }>['reason']): number {
  return reason === 'unauthenticated' ? 401 : 403;
}
