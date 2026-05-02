'use client';

import { useRef, useState } from 'react';
import { FileUp, Loader2 } from 'lucide-react';

interface ImportResult {
  ok: boolean;
  totalRows: number;
  stocksImported: number;
  mfImported: number;
  skipped: number;
  warnings?: string[];
  error?: string;
}

export function PortfolioImport({ onImported }: { onImported: () => void }) {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  async function handleFile(file: File) {
    setBusy(true);
    setResult(null);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/api/portfolio/import', {
        method: 'POST',
        body: form,
      });
      const text = await res.text();
      let data: ImportResult;
      try {
        data = JSON.parse(text) as ImportResult;
      } catch {
        data = {
          ok: false,
          totalRows: 0,
          stocksImported: 0,
          mfImported: 0,
          skipped: 0,
          error: `Upload failed (${res.status})`,
        };
      }
      setResult(data);
      if (res.ok && data.ok) onImported();
    } catch {
      setResult({ ok: false, totalRows: 0, stocksImported: 0, mfImported: 0, skipped: 0, error: 'Import failed' });
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Import Portfolio</h3>
          <p className="mt-1 text-xs text-slate-500">Upload `.csv`, `.xlsx/.xls`, or `.json` with stocks and/or mutual funds.</p>
        </div>
        <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700">
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileUp className="h-3.5 w-3.5" />}
          {busy ? 'Importing...' : 'Upload'}
          <input
            ref={inputRef}
            type="file"
            accept=".csv,.xlsx,.xls,.json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleFile(file);
            }}
            disabled={busy}
          />
        </label>
      </div>

      {result && (
        <div className={`mt-3 rounded-lg border px-3 py-2 text-xs ${result.ok ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-600'}`}>
          {result.ok ? (
            <p>
              Imported {result.stocksImported} stocks + {result.mfImported} funds from {result.totalRows} rows
              {result.skipped > 0 ? ` (${result.skipped} skipped)` : ''}.
            </p>
          ) : (
            <p>{result.error ?? 'Import failed'}</p>
          )}
          {result.warnings && result.warnings.length > 0 && (
            <p className="mt-1 text-[11px] opacity-90">{result.warnings[0]}</p>
          )}
        </div>
      )}
    </div>
  );
}
