import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Shell } from '@/components/layout/Shell';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

export const metadata = { title: 'Mutual Funds' };

/** Popular MF schemes for the screener (scheme code + display info) */
const POPULAR_MFS = [
  { code: 120503, name: 'Parag Parikh Flexi Cap Fund — Direct Growth', category: 'Flexi Cap' },
  { code: 100356, name: 'Mirae Asset Large Cap Fund — Direct Growth', category: 'Large Cap' },
  { code: 125494, name: 'Axis Bluechip Fund — Direct Growth', category: 'Large Cap' },
  { code: 120505, name: 'Parag Parikh Tax Saver Fund — Direct Growth', category: 'ELSS' },
  { code: 119598, name: 'SBI Small Cap Fund — Direct Growth', category: 'Small Cap' },
  { code: 118989, name: 'HDFC Mid-Cap Opportunities Fund — Direct Growth', category: 'Mid Cap' },
  { code: 100270, name: 'ICICI Prudential Technology Fund — Direct Growth', category: 'Sectoral' },
  { code: 135781, name: 'Quant Small Cap Fund — Direct Growth', category: 'Small Cap' },
  { code: 101206, name: 'Nippon India Small Cap Fund — Direct Growth', category: 'Small Cap' },
  { code: 102885, name: 'Kotak Emerging Equity Fund — Direct Growth', category: 'Mid Cap' },
] as const;

const CATEGORY_BADGE: Record<string, 'default' | 'success' | 'info' | 'warning' | 'neutral'> = {
  'Flexi Cap': 'default',
  'Large Cap': 'info',
  'Mid Cap': 'success',
  'Small Cap': 'warning',
  'ELSS': 'success',
  'Sectoral': 'neutral',
};

export default async function MutualFundsPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  return (
    <Shell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Mutual Funds</h1>
            <p className="mt-1 text-sm text-slate-500">
              Popular Indian MFs — click any fund to run an AI deep scan
            </p>
          </div>
          <Badge variant="neutral">{POPULAR_MFS.length} funds</Badge>
        </div>

        <Card noPadding>
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50/60">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Scheme Code</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Fund Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Category</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {POPULAR_MFS.map((mf) => (
                <tr key={mf.code} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">{mf.code}</td>
                  <td className="px-4 py-3 text-slate-700">{mf.name}</td>
                  <td className="px-4 py-3">
                    <Badge variant={CATEGORY_BADGE[mf.category] ?? 'neutral'}>
                      {mf.category}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/mutual-funds/${mf.code}`}
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
