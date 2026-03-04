"use client";

import { useState, useMemo } from "react";
import { CheckCircle2, Circle, Clock, Trophy, FolderKanban } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useAuth } from "@/lib/auth/auth-context";
import { mockApplications } from "@/lib/mock-data/applications";
import { mockProjects } from "@/lib/mock-data/projects";
import { formatDate } from "@/lib/utils/format";

interface ProcessStep {
  id: number;
  name: string;
  description: string;
  status: "completed" | "active" | "pending";
  date?: string;
}

const EVAL_STEPS = [
  { id: 1, name: "Pendaftaran Mitra", description: "Registrasi dan pembuatan akun portal mitra" },
  { id: 2, name: "Upload Dokumen", description: "Pengunggahan dokumen kualifikasi wajib" },
  { id: 3, name: "Verifikasi Dokumen", description: "Pemeriksaan kelengkapan dan keabsahan dokumen" },
  { id: 4, name: "Input Data Keuangan", description: "Pengisian data keuangan 3 tahun terakhir" },
  { id: 5, name: "Evaluasi Pasar & Teknis", description: "Penilaian aspek pasar dan kemampuan teknis" },
  { id: 6, name: "Evaluasi Keuangan (KEP-100)", description: "Analisis kesehatan keuangan berdasarkan KEP-100" },
  { id: 7, name: "Evaluasi Hukum", description: "Pemeriksaan aspek legal dan kepatuhan regulasi" },
  { id: 8, name: "Evaluasi Risiko", description: "Penilaian dan mitigasi risiko kerjasama" },
  { id: 9, name: "Evaluasi ESG", description: "Penilaian aspek lingkungan, sosial, dan tata kelola" },
  { id: 10, name: "Konsolidasi Evaluasi", description: "Penggabungan seluruh hasil evaluasi dan scoring akhir" },
  { id: 11, name: "Review Direksi", description: "Pemeriksaan dan persetujuan oleh Direktur Pembina" },
  { id: 12, name: "Keputusan Akhir", description: "Penetapan hasil pemilihan mitra" },
  { id: 13, name: "Penandatanganan Kontrak", description: "Penandatanganan perjanjian kerjasama" },
];

function StepIcon({ status }: { status: ProcessStep["status"] }) {
  switch (status) {
    case "completed":
      return (
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-ptba-green text-white">
          <CheckCircle2 className="h-5 w-5" />
        </div>
      );
    case "active":
      return (
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-ptba-steel-blue text-white animate-pulse">
          <Clock className="h-5 w-5" />
        </div>
      );
    case "pending":
      return (
        <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-ptba-light-gray bg-white text-ptba-gray">
          <Circle className="h-5 w-5" />
        </div>
      );
  }
}

function buildTimeline(currentEvalStep?: number): ProcessStep[] {
  const current = currentEvalStep ?? 0;
  return EVAL_STEPS.map((step) => ({
    ...step,
    status: step.id < current ? "completed" as const : step.id === current ? "active" as const : "pending" as const,
  }));
}

