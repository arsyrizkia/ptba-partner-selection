import { type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

type CardAccent = "gold" | "navy" | "red" | "none";
type CardPadding = "sm" | "md" | "lg";

interface CardProps {
  children: ReactNode;
  className?: string;
  accent?: CardAccent;
  padding?: CardPadding;
}

const accentStyles: Record<CardAccent, string> = {
  gold: "border-l-4 border-l-ptba-gold",
  navy: "border-l-4 border-l-ptba-navy",
  red: "border-l-4 border-l-ptba-red",
  none: "",
};

const paddingStyles: Record<CardPadding, string> = {
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

export function Card({
  children,
  className,
  accent = "none",
  padding = "md",
}: CardProps) {
  return (
    <div
      className={cn(
        "bg-white rounded-xl shadow-sm",
        accentStyles[accent],
        paddingStyles[padding],
        className
      )}
    >
      {children}
    </div>
  );
}
