import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { Shell } from '@/components/layout/Shell';
import { StatCard, Card, CardHeader } from '@/components/ui/Card';

export const metadata = { title: 'Dashboard' };

/**
 * Dashboard — net-worth overview + allocation breakdown.
 *
 * v1: static placeholder with allocation rings and stat cards.
 * v2: connect to portfolio API for live figures.
 */
export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  return (
    <Shell>
      <div className="space-y-6">
        {/* ── Header ───────────────────────────────────────────── */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">Your wealth at a glance</p>
        </div>

        {/* ── Net-worth KPIs ────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Net Worth" value="₹—" change="Add holdings to get started" />
          <StatCard label="Stocks" value="₹—" />
          <StatCard label="Mutual Funds" value="₹—" />
          <StatCard label="XIRR (portfolio)" value="—%" change="Across all holdings" />
        </div>

        {/* ── Allocation chart placeholder ──────────────────────── */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader
              heading="Asset Allocation"
              description="By category (manual holdings)"
            />
            <div className="mt-6 flex flex-col items-center justify-center gap-4 py-10 text-center text-slate-400">
              <svg className="h-12 w-12 opacity-30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <circle cx="12" cy="12" r="10" />
                <path d="M12 2a10 10 0 0110 10" strokeLinecap="round" />
              </svg>
              <p className="text-sm">
                Add stocks and mutual funds in{' '}
                <a href="/portfolio" className="text-brand-600 underline underline-offset-2">
                  Portfolio
                </a>{' '}
                to see your allocation.
              </p>
            </div>
          </Card>

          <Card>
            <CardHeader heading="Recent Activity" description="Last 10 transactions" />
            <div className="mt-6 flex flex-col items-center justify-center py-10 text-center text-slate-400">
              <p className="text-sm">No transactions yet.</p>
            </div>
          </Card>
        </div>
      </div>
    </Shell>
  );
}
