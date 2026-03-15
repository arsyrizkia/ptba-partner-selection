"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  CheckSquare,
  FileText,
  Bell,
  Clock,
  Settings,
  LogOut,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useAuth } from "@/lib/auth/auth-context";
import { NAVIGATION } from "@/lib/constants/navigation";
import { ROLES } from "@/lib/constants/roles";

const ICON_MAP: Record<string, LucideIcon> = {
  LayoutDashboard,
  FolderKanban,
  Users,
  CheckSquare,
  FileText,
  Bell,
  Clock,
  Settings,
};

interface SidebarProps {
  currentPath: string;
}

export default function Sidebar({ currentPath }: SidebarProps) {
  const { user, role, logout } = useAuth();
  const router = useRouter();

  const filteredNav = NAVIGATION.filter(
    (item) => role && item.allowedRoles.includes(role)
  );

  const initials = user
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "??";

  const roleLabel = ROLES.find((r) => r.value === role)?.label ?? "";

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-[260px] flex-col bg-ptba-navy">
      {/* Logo Area */}
      <div className="px-6 pt-6 pb-4">
        <Image
          src="/ptba-logo.svg"
          alt="PT Bukit Asam Tbk"
          width={160}
          height={29}
          className="brightness-0 invert mb-2"
          priority
        />
        <p className="text-sm text-ptba-gold">Sistem Pemilihan Mitra</p>
      </div>

      {/* Gold Divider */}
      <div className="mx-6 h-[2px] bg-ptba-gold" />

      {/* Navigation */}
      <nav className="mt-4 flex-1 space-y-1 overflow-y-auto px-3">
        {filteredNav.map((item) => {
          const isApprovalSubpage = currentPath.includes("/approval/");
          const isActive =
            currentPath === item.href ||
            (item.href === "/approvals" && isApprovalSubpage) ||
            (item.href !== "/dashboard" && !isApprovalSubpage && currentPath.startsWith(item.href));
          const Icon = ICON_MAP[item.icon] ?? LayoutDashboard;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "border-l-4 border-ptba-gold bg-ptba-navy-light text-white"
                  : "border-l-4 border-transparent text-white/70 hover:bg-ptba-navy-light hover:text-white"
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Gold Divider */}
      <div className="mx-6 h-[2px] bg-ptba-gold/30" />

      {/* User Info */}
      <div className="flex items-center gap-3 px-6 py-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ptba-gold text-sm font-bold text-ptba-charcoal">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-white">
            {user?.name ?? "—"}
          </p>
          <p className="truncate text-xs text-white/50">{roleLabel}</p>
        </div>
        <button
          onClick={handleLogout}
          className="text-white/40 transition-colors hover:text-white"
          title="Keluar"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </aside>
  );
}
