'use client';

import { useAuth, UserButton, SignInButton } from '@clerk/nextjs';
import { AlertsBell } from '@/components/AlertsBell';
import Link from 'next/link';

export function NavbarAuthButtons() {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) {
    return <div className="h-7 w-7 animate-pulse rounded-full bg-slate-200" />;
  }

  if (isSignedIn) {
    return (
      <>
        <Link href="/rebalance" className="hidden rounded-md px-2 py-1 text-xs text-slate-600 hover:bg-slate-100 hover:text-slate-900 sm:block">
          Rebalance
        </Link>
        <AlertsBell />
        <UserButton appearance={{ elements: { avatarBox: 'h-7 w-7' } }} />
      </>
    );
  }

  return (
    <SignInButton mode="redirect">
      <button className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">
        Sign in
      </button>
    </SignInButton>
  );
}
