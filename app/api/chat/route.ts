import { NextRequest, NextResponse } from 'next/server';
import { ralphRespond } from '@/lib/ralph/orchestrator';
import type { ChatTurn } from '@/lib/ralph/types';
import { appendMessage } from '@/lib/ralph/store';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { turns?: ChatTurn[]; threadId?: string };
    const turns = body.turns ?? [];
    if (!Array.isArray(turns) || turns.length === 0) {
      return NextResponse.json({ error: 'turns required' }, { status: 400 });
    }

    let userId: string | null = null;
    try {
      const clerk = await import('@clerk/nextjs/server');
      const a = await clerk.auth();
      userId = a.userId ?? null;
    } catch {
      userId = null;
    }
    const result = await ralphRespond({ turns, userId });

    // Persist if authenticated + threadId present
    if (userId && body.threadId) {
      const lastUser = [...turns].reverse().find((t) => t.role === 'user')?.content ?? '';
      if (lastUser) await appendMessage(userId, body.threadId, 'user', lastUser);
      if (result.answer) await appendMessage(userId, body.threadId, 'assistant', result.answer);
    }

    return NextResponse.json(result, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Chat failed';
    console.error('[api/chat]', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

