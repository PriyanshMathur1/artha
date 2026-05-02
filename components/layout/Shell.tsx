import * as React from 'react';
import { Nav } from './Nav';
import { Sidebar } from './Sidebar';
import { cn } from '@/lib/utils/cn';

export interface ShellProps {
  children: React.ReactNode;
  /** Remove the sidebar for full-width pages (e.g. landing) */
  noSidebar?: boolean;
  className?: string;
}

/**
 * Shell: the main authenticated layout wrapper.
 * Renders the sticky nav + optional sidebar + content area.
 *
 * Usage in app/dashboard/layout.tsx:
 *   export default function DashboardLayout({ children }) {
 *     return <Shell>{children}</Shell>;
 *   }
 */
export function Shell({ children, noSidebar = false, className }: ShellProps) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Nav />
      <div className="flex flex-1">
        {!noSidebar && <Sidebar />}
        <main
          className={cn(
            'flex-1 min-w-0 p-4 md:p-6',
            className,
          )}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
