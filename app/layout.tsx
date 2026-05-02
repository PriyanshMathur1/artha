import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Artha — Wealth Management for India',
    template: '%s | Artha',
  },
  description:
    'AI-powered multi-asset wealth management for Indian working professionals. ' +
    'Stocks, mutual funds, insurance & retirement — deep-scan analysis in seconds.',
  keywords: ['wealth management', 'mutual funds', 'stocks', 'India', 'XIRR', 'portfolio'],
  authors: [{ name: 'Artha' }],
  openGraph: {
    type: 'website',
    title: 'Artha — Wealth Management for India',
    description: 'AI-powered multi-asset wealth management for Indian working professionals.',
    siteName: 'Artha',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className="min-h-screen bg-slate-50 text-slate-900">
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
