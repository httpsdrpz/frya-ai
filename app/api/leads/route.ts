import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getCompanyByUserId, getLeadsByCompany, upsertLead } from "@/lib/queries";
import type { LeadClassification, LeadSource, LeadStatus } from "@/types";

const leadStatuses: LeadStatus[] = [
  "novo",
  "qualificado",
  "reuniao",
  "negociacao",
  "fechado",
  "perdido",
];

const leadClassifications: LeadClassification[] = [
  "hot",
  "warm",
  "cold",
  "unscored",
];

const leadSources: LeadSource[] = [
  "whatsapp",
  "instagram",
  "email",
  "site",
  "manual",
];

function isLeadStatus(value: string): value is LeadStatus {
  return leadStatuses.includes(value as LeadStatus);
}

function isLeadClassification(value: string): value is LeadClassification {
  return leadClassifications.includes(value as LeadClassification);
}

function isLeadSource(value: string): value is LeadSource {
  return leadSources.includes(value as LeadSource);
}

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    const company = await getCompanyByUserId(userId);

    if (!company) {
      return NextResponse.json(
        { error: "Empresa nao encontrada" },
        { status: 404 },
      );
    }

    const statusParam = req.nextUrl.searchParams.get("status");
    const classificationParam = req.nextUrl.searchParams.get("classification");
    const status = statusParam && isLeadStatus(statusParam) ? statusParam : undefined;
    const classification =
      classificationParam && isLeadClassification(classificationParam)
        ? classificationParam
        : undefined;

    const items = await getLeadsByCompany(company.id, {
      status,
      classification,
    });

    return NextResponse.json({ items });
  } catch (error) {
    console.error("ERRO LEADS GET:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    const company = await getCompanyByUserId(userId);

    if (!company) {
      return NextResponse.json(
        { error: "Empresa nao encontrada" },
        { status: 404 },
      );
    }

    const payload = (await req.json()) as Record<string, unknown>;
    const name = typeof payload.name === "string" ? payload.name.trim() : "";

    if (!name) {
      return NextResponse.json(
        { error: "Nome do lead e obrigatorio" },
        { status: 400 },
      );
    }

    const source =
      typeof payload.source === "string" && isLeadSource(payload.source)
        ? payload.source
        : "manual";

    const nextStepAt =
      typeof payload.nextStepAt === "string" && payload.nextStepAt
        ? new Date(payload.nextStepAt)
        : null;

    const lead = await upsertLead({
      companyId: company.id,
      userId,
      name,
      phone: typeof payload.phone === "string" ? payload.phone.trim() : null,
      email: typeof payload.email === "string" ? payload.email.trim() : null,
      source,
      mainPain:
        typeof payload.mainPain === "string" ? payload.mainPain.trim() : null,
      notes: typeof payload.notes === "string" ? payload.notes.trim() : null,
      nextStep:
        typeof payload.nextStep === "string" ? payload.nextStep.trim() : null,
      nextStepAt:
        nextStepAt && !Number.isNaN(nextStepAt.getTime()) ? nextStepAt : null,
      lastContactAt: new Date(),
    });

    return NextResponse.json({ item: lead }, { status: 201 });
  } catch (error) {
    console.error("ERRO LEADS POST:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
