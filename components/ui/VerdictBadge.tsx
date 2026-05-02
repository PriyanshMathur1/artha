import * as React from 'react';
import { cn } from '@/lib/utils/cn';

export type Verdict = 'strong-buy' | 'buy' | 'hold' | 'sell' | 'strong-sell';

export interface VerdictBadgeProps {
  verdict: Verdict;
  className?: string;
}

const labels: Record<Verdict, string> = {
  'strong-buy': 'Strong Buy',
  buy: 'Buy',
  hold: 'Hold',
  sell: 'Sell',
  'strong-sell': 'Strong Sell',
};

const styles: Record<Verdict, string> = {
  'strong-buy': 'bg-emerald-100 text-emerald-800 ring-emerald-300/60',
  buy: 'bg-emerald-50 text-emerald-700 ring-emerald-200/60',
  hold: 'bg-amber-50 text-amber-700 ring-amber-200/60',
  sell: 'bg-red-50 text-red-700 ring-red-200/60',
  'strong-sell': 'bg-red-100 text-red-800 ring-red-300/60',
};

export function VerdictBadge({ verdict, className }: VerdictBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1',
        styles[verdict],
        className,
      )}
    >
      {labels[verdict]}
    </span>
  );
}
