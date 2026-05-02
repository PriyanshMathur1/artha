import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';

/**
 * Resolve the Clerk session to an internal UserProfile row.
 * Auto-creates the profile on first login (idempotent).
 * Returns null if the request is unauthenticated.
 */
export async function getCurrentUser() {
  const { userId } = await auth();
  if (!userId) return null;

  const user = await db.userProfile.upsert({
    where: { clerkUserId: userId },
    create: { clerkUserId: userId },
    update: {},
    select: { id: true, clerkUserId: true, riskAppetite: true, taxRegime: true },
  });

  return user;
}

/** Like getCurrentUser but throws a 401-suitable error if unauthenticated */
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error('UNAUTHENTICATED');
  return user;
}
