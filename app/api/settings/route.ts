import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { companies } from "@/db/schema";
import { db } from "@/lib/db";
import {
  getDashboardWorkspaceByUserId,
  getSettingsPageData,
} from "@/lib/frya-dashboard";
import { formatBusinessTone } from "@/lib/utils";
import {
  actionSchemas,
  businessProfiles,
  tenants,
} from "@/src/db";

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

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Nao autorizado." }, { status: 401 });
  }

  const workspace = await getDashboardWorkspaceByUserId(userId);

  if (!workspace) {
    return NextResponse.json({ error: "Workspace nao encontrado." }, { status: 404 });
  }

  const settings = await getSettingsPageData(workspace.tenant.id);
  return NextResponse.json(settings);
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
  const businessName = String(payload.businessName ?? "").trim();
  const segment = String(payload.segment ?? "").trim() || null;
  const workingHours = String(payload.workingHours ?? "").trim() || null;
  const tone = String(payload.tone ?? "casual").trim();
  const customInstructions =
    String(payload.customInstructions ?? "").trim() || null;
  const paymentMethods = Array.isArray(payload.paymentMethods)
    ? payload.paymentMethods
        .map((value) => String(value).trim())
        .filter(Boolean)
    : [];
  const products = Array.isArray(payload.products)
    ? payload.products
        .flatMap((entry) => {
          if (!entry || typeof entry !== "object") {
            return [];
          }

          const record = entry as Record<string, unknown>;
          const name = String(record.name ?? "").trim();

          if (!name) {
            return [];
          }

          return [
            {
              name,
              price: parseNumber(record.price),
              description: String(record.description ?? "").trim(),
            },
          ];
        })
    : [];
  const nextActionSchemas = Array.isArray(payload.actionSchemas)
    ? payload.actionSchemas.flatMap((entry) => {
        if (!entry || typeof entry !== "object") {
          return [];
        }

        const record = entry as Record<string, unknown>;
        const actionType = String(record.actionType ?? "").trim();

        if (!actionType) {
          return [];
        }

        return [
          {
            actionType,
            isEnabled: Boolean(record.isEnabled),
          },
        ];
      })
    : [];

  if (!businessName) {
    return NextResponse.json(
      { error: "Informe o nome do negocio." },
      { status: 400 },
    );
  }

  const averageTicket =
    products.length > 0
      ? (
          products.reduce((sum, product) => sum + product.price, 0) /
          products.length
        ).toFixed(2)
      : null;

  await db
    .update(tenants)
    .set({
      name: businessName,
      segment,
    })
    .where(eq(tenants.id, workspace.tenant.id));

  if (workspace.businessProfile) {
    await db
      .update(businessProfiles)
      .set({
        businessName,
        segment,
        products,
        paymentMethods,
        averageTicket,
        workingHours,
        tone:
          tone === "formal" || tone === "tecnico" ? tone : "casual",
        customInstructions,
      })
      .where(eq(businessProfiles.tenantId, workspace.tenant.id));
  } else {
    await db.insert(businessProfiles).values({
      tenantId: workspace.tenant.id,
      businessName,
      segment,
      products,
      paymentMethods,
      averageTicket,
      salesChannels: ["whatsapp"],
      workingHours,
      tone:
        tone === "formal" || tone === "tecnico" ? tone : "casual",
      customInstructions,
    });
  }

  for (const actionSchema of nextActionSchemas) {
    const existingAction = workspace.actionSchemas.find(
      (entry) => entry.actionType === actionSchema.actionType,
    );

    if (existingAction) {
      await db
        .update(actionSchemas)
        .set({ isEnabled: actionSchema.isEnabled })
        .where(eq(actionSchemas.id, existingAction.id));
    } else {
      await db.insert(actionSchemas).values({
        tenantId: workspace.tenant.id,
        actionType:
          actionSchema.actionType === "sale_register" ||
          actionSchema.actionType === "document_store" ||
          actionSchema.actionType === "appointment_schedule" ||
          actionSchema.actionType === "collection_track" ||
          actionSchema.actionType === "report_generate"
            ? actionSchema.actionType
            : "custom",
        isEnabled: actionSchema.isEnabled,
        config: {},
      });
    }
  }

  await db
    .update(companies)
    .set({
      name: businessName,
      segment,
      product: products.map((product) => product.name).join(", "),
      tone: formatBusinessTone(tone),
    })
    .where(eq(companies.id, workspace.company.id));

  return NextResponse.json({ success: true });
}
