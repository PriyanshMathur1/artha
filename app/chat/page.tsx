'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import { Plus, Send, Sparkles, ChevronDown, ChevronRight } from 'lucide-react';

type ChatTurn = { role: 'user' | 'assistant'; content: string; response?: RalphResponse };

type AgentFinding = {
  agent: string;
  summary: string;
  score?: number;
  verdict?: string;
  evidence?: string[];
  warnings?: string[];
};

type RalphResponse = {
  answer: string;
  why: string[];
  assumptions?: string[];
  nextSteps?: string[];
  agents: AgentFinding[];
  meta: {
    intent: string;
    ticker?: string;
    schemeCode?: string;
    compareKind?: string;
    compareLeft?: string;
    compareRight?: string;
    latencyMs: number;
  };
};

type Thread = { id: string; title: string; updatedAt: string; createdAt: string };

const intentLabel: Record<string, string> = {
  stock: 'Stock',
  mf: 'Mutual Fund',
  portfolio: 'Portfolio',
  compare: 'Compare',
  general: 'General',
};

function ScoreRing({ score }: { score: number }) {
  const pct = Math.max(0, Math.min(10, score)) / 10;
  const radius = 22;
  const circ = 2 * Math.PI * radius;
  const dash = pct * circ;
  const color =
    score >= 7 ? 'text-emerald-500' :
    score >= 5 ? 'text-amber-500' :
    score >= 3 ? 'text-orange-500' : 'text-red-500';
  return (
    <div className="relative h-12 w-12 flex-shrink-0">
      <svg className="h-12 w-12 -rotate-90" viewBox="0 0 56 56">
        <circle cx="28" cy="28" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="5" />
        <circle
          cx="28"
          cy="28"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="5"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          className={color}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={clsx('font-mono text-[11px] font-bold', color)}>{score.toFixed(1)}</span>
      </div>
    </div>
  );
}

