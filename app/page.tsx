import Link from 'next/link';
import { Button } from '@/components/ui/Button';

const FEATURES = [
  {
    icon: '📊',
    title: '6-Agent Deep Scan',
    body: 'Every stock and MF runs through six specialised AI agents — fundamentals, moat, technicals, growth, risk, and sentiment — blended into a single conviction score.',
  },
  {
    icon: '🏦',
    title: 'All 4 Asset Classes',
    body: 'Stocks · Mutual Funds · Insurance · Retirement (EPF / PPF / NPS / FD). Built on a unified schema so your net worth is always one number.',
  },
  {
    icon: '🇮🇳',
    title: 'India-First Tax Engine',
    body: 'LTCG/STCG logic, ELSS 80C benefits, debt-fund slab-rate post-2023, and XIRR across your entire portfolio. INR-native throughout.',
  },
  {
    icon: '🔒',
    title: 'Free-Tier First',
    body: 'Built on Vercel, Neon Postgres, and Clerk — zero hosting cost at personal scale. Your data stays in your account.',
  },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* ── Nav ─────────────────────────────────────────────────────────── */}
      <header className="flex h-14 items-center border-b border-slate-200 px-4 md:px-8">
        <span className="flex items-center gap-2 font-bold text-slate-900">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-600 text-sm font-black text-white">
            A
          </span>
          Artha
        </span>
        <div className="ml-auto flex items-center gap-3">
          <Link href="/sign-in">
            <Button variant="ghost" size="sm">Sign in</Button>
          </Link>
          <Link href="/sign-up">
            <Button size="sm">Get started free</Button>
          </Link>
        </div>
      </header>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-20 text-center">
        <div className="mx-auto max-w-2xl">
          <div className="mb-6 inline-flex items-center rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
            Free preview · v0.1
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
            Your wealth, analysed{' '}
            <span className="text-brand-600">like a fund manager</span>
          </h1>

          <p className="mt-5 text-lg leading-relaxed text-slate-600">
            Artha runs six AI agents across every stock and mutual fund you hold —
            then surfaces a single, confidence-weighted verdict so you always know
            what to hold, buy, or avoid.
          </p>

          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link href="/sign-up">
              <Button size="lg">Start for free →</Button>
            </Link>
            <Link href="/dashboard">
              <Button size="lg" variant="secondary">
                View demo dashboard
              </Button>
            </Link>
          </div>
        </div>
      </main>

      {/* ── Features ─────────────────────────────────────────────────────── */}
      <section className="border-t border-slate-100 bg-slate-50 px-4 py-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-10 text-center text-2xl font-bold text-slate-900">
            Built for the Indian wealth journey
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="mb-3 text-3xl">{f.icon}</div>
                <h3 className="mb-1.5 font-semibold text-slate-900">{f.title}</h3>
                <p className="text-sm leading-relaxed text-slate-500">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="border-t border-slate-200 px-4 py-6 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} Artha · Not SEBI-registered · For educational use only
      </footer>
    </div>
  );
}
