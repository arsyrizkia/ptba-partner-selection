"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { FolderKanban, FileCheck, BarChart3, Bell, AlertCircle, ClipboardCheck, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useAuth } from "@/lib/auth/auth-context";
import { mockApplications } from "@/lib/mock-data/applications";
import { mockProjects } from "@/lib/mock-data/projects";

const mitraNotifications = [
  { icon: AlertCircle, title: "Dokumen SIUP akan expired dalam 30 hari", time: "1 jam lalu", color: "text-ptba-orange" },
  { icon: ClipboardCheck, title: "Evaluasi teknis telah dimulai untuk PLTU Mulut Tambang", time: "3 jam lalu", color: "text-ptba-steel-blue" },
  { icon: Bell, title: "Proyek baru tersedia: Pengembangan PLTU Mulut Tambang", time: "1 hari lalu", color: "text-ptba-gold" },
];

function statusBadge(status: string) {
  if (status === "Dalam Review" || status === "Dikirim") return "bg-ptba-steel-blue/10 text-ptba-steel-blue border border-ptba-steel-blue/20";
  if (status === "Terpilih") return "bg-green-100 text-green-700 border border-green-200";
  if (status === "Ditolak") return "bg-red-100 text-ptba-red border border-red-200";
  return "bg-ptba-gray/10 text-ptba-gray border border-ptba-gray/20";
}

export default function MitraDashboardPage() {
  const { user } = useAuth();
  const router = useRouter();

  const applications = useMemo(
    () => mockApplications.filter((a) => a.partnerId === user?.partnerId),
    [user?.partnerId]
  );

  const openProjectsCount = useMemo(
    () => mockProjects.filter((p) => p.isOpenForApplication).length,
    []
  );

  const docsUploaded = useMemo(() => {
    const total = applications.reduce((sum, a) => sum + a.documents.length, 0);
    const verified = applications.reduce((sum, a) => sum + a.documents.filter((d) => d.status === "Diverifikasi").length, 0);
    return total > 0 ? Math.round((verified / total) * 100) : 0;
  }, [applications]);

  return (
    <div className="space-y-6">
      {/* Welcome Card */}
      <div className="rounded-xl bg-gradient-to-r from-ptba-navy to-ptba-steel-blue p-6 text-white">
        <h1 className="text-2xl font-bold">Selamat Datang, {user?.name}</h1>
        <p className="mt-1 text-white/80 text-sm">Portal Mitra - Sistem Pemilihan Mitra PT Bukit Asam Tbk</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl bg-white p-5 shadow-sm">
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
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-ptba-gray">Dokumen Terverifikasi</p>
              <p className="mt-1 text-3xl font-bold text-ptba-charcoal">{docsUploaded}%</p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-ptba-gold">
              <FileCheck className="h-6 w-6 text-white" />
            </div>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-ptba-light-gray">
            <div className={cn("h-full rounded-full", docsUploaded === 100 ? "bg-ptba-green" : "bg-ptba-gold")} style={{ width: `${docsUploaded}%` }} />
          </div>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm">
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
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Active Applications */}
        <div className="lg:col-span-2 rounded-xl bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-ptba-charcoal">Lamaran Saya</h2>
          {applications.length === 0 ? (
            <div className="py-8 text-center text-sm text-ptba-gray">
              Belum ada lamaran.{" "}
              <a href="/mitra/projects" className="text-ptba-steel-blue hover:underline">Lihat proyek tersedia</a>
            </div>
          ) : (
            <div className="space-y-4">
              {applications.map((app) => {
                const evalPct = app.currentEvalStep && app.totalEvalSteps
                  ? Math.round((app.currentEvalStep / app.totalEvalSteps) * 100)
                  : 0;
                const verifiedDocs = app.documents.filter((d) => d.status === "Diverifikasi").length;
                const docPct = app.documents.length > 0 ? Math.round((verifiedDocs / app.documents.length) * 100) : 0;
                return (
                  <div key={app.id} className="rounded-lg border border-ptba-light-gray p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium text-ptba-charcoal">{app.projectName}</h3>
                        <span className={cn("mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium", statusBadge(app.status))}>
                          {app.status}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-ptba-charcoal">{evalPct}%</span>
                    </div>
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs text-ptba-gray mb-1">
                        <span>Progres Evaluasi</span>
                        <span>{app.currentEvalStep}/{app.totalEvalSteps}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-ptba-light-gray">
                        <div className="h-full rounded-full bg-ptba-steel-blue" style={{ width: `${evalPct}%` }} />
                      </div>
                    </div>
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-xs text-ptba-gray mb-1">
                        <span>Dokumen Terverifikasi</span>
                        <span>{docPct}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-ptba-light-gray">
                        <div className={cn("h-full rounded-full", docPct === 100 ? "bg-ptba-green" : "bg-ptba-gold")} style={{ width: `${docPct}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <div className="space-y-6">
          {/* Quick Link */}
          <button
            onClick={() => router.push("/mitra/projects")}
            className="w-full rounded-xl bg-white p-5 shadow-sm border border-ptba-light-gray/50 text-left hover:shadow-md hover:border-ptba-steel-blue/30 transition-all"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-ptba-charcoal">Proyek Tersedia</p>
                <p className="mt-0.5 text-xs text-ptba-gray">Lihat dan lamar proyek baru</p>
              </div>
              <ArrowRight className="h-5 w-5 text-ptba-steel-blue" />
            </div>
          </button>

          {/* Notifications */}
          <div className="rounded-xl bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-ptba-charcoal">Notifikasi</h2>
            <div className="space-y-4">
              {mitraNotifications.map((notif, idx) => {
                const Icon = notif.icon;
                return (
                  <div key={idx} className="flex items-start gap-3 rounded-lg p-2 transition-colors hover:bg-ptba-section-bg">
                    <div className={cn("mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ptba-section-bg", notif.color)}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm leading-snug text-ptba-charcoal">{notif.title}</p>
                      <p className="mt-0.5 text-xs text-ptba-gray">{notif.time}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
