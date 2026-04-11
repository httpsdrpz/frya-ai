"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/lib/utils";

interface SaleRow {
  id: string;
  saleDate: string;
  customerName: string;
  customerPhone: string;
  productOrService: string;
  quantity: number;
  unitPrice: number;
  totalValue: number;
  paymentMethod: string;
  paymentStatus: string;
  installments: number;
  notes: string | null;
}

interface SalesWorkspaceToolsProps {
  rows: SaleRow[];
}

export function SalesWorkspaceTools({ rows }: SalesWorkspaceToolsProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    customerName: "",
    customerPhone: "",
    productOrService: "",
    quantity: "1",
    unitPrice: "",
    paymentMethod: "pix",
    paymentStatus: "paid",
    installments: "1",
    saleDate: new Date().toISOString().slice(0, 10),
    notes: "",
  });

  function updateField(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function exportCsv() {
    const header = [
      "Data",
      "Cliente",
      "Telefone",
      "Produto",
      "Quantidade",
      "Valor unitario",
      "Valor total",
      "Pagamento",
      "Status",
      "Parcelas",
      "Observacoes",
    ];
    const lines = rows.map((row) =>
      [
        new Date(row.saleDate).toLocaleDateString("pt-BR"),
        row.customerName,
        row.customerPhone,
        row.productOrService,
        row.quantity,
        row.unitPrice.toFixed(2),
        row.totalValue.toFixed(2),
        row.paymentMethod,
        row.paymentStatus,
        row.installments,
        row.notes ?? "",
      ]
        .map((value) => `"${String(value).replaceAll('"', '""')}"`)
        .join(","),
    );
    const csv = [header.join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "frya-vendas.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/sales", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          quantity: Number(form.quantity),
          unitPrice: Number(form.unitPrice),
          installments: Number(form.installments),
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(payload?.error ?? "Nao foi possivel registrar a venda.");
      }

      setOpen(false);
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Nao foi possivel registrar a venda.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-white/58">
            Exporte a tabela ou registre uma venda manual quando ela entrar fora do WhatsApp.
          </p>
        </div>
        <div className="flex gap-3">
          <Button onClick={exportCsv} type="button" variant="secondary">
            Exportar CSV
          </Button>
          <Button
            className="bg-[#00FF88] text-[#04110a] hover:bg-[#66ffb2]"
            onClick={() => setOpen((current) => !current)}
            type="button"
          >
            Registrar venda manual
          </Button>
        </div>
      </div>

      {open ? (
        <form
          className="rounded-[1.75rem] border border-white/10 bg-[#111111] p-5"
          onSubmit={handleSubmit}
        >
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <Input
              onChange={(event) => updateField("customerName", event.target.value)}
              placeholder="Cliente"
              value={form.customerName}
            />
            <Input
              onChange={(event) => updateField("customerPhone", event.target.value)}
              placeholder="WhatsApp do cliente"
              value={form.customerPhone}
            />
            <Input
              onChange={(event) => updateField("productOrService", event.target.value)}
              placeholder="Produto ou servico"
              value={form.productOrService}
            />
            <Input
              min="0"
              onChange={(event) => updateField("unitPrice", event.target.value)}
              placeholder="Valor unitario"
              step="0.01"
              type="number"
              value={form.unitPrice}
            />
            <Input
              min="1"
              onChange={(event) => updateField("quantity", event.target.value)}
              placeholder="Quantidade"
              type="number"
              value={form.quantity}
            />
            <Input
              min="1"
              onChange={(event) => updateField("installments", event.target.value)}
              placeholder="Parcelas"
              type="number"
              value={form.installments}
            />
            <Input
              onChange={(event) => updateField("saleDate", event.target.value)}
              type="date"
              value={form.saleDate}
            />
            <label className="flex items-center rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-white/70">
              <select
                className="h-11 w-full bg-transparent outline-none"
                onChange={(event) => updateField("paymentMethod", event.target.value)}
                value={form.paymentMethod}
              >
                <option value="pix">PIX</option>
                <option value="cartao_credito">Cartao de credito</option>
                <option value="cartao_debito">Cartao de debito</option>
                <option value="boleto">Boleto</option>
                <option value="dinheiro">Dinheiro</option>
                <option value="link">Link de pagamento</option>
              </select>
            </label>
            <label className="flex items-center rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-white/70">
              <select
                className="h-11 w-full bg-transparent outline-none"
                onChange={(event) => updateField("paymentStatus", event.target.value)}
                value={form.paymentStatus}
              >
                <option value="paid">Pago</option>
                <option value="pending">Pendente</option>
                <option value="overdue">Atrasado</option>
              </select>
            </label>
          </div>

          <div className="mt-3">
            <Textarea
              onChange={(event) => updateField("notes", event.target.value)}
              placeholder={`Observacoes opcionais\nTotal estimado: ${formatCurrency(
                Number(form.quantity || 0) * Number(form.unitPrice || 0),
              )}`}
              value={form.notes}
            />
          </div>

          {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button onClick={() => setOpen(false)} type="button" variant="ghost">
              Cancelar
            </Button>
            <Button
              className="bg-[#00FF88] text-[#04110a] hover:bg-[#66ffb2]"
              disabled={submitting}
              type="submit"
            >
              {submitting ? "Salvando..." : "Salvar venda"}
            </Button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
