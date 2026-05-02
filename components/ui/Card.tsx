import * as React from 'react';
import { cn } from '@/lib/utils/cn';

/* ------------------------------------------------------------------ */
/* Card                                                                  */
/* ------------------------------------------------------------------ */
export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Removes default padding — useful when you want full-bleed table/chart content */
  noPadding?: boolean;
}

export function Card({ className, noPadding = false, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-slate-200 bg-white shadow-sm',
        !noPadding && 'p-6',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* CardHeader                                                            */
/* ------------------------------------------------------------------ */
export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
}

export function CardHeader({ title, description, action, className, ...props }: CardHeaderProps) {
  return (
    <div className={cn('flex items-start justify-between gap-4', className)} {...props}>
      <div>
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        {description && (
          <p className="mt-0.5 text-xs text-slate-500">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* CardDivider                                                           */
/* ------------------------------------------------------------------ */
export function CardDivider({ className }: { className?: string }) {
  return <hr className={cn('my-4 border-slate-100', className)} />;
}

/* ------------------------------------------------------------------ */
/* StatCard (compact metric tile)                                        */
/* ------------------------------------------------------------------ */
export interface StatCardProps {
  label: string;
  value: React.ReactNode;
  change?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

export function StatCard({ label, value, change, icon, className }: StatCardProps) {
  return (
    <Card className={cn('flex flex-col gap-3', className)}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</span>
        {icon && <span className="text-slate-400">{icon}</span>}
      </div>
      <div>
        <div className="text-2xl font-bold text-slate-900">{value}</div>
        {change && <div className="mt-1 text-xs text-slate-500">{change}</div>}
      </div>
    </Card>
  );
}
