"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { Tabs } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { NotificationItem } from "@/components/features/notification/notification-item";
import { useAuth } from "@/lib/auth/auth-context";
import { api } from "@/lib/api/client";
import type { Notification } from "@/lib/types";
import { BellRing, CheckCheck, Loader2 } from "lucide-react";

interface NotificationRow {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "success" | "error";
  read: boolean;
  link: string | null;
  created_at: string;
  updated_at: string;
}

function toNotification(row: NotificationRow): Notification {
  return {
    id: row.id,
    title: row.title,
    message: row.message,
    type: row.type,
    read: row.read,
    createdAt: row.created_at,
    link: row.link ?? undefined,
  };
}

const filterTabs = [
  { key: "all", label: "Semua" },
  { key: "info", label: "Info" },
  { key: "warning", label: "Peringatan" },
  { key: "success", label: "Sukses" },
  { key: "error", label: "Error" },
];

export default function NotificationsPage() {
  const { accessToken } = useAuth();
  const [activeTab, setActiveTab] = useState("all");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!accessToken) return;
    try {
      const res = await api<{ notifications: NotificationRow[] }>(
        "/dashboard/notifications",
        { token: accessToken }
      );
      setNotifications(res.notifications.map(toNotification));
    } catch {
      // silently fail — empty state will show
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const filteredNotifications = useMemo(() => {
    if (activeTab === "all") return notifications;
    return notifications.filter((n) => n.type === activeTab);
  }, [activeTab, notifications]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const handleMarkAllRead = async () => {
    if (!accessToken) return;
    setMarkingAll(true);
    try {
      const unread = notifications.filter((n) => !n.read);
      await Promise.all(
        unread.map((n) =>
          api(`/dashboard/notifications/${n.id}/read`, {
            method: "PUT",
            token: accessToken,
          })
        )
      );
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      window.dispatchEvent(new Event("notifications-updated"));
    } catch {
      // ignore
    } finally {
      setMarkingAll(false);
    }
  };

  const handleMarkRead = async (id: string) => {
    if (!accessToken) return;
    try {
      await api(`/dashboard/notifications/${id}/read`, {
        method: "PUT",
        token: accessToken,
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      window.dispatchEvent(new Event("notifications-updated"));
    } catch {
      // ignore
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-ptba-navy" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-ptba-charcoal">
            Pusat Notifikasi
          </h1>
          {unreadCount > 0 && (
            <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-ptba-red px-2 text-xs font-medium text-white">
              {unreadCount}
            </span>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleMarkAllRead}
          disabled={unreadCount === 0 || markingAll}
        >
          {markingAll ? (
            <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
          ) : (
            <CheckCheck className="h-4 w-4 mr-1.5" />
          )}
          Tandai Semua Dibaca
        </Button>
      </div>

      <Tabs tabs={filterTabs} activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="rounded-xl bg-white shadow-sm divide-y divide-ptba-light-gray">
        {filteredNotifications.map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onMarkRead={handleMarkRead}
          />
        ))}
      </div>

      {filteredNotifications.length === 0 && (
        <div className="rounded-xl bg-white p-12 text-center shadow-sm">
          <BellRing className="h-12 w-12 text-ptba-light-gray mx-auto mb-3" />
          <p className="text-ptba-gray">
            Tidak ada notifikasi untuk kategori ini.
          </p>
        </div>
      )}
    </div>
  );
}