export default function MitraStatusPage() {
  const { user } = useAuth();
  const userApplications = useMemo(
    () => mockApplications.filter((a) => a.partnerId === user?.partnerId),
    [user?.partnerId]
  );

  const [activeTab, setActiveTab] = useState(userApplications[0]?.id ?? "");

  const selectedApp = userApplications.find((a) => a.id === activeTab);

  // Empty state
  if (userApplications.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-ptba-charcoal">Status Pemilihan Mitra</h1>
        <div className="rounded-xl bg-white p-12 text-center shadow-sm">
          <FolderKanban className="mx-auto h-12 w-12 text-ptba-light-gray" />
          <p className="mt-3 text-lg font-semibold text-ptba-charcoal">Belum ada lamaran</p>
          <p className="mt-1 text-sm text-ptba-gray">Anda belum mengajukan lamaran ke proyek manapun.</p>
          <a
            href="/mitra/projects"
            className="mt-4 inline-flex rounded-lg bg-ptba-navy px-4 py-2 text-sm font-medium text-white hover:bg-ptba-navy/90 transition-colors"
          >
            Lihat Proyek Tersedia
          </a>
        </div>
      </div>
    );
  }

  const timeline = selectedApp ? buildTimeline(selectedApp.currentEvalStep) : [];
  const completedCount = timeline.filter((s) => s.status === "completed").length;
  const activeStep = timeline.find((s) => s.status === "active");
  const pct = timeline.length > 0 ? Math.round((completedCount / timeline.length) * 100) : 0;

  // Check if this project has a winner
  const project = selectedApp ? mockProjects.find((p) => p.id === selectedApp.projectId) : null;
  const isWinner = project?.winnerId === user?.partnerId;
  const hasWinner = !!project?.winnerId;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-ptba-charcoal">Status Pemilihan Mitra</h1>

      {/* Tab bar for each application */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {userApplications.map((app) => (
          <button
            key={app.id}
            onClick={() => setActiveTab(app.id)}
            className={cn(
              "shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
              activeTab === app.id
                ? "bg-ptba-navy text-white"
                : "bg-white border border-ptba-light-gray text-ptba-charcoal hover:bg-ptba-section-bg"
            )}
          >
            {app.projectName.length > 35 ? app.projectName.substring(0, 35) + "..." : app.projectName}
          </button>
        ))}
      </div>

      {selectedApp && (
        <>
          {/* Winner Announcement */}
          {hasWinner && (
            <div className={cn(
              "rounded-xl p-6",
              isWinner
                ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white"
                : "bg-white border border-ptba-light-gray"
            )}>
              {isWinner ? (
                <div className="flex items-center gap-4">
                  <Trophy className="h-10 w-10 shrink-0" />
                  <div>
                    <p className="text-xl font-bold">Selamat! Anda Terpilih sebagai Mitra</p>
                    <p className="mt-1 text-white/80 text-sm">
                      Perusahaan Anda telah terpilih sebagai mitra untuk proyek {selectedApp.projectName}.
                      {project?.winnerAnnouncedAt && ` Diumumkan pada ${formatDate(project.winnerAnnouncedAt)}.`}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-2">
                  <p className="text-sm font-medium text-ptba-charcoal">
                    Terima kasih atas partisipasi Anda dalam proses pemilihan mitra untuk proyek ini.
                  </p>
                  <p className="mt-1 text-xs text-ptba-gray">
                    Mitra lain telah terpilih untuk proyek ini. Kami menghargai waktu dan upaya Anda.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Progress Summary */}
          <div className="rounded-xl bg-gradient-to-r from-ptba-navy to-ptba-steel-blue p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-sm">Langkah saat ini</p>
                <p className="text-xl font-bold mt-1">{activeStep?.name ?? "Selesai"}</p>
                <p className="text-white/70 text-sm mt-1">{activeStep?.description ?? "Semua langkah telah selesai"}</p>
              </div>
              <div className="text-right">
                <p className="text-4xl font-bold">{pct}%</p>
                <p className="text-white/70 text-sm">{completedCount}/{timeline.length} langkah</p>
              </div>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/20">
              <div className="h-full rounded-full bg-ptba-gold transition-all" style={{ width: `${pct}%` }} />
            </div>
          </div>

          {/* Application Info */}
          <div className="flex flex-wrap gap-4 text-sm text-ptba-gray">
            <span>Status: <span className={cn(
              "font-medium",
              selectedApp.status === "Terpilih" ? "text-green-600" :
              selectedApp.status === "Ditolak" ? "text-ptba-red" :
              "text-ptba-steel-blue"
            )}>{selectedApp.status}</span></span>
            <span>Diajukan: {formatDate(selectedApp.appliedAt)}</span>
            <span>Dokumen: {selectedApp.documents.length} file</span>
          </div>

          {/* Timeline */}
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="mb-6 text-lg font-semibold text-ptba-charcoal">Timeline Proses</h2>
            <div className="relative">
              {timeline.map((step, idx) => (
                <div key={step.id} className="relative flex gap-4 pb-8 last:pb-0">
                  {idx < timeline.length - 1 && (
                    <div
                      className={cn(
                        "absolute left-5 top-10 w-0.5 h-full -translate-x-1/2",
                        step.status === "completed" ? "bg-ptba-green" : "bg-ptba-light-gray"
                      )}
                    />
                  )}
                  <div className="relative z-10 shrink-0">
                    <StepIcon status={step.status} />
                  </div>
                  <div className={cn("flex-1 rounded-lg border p-4 transition-colors", step.status === "active" ? "border-ptba-steel-blue/30 bg-ptba-steel-blue/5" : "border-ptba-light-gray/50")}>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className={cn(
                          "font-medium",
                          step.status === "completed" ? "text-ptba-charcoal" : step.status === "active" ? "text-ptba-steel-blue" : "text-ptba-gray"
                        )}>
                          {step.id}. {step.name}
                        </p>
                        <p className="mt-0.5 text-sm text-ptba-gray">{step.description}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
