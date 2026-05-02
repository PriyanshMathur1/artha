/**
 * Intent router for the Ralph multi-agent chat.
 *
 * Takes the latest user message and decides which specialist to dispatch.
 * Pure-function, dependency-free except for the universe lookup. Tested
 * deterministically — see `.ralph/progress.md` for the smoke-test prompt set.
 *
 * Order of precedence (top-down, first match wins):
 *   1. Two universe-validated tickers + a "vs/versus" word    → `compare` (stock)
 *   2. MF hint + a "vs/versus" word                           → `compare` (mf)
 *   3. MF hint                                                → `mf`
 *   4. Portfolio hint with no ticker                          → `portfolio`
 *   5. Single universe-validated ticker                       → `stock`
 *   6. Portfolio hint (fallback)                              → `portfolio`
 *   7. Stock hint without a resolvable ticker                 → `general`
 *   8. Default                                                → `general`
 */

import { getStockInfo } from '@/lib/universe';
import type { CompareKind, RalphIntent } from './types';

/** What the router emits. The orchestrator switches on `intent`. */
export interface RouteResult {
  intent: RalphIntent;
  /** The NSE ticker symbol when intent === 'stock'. Always universe-validated. */
  ticker?: string;
  /** Free-text MF query (scheme name or scheme code) when intent === 'mf'. */
  mfQuery?: string;
  /** Comparison sides when intent === 'compare'. */
  compare?: { left: string; right: string; kind: CompareKind };
}

const TOKEN_RE = /\b([A-Z][A-Z0-9_-]{1,14})\b/g;

const STOCK_HINTS = [
  'analyze', 'analysis', 'verdict', 'buy', 'sell', 'hold', 'entry',
  'stop loss', 'target', 'fundamental', 'technical', 'moat', 'growth',
  'risk', 'stock', 'share', 'nse', 'bse', 'eps', 'pe ratio', 'price',
];

const PORTFOLIO_HINTS = [
  'portfolio', 'holdings', 'rebalance', 'allocation', 'watchlist',
  'p&l', 'pnl', 'profit and loss', 'overall', 'overview', 'my stocks',
  'my funds', 'my mfs',
];

const MF_HINTS = [
  'mutual fund', 'mutual funds', 'mf ', 'sip', ' nav', 'amc',
  'flexi cap', 'flexicap', 'index fund', 'liquid fund', 'debt fund',
  'large cap', 'mid cap', 'small cap', 'multicap', 'elss', 'parag parikh',
  'quant ', 'mirae', 'axis ', 'sbi ', 'hdfc ', 'icici ', 'nippon ', 'kotak ',
  'aditya birla', 'tata ', 'edelweiss', 'motilal',
];

// Detection: any of these signal a comparison.
const VS_RE = /\b(?:vs\.?|versus|or|compared to|compare)\b/i;
// Splitting: only the unambiguous separators (no leading "compare", no "or").
const VS_SPLIT_RE = /\s+(?:vs\.?|versus)\s+/i;
const COMPARE_PREFIX_RE = /^\s*(?:compare|which is better between|how does)\s+/i;

/** Common English uppercase words that the regex catches but aren't tickers. */
const STOPWORDS = new Set([
  'I', 'A', 'AN', 'AND', 'OR', 'BUT', 'TO', 'ON', 'IN', 'OF', 'IS',
  'IT', 'BE', 'DO', 'GO', 'IF', 'MY', 'WE', 'US', 'YOU', 'YOUR',
  'FOR', 'THE', 'NOT', 'CAN', 'GET', 'HAS', 'HAVE', 'WILL', 'WITH',
  'WHAT', 'HOW', 'WHY', 'WHEN', 'WHO', 'NSE', 'BSE', 'PE', 'PB',
  'ROE', 'CAGR', 'EPS', 'NAV', 'SIP', 'MF', 'IPO', 'MUTUAL', 'FUND',
  'FUNDS', 'STOCK', 'SHARE', 'BUY', 'SELL', 'HOLD', 'VS', 'VERSUS',
]);

function findTickers(text: string): string[] {
  const candidates = Array.from(text.matchAll(TOKEN_RE)).map((m) => m[1]).filter(Boolean);
  // Validate against the bundled NSE universe so we don't treat "MY" or "AND" as tickers.
  const validated = candidates.filter((c) => !STOPWORDS.has(c) && !!getStockInfo(c));
  // Dedupe while preserving order.
  return Array.from(new Set(validated));
}

function isMFQuery(qLower: string): boolean {
  return MF_HINTS.some((h) => qLower.includes(h));
}

/**
 * Pick a specialist for a single user message.
 * @param lastUserMessage The most recent user turn — only this is inspected.
 *                        Conversation history is not used.
 */
export function routeRalph(lastUserMessage: string): RouteResult {
  const q = lastUserMessage.trim();
  const qLower = q.toLowerCase();

  const portfolioHit = PORTFOLIO_HINTS.some((h) => qLower.includes(h));
  const stockHit = STOCK_HINTS.some((h) => qLower.includes(h));
  const mfHit = isMFQuery(qLower);
  const isCompare = VS_RE.test(qLower);

  const tickers = findTickers(q);

  // 1. Two-ticker comparison takes priority — "TCS vs INFY", "RELIANCE or HDFC".
  if (isCompare && tickers.length >= 2) {
    return {
      intent: 'compare',
      compare: { left: tickers[0], right: tickers[1], kind: 'stock' },
    };
  }

  // 2. MF comparison — "PPFAS vs Quant Flexi Cap" or "Compare X vs Y".
  if (isCompare && mfHit) {
    const stripped = q.replace(COMPARE_PREFIX_RE, '').trim();
    const parts = stripped.split(VS_SPLIT_RE);
    if (parts.length >= 2) {
      const left = parts[0].trim();
      const right = parts.slice(1).join(' vs ').trim().replace(/[?.!]+$/, '');
      if (left && right) {
        return {
          intent: 'compare',
          compare: { left, right, kind: 'mf' },
        };
      }
    }
  }

  // 3. MF-specific single-fund query.
  if (mfHit) {
    return { intent: 'mf', mfQuery: q };
  }

  // 4. Portfolio query — explicit hint and no specific ticker.
  if (portfolioHit && tickers.length === 0) {
    return { intent: 'portfolio' };
  }

  // 5. Specific stock — universe-validated ticker present.
  if (tickers[0]) {
    return { intent: 'stock', ticker: tickers[0] };
  }

  // 6. Portfolio fallback if hint present even without ticker.
  if (portfolioHit) return { intent: 'portfolio' };

  // 7. Stock fallback — phrase mentions stock terminology but we couldn't
  // resolve a ticker. Treat as general so the LLM can ask the user to clarify.
  if (stockHit) return { intent: 'general' };

  // 8. Default — general assistant.
  return { intent: 'general' };
}
