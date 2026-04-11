import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  getCollectionsPageData,
  getDashboardWorkspaceByUserId,
  toNumber,
} from "@/lib/frya-dashboard";
import { normalizeBrazilianPhone } from "@/lib/onboarding-quiz";
import { collections } from "@/src/db";

function parseNumber(value: unknown, fallback = 0) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : fallback;
  }

  if (typeof value === "string" && value.trim()) {
    const numericValue = Number.parseFloat(value);
    return Number.isFinite(numericValue) ? numericValue : fallback;
  }

  return fallback;
}

export async function GET(req: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Nao autorizado." }, { status: 401 });
  }

  const workspace = await getDashboardWorkspaceByUserId(userId);

  if (!workspace) {
    return NextResponse.json({ error: "Workspace nao encontrado." }, { status: 404 });
  }

  const searchParams = req.nextUrl.searchParams;
  const data = await getCollectionsPageData(workspace.tenant.id, {
    period: searchParams.get("period"),
    from: searchParams.get("from"),
    to: searchParams.get("to"),
    status: searchParams.get("status"),
  });

  return NextResponse.json({
    ...data,
    rows: data.rows.map((row) => ({
      ...row,
      amount: toNumber(row.amount),
      dueDate: row.dueDate.toISOString(),
      createdAt: row.createdAt.toISOString(),
      lastReminderSentAt: row.lastReminderSentAt?.toISOString() ?? null,
    })),
  });
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Nao autorizado." }, { status: 401 });
  }

  const workspace = await getDashboardWorkspaceByUserId(userId);

  if (!workspace) {
    return NextResponse.json({ error: "Workspace nao encontrado." }, { status: 404 });
  }

  const payload = (await req.json()) as Record<string, unknown>;
  const customerName = String(payload.customerName ?? "").trim();
  const customerPhone = normalizeBrazilianPhone(String(payload.customerPhone ?? ""));
  const amount = parseNumber(payload.amount);
  const dueDate = new Date(String(payload.dueDate ?? ""));
  const status = String(payload.status ?? "pending").trim();
  const linkedSaleId = String(payload.linkedSaleId ?? "").trim() || null;
  const notes = String(payload.notes ?? "").trim() || null;

  if (!customerName || !customerPhone || !amount || Number.isNaN(dueDate.getTime())) {
    return NextResponse.json(
      { error: "Preencha cliente, telefone, valor e vencimento." },
      { status: 400 },
    );
  }

  const [inserted] = await db
    .insert(collections)
    .values({
      tenantId: workspace.tenant.id,
      linkedSaleId,
      customerName,
      customerPhone,
      amount: amount.toFixed(2),
      dueDate,
      status:
        status === "sent" || status === "paid" || status === "overdue"
          ? status
          : "pending",
      notes,
    })
    .returning();

  return NextResponse.json({
    success: true,
    collection: {
      ...inserted,
      amount: toNumber(inserted.amount),
      dueDate: inserted.dueDate.toISOString(),
      createdAt: inserted.createdAt.toISOString(),
      lastReminderSentAt: inserted.lastReminderSentAt?.toISOString() ?? null,
    },
  });
}

export async function PATCH(req: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Nao autorizado." }, { status: 401 });
  }

  const workspace = await getDashboardWorkspaceByUserId(userId);

  if (!workspace) {
    return NextResponse.json({ error: "Workspace nao encontrado." }, { status: 404 });
  }

  const payload = (await req.json()) as Record<string, unknown>;
  const id = String(payload.id ?? "").trim();
  const action = String(payload.action ?? "").trim();

  if (!id || !action) {
    return NextResponse.json(
      { error: "Informe a cobranca e a acao." },
      { status: 400 },
    );
  }

  const current = (
    await db
      .select()
      .from(collections)
      .where(eq(collections.id, id))
      .limit(1)
  )[0];

  if (!current || current.tenantId !== workspace.tenant.id) {
    return NextResponse.json({ error: "Cobranca nao encontrada." }, { status: 404 });
  }

  const [updated] = await db
    .update(collections)
    .set(
      action === "mark_paid"
        ? { status: "paid" }
        : { status: "sent", lastReminderSentAt: new Date() },
    )
    .where(eq(collections.id, id))
    .returning();

  return NextResponse.json({
    success: true,
    collection: {
      ...updated,
      amount: toNumber(updated.amount),
      dueDate: updated.dueDate.toISOString(),
      createdAt: updated.createdAt.toISOString(),
      lastReminderSentAt: updated.lastReminderSentAt?.toISOString() ?? null,
    },
  });
}
