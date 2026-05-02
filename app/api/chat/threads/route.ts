import { NextResponse } from 'next/server';
import { createThread, listThreads } from '@/lib/ralph/store';

export async function GET() {
  let userId: string | null = null;
  try {
    const clerk = await import('@clerk/nextjs/server');
    const a = await clerk.auth();
    userId = a.userId ?? null;
  } catch {
    userId = null;
  }
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const threads = await listThreads(userId);
  return NextResponse.json({ threads }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(req: Request) {
  let userId: string | null = null;
  try {
    const clerk = await import('@clerk/nextjs/server');
    const a = await clerk.auth();
    userId = a.userId ?? null;
  } catch {
    userId = null;
  }
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as { title?: string };
  const thread = await createThread(userId, body.title);
  return NextResponse.json({ thread }, { headers: { 'Cache-Control': 'no-store' } });
}

