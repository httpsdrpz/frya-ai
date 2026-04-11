import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  getDashboardWorkspaceByUserId,
  getDocumentsPageData,
  toNumber,
} from "@/lib/frya-dashboard";
import { documents } from "@/src/db";

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
  const data = await getDocumentsPageData(workspace.tenant.id, {
    period: searchParams.get("period"),
    from: searchParams.get("from"),
    to: searchParams.get("to"),
    type: searchParams.get("type"),
  });

  return NextResponse.json({
    ...data,
    rows: data.rows.map((row) => ({
      ...row,
      createdAt: row.createdAt.toISOString(),
      linkedSale: row.linkedSale
        ? {
            ...row.linkedSale,
            totalValue: toNumber(row.linkedSale.totalValue),
          }
        : null,
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
  const type = String(payload.type ?? "").trim();
  const fileUrl = String(payload.fileUrl ?? "").trim();
  const linkedSaleId = String(payload.linkedSaleId ?? "").trim() || null;
  const uploadedVia =
    String(payload.uploadedVia ?? "dashboard").trim() === "whatsapp"
      ? "whatsapp"
      : "dashboard";
  const extractedData =
    payload.extractedData && typeof payload.extractedData === "object"
      ? (payload.extractedData as Record<string, unknown>)
      : {};

  if (!type || !fileUrl) {
    return NextResponse.json(
      { error: "Informe o tipo e a URL do documento." },
      { status: 400 },
    );
  }

  const [inserted] = await db
    .insert(documents)
    .values({
      tenantId: workspace.tenant.id,
      type:
        type === "nf" ||
        type === "cupom" ||
        type === "comprovante" ||
        type === "contrato"
          ? type
          : "outro",
      fileUrl,
      extractedData,
      linkedSaleId,
      uploadedVia,
    })
    .returning();

  return NextResponse.json({
    success: true,
    document: {
      ...inserted,
      createdAt: inserted.createdAt.toISOString(),
    },
  });
}
