"use client";

import {
  startTransition,
  useEffect,
  useEffectEvent,
  useState,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { conversationScript } from "@/components/marketing/landing/content";

type RenderedMessage = {
  id: string;
  role: "lead" | "frya";
  text: string;
};

const fullConversation: RenderedMessage[] = conversationScript.map((message) => ({
  id: message.id,
  role: message.role,
  text: message.text,
}));

export function ChatSimulation({ className }: { className?: string }) {
  const prefersReducedMotion = useReducedMotion() ?? false;
  const [messages, setMessages] = useState<RenderedMessage[]>(
    prefersReducedMotion ? fullConversation : [],
  );
  const [isFryaTyping, setIsFryaTyping] = useState(false);
  const [showFollowUp, setShowFollowUp] = useState(prefersReducedMotion);

  const resetConversation = useEffectEvent(() => {
    startTransition(() => {
      setMessages([]);
      setIsFryaTyping(false);
      setShowFollowUp(false);
    });
  });

  const upsertMessage = useEffectEvent((message: RenderedMessage, text: string) => {
    startTransition(() => {
      setMessages((current) => {
        const index = current.findIndex((item) => item.id === message.id);

        if (index === -1) {
          return [...current, { ...message, text }];
        }

        const next = [...current];
        next[index] = {
          ...next[index],
          text,
        };
        return next;
      });
    });
  });

  useEffect(() => {
    if (prefersReducedMotion) {
      startTransition(() => {
        setMessages(fullConversation);
        setIsFryaTyping(false);
        setShowFollowUp(true);
      });
      return;
    }

    let active = true;
    const timeouts = new Set<number>();

    const wait = (ms: number) =>
      new Promise<void>((resolve) => {
        const timeoutId = window.setTimeout(() => {
          timeouts.delete(timeoutId);
          resolve();
        }, ms);

        timeouts.add(timeoutId);
      });

    const randomBetween = (min: number, max: number) =>
      Math.floor(Math.random() * (max - min + 1)) + min;

    const typeMessage = async (message: RenderedMessage) => {
      for (let index = 1; index <= message.text.length; index += 1) {
        if (!active) {
          return;
        }

        upsertMessage(message, message.text.slice(0, index));
        await wait(randomBetween(30, 80));
      }
    };

    const runLoop = async () => {
      while (active) {
        resetConversation();
        await wait(280);

        await typeMessage(fullConversation[0]);
        if (!active) {
          return;
        }

        startTransition(() => {
          setIsFryaTyping(true);
        });
        await wait(randomBetween(800, 1200));
        if (!active) {
          return;
        }

        startTransition(() => {
          setIsFryaTyping(false);
        });
        await typeMessage(fullConversation[1]);
        if (!active) {
          return;
        }

        startTransition(() => {
          setIsFryaTyping(true);
        });
        await wait(randomBetween(800, 1200));
        if (!active) {
          return;
        }

        startTransition(() => {
          setIsFryaTyping(false);
        });
        await typeMessage(fullConversation[2]);
        if (!active) {
          return;
        }

        startTransition(() => {
          setShowFollowUp(true);
        });
        await wait(randomBetween(800, 1100));
      }
    };

    void runLoop();

    return () => {
      active = false;
      timeouts.forEach((timeoutId) => window.clearTimeout(timeoutId));
      timeouts.clear();
    };
  }, [prefersReducedMotion]);

  return (
    <motion.div
      className={cn("relative mx-auto w-full max-w-[42rem]", className)}
      animate={prefersReducedMotion ? undefined : { y: [0, -6, 0] }}
      transition={
        prefersReducedMotion
          ? undefined
          : {
              duration: 5,
              ease: "easeInOut",
              repeat: Number.POSITIVE_INFINITY,
            }
      }
    >
      <motion.div
        aria-hidden="true"
        className="absolute -left-16 top-20 h-48 w-48 rounded-full bg-[#0B6B3A]/22 blur-[150px]"
        animate={prefersReducedMotion ? undefined : { x: [0, 18, 0], y: [0, -16, 0] }}
        transition={
          prefersReducedMotion
            ? undefined
            : {
                duration: 10,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
              }
        }
      />
      <motion.div
        aria-hidden="true"
        className="absolute -right-12 top-0 h-40 w-40 rounded-full bg-[#F2C94C]/12 blur-[130px]"
        animate={prefersReducedMotion ? undefined : { x: [0, -16, 0], y: [0, 12, 0] }}
        transition={
          prefersReducedMotion
            ? undefined
            : {
                duration: 12,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
              }
        }
      />

      <div className="relative rounded-[2.25rem] border border-white/10 bg-white/[0.04] p-4 shadow-[0_30px_120px_rgba(0,0,0,0.45)] backdrop-blur-[28px]">
        <div className="overflow-hidden rounded-[1.8rem] border border-white/8 bg-[#040605]">
          <div className="flex items-center justify-between border-b border-white/6 bg-white/[0.03] px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full border border-[#0B6B3A]/40 bg-[#0B6B3A]/12 text-sm font-semibold text-[#9FE1B7]">
                Fr
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-white">Frya no WhatsApp</p>
                <p className="text-xs uppercase tracking-[0.26em] text-white/36">
                  conversa em andamento
                </p>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {isFryaTyping ? (
                <motion.div
                  key="typing"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.24, ease: "easeOut" }}
                  className="rounded-full border border-[#0B6B3A]/30 bg-[#0B6B3A]/10 px-3 py-1 text-xs text-[#9FE1B7]"
                >
                  Frya digitando...
                </motion.div>
              ) : (
                <motion.div
                  key="active"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.24, ease: "easeOut" }}
                  className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white/54"
                >
                  ativo
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="space-y-5 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),transparent_45%)] p-5">
            <div className="flex min-h-[21rem] flex-col justify-end gap-3">
              {messages.map((message) => {
                const isLead = message.role === "lead";

                return (
                  <motion.div
                    key={message.id}
                    initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
                    animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
                    transition={{ duration: 0.32, ease: "easeOut" }}
                    className={cn("flex", isLead ? "justify-start" : "justify-end")}
                  >
                    <div
                      className={cn(
                        "max-w-[85%] rounded-[1.45rem] px-4 py-3 text-sm leading-7 shadow-[0_14px_36px_rgba(0,0,0,0.16)]",
                        isLead
                          ? "rounded-bl-md border border-white/6 bg-white/[0.06] text-white/86"
                          : "rounded-br-md bg-[#0B6B3A] text-white",
                      )}
                    >
                      {message.text}
                    </div>
                  </motion.div>
                );
              })}

              <AnimatePresence>
                {isFryaTyping ? (
                  <motion.div
                    key="typing-dots"
                    initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
                    animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
                    exit={prefersReducedMotion ? undefined : { opacity: 0, y: -6 }}
                    transition={{ duration: 0.24, ease: "easeOut" }}
                    className="ml-auto flex w-fit items-center gap-1.5 rounded-full border border-[#0B6B3A]/30 bg-[#0B6B3A]/10 px-4 py-2"
                  >
                    {[0, 1, 2].map((dot) => (
                      <motion.span
                        key={dot}
                        className="h-1.5 w-1.5 rounded-full bg-[#9FE1B7]"
                        animate={prefersReducedMotion ? undefined : { opacity: [0.35, 1, 0.35] }}
                        transition={
                          prefersReducedMotion
                            ? undefined
                            : {
                                duration: 1.2,
                                repeat: Number.POSITIVE_INFINITY,
                                delay: dot * 0.12,
                                ease: "easeInOut",
                              }
                        }
                      />
                    ))}
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>

            <div className="space-y-3">
              <AnimatePresence>
                {showFollowUp ? (
                  <motion.div
                    key="follow-up"
                    initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
                    animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
                    exit={prefersReducedMotion ? undefined : { opacity: 0, y: -6 }}
                    transition={{ duration: 0.32, ease: "easeOut" }}
                    className="flex items-center gap-2 rounded-full border border-[#F2C94C]/25 bg-[#F2C94C]/10 px-4 py-2 text-sm text-[#F2C94C]"
                  >
                    <span className="h-2 w-2 rounded-full bg-[#F2C94C]" />
                    Follow-up automatico agendado
                  </motion.div>
                ) : null}
              </AnimatePresence>

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
    </motion.div>
  );
}
