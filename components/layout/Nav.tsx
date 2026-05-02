'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserButton } from '@clerk/nextjs';
import { cn } from '@/lib/utils/cn';

const NAV_LINKS = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/stocks', label: 'Stocks' },
  { href: '/mutual-funds', label: 'Mutual Funds' },
  { href: '/portfolio', label: 'Portfolio' },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center border-b border-slate-200 bg-white/95 backdrop-blur-sm px-4 md:px-6">
      {/* Logo */}
      <Link
        href="/dashboard"
        className="mr-6 flex items-center gap-2 font-bold text-slate-900"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-600 text-sm font-black text-white">
          A
        </span>
        <span className="hidden sm:block">Artha</span>
      </Link>

      {/* Nav links */}
      <nav className="flex flex-1 items-center gap-1">
        {NAV_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              pathname.startsWith(link.href)
                ? 'bg-brand-50 text-brand-700'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
            )}
          >
            {link.label}
          </Link>
        ))}
      </nav>

      {/* User */}
      <div className="ml-4">
        <UserButton afterSignOutUrl="/" />
      </div>
    </header>
  );
}
