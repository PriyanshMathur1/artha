'use client';

import { useState, useCallback, useRef } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import clsx from 'clsx';
import { RefreshCw, Search, Sparkles, Zap } from 'lucide-react';
import ScreenerTable from '@/components/ScreenerTable';
import FilterSliders, { DEFAULT_FILTERS, type FilterState } from '@/components/FilterSliders';
import PresetChips, { PRESETS } from '@/components/PresetChips';
import type { ScreenerRow, Signal } from '@/app/api/screener/route';

interface CompositeSignal {
  ticker: string;
  score: number;
  signal: Signal;
  verdict: string;
}

interface ScreenerResponse {
  rows: ScreenerRow[];
  count: number;
  preset: string | null;
}

interface NSEResult {
  symbol: string;
  name: string;
  sector: string;
  inUniverse: boolean;
}

type PresetId = (typeof PRESETS)[number]['id'];

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error('Network error');
    return r.json();
  });

const INDEX_TABS = [
  { id: 'default', label: 'Nifty 50', param: null },
  { id: 'next50', label: 'Nifty Next 50', param: 'next50' },
  { id: 'midcap', label: 'Midcap 150', param: 'midcap' },
  { id: 'small', label: 'Smallcap 250', param: 'small' },
] as const;

function buildURL(preset: PresetId | null, index: string | null, query: string): string {
  const p = new URLSearchParams({ limit: '25' });
  if (preset) p.set('preset', preset);
  else if (query) p.set('q', query);
  else if (index) p.set('index', index);
  return `/api/screener?${p}`;
}

function applyFilters(rows: ScreenerRow[], filters: FilterState, signal: Signal | null): ScreenerRow[] {
  return rows.filter((r) => {
    if (signal && r.signal !== signal) return false;
    if (r.pe !== null && (r.pe < filters.minPE || r.pe > filters.maxPE)) return false;
    if (r.marketCap > 0) {
      const mcCr = r.marketCap / 1e7;
      if (mcCr < filters.minMarketCap || mcCr > filters.maxMarketCap) return false;
    }
    if (r.changePct < filters.minChange || r.changePct > filters.maxChange) return false;
    return true;
  });
}

