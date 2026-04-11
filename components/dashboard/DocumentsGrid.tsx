"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDateTime, formatDocumentType } from "@/lib/utils";

interface DocumentCard {
  id: string;
  type: string;
  fileUrl: string;
  extractedData: Record<string, unknown>;
  linkedSaleId: string | null;
  uploadedVia: string;
  createdAt: string;
  linkedSale: {
    id: string;
    customerName: string;
    productOrService: string;
    totalValue: number | string;
  } | null;
}

interface DocumentsGridProps {
  rows: DocumentCard[];
}

function isImageDocument(fileUrl: string) {
  return /\.(png|jpe?g|webp|gif)$/i.test(fileUrl);
}

function renderExtractedData(extractedData: Record<string, unknown>) {
  return Object.entries(extractedData).slice(0, 6);
}

export function DocumentsGrid({ rows }: DocumentsGridProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = useMemo(
    () => rows.find((row) => row.id === selectedId) ?? null,
    [rows, selectedId],
  );

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {rows.map((row) => {
          const image = isImageDocument(row.fileUrl);

          return (
            <button
              key={row.id}
              className="overflow-hidden rounded-[1.8rem] border border-white/10 bg-[#111111] text-left transition hover:border-[#00FF88]/28 hover:bg-[#141414]"
              onClick={() => setSelectedId(row.id)}
              type="button"
            >
              <div className="flex h-44 items-center justify-center border-b border-white/10 bg-[#0e0e0e]">
                {image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    alt={formatDocumentType(row.type)}
                    className="h-full w-full object-cover"
                    src={row.fileUrl}
                  />
                ) : (
                  <div className="text-center">
                    <p className="text-4xl text-[#00FF88]">DOC</p>
                    <p className="mt-2 text-xs uppercase tracking-[0.3em] text-white/45">
                      {formatDocumentType(row.type)}
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-3 p-5">
                <div className="flex items-center justify-between gap-3">
                  <Badge className="bg-white/8 text-white">
                    {formatDocumentType(row.type)}
                  </Badge>
                  <span className="text-xs text-white/45">
                    {formatDateTime(row.createdAt)}
                  </span>
                </div>
                <p className="text-sm leading-6 text-white/68">
                  {row.linkedSale
                    ? `Vinculado a ${row.linkedSale.customerName}`
                    : "Sem venda vinculada por enquanto."}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {selected ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 backdrop-blur sm:items-center">
          <div className="max-h-[92vh] w-full max-w-4xl overflow-auto rounded-[2rem] border border-white/10 bg-[#111111] p-5 shadow-[0_30px_80px_rgba(0,0,0,0.45)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-[#00FF88]">
                  Documento
                </p>
                <h3 className="mt-2 font-display text-3xl text-white">
                  {formatDocumentType(selected.type)}
                </h3>
              </div>
              <Button onClick={() => setSelectedId(null)} type="button" variant="ghost">
                Fechar
              </Button>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="overflow-hidden rounded-[1.8rem] border border-white/10 bg-[#0d0d0d]">
                {isImageDocument(selected.fileUrl) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    alt={formatDocumentType(selected.type)}
                    className="max-h-[560px] w-full object-contain"
                    src={selected.fileUrl}
                  />
                ) : (
                  <iframe
                    className="h-[560px] w-full"
                    src={selected.fileUrl}
                    title={`Documento ${selected.id}`}
                  />
                )}
              </div>

              <div className="space-y-5">
                <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-xs uppercase tracking-[0.3em] text-white/45">
                    Dados extraidos
                  </p>
                  <div className="mt-4 space-y-3">
                    {renderExtractedData(selected.extractedData).length ? (
                      renderExtractedData(selected.extractedData).map(([key, value]) => (
                        <div
                          key={key}
                          className="rounded-[1.2rem] border border-white/8 bg-black/20 px-4 py-3"
                        >
                          <p className="text-xs uppercase tracking-[0.24em] text-white/40">
                            {key}
                          </p>
                          <p className="mt-2 text-sm text-white">
                            {typeof value === "object"
                              ? JSON.stringify(value)
                              : String(value)}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-white/58">
                        A Frya ainda nao extraiu campos estruturados deste documento.
                      </p>
                    )}
                  </div>
                </div>

                <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-xs uppercase tracking-[0.3em] text-white/45">
                    Vinculacao
                  </p>
                  {selected.linkedSale ? (
                    <div className="mt-4 rounded-[1.2rem] border border-[#00FF88]/15 bg-[#00FF88]/6 p-4">
                      <p className="text-sm text-white">
                        {selected.linkedSale.customerName}
                      </p>
                      <p className="mt-1 text-sm text-white/58">
                        {selected.linkedSale.productOrService}
                      </p>
                      <p className="mt-2 text-sm text-[#7CFFBF]">
                        {formatCurrency(selected.linkedSale.totalValue)}
                      </p>
                    </div>
                  ) : (
                    <p className="mt-4 text-sm text-white/58">
                      Este documento ainda nao foi relacionado a uma venda registrada.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
