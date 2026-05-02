'use client';

import { useState, useEffect, useCallback } from 'react';
import { Shell } from '@/components/layout/Shell';
import { Card, CardHeader, StatCard } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatINR } from '@/lib/utils/money';

/* ── Types ──────────────────────────────────────────────────────────── */
interface StockHolding {
  id: string;
  symbol: string;
  quantity: number;
  avgCost: number;
  buyDate: string;
  broker?: string;
}

interface MFHolding {
  id: string;
  schemeCode: string;
  schemeName: string;
  units: number;
  investedAmount: number;
  buyDate: string;
}

type Tab = 'stocks' | 'mutual-funds';

/* ── Helpers ────────────────────────────────────────────────────────── */
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

/* ── Add-Stock form ─────────────────────────────────────────────────── */
function AddStockForm({ onAdded }: { onAdded: () => void }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    symbol: '', quantity: '', avgCost: '', buyDate: '',
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/portfolio/stocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: form.symbol.toUpperCase().trim(),
          quantity: Number(form.quantity),
          avgCost: Number(form.avgCost),
          buyDate: new Date(form.buyDate).toISOString(),
        }),
      });
      if (!res.ok) throw new Error('Failed to add');
      setForm({ symbol: '', quantity: '', avgCost: '', buyDate: '' });
      setOpen(false);
      onAdded();
    } catch {
      alert('Failed to add holding. Check details and try again.');
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <Button size="sm" onClick={() => setOpen(true)}>+ Add stock</Button>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-xl border border-brand-200 bg-brand-50 p-4 space-y-3">
      <h3 className="text-sm font-semibold text-brand-800">Add Stock Holding</h3>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { name: 'symbol', label: 'Symbol', placeholder: 'RELIANCE' },
          { name: 'quantity', label: 'Qty', placeholder: '10', type: 'number' },
          { name: 'avgCost', label: 'Avg Cost (₹)', placeholder: '2500', type: 'number' },
          { name: 'buyDate', label: 'Buy Date', placeholder: '', type: 'date' },
        ].map((f) => (
          <div key={f.name} className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600">{f.label}</label>
            <input
              required
              type={f.type ?? 'text'}
              placeholder={f.placeholder}
              value={form[f.name as keyof typeof form]}
              onChange={(e) => setForm((prev) => ({ ...prev, [f.name]: e.target.value }))}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-300"
            />
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Button type="submit" size="sm" loading={loading}>Save</Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
      </div>
    </form>
  );
}

