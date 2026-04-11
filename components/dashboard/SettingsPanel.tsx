"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatBusinessTone, formatTenantPlan } from "@/lib/utils";

interface ProductRow {
  name: string;
  price: number;
  description?: string;
}

interface ActionRow {
  id: string;
  actionType: string;
  isEnabled: boolean;
}

interface SettingsPanelProps {
  tenant: {
    id: string;
    name: string;
    segment: string | null;
    whatsappNumber: string;
    plan: string;
  };
  businessProfile: {
    businessName: string;
    segment: string | null;
    products: ProductRow[];
    paymentMethods: string[];
    workingHours: string | null;
    tone: string;
    customInstructions: string | null;
  } | null;
  actionSchemas: ActionRow[];
  whatsappStatus: {
    connected: boolean;
    instanceName: string | null;
    hasApiCredentials: boolean;
  };
}

const paymentOptions = [
  "pix",
  "cartao_credito",
  "cartao_debito",
  "boleto",
  "dinheiro",
  "link_pagamento",
];

const actionLabels: Record<string, string> = {
  sale_register: "Registrar vendas",
  document_store: "Organizar documentos",
  collection_track: "Controlar cobrancas",
  appointment_schedule: "Agendar compromissos",
  report_generate: "Gerar relatorios",
  custom: "Acao customizada",
};

