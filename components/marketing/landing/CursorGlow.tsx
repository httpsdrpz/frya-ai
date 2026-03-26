"use client";

import { useEffect, useRef } from "react";

export function CursorGlow() {
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const coarsePointer = window.matchMedia("(pointer: coarse)").matches;

    if (reduceMotion || coarsePointer) {
      return;
    }

    const glow = glowRef.current;

    if (!glow) {
      return;
    }

    let frameId = 0;
    let currentX = window.innerWidth / 2 - 160;
    let currentY = window.innerHeight / 3 - 160;
    let targetX = currentX;
    let targetY = currentY;

    const render = () => {
      currentX += (targetX - currentX) * 0.08;
      currentY += (targetY - currentY) * 0.08;

      glow.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
      frameId = window.requestAnimationFrame(render);
    };

    const handlePointerMove = (event: PointerEvent) => {
      targetX = event.clientX - 160;
      targetY = event.clientY - 160;
    };

    glow.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
    window.addEventListener("pointermove", handlePointerMove, {
      passive: true,
    });
    frameId = window.requestAnimationFrame(render);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.cancelAnimationFrame(frameId);
    };
  }, []);

  return (
    <div
      ref={glowRef}
      aria-hidden="true"
      className="pointer-events-none fixed left-0 top-0 z-10 hidden h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(11,107,58,0.12)_0%,rgba(11,107,58,0.06)_35%,rgba(11,107,58,0)_72%)] blur-[96px] lg:block"
    />
  );
}
