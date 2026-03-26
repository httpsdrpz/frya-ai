"use client";

import { useEffect, useEffectEvent } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

export function CursorGlow() {
  const rawX = useMotionValue(-240);
  const rawY = useMotionValue(-240);
  const x = useSpring(rawX, {
    stiffness: 70,
    damping: 24,
    mass: 0.7,
  });
  const y = useSpring(rawY, {
    stiffness: 70,
    damping: 24,
    mass: 0.7,
  });

  const updateGlow = useEffectEvent((event: PointerEvent) => {
    rawX.set(event.clientX - 240);
    rawY.set(event.clientY - 240);
  });

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    rawX.set(window.innerWidth / 2 - 240);
    rawY.set(window.innerHeight / 3 - 240);

    const handlePointerMove = (event: PointerEvent) => {
      updateGlow(event);
    };

    window.addEventListener("pointermove", handlePointerMove, {
      passive: true,
    });

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
    };
  }, [rawX, rawY]);

  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none fixed left-0 top-0 z-10 h-[30rem] w-[30rem] rounded-full bg-[radial-gradient(circle,rgba(11,107,58,0.16)_0%,rgba(11,107,58,0.08)_32%,rgba(11,107,58,0)_72%)] blur-[140px]"
      style={{ x, y }}
    />
  );
}
