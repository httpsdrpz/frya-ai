import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getLeadById, upsertLead } from "@/lib/queries";
import type { LeadClassification, LeadStatus } from "@/types";

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

function isLeadStatus(value: string): value is LeadStatus {
  return leadStatuses.includes(value as LeadStatus);
}

function isLeadClassification(value: string): value is LeadClassification {
  return leadClassifications.includes(value as LeadClassification);
}

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    const { id } = await context.params;
    const lead = await getLeadById(id, userId);

    if (!lead) {
      return NextResponse.json(
        { error: "Lead nao encontrado" },
        { status: 404 },
      );
    }

    return NextResponse.json({ item: lead });
  } catch (error) {
    console.error("ERRO LEAD GET:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    const { id } = await context.params;
    const existingLead = await getLeadById(id, userId);

    if (!existingLead) {
      return NextResponse.json(
        { error: "Lead nao encontrado" },
        { status: 404 },
      );
    }

    const payload = (await req.json()) as Record<string, unknown>;
    const status =
      typeof payload.status === "string" && isLeadStatus(payload.status)
        ? payload.status
        : existingLead.status;
    const classification =
      typeof payload.classification === "string" &&
      isLeadClassification(payload.classification)
        ? payload.classification
        : existingLead.classification ?? "unscored";
    const score =
      typeof payload.score === "number" && Number.isFinite(payload.score)
        ? Math.max(0, Math.min(100, Math.round(payload.score)))
        : existingLead.score ?? 0;
    const nextStepAt =
      payload.nextStepAt === null
        ? null
        : typeof payload.nextStepAt === "string" && payload.nextStepAt
          ? new Date(payload.nextStepAt)
          : existingLead.nextStepAt;

    const lead = await upsertLead({
      id: existingLead.id,
      companyId: existingLead.companyId,
      userId,
      name: existingLead.name,
      phone: existingLead.phone,
      email: existingLead.email,
      source: existingLead.source ?? "manual",
      status,
      score,
      classification,
      mainPain:
        typeof payload.mainPain === "string"
          ? payload.mainPain.trim()
          : existingLead.mainPain,
      notes:
        typeof payload.notes === "string"
          ? payload.notes.trim()
          : existingLead.notes,
      nextStep:
        typeof payload.nextStep === "string"
          ? payload.nextStep.trim()
          : existingLead.nextStep,
      nextStepAt:
        nextStepAt instanceof Date && Number.isNaN(nextStepAt.getTime())
          ? existingLead.nextStepAt
          : nextStepAt,
      lastContactAt:
        status !== existingLead.status ? new Date() : existingLead.lastContactAt,
    });

    return NextResponse.json({ item: lead });
  } catch (error) {
    console.error("ERRO LEAD PATCH:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