function AgentCard({ a }: { a: AgentFinding }) {
  const [open, setOpen] = useState(true);
  const hasScore = typeof a.score === 'number';
  return (
    <div className="rounded-lg border border-slate-200 bg-white">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 px-3 py-2 text-left"
      >
        {hasScore ? (
          <ScoreRing score={a.score!} />
        ) : (
          <span className="inline-flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-500">
            —
          </span>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{a.agent}</span>
            {a.verdict && (
              <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-medium text-indigo-700">
                {a.verdict}
              </span>
            )}
          </div>
          <p className="mt-0.5 truncate text-sm text-slate-800">{a.summary}</p>
        </div>
        {open ? (
          <ChevronDown className="h-4 w-4 flex-shrink-0 text-slate-400" />
        ) : (
          <ChevronRight className="h-4 w-4 flex-shrink-0 text-slate-400" />
        )}
      </button>
      {open && (a.evidence?.length || a.warnings?.length) ? (
        <div className="space-y-2 border-t border-slate-100 px-3 py-3">
          {a.evidence?.length ? (
            <ul className="space-y-1">
              {a.evidence.map((e, i) => (
                <li key={`e-${i}`} className="flex items-start gap-2 text-[13px] text-slate-700">
                  <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-500" />
                  <span>{e}</span>
                </li>
              ))}
            </ul>
          ) : null}
          {a.warnings?.length ? (
            <ul className="space-y-1">
              {a.warnings.map((w, i) => (
                <li key={`w-${i}`} className="flex items-start gap-2 text-[13px] text-slate-700">
                  <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-red-500" />
                  <span>{w}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function AssistantBlock({ response, content }: { response?: RalphResponse; content: string }) {
  const [whyOpen, setWhyOpen] = useState(false);
  if (!response) {
    return (
      <div className="max-w-[85%] whitespace-pre-wrap rounded-xl bg-slate-100 px-3 py-2 text-sm leading-relaxed text-slate-900">
        {content}
      </div>
    );
  }

  return (
    <div className="w-full max-w-[92%] space-y-3">
      <div className="rounded-xl bg-slate-100 px-4 py-3 text-sm leading-relaxed text-slate-900">
        <div className="mb-2 flex items-center gap-2">
          <span className="rounded bg-slate-900 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-white">
            {intentLabel[response.meta.intent] ?? response.meta.intent}
          </span>
          <span className="text-[11px] text-slate-500">{response.meta.latencyMs} ms</span>
        </div>
        <div className="whitespace-pre-wrap">{response.answer}</div>

        {response.why?.length ? (
          <div className="mt-3 border-t border-slate-200 pt-2">
            <button
              onClick={() => setWhyOpen((v) => !v)}
              className="flex items-center gap-1 text-[12px] font-medium text-slate-500 hover:text-slate-700"
            >
              {whyOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              Why ({response.why.length})
            </button>
            {whyOpen && (
              <ul className="mt-1 space-y-1">
                {response.why.map((w, i) => (
                  <li key={i} className="flex items-start gap-2 text-[12px] text-slate-600">
                    <span className="mt-1 h-1 w-1 flex-shrink-0 rounded-full bg-slate-400" />
                    <span>{w}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : null}
      </div>

      {response.agents?.length ? (
        <div className="grid gap-2 sm:grid-cols-2">
          {response.agents.map((a, i) => (
            <AgentCard key={`${a.agent}-${i}`} a={a} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default function ChatPage() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [turns, setTurns] = useState<ChatTurn[]>([
    {
      role: 'assistant',
      content:
        "I'm Ralph — Artha's multi-agent assistant. Ask me about a stock (\"Analyze RELIANCE\"), a mutual fund (\"Is Parag Parikh Flexi Cap a buy?\"), your portfolio (\"How am I doing?\"), or a comparison (\"TCS vs INFY\").",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const last = useMemo(() => turns[turns.length - 1], [turns]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void (async () => {
      const res = await fetch('/api/chat/threads');
      if (!res.ok) return;
      const json = (await res.json()) as { threads: Thread[] };
      setThreads(json.threads ?? []);
      if (json.threads?.[0]?.id) {
        setActiveThreadId(json.threads[0].id);
        const t = await fetch(`/api/chat/threads/${json.threads[0].id}`);
        if (t.ok) {
          const tj = (await t.json()) as { turns: ChatTurn[] };
          if (tj.turns?.length) setTurns(tj.turns);
        }
      }
    })();
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [turns, loading]);

  async function newChat() {
    const res = await fetch('/api/chat/threads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    if (!res.ok) return;
    const json = (await res.json()) as { thread: Thread };
    setThreads((t) => [json.thread, ...t]);
    setActiveThreadId(json.thread.id);
    setTurns([
      {
        role: 'assistant',
        content: "New chat started. Ask me about a stock, a mutual fund, your portfolio, or a comparison.",
      },
    ]);
  }

  async function sendText(text: string) {
    if (!text.trim() || loading) return;
    const nextTurns: ChatTurn[] = [...turns, { role: 'user', content: text.trim() }];
    setTurns(nextTurns);
    setLoading(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          turns: nextTurns
            .filter((t) => t.role !== 'assistant' || t !== last)
            .map(({ role, content }) => ({ role, content })),
          threadId: activeThreadId,
        }),
      });
      const json = (await res.json()) as RalphResponse | { error: string };
      if (!res.ok || 'error' in json) throw new Error('error' in json ? json.error : 'Chat failed');

      const response = json as RalphResponse;
      setTurns((t) => [...t, { role: 'assistant', content: response.answer, response }]);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Chat failed';
      setTurns((t) => [...t, { role: 'assistant', content: `Something went wrong: ${message}` }]);
    } finally {
      setLoading(false);
    }
  }

  async function send() {
    const text = input.trim();
    if (!text) return;
    setInput('');
    await sendText(text);
  }

  const lastAssistant = [...turns].reverse().find((t) => t.role === 'assistant');
  const suggestions = lastAssistant?.response?.nextSteps ?? [];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700">
              <Sparkles className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-900">Ralph · multi-agent chat</p>
              <p className="text-xs text-slate-500">Stocks · Mutual funds · Portfolio · Compare</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {threads.length > 0 && (
              <select
                value={activeThreadId ?? ''}
                onChange={async (e) => {
                  const id = e.target.value;
                  setActiveThreadId(id);
                  const t = await fetch(`/api/chat/threads/${id}`);
                  if (t.ok) {
                    const tj = (await t.json()) as { turns: ChatTurn[] };
                    setTurns(tj.turns?.length ? tj.turns : [{ role: 'assistant', content: 'Empty thread.' }]);
                  }
                }}
                className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700"
              >
                {threads.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
              </select>
            )}
            <button
              onClick={() => void newChat()}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <Plus className="h-4 w-4" />
              New
            </button>
          </div>
        </div>

        <div ref={scrollRef} className="max-h-[65vh] space-y-4 overflow-auto bg-slate-50 px-5 py-4">
          {turns.map((t, i) => (
            <div key={i} className={clsx('flex', t.role === 'user' ? 'justify-end' : 'justify-start')}>
              {t.role === 'user' ? (
                <div className="max-w-[85%] whitespace-pre-wrap rounded-xl bg-slate-900 px-3 py-2 text-sm text-white">
                  {t.content}
                </div>
              ) : (
                <AssistantBlock response={t.response} content={t.content} />
              )}
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="rounded-xl bg-slate-100 px-3 py-2 text-sm text-slate-600">Agents working…</div>
            </div>
          )}
        </div>

        {suggestions.length > 0 && (
          <div className="flex flex-wrap gap-2 border-t border-slate-200 bg-white px-4 py-3">
            {suggestions.map((s, i) => (
              <button
                key={`${s}-${i}`}
                onClick={() => void sendText(s)}
                className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-100"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <div className="border-t border-slate-200 p-4">
          <div className="flex items-end gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  void send();
                }
              }}
              placeholder='Try: "Analyze TCS", "Parag Parikh Flexi Cap", "How is my portfolio?", or "TCS vs INFY"'
              className="min-h-[44px] flex-1 resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />
            <button
              onClick={() => void send()}
              disabled={loading || !input.trim()}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              <Send className="h-4 w-4" />
              Send
            </button>
          </div>
          <p className="mt-2 text-[11px] text-slate-500">
            Stock and MF answers are computed locally via Artha agents · general questions use OPENAI_API_KEY when set.
          </p>
        </div>
      </div>
    </div>
  );
}
