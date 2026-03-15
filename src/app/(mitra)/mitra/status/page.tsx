"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, Clock, FolderKanban, XCircle, Loader2, ArrowRight, Trophy, Circle } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useAuth } from "@/lib/auth/auth-context";
import { api } from "@/lib/api/client";
import { formatDate } from "@/lib/utils/format";

// Mitra-visible milestones (simplified from 13 internal steps)
const MITRA_MILESTONES = [
  { id: 1, name: "Pendaftaran EoI", stepRange: [2, 2], phase: "phase1" as const },
  { id: 2, name: "Pendaftaran Ditutup", stepRange: [3, 3], phase: "phase1" as const },
  { id: 3, name: "Evaluasi Fase 1", stepRange: [4, 6], phase: "phase1" as const },
  { id: 4, name: "Pengumuman Shortlist", stepRange: [7, 7], phase: "phase1" as const },
  { id: 5, name: "Pendaftaran Fase 2", stepRange: [8, 8], phase: "phase2" as const },
  { id: 6, name: "Evaluasi Fase 2", stepRange: [9, 10], phase: "phase2" as const },
  { id: 7, name: "Negosiasi", stepRange: [11, 11], phase: "phase2" as const },
  { id: 8, name: "Pengumuman Pemenang", stepRange: [12, 13], phase: "phase2" as const },
];

function deriveCurrentStep(app: any): number {
  if (app.current_eval_step) return app.current_eval_step;
  switch (app.status) {
    case "Dikirim": return 2;
    case "Dalam Review": return 4;
    case "Shortlisted": return 8;
    case "Terpilih": return 13;
    case "Ditolak": return 7;
    default: return 2;
  }
}

function getMilestoneStatus(milestone: typeof MITRA_MILESTONES[0], currentStep: number, isRejected: boolean) {
  const [start, end] = milestone.stepRange;
  if (currentStep > end) return "completed";
  if (currentStep >= start && currentStep <= end) {
    if (isRejected && milestone.stepRange[1] >= 7 && milestone.phase === "phase1") return "rejected";
    return "active";
  }
  return "pending";
}

const STATUS_BADGE: Record<string, { label: string; color: string; bg: string }> = {
  Dikirim: { label: "Dikirim", color: "text-ptba-steel-blue", bg: "bg-ptba-steel-blue/10 border-ptba-steel-blue/20" },
  "Dalam Review": { label: "Dalam Review", color: "text-amber-600", bg: "bg-amber-50 border-amber-200" },
  Shortlisted: { label: "Lolos Fase 1", color: "text-green-700", bg: "bg-green-50 border-green-200" },
  Terpilih: { label: "Terpilih", color: "text-green-700", bg: "bg-green-50 border-green-200" },
  Ditolak: { label: "Tidak Lolos", color: "text-red-600", bg: "bg-red-50 border-red-200" },
  Diterima: { label: "Diterima", color: "text-green-700", bg: "bg-green-50 border-green-200" },
};

