"use client";

import { type LucideIcon, ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Card } from "./card";

interface KpiCardProps {
  title: string;
  value: string;
  trend: number;
  icon: LucideIcon;
  trendLabel?: string;
}

export function KpiCard({ title, value, trend, icon: Icon, trendLabel }: KpiCardProps) {
  const isPositive = trend >= 0;

  return (
    <Card accent="gold" padding="md">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-ptba-gray mb-1">{title}</p>
          <p className="text-2xl font-bold text-ptba-charcoal">{value}</p>
          <div className="flex items-center gap-1 mt-2">
            <span
              className={cn(
                "inline-flex items-center gap-0.5 text-xs font-medium",
                isPositive ? "text-ptba-green" : "text-ptba-red"
              )}
            >
              {isPositive ? (
                <ArrowUp className="h-3 w-3" />
              ) : (
                <ArrowDown className="h-3 w-3" />
              )}
              {Math.abs(trend)}%
            </span>
            {trendLabel && (
              <span className="text-xs text-ptba-gray">{trendLabel}</span>
            )}
          </div>
        </div>
        <div className="flex-shrink-0 p-2 bg-ptba-section-bg rounded-lg">
          <Icon className="h-6 w-6 text-ptba-steel-blue" />
        </div>
      </div>
    </Card>
  );
}
