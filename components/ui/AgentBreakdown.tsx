'use client';

import * as React from 'react';
import { cn } from '@/lib/utils/cn';
import type { AgentResult } from '@/lib/agents/shared/types';
import { ScoreBar } from './ScoreBar';
import { Badge } from './Badge';

export interface AgentBreakdownProps {
  agentResults: AgentResult[];
  composite: number;
  className?: string;
}

export function AgentBreakdown({ agentResults, composite, className }: AgentBreakdownProps) {
  const [expanded, setExpanded] = React.useState<string | null>(null);

  return (
    <div className={cn('space-y-2', className)}>
      {/* Composite bar */}
      <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-700">Composite Score</span>
          <span className="text-lg font-bold tabular-nums text-slate-900">
            {composite.toFixed(1)} / 10
          </span>
        </div>
        <ScoreBar score={composite} showLabel={false} height={8} />
      </div>

      {/* Agent rows */}
      {agentResults.map((result) => (
        <AgentRow
          key={result.agentName}
          result={result}
          isExpanded={expanded === result.agentName}
          onToggle={() =>
            setExpanded((prev) =>
              prev === result.agentName ? null : result.agentName,
            )
          }
        />
      ))}
    </div>
  );
}

interface AgentRowProps {
  result: AgentResult;
  isExpanded: boolean;
  onToggle: () => void;
}

function AgentRow({ result, isExpanded, onToggle }: AgentRowProps) {
  const confidence = result.confidence ?? 1;
  const hasFlags = result.flags && result.flags.length > 0;

  return (
    <div className="rounded-lg border border-slate-200 bg-white">
      <button
        className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-slate-50/60 transition-colors"
        onClick={onToggle}
        aria-expanded={isExpanded}
      >
        {/* Agent name */}
        <span className="w-36 shrink-0 font-medium text-slate-800 capitalize text-sm">
          {result.agentName.replace(/-/g, ' ')}
        </span>

        {/* Score bar */}
        <div className="flex-1">
          <ScoreBar score={result.score} height={5} />
        </div>

        {/* Confidence pill */}
        <span
          className={cn(
            'shrink-0 text-xs tabular-nums px-2 py-0.5 rounded-full',
            confidence >= 0.7
              ? 'bg-emerald-50 text-emerald-700'
              : confidence >= 0.4
              ? 'bg-amber-50 text-amber-700'
              : 'bg-slate-100 text-slate-500',
          )}
          title={`Confidence: ${(confidence * 100).toFixed(0)}%`}
        >
          {(confidence * 100).toFixed(0)}%
        </span>

        {/* Expand chevron */}
        <svg
          className={cn(
            'h-4 w-4 shrink-0 text-slate-400 transition-transform',
            isExpanded && 'rotate-180',
          )}
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {/* Expanded detail */}
      {isExpanded && (
        <div className="border-t border-slate-100 px-4 pb-4 pt-3">
          <p className="text-sm text-slate-600 leading-relaxed">{result.rationale}</p>
          {hasFlags && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {result.flags!.map((flag) => (
                <Badge key={flag} variant="warning" className="font-mono">
                  {flag}
                </Badge>
              ))}
            </div>
          )}
          {result.signals && Object.keys(result.signals).length > 0 && (
            <details className="mt-3">
              <summary className="cursor-pointer text-xs text-slate-400 hover:text-slate-600">
                Raw signals
              </summary>
              <pre className="mt-2 overflow-x-auto rounded bg-slate-50 p-3 text-xs text-slate-600">
                {JSON.stringify(result.signals, null, 2)}
              </pre>
            </details>
          )}
        </div>
      )}
    </div>
  );
}
