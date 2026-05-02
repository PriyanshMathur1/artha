import { type NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const CreateSchema = z.object({
  schemeCode: z.string().min(1).max(20),
  schemeName: z.string().min(1).max(300),
  units: z.number().positive(),
  investedAmount: z.number().positive(),
  buyDate: z.string().datetime(),
  buyNav: z.number().positive().optional(),
  isSip: z.boolean().optional(),
  sipDay: z.number().int().min(1).max(31).optional(),
  sipAmount: z.number().positive().optional(),
  folioNo: z.string().optional(),
  notes: z.string().optional(),
});

/* GET /api/portfolio/mf */
export async function GET() {
  let user;
  try { user = await requireUser(); } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const holdings = await db.mFHolding.findMany({
    where: { userId: user.id },
    orderBy: { buyDate: 'desc' },
    select: {
      id: true,
      schemeCode: true,
      schemeName: true,
      units: true,
      investedAmount: true,
      buyNav: true,
      buyDate: true,
      isSip: true,
      sipDay: true,
      sipAmount: true,
      folioNo: true,
      notes: true,
      createdAt: true,
    },
  });

  type Row = typeof holdings[number];
  return NextResponse.json(
    holdings.map((h: Row) => ({
      ...h,
      units: Number(h.units),
      investedAmount: Number(h.investedAmount),
      buyNav: Number(h.buyNav),
      sipAmount: h.sipAmount != null ? Number(h.sipAmount) : null,
    })),
  );
}

/* POST /api/portfolio/mf */
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

  const d = parsed.data;
  // Derive buyNav from investedAmount / units if not provided
  const buyNav = d.buyNav ?? (d.units > 0 ? d.investedAmount / d.units : 0);

  const holding = await db.mFHolding.create({
    data: {
      userId: user.id,
      schemeCode: d.schemeCode,
      schemeName: d.schemeName,
      units: d.units,
      investedAmount: d.investedAmount,
      buyNav,
      buyDate: new Date(d.buyDate),
      isSip: d.isSip ?? false,
      sipDay: d.sipDay ?? null,
      sipAmount: d.sipAmount ?? null,
      folioNo: d.folioNo ?? null,
      notes: d.notes ?? null,
    },
  });

  return NextResponse.json(
    { id: holding.id, schemeCode: holding.schemeCode },
    { status: 201 },
  );
}

/* DELETE /api/portfolio/mf?id=… */
export async function DELETE(req: NextRequest) {
  let user;
  try { user = await requireUser(); } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const id = new URL(req.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const holding = await db.mFHolding.findFirst({
    where: { id, userId: user.id },
  });
  if (!holding) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await db.mFHolding.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
