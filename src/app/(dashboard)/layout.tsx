"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { useAuth } from "@/lib/auth/auth-context";

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

// Konsultan only get the project list, the read-only project view and their account
function isKonsultanPath(pathname: string): boolean {
  if (pathname === "/projects" || pathname === "/account") return true;
  return /^\/projects\/[^/]+$/.test(pathname) && pathname !== "/projects/create";
}

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
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!user) {
      router.replace("/login");
    } else if (role === "mitra") {
      router.replace("/mitra/dashboard");
    } else if (role === "konsultan" && !isKonsultanPath(pathname)) {
      router.replace("/projects");
    }
  }, [user, role, router, pathname]);

  if (!user || role === "mitra" || (role === "konsultan" && !isKonsultanPath(pathname))) {
    return null;
  }

  return (
    <div className="min-h-screen bg-ptba-off-white">
      <Sidebar
        currentPath={pathname}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      <Header
        title={title}
        onMobileMenuToggle={() => setMobileOpen((prev) => !prev)}
      />
      <main className="min-h-screen pt-16 px-4 pb-4 lg:ml-[260px] lg:px-6 lg:pb-6">{children}</main>
    </div>
  );
}
