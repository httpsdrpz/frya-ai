"use client";

import type { Dispatch, SetStateAction } from "react";
import { useEffect, useRef, useState } from "react";
import { conversationScript } from "@/components/marketing/landing/content";

const [leadMessage, firstReply, secondReply] = conversationScript;

export function ChatSimulation() {
  const [isStaticPreview] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [leadText, setLeadText] = useState(() =>
    isStaticPreview ? leadMessage.text : "",
  );
  const [replyOneText, setReplyOneText] = useState(() =>
    isStaticPreview ? firstReply.text : "",
  );
  const [replyTwoText, setReplyTwoText] = useState(() =>
    isStaticPreview ? secondReply.text : "",
  );
  const [isTyping, setIsTyping] = useState(false);
  const [showFollowUp, setShowFollowUp] = useState(isStaticPreview);
  const timersRef = useRef<number[]>([]);

  useEffect(() => {
    const clearTimers = () => {
      timersRef.current.forEach((timer) => window.clearTimeout(timer));
      timersRef.current = [];
    };

    if (isStaticPreview) {
      return clearTimers;
    }

    let cancelled = false;

    const randomBetween = (min: number, max: number) =>
      Math.floor(Math.random() * (max - min + 1)) + min;

    const schedule = (callback: () => void, delay: number) => {
      const timer = window.setTimeout(() => {
        if (!cancelled) {
          callback();
        }
      }, delay);

      timersRef.current.push(timer);
    };

    const typeText = (
      fullText: string,
      setter: Dispatch<SetStateAction<string>>,
      onDone?: () => void,
    ) => {
      let index = 0;

      const tick = () => {
        index += 1;
        setter(fullText.slice(0, index));

        if (index < fullText.length) {
          schedule(tick, randomBetween(30, 80));
          return;
        }

        onDone?.();
      };

      schedule(tick, randomBetween(30, 80));
    };

    const runSequence = () => {
      setLeadText("");
      setReplyOneText("");
      setReplyTwoText("");
      setIsTyping(false);
      setShowFollowUp(false);

      schedule(() => {
        typeText(leadMessage.text, setLeadText, () => {
          setIsTyping(true);

          schedule(() => {
            setIsTyping(false);

            typeText(firstReply.text, setReplyOneText, () => {
              setIsTyping(true);

              schedule(() => {
                setIsTyping(false);

                typeText(secondReply.text, setReplyTwoText, () => {
                  setShowFollowUp(true);
                  schedule(runSequence, 2600);
                });
              }, randomBetween(800, 1200));
            });
          }, randomBetween(800, 1200));
        });
      }, 260);
    };

    runSequence();

    return () => {
      cancelled = true;
      clearTimers();
    };
  }, [isStaticPreview]);

  return (
    <div className="relative mx-auto w-full max-w-[42rem]">
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

            <div
              className={`rounded-full px-3 py-1 text-xs ${
                isTyping
                  ? "border border-[#0B6B3A]/30 bg-[#0B6B3A]/10 text-[#9FE1B7]"
                  : "border border-white/10 bg-white/[0.04] text-white/54"
              }`}
            >
              {isTyping ? "Frya digitando..." : "ativo"}
            </div>
          </div>

          <div className="space-y-5 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),transparent_45%)] p-5">
            <div className="flex min-h-[21rem] flex-col justify-end gap-3">
              {leadText ? (
                <div className="animate-message-in flex justify-start">
                  <div className="max-w-[85%] rounded-[1.45rem] rounded-bl-md border border-white/6 bg-white/[0.06] px-4 py-3 text-sm leading-7 text-white/86 shadow-[0_14px_36px_rgba(0,0,0,0.16)]">
                    {leadText}
                  </div>
                </div>
              ) : null}

              {replyOneText ? (
                <div className="animate-message-in flex justify-end">
                  <div className="max-w-[85%] rounded-[1.45rem] rounded-br-md bg-[#0B6B3A] px-4 py-3 text-sm leading-7 text-white shadow-[0_14px_36px_rgba(0,0,0,0.16)]">
                    {replyOneText}
                  </div>
                </div>
              ) : null}

              {replyTwoText ? (
                <div className="animate-message-in flex justify-end">
                  <div className="max-w-[85%] rounded-[1.45rem] rounded-br-md bg-[#0B6B3A] px-4 py-3 text-sm leading-7 text-white shadow-[0_14px_36px_rgba(0,0,0,0.16)]">
                    {replyTwoText}
                  </div>
                </div>
              ) : null}

              {isTyping ? (
                <div className="ml-auto flex w-fit items-center gap-1.5 rounded-full border border-[#0B6B3A]/30 bg-[#0B6B3A]/10 px-4 py-2">
                  {[0, 1, 2].map((dot) => (
                    <span
                      key={dot}
                      className="frya-typing-dot h-1.5 w-1.5 rounded-full bg-[#9FE1B7]"
                      style={{ animationDelay: `${dot * 120}ms` }}
                    />
                  ))}
                </div>
              ) : null}
            </div>

            <div className="space-y-3">
              {showFollowUp ? (
                <div className="animate-message-in flex items-center gap-2 rounded-full border border-[#F2C94C]/25 bg-[#F2C94C]/10 px-4 py-2 text-sm text-[#F2C94C]">
                  <span className="h-2 w-2 rounded-full bg-[#F2C94C]" />
                  Follow-up automatico agendado
                </div>
              ) : null}

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
