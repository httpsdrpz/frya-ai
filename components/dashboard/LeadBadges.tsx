import { Badge } from "@/components/ui/badge";
import { formatLeadClassification, formatLeadStatus } from "@/lib/utils";
import type { LeadClassification, LeadStatus } from "@/types";

function classificationClassName(classification: LeadClassification) {
  if (classification === "hot") {
    return "bg-[#22c55e]/16 text-[#86efac]";
  }

  if (classification === "warm") {
    return "bg-[#eab308]/16 text-[#fde047]";
  }

  if (classification === "cold") {
    return "bg-[#ef4444]/16 text-[#fca5a5]";
  }

  return "bg-white/8 text-white/70";
}

function statusVariant(status: LeadStatus) {
  if (status === "fechado") {
    return "success" as const;
  }

  if (status === "perdido") {
    return "danger" as const;
  }

  if (status === "negociacao" || status === "reuniao") {
    return "warning" as const;
  }

  if (status === "qualificado") {
    return "accent" as const;
  }

  return "muted" as const;
}

export function LeadStatusBadge({ status }: { status: LeadStatus }) {
  return <Badge variant={statusVariant(status)}>{formatLeadStatus(status)}</Badge>;
}

export function LeadClassificationBadge({
  classification,
}: {
  classification: LeadClassification;
}) {
  return (
    <Badge className={classificationClassName(classification)}>
      {formatLeadClassification(classification)}
    </Badge>
  );
}
