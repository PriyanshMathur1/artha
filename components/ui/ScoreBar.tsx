import * as React from 'react';
import { cn } from '@/lib/utils/cn';

export interface ScoreBarProps {
  /** 0–10 */
  score: number;
  /** Show the numeric label beside the bar */
  showLabel?: boolean;
  className?: string;
  /** Height of the bar in pixels */
  height?: number;
}

/** Maps a 0–10 score to a Tailwind fill color class. */
function scoreColor(score: number): string {
  if (score >= 7.5) return 'bg-emerald-500';
  if (score >= 6.0) return 'bg-teal-400';
  if (score >= 4.5) return 'bg-amber-400';
  if (score >= 3.0) return 'bg-orange-500';
  return 'bg-red-500';
}

export function ScoreBar({ score, showLabel = true, className, height = 6 }: ScoreBarProps) {
  const pct = Math.min(Math.max(score / 10, 0), 1) * 100;
  const color = scoreColor(score);

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div
        className="flex-1 overflow-hidden rounded-full bg-slate-100"
        style={{ height }}
        role="progressbar"
        aria-valuenow={score}
        aria-valuemin={0}
        aria-valuemax={10}
      >
        <div
          className={cn('h-full rounded-full transition-all duration-500', color)}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && (
        <span className="w-8 text-right text-xs font-semibold tabular-nums text-slate-700">
          {score.toFixed(1)}
        </span>
      )}
    </div>
  );
}
