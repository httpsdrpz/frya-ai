"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ChatSimulation } from "@/components/marketing/landing/ChatSimulation";
import { CursorGlow } from "@/components/marketing/landing/CursorGlow";
import {
  automationCards,
  heroPills,
  heroPreviewStats,
  leakCards,
  operatingMetrics,
  operatingNotes,
} from "@/components/marketing/landing/content";

const staggerVariants: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.12,
    },
  },
};

const revealVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.85,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <Badge className="w-fit rounded-full border border-[#0B6B3A]/35 bg-[#0B6B3A]/12 px-4 py-2 text-[11px] uppercase tracking-[0.32em] text-[#9FE1B7]">
      {children}
    </Badge>
  );
}

function StorySection({
  children,
  className,
  id,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <motion.section
      id={id}
      className={className}
      variants={staggerVariants}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.2 }}
    >
      {children}
    </motion.section>
  );
}

function StoryItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div className={className} variants={revealVariants}>
      {children}
    </motion.div>
  );
}

function FloatingCard({
  children,
  className,
  reduceMotion,
}: {
  children: ReactNode;
  className?: string;
  reduceMotion: boolean;
}) {
  return (
    <motion.div
      className={className}
      animate={reduceMotion ? undefined : { y: [0, -6, 0] }}
      transition={
        reduceMotion
          ? undefined
          : {
              duration: 5,
              ease: "easeInOut",
              repeat: Number.POSITIVE_INFINITY,
            }
      }
      whileHover={reduceMotion ? undefined : { y: -4 }}
    >
      {children}
    </motion.div>
  );
}

function CinematicButton({
  href,
  children,
  tone = "primary",
}: {
  href: string;
  children: ReactNode;
  tone?: "primary" | "secondary";
}) {
  const reduceMotion = useReducedMotion() ?? false;

  return (
    <motion.div
      whileHover={reduceMotion ? undefined : { scale: 1.03 }}
      whileTap={reduceMotion ? undefined : { scale: 0.995 }}
      transition={{ duration: 0.24, ease: "easeOut" }}
    >
      <Link
        href={href}
        className={cn(
          "inline-flex min-h-14 items-center justify-center rounded-full px-7 text-sm font-medium transition-[box-shadow,background-color,border-color] duration-300 sm:px-8 sm:text-base",
          tone === "primary"
            ? "border border-[#0B6B3A]/55 bg-[#0B6B3A] text-white shadow-[0_0_0_rgba(11,107,58,0),0_18px_48px_rgba(11,107,58,0.26)] hover:bg-[#0E7A43] hover:shadow-[0_0_42px_rgba(11,107,58,0.22),0_26px_70px_rgba(11,107,58,0.34)]"
            : "border border-white/12 bg-white/[0.04] text-white/84 hover:border-white/20 hover:bg-white/[0.08] hover:shadow-[0_0_28px_rgba(255,255,255,0.06)]",
        )}
      >
        {children}
      </Link>
    </motion.div>
  );
}

