import * as React from 'react';
import { cn } from '@/lib/utils/cn';
import type { Verdict } from '@/lib/agents/shared/types';
import { verdictBadge, verdictLabel } from '@/lib/agents/shared/verdict';

export interface VerdictBadgeProps {
  verdict: Verdict;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-3 py-1 text-sm',
  lg: 'px-4 py-1.5 text-base',
};

export function VerdictBadge({ verdict, size = 'md', className }: VerdictBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-semibold tracking-wide',
        verdictBadge(verdict),
        sizeClasses[size],
        className,
      )}
    >
      {verdictLabel(verdict)}
    </span>
  );
}
