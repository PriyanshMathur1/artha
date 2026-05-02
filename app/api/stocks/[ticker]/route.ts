import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getQuote, getFundamentals } from '@/lib/data/yahoo';

export const dynamic = 'force-dynamic';

// Next.js 15: params is a Promise
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ ticker: string }> },
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { ticker: rawTicker } = await params;
  const ticker = rawTicker.toUpperCase();

  const [quote, fundamentals] = await Promise.all([
    getQuote(ticker),
    getFundamentals(ticker),
  ]);

  return NextResponse.json({ ticker, quote, fundamentals });
}
