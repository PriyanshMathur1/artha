'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Bell, AlertTriangle, TrendingDown, RotateCcw, Activity } from 'lucide-react';

interface Alert {
  id: number;
  type: string;
  title: string;
  message: string;
  severity: string;
  isRead: boolean;
  createdAt: string;
}

const TYPE_ICON: Record<string, React.ReactNode> = {
  STOP_LOSS_BREACH: <TrendingDown className="h-3.5 w-3.5 text-red-400" />,
  MF_UNDERPERFORM: <TrendingDown className="h-3.5 w-3.5 text-amber-400" />,
  REBALANCE_DUE: <RotateCcw className="h-3.5 w-3.5 text-amber-400" />,
  NEW_52W_HIGH: <Activity className="h-3.5 w-3.5 text-emerald-400" />,
};

function timeAgo(dateStr: string) {
  const ms = Date.now() - new Date(dateStr).getTime();
  const h = Math.floor(ms / 3600000);
  const m = Math.floor(ms / 60000);
  if (h > 24) return `${Math.floor(h / 24)}d ago`;
  if (h > 0) return `${h}h ago`;
  if (m > 0) return `${m}m ago`;
  return 'just now';
}

export function AlertsBell() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  async function fetchAlerts() {
    try {
      const res = await fetch('/api/alerts?limit=8');
      const data = await res.json() as { alerts: Alert[]; unreadCount: number };
      setAlerts(data.alerts ?? []);
      setUnread(data.unreadCount ?? 0);
    } catch { /* ignore */ }
  }

  useEffect(() => {
    fetchAlerts();
    const id = setInterval(fetchAlerts, 60000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  async function markAllRead() {
    await fetch('/api/alerts', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'markAllRead' }) });
    fetchAlerts();
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative rounded-md p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
        aria-label="Alerts"
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-indigo-600" />
              <span className="text-sm font-semibold text-slate-900">Alerts</span>
              {unread > 0 && <span className="text-xs text-red-400 font-semibold">{unread} unread</span>}
            </div>
            {unread > 0 && (
              <button onClick={markAllRead} className="text-xs text-slate-500 hover:text-slate-700">
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-64 overflow-y-auto">
            {alerts.length === 0 ? (
              <p className="py-8 text-center text-xs text-slate-500">No alerts yet</p>
            ) : (
              alerts.map((a) => (
                <div key={a.id} className={`border-b border-slate-100 px-4 py-3 hover:bg-slate-50 ${!a.isRead ? 'bg-indigo-50/40' : ''}`}>
                  <div className="flex items-start gap-2">
                    <div className="mt-0.5 shrink-0">{TYPE_ICON[a.type] ?? <Bell className="h-3.5 w-3.5 text-slate-400" />}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="truncate text-xs font-semibold text-slate-900">{a.title}</p>
                        {!a.isRead && <span className="h-1.5 w-1.5 rounded-full bg-red-400 shrink-0" />}
                      </div>
                      <p className="mt-0.5 line-clamp-2 text-[11px] text-slate-500">{a.message}</p>
                      <p className="mt-1 text-[10px] text-slate-400">{timeAgo(a.createdAt)}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="border-t border-slate-200 px-4 py-2">
            <Link href="/alerts" onClick={() => setOpen(false)} className="text-xs font-medium text-indigo-600 hover:text-indigo-700">
              View all alerts →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
