"use client";

import { useState, useMemo } from "react";
import { CheckCircle2, Circle, Clock, Trophy, FolderKanban, ArrowRight, XCircle, ShieldX, FileText, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useAuth } from "@/lib/auth/auth-context";
import { mockApplications } from "@/lib/mock-data/applications";
import { mockProjects } from "@/lib/mock-data/projects";
import { formatDate } from "@/lib/utils/format";
import { PROJECT_STEPS } from "@/lib/constants/project-steps";

interface ProcessStep {
  id: number;
  name: string;
  description: string;
  phase: "phase1" | "phase2";
  status: "completed" | "active" | "pending";
}

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
  return PROJECT_STEPS.map((step) => ({
    id: step.step,
    name: step.name,
    description: step.description,
    phase: step.phase,
    status: step.step < current ? "completed" as const : step.step === current ? "active" as const : "pending" as const,
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

  if (userApplications.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-ptba-charcoal">Status Pemilihan Mitra</h1>
        <div className="rounded-xl bg-white p-12 text-center shadow-sm">
          <FolderKanban className="mx-auto h-12 w-12 text-ptba-light-gray" />
          <p className="mt-3 text-lg font-semibold text-ptba-charcoal">Belum ada lamaran</p>
          <p className="mt-1 text-sm text-ptba-gray">Anda belum mengajukan lamaran ke proyek manapun.</p>
          <a href="/mitra/projects" className="mt-4 inline-flex rounded-lg bg-ptba-navy px-4 py-2 text-sm font-medium text-white hover:bg-ptba-navy/90 transition-colors">
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

  const project = selectedApp ? mockProjects.find((p) => p.id === selectedApp.projectId) : null;
  const isWinner = project?.winnerId === user?.partnerId;
  const hasWinner = !!project?.winnerId;
  const isRejectedPhase1 = selectedApp?.phase1Result === "Tidak Lolos";

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-ptba-charcoal">Status Pemilihan Mitra</h1>

      {/* Tab bar */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {userApplications.map((app) => {
          const rejected = app.phase1Result === "Tidak Lolos";
          return (
            <button
              key={app.id}
              onClick={() => setActiveTab(app.id)}
              className={cn(
                "shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                activeTab === app.id
                  ? rejected ? "bg-red-600 text-white" : "bg-ptba-navy text-white"
                  : rejected
                    ? "bg-red-50 border border-red-200 text-red-700 hover:bg-red-100"
                    : "bg-white border border-ptba-light-gray text-ptba-charcoal hover:bg-ptba-section-bg"
              )}
            >
              {app.projectName.length > 35 ? app.projectName.substring(0, 35) + "..." : app.projectName}
              {rejected && <span className="ml-1.5 text-[10px] opacity-80">(Tidak Lolos)</span>}
            </button>
          );
        })}
      </div>

      {selectedApp && (
        <>
          {/* Winner Announcement */}
          {hasWinner && !isRejectedPhase1 && (
            <div className={cn(
              "rounded-xl p-6",
              isWinner ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white" : "bg-white border border-ptba-light-gray"
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
                  <p className="text-sm font-medium text-ptba-charcoal">Terima kasih atas partisipasi Anda dalam proses pemilihan mitra untuk proyek ini.</p>
                  <p className="mt-1 text-xs text-ptba-gray">Mitra lain telah terpilih untuk proyek ini.</p>
                </div>
              )}
            </div>
          )}

          {/* ─── REJECTED PHASE 1 VIEW ─── */}
          {isRejectedPhase1 ? (
            <>
              {/* Rejection Banner */}
              <div className="rounded-xl border-2 border-red-200 bg-gradient-to-br from-red-50 to-red-100/50 p-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-red-100">
                    <ShieldX className="h-7 w-7 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-lg font-bold text-red-800">Tidak Lolos Phase 1</p>
                    <p className="mt-1 text-sm text-red-700">
                      Mohon maaf, perusahaan Anda tidak lolos tahap evaluasi Phase 1 (Expression of Interest) untuk proyek <span className="font-semibold">{selectedApp.projectName}</span>.
                    </p>
                    <p className="mt-2 text-xs text-red-600/80">
                      Proses seleksi Anda berhenti di tahap ini dan tidak dapat dilanjutkan ke Phase 2 (Detailed Assessment).
                    </p>
                  </div>
                </div>
              </div>

              {/* Frozen Progress Summary */}
              <div className="rounded-xl bg-gradient-to-r from-gray-500 to-gray-600 p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/80 text-sm">Status Akhir</p>
                    <p className="text-xl font-bold mt-1">Proses Dihentikan</p>
                    <p className="text-white/70 text-sm mt-1">Tidak lolos evaluasi Phase 1 — tidak dapat melanjutkan</p>
                    <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-red-500/30 px-2.5 py-0.5 text-[10px] font-medium">
                      <XCircle className="h-3 w-3" /> Phase 1 — Tidak Lolos
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10">
                      <XCircle className="h-8 w-8 text-red-300" />
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-0">
                  <div className="flex-1 h-2 overflow-hidden rounded-l-full bg-white/20">
                    <div className="h-full rounded-l-full bg-red-400 transition-all" style={{ width: `${Math.min(100, (completedCount / 7) * 100)}%` }} />
                  </div>
                  <div className="w-0.5 h-3 bg-white/30 mx-0.5" />
                  <div className="flex-1 h-2 overflow-hidden rounded-r-full bg-white/10">
                    <div className="h-full rounded-r-full bg-white/5" style={{ width: '0%' }} />
                  </div>
                </div>
                <div className="mt-1 flex justify-between text-[10px] text-white/40">
                  <span>Phase 1 — Dihentikan</span>
                  <span className="line-through">Phase 2</span>
                </div>
              </div>

              {/* Application Info */}
              <div className="flex flex-wrap gap-4 text-sm text-ptba-gray">
                <span>Status: <span className="font-medium text-red-600">{selectedApp.status}</span></span>
                <span>Diajukan: {formatDate(selectedApp.appliedAt)}</span>
                {selectedApp.phase1Documents && selectedApp.phase1Documents.length > 0 && (
                  <span>Dokumen Phase 1: {selectedApp.phase1Documents.length} file</span>
                )}
              </div>

              {/* Rejection Details Card */}
              <div className="rounded-xl bg-white p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  <h2 className="text-lg font-semibold text-ptba-charcoal">Informasi Evaluasi</h2>
                </div>
                <div className="space-y-3">
                  <div className="rounded-lg bg-red-50 border border-red-100 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <XCircle className="h-4 w-4 text-red-500" />
                      <p className="text-sm font-semibold text-red-800">Hasil Evaluasi Phase 1: Tidak Lolos</p>
                    </div>
                    <p className="text-xs text-red-700 leading-relaxed">
                      Berdasarkan hasil evaluasi dari Divisi Pengembangan Energi & Bisnis (EBD), perusahaan Anda belum memenuhi kriteria minimum yang dipersyaratkan pada tahap Expression of Interest.
                    </p>
                  </div>
                  <div className="rounded-lg border border-ptba-light-gray/50 p-4">
                    <p className="text-sm font-medium text-ptba-charcoal mb-2">Kriteria yang Dievaluasi:</p>
                    <ul className="space-y-1.5 text-xs text-ptba-gray">
                      <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-ptba-gray/40 shrink-0" />Kualitas Profil Perusahaan (20%)</li>
                      <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-ptba-gray/40 shrink-0" />Pengalaman Proyek Relevan (25%)</li>
                      <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-ptba-gray/40 shrink-0" />Kemampuan Pembiayaan (25%)</li>
                      <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-ptba-gray/40 shrink-0" />Gambaran Umum Keuangan (15%)</li>
                      <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-ptba-gray/40 shrink-0" />Pemenuhan Persyaratan (15%)</li>
                    </ul>
                  </div>
                  <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
                    <p className="text-sm font-medium text-blue-800 mb-1">Langkah Selanjutnya</p>
                    <p className="text-xs text-blue-700 leading-relaxed">
                      Anda masih dapat mendaftar pada proyek-proyek lain yang tersedia. Pastikan untuk melengkapi dokumen dan memenuhi seluruh persyaratan yang diminta.
                    </p>
                    <a
                      href="/mitra/projects"
                      className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-ptba-navy px-4 py-2 text-xs font-medium text-white hover:bg-ptba-navy/90 transition-colors"
                    >
                      <FolderKanban className="h-3.5 w-3.5" />
                      Lihat Proyek Lain yang Tersedia
                    </a>
                  </div>
                </div>
              </div>

              {/* Submitted Documents */}
              {selectedApp.phase1Documents && selectedApp.phase1Documents.length > 0 && (
                <div className="rounded-xl bg-white p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <FileText className="h-5 w-5 text-ptba-gray" />
                    <h2 className="text-lg font-semibold text-ptba-charcoal">Dokumen yang Telah Diajukan</h2>
                  </div>
                  <div className="space-y-2">
                    {selectedApp.phase1Documents.map((doc) => (
                      <div key={doc.id} className="flex items-center gap-3 rounded-lg border border-ptba-light-gray/50 p-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-ptba-section-bg">
                          <FileText className="h-4 w-4 text-ptba-gray" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-ptba-charcoal truncate">{doc.name}</p>
                          <p className="text-[11px] text-ptba-gray">Diunggah: {doc.uploadDate}</p>
                        </div>
                        <span className="shrink-0 rounded-full bg-ptba-gray/10 px-2 py-0.5 text-[10px] font-medium text-ptba-gray">
                          {doc.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Frozen Timeline — Phase 1 only */}
              <div className="rounded-xl bg-white p-6 shadow-sm">
                <h2 className="mb-6 text-lg font-semibold text-ptba-charcoal">Timeline Proses</h2>
                <div className="relative">
                  <div className="relative flex items-center gap-4 pb-4 mb-2">
                    <div className="h-px flex-1 bg-ptba-navy/30" />
                    <span className="shrink-0 rounded-full bg-ptba-navy/10 px-3 py-1 text-xs font-semibold text-ptba-navy">
                      Phase 1: Expression of Interest
                    </span>
                    <div className="h-px flex-1 bg-ptba-navy/30" />
                  </div>
                  {timeline.filter((s) => s.phase === "phase1").map((step, idx, arr) => {
                    const isLastCompleted = step.status === "completed" && (idx === arr.length - 1 || arr[idx + 1]?.status !== "completed");
                    const isFailed = step.id === 7; // Pengumuman Shortlist = rejection point
                    return (
                      <div key={step.id} className="relative flex gap-4 pb-8 last:pb-0">
                        {idx < arr.length - 1 && (
                          <div className={cn(
                            "absolute left-5 top-10 w-0.5 h-full -translate-x-1/2",
                            step.status === "completed" ? "bg-ptba-green" : "bg-ptba-light-gray"
                          )} />
                        )}
                        <div className="relative z-10 shrink-0">
                          {isFailed && step.status !== "pending" ? (
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500 text-white">
                              <XCircle className="h-5 w-5" />
                            </div>
                          ) : (
                            <StepIcon status={step.status} />
                          )}
                        </div>
                        <div className={cn(
                          "flex-1 rounded-lg border p-4 transition-colors",
                          isFailed && step.status !== "pending"
                            ? "border-red-200 bg-red-50"
                            : step.status === "active" ? "border-ptba-steel-blue/30 bg-ptba-steel-blue/5" : "border-ptba-light-gray/50"
                        )}>
                          <p className={cn(
                            "font-medium",
                            isFailed && step.status !== "pending" ? "text-red-700" :
                            step.status === "completed" ? "text-ptba-charcoal" :
                            step.status === "active" ? "text-ptba-steel-blue" : "text-ptba-gray"
                          )}>
                            {step.id}. {step.name}
                            {isFailed && step.status !== "pending" && (
                              <span className="ml-2 inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700">
                                Tidak Lolos
                              </span>
                            )}
                          </p>
                          <p className="mt-0.5 text-sm text-ptba-gray">{step.description}</p>
                        </div>
                      </div>
                    );
                  })}

                  {/* Phase 2 blocked section */}
                  <div className="mt-4 relative">
                    <div className="relative flex items-center gap-4 pb-4 mb-2">
                      <div className="h-px flex-1 bg-ptba-light-gray/50" />
                      <span className="shrink-0 rounded-full bg-ptba-light-gray/20 px-3 py-1 text-xs font-semibold text-ptba-gray/50 line-through">
                        Phase 2: Detailed Assessment
                      </span>
                      <div className="h-px flex-1 bg-ptba-light-gray/50" />
                    </div>
                    <div className="rounded-lg border-2 border-dashed border-ptba-light-gray/40 bg-ptba-section-bg/30 p-6 text-center">
                      <ShieldX className="mx-auto h-8 w-8 text-ptba-light-gray" />
                      <p className="mt-2 text-sm font-medium text-ptba-gray/60">Phase 2 Tidak Tersedia</p>
                      <p className="mt-0.5 text-xs text-ptba-gray/40">Anda tidak lolos Phase 1 sehingga tidak dapat melanjutkan ke tahap ini</p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Phase 1 Result (for passed) */}
              {selectedApp.phase1Result && !hasWinner && (
                <div className={cn(
                  "rounded-xl p-5 border",
                  "bg-green-50 border-green-200"
                )}>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                    <div>
                      <p className="text-sm font-bold text-green-800">
                        Hasil Phase 1: {selectedApp.phase1Result}
                      </p>
                      <p className="text-xs mt-0.5 text-green-700">
                        Anda diundang untuk melanjutkan ke Phase 2 (Detailed Assessment)
                      </p>
                      {project?.phase?.startsWith("phase2") && (
                        <a
                          href={`/mitra/projects/${selectedApp.projectId}/phase2`}
                          className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-green-700 hover:underline"
                        >
                          Lanjut ke Phase 2 <ArrowRight className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Progress Summary */}
              <div className="rounded-xl bg-gradient-to-r from-ptba-navy to-ptba-steel-blue p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/80 text-sm">Langkah saat ini</p>
                    <p className="text-xl font-bold mt-1">{activeStep?.name ?? "Selesai"}</p>
                    <p className="text-white/70 text-sm mt-1">{activeStep?.description ?? "Semua langkah telah selesai"}</p>
                    {activeStep && (
                      <span className="mt-1 inline-flex rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-medium">
                        {activeStep.phase === "phase1" ? "Phase 1" : "Phase 2"}
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-4xl font-bold">{pct}%</p>
                    <p className="text-white/70 text-sm">{completedCount}/{timeline.length} langkah</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-0">
                  <div className="flex-1 h-2 overflow-hidden rounded-l-full bg-white/20">
                    <div className="h-full rounded-l-full bg-ptba-gold transition-all" style={{ width: `${Math.min(100, (completedCount / 7) * 100)}%` }} />
                  </div>
                  <div className="w-0.5 h-3 bg-white/30 mx-0.5" />
                  <div className="flex-1 h-2 overflow-hidden rounded-r-full bg-white/20">
                    <div className="h-full rounded-r-full bg-ptba-gold transition-all" style={{ width: `${Math.max(0, Math.min(100, ((completedCount - 7) / 6) * 100))}%` }} />
                  </div>
                </div>
                <div className="mt-1 flex justify-between text-[10px] text-white/40">
                  <span>Phase 1</span>
                  <span>Phase 2</span>
                </div>
              </div>

              {/* Application Info */}
              <div className="flex flex-wrap gap-4 text-sm text-ptba-gray">
                <span>Status: <span className={cn(
                  "font-medium",
                  selectedApp.status === "Terpilih" ? "text-green-600" :
                  selectedApp.status === "Ditolak" ? "text-ptba-red" : "text-ptba-steel-blue"
                )}>{selectedApp.status}</span></span>
                <span>Diajukan: {formatDate(selectedApp.appliedAt)}</span>
                <span>Dokumen: {selectedApp.documents.length} file</span>
                {selectedApp.phase && (
                  <span>Phase saat ini: <span className="font-medium text-ptba-navy">{selectedApp.phase === "phase1" ? "Phase 1" : "Phase 2"}</span></span>
                )}
              </div>

              {/* Timeline */}
              <div className="rounded-xl bg-white p-6 shadow-sm">
                <h2 className="mb-6 text-lg font-semibold text-ptba-charcoal">Timeline Proses</h2>
                <div className="relative">
                  {timeline.map((step, idx) => {
                    const isPhaseTransition = idx === 6; // Between step 7 and 8
                    return (
                      <div key={step.id}>
                        {isPhaseTransition && (
                          <div className="relative flex items-center gap-4 pb-4 my-2">
                            <div className="h-px flex-1 bg-ptba-steel-blue/30" />
                            <span className="shrink-0 rounded-full bg-ptba-steel-blue/10 px-3 py-1 text-xs font-semibold text-ptba-steel-blue">
                              Phase 2: Detailed Assessment
                            </span>
                            <div className="h-px flex-1 bg-ptba-steel-blue/30" />
                          </div>
                        )}
                        {idx === 0 && (
                          <div className="relative flex items-center gap-4 pb-4 mb-2">
                            <div className="h-px flex-1 bg-ptba-navy/30" />
                            <span className="shrink-0 rounded-full bg-ptba-navy/10 px-3 py-1 text-xs font-semibold text-ptba-navy">
                              Phase 1: Expression of Interest
                            </span>
                            <div className="h-px flex-1 bg-ptba-navy/30" />
                          </div>
                        )}
                        <div className="relative flex gap-4 pb-8 last:pb-0">
                          {idx < timeline.length - 1 && (
                            <div className={cn(
                              "absolute left-5 top-10 w-0.5 h-full -translate-x-1/2",
                              step.status === "completed" ? "bg-ptba-green" : "bg-ptba-light-gray"
                            )} />
                          )}
                          <div className="relative z-10 shrink-0">
                            <StepIcon status={step.status} />
                          </div>
                          <div className={cn(
                            "flex-1 rounded-lg border p-4 transition-colors",
                            step.status === "active" ? "border-ptba-steel-blue/30 bg-ptba-steel-blue/5" : "border-ptba-light-gray/50"
                          )}>
                            <p className={cn(
                              "font-medium",
                              step.status === "completed" ? "text-ptba-charcoal" :
                              step.status === "active" ? "text-ptba-steel-blue" : "text-ptba-gray"
                            )}>
                              {step.id}. {step.name}
                            </p>
                            <p className="mt-0.5 text-sm text-ptba-gray">{step.description}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