export default function MitraStatusPage() {
  const { accessToken } = useAuth();
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!accessToken) return;
    api<{ applications: any[] }>("/applications", { token: accessToken })
      .then((res) => {
        setApplications((res.applications || []).filter((a: any) => a.status !== "Draft"));
      })
      .catch(() => setApplications([]))
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
      <h1 className="text-2xl font-bold text-ptba-charcoal">Status Pendaftaran</h1>

      {applications.length === 0 ? (
        <div className="rounded-xl bg-white p-12 text-center shadow-sm">
          <FolderKanban className="mx-auto h-12 w-12 text-ptba-light-gray" />
          <p className="mt-3 text-lg font-semibold text-ptba-charcoal">Belum ada pendaftaran</p>
          <p className="mt-1 text-sm text-ptba-gray">Anda belum mengajukan EoI ke proyek manapun.</p>
          <a href="/mitra/projects" className="mt-4 inline-flex rounded-lg bg-ptba-navy px-4 py-2 text-sm font-medium text-white hover:bg-ptba-navy/90 transition-colors">
            Lihat Proyek Tersedia
          </a>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((app) => {
            const badge = STATUS_BADGE[app.status] || STATUS_BADGE.Dikirim;
            const currentStep = deriveCurrentStep(app);
            const isRejected = app.status === "Ditolak" || app.phase1_result === "Tidak Lolos";
            const isWinner = app.status === "Terpilih";

            return (
              <div key={app.id} className="rounded-xl bg-white shadow-sm overflow-hidden">
                {/* Header */}
                <div className="p-5 pb-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-ptba-charcoal truncate">{app.project_name}</p>
                      <p className="text-xs text-ptba-gray mt-0.5">Diajukan {formatDate(app.applied_at)}</p>
                    </div>
                    <span className={cn(
                      "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold shrink-0",
                      badge.bg, badge.color
                    )}>
                      {badge.label}
                    </span>
                  </div>

                  {/* Winner banner */}
                  {isWinner && (
                    <div className="mt-3 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 p-3 text-white">
                      <div className="flex items-center gap-2">
                        <Trophy className="h-5 w-5 shrink-0" />
                        <p className="text-sm font-bold">Selamat! Anda terpilih sebagai mitra</p>
                      </div>
                    </div>
                  )}

                  {/* Rejected notice */}
                  {isRejected && (
                    <div className="mt-3 rounded-lg bg-red-50 border border-red-100 p-3">
                      <p className="text-xs text-red-600">
                        Proses seleksi berhenti di tahap ini.{" "}
                        <a href="/mitra/projects" className="font-medium underline hover:no-underline">Lihat proyek lain</a>
                      </p>
                    </div>
                  )}

                  {/* Shortlisted info */}
                  {app.status === "Shortlisted" && (
                    <div className="mt-3 pt-3 border-t border-green-100">
                      <p className="text-xs text-green-700">
                        Selamat! Perusahaan Anda lolos Fase 1. Informasi Fase 2 akan disampaikan melalui email.
                      </p>
                    </div>
                  )}
                </div>

                {/* Progress milestones */}
                <div className="border-t border-ptba-light-gray/50 px-5 py-4">
                  <div className="flex items-center gap-1">
                    {MITRA_MILESTONES.map((m, idx) => {
                      const status = getMilestoneStatus(m, currentStep, isRejected);
                      const isPhaseBreak = idx === 4; // Between phase1 and phase2

                      return (
                        <div key={m.id} className="flex items-center gap-1 flex-1 min-w-0">
                          {isPhaseBreak && (
                            <div className="w-px h-4 bg-ptba-light-gray mx-0.5 shrink-0" />
                          )}
                          <div className="group relative flex flex-col items-center flex-1 min-w-0">
                            {/* Dot */}
                            <div className={cn(
                              "h-3 w-3 rounded-full shrink-0 transition-colors",
                              status === "completed" ? "bg-green-500" :
                              status === "active" ? "bg-ptba-steel-blue ring-4 ring-ptba-steel-blue/20" :
                              status === "rejected" ? "bg-red-500" :
                              "bg-ptba-light-gray"
                            )} />
                            {/* Bar after dot (except last) */}
                            {idx < MITRA_MILESTONES.length - 1 && !isPhaseBreak && (
                              <div className={cn(
                                "absolute top-1.5 left-[calc(50%+6px)] right-0 h-0.5 -translate-y-1/2",
                                status === "completed" ? "bg-green-300" : "bg-ptba-light-gray/50"
                              )} />
                            )}
                            {/* Label */}
                            <p className={cn(
                              "mt-1.5 text-[10px] leading-tight text-center",
                              status === "completed" ? "text-green-700 font-medium" :
                              status === "active" ? "text-ptba-steel-blue font-semibold" :
                              status === "rejected" ? "text-red-600 font-medium" :
                              "text-ptba-gray/60"
                            )}>
                              {m.name}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {/* Phase labels */}
                  <div className="flex mt-2">
                    <div className="flex-1 text-center">
                      <span className="text-[9px] font-medium text-ptba-navy/40 uppercase tracking-wider">Fase 1</span>
                    </div>
                    <div className="flex-1 text-center">
                      <span className="text-[9px] font-medium text-ptba-navy/40 uppercase tracking-wider">Fase 2</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
