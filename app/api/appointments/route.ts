import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  getAppointmentsPageData,
  getDashboardWorkspaceByUserId,
} from "@/lib/frya-dashboard";
import { normalizeBrazilianPhone } from "@/lib/onboarding-quiz";
import { appointments } from "@/src/db";

export async function GET(req: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Nao autorizado." }, { status: 401 });
  }

  const workspace = await getDashboardWorkspaceByUserId(userId);

  if (!workspace) {
    return NextResponse.json({ error: "Workspace nao encontrado." }, { status: 404 });
  }

  const data = await getAppointmentsPageData(workspace.tenant.id, {
    month: req.nextUrl.searchParams.get("month"),
  });

  return NextResponse.json({
    selectedMonth: data.selectedMonth.toISOString(),
    rows: data.rows.map((row) => ({
      ...row,
      scheduledAt: row.scheduledAt.toISOString(),
      reminderAt: row.reminderAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
    })),
    upcoming: data.upcoming.map((row) => ({
      ...row,
      scheduledAt: row.scheduledAt.toISOString(),
      reminderAt: row.reminderAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
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
  const title = String(payload.title ?? "").trim();
  const customerName = String(payload.customerName ?? "").trim();
  const customerPhone = normalizeBrazilianPhone(String(payload.customerPhone ?? ""));
  const description = String(payload.description ?? "").trim() || null;
  const scheduledDate = String(payload.scheduledDate ?? "").trim();
  const scheduledTime = String(payload.scheduledTime ?? "").trim() || "09:00";
  const scheduledAt = new Date(`${scheduledDate}T${scheduledTime}:00`);

  if (!title || !customerName || !customerPhone || Number.isNaN(scheduledAt.getTime())) {
    return NextResponse.json(
      { error: "Preencha titulo, cliente, telefone e data." },
      { status: 400 },
    );
  }

  const [inserted] = await db
    .insert(appointments)
    .values({
      tenantId: workspace.tenant.id,
      title,
      description,
      customerName,
      customerPhone,
      scheduledAt,
      status: "scheduled",
    })
    .returning();

  return NextResponse.json({
    success: true,
    appointment: {
      ...inserted,
      scheduledAt: inserted.scheduledAt.toISOString(),
      reminderAt: inserted.reminderAt?.toISOString() ?? null,
      createdAt: inserted.createdAt.toISOString(),
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
  const status = String(payload.status ?? "").trim();

  if (!id || (status !== "completed" && status !== "cancelled")) {
    return NextResponse.json(
      { error: "Acao de status invalida." },
      { status: 400 },
    );
  }

  const current = (
    await db
      .select()
      .from(appointments)
      .where(eq(appointments.id, id))
      .limit(1)
  )[0];

  if (!current || current.tenantId !== workspace.tenant.id) {
    return NextResponse.json(
      { error: "Compromisso nao encontrado." },
      { status: 404 },
    );
  }

  const [updated] = await db
    .update(appointments)
    .set({ status })
    .where(eq(appointments.id, id))
    .returning();

  return NextResponse.json({
    success: true,
    appointment: {
      ...updated,
      scheduledAt: updated.scheduledAt.toISOString(),
      reminderAt: updated.reminderAt?.toISOString() ?? null,
      createdAt: updated.createdAt.toISOString(),
    },
  });
}