export function FryaLanding({ className }: { className?: string }) {
  const reduceMotion = useReducedMotion() ?? false;

  return (
    <main className={cn(className, "relative isolate overflow-hidden bg-[#020403] text-white")}>
      <CursorGlow />

      <div className="pointer-events-none absolute inset-0">
        <motion.div
          className="absolute -left-28 top-[-6rem] h-[34rem] w-[34rem] rounded-full bg-[#0B6B3A]/18 blur-[190px]"
          animate={
            reduceMotion
              ? undefined
              : { x: [0, 48, 0], y: [0, 40, 0], scale: [1, 1.06, 1] }
          }
          transition={
            reduceMotion
              ? undefined
              : {
                  duration: 11,
                  ease: "easeInOut",
                  repeat: Number.POSITIVE_INFINITY,
                }
          }
        />
        <motion.div
          className="absolute right-[-10rem] top-[14%] h-[28rem] w-[28rem] rounded-full bg-[#0B6B3A]/16 blur-[170px]"
          animate={
            reduceMotion
              ? undefined
              : { x: [0, -42, 0], y: [0, 28, 0], scale: [1, 1.08, 1] }
          }
          transition={
            reduceMotion
              ? undefined
              : {
                  duration: 9,
                  ease: "easeInOut",
                  repeat: Number.POSITIVE_INFINITY,
                }
          }
        />
        <motion.div
          className="absolute left-[12%] top-[48%] h-[24rem] w-[24rem] rounded-full bg-[#0B6B3A]/10 blur-[150px]"
          animate={
            reduceMotion
              ? undefined
              : { x: [0, 34, 0], y: [0, -26, 0], scale: [1, 1.04, 1] }
          }
          transition={
            reduceMotion
              ? undefined
              : {
                  duration: 12,
                  ease: "easeInOut",
                  repeat: Number.POSITIVE_INFINITY,
                }
          }
        />
        <motion.div
          className="absolute right-[10%] top-[60%] h-[18rem] w-[18rem] rounded-full bg-[#F2C94C]/7 blur-[130px]"
          animate={
            reduceMotion
              ? undefined
              : { x: [0, -24, 0], y: [0, 18, 0], scale: [1, 1.1, 1] }
          }
          transition={
            reduceMotion
              ? undefined
              : {
                  duration: 10,
                  ease: "easeInOut",
                  repeat: Number.POSITIVE_INFINITY,
                }
          }
        />
      </div>

      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:92px_92px] opacity-[0.08]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,#020403_0%,rgba(2,4,3,0.76)_14%,rgba(2,4,3,0.18)_34%,rgba(2,4,3,0)_50%,rgba(2,4,3,0.28)_72%,#020403_100%)]" />

      <div className="relative mx-auto flex w-full max-w-[1460px] flex-col gap-24 px-6 pb-24 pt-8 sm:px-8 sm:pb-28 lg:gap-32 lg:px-12 lg:pb-32">
        <section className="grid gap-16 pt-6 lg:grid-cols-[0.94fr_1.06fr] lg:items-center lg:pt-12">
          <motion.div
            className="space-y-8"
            variants={staggerVariants}
            initial="hidden"
            animate="show"
          >
            <StoryItem>
              <Eyebrow>Sistema para vendas no WhatsApp</Eyebrow>
            </StoryItem>

            <div className="space-y-6">
              <StoryItem>
                <h1 className="max-w-5xl text-balance text-5xl font-semibold leading-[0.88] tracking-[-0.07em] text-white sm:text-6xl lg:text-7xl">
                  <span className="block">Voce perde clientes todo dia.</span>
                  <span className="block text-white/84">
                    Frya responde antes disso virar prejuizo.
                  </span>
                </h1>
              </StoryItem>

              <StoryItem>
                <div className="max-w-2xl space-y-3 text-base leading-8 text-white/62 sm:text-lg">
                  <p>Ela atende na hora.</p>
                  <p>Faz follow-up.</p>
                  <p>Agenda o proximo passo sem alguem lembrar.</p>
                </div>
              </StoryItem>
            </div>

            <StoryItem>
              <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl">
                <p className="text-sm uppercase tracking-[0.28em] text-[#9FE1B7]">
                  nao e painel
                </p>
                <p className="mt-3 max-w-xl text-xl leading-8 text-white/86 sm:text-2xl">
                  E um sistema rodando por voce. Mesmo quando o time nao esta online.
                </p>
              </div>
            </StoryItem>

            <StoryItem>
              <div className="flex flex-col gap-3 sm:flex-row">
                <CinematicButton href="/sign-up">Comecar gratis</CinematicButton>
                <CinematicButton href="#operacao" tone="secondary">
                  Ver o sistema
                </CinematicButton>
              </div>
            </StoryItem>

            <StoryItem>
              <div className="flex flex-wrap gap-3 text-sm text-white/52">
                {heroPills.map((pill) => (
                  <span
                    key={pill}
                    className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2"
                  >
                    {pill}
                  </span>
                ))}
              </div>
            </StoryItem>
          </motion.div>

          <motion.div
            className="relative"
            initial={reduceMotion ? false : { opacity: 0, y: 24 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
          >
            <FloatingCard
              reduceMotion={reduceMotion}
              className="absolute -left-3 bottom-8 z-10 hidden w-44 lg:block"
            >
              <Card className="rounded-[1.7rem] border-white/10 bg-black/45 p-5 backdrop-blur-xl">
                <p className="text-[11px] uppercase tracking-[0.28em] text-white/36">
                  {heroPreviewStats[0].label}
                </p>
                <p className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-white">
                  {heroPreviewStats[0].value}
                </p>
              </Card>
            </FloatingCard>

            <FloatingCard
              reduceMotion={reduceMotion}
              className="absolute -right-2 top-10 z-10 hidden w-44 lg:block"
            >
              <Card className="rounded-[1.7rem] border-white/10 bg-black/45 p-5 backdrop-blur-xl">
                <p className="text-[11px] uppercase tracking-[0.28em] text-white/36">
                  {heroPreviewStats[1].label}
                </p>
                <p className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-white">
                  {heroPreviewStats[1].value}
                </p>
              </Card>
            </FloatingCard>

            <ChatSimulation />
          </motion.div>
        </section>

        <StorySection className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div className="space-y-6">
            <StoryItem>
              <Eyebrow>Onde o dinheiro some</Eyebrow>
            </StoryItem>
            <StoryItem>
              <h2 className="max-w-2xl text-balance text-4xl font-semibold leading-tight tracking-[-0.05em] text-white sm:text-5xl">
                Seu WhatsApp nao perde no volume.
                <br />
                Perde no atraso.
              </h2>
            </StoryItem>
            <StoryItem>
              <p className="max-w-xl text-lg leading-8 text-white/60">
                O lead entra quente. A demora derruba o interesse. O caixa sente depois.
              </p>
            </StoryItem>
            <StoryItem>
              <Card className="rounded-[2rem] border-[#F2C94C]/16 bg-[#F2C94C]/8 p-6 shadow-[0_24px_90px_rgba(242,201,76,0.08)]">
                <p className="text-[11px] uppercase tracking-[0.32em] text-[#F2C94C]">
                  custo invisivel
                </p>
                <p className="mt-4 text-2xl leading-9 text-white sm:text-[2rem]">
                  Nao falta lead.
                  <br />
                  Falta resposta no tempo certo.
                </p>
              </Card>
            </StoryItem>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {leakCards.map((card) => (
              <StoryItem key={card.label}>
                <FloatingCard reduceMotion={reduceMotion}>
                  <Card className="h-full rounded-[2rem] border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
                    <p className="text-[11px] uppercase tracking-[0.28em] text-white/36">
                      {card.label}
                    </p>
                    <p className="mt-8 text-5xl font-semibold tracking-[-0.06em] text-white">
                      {card.value}
                    </p>
                    <p className="mt-4 text-sm leading-7 text-white/56">{card.copy}</p>
                  </Card>
                </FloatingCard>
              </StoryItem>
            ))}
          </div>
        </StorySection>

        <StorySection
          id="operacao"
          className="grid gap-10 lg:grid-cols-[0.92fr_1.08fr] lg:items-start"
        >
          <div className="space-y-6">
            <StoryItem>
              <Eyebrow>Frya em operacao</Eyebrow>
            </StoryItem>
            <StoryItem>
              <h2 className="max-w-2xl text-balance text-4xl font-semibold leading-tight tracking-[-0.05em] text-white sm:text-5xl">
                Frya entra no meio da conversa e segura o ritmo.
              </h2>
            </StoryItem>
            <StoryItem>
              <p className="max-w-xl text-lg leading-8 text-white/60">
                Ela confirma interesse, manda horario, registra contexto e reativa
                quem sumiu.
              </p>
            </StoryItem>
            <StoryItem>
              <Card className="overflow-hidden rounded-[2.2rem] border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(11,107,58,0.16),transparent_42%),linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-7 shadow-[0_28px_110px_rgba(0,0,0,0.35)]">
                <p className="max-w-lg text-3xl font-semibold leading-tight tracking-[-0.05em] text-white sm:text-4xl">
                  Nao e mais um painel.
                  <br />
                  E uma camada de operacao.
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  {operatingNotes.map((note) => (
                    <span
                      key={note}
                      className="rounded-full border border-white/10 bg-black/24 px-4 py-2 text-sm text-white/70"
                    >
                      {note}
                    </span>
                  ))}
                </div>
              </Card>
            </StoryItem>
          </div>

          <div className="grid gap-4">
            {automationCards.map((card) => (
              <StoryItem key={card.title}>
                <FloatingCard reduceMotion={reduceMotion}>
                  <Card className="rounded-[2rem] border-white/10 bg-white/[0.04] p-7 backdrop-blur-xl transition-colors duration-300 hover:border-[#0B6B3A]/35">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-2xl font-semibold tracking-[-0.04em] text-white">
                          {card.title}
                        </p>
                        <p className="mt-4 max-w-2xl text-sm leading-7 text-white/58">
                          {card.copy}
                        </p>
                      </div>
                      <div className="mt-1 h-10 w-10 rounded-full border border-[#0B6B3A]/24 bg-[#0B6B3A]/10" />
                    </div>
                  </Card>
                </FloatingCard>
              </StoryItem>
            ))}
          </div>
        </StorySection>

        <StorySection className="space-y-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-4">
              <StoryItem>
                <Eyebrow>O que muda no caixa</Eyebrow>
              </StoryItem>
              <StoryItem>
                <h2 className="max-w-3xl text-balance text-4xl font-semibold leading-tight tracking-[-0.05em] text-white sm:text-5xl">
                  Quando o fluxo fica vivo, a receita fica mais previsivel.
                </h2>
              </StoryItem>
            </div>
            <StoryItem className="max-w-md">
              <p className="text-lg leading-8 text-white/56">
                O time para de correr atras de lembrete. A operacao fica acordada o
                dia inteiro.
              </p>
            </StoryItem>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.08fr_0.92fr]">
            <div className="grid gap-4 sm:grid-cols-3">
              {operatingMetrics.map((metric) => (
                <StoryItem key={metric.label}>
                  <FloatingCard reduceMotion={reduceMotion}>
                    <Card className="h-full rounded-[1.9rem] border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
                      <p className="text-[11px] uppercase tracking-[0.28em] text-white/36">
                        {metric.label}
                      </p>
                      <p className="mt-6 text-5xl font-semibold tracking-[-0.06em] text-white">
                        {metric.value}
                      </p>
                    </Card>
                  </FloatingCard>
                </StoryItem>
              ))}
            </div>

            <StoryItem>
              <Card className="h-full rounded-[2.2rem] border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(11,107,58,0.2),transparent_42%),linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-8 shadow-[0_28px_110px_rgba(0,0,0,0.35)]">
                <p className="text-[11px] uppercase tracking-[0.3em] text-[#9FE1B7]">
                  sistema trabalhando
                </p>
                <p className="mt-4 max-w-xl text-3xl font-semibold leading-tight tracking-[-0.05em] text-white sm:text-4xl">
                  Enquanto a equipe fecha, Frya protege o resto do funil.
                </p>
                <p className="mt-5 max-w-lg text-base leading-8 text-white/60">
                  Menos espera. Menos esquecimento. Mais conversa andando sem atrito.
                </p>
              </Card>
            </StoryItem>
          </div>
        </StorySection>

        <StorySection className="pb-4">
          <StoryItem>
            <Card className="relative overflow-hidden rounded-[2.6rem] border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(11,107,58,0.26),transparent_36%),linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-8 shadow-[0_36px_140px_rgba(0,0,0,0.42)] sm:p-10 lg:p-12">
              <motion.div
                aria-hidden="true"
                className="absolute -right-14 bottom-[-3rem] h-52 w-52 rounded-full bg-[#0B6B3A]/20 blur-[150px]"
                animate={
                  reduceMotion ? undefined : { x: [0, -18, 0], y: [0, -14, 0] }
                }
                transition={
                  reduceMotion
                    ? undefined
                    : {
                        duration: 10,
                        ease: "easeInOut",
                        repeat: Number.POSITIVE_INFINITY,
                      }
                }
              />

              <div className="relative flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-3xl space-y-5">
                  <Eyebrow>Ative a Frya</Eyebrow>
                  <div className="space-y-4">
                    <h2 className="max-w-3xl text-balance text-4xl font-semibold leading-tight tracking-[-0.05em] text-white sm:text-5xl">
                      Pare de deixar dinheiro parado no WhatsApp.
                    </h2>
                    <p className="max-w-2xl text-lg leading-8 text-white/60">
                      Em minutos, a operacao comeca a responder, lembrar e puxar o
                      proximo passo por voce.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <CinematicButton href="/sign-up">Comecar gratis agora</CinematicButton>
                  <CinematicButton href="/sign-in" tone="secondary">
                    Entrar
                  </CinematicButton>
                </div>
              </div>
            </Card>
          </StoryItem>
        </StorySection>
      </div>
    </main>
  );
}
