import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  getDashboardWorkspaceByUserId,
  getSalesPageData,
  toNumber,
} from "@/lib/frya-dashboard";
import { normalizeBrazilianPhone } from "@/lib/onboarding-quiz";
import { sales } from "@/src/db";

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
  const data = await getSalesPageData(workspace.tenant.id, {
    period: searchParams.get("period"),
    from: searchParams.get("from"),
    to: searchParams.get("to"),
    paymentStatus: searchParams.get("paymentStatus"),
    paymentMethod: searchParams.get("paymentMethod"),
  });

  return NextResponse.json({
    ...data,
    rows: data.rows.map((row) => ({
      ...row,
      unitPrice: toNumber(row.unitPrice),
      totalValue: toNumber(row.totalValue),
      saleDate: row.saleDate.toISOString(),
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
  const customerName = String(payload.customerName ?? "").trim();
  const customerPhone = normalizeBrazilianPhone(String(payload.customerPhone ?? ""));
  const productOrService = String(payload.productOrService ?? "").trim();
  const quantity = Math.max(1, Math.round(parseNumber(payload.quantity, 1)));
  const unitPrice = parseNumber(payload.unitPrice);
  const paymentMethod = String(payload.paymentMethod ?? "").trim();
  const paymentStatus = String(payload.paymentStatus ?? "pending").trim();
  const installments = Math.max(1, Math.round(parseNumber(payload.installments, 1)));
  const notes = String(payload.notes ?? "").trim() || null;
  const saleDateInput = String(payload.saleDate ?? "").trim();

  if (!customerName || !customerPhone || !productOrService || !unitPrice || !paymentMethod) {
    return NextResponse.json(
      { error: "Preencha cliente, telefone, produto, valor e pagamento." },
      { status: 400 },
    );
  }

  const saleDate = saleDateInput ? new Date(`${saleDateInput}T12:00:00`) : new Date();

  if (Number.isNaN(saleDate.getTime())) {
    return NextResponse.json({ error: "Data invalida." }, { status: 400 });
  }

  const [inserted] = await db
    .insert(sales)
    .values({
      tenantId: workspace.tenant.id,
      customerName,
      customerPhone,
      productOrService,
      quantity,
      unitPrice: unitPrice.toFixed(2),
      totalValue: (quantity * unitPrice).toFixed(2),
      paymentMethod,
      paymentStatus:
        paymentStatus === "paid" || paymentStatus === "overdue" ? paymentStatus : "pending",
      installments,
      notes,
      saleDate,
    })
    .returning();

  return NextResponse.json({
    success: true,
    sale: {
      ...inserted,
      unitPrice: toNumber(inserted.unitPrice),
      totalValue: toNumber(inserted.totalValue),
      saleDate: inserted.saleDate.toISOString(),
      createdAt: inserted.createdAt.toISOString(),
    },
  });
}
