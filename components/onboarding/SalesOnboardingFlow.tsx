"use client";

import {
  useEffect,
  useMemo,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import {
  ONBOARDING_SEGMENTS,
  ONBOARDING_SIZES,
  ONBOARDING_TICKET_RANGES,
  ONBOARDING_TONES,
  createEmptyOnboardingSetupValues,
  formatTonePreview,
  isOnboardingStepComplete,
  sanitizeOnboardingSetupInput,
  validateOnboardingStep,
  type OnboardingSetupFormValues,
  type OnboardingSetupValidationErrors,
  type OnboardingWhatsAppIntent,
} from "@/lib/onboarding-flow";
import { cn } from "@/lib/utils";

interface SalesOnboardingFlowProps {
  initialValues?: OnboardingSetupFormValues;
}

interface SetupResponse {
  success?: boolean;
  redirectTo?: string;
  error?: string;
  fieldErrors?: OnboardingSetupValidationErrors;
}

const TOTAL_STEPS = 5;

const stepMeta = [
  {
    eyebrow: "Step 1 de 5",
    title: "Sobre sua empresa",
    description:
      "Vamos entender o basico do negocio para configurar a Frya no contexto certo.",
  },
  {
    eyebrow: "Step 2 de 5",
    title: "Seu cliente ideal",
    description:
      "Aqui a gente define quem a Frya vai atrair, qual dor ela deve capturar e em qual faixa de ticket ela atua.",
  },
  {
    eyebrow: "Step 3 de 5",
    title: "Tom da sua Frya",
    description:
      "Escolha como sua vendedora AI deve soar nas conversas do WhatsApp.",
  },
  {
    eyebrow: "Step 4 de 5",
    title: "Conectar WhatsApp",
    description:
      "Voce pode seguir sem integrar agora. Sua Frya ja funciona no chat do dashboard.",
  },
  {
    eyebrow: "Step 5 de 5",
    title: "Frya pronta!",
    description:
      "Sua SDR foi criada com o contexto do negocio e esta pronta para entrar em operacao.",
  },
] as const;

function FieldShell({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-2">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-white">{label}</span>
        {hint ? (
          <span className="text-xs text-white/38">
            {hint}
          </span>
        ) : null}
      </div>
      {children}
      {error ? <p className="text-sm text-amber-200">{error}</p> : null}
    </label>
  );
}

function SelectField({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
  placeholder: string;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="flex h-11 w-full appearance-none rounded-2xl border border-white/10 bg-white/5 px-4 pr-11 text-sm text-white outline-none focus:border-primary/40 focus:bg-white/8"
      >
        <option value="" disabled className="bg-[#0d1712] text-white/40">
          {placeholder}
        </option>
        {options.map((option) => (
          <option key={option} value={option} className="bg-[#0d1712] text-white">
            {option}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-xs text-white/40">
        ▼
      </span>
    </div>
  );
}

function SummaryRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4">
      <p className="text-xs uppercase tracking-[0.28em] text-white/35">{label}</p>
      <p className="mt-3 text-sm leading-6 text-white/78">{value}</p>
    </div>
  );
}

export function SalesOnboardingFlow({
  initialValues,
}: SalesOnboardingFlowProps) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<OnboardingSetupFormValues>(() =>
    initialValues
      ? sanitizeOnboardingSetupInput(initialValues)
      : createEmptyOnboardingSetupValues(),
  );
  const [errors, setErrors] = useState<OnboardingSetupValidationErrors>({});
  const [submitError, setSubmitError] = useState("");
  const [redirectTo, setRedirectTo] = useState("/dashboard");
  const [showWhatsAppPlaceholder, setShowWhatsAppPlaceholder] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (step === 4) {
      void router.prefetch(redirectTo);
    }
  }, [redirectTo, router, step]);

  const progressValue = useMemo(
    () => Math.round(((step + 1) / TOTAL_STEPS) * 100),
    [step],
  );
  const tonePreview = formatTonePreview(values.toneId, values);
  const currentStepValid =
    step <= 2 ? isOnboardingStepComplete(step, values) : true;
  const selectedTone =
    ONBOARDING_TONES.find((tone) => tone.id === values.toneId) ?? null;

  function updateField<K extends keyof OnboardingSetupFormValues>(
    key: K,
    value: OnboardingSetupFormValues[K],
  ) {
    setValues((current) => ({
      ...current,
      [key]: value,
    }));
    setErrors((current) => ({
      ...current,
      [key]: undefined,
    }));
    setSubmitError("");
  }

  function goToNextStep() {
    const nextErrors = validateOnboardingStep(step, values);

    if (Object.values(nextErrors).some(Boolean)) {
      setErrors((current) => ({
        ...current,
        ...nextErrors,
      }));
      return;
    }

    setStep((current) => Math.min(current + 1, TOTAL_STEPS - 1));
  }

  function goToPreviousStep() {
    setSubmitError("");
    setShowWhatsAppPlaceholder(false);
    setStep((current) => Math.max(current - 1, 0));
  }

  function focusFirstInvalidStep(fieldErrors: OnboardingSetupValidationErrors) {
    if (fieldErrors.companyName || fieldErrors.product || fieldErrors.segment || fieldErrors.size) {
      setStep(0);
      return;
    }

    if (fieldErrors.icp || fieldErrors.mainPain || fieldErrors.averageTicket) {
      setStep(1);
      return;
    }

    if (fieldErrors.toneId) {
      setStep(2);
    }
  }

  function completeOnboarding(whatsappIntent: OnboardingWhatsAppIntent) {
    setSubmitError("");
    setErrors({});

    startTransition(() => {
      void (async () => {
        try {
          const response = await fetch("/api/onboarding/setup", {
            method: "POST",
            headers: {
              "content-type": "application/json",
            },
            body: JSON.stringify({
              ...values,
              whatsappIntent,
            }),
          });

          const data = (await response.json().catch(() => ({}))) as SetupResponse;

          if (!response.ok || !data.success) {
            const fieldErrors = data.fieldErrors ?? {};

            if (Object.keys(fieldErrors).length > 0) {
              setErrors(fieldErrors);
              focusFirstInvalidStep(fieldErrors);
            }

            setSubmitError(
              data.error ?? "Nao foi possivel concluir o onboarding agora.",
            );
            return;
          }

          updateField("whatsappIntent", whatsappIntent);
          setRedirectTo(data.redirectTo ?? "/dashboard");
          setStep(4);
        } catch {
          setSubmitError("Nao foi possivel concluir o onboarding agora.");
        }
      })();
    });
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-81px)] w-full max-w-7xl items-start px-4 py-6 sm:px-6 lg:px-8">
      <div className="grid w-full gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <section className="space-y-6">
          <Card className="overflow-hidden border-white/12 bg-[radial-gradient(circle_at_top_left,rgba(11,107,58,0.18),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))]">
            <CardHeader className="space-y-4">
              <Badge variant="accent">Frya onboarding</Badge>
              <div className="space-y-3">
                <CardTitle className="max-w-xl text-4xl leading-tight">
                  Configure sua vendedora AI em poucos minutos.
                </CardTitle>
                <CardDescription className="max-w-xl text-base text-white/62">
                  Sem chat longo, sem esperar Claude, sem 4 agentes ao mesmo tempo.
                  Voce define o contexto comercial e a Frya ja nasce pronta para vender.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-3">
              {[
                "WhatsApp-first para PMEs brasileiras",
                "Prompt SDR gerado localmente",
                "Teste imediato no dashboard",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-[1.5rem] border border-white/10 bg-black/20 p-4 text-sm leading-6 text-white/72"
                >
                  {item}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-white/12 bg-surface-strong/90">
            <CardHeader>
              <p className="text-xs uppercase tracking-[0.3em] text-white/35">
                o que vamos definir
              </p>
              <CardTitle className="mt-2 text-2xl">Playbook inicial da Frya</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                {
                  title: "Empresa e oferta",
                  copy: values.companyName || "Nome, segmento e o que voce vende.",
                },
                {
                  title: "ICP e principal dor",
                  copy:
                    values.icp || "Pra quem voce vende e qual problema a Frya deve atacar.",
                },
                {
                  title: "Tom comercial",
                  copy: selectedTone?.label || "Como sua Frya deve conversar no WhatsApp.",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-[1.4rem] border border-white/10 bg-white/[0.03] p-4"
                >
                  <p className="text-sm font-medium text-white">{item.title}</p>
                  <p className="mt-2 text-sm leading-6 text-white/56">{item.copy}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        <Card className="overflow-hidden border-white/12 bg-surface-strong/95 p-0">
          <CardHeader className="border-b border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),transparent)] px-6 py-6 sm:px-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <Badge variant="muted">{stepMeta[step].eyebrow}</Badge>
                <CardTitle className="mt-4">{stepMeta[step].title}</CardTitle>
                <CardDescription className="mt-2 max-w-2xl">
                  {stepMeta[step].description}
                </CardDescription>
              </div>
              <div className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white/68">
                {progressValue}% concluido
              </div>
            </div>
            <Progress value={progressValue} className="mt-5 h-2" />
          </CardHeader>

          <CardContent className="px-6 py-6 sm:px-8 sm:py-8">
            <div key={step} className="animate-panel-in space-y-6">
              {step === 0 ? (
                <div className="grid gap-5">
                  <FieldShell
                    label="Nome da empresa"
                    error={errors.companyName}
                  >
                    <Input
                      value={values.companyName}
                      onChange={(event) =>
                        updateField("companyName", event.target.value)
                      }
                      placeholder="Ex: Agencia Prisma"
                    />
                  </FieldShell>

                  <FieldShell
                    label="O que voce vende?"
                    error={errors.product}
                  >
                    <Textarea
                      value={values.product}
                      onChange={(event) => updateField("product", event.target.value)}
                      placeholder="Ex: Consultorias de marketing digital"
                      className="min-h-28"
                    />
                  </FieldShell>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <FieldShell label="Segmento" error={errors.segment}>
                      <SelectField
                        value={values.segment}
                        onChange={(value) =>
                          updateField("segment", value as OnboardingSetupFormValues["segment"])
                        }
                        options={ONBOARDING_SEGMENTS}
                        placeholder="Selecione"
                      />
                    </FieldShell>

                    <FieldShell label="Tamanho" error={errors.size}>
                      <SelectField
                        value={values.size}
                        onChange={(value) =>
                          updateField("size", value as OnboardingSetupFormValues["size"])
                        }
                        options={ONBOARDING_SIZES}
                        placeholder="Selecione"
                      />
                    </FieldShell>
                  </div>
                </div>
              ) : null}

              {step === 1 ? (
                <div className="grid gap-5">
                  <FieldShell
                    label="Pra quem voce vende?"
                    error={errors.icp}
                  >
                    <Textarea
                      value={values.icp}
                      onChange={(event) => updateField("icp", event.target.value)}
                      placeholder="Ex: Donos de e-commerce que faturam acima de R$ 50 mil/mes"
                      className="min-h-28"
                    />
                  </FieldShell>

                  <FieldShell
                    label="Qual a maior dor do seu cliente?"
                    error={errors.mainPain}
                  >
                    <Textarea
                      value={values.mainPain}
                      onChange={(event) =>
                        updateField("mainPain", event.target.value)
                      }
                      placeholder="Ex: Nao conseguem escalar vendas sem contratar mais gente"
                      className="min-h-28"
                    />
                  </FieldShell>

                  <FieldShell label="Ticket medio" error={errors.averageTicket}>
                    <SelectField
                      value={values.averageTicket}
                      onChange={(value) =>
                        updateField(
                          "averageTicket",
                          value as OnboardingSetupFormValues["averageTicket"],
                        )
                      }
                      options={ONBOARDING_TICKET_RANGES}
                      placeholder="Selecione"
                    />
                  </FieldShell>
                </div>
              ) : null}

              {step === 2 ? (
                <div className="space-y-5">
                  <div className="grid gap-3 sm:grid-cols-2">
                    {ONBOARDING_TONES.map((tone) => {
                      const selected = values.toneId === tone.id;

                      return (
                        <button
                          key={tone.id}
                          type="button"
                          onClick={() => updateField("toneId", tone.id)}
                          className={cn(
                            "rounded-[1.6rem] border p-5 text-left transition",
                            selected
                              ? "border-primary/45 bg-primary/10 shadow-[0_0_0_1px_rgba(11,107,58,0.2)]"
                              : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]",
                          )}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-2xl">{tone.emoji}</p>
                              <p className="mt-4 text-base font-medium text-white">
                                {tone.label}
                              </p>
                            </div>
                            <span
                              className={cn(
                                "mt-1 h-3 w-3 rounded-full border",
                                selected
                                  ? "border-primary bg-primary"
                                  : "border-white/18 bg-transparent",
                              )}
                            />
                          </div>
                          <p className="mt-3 text-sm leading-6 text-white/56">
                            {tone.description}
                          </p>
                        </button>
                      );
                    })}
                  </div>

                  {errors.toneId ? (
                    <p className="text-sm text-amber-200">{errors.toneId}</p>
                  ) : null}

                  <div className="rounded-[1.75rem] border border-white/10 bg-[linear-gradient(135deg,rgba(11,107,58,0.14),rgba(255,255,255,0.03))] p-5">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.28em] text-white/35">
                          Preview da Frya
                        </p>
                        <p className="mt-2 text-sm text-white/54">
                          Exemplo de primeira mensagem no WhatsApp
                        </p>
                      </div>
                      {selectedTone ? (
                        <Badge variant="accent">{selectedTone.shortLabel}</Badge>
                      ) : null}
                    </div>

                    <div className="mt-5 max-w-[36rem] rounded-[1.4rem] border border-white/10 bg-black/20 px-4 py-4 text-sm leading-7 text-white/80">
                      {tonePreview || "Selecione um tom para ver como a Frya vai iniciar a conversa."}
                    </div>
                  </div>
                </div>
              ) : null}

              {step === 3 ? (
                <div className="space-y-5">
                  <div className="grid gap-4 sm:grid-cols-3">
                    {[
                      {
                        title: "Recebe no WhatsApp",
                        copy: "A Frya atende o lead onde a conversa ja acontece.",
                      },
                      {
                        title: "Qualifica e responde",
                        copy: "Ela identifica fit, dor e proximo passo sem perder contexto.",
                      },
                      {
                        title: "Joga no dashboard",
                        copy: "Tudo cai no pipeline para o time acompanhar e agir rapido.",
                      },
                    ].map((item) => (
                      <div
                        key={item.title}
                        className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4"
                      >
                        <p className="text-sm font-medium text-white">{item.title}</p>
                        <p className="mt-2 text-sm leading-6 text-white/56">{item.copy}</p>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-[1.5rem] border border-primary/18 bg-primary/8 p-4 text-sm leading-6 text-white/76">
                    Sua Frya funciona mesmo sem WhatsApp. Voce pode testar tudo no
                    chat do dashboard e conectar o canal depois.
                  </div>

                  {showWhatsAppPlaceholder ? (
                    <div className="rounded-[1.5rem] border border-amber-400/18 bg-amber-500/10 p-4">
                      <p className="text-sm font-medium text-amber-200">
                        Conexao de WhatsApp em breve
                      </p>
                      <p className="mt-2 text-sm leading-6 text-amber-100/80">
                        O flow de conexao ainda esta como placeholder. Enquanto isso,
                        sua Frya ja pode ser testada no dashboard.
                      </p>
                    </div>
                  ) : null}
                </div>
              ) : null}

              {step === 4 ? (
                <div className="space-y-6">
                  <div className="relative overflow-hidden rounded-[2rem] border border-primary/20 bg-[radial-gradient(circle_at_top,rgba(11,107,58,0.24),transparent_42%),linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-8">
                    <div className="absolute left-1/2 top-10 h-28 w-28 -translate-x-1/2 rounded-full bg-primary/18 blur-2xl" />
                    <div className="relative flex flex-col items-center text-center">
                      <div className="animate-float-soft animate-glow-soft flex h-28 w-28 items-center justify-center rounded-full border border-primary/30 bg-[#0b6b3a]/18 text-3xl text-white">
                        F
                      </div>
                      <Badge variant="success" className="mt-5">
                        Agente SDR criado
                      </Badge>
                      <h3 className="mt-4 font-display text-3xl text-white">
                        A Frya ja esta pronta para vender com voce.
                      </h3>
                      <p className="mt-3 max-w-2xl text-sm leading-7 text-white/62">
                        Sua vendedora AI foi configurada com contexto da empresa,
                        cliente ideal e tom comercial.
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <SummaryRow
                      label="Empresa"
                      value={values.companyName || "Nao informado"}
                    />
                    <SummaryRow
                      label="Cliente ideal"
                      value={values.icp || "Nao informado"}
                    />
                    <SummaryRow
                      label="Tom"
                      value={selectedTone?.label ?? "Nao informado"}
                    />
                  </div>
                </div>
              ) : null}
            </div>
          </CardContent>

          <div className="border-t border-white/10 px-6 py-5 sm:px-8">
            {submitError ? (
              <div className="mb-4 rounded-[1.35rem] border border-red-400/16 bg-red-500/10 px-4 py-3 text-sm text-red-100/85">
                {submitError}
              </div>
            ) : null}

            {step <= 2 ? (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                {step > 0 ? (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={goToPreviousStep}
                  >
                    Voltar
                  </Button>
                ) : (
                  <span className="hidden sm:block" />
                )}
                <Button
                  type="button"
                  onClick={goToNextStep}
                  disabled={!currentStepValid}
                >
                  Continuar
                </Button>
              </div>
            ) : null}

            {step === 3 ? (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={goToPreviousStep}
                  disabled={isPending}
                >
                  Voltar
                </Button>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      updateField("whatsappIntent", "now");
                      setShowWhatsAppPlaceholder(true);
                    }}
                    disabled={isPending}
                  >
                    Conectar agora
                  </Button>
                  <Button
                    type="button"
                    onClick={() => completeOnboarding("later")}
                    disabled={isPending}
                  >
                    {isPending ? "Criando Frya..." : "Conectar depois"}
                  </Button>
                </div>
              </div>
            ) : null}

            {step === 4 ? (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-white/52">
                  Sua Frya ja esta disponivel no dashboard.
                </p>
                <Button
                  type="button"
                  size="lg"
                  onClick={() => window.location.assign(redirectTo)}
                >
                  Ir pro Dashboard
                </Button>
              </div>
            ) : null}
          </div>
        </Card>
      </div>
    </div>
  );
}
