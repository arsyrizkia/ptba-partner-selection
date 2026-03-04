"use client";

import { cn } from "@/lib/utils/cn";
import { CheckCircle, XCircle, Clock } from "lucide-react";
import type { SLAItem } from "@/lib/types";

interface SLAIndicatorProps {
  status: SLAItem["status"];
  showLabel?: boolean;
}

function getStatusConfig(status: SLAItem["status"]) {
  switch (status) {
    case "Tepat Waktu":
      return {
        icon: CheckCircle,
        color: "text-ptba-green",
        bg: "bg-green-50",
        label: "Tepat Waktu",
      };
    case "Terlambat":
      return {
        icon: XCircle,
        color: "text-ptba-red",
        bg: "bg-red-50",
        label: "Terlambat",
      };
    case "Dalam Proses":
      return {
        icon: Clock,
        color: "text-ptba-gold",
        bg: "bg-amber-50",
        label: "Dalam Proses",
      };
  }
}

export function SLAIndicator({ status, showLabel = true }: SLAIndicatorProps) {
  const config = getStatusConfig(status);
  const Icon = config.icon;

  return (
    <div className="inline-flex items-center gap-1.5">
      <div
        className={cn(
          "flex h-6 w-6 items-center justify-center rounded-full",
          config.bg
        )}
      >
        <Icon className={cn("h-4 w-4", config.color)} />
      </div>
      {showLabel && (
        <span className={cn("text-xs font-medium", config.color)}>
          {config.label}
        </span>
      )}
    </div>
  );
}
