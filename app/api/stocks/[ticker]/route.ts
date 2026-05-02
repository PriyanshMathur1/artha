import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getQuote, getFundamentals } from '@/lib/data/yahoo';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: { ticker: string } },
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const ticker = params.ticker.toUpperCase();

  const [quote, fundamentals] = await Promise.all([
    getQuote(ticker),
    getFundamentals(ticker),
  ]);

  return NextResponse.json({ ticker, quote, fundamentals });
}
