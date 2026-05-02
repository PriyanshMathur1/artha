import type { Quote, Fundamentals, Candle } from '@/lib/data/yahoo';
import type { UniverseEntry } from '@/lib/data/universe';

export interface StockInput {
  symbol: string;
  meta: UniverseEntry | null;
  quote: Quote | null;
  fundamentals: Fundamentals | null;
  history: Candle[];           // 1-year daily candles by default
  history5y?: Candle[];        // optional, used by Risk agent if available
}
