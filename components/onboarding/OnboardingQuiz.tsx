"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useReducer, useState } from "react";
import {
  Controller,
  useFieldArray,
  useForm,
  useWatch,
  type Path,
} from "react-hook-form";
import { useRouter } from "next/navigation";
import { QuizStep } from "@/components/onboarding/QuizStep";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  ONBOARDING_ACTION_OPTIONS,
  ONBOARDING_PAYMENT_METHOD_OPTIONS,
  ONBOARDING_SEGMENT_OPTIONS,
  ONBOARDING_TONE_OPTIONS,
  createEmptyOnboardingQuizValues,
  formatBrazilianPhone,
  formatCurrency,
  formatCurrencyInput,
  getActionOption,
  getPaymentMethodLabel,
  getToneOption,
  onboardingQuizSchema,
  resolveSegmentValue,
  sanitizeOnboardingQuizInput,
  type OnboardingQuizData,
  type OnboardingQuizFormInput,
} from "@/lib/onboarding-quiz";

interface OnboardingQuizProps {
  initialValues?: OnboardingQuizFormInput;
}

interface OnboardingApiResponse {
  success?: boolean;
  redirectTo?: string;
  error?: string;
  fieldErrors?: Record<string, string>;
}

interface QuizState {
  step: number;
  direction: 1 | -1;
  snapshot: OnboardingQuizFormInput;
}

type QuizAction =
  | { type: "sync"; snapshot: OnboardingQuizFormInput }
  | { type: "next" }
  | { type: "prev" };

const TOTAL_STEPS = 7;

const stepCopy = [
  {
    eyebrow: "Step 1",
    title: "Vamos configurar seu secretario digital",
    description:
      "Comecamos pelo basico para a Frya entrar no WhatsApp com o contexto certo.",
  },
  {
    eyebrow: "Step 2",
    title: "Qual o segmento do seu negocio?",
    description:
      "Escolha a categoria que mais combina com sua operacao hoje.",
  },
  {
    eyebrow: "Step 3",
    title: "O que voce vende?",
    description:
      "Adicione os principais produtos ou servicos para a Frya aprender seu catalogo.",
  },
  {
    eyebrow: "Step 4",
    title: "Como seus clientes pagam?",
    description:
      "Isso ajuda o secretario a registrar vendas e organizar cobrancas do jeito certo.",
  },
  {
    eyebrow: "Step 5",
    title: "O que voce quer que seu secretario faca?",
    description:
      "Ative as capacidades que mais aliviam sua rotina hoje.",
  },
  {
    eyebrow: "Step 6",
    title: "Como seu secretario deve se comunicar?",
    description:
      "Escolha o tom que mais parece com sua empresa no WhatsApp.",
  },
  {
    eyebrow: "Step 7",
    title: "Confirmar ativacao",
    description:
      "Revise o resumo e ative sua operacao no WhatsApp com um clique.",
  },
] as const;

const stepFields: Array<
  Array<Path<OnboardingQuizFormInput>> | Path<OnboardingQuizFormInput>
> = [
  ["businessName", "whatsappNumber"],
  ["segment", "otherSegment"],
  "products",
  "paymentMethods",
  "actions",
  "tone",
  [],
];

function quizReducer(state: QuizState, action: QuizAction): QuizState {
  switch (action.type) {
    case "sync":
      return {
        ...state,
        snapshot: action.snapshot,
      };
    case "next":
      return {
        ...state,
        step: Math.min(state.step + 1, TOTAL_STEPS - 1),
        direction: 1,
      };
    case "prev":
      return {
        ...state,
        step: Math.max(state.step - 1, 0),
        direction: -1,
      };
    default:
      return state;
  }
}

function StepBadge({
  active,
  complete,
  label,
}: {
  active: boolean;
  complete: boolean;
  label: string;
}) {
  return (
    <div
      className={cn(
        "flex h-8 min-w-8 items-center justify-center rounded-full border px-3 text-xs font-medium",
        complete
          ? "border-[#00FF88]/40 bg-[#00FF88]/16 text-[#00FF88]"
          : active
            ? "border-[#00FF88]/35 bg-white/10 text-white"
            : "border-white/10 bg-white/[0.03] text-white/45",
      )}
    >
      {label}
    </div>
  );
}

