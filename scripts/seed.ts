/**
 * Artha seed script — populates:
 *   1. StockUniverse from NIFTY_50_SEED
 *   2. MFScheme cache for a curated list of popular Indian MFs
 *
 * Run with:
 *   npx tsx scripts/seed.ts
 *   # or: npm run db:seed
 *
 * Idempotent — uses upsert so safe to run multiple times.
 */

import { PrismaClient } from '@prisma/client';
import { NIFTY_50_SEED } from '../lib/data/universe';

const db = new PrismaClient();

/* ── Popular MF schemes to pre-seed ───────────────────────────────── */
const MF_SEED = [
  { schemeCode: '120503', schemeName: 'Parag Parikh Flexi Cap Fund - Direct Growth',        fundHouse: 'Parag Parikh Mutual Fund', category: 'Equity - Flexi Cap',   type: 'EQUITY' as const },
  { schemeCode: '100356', schemeName: 'Mirae Asset Large Cap Fund - Direct Growth',          fundHouse: 'Mirae Asset Mutual Fund',   category: 'Equity - Large Cap',   type: 'EQUITY' as const },
  { schemeCode: '125494', schemeName: 'Axis Bluechip Fund - Direct Growth',                  fundHouse: 'Axis Mutual Fund',          category: 'Equity - Large Cap',   type: 'EQUITY' as const },
  { schemeCode: '120505', schemeName: 'Parag Parikh Tax Saver Fund - Direct Growth',         fundHouse: 'Parag Parikh Mutual Fund',  category: 'Equity - ELSS',        type: 'ELSS'   as const },
  { schemeCode: '119598', schemeName: 'SBI Small Cap Fund - Direct Growth',                  fundHouse: 'SBI Mutual Fund',           category: 'Equity - Small Cap',   type: 'EQUITY' as const },
  { schemeCode: '118989', schemeName: 'HDFC Mid-Cap Opportunities Fund - Direct Growth',     fundHouse: 'HDFC Mutual Fund',          category: 'Equity - Mid Cap',     type: 'EQUITY' as const },
  { schemeCode: '100270', schemeName: 'ICICI Prudential Technology Fund - Direct Growth',    fundHouse: 'ICICI Prudential Mutual Fund', category: 'Equity - Sectoral/Thematic', type: 'EQUITY' as const },
  { schemeCode: '135781', schemeName: 'Quant Small Cap Fund - Direct Growth',                fundHouse: 'Quant Mutual Fund',         category: 'Equity - Small Cap',   type: 'EQUITY' as const },
  { schemeCode: '101206', schemeName: 'Nippon India Small Cap Fund - Direct Growth',         fundHouse: 'Nippon India Mutual Fund',  category: 'Equity - Small Cap',   type: 'EQUITY' as const },
  { schemeCode: '102885', schemeName: 'Kotak Emerging Equity Fund - Direct Growth',          fundHouse: 'Kotak Mahindra Mutual Fund',category: 'Equity - Mid Cap',     type: 'EQUITY' as const },
  { schemeCode: '119551', schemeName: 'DSP Small Cap Fund - Direct Growth',                  fundHouse: 'DSP Mutual Fund',           category: 'Equity - Small Cap',   type: 'EQUITY' as const },
  { schemeCode: '101305', schemeName: 'Canara Robeco Equity Tax Saver Fund - Direct Growth', fundHouse: 'Canara Robeco Mutual Fund', category: 'Equity - ELSS',        type: 'ELSS'   as const },
  { schemeCode: '120586', schemeName: 'UTI Nifty 50 Index Fund - Direct Growth',             fundHouse: 'UTI Mutual Fund',           category: 'Equity - Index Fund',  type: 'INDEX'  as const },
  { schemeCode: '122639', schemeName: 'Nippon India Index Fund Nifty 50 - Direct Growth',    fundHouse: 'Nippon India Mutual Fund',  category: 'Equity - Index Fund',  type: 'INDEX'  as const },
  { schemeCode: '120716', schemeName: 'HDFC Liquid Fund - Direct Growth',                    fundHouse: 'HDFC Mutual Fund',          category: 'Debt - Liquid Fund',   type: 'LIQUID' as const },
] as const;

async function seedStockUniverse() {
  console.log(`\n📈 Seeding StockUniverse (${NIFTY_50_SEED.length} stocks)…`);

  let upserted = 0;
  for (const stock of NIFTY_50_SEED) {
    await db.stockUniverse.upsert({
      where: { symbol: stock.symbol },
      create: {
        symbol: stock.symbol,
        exchange: 'NSE',
        companyName: stock.companyName,
        sector: stock.sector,
        industry: stock.industry ?? null,
        niftyIndex: stock.niftyIndex,
        active: true,
      },
      update: {
        companyName: stock.companyName,
        sector: stock.sector,
        niftyIndex: stock.niftyIndex,
        active: true,
      },
    });
    upserted++;
  }

  console.log(`   ✅ ${upserted} stocks upserted`);
}

async function seedMFSchemes() {
  console.log(`\n🏦 Seeding MFScheme cache (${MF_SEED.length} funds)…`);

  let upserted = 0;
  for (const mf of MF_SEED) {
    await db.mFScheme.upsert({
      where: { schemeCode: mf.schemeCode },
      create: {
        schemeCode: mf.schemeCode,
        schemeName: mf.schemeName,
        fundHouse: mf.fundHouse,
        category: mf.category,
        type: mf.type,
        active: true,
      },
      update: {
        schemeName: mf.schemeName,
        fundHouse: mf.fundHouse,
        category: mf.category,
        type: mf.type,
        active: true,
      },
    });
    upserted++;
  }

  console.log(`   ✅ ${upserted} MF schemes upserted`);
}

async function main() {
  console.log('🌱 Artha seed starting…');
  try {
    await seedStockUniverse();
    await seedMFSchemes();
    console.log('\n✨ Seed complete!\n');
  } finally {
    await db.$disconnect();
  }
}

main().catch((e) => {
  console.error('❌ Seed failed:', e);
  process.exit(1);
});
