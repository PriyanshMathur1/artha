import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getScheme, getLatestNav } from '@/lib/data/mfapi';

export const dynamic = 'force-dynamic';

// Next.js 15: params is a Promise
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { code } = await params;
  const [scheme, latestNav] = await Promise.all([
    getScheme(code),
    getLatestNav(code),
  ]);

  if (!scheme) {
    return NextResponse.json({ error: 'Scheme not found' }, { status: 404 });
  }

  return NextResponse.json({
    schemeCode: scheme.schemeCode,
    schemeName: scheme.schemeName,
    fundHouse: scheme.fundHouse,
    schemeCategory: scheme.schemeCategory,
    schemeType: scheme.schemeType,
    nav: latestNav?.nav ?? null,
    navDate: latestNav?.date ?? null,
    navDataPoints: scheme.nav.length,
  });
}
