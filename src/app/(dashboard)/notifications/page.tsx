"use client";

import { useState, useMemo } from "react";
import { Tabs } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { NotificationItem } from "@/components/features/notification/notification-item";
import { mockNotifications } from "@/lib/mock-data";
import type { Notification } from "@/lib/types";
import { BellRing, CheckCheck } from "lucide-react";

const filterTabs = [
  { key: "all", label: "Semua" },
  { key: "info", label: "Info" },
  { key: "warning", label: "Peringatan" },
  { key: "success", label: "Sukses" },
  { key: "error", label: "Error" },
];

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [notifications, setNotifications] =
    useState<Notification[]>(mockNotifications);

  const filteredNotifications = useMemo(() => {
    if (activeTab === "all") return notifications;
    return notifications.filter((n) => n.type === activeTab);
  }, [activeTab, notifications]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleMarkRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

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
          disabled={unreadCount === 0}
        >
          <CheckCheck className="h-4 w-4 mr-1.5" />
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
