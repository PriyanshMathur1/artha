import { prisma } from '@/lib/db';
import type { ChatTurn } from './types';

export async function createThread(userId: string, title?: string) {
  return prisma.chatThread.create({
    data: { userId, title: title?.trim() ? title.trim().slice(0, 80) : 'New chat' },
  });
}

export async function listThreads(userId: string) {
  return prisma.chatThread.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
    take: 50,
    select: { id: true, title: true, updatedAt: true, createdAt: true },
  });
}

export async function getThreadTurns(userId: string, threadId: string): Promise<ChatTurn[]> {
  const thread = await prisma.chatThread.findFirst({
    where: { id: threadId, userId },
    include: { messages: { orderBy: { createdAt: 'asc' }, take: 80 } },
  });
  if (!thread) return [];
  return thread.messages
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));
}

export async function appendMessage(userId: string, threadId: string, role: 'user' | 'assistant', content: string) {
  // Ensure thread belongs to user
  const thread = await prisma.chatThread.findFirst({ where: { id: threadId, userId }, select: { id: true } });
  if (!thread) throw new Error('Thread not found');

  await prisma.chatMessage.create({
    data: { threadId, role, content },
  });

  // Update thread timestamp (Prisma @updatedAt on thread updates only)
  await prisma.chatThread.update({ where: { id: threadId }, data: { title: (await prisma.chatThread.findUnique({ where: { id: threadId }, select: { title: true } }))?.title ?? 'New chat' } });
}

