"use client";

import { useState } from "react";
import { ChatOnboarding } from "@/components/onboarding/ChatOnboarding";
import { OnboardingProgress } from "@/components/onboarding/OnboardingProgress";
import { getDefaultCompanyProfile } from "@/lib/onboarding";
import type { OnboardingAnalysis } from "@/types";

const initialAnalysis: OnboardingAnalysis = {
  summary:
    "Comece a conversa com a Frya para mapear sua operacao e descobrir quais agentes fazem sentido para a empresa.",
  nextQuestion: "",
  completion: 0,
  suggestedAgents: [],
  insights: [
    {
      key: "segment",
      label: "Segmento",
      value: "Ainda nao informado",
      completed: false,
    },
    {
      key: "size",
      label: "Tamanho",
      value: "Ainda nao informado",
      completed: false,
    },
    {
      key: "main_pain",
      label: "Dor principal",
      value: "Ainda nao informada",
      completed: false,
    },
    {
      key: "tone",
      label: "Tom de voz",
      value: "Ainda nao informado",
      completed: false,
    },
  ],
  companyProfile: getDefaultCompanyProfile(),
};

export default function OnboardingPage() {
  const [analysis, setAnalysis] = useState(initialAnalysis);

  return (
    <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <ChatOnboarding onAnalysisChange={setAnalysis} />
      <OnboardingProgress analysis={analysis} />
    </div>
  );
}
