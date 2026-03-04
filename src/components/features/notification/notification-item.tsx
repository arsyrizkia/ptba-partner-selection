"use client";

import type { Notification } from "@/lib/types";
import { cn } from "@/lib/utils/cn";
import { Info, AlertTriangle, CheckCircle, XCircle } from "lucide-react";

interface NotificationItemProps {
  notification: Notification;
  onMarkRead?: (id: string) => void;
}

function getTypeConfig(type: Notification["type"]) {
  switch (type) {
    case "info":
      return { icon: Info, color: "text-blue-500", bg: "bg-blue-50" };
    case "warning":
      return { icon: AlertTriangle, color: "text-ptba-gold", bg: "bg-amber-50" };
    case "success":
      return { icon: CheckCircle, color: "text-ptba-green", bg: "bg-green-50" };
    case "error":
      return { icon: XCircle, color: "text-ptba-red", bg: "bg-red-50" };
  }
}

function timeAgo(dateStr: string): string {
  const now = new Date("2026-03-04T10:00:00Z");
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMinutes < 60) return `${diffMinutes} menit lalu`;
  if (diffHours < 24) return `${diffHours} jam lalu`;
  if (diffDays === 1) return "Kemarin";
  if (diffDays < 7) return `${diffDays} hari lalu`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} minggu lalu`;
  return `${Math.floor(diffDays / 30)} bulan lalu`;
}

export function NotificationItem({
  notification,
  onMarkRead,
}: NotificationItemProps) {
  const config = getTypeConfig(notification.type);
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-lg p-4 transition-colors cursor-pointer",
        notification.read
          ? "bg-white hover:bg-ptba-off-white"
          : "bg-ptba-section-bg hover:bg-ptba-off-white"
      )}
      onClick={() => !notification.read && onMarkRead?.(notification.id)}
    >
      <div
        className={cn(
          "mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full",
          config.bg
        )}
      >
        <Icon className={cn("h-5 w-5", config.color)} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h4
            className={cn(
              "text-sm text-ptba-charcoal leading-tight",
              !notification.read && "font-semibold"
            )}
          >
            {notification.title}
          </h4>
          {!notification.read && (
            <span className="mt-1 h-2.5 w-2.5 flex-shrink-0 rounded-full bg-ptba-steel-blue" />
          )}
        </div>
        <p className="mt-1 text-sm text-ptba-gray line-clamp-2">
          {notification.message}
        </p>
        <p className="mt-1.5 text-xs text-ptba-gray">
          {timeAgo(notification.createdAt)}
        </p>
      </div>
    </div>
  );
}
