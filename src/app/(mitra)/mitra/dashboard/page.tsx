"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FolderKanban, FileCheck, BarChart3, ArrowRight, Loader2, Clock, CheckCircle2, XCircle, Inbox } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useAuth } from "@/lib/auth/auth-context";
import { api, projectApi } from "@/lib/api/client";
import { formatDate } from "@/lib/utils/format";

const STATUS_STYLE: Record<string, string> = {
  Dikirim: "bg-ptba-steel-blue/10 text-ptba-steel-blue border border-ptba-steel-blue/20",
  "Dalam Review": "bg-amber-50 text-amber-600 border border-amber-200",
  Shortlisted: "bg-green-50 text-green-700 border border-green-200",
  Terpilih: "bg-green-100 text-green-700 border border-green-200",
  Ditolak: "bg-red-50 text-red-600 border border-red-200",
  Diterima: "bg-green-50 text-green-700 border border-green-200",
};

const STATUS_ICON: Record<string, typeof Clock> = {
  Dikirim: Clock,
  "Dalam Review": Clock,
  Shortlisted: CheckCircle2,
  Terpilih: CheckCircle2,
  Ditolak: XCircle,
};

export default function MitraDashboardPage() {
  const { user, accessToken } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<any[]>([]);
  const [openProjectsCount, setOpenProjectsCount] = useState(0);

  useEffect(() => {
    if (!accessToken) return;
    Promise.all([
      api<{ applications: any[] }>("/applications", { token: accessToken }),
      projectApi(accessToken).list(),
    ]).then(([appRes, projRes]) => {
      setApplications((appRes.applications || []).filter((a: any) => a.status !== "Draft"));
      const projects = projRes.data || [];
      setOpenProjectsCount(projects.filter((p: any) => p.isOpenForApplication).length);
    }).catch(() => {})
      .finally(() => setLoading(false));
  }, [accessToken]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-ptba-steel-blue" />
        <span className="ml-3 text-ptba-gray">Memuat...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Card */}
      <div className="rounded-xl bg-gradient-to-r from-ptba-navy to-ptba-steel-blue p-6 text-white">
        <h1 className="text-2xl font-bold">Selamat Datang, {user?.name}</h1>
        <p className="mt-1 text-white/80 text-sm">Portal Mitra - Sistem Pemilihan Mitra PT Bukit Asam Tbk</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl bg-white p-5 border border-ptba-light-gray/50">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-ptba-gray">Lamaran Aktif</p>
              <p className="mt-1 text-3xl font-bold text-ptba-charcoal">{applications.length}</p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-ptba-steel-blue">
              <FolderKanban className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-white p-5 border border-ptba-light-gray/50">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-ptba-gray">Proyek Tersedia</p>
              <p className="mt-1 text-3xl font-bold text-ptba-charcoal">{openProjectsCount}</p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-ptba-green">
              <BarChart3 className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
        <button
          onClick={() => router.push("/mitra/projects")}
          className="rounded-xl bg-white p-5 border border-ptba-light-gray/50 text-left hover:border-ptba-steel-blue/30 transition-all"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-ptba-charcoal">Cari Proyek</p>
              <p className="mt-0.5 text-xs text-ptba-gray">Lihat dan lamar proyek baru</p>
            </div>
            <ArrowRight className="h-5 w-5 text-ptba-steel-blue" />
          </div>
        </button>
      </div>

      {/* Lamaran Saya */}
      <div className="rounded-xl bg-white p-5 border border-ptba-light-gray/50">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-ptba-charcoal">Lamaran Saya</h2>
          {applications.length > 0 && (
            <button
              onClick={() => router.push("/mitra/status")}
              className="text-xs font-medium text-ptba-steel-blue hover:underline"
            >
              Lihat Semua
            </button>
          )}
        </div>

        {applications.length === 0 ? (
          <div className="py-10 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-ptba-section-bg">
              <Inbox className="h-8 w-8 text-ptba-light-gray" />
            </div>
            <p className="mt-4 text-sm font-medium text-ptba-charcoal">Belum ada lamaran</p>
            <p className="mt-1 text-xs text-ptba-gray max-w-xs mx-auto">
              Anda belum mengajukan Expression of Interest ke proyek manapun. Mulai dengan menjelajahi proyek yang tersedia.
            </p>
            <button
              onClick={() => router.push("/mitra/projects")}
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-ptba-navy px-4 py-2 text-sm font-medium text-white hover:bg-ptba-navy/90 transition-colors"
            >
              <FolderKanban className="h-4 w-4" />
              Jelajahi Proyek
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {applications.map((app) => {
              const Icon = STATUS_ICON[app.status] || Clock;
              return (
                <button
                  key={app.id}
                  onClick={() => router.push(`/mitra/projects/${app.project_id}`)}
                  className="w-full rounded-lg border border-ptba-light-gray p-4 text-left hover:border-ptba-steel-blue/30 hover:border border-ptba-light-gray/50 transition-all"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-ptba-charcoal truncate">{app.project_name}</p>
                      <p className="text-xs text-ptba-gray mt-0.5">
                        Diajukan {formatDate(app.applied_at)} · Fase {app.phase === "phase1" ? "1" : "2"}
                      </p>
                    </div>
                    <span className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium shrink-0",
                      STATUS_STYLE[app.status] || STATUS_STYLE.Dikirim
                    )}>
                      <Icon className="h-3 w-3" />
                      {app.status}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
