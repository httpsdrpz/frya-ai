import type { ReactNode } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface QuizStepProps {
  eyebrow: string;
  title: string;
  description: string;
  direction: 1 | -1;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

export function QuizStep({
  eyebrow,
  title,
  description,
  direction,
  children,
  footer,
  className,
}: QuizStepProps) {
  return (
    <Card
      className={cn(
        "overflow-hidden border border-white/10 bg-[#111111]/92 p-0 shadow-[0_30px_80px_rgba(0,0,0,0.45)]",
        direction === 1 ? "animate-quiz-step-forward" : "animate-quiz-step-back",
        className,
      )}
    >
      <CardHeader className="border-b border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.01))] px-5 py-5 sm:px-7">
        <p className="text-xs font-medium uppercase tracking-[0.32em] text-[#00FF88]/72">
          {eyebrow}
        </p>
        <CardTitle className="mt-3 text-[1.75rem] leading-tight sm:text-[2rem]">
          {title}
        </CardTitle>
        <CardDescription className="max-w-2xl text-sm leading-6 text-white/62">
          {description}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6 px-5 py-6 sm:px-7">
        {children}
      </CardContent>

      {footer ? (
        <div className="border-t border-white/8 bg-white/[0.02] px-5 py-4 sm:px-7">
          {footer}
        </div>
      ) : null}
    </Card>
  );
}