function SelectableCard({
  selected,
  onClick,
  title,
  description,
  icon,
  className,
}: {
  selected: boolean;
  onClick: () => void;
  title: string;
  description?: string;
  icon?: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full rounded-[1.5rem] border px-4 py-4 text-left transition duration-300",
        selected
          ? "border-[#00FF88]/45 bg-[#00FF88]/10 shadow-[0_0_0_1px_rgba(0,255,136,0.12)]"
          : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]",
        className,
      )}
      aria-pressed={selected}
    >
      <div className="flex items-start gap-3">
        {icon ? (
          <span className="mt-0.5 text-xl leading-none">{icon}</span>
        ) : null}
        <div className="min-w-0">
          <p className="text-sm font-medium text-white">{title}</p>
          {description ? (
            <p className="mt-2 text-sm leading-6 text-white/58">{description}</p>
          ) : null}
        </div>
      </div>
    </button>
  );
}

function SummaryBlock({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[1.35rem] border border-white/10 bg-white/[0.03] p-4">
      <p className="text-[11px] uppercase tracking-[0.28em] text-white/40">
        {label}
      </p>
      <p className="mt-2 text-sm leading-6 text-white">{value}</p>
    </div>
  );
}

export function OnboardingQuiz({
  initialValues = createEmptyOnboardingQuizValues(),
}: OnboardingQuizProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const form = useForm<
    OnboardingQuizFormInput,
    undefined,
    OnboardingQuizData
  >({
    resolver: zodResolver(onboardingQuizSchema),
    defaultValues: sanitizeOnboardingQuizInput(initialValues),
    mode: "onSubmit",
    reValidateMode: "onChange",
  });
  const [state, dispatch] = useReducer(quizReducer, {
    step: 0,
    direction: 1,
    snapshot: sanitizeOnboardingQuizInput(initialValues),
  });
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "products",
  });
  const watchedValues = useWatch({ control: form.control });
  const segment = useWatch({ control: form.control, name: "segment" });
  const paymentMethods = useWatch({
    control: form.control,
    name: "paymentMethods",
  });
  const actions = useWatch({ control: form.control, name: "actions" });
  const tone = useWatch({ control: form.control, name: "tone" });
  const progress = ((state.step + 1) / TOTAL_STEPS) * 100;
  const isFinalStep = state.step === TOTAL_STEPS - 1;
  const stepMeta = stepCopy[state.step];

  useEffect(() => {
    void router.prefetch("/dashboard");
  }, [router]);

  useEffect(() => {
    dispatch({
      type: "sync",
      snapshot: sanitizeOnboardingQuizInput(watchedValues),
    });
  }, [watchedValues]);

  function toggleArrayValue(
    field: "paymentMethods" | "actions",
    value: string,
  ) {
    setServerError(null);
    const current = form.getValues(field);

    if (current.includes(value)) {
      form.setValue(
        field,
        current.filter((item) => item !== value),
        {
          shouldDirty: true,
          shouldTouch: true,
          shouldValidate: true,
        },
      );
      return;
    }

    form.setValue(field, [...current, value], {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
  }

  async function goToNextStep() {
    setServerError(null);
    const fieldsToValidate = stepFields[state.step];
    const isValid = Array.isArray(fieldsToValidate)
      ? await form.trigger(fieldsToValidate, { shouldFocus: true })
      : await form.trigger(fieldsToValidate, { shouldFocus: true });

    if (isValid) {
      dispatch({ type: "next" });
    }
  }

  function goToPreviousStep() {
    setServerError(null);
    dispatch({ type: "prev" });
  }

  function applyServerErrors(fieldErrors: Record<string, string> | undefined) {
    if (!fieldErrors) {
      return;
    }

    for (const [path, message] of Object.entries(fieldErrors)) {
      form.setError(path as Path<OnboardingQuizFormInput>, {
        type: "server",
        message,
      });
    }
  }

  async function submitQuiz(values: OnboardingQuizData) {
    setServerError(null);

    const response = await fetch("/api/onboarding", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(values),
    });

    const payload = (await response.json()) as OnboardingApiResponse;

    if (!response.ok || !payload.success) {
      applyServerErrors(payload.fieldErrors);
      setServerError(
        payload.error ?? "Nao foi possivel ativar o secretario agora.",
      );
      return;
    }

    router.push(payload.redirectTo ?? "/dashboard");
  }

  const summaryProducts = state.snapshot.products
    .filter((product) => product.name.trim())
    .map((product) => {
      const priceString =
        typeof product.price === "number" ? String(product.price) : product.price;
      const parsedPrice = Number.parseFloat(
        priceString.replace(/\./g, "").replace(",", "."),
      );

      return Number.isFinite(parsedPrice) && parsedPrice > 0
        ? `${product.name} (${formatCurrency(parsedPrice)})`
        : product.name;
    });
  const summarySegment = resolveSegmentValue(state.snapshot);
  const summaryPayments = state.snapshot.paymentMethods.map(getPaymentMethodLabel);
  const summaryActions = state.snapshot.actions
    .map((value) => getActionOption(value)?.title ?? value)
    .filter(Boolean);
  const summaryTone = getToneOption(state.snapshot.tone)?.preview ?? "-";

  return (
    <section className="relative overflow-hidden bg-[#0a0a0a]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(0,255,136,0.16),_transparent_36%),linear-gradient(180deg,rgba(255,255,255,0.02),transparent_28%)]" />
      <div className="absolute inset-x-0 top-24 h-40 bg-[radial-gradient(circle,_rgba(0,255,136,0.16),_transparent_60%)] blur-3xl" />

      <div className="relative mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl flex-col px-4 py-8 sm:px-6 lg:flex-row lg:items-start lg:gap-8 lg:px-8 lg:py-12">
        <div className="mb-8 w-full lg:sticky lg:top-24 lg:mb-0 lg:max-w-sm">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-5 backdrop-blur">
            <p className="text-xs uppercase tracking-[0.32em] text-[#00FF88]/72">
              Frya AI onboarding
            </p>
            <h1 className="mt-4 font-display text-3xl leading-tight text-white sm:text-4xl">
              Configure a operacao do seu secretario em poucos minutos
            </h1>
            <p className="mt-4 text-sm leading-6 text-white/58">
              Pensado para PMEs brasileiras que vivem no WhatsApp e precisam
              organizar vendas, cobrancas e agendamentos sem burocracia.
            </p>

            <div className="mt-6 space-y-3">
              <div className="flex items-center justify-between text-xs uppercase tracking-[0.28em] text-white/42">
                <span>Progresso</span>
                <span>{state.step + 1}/7</span>
              </div>
              <Progress
                value={progress}
                className="h-2.5 bg-white/[0.06] [&>div]:bg-[#00FF88]"
              />
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              {stepCopy.map((step, index) => (
                <StepBadge
                  key={step.title}
                  active={index === state.step}
                  complete={index < state.step}
                  label={String(index + 1)}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="w-full lg:flex-1">
          <form
            onSubmit={form.handleSubmit(submitQuiz)}
            className="space-y-4"
          >
            <QuizStep
              key={stepMeta.title}
              eyebrow={stepMeta.eyebrow}
              title={stepMeta.title}
              description={stepMeta.description}
              direction={state.direction}
              footer={
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-sm text-white/45">
                    {serverError ? (
                      <span className="text-amber-200">{serverError}</span>
                    ) : (
                      "Tudo fica salvo e sincronizado com o seu workspace."
                    )}
                  </div>
                  <div className="flex w-full flex-col-reverse gap-3 sm:w-auto sm:flex-row">
                    {state.step > 0 ? (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={goToPreviousStep}
                        className="w-full border-white/12 bg-transparent text-white sm:w-auto"
                      >
                        Voltar
                      </Button>
                    ) : null}
                    {isFinalStep ? (
                      <Button
                        type="submit"
                        disabled={form.formState.isSubmitting}
                        className="w-full bg-[#00FF88] text-black hover:bg-[#5dffb2] sm:w-auto"
                      >
                        {form.formState.isSubmitting
                          ? "Ativando..."
                          : "Ativar meu secretario no WhatsApp"}
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        onClick={goToNextStep}
                        className="w-full bg-[#00FF88] text-black hover:bg-[#5dffb2] sm:w-auto"
                      >
                        Continuar
                      </Button>
                    )}
                  </div>
                </div>
              }
            >
              {state.step === 0 ? (
                <div className="space-y-5">
                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-white">
                      Nome do negocio
                    </span>
                    <Input
                      {...form.register("businessName")}
                      placeholder="Ex.: Studio Aurora"
                      className="h-[52px] rounded-[1.35rem] border-white/10 bg-white/[0.04]"
                    />
                    {form.formState.errors.businessName ? (
                      <p className="text-sm text-amber-200">
                        {form.formState.errors.businessName.message}
                      </p>
                    ) : null}
                  </label>

                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-white">
                      Seu WhatsApp
                    </span>
                    <Controller
                      control={form.control}
                      name="whatsappNumber"
                      render={({ field }) => (
                        <Input
                          {...field}
                          inputMode="numeric"
                          placeholder="(11) 91234-5678"
                          className="h-[52px] rounded-[1.35rem] border-white/10 bg-white/[0.04]"
                          onChange={(event) => {
                            field.onChange(
                              formatBrazilianPhone(event.target.value),
                            );
                          }}
                        />
                      )}
                    />
                    {form.formState.errors.whatsappNumber ? (
                      <p className="text-sm text-amber-200">
                        {form.formState.errors.whatsappNumber.message}
                      </p>
                    ) : null}
                  </label>
                </div>
              ) : null}

              {state.step === 1 ? (
                <div className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    {ONBOARDING_SEGMENT_OPTIONS.map((option) => (
                      <SelectableCard
                        key={option.value}
                        selected={segment === option.value}
                        onClick={() => {
                          setServerError(null);
                          form.setValue("segment", option.value, {
                            shouldDirty: true,
                            shouldTouch: true,
                            shouldValidate: true,
                          });

                          if (option.value !== "Outro") {
                            form.setValue("otherSegment", "", {
                              shouldDirty: true,
                              shouldTouch: true,
                              shouldValidate: true,
                            });
                          }
                        }}
                        title={option.label}
                        className="min-h-24"
                      />
                    ))}
                  </div>

                  {segment === "Outro" ? (
                    <label className="block space-y-2">
                      <span className="text-sm font-medium text-white">
                        Qual e o seu segmento?
                      </span>
                      <Input
                        {...form.register("otherSegment")}
                        placeholder="Ex.: Consultoria juridica"
                        className="h-[52px] rounded-[1.35rem] border-white/10 bg-white/[0.04]"
                      />
                    </label>
                  ) : null}

                  {form.formState.errors.segment ? (
                    <p className="text-sm text-amber-200">
                      {form.formState.errors.segment.message}
                    </p>
                  ) : null}
                  {form.formState.errors.otherSegment ? (
                    <p className="text-sm text-amber-200">
                      {form.formState.errors.otherSegment.message}
                    </p>
                  ) : null}
                </div>
              ) : null}

              {state.step === 2 ? (
                <div className="space-y-4">
                  <div className="space-y-3">
                    {fields.map((field, index) => (
                      <div
                        key={field.id}
                        className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4"
                      >
                        <div className="grid gap-3 sm:grid-cols-[1fr_180px_auto] sm:items-end">
                          <label className="space-y-2">
                            <span className="text-sm font-medium text-white">
                              Nome
                            </span>
                            <Input
                              {...form.register(`products.${index}.name`)}
                              placeholder="Ex.: Corte feminino"
                              className="rounded-[1.2rem] border-white/10 bg-white/[0.04]"
                            />
                          </label>

                          <label className="space-y-2">
                            <span className="text-sm font-medium text-white">
                              Preco
                            </span>
                            <Controller
                              control={form.control}
                              name={`products.${index}.price`}
                              render={({ field: priceField }) => (
                                <div className="relative">
                                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-white/40">
                                    R$
                                  </span>
                                  <Input
                                    value={
                                      typeof priceField.value === "string"
                                        ? priceField.value
                                        : ""
                                    }
                                    onBlur={priceField.onBlur}
                                    name={priceField.name}
                                    ref={priceField.ref}
                                    inputMode="numeric"
                                    placeholder="0,00"
                                    className="rounded-[1.2rem] border-white/10 bg-white/[0.04] pl-11"
                                    onChange={(event) => {
                                      priceField.onChange(
                                        formatCurrencyInput(event.target.value),
                                      );
                                    }}
                                  />
                                </div>
                              )}
                            />
                          </label>

                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => remove(index)}
                            disabled={fields.length === 1}
                            className="h-11 rounded-[1.2rem] border border-white/10 bg-white/[0.02] text-white/65 hover:bg-white/[0.06] hover:text-white"
                          >
                            Remover
                          </Button>
                        </div>

                        {form.formState.errors.products?.[index]?.name ? (
                          <p className="mt-3 text-sm text-amber-200">
                            {form.formState.errors.products[index]?.name?.message}
                          </p>
                        ) : null}
                        {form.formState.errors.products?.[index]?.price ? (
                          <p className="mt-2 text-sm text-amber-200">
                            {form.formState.errors.products[index]?.price?.message}
                          </p>
                        ) : null}
                      </div>
                    ))}
                  </div>

                  {typeof form.formState.errors.products?.message === "string" ? (
                    <p className="text-sm text-amber-200">
                      {form.formState.errors.products.message}
                    </p>
                  ) : null}

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => append({ name: "", price: "" })}
                    className="w-full border-dashed border-[#00FF88]/30 bg-[#00FF88]/8 text-[#00FF88] hover:bg-[#00FF88]/12"
                  >
                    + Adicionar produto/servico
                  </Button>
                </div>
              ) : null}

              {state.step === 3 ? (
                <div className="grid gap-3">
                  {ONBOARDING_PAYMENT_METHOD_OPTIONS.map((method) => (
                    <SelectableCard
                      key={method.value}
                      selected={paymentMethods.includes(method.value)}
                      onClick={() =>
                        toggleArrayValue("paymentMethods", method.value)
                      }
                      title={method.label}
                    />
                  ))}

                  {form.formState.errors.paymentMethods ? (
                    <p className="text-sm text-amber-200">
                      {form.formState.errors.paymentMethods.message}
                    </p>
                  ) : null}
                </div>
              ) : null}

              {state.step === 4 ? (
                <div className="grid gap-3">
                  {ONBOARDING_ACTION_OPTIONS.map((action) => (
                    <SelectableCard
                      key={action.value}
                      selected={actions.includes(action.value)}
                      onClick={() => toggleArrayValue("actions", action.value)}
                      title={action.title}
                      description={action.description}
                      icon={action.icon}
                    />
                  ))}

                  {form.formState.errors.actions ? (
                    <p className="text-sm text-amber-200">
                      {form.formState.errors.actions.message}
                    </p>
                  ) : null}
                </div>
              ) : null}

              {state.step === 5 ? (
                <div className="grid gap-3">
                  {ONBOARDING_TONE_OPTIONS.map((option) => (
                    <SelectableCard
                      key={option.value}
                      selected={tone === option.value}
                      onClick={() => {
                        setServerError(null);
                        form.setValue("tone", option.value, {
                          shouldDirty: true,
                          shouldTouch: true,
                          shouldValidate: true,
                        });
                      }}
                      title={option.label}
                      description={option.preview}
                    />
                  ))}

                  {form.formState.errors.tone ? (
                    <p className="text-sm text-amber-200">
                      {form.formState.errors.tone.message}
                    </p>
                  ) : null}
                </div>
              ) : null}

              {state.step === 6 ? (
                <div className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <SummaryBlock
                      label="Negocio"
                      value={state.snapshot.businessName || "-"}
                    />
                    <SummaryBlock
                      label="WhatsApp"
                      value={state.snapshot.whatsappNumber || "-"}
                    />
                    <SummaryBlock
                      label="Segmento"
                      value={summarySegment || "-"}
                    />
                    <SummaryBlock
                      label="Pagamento"
                      value={summaryPayments.join(", ") || "-"}
                    />
                  </div>

                  <SummaryBlock
                    label="Produtos / Servicos"
                    value={summaryProducts.join(", ") || "-"}
                  />
                  <SummaryBlock
                    label="Tarefas ativadas"
                    value={summaryActions.join(", ") || "-"}
                  />
                  <SummaryBlock
                    label="Tom de voz"
                    value={summaryTone}
                  />
                </div>
              ) : null}
            </QuizStep>
          </form>
        </div>
      </div>
    </section>
  );
}
