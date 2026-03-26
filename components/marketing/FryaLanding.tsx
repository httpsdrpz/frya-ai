"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion, type Variants } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const pains = [
  "demora para responder",
  "esquece follow-up",
  "perde vendas no WhatsApp",
];

const steps = [
  {
    step: "01",
    title: "Conecte seu WhatsApp",
    copy: "Em poucos cliques, a Frya entra na sua operacao sem virar mais uma ferramenta.",
  },
  {
    step: "02",
    title: "Ative sua agente",
    copy: "Ela aprende seu contexto, seu tom e como sua empresa vende no Brasil.",
  },
  {
    step: "03",
    title: "A Frya comeca a responder",
    copy: "Atende na hora, retoma quem sumiu e deixa cada conversa organizada.",
  },
];

const proofCards = [
  {
    name: "Studio Vena",
    segment: "Agencia",
    result: "+27% mais respostas em 14 dias",
  },
  {
    name: "Clinica Serra",
    segment: "Clinica",
    result: "0 lead esquecido no plantao",
  },
  {
    name: "Atlas Solar",
    segment: "Servicos",
    result: "Follow-up rodando sem dono",
  },
];

const signalCards = [
  {
    label: "Tempo medio de resposta",
    value: "14s",
  },
  {
    label: "Leads sem retorno hoje",
    value: "0",
  },
  {
    label: "Follow-ups em andamento",
    value: "7",
  },
];

const heroContainerVariants: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.16,
    },
  },
};

const heroItemVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 18,
  },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut",
    },
  },
};

function SectionEyebrow({ children }: { children: ReactNode }) {
  return (
    <Badge
      variant="default"
      className="w-fit rounded-full border border-[#0B6B3A]/45 bg-[#0B6B3A]/14 px-4 py-2 text-[11px] uppercase tracking-[0.28em] text-[#7FE0A8]"
    >
      {children}
    </Badge>
  );
}

function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
      whileInView={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6, ease: "easeOut", delay }}
    >
      {children}
    </motion.div>
  );
}

function FloatingReveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <Reveal className={className} delay={delay}>
      <motion.div
        animate={prefersReducedMotion ? undefined : { y: [0, -4, 0] }}
        transition={
          prefersReducedMotion
            ? undefined
            : {
                duration: 4,
                ease: "easeInOut",
                repeat: Number.POSITIVE_INFINITY,
                delay,
              }
        }
      >
        {children}
      </motion.div>
    </Reveal>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="max-w-3xl space-y-4">
      <SectionEyebrow>{eyebrow}</SectionEyebrow>
      <div className="space-y-4">
        <h2 className="text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl md:text-5xl">
          {title}
        </h2>
        {description ? (
          <p className="max-w-2xl text-base leading-7 text-white/68 sm:text-lg">
            {description}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function GlowButton({
  children,
  className,
  asLink = false,
  href,
  type = "button",
}: {
  children: ReactNode;
  className?: string;
  asLink?: boolean;
  href?: string;
  type?: "button" | "submit" | "reset";
}) {
  const prefersReducedMotion = useReducedMotion();

  const animation = prefersReducedMotion
    ? undefined
    : {
        scale: [1, 1.015, 1],
        boxShadow: [
          "0 18px 46px rgba(11,107,58,0.18)",
          "0 22px 58px rgba(11,107,58,0.28)",
          "0 18px 46px rgba(11,107,58,0.18)",
        ],
      };

  const hover = prefersReducedMotion
    ? undefined
    : {
        scale: 1.03,
        boxShadow: "0 0 42px rgba(11,107,58,0.26), 0 26px 70px rgba(11,107,58,0.34)",
      };

  const sharedClassName =
    "inline-flex h-14 items-center justify-center rounded-2xl bg-[#0B6B3A] px-8 text-base font-semibold text-white";

  if (asLink && href) {
    return (
      <motion.div
        className="rounded-2xl"
        animate={animation}
        transition={
          prefersReducedMotion
            ? undefined
            : {
                duration: 3,
                ease: "easeInOut",
                repeat: Number.POSITIVE_INFINITY,
              }
        }
        whileHover={hover}
        whileTap={prefersReducedMotion ? undefined : { scale: 0.995 }}
      >
        <Link href={href} className={cn(sharedClassName, className)}>
          {children}
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.button
      type={type}
      className={cn(sharedClassName, className)}
      animate={animation}
      transition={
        prefersReducedMotion
          ? undefined
          : {
              duration: 3,
              ease: "easeInOut",
              repeat: Number.POSITIVE_INFINITY,
            }
      }
      whileHover={hover}
      whileTap={prefersReducedMotion ? undefined : { scale: 0.995 }}
    >
      {children}
    </motion.button>
  );
}

function HeroPreview() {
  const prefersReducedMotion = useReducedMotion();
  const [visibleCount, setVisibleCount] = useState(prefersReducedMotion ? 3 : 1);

  useEffect(() => {
    if (prefersReducedMotion) {
      setVisibleCount(3);
      return;
    }

    const timeouts: number[] = [];

    const runSequence = () => {
      setVisibleCount(1);
      timeouts.push(window.setTimeout(() => setVisibleCount(2), 1000));
      timeouts.push(window.setTimeout(() => setVisibleCount(3), 2000));
      timeouts.push(window.setTimeout(() => setVisibleCount(0), 6200));
    };

    runSequence();
    const interval = window.setInterval(runSequence, 7200);

    return () => {
      window.clearInterval(interval);
      timeouts.forEach((timeout) => window.clearTimeout(timeout));
    };
  }, [prefersReducedMotion]);

  return (
    <motion.div
      className="relative mx-auto w-full max-w-[560px]"
      initial={prefersReducedMotion ? false : { opacity: 0, y: 18 }}
      animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut", delay: 0.18 }}
    >
      <motion.div
        className="absolute -left-6 top-14 h-36 w-36 rounded-full bg-[#0B6B3A]/24 blur-[100px]"
        animate={prefersReducedMotion ? undefined : { y: [0, -10, 0] }}
        transition={
          prefersReducedMotion
            ? undefined
            : {
                duration: 4,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
              }
        }
      />
      <motion.div
        className="absolute -right-4 bottom-6 h-28 w-28 rounded-full bg-[#F2C94C]/16 blur-[90px]"
        animate={prefersReducedMotion ? undefined : { y: [0, -8, 0] }}
        transition={
          prefersReducedMotion
            ? undefined
            : {
                duration: 4.4,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
                delay: 0.8,
              }
        }
      />

      <motion.div
        className="rounded-[2rem] border border-white/12 bg-white/[0.05] p-4 shadow-[0_32px_120px_rgba(0,0,0,0.45)] backdrop-blur-2xl"
        animate={prefersReducedMotion ? undefined : { y: [0, -4, 0] }}
        transition={
          prefersReducedMotion
            ? undefined
            : {
                duration: 4,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
              }
        }
      >
        <div className="flex items-center justify-between rounded-[1.45rem] border border-white/10 bg-black/30 px-4 py-3">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.28em] text-[#7FE0A8]">
              Frya no WhatsApp
            </p>
            <p className="text-sm text-white/62">
              Respondendo, retomando e organizando sem pausa
            </p>
          </div>
          <div className="rounded-full border border-[#0B6B3A]/45 bg-[#0B6B3A]/16 px-3 py-1 text-xs text-[#A6F1C2]">
            online
          </div>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[1.08fr_0.92fr]">
          <Card className="rounded-[1.8rem] border-white/12 bg-white/[0.05] p-5">
            <CardHeader className="space-y-1">
              <p className="text-sm text-white/52">Cliente - 09:14</p>
            </CardHeader>
            <CardContent className="mt-4 space-y-3">
              <AnimatePresence mode="sync">
                {visibleCount >= 1 ? (
                  <motion.div
                    key={`client-${visibleCount >= 1}`}
                    initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
                    animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
                    exit={prefersReducedMotion ? undefined : { opacity: 0, y: -6 }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                    className="w-fit max-w-[90%] rounded-[1.35rem] bg-white/8 px-4 py-3 text-sm leading-6 text-white/88"
                  >
                    Oi, ainda tem horario pra sexta?
                  </motion.div>
                ) : null}
              </AnimatePresence>

              <AnimatePresence mode="sync">
                {visibleCount >= 2 ? (
                  <motion.div
                    key={`reply-${visibleCount >= 2}`}
                    initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
                    animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
                    exit={prefersReducedMotion ? undefined : { opacity: 0, y: -6 }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                    className="ml-auto w-fit max-w-[92%] rounded-[1.35rem] bg-[#0B6B3A] px-4 py-3 text-sm leading-6 text-white"
                  >
                    Tem sim. Posso te mandar os horarios livres agora e te lembrar
                    mais tarde se voce nao fechar hoje.
                  </motion.div>
                ) : null}
              </AnimatePresence>

              <AnimatePresence mode="sync">
                {visibleCount >= 3 ? (
                  <motion.div
                    key={`follow-${visibleCount >= 3}`}
                    initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
                    animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
                    exit={prefersReducedMotion ? undefined : { opacity: 0, y: -6 }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                    className="flex items-center gap-2 text-xs text-[#F2C94C]"
                  >
                    <span className="h-2 w-2 rounded-full bg-[#F2C94C]" />
                    Follow-up automatico agendado
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </CardContent>
          </Card>

          <div className="space-y-4">
            {signalCards.map((item, index) => (
              <FloatingReveal key={item.label} delay={index * 0.08}>
                <Card className="rounded-[1.65rem] border-white/10 bg-white/[0.04] p-5 transition duration-300 hover:-translate-y-1 hover:border-[#0B6B3A]/55 hover:shadow-[0_24px_70px_rgba(11,107,58,0.18)]">
                  <p className="text-xs uppercase tracking-[0.24em] text-white/44">
                    {item.label}
                  </p>
                  <p className="mt-3 text-4xl font-semibold tracking-[-0.04em] text-white">
                    {item.value}
                  </p>
                </Card>
              </FloatingReveal>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function PainCard({ copy, delay }: { copy: string; delay: number }) {
  return (
    <FloatingReveal delay={delay}>
      <Card className="rounded-[1.8rem] border-white/10 bg-white/[0.05] p-6 transition duration-300 hover:-translate-y-1 hover:border-[#F2C94C]/35 hover:shadow-[0_24px_70px_rgba(242,201,76,0.12)]">
        <div className="flex items-center gap-3">
          <div className="h-2.5 w-2.5 rounded-full bg-[#F2C94C]" />
          <p className="text-lg text-white/88">{copy}</p>
        </div>
      </Card>
    </FloatingReveal>
  );
}

function StepCard({
  step,
  title,
  copy,
  delay,
}: {
  step: string;
  title: string;
  copy: string;
  delay: number;
}) {
  return (
    <FloatingReveal delay={delay}>
      <Card className="group rounded-[1.9rem] border-white/10 bg-white/[0.05] p-7 transition duration-300 hover:-translate-y-1.5 hover:border-[#0B6B3A]/55 hover:shadow-[0_28px_80px_rgba(11,107,58,0.2)]">
        <div className="flex items-center justify-between">
          <p className="text-sm uppercase tracking-[0.34em] text-white/34">{step}</p>
          <div className="h-10 w-10 rounded-full border border-white/10 bg-white/[0.05] transition duration-300 group-hover:border-[#0B6B3A]/55 group-hover:bg-[#0B6B3A]/10" />
        </div>
        <p className="mt-10 text-2xl font-semibold tracking-[-0.04em] text-white">
          {title}
        </p>
        <p className="mt-4 text-sm leading-7 text-white/62">{copy}</p>
      </Card>
    </FloatingReveal>
  );
}

function ProofCard({
  name,
  segment,
  result,
  delay,
}: {
  name: string;
  segment: string;
  result: string;
  delay: number;
}) {
  return (
    <FloatingReveal delay={delay}>
      <Card className="rounded-[1.8rem] border-white/10 bg-white/[0.05] p-6 transition duration-300 hover:-translate-y-1 hover:border-white/18">
        <p className="text-sm uppercase tracking-[0.24em] text-white/38">{segment}</p>
        <p className="mt-4 text-2xl font-semibold tracking-[-0.04em] text-white">
          {name}
        </p>
        <p className="mt-3 text-sm leading-6 text-white/62">{result}</p>
      </Card>
    </FloatingReveal>
  );
}

export function FryaLanding({ className }: { className?: string }) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <main className={cn(className, "relative isolate overflow-hidden bg-[#030504] text-white")}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(11,107,58,0.2),transparent_30%),radial-gradient(circle_at_82%_18%,rgba(242,201,76,0.08),transparent_18%),linear-gradient(180deg,rgba(255,255,255,0.02),transparent_22%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.03)_0,transparent_28%),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(180deg,rgba(255,255,255,0.02)_1px,transparent_1px)] [background-size:100%_100%,88px_88px,88px_88px] [mask-image:linear-gradient(180deg,white,transparent_88%)] opacity-35" />

      <div className="relative mx-auto flex max-w-7xl flex-col gap-24 px-6 pb-24 pt-10 sm:pt-16 lg:px-10 lg:pb-32">
        <section className="grid gap-14 pt-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:pt-14">
          <motion.div
            className="space-y-8"
            variants={heroContainerVariants}
            initial="hidden"
            animate="show"
          >
            <motion.div variants={heroItemVariants}>
              <SectionEyebrow>Feita para quem vende no WhatsApp</SectionEyebrow>
            </motion.div>

            <div className="space-y-6">
              <motion.h1
                variants={heroItemVariants}
                className="max-w-4xl text-balance text-5xl font-semibold leading-[0.92] tracking-[-0.06em] text-white sm:text-6xl lg:text-7xl"
              >
                Sua empresa responde clientes sozinha no WhatsApp.
              </motion.h1>
              <motion.p
                variants={heroItemVariants}
                className="max-w-2xl text-lg leading-8 text-white/68 sm:text-xl"
              >
                A Frya atende, faz follow-up e organiza seus leads automaticamente.
              </motion.p>
            </div>

            <motion.form
              variants={heroItemVariants}
              action="/register"
              method="GET"
              className="flex flex-col gap-3 rounded-[1.9rem] border border-white/12 bg-white/[0.05] p-3 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:flex-row"
            >
              <Input
                type="email"
                name="email"
                placeholder="Seu melhor email"
                className="h-14 rounded-2xl border-white/8 bg-black/25 px-5 text-base focus:border-[#0B6B3A]/55 focus:bg-black/35"
                aria-label="Seu melhor email"
              />
              <GlowButton type="submit" className="px-7 hover:bg-[#0E7C44]">
                Comecar gratis
              </GlowButton>
            </motion.form>

            <motion.div
              variants={heroItemVariants}
              className="flex flex-wrap gap-3 text-sm text-white/54"
            >
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2">
                Sem cartao
              </span>
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2">
                Leva menos de 2 minutos
              </span>
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2">
                Feita para o Brasil
              </span>
            </motion.div>
          </motion.div>

          <HeroPreview />
        </section>

        <section className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <Reveal>
            <SectionHeading
              eyebrow="Dor real"
              title="Voce esta perdendo clientes todos os dias."
              description="Quando a resposta atrasa, o lead esfria. Quando o follow-up some, a venda tambem."
            />
          </Reveal>

          <div className="grid gap-4">
            {pains.map((pain, index) => (
              <PainCard key={pain} copy={pain} delay={index * 0.08} />
            ))}
            <FloatingReveal delay={0.24}>
              <Card className="rounded-[1.9rem] border-[#F2C94C]/20 bg-[#F2C94C]/8 p-6 shadow-[0_24px_80px_rgba(242,201,76,0.08)]">
                <p className="text-xs uppercase tracking-[0.3em] text-[#F2C94C]">
                  custo invisivel
                </p>
                <p className="mt-4 text-2xl font-semibold tracking-[-0.04em] text-white">
                  Cada conversa esquecida no WhatsApp ja esta custando dinheiro.
                </p>
              </Card>
            </FloatingReveal>
          </div>
        </section>

        <section className="grid gap-8 lg:grid-cols-[1fr_1fr] lg:items-end">
          <Reveal>
            <SectionHeading
              eyebrow="Solucao"
              title="A primeira funcionaria digital feita para o Brasil."
              description="A Frya trabalha como gente do time: responde, retoma contato e deixa tudo organizado. Nao e uma caixa de ferramentas para voce operar o dia inteiro."
            />
          </Reveal>

          <div className="grid gap-4 sm:grid-cols-3">
            {[
              "Responde em segundos",
              "Retoma quem sumiu",
              "Organiza cada conversa",
            ].map((item, index) => (
              <FloatingReveal key={item} delay={index * 0.08}>
                <Card className="rounded-[1.6rem] border-white/10 bg-white/[0.05] p-5 transition duration-300 hover:-translate-y-1 hover:border-[#0B6B3A]/45">
                  <p className="text-sm leading-6 text-white/78">{item}</p>
                </Card>
              </FloatingReveal>
            ))}
          </div>
        </section>

        <section className="space-y-10">
          <Reveal>
            <SectionHeading
              eyebrow="Como funciona"
              title="Simples o suficiente para entrar na sua operacao hoje."
              description="Sem fluxo complexo. Sem treinar equipe em outra plataforma."
            />
          </Reveal>

          <div className="grid gap-4 lg:grid-cols-3">
            {steps.map((item, index) => (
              <StepCard
                key={item.step}
                step={item.step}
                title={item.title}
                copy={item.copy}
                delay={index * 0.08}
              />
            ))}
          </div>
        </section>

        <section className="space-y-10">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <Reveal>
              <SectionHeading
                eyebrow="Prova social"
                title="Mais de 120 empresas ja estao usando"
                description="Agencias, clinicas e servicos que vendem por WhatsApp e nao querem mais depender de memoria para faturar."
              />
            </Reveal>
            <Reveal delay={0.12}>
              <p className="max-w-sm text-sm leading-6 text-white/46">
                Placeholders realistas para a landing enquanto os cases oficiais entram.
              </p>
            </Reveal>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {proofCards.map((card, index) => (
              <ProofCard key={card.name} {...card} delay={index * 0.08} />
            ))}
          </div>
        </section>

        <Reveal>
          <section>
            <motion.div
              animate={prefersReducedMotion ? undefined : { y: [0, -4, 0] }}
              transition={
                prefersReducedMotion
                  ? undefined
                  : {
                      duration: 4,
                      ease: "easeInOut",
                      repeat: Number.POSITIVE_INFINITY,
                    }
              }
            >
              <Card className="rounded-[2.25rem] border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.04))] p-8 shadow-[0_30px_120px_rgba(0,0,0,0.4)] backdrop-blur-2xl sm:p-10 lg:p-12">
                <div className="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
                  <div className="max-w-2xl space-y-5">
                    <SectionEyebrow>Ultima chamada</SectionEyebrow>
                    <div className="space-y-4">
                      <h2 className="text-4xl font-semibold tracking-[-0.05em] text-white sm:text-5xl">
                        Comecar gratis agora
                      </h2>
                      <p className="text-lg leading-8 text-white/64">
                        Leva menos de 2 minutos para colocar a Frya no ar e parar de
                        perder conversa boa no WhatsApp.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <GlowButton asLink href="/register">
                      Comecar gratis agora
                    </GlowButton>
                    <motion.div
                      whileHover={prefersReducedMotion ? undefined : { scale: 1.02 }}
                      whileTap={prefersReducedMotion ? undefined : { scale: 0.995 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                    >
                      <Link
                        href="/login"
                        className="inline-flex h-14 items-center justify-center rounded-2xl border border-white/12 bg-white/[0.04] px-8 text-base font-semibold text-white/84 transition duration-300 hover:border-white/20 hover:bg-white/[0.08]"
                      >
                        Entrar
                      </Link>
                    </motion.div>
                  </div>
                </div>
              </Card>
            </motion.div>
          </section>
        </Reveal>
      </div>
    </main>
  );
}
