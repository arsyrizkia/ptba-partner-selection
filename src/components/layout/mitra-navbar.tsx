"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Building2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useAuth } from "@/lib/auth/auth-context";
import { partnerApi } from "@/lib/api/client";
import { MITRA_NAVIGATION } from "@/lib/constants/navigation";
import { useTranslations } from "next-intl";
import { useLocale } from "@/lib/i18n/locale-context";
import type { Locale } from "@/lib/i18n/config";

export default function MitraNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, accessToken, logout } = useAuth();
  const t = useTranslations("navigation");
  const { locale, setLocale } = useLocale();
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.partnerId || !accessToken) return;
    partnerApi(accessToken).getById(user.partnerId).then((p) => {
      setLogoUrl(p.logo_url || null);
    }).catch(() => {});
  }, [user?.partnerId, accessToken]);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const toggleLocale = () => {
    setLocale(locale === "id" ? "en" : "id" as Locale);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-40 border-b border-ptba-light-gray bg-white shadow-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        {/* Left: Logo + Portal Mitra */}
        <div className="flex items-center gap-4">
          <Image
            src="/ptba-logo.svg"
            alt="PT Bukit Asam Persero Tbk"
            width={140}
            height={25}
            priority
          />
          <div className="h-6 w-px bg-ptba-light-gray" />
          <span className="text-sm font-semibold text-ptba-navy">
            {t("portalMitra")}
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
                {item.labelKey ? t(item.labelKey) : item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right: Language Toggle + User + Logout */}
        <div className="flex items-center gap-3">
          {/* Language Switcher */}
          <button
            onClick={toggleLocale}
            className="flex items-center rounded-lg border border-ptba-light-gray px-2 py-1.5 text-xs font-semibold transition-colors hover:bg-ptba-section-bg"
            title={locale === "id" ? "Switch to English" : "Ganti ke Bahasa Indonesia"}
          >
            <span className={cn(
              "px-1",
              locale === "id" ? "text-ptba-navy" : "text-ptba-gray"
            )}>
              ID
            </span>
            <span className="text-ptba-light-gray">|</span>
            <span className={cn(
              "px-1",
              locale === "en" ? "text-ptba-navy" : "text-ptba-gray"
            )}>
              EN
            </span>
          </button>

          {logoUrl ? (
            <img src={logoUrl} alt="" className="h-8 w-8 rounded-full object-contain border border-ptba-light-gray bg-white" />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-ptba-section-bg border border-ptba-light-gray">
              <Building2 className="h-4 w-4 text-ptba-gray" />
            </div>
          )}
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-ptba-charcoal">
              {user?.name}
            </p>
            <p className="text-xs text-ptba-gray">{t("logout") === "Logout" ? "Partner" : "Mitra"}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-ptba-gray transition-colors hover:bg-ptba-section-bg hover:text-ptba-red"
            title={t("logout")}
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
