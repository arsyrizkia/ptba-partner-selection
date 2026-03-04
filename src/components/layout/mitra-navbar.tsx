"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useAuth } from "@/lib/auth/auth-context";
import { MITRA_NAVIGATION } from "@/lib/constants/navigation";

export default function MitraNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-40 border-b border-ptba-light-gray bg-white shadow-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        {/* Left: Logo + Portal Mitra */}
        <div className="flex items-center gap-4">
          <Image
            src="/ptba-logo.svg"
            alt="PT Bukit Asam Tbk"
            width={140}
            height={25}
            priority
          />
          <div className="h-6 w-px bg-ptba-light-gray" />
          <span className="text-sm font-semibold text-ptba-navy">
            Portal Mitra
          </span>
        </div>

        {/* Center: Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {MITRA_NAVIGATION.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-ptba-navy text-white"
                    : "text-ptba-gray hover:bg-ptba-section-bg hover:text-ptba-navy"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right: User + Logout */}
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-ptba-charcoal">
              {user?.name}
            </p>
            <p className="text-xs text-ptba-gray">Mitra</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-ptba-gray transition-colors hover:bg-ptba-section-bg hover:text-ptba-red"
            title="Keluar"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
