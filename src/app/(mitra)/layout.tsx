"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import MitraNavbar from "@/components/layout/mitra-navbar";
import RoleSwitcher from "@/components/layout/role-switcher";

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
    <div className="min-h-screen bg-ptba-off-white">
      <MitraNavbar />
      <main className="mx-auto max-w-7xl pt-16 p-6">{children}</main>
      <RoleSwitcher />
    </div>
  );
}
