import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getScheme, getLatestNav } from '@/lib/data/mfapi';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: { code: string } },
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const code = params.code;
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
    // Trim nav history from the response (too large for a metadata endpoint)
    navDataPoints: scheme.nav.length,
  });
}