/* ── Add-MF form ────────────────────────────────────────────────────── */
function AddMFForm({ onAdded }: { onAdded: () => void }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    schemeCode: '', schemeName: '', units: '', investedAmount: '', buyDate: '',
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/portfolio/mf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schemeCode: form.schemeCode.trim(),
          schemeName: form.schemeName.trim(),
          units: Number(form.units),
          investedAmount: Number(form.investedAmount),
          buyDate: new Date(form.buyDate).toISOString(),
        }),
      });
      if (!res.ok) throw new Error('Failed to add');
      setForm({ schemeCode: '', schemeName: '', units: '', investedAmount: '', buyDate: '' });
      setOpen(false);
      onAdded();
    } catch {
      alert('Failed to add holding. Check details and try again.');
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return <Button size="sm" onClick={() => setOpen(true)}>+ Add fund</Button>;
  }

  return (
    <form onSubmit={submit} className="rounded-xl border border-brand-200 bg-brand-50 p-4 space-y-3">
      <h3 className="text-sm font-semibold text-brand-800">Add MF Holding</h3>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {[
          { name: 'schemeCode', label: 'Scheme Code', placeholder: '120503' },
          { name: 'schemeName', label: 'Fund Name', placeholder: 'Parag Parikh Flexi Cap' },
          { name: 'units', label: 'Units', placeholder: '100.234', type: 'number' },
          { name: 'investedAmount', label: 'Invested (₹)', placeholder: '50000', type: 'number' },
          { name: 'buyDate', label: 'Buy / SIP Start Date', placeholder: '', type: 'date' },
        ].map((f) => (
          <div key={f.name} className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600">{f.label}</label>
            <input
              required
              type={f.type ?? 'text'}
              placeholder={f.placeholder}
              value={form[f.name as keyof typeof form]}
              onChange={(e) => setForm((prev) => ({ ...prev, [f.name]: e.target.value }))}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-300"
            />
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Button type="submit" size="sm" loading={loading}>Save</Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
      </div>
    </form>
  );
}

/* ── Main page ──────────────────────────────────────────────────────── */
export default function PortfolioPage() {
  const [tab, setTab] = useState<Tab>('stocks');
  const [stocks, setStocks] = useState<StockHolding[]>([]);
  const [mfs, setMFs] = useState<MFHolding[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoadingData(true);
    try {
      const [sRes, mRes] = await Promise.all([
        fetch('/api/portfolio/stocks'),
        fetch('/api/portfolio/mf'),
      ]);
      if (sRes.ok) setStocks(await sRes.json());
      if (mRes.ok) setMFs(await mRes.json());
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => { void fetchAll(); }, [fetchAll]);

  async function deleteStock(id: string) {
    if (!confirm('Remove this holding?')) return;
    await fetch(`/api/portfolio/stocks?id=${id}`, { method: 'DELETE' });
    void fetchAll();
  }

  async function deleteMF(id: string) {
    if (!confirm('Remove this holding?')) return;
    await fetch(`/api/portfolio/mf?id=${id}`, { method: 'DELETE' });
    void fetchAll();
  }

  const totalStocksValue = stocks.reduce((s, h) => s + h.quantity * h.avgCost, 0);
  const totalMFValue = mfs.reduce((s, h) => s + h.investedAmount, 0);

  return (
    <Shell>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Portfolio</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manually add or import your holdings
          </p>
        </div>

        {/* Summary KPIs */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            label="Total Holdings (cost)"
            value={formatINR(totalStocksValue + totalMFValue, { compact: true })}
          />
          <StatCard label="Stocks" value={formatINR(totalStocksValue, { compact: true })} />
          <StatCard label="Mutual Funds" value={formatINR(totalMFValue, { compact: true })} />
          <StatCard
            label="Positions"
            value={String(stocks.length + mfs.length)}
            change={`${stocks.length} stocks · ${mfs.length} MFs`}
          />
        </div>

        {/* Tab switcher */}
        <div className="flex gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1 w-fit">
          {(['stocks', 'mutual-funds'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
                tab === t
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {t === 'stocks' ? `Stocks (${stocks.length})` : `Mutual Funds (${mfs.length})`}
            </button>
          ))}
        </div>

        {/* Stocks tab */}
        {tab === 'stocks' && (
          <div className="space-y-4">
            <AddStockForm onAdded={fetchAll} />

            <Card noPadding>
              {loadingData ? (
                <div className="p-8 text-center text-sm text-slate-400">Loading…</div>
              ) : stocks.length === 0 ? (
                <div className="p-8 text-center text-sm text-slate-400">
                  No stocks yet. Add your first holding above.
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50/60">
                    <tr>
                      {['Symbol', 'Qty', 'Avg Cost', 'Invested', 'Buy Date', 'Broker', ''].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {stocks.map((h) => (
                      <tr key={h.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-900">{h.symbol}</td>
                        <td className="px-4 py-3 tabular-nums text-slate-700">{h.quantity}</td>
                        <td className="px-4 py-3 tabular-nums text-slate-700">{formatINR(h.avgCost)}</td>
                        <td className="px-4 py-3 tabular-nums font-medium text-slate-900">
                          {formatINR(h.quantity * h.avgCost, { compact: true })}
                        </td>
                        <td className="px-4 py-3 text-slate-500">{formatDate(h.buyDate)}</td>
                        <td className="px-4 py-3">
                          {h.broker && <Badge variant="neutral">{h.broker}</Badge>}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => deleteStock(h.id)}
                            className="text-xs text-red-500 hover:text-red-700"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Card>
          </div>
        )}

        {/* MF tab */}
        {tab === 'mutual-funds' && (
          <div className="space-y-4">
            <AddMFForm onAdded={fetchAll} />

            <Card noPadding>
              {loadingData ? (
                <div className="p-8 text-center text-sm text-slate-400">Loading…</div>
              ) : mfs.length === 0 ? (
                <div className="p-8 text-center text-sm text-slate-400">
                  No mutual fund holdings yet. Add your first above.
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50/60">
                    <tr>
                      {['Fund', 'Scheme Code', 'Units', 'Invested', 'Buy Date', ''].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {mfs.map((h) => (
                      <tr key={h.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-4 py-3 text-slate-800 max-w-xs truncate">{h.schemeName}</td>
                        <td className="px-4 py-3 font-mono text-xs text-slate-500">{h.schemeCode}</td>
                        <td className="px-4 py-3 tabular-nums text-slate-700">{Number(h.units).toFixed(3)}</td>
                        <td className="px-4 py-3 tabular-nums font-medium text-slate-900">
                          {formatINR(h.investedAmount, { compact: true })}
                        </td>
                        <td className="px-4 py-3 text-slate-500">{formatDate(h.buyDate)}</td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => deleteMF(h.id)}
                            className="text-xs text-red-500 hover:text-red-700"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Card>
          </div>
        )}
      </div>
    </Shell>
  );
}
