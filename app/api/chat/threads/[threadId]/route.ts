import { NextResponse } from 'next/server';
import { getThreadTurns } from '@/lib/ralph/store';

export async function GET(_req: Request, { params }: { params: Promise<{ threadId: string }> }) {
  let userId: string | null = null;
  try {
    const clerk = await import('@clerk/nextjs/server');
    const a = await clerk.auth();
    userId = a.userId ?? null;
  } catch {
    userId = null;
  }
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { threadId } = await params;
  const turns = await getThreadTurns(userId, threadId);
  return NextResponse.json({ turns }, { headers: { 'Cache-Control': 'no-store' } });
}

