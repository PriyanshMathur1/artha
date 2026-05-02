'use client';

import { useState } from 'react';
import { Sparkles, TrendingUp, BarChart2, Layers, DollarSign, RefreshCw } from 'lucide-react';
import clsx from 'clsx';

export const PRESETS = [
  { id: 'quality', label: 'Quality Compounders', icon: Sparkles, color: 'amber', description: 'High ROE, low debt, durable moat' },
  { id: 'momentum', label: 'Momentum Leaders', icon: TrendingUp, color: 'cyan', description: 'Outperforming 50-DMA with volume' },
  { id: 'value', label: 'Deep Value', icon: BarChart2, color: 'violet', description: 'Low P/E, P/B, high dividend yield' },
  { id: 'garp', label: 'GARP', icon: Layers, color: 'emerald', description: 'Growth at a Reasonable Price' },
  { id: 'income', label: 'Income', icon: DollarSign, color: 'amber', description: 'High dividend yield, stable earnings' },
  { id: 'turnaround', label: 'Turnaround', icon: RefreshCw, color: 'red', description: 'Recovery plays off 52W lows' },
] as const;

type PresetId = (typeof PRESETS)[number]['id'];

const colorClasses: Record<string, { inactive: string; active: string }> = {
  amber: {
    inactive: 'border-slate-200 text-slate-600 hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700',
    active: 'border-amber-300 bg-amber-50 text-amber-700',
  },
  cyan: {
    inactive: 'border-slate-200 text-slate-600 hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-700',
    active: 'border-cyan-300 bg-cyan-50 text-cyan-700',
  },
  violet: {
    inactive: 'border-slate-200 text-slate-600 hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700',
    active: 'border-violet-300 bg-violet-50 text-violet-700',
  },
  emerald: {
    inactive: 'border-slate-200 text-slate-600 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700',
    active: 'border-emerald-300 bg-emerald-50 text-emerald-700',
  },
  red: {
    inactive: 'border-slate-200 text-slate-600 hover:border-red-300 hover:bg-red-50 hover:text-red-700',
    active: 'border-red-300 bg-red-50 text-red-700',
  },
};

interface PresetChipsProps {
  selected: PresetId | null;
  onChange: (preset: PresetId | null) => void;
}

export default function PresetChips({ selected, onChange }: PresetChipsProps) {
  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {PRESETS.map((preset) => {
        const Icon = preset.icon;
        const isActive = selected === preset.id;
        const colors = colorClasses[preset.color] ?? colorClasses.amber;

        return (
          <button
            key={preset.id}
            onClick={() => onChange(isActive ? null : preset.id)}
            title={preset.description}
            className={clsx(
              'flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-all duration-150',
              isActive ? colors.active : colors.inactive
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {preset.label}
          </button>
        );
      })}
    </div>
  );
}
