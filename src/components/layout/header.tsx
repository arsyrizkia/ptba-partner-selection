"use client";

import { Bell, ChevronDown, User, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import Breadcrumb, { type BreadcrumbItem } from "./breadcrumb";
import { useState } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { ROLES } from "@/lib/constants/roles";

interface HeaderProps {
  title: string;
  breadcrumbs?: BreadcrumbItem[];
}

export default function Header({ title, breadcrumbs }: HeaderProps) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { user, role, logout } = useAuth();
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

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <header className="fixed top-0 right-0 left-[260px] z-30 flex h-16 items-center justify-between border-b border-ptba-light-gray bg-white px-6">
      {/* Left: Breadcrumbs */}
      <Breadcrumb items={items} />

      {/* Right: Actions */}
      <div className="flex items-center gap-4">
        {/* Notification Bell */}
        <button
          className="relative rounded-lg p-2 text-ptba-gray transition-colors hover:bg-ptba-section-bg hover:text-ptba-navy"
          title="Notifikasi"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-ptba-red" />
        </button>

        {/* User Avatar Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
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
