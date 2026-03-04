"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { useAuth } from "@/lib/auth/auth-context";
import RoleSwitcher from "@/components/layout/role-switcher";

const pageTitleMap: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/projects": "Proyek",
  "/partners": "Mitra",
  "/approvals": "Persetujuan",
  "/documents": "Dokumen",
  "/notifications": "Notifikasi",
  "/notifications/sla": "SLA Monitoring",
  "/users": "Pengguna",
};

function getPageTitle(pathname: string): string {
  if (pageTitleMap[pathname]) {
    return pageTitleMap[pathname];
  }
  const sortedPaths = Object.keys(pageTitleMap).sort(
    (a, b) => b.length - a.length
  );
  for (const path of sortedPaths) {
    if (pathname.startsWith(path)) {
      return pageTitleMap[path];
    }
  }
  return "Dashboard";
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, role } = useAuth();
  const title = getPageTitle(pathname);

  useEffect(() => {
    if (!user) {
      router.replace("/login");
    } else if (role === "mitra") {
      router.replace("/mitra/dashboard");
    }
  }, [user, role, router]);

  if (!user || role === "mitra") {
    return null;
  }

  return (
    <div className="min-h-screen bg-ptba-off-white">
      <Sidebar currentPath={pathname} />
      <Header title={title} />
      <main className="ml-[260px] min-h-screen pt-16 p-6">{children}</main>
      <RoleSwitcher />
    </div>
  );
}
