/**
 * NSE universe — seed list. Use scripts/seed.ts to expand to 500+.
 * Each entry: [symbol, companyName, sector, niftyIndex].
 *
 * In v1 we ship a curated 50-stock list (Nifty 50) so the screener loads instantly.
 * Add the rest progressively via the seed script + a periodic refresh job.
 */

export interface UniverseEntry {
  symbol: string;
  companyName: string;
  sector: string;
  industry?: string;
  niftyIndex: 'NIFTY50' | 'NIFTYNEXT50' | 'NIFTYMIDCAP150' | 'NIFTYSMALLCAP250';
}

export const NIFTY_50_SEED: UniverseEntry[] = [
  { symbol: 'RELIANCE',   companyName: 'Reliance Industries', sector: 'Energy',         niftyIndex: 'NIFTY50' },
  { symbol: 'TCS',        companyName: 'Tata Consultancy Services', sector: 'IT',       niftyIndex: 'NIFTY50' },
  { symbol: 'HDFCBANK',   companyName: 'HDFC Bank',           sector: 'Financials',     niftyIndex: 'NIFTY50' },
  { symbol: 'ICICIBANK',  companyName: 'ICICI Bank',          sector: 'Financials',     niftyIndex: 'NIFTY50' },
  { symbol: 'INFY',       companyName: 'Infosys',             sector: 'IT',             niftyIndex: 'NIFTY50' },
  { symbol: 'BHARTIARTL', companyName: 'Bharti Airtel',       sector: 'Telecom',        niftyIndex: 'NIFTY50' },
  { symbol: 'ITC',        companyName: 'ITC',                 sector: 'FMCG',           niftyIndex: 'NIFTY50' },
  { symbol: 'LT',         companyName: 'Larsen & Toubro',     sector: 'Construction',   niftyIndex: 'NIFTY50' },
  { symbol: 'HINDUNILVR', companyName: 'Hindustan Unilever',  sector: 'FMCG',           niftyIndex: 'NIFTY50' },
  { symbol: 'KOTAKBANK',  companyName: 'Kotak Mahindra Bank', sector: 'Financials',     niftyIndex: 'NIFTY50' },
  { symbol: 'SBIN',       companyName: 'State Bank of India', sector: 'Financials',     niftyIndex: 'NIFTY50' },
  { symbol: 'AXISBANK',   companyName: 'Axis Bank',           sector: 'Financials',     niftyIndex: 'NIFTY50' },
  { symbol: 'MARUTI',     companyName: 'Maruti Suzuki',       sector: 'Auto',           niftyIndex: 'NIFTY50' },
  { symbol: 'BAJFINANCE', companyName: 'Bajaj Finance',       sector: 'Financials',     niftyIndex: 'NIFTY50' },
  { symbol: 'HCLTECH',    companyName: 'HCL Technologies',    sector: 'IT',             niftyIndex: 'NIFTY50' },
  { symbol: 'ASIANPAINT', companyName: 'Asian Paints',        sector: 'Materials',      niftyIndex: 'NIFTY50' },
  { symbol: 'WIPRO',      companyName: 'Wipro',               sector: 'IT',             niftyIndex: 'NIFTY50' },
  { symbol: 'NESTLEIND',  companyName: 'Nestle India',        sector: 'FMCG',           niftyIndex: 'NIFTY50' },
  { symbol: 'TITAN',      companyName: 'Titan Company',       sector: 'Consumer',       niftyIndex: 'NIFTY50' },
  { symbol: 'SUNPHARMA',  companyName: 'Sun Pharmaceutical',  sector: 'Pharma',         niftyIndex: 'NIFTY50' },
  { symbol: 'M&M',        companyName: 'Mahindra & Mahindra', sector: 'Auto',           niftyIndex: 'NIFTY50' },
  { symbol: 'ULTRACEMCO', companyName: 'UltraTech Cement',    sector: 'Materials',      niftyIndex: 'NIFTY50' },
  { symbol: 'NTPC',       companyName: 'NTPC',                sector: 'Power',          niftyIndex: 'NIFTY50' },
  { symbol: 'POWERGRID',  companyName: 'Power Grid',          sector: 'Power',          niftyIndex: 'NIFTY50' },
  { symbol: 'ONGC',       companyName: 'ONGC',                sector: 'Energy',         niftyIndex: 'NIFTY50' },
  { symbol: 'TATAMOTORS', companyName: 'Tata Motors',         sector: 'Auto',           niftyIndex: 'NIFTY50' },
  { symbol: 'JSWSTEEL',   companyName: 'JSW Steel',           sector: 'Materials',      niftyIndex: 'NIFTY50' },
  { symbol: 'COALINDIA',  companyName: 'Coal India',          sector: 'Energy',         niftyIndex: 'NIFTY50' },
  { symbol: 'TECHM',      companyName: 'Tech Mahindra',       sector: 'IT',             niftyIndex: 'NIFTY50' },
  { symbol: 'TATASTEEL',  companyName: 'Tata Steel',          sector: 'Materials',      niftyIndex: 'NIFTY50' },
  { symbol: 'BAJAJFINSV', companyName: 'Bajaj Finserv',       sector: 'Financials',     niftyIndex: 'NIFTY50' },
  { symbol: 'GRASIM',     companyName: 'Grasim Industries',   sector: 'Materials',      niftyIndex: 'NIFTY50' },
  { symbol: 'INDUSINDBK', companyName: 'IndusInd Bank',       sector: 'Financials',     niftyIndex: 'NIFTY50' },
  { symbol: 'CIPLA',      companyName: 'Cipla',               sector: 'Pharma',         niftyIndex: 'NIFTY50' },
  { symbol: 'DRREDDY',    companyName: 'Dr. Reddy\'s Labs',   sector: 'Pharma',         niftyIndex: 'NIFTY50' },
  { symbol: 'ADANIENT',   companyName: 'Adani Enterprises',   sector: 'Diversified',    niftyIndex: 'NIFTY50' },
  { symbol: 'HINDALCO',   companyName: 'Hindalco Industries', sector: 'Materials',      niftyIndex: 'NIFTY50' },
  { symbol: 'BRITANNIA',  companyName: 'Britannia',           sector: 'FMCG',           niftyIndex: 'NIFTY50' },
  { symbol: 'EICHERMOT',  companyName: 'Eicher Motors',       sector: 'Auto',           niftyIndex: 'NIFTY50' },
  { symbol: 'HEROMOTOCO', companyName: 'Hero MotoCorp',       sector: 'Auto',           niftyIndex: 'NIFTY50' },
  { symbol: 'BAJAJ-AUTO', companyName: 'Bajaj Auto',          sector: 'Auto',           niftyIndex: 'NIFTY50' },
  { symbol: 'BPCL',       companyName: 'BPCL',                sector: 'Energy',         niftyIndex: 'NIFTY50' },
  { symbol: 'DIVISLAB',   companyName: 'Divi\'s Laboratories',sector: 'Pharma',         niftyIndex: 'NIFTY50' },
  { symbol: 'TATACONSUM', companyName: 'Tata Consumer',       sector: 'FMCG',           niftyIndex: 'NIFTY50' },
  { symbol: 'APOLLOHOSP', companyName: 'Apollo Hospitals',    sector: 'Healthcare',     niftyIndex: 'NIFTY50' },
  { symbol: 'SBILIFE',    companyName: 'SBI Life Insurance',  sector: 'Insurance',      niftyIndex: 'NIFTY50' },
  { symbol: 'HDFCLIFE',   companyName: 'HDFC Life Insurance', sector: 'Insurance',      niftyIndex: 'NIFTY50' },
  { symbol: 'ADANIPORTS', companyName: 'Adani Ports',         sector: 'Infrastructure', niftyIndex: 'NIFTY50' },
  { symbol: 'LTIM',       companyName: 'LTIMindtree',         sector: 'IT',             niftyIndex: 'NIFTY50' },
  { symbol: 'SHRIRAMFIN', companyName: 'Shriram Finance',     sector: 'Financials',     niftyIndex: 'NIFTY50' },
];

export const ALL_SECTORS = Array.from(
  new Set(NIFTY_50_SEED.map((e) => e.sector)),
).sort();

export function searchUniverse(q: string, limit = 20): UniverseEntry[] {
  const needle = q.trim().toUpperCase();
  if (!needle) return NIFTY_50_SEED.slice(0, limit);
  return NIFTY_50_SEED.filter(
    (e) =>
      e.symbol.includes(needle) ||
      e.companyName.toUpperCase().includes(needle),
  ).slice(0, limit);
}