export default function HomePage() {
  const [preset, setPreset] = useState<PresetId | null>(null);
  const [activeIndex, setActiveIndex] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [signalFilter, setSignalFilter] = useState<Signal | null>(null);
  const [compositeSignals, setCompositeSignals] = useState<Map<string, CompositeSignal>>(new Map());
  const [signalsLoading, setSignalsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<NSEResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scanRef = useRef<AbortController | null>(null);

  const url = buildURL(preset, activeIndex, searchQuery);
  const { data, error, isLoading, mutate } = useSWR<ScreenerResponse>(url, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
  });

  const fetchCompositeSignals = useCallback((tickers: string[]) => {
    if (scanRef.current) scanRef.current.abort();
    scanRef.current = new AbortController();
    setSignalsLoading(true);
    fetch(`/api/signals?tickers=${tickers.join(',')}`, { signal: scanRef.current.signal })
      .then((r) => r.json())
      .then((list: CompositeSignal[]) => setCompositeSignals(new Map(list.map((s) => [s.ticker, s]))))
      .finally(() => setSignalsLoading(false));
  }, []);

  const rows = (data?.rows ?? []).map((r) => {
    const cs = compositeSignals.get(r.ticker);
    return cs ? { ...r, signal: cs.signal } : r;
  });
  const filtered = applyFilters(rows, filters, signalFilter);

  function handleSearchInput(val: string) {
    setSearchInput(val);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (val.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    searchTimer.current = setTimeout(async () => {
      const res = await fetch(`/api/nse-search?q=${encodeURIComponent(val)}`);
      const list = (await res.json()) as NSEResult[];
      setSuggestions(list);
      setShowSuggestions(true);
    }, 250);
  }

  function selectSuggestion(s: NSEResult) {
    setSearchInput(s.symbol);
    setSearchQuery(s.symbol);
    setPreset(null);
    setActiveIndex(null);
    setShowSuggestions(false);
    setSuggestions([]);
  }

  function runSearch() {
    setSearchQuery(searchInput.trim());
    setPreset(null);
    setActiveIndex(null);
    setShowSuggestions(false);
  }

  function selectIndex(param: string | null) {
    setActiveIndex(param);
    setPreset(null);
    setSearchQuery('');
    setSearchInput('');
  }

  function selectPreset(p: PresetId | null) {
    setPreset(p);
    setActiveIndex(null);
    setSearchQuery('');
    setSearchInput('');
  }

  const activeTab = INDEX_TABS.find((t) => t.param === activeIndex) ?? INDEX_TABS[0];
  const activePreset = PRESETS.find((p) => p.id === preset);

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-indigo-600">Artha Screener</p>
            <h1 className="mt-1 text-2xl font-semibold text-slate-900">Find High-Quality Opportunities Faster</h1>
            <p className="mt-1 text-sm text-slate-600">Screen NSE stocks, apply strategy presets, then run deep multi-agent scan.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const tickers = (data?.rows ?? []).map((r) => r.ticker);
                if (tickers.length) fetchCompositeSignals(tickers);
              }}
              disabled={signalsLoading || isLoading}
              className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              <Zap className={clsx('h-3.5 w-3.5', signalsLoading && 'animate-pulse')} />
              {signalsLoading ? 'Scanning' : 'Deep Scan'}
            </button>
            <button
              onClick={() => mutate()}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              <RefreshCw className={clsx('h-3.5 w-3.5', isLoading && 'animate-spin')} />
              Refresh
            </button>
          </div>
        </div>

        <div className="relative mt-5">
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2.5">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              value={searchInput}
              onChange={(e) => handleSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && runSearch()}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 120)}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              placeholder="Search symbol or company (e.g. RELIANCE, INFY, TCS)"
              className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
            />
            <button onClick={runSearch} className="rounded-md bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-slate-700">
              Search
            </button>
          </div>

          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
              {suggestions.map((s) => (
                <button
                  key={s.symbol}
                  onMouseDown={() => selectSuggestion(s)}
                  className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-slate-50"
                >
                  <span className="w-24 font-mono text-xs font-semibold text-slate-900">{s.symbol}</span>
                  <span className="flex-1 truncate text-xs text-slate-600">{s.name}</span>
                  {!s.inUniverse && <span className="rounded border border-indigo-100 bg-indigo-50 px-1.5 py-0.5 text-[10px] text-indigo-600">NSE</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          {INDEX_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => selectIndex(tab.param)}
              className={clsx(
                'rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors',
                activeTab.id === tab.id && !preset && !searchQuery
                  ? 'border-indigo-200 bg-indigo-50 text-indigo-700'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="mt-4">
          <div className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-500">
            <Sparkles className="h-3.5 w-3.5" />
            Strategy Presets
          </div>
          <PresetChips selected={preset} onChange={selectPreset} />
        </div>
      </section>

      <FilterSliders filters={filters} onChange={setFilters} />

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-800">
            {activePreset ? activePreset.label : searchQuery ? `Search: ${searchQuery}` : activeTab.label}
            <span className="ml-2 text-xs font-normal text-slate-500">
              {isLoading ? 'Loading...' : `${filtered.length} stocks`}
            </span>
          </p>
          {searchQuery && data?.rows?.length === 0 && (
            <Link href={`/stock/${searchQuery.toUpperCase()}`} className="text-xs font-medium text-indigo-600 hover:text-indigo-700">
              Analyze {searchQuery.toUpperCase()} →
            </Link>
          )}
        </div>

        {error && <div className="mb-3 rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-700">Failed to load screener data. Please retry.</div>}
        <ScreenerTable rows={filtered} loading={isLoading} />
      </section>
    </div>
  );
}
