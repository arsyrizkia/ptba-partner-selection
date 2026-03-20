"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import MitraNavbar from "@/components/layout/mitra-navbar";
import PopupBanner from "@/components/features/popup-banner";
import { MitraIntlProvider } from "@/components/providers/mitra-intl-provider";

export default function MitraLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, role } = useAuth();

  useEffect(() => {
    if (!user) {
      router.replace("/login");
    } else if (role !== "mitra") {
      router.replace("/dashboard");
    }
  }, [user, role, router]);

  if (!user || role !== "mitra") {
    return null;
  }

  return (
    <MitraIntlProvider>
      <div className="min-h-screen bg-ptba-off-white">
        <MitraNavbar />
        <PopupBanner />
        <main className="mx-auto max-w-7xl pt-16 p-6">{children}</main>
      </div>
    </MitraIntlProvider>
  );
}
