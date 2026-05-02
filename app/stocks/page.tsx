import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Shell } from '@/components/layout/Shell';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { NIFTY_50_SEED } from '@/lib/data/universe';

export const metadata = { title: 'Stocks' };

export default async function StocksPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  return (
    <Shell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Stocks</h1>
            <p className="mt-1 text-sm text-slate-500">
              Nifty 50 universe — click any ticker to run a deep scan
            </p>
          </div>
          <Badge variant="neutral">{NIFTY_50_SEED.length} stocks</Badge>
        </div>

        <Card noPadding>
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50/60">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Symbol</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Company</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Sector</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {NIFTY_50_SEED.map((stock) => (
                <tr key={stock.symbol} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-900">
                    {stock.symbol}
                  </td>
                  <td className="px-4 py-3 text-slate-700">{stock.companyName}</td>
                  <td className="px-4 py-3">
                    <Badge variant="neutral">{stock.sector}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/stocks/${stock.symbol}`}
                      className="text-xs font-medium text-brand-600 hover:text-brand-700 hover:underline"
                    >
                      Deep scan →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </Shell>
  );
}
