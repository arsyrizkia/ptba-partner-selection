"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useAuth } from "@/lib/auth/auth-context";
import { ROLES } from "@/lib/constants/roles";
import type { UserRole } from "@/lib/types";

export default function RoleSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const { role, switchRole } = useAuth();
  const router = useRouter();

  const currentLabel = ROLES.find((r) => r.value === role)?.label ?? role;

  const handleSwitch = (newRole: UserRole) => {
    switchRole(newRole);
    setIsOpen(false);
    if (newRole === "mitra") {
      router.push("/mitra/dashboard");
    } else if (role === "mitra") {
      router.push("/dashboard");
    } else {
      router.refresh();
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {isOpen ? (
        <div className="w-64 rounded-xl border border-ptba-light-gray bg-white shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-ptba-light-gray px-4 py-3">
            <span className="text-xs font-semibold text-ptba-gray uppercase tracking-wide">
              Demo Role Switcher
            </span>
            <button onClick={() => setIsOpen(false)} className="text-ptba-gray hover:text-ptba-charcoal">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Role List */}
          <div className="p-2 max-h-80 overflow-y-auto">
            {ROLES.map((r) => (
              <button
                key={r.value}
                onClick={() => handleSwitch(r.value)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                  role === r.value
                    ? "bg-ptba-navy text-white"
                    : "text-ptba-charcoal hover:bg-ptba-section-bg"
                )}
              >
                <span className={cn(
                  "h-2 w-2 shrink-0 rounded-full",
                  role === r.value ? "bg-ptba-gold" : "bg-ptba-light-gray"
                )} />
                <div>
                  <p className="font-medium">{r.label}</p>
                  <p className={cn("text-xs", role === r.value ? "text-white/60" : "text-ptba-gray")}>
                    {r.description}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 rounded-full bg-ptba-navy px-4 py-2.5 text-sm font-medium text-white shadow-lg hover:bg-ptba-navy-dark transition-colors"
          title="Switch Role (Demo)"
        >
          <RefreshCw className="h-4 w-4" />
          <span className="hidden sm:inline">{currentLabel}</span>
        </button>
      )}
    </div>
  );
}
