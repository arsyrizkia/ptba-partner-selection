"use client";

import { Bell, ChevronDown, User, LogOut, Menu } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Breadcrumb, { type BreadcrumbItem } from "./breadcrumb";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { ROLES } from "@/lib/constants/roles";
import { api } from "@/lib/api/client";
import { NotificationItem } from "@/components/features/notification/notification-item";
import type { Notification } from "@/lib/types";

interface NotificationRow {
  id: string;
  user_id?: string;
  title: string;
  message: string;
  type: "info" | "warning" | "success" | "error";
  read: boolean;
  link?: string | null;
  created_at?: string;
  createdAt?: string;
}

function toNotification(row: NotificationRow): Notification {
  return {
    id: row.id,
    title: row.title,
    message: row.message,
    type: row.type,
    read: row.read,
    createdAt: row.createdAt || row.created_at || "",
    link: row.link ?? undefined,
  };
}

interface HeaderProps {
  title: string;
  breadcrumbs?: BreadcrumbItem[];
  onMobileMenuToggle?: () => void;
}

export default function Header({ title, breadcrumbs, onMobileMenuToggle }: HeaderProps) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { user, role, accessToken, logout } = useAuth();
  const router = useRouter();

  const initials = user
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "??";

  const roleLabel = ROLES.find((r) => r.value === role)?.label ?? "";

  const defaultBreadcrumbs: BreadcrumbItem[] = [
    { label: "Beranda", href: "/dashboard" },
    { label: title },
  ];

  const items = breadcrumbs ?? defaultBreadcrumbs;

  const fetchNotifications = useCallback(async () => {
    if (!accessToken) return;
    try {
      const data = await api<{ notifications: NotificationRow[] }>("/dashboard/notifications", { token: accessToken });
      setNotifications((data.notifications ?? []).map(toNotification));
    } catch {
      /* ignore */
    }
  }, [accessToken]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    const handler = () => fetchNotifications();
    window.addEventListener("notifications-updated", handler);
    return () => window.removeEventListener("notifications-updated", handler);
  }, [fetchNotifications]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkRead = async (id: string) => {
    if (!accessToken) return;
    try {
      await api(`/dashboard/notifications/${id}/read`, { method: "PUT", token: accessToken });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch {
      /* ignore */
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <header className="fixed top-0 right-0 left-0 lg:left-[260px] z-30 flex h-16 items-center justify-between border-b border-ptba-light-gray bg-white px-4 lg:px-6">
      {/* Left: Hamburger + Breadcrumbs */}
      <div className="flex items-center gap-3">
        {onMobileMenuToggle && (
          <button
            onClick={onMobileMenuToggle}
            className="rounded-lg p-2 text-ptba-gray hover:bg-ptba-section-bg hover:text-ptba-navy transition-colors lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}
        <Breadcrumb items={items} />
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-4">
        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => { setShowNotifs(!showNotifs); setShowUserMenu(false); }}
            className="relative rounded-lg p-2 text-ptba-gray transition-colors hover:bg-ptba-section-bg hover:text-ptba-navy"
            title="Notifikasi"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-ptba-red text-[10px] font-bold text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {showNotifs && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowNotifs(false)} />
              <div className="absolute right-0 z-20 mt-1 w-96 rounded-xl border border-ptba-light-gray bg-white shadow-lg">
                <div className="flex items-center justify-between border-b border-ptba-light-gray px-4 py-3">
                  <h3 className="text-sm font-semibold text-ptba-charcoal">Notifikasi</h3>
                  {unreadCount > 0 && (
                    <span className="rounded-full bg-ptba-steel-blue/10 px-2 py-0.5 text-xs font-medium text-ptba-steel-blue">
                      {unreadCount} belum dibaca
                    </span>
                  )}
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="py-8 text-center text-sm text-ptba-gray">Belum ada notifikasi.</p>
                  ) : (
                    <div className="divide-y divide-ptba-light-gray/50">
                      {notifications.slice(0, 10).map((notif) => (
                        <NotificationItem
                          key={notif.id}
                          notification={notif}
                          onMarkRead={handleMarkRead}
                        />
                      ))}
                    </div>
                  )}
                </div>
                {notifications.length > 0 && (
                  <div className="border-t border-ptba-light-gray px-4 py-2">
                    <Link
                      href="/notifications"
                      onClick={() => setShowNotifs(false)}
                      className="block text-center text-xs font-medium text-ptba-navy hover:underline"
                    >
                      Lihat Semua Notifikasi
                    </Link>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* User Avatar Dropdown */}
        <div className="relative">
          <button
            onClick={() => { setShowUserMenu(!showUserMenu); setShowNotifs(false); }}
            className="flex items-center gap-2 rounded-lg p-1.5 transition-colors hover:bg-ptba-section-bg"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-ptba-navy text-xs font-bold text-white">
              {initials}
            </div>
            <div className="text-left hidden sm:block">
              <span className="block text-sm font-medium text-ptba-charcoal leading-tight">
                {user?.name ?? "—"}
              </span>
              <span className="block text-[10px] text-ptba-gray leading-tight">{roleLabel}</span>
            </div>
            <ChevronDown className="h-4 w-4 text-ptba-gray" />
          </button>

          {/* Dropdown Menu */}
          {showUserMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowUserMenu(false)}
              />
              <div className="absolute right-0 z-20 mt-1 w-48 rounded-lg border border-ptba-light-gray bg-white py-1 shadow-lg">
                <button
                  onClick={() => { setShowUserMenu(false); router.push("/account"); }}
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm text-ptba-charcoal hover:bg-ptba-section-bg"
                >
                  <User className="h-4 w-4" />
                  Profil Saya
                </button>
                <hr className="my-1 border-ptba-light-gray" />
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm text-ptba-red hover:bg-ptba-section-bg"
                >
                  <LogOut className="h-4 w-4" />
                  Keluar
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