export function SettingsPanel({
  tenant,
  businessProfile,
  actionSchemas,
  whatsappStatus,
}: SettingsPanelProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<ProductRow[]>(
    businessProfile?.products.length
      ? businessProfile.products
      : [{ name: "", price: 0, description: "" }],
  );
  const [enabledActions, setEnabledActions] = useState<Record<string, boolean>>(
    Object.fromEntries(actionSchemas.map((row) => [row.actionType, row.isEnabled])),
  );
  const [form, setForm] = useState({
    businessName: businessProfile?.businessName ?? tenant.name,
    segment: businessProfile?.segment ?? tenant.segment ?? "",
    workingHours: businessProfile?.workingHours ?? "",
    tone: businessProfile?.tone ?? "casual",
    customInstructions: businessProfile?.customInstructions ?? "",
    paymentMethods: businessProfile?.paymentMethods ?? ["pix"],
  });

  function togglePaymentMethod(value: string) {
    setForm((current) => ({
      ...current,
      paymentMethods: current.paymentMethods.includes(value)
        ? current.paymentMethods.filter((entry) => entry !== value)
        : [...current.paymentMethods, value],
    }));
  }

  async function saveSettings() {
    setSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          products,
          actionSchemas: Object.entries(enabledActions).map(([actionType, isEnabled]) => ({
            actionType,
            isEnabled,
          })),
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(payload?.error ?? "Nao foi possivel salvar as configuracoes.");
      }

      router.refresh();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Nao foi possivel salvar as configuracoes.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <div className="space-y-6">
        <div className="rounded-[1.8rem] border border-white/10 bg-[#111111] p-5">
          <p className="text-xs uppercase tracking-[0.3em] text-[#00FF88]">
            Perfil do negocio
          </p>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <Input
              onChange={(event) =>
                setForm((current) => ({ ...current, businessName: event.target.value }))
              }
              placeholder="Nome do negocio"
              value={form.businessName}
            />
            <Input
              onChange={(event) =>
                setForm((current) => ({ ...current, segment: event.target.value }))
              }
              placeholder="Segmento"
              value={form.segment}
            />
            <Input
              className="md:col-span-2"
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  workingHours: event.target.value,
                }))
              }
              placeholder="Horario de funcionamento"
              value={form.workingHours}
            />
            <label className="flex items-center rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-white/70 md:col-span-2">
              <select
                className="h-11 w-full bg-transparent outline-none"
                onChange={(event) =>
                  setForm((current) => ({ ...current, tone: event.target.value }))
                }
                value={form.tone}
              >
                <option value="formal">Formal</option>
                <option value="casual">Casual</option>
                <option value="tecnico">Tecnico</option>
              </select>
            </label>
          </div>

          <div className="mt-5">
            <p className="text-sm text-white/60">
              Forma de falar atual: {formatBusinessTone(form.tone)}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {paymentOptions.map((paymentOption) => {
                const active = form.paymentMethods.includes(paymentOption);

                return (
                  <button
                    key={paymentOption}
                    className={`rounded-full border px-4 py-2 text-sm ${
                      active
                        ? "border-[#00FF88]/40 bg-[#00FF88]/12 text-[#7CFFBF]"
                        : "border-white/10 bg-white/[0.03] text-white/65"
                    }`}
                    onClick={() => togglePaymentMethod(paymentOption)}
                    type="button"
                  >
                    {paymentOption}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-5">
            <p className="text-sm text-white/60">Instrucoes customizadas</p>
            <Textarea
              className="mt-3"
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  customInstructions: event.target.value,
                }))
              }
              placeholder="Ex.: sempre confirmar o pagamento antes de finalizar a venda."
              value={form.customInstructions}
            />
          </div>
        </div>

        <div className="rounded-[1.8rem] border border-white/10 bg-[#111111] p-5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs uppercase tracking-[0.3em] text-[#00FF88]">
              Produtos e servicos
            </p>
            <Button
              onClick={() =>
                setProducts((current) => [
                  ...current,
                  { name: "", price: 0, description: "" },
                ])
              }
              size="sm"
              type="button"
              variant="secondary"
            >
              Adicionar item
            </Button>
          </div>
          <div className="mt-5 space-y-3">
            {products.map((product, index) => (
              <div
                key={`${product.name}-${index}`}
                className="grid gap-3 rounded-[1.4rem] border border-white/10 bg-white/[0.03] p-4 md:grid-cols-[1fr_160px_auto]"
              >
                <Input
                  onChange={(event) =>
                    setProducts((current) =>
                      current.map((entry, entryIndex) =>
                        entryIndex === index
                          ? { ...entry, name: event.target.value }
                          : entry,
                      ),
                    )
                  }
                  placeholder="Nome do item"
                  value={product.name}
                />
                <Input
                  min="0"
                  onChange={(event) =>
                    setProducts((current) =>
                      current.map((entry, entryIndex) =>
                        entryIndex === index
                          ? {
                              ...entry,
                              price: Number(event.target.value),
                            }
                          : entry,
                      ),
                    )
                  }
                  placeholder="Preco"
                  step="0.01"
                  type="number"
                  value={product.price}
                />
                <Button
                  onClick={() =>
                    setProducts((current) =>
                      current.length === 1
                        ? [{ name: "", price: 0, description: "" }]
                        : current.filter((_, entryIndex) => entryIndex !== index),
                    )
                  }
                  type="button"
                  variant="ghost"
                >
                  Remover
                </Button>
                <Textarea
                  className="md:col-span-3"
                  onChange={(event) =>
                    setProducts((current) =>
                      current.map((entry, entryIndex) =>
                        entryIndex === index
                          ? { ...entry, description: event.target.value }
                          : entry,
                      ),
                    )
                  }
                  placeholder="Descricao opcional"
                  value={product.description ?? ""}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="rounded-[1.8rem] border border-white/10 bg-[#111111] p-5">
          <p className="text-xs uppercase tracking-[0.3em] text-[#00FF88]">
            Acoes da Frya
          </p>
          <div className="mt-5 space-y-3">
            {actionSchemas.map((actionSchema) => (
              <button
                key={actionSchema.id}
                className={`flex w-full items-center justify-between rounded-[1.4rem] border px-4 py-4 text-left ${
                  enabledActions[actionSchema.actionType]
                    ? "border-[#00FF88]/24 bg-[#00FF88]/8"
                    : "border-white/10 bg-white/[0.03]"
                }`}
                onClick={() =>
                  setEnabledActions((current) => ({
                    ...current,
                    [actionSchema.actionType]: !current[actionSchema.actionType],
                  }))
                }
                type="button"
              >
                <span className="text-sm text-white">
                  {actionLabels[actionSchema.actionType] ?? actionSchema.actionType}
                </span>
                <span
                  className={`h-6 w-11 rounded-full p-1 ${
                    enabledActions[actionSchema.actionType]
                      ? "bg-[#00FF88]/24"
                      : "bg-white/10"
                  }`}
                >
                  <span
                    className={`block h-4 w-4 rounded-full bg-white transition ${
                      enabledActions[actionSchema.actionType]
                        ? "translate-x-5"
                        : "translate-x-0"
                    }`}
                  />
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-[1.8rem] border border-white/10 bg-[#111111] p-5">
          <p className="text-xs uppercase tracking-[0.3em] text-[#00FF88]">
            Conexao WhatsApp
          </p>
          <div className="mt-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-lg text-white">
                {whatsappStatus.connected ? "Instance conectada" : "Conexao pendente"}
              </p>
              <p className="mt-1 text-sm text-white/56">
                {whatsappStatus.instanceName ?? "Defina EVOLUTION_INSTANCE no ambiente"}
              </p>
            </div>
            <Badge variant={whatsappStatus.connected ? "success" : "warning"}>
              {whatsappStatus.connected ? "Online" : "Pendente"}
            </Badge>
          </div>
          <p className="mt-4 text-sm text-white/58">
            Credenciais configuradas: {whatsappStatus.hasApiCredentials ? "sim" : "nao"}
          </p>
        </div>

        <div className="rounded-[1.8rem] border border-white/10 bg-[#111111] p-5">
          <p className="text-xs uppercase tracking-[0.3em] text-[#00FF88]">
            Plano e billing
          </p>
          <p className="mt-4 text-3xl text-white">{formatTenantPlan(tenant.plan)}</p>
          <p className="mt-2 text-sm text-white/56">
            Modulo de billing ainda em placeholder. Aqui vamos mostrar upgrades, limites e historico de uso.
          </p>
        </div>

        {error ? <p className="text-sm text-red-300">{error}</p> : null}

        <div className="flex justify-end">
          <Button
            className="bg-[#00FF88] text-[#04110a] hover:bg-[#66ffb2]"
            disabled={saving}
            onClick={saveSettings}
            type="button"
          >
            {saving ? "Salvando..." : "Salvar configuracoes"}
          </Button>
        </div>
      </div>
    </div>
  );
}
