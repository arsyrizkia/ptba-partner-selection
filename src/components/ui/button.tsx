"use client";

import { type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

type ButtonVariant = "navy" | "steel" | "red" | "gold" | "outline" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantStyles: Record<ButtonVariant, string> = {
  navy: "bg-ptba-navy text-white hover:bg-ptba-navy-dark",
  steel: "bg-ptba-steel-blue text-white hover:opacity-90",
  red: "bg-ptba-red text-white hover:opacity-90",
  gold: "bg-ptba-gold text-ptba-charcoal hover:opacity-90",
  outline:
    "border-2 border-ptba-navy text-ptba-navy hover:bg-ptba-navy hover:text-white",
  ghost: "text-ptba-gray hover:bg-ptba-off-white",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-3 text-base",
};

export function Button({
  variant = "navy",
  size = "md",
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-lg font-medium transition-all",
        "focus:outline-none focus:ring-2 focus:ring-ptba-steel-blue focus:ring-offset-2",
        "disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
