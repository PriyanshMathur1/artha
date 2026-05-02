import { type NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const CreateSchema = z.object({
  symbol: z.string().min(1).max(20).toUpperCase(),
  quantity: z.number().positive(),
  avgCost: z.number().positive(),
  buyDate: z.string().datetime(),
  broker: z.string().optional(),
  notes: z.string().optional(),
});

/* GET /api/portfolio/stocks — list user's stock holdings */
export async function GET() {
  let user;
  try { user = await requireUser(); } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const holdings = await db.stockHolding.findMany({
    where: { userId: user.id },
    orderBy: { buyDate: 'desc' },
    select: {
      id: true,
      symbol: true,
      quantity: true,
      avgCost: true,
      buyDate: true,
      broker: true,
      notes: true,
      createdAt: true,
    },
  });

  // Convert Decimal → number for JSON serialisation
  type Row = typeof holdings[number];
  return NextResponse.json(
    holdings.map((h: Row) => ({
      ...h,
      quantity: Number(h.quantity),
      avgCost: Number(h.avgCost),
    })),
  );
}

/* POST /api/portfolio/stocks — add a holding */
export async function POST(req: NextRequest) {
  let user;
  try { user = await requireUser(); } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', issues: parsed.error.issues }, { status: 422 });
  }

  const { symbol, quantity, avgCost, buyDate, broker, notes } = parsed.data;

  const holding = await db.stockHolding.create({
    data: {
      userId: user.id,
      symbol,
      quantity,
      avgCost,
      buyDate: new Date(buyDate),
      broker: (broker ?? null) as never,  // Prisma Broker enum — typed after `prisma generate`
      notes: notes ?? null,
    },
  });

  return NextResponse.json({ id: holding.id, symbol: holding.symbol }, { status: 201 });
}

/* DELETE /api/portfolio/stocks?id=… — remove a holding */
export async function DELETE(req: NextRequest) {
  let user;
  try { user = await requireUser(); } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const id = new URL(req.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  // Ensure the holding belongs to this user
  const holding = await db.stockHolding.findFirst({
    where: { id, userId: user.id },
  });
  if (!holding) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await db.stockHolding.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
