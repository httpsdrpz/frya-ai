import { cn } from "@/lib/utils";

export function ChatSimulationFallback({ className }: { className?: string }) {
  return (
    <div className={cn("relative mx-auto w-full max-w-[42rem]", className)}>
      <div className="relative rounded-[2.1rem] border border-white/10 bg-white/[0.04] p-4 shadow-[0_28px_90px_rgba(0,0,0,0.34)] backdrop-blur-xl">
        <div className="overflow-hidden rounded-[1.7rem] border border-white/8 bg-[#040605]">
          <div className="flex items-center justify-between border-b border-white/6 bg-white/[0.03] px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full border border-[#0B6B3A]/35 bg-[#0B6B3A]/12 text-sm font-semibold text-[#9FE1B7]">
                Fr
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-white">Frya no WhatsApp</p>
                <p className="text-xs uppercase tracking-[0.26em] text-white/36">
                  conversa em andamento
                </p>
              </div>
            </div>

            <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white/54">
              ativo
            </div>
          </div>

          <div className="space-y-5 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),transparent_45%)] p-5">
            <div className="flex min-h-[21rem] flex-col justify-end gap-3">
              <div className="flex justify-start">
                <div className="max-w-[85%] rounded-[1.45rem] rounded-bl-md border border-white/6 bg-white/[0.06] px-4 py-3 text-sm leading-7 text-white/86 shadow-[0_14px_36px_rgba(0,0,0,0.16)]">
                  Oi, ainda tem horario pra sexta?
                </div>
              </div>

              <div className="flex justify-end">
                <div className="max-w-[85%] rounded-[1.45rem] rounded-br-md bg-[#0B6B3A] px-4 py-3 text-sm leading-7 text-white shadow-[0_14px_36px_rgba(0,0,0,0.16)]">
                  Tem sim. Posso te mandar os horarios livres agora.
                </div>
              </div>

              <div className="flex justify-end">
                <div className="max-w-[85%] rounded-[1.45rem] rounded-br-md bg-[#0B6B3A] px-4 py-3 text-sm leading-7 text-white shadow-[0_14px_36px_rgba(0,0,0,0.16)]">
                  Se preferir, te lembro mais tarde pra nao perder o horario.
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 rounded-full border border-[#F2C94C]/25 bg-[#F2C94C]/10 px-4 py-2 text-sm text-[#F2C94C]">
                <span className="h-2 w-2 rounded-full bg-[#F2C94C]" />
                Follow-up automatico agendado
              </div>

              <div className="flex items-center gap-3 rounded-[1.3rem] border border-white/8 bg-white/[0.03] px-4 py-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.05] text-xs uppercase tracking-[0.22em] text-white/46">
                  AI
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-white/78">Proximo passo ja preparado</p>
                  <p className="text-xs leading-5 text-white/42">
                    Horarios enviados. Retorno armado. Nenhum lead fica solto.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
