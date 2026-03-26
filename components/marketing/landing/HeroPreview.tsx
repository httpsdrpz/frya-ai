"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";
import { Card } from "@/components/ui/card";
import { heroPreviewStats } from "@/components/marketing/landing/content";
import { ChatSimulationFallback } from "@/components/marketing/landing/ChatSimulationFallback";

const ChatSimulation = dynamic(
  () =>
    import("@/components/marketing/landing/ChatSimulation").then(
      (module) => module.ChatSimulation,
    ),
  {
    ssr: false,
    loading: () => <ChatSimulationFallback />,
  },
);

const CursorGlow = dynamic(
  () =>
    import("@/components/marketing/landing/CursorGlow").then(
      (module) => module.CursorGlow,
    ),
  {
    ssr: false,
    loading: () => null,
  },
);

export function HeroPreview() {
  return (
    <>
      <CursorGlow />

      <div className="relative">
        <div className="absolute -left-3 bottom-8 z-10 hidden w-44 lg:block">
          <Card className="rounded-[1.7rem] border-white/10 bg-black/45 p-5 backdrop-blur-xl">
            <p className="text-[11px] uppercase tracking-[0.28em] text-white/36">
              {heroPreviewStats[0].label}
            </p>
            <p className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-white">
              {heroPreviewStats[0].value}
            </p>
          </Card>
        </div>

        <div className="absolute -right-2 top-10 z-10 hidden w-44 lg:block">
          <Card className="rounded-[1.7rem] border-white/10 bg-black/45 p-5 backdrop-blur-xl">
            <p className="text-[11px] uppercase tracking-[0.28em] text-white/36">
              {heroPreviewStats[1].label}
            </p>
            <p className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-white">
              {heroPreviewStats[1].value}
            </p>
          </Card>
        </div>

        <Suspense fallback={<ChatSimulationFallback />}>
          <ChatSimulation />
        </Suspense>
      </div>
    </>
  );
}
