import type * as React from "react";
import { cn } from "@/lib/utils";

const badgeVariants = {
  default: "bg-white/8 text-white",
  accent: "bg-primary/14 text-primary",
  success: "bg-emerald-500/16 text-emerald-300",
  warning: "bg-amber-500/16 text-amber-200",
  muted: "bg-white/6 text-muted-foreground",
} as const;

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: keyof typeof badgeVariants;
}

export function Badge({
  className,
  variant = "default",
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium tracking-wide",
        badgeVariants[variant],
        className,
      )}
      {...props}
    />
  );
}
