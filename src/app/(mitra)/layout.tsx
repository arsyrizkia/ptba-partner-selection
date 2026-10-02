"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Eye, X } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { api } from "@/lib/api/client";
import { cn } from "@/lib/utils/cn";
import { useMitraPreview } from "@/lib/hooks/use-mitra-preview";
import MitraNavbar from "@/components/layout/mitra-navbar";
import PopupBanner from "@/components/features/popup-banner";
import { MitraIntlProvider } from "@/components/providers/mitra-intl-provider";

// Mitra pages an internal PIC may open in read-only preview mode
const PREVIEW_PATH = /^\/mitra\/projects\/([^/]+)(\/phase2)?\/?$/;

function PreviewBanner({ projectId, applicationId }: { projectId: string; applicationId: string }) {
  const pathname = usePathname();
  const { accessToken } = useAuth();
  const [partnerName, setPartnerName] = useState<string>("");

  useEffect(() => {
    if (!accessToken) return;
    api<{ application: any }>(`/applications/${applicationId}`, { token: accessToken })
      .then((res) => setPartnerName(res.application?.partner_name || ""))
      .catch(() => setPartnerName(""));
  }, [applicationId, accessToken]);

  const isPhase2 = pathname.endsWith("/phase2");
  const q = `?preview=${encodeURIComponent(applicationId)}`;

  return (
    <div className="fixed inset-x-0 top-0 z-40 border-b-2 border-ptba-gold bg-ptba-navy text-white shadow">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-6 py-3">
        <Eye className="h-5 w-5 shrink-0 text-ptba-gold" />
        <p className="flex-1 min-w-0 text-sm">
          <span className="font-semibold text-ptba-gold">Mode Pratinjau</span> — tampilan sebagai{" "}
          <span className="font-semibold">{partnerName || "Mitra"}</span>. Semua aksi dinonaktifkan.
        </p>
        <div className="flex items-center gap-1 rounded-lg bg-white/10 p-1 text-xs font-medium">
          <Link
            href={`/mitra/projects/${projectId}${q}`}
            className={cn("rounded-md px-3 py-1.5 transition-colors", !isPhase2 ? "bg-white text-ptba-navy" : "hover:bg-white/10")}
          >
            Detail Proyek
          </Link>
          <Link
            href={`/mitra/projects/${projectId}/phase2${q}`}
            className={cn("rounded-md px-3 py-1.5 transition-colors", isPhase2 ? "bg-white text-ptba-navy" : "hover:bg-white/10")}
          >
            Fase 2
          </Link>
        </div>
        <Link
          href={`/projects/${projectId}`}
          className="inline-flex items-center gap-1.5 rounded-lg border border-white/30 px-3 py-1.5 text-xs font-medium hover:bg-white/10 transition-colors"
        >
          <X className="h-3.5 w-3.5" /> Tutup Pratinjau
        </Link>
      </div>
    </div>
  );
}

function MitraLayoutInner({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, role } = useAuth();
  const { isPreview, previewAppId } = useMitraPreview();

  const previewMatch = isPreview ? pathname.match(PREVIEW_PATH) : null;
  const allowed = !!user && (role === "mitra" || !!previewMatch);

  useEffect(() => {
    if (!user) {
      router.replace("/login");
    } else if (!allowed) {
      router.replace("/dashboard");
    }
  }, [user, allowed, router]);

  if (!allowed) {
    return null;
  }

  if (previewMatch && previewAppId) {
    return (
      <MitraIntlProvider>
        <div className="min-h-screen bg-ptba-off-white">
          <PreviewBanner projectId={previewMatch[1]} applicationId={previewAppId} />
          <main className="mx-auto max-w-7xl pt-20 p-6">{children}</main>
        </div>
      </MitraIntlProvider>
    );
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

export default function MitraLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={null}>
      <MitraLayoutInner>{children}</MitraLayoutInner>
    </Suspense>
  );
}
