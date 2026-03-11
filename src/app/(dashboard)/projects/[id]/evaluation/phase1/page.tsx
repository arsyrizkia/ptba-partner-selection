"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ChevronRight,
  CheckCircle2,
  Clock,
  FileText,
  Download,
  Save,
  Send,
  ChevronLeft,
  User,
  Lock,
  AlertTriangle,
  RotateCcw,
  ClipboardCheck,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useAuth } from "@/lib/auth/auth-context";
import { mockProjects } from "@/lib/mock-data/projects";
import { mockApplications } from "@/lib/mock-data/applications";
import { mockEvaluations } from "@/lib/mock-data/evaluations";
import {
  PHASE1_CRITERIA,
  PHASE1_PASSING_SCORE,
} from "@/lib/constants/phase1-criteria";
import { formatDate } from "@/lib/utils/format";

// ── Types ──────────────────────────────────────────────────────────────────────
interface MitraScores {
  [criteriaId: string]: number;
}

type MitraStatus = "draft" | "finalized" | "returned";

interface MitraEvalState {
  scores: MitraScores;
  saved: boolean;
  status: MitraStatus;
  finalizedAt?: string;
  returnedReason?: string;
}

// ── Page Component ─────────────────────────────────────────────────────────────
export default function Phase1EvaluationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { role } = useAuth();

  const project = mockProjects.find((p) => p.id === id);

  const phase1Applicants = mockApplications.filter(
    (app) =>
      app.projectId === id &&
      (app.phase === "phase1" || (app.phase1Documents && app.phase1Documents.length > 0))
  );

  const phase1Evals = mockEvaluations.filter(
    (ev) => ev.projectId === id && ev.phase === "phase1"
  );

  const buildInitialState = (): Record<string, MitraEvalState> => {
    const state: Record<string, MitraEvalState> = {};
    phase1Applicants.forEach((app) => {
      const existingEval = phase1Evals.find(
        (ev) => ev.partnerId === app.partnerId && ev.phase1Eval
      );
      if (existingEval?.phase1Eval) {
        const scores: MitraScores = {};
        existingEval.phase1Eval.criteria.forEach((c) => {
          const matchingCriteria = PHASE1_CRITERIA.find((pc) => pc.name === c.name);
          if (matchingCriteria) scores[matchingCriteria.id] = c.score;
        });
        // Existing evals from mock data are considered finalized
        state[app.partnerId] = {
          scores,
          saved: true,
          status: existingEval.status === "Selesai" ? "finalized" : "draft",
          finalizedAt: existingEval.status === "Selesai" ? existingEval.evaluatedAt : undefined,
        };
      } else {
        const scores: MitraScores = {};
        PHASE1_CRITERIA.forEach((c) => { scores[c.id] = 0; });
        state[app.partnerId] = { scores, saved: false, status: "draft" };
      }
    });
    return state;
  };

  const [evalStates, setEvalStates] = useState<Record<string, MitraEvalState>>(buildInitialState);
  const [submittedForApproval, setSubmittedForApproval] = useState(false);
  const [confirmFinalize, setConfirmFinalize] = useState<string | null>(null);
  const [ebdPanelTab, setEbdPanelTab] = useState<"penilaian" | "dokumen">("penilaian");

  // ── Selected mitra ─────────────────────────────────────────────────────────
  const selectedPartnerId = searchParams.get("partnerId");
  const selectedApp = selectedPartnerId
    ? phase1Applicants.find((app) => app.partnerId === selectedPartnerId)
    : null;

  const navigateToMitra = (partnerId: string) => {
    router.push(`/projects/${id}/evaluation/phase1?partnerId=${partnerId}`);
  };

  const currentIndex = selectedApp
    ? phase1Applicants.findIndex((app) => app.partnerId === selectedPartnerId)
    : -1;
  const prevMitra = currentIndex > 0 ? phase1Applicants[currentIndex - 1] : null;
  const nextMitra = currentIndex >= 0 && currentIndex < phase1Applicants.length - 1
    ? phase1Applicants[currentIndex + 1] : null;

  const isAuthorized = role === "ebd" || role === "super_admin";

  // ── Score helpers ──────────────────────────────────────────────────────────
  const updateScore = (partnerId: string, criteriaId: string, score: number) => {
    const state = evalStates[partnerId];
    if (state?.status === "finalized") return; // locked
    setEvalStates((prev) => ({
      ...prev,
      [partnerId]: {
        ...prev[partnerId],
        scores: { ...prev[partnerId].scores, [criteriaId]: score },
        saved: false,
      },
    }));
  };

  const calculateWeightedScore = (partnerId: string): number => {
    const state = evalStates[partnerId];
    if (!state) return 0;
    let weightedSum = 0;
    let totalWeight = 0;
    PHASE1_CRITERIA.forEach((c) => {
      weightedSum += (state.scores[c.id] || 0) * c.weight;
      totalWeight += c.weight;
    });
    return totalWeight > 0 ? weightedSum / totalWeight : 0;
  };

  const getResult = (partnerId: string): "Lolos" | "Tidak Lolos" | "Belum Dinilai" => {
    const state = evalStates[partnerId];
    if (!state) return "Belum Dinilai";
    const allScored = PHASE1_CRITERIA.every((c) => (state.scores[c.id] || 0) > 0);
    if (!allScored) return "Belum Dinilai";
    return calculateWeightedScore(partnerId) >= PHASE1_PASSING_SCORE ? "Lolos" : "Tidak Lolos";
  };

  const isAllScored = (partnerId: string): boolean => {
    const state = evalStates[partnerId];
    if (!state) return false;
    return PHASE1_CRITERIA.every((c) => (state.scores[c.id] || 0) > 0);
  };

  // Save as draft (editable)
  const handleSaveNilai = (partnerId: string) => {
    setEvalStates((prev) => ({
      ...prev,
      [partnerId]: { ...prev[partnerId], saved: true },
    }));
    alert("Nilai berhasil disimpan. Anda masih dapat mengubah nilai ini.");
  };

  // Finalize (locked)
  const handleFinalize = (partnerId: string) => {
    setEvalStates((prev) => ({
      ...prev,
      [partnerId]: {
        ...prev[partnerId],
        saved: true,
        status: "finalized",
        finalizedAt: new Date().toISOString(),
      },
    }));
    setConfirmFinalize(null);
    // Auto-navigate to next unfinalized mitra
    const nextUnfinalized = phase1Applicants.find(
      (a) => a.partnerId !== partnerId && evalStates[a.partnerId]?.status !== "finalized"
    );
    if (nextUnfinalized) {
      navigateToMitra(nextUnfinalized.partnerId);
    }
  };

  // Simulate "returned by atasan" — for demo purposes
  const handleSimulateReturn = (partnerId: string) => {
    setEvalStates((prev) => ({
      ...prev,
      [partnerId]: {
        ...prev[partnerId],
        status: "returned",
        returnedReason: "Mohon periksa kembali penilaian kriteria Kemampuan Pembiayaan.",
      },
    }));
  };

  const handleSubmitForApproval = () => {
    setSubmittedForApproval(true);
    alert("Evaluasi Fase 1 berhasil dikirim ke Direksi untuk persetujuan (simulasi).");
  };

  const allFinalized = phase1Applicants.every(
    (app) => evalStates[app.partnerId]?.status === "finalized"
  );

  const finalizedCount = phase1Applicants.filter(
    (app) => evalStates[app.partnerId]?.status === "finalized"
  ).length;

  // ── Status helpers for sidebar ─────────────────────────────────────────────
  const getMitraStatusLabel = (partnerId: string): { text: string; color: string } => {
    const state = evalStates[partnerId];
    if (!state) return { text: "Belum dinilai", color: "text-ptba-gray" };
    if (state.status === "finalized") {
      const r = getResult(partnerId);
      return r === "Lolos"
        ? { text: "Final · Lolos", color: "text-green-600" }
        : { text: "Final · Tidak Lolos", color: "text-ptba-red" };
    }
    if (state.status === "returned") return { text: "Dikembalikan", color: "text-amber-600" };
    if (state.saved) return { text: "Draft tersimpan", color: "text-ptba-steel-blue" };
    const allScored = isAllScored(partnerId);
    if (allScored) return { text: "Siap disimpan", color: "text-ptba-navy" };
    return { text: "Belum dinilai", color: "text-ptba-gray" };
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  if (!project) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-ptba-gray">Proyek tidak ditemukan.</p>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="space-y-6">
        <nav className="flex items-center gap-1.5 text-sm text-ptba-gray">
          <Link href="/projects" className="hover:text-ptba-navy">Proyek</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link href={`/projects/${id}`} className="hover:text-ptba-navy">{project.name}</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-ptba-charcoal font-medium">Evaluasi Fase 1</span>
        </nav>
        <div className="rounded-xl bg-white p-6 shadow-sm border border-red-200">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
              <Clock className="h-5 w-5 text-ptba-red" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-ptba-red">Akses Ditolak</h2>
              <p className="text-sm text-ptba-gray mt-1">
                Halaman ini hanya dapat diakses oleh Divisi EBD atau Super Admin. Role Anda:{" "}
                <span className="font-medium text-ptba-charcoal">{role ?? "Tidak teridentifikasi"}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-ptba-gray">
        <Link href="/projects" className="hover:text-ptba-navy">Proyek</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href={`/projects/${id}`} className="hover:text-ptba-navy">{project.name}</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-ptba-charcoal font-medium">Evaluasi Fase 1</span>
      </nav>

      <button
        onClick={() => router.push(`/projects/${id}`)}
        className="inline-flex items-center gap-1.5 text-sm text-ptba-gray hover:text-ptba-navy transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Kembali ke Proyek
      </button>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-ptba-navy">Evaluasi Fase 1 (EBD)</h1>
        <p className="text-sm text-ptba-gray mt-1">
          Penilaian awal kelayakan mitra berdasarkan dokumen Expression of Interest (EoI).
        </p>
      </div>

      {/* Summary Strip */}
      <div className="rounded-xl bg-white p-4 shadow-sm">
        <div className="flex items-center gap-6 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-ptba-navy">
              <User className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-ptba-gray">Total Mitra</p>
              <p className="text-lg font-bold text-ptba-navy">{phase1Applicants.length}</p>
            </div>
          </div>
          <div className="h-8 w-px bg-gray-200" />
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500">
              <Lock className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-ptba-gray">Difinalisasi</p>
              <p className="text-lg font-bold text-green-600">{finalizedCount}</p>
            </div>
          </div>
          <div className="h-8 w-px bg-gray-200" />
          <div>
            <p className="text-[10px] uppercase tracking-wider text-ptba-gray">Skor Min. Lolos</p>
            <p className="text-lg font-bold text-ptba-gold">{PHASE1_PASSING_SCORE.toFixed(1)}</p>
          </div>
          <div className="ml-auto">
            <div className="h-2 w-32 rounded-full bg-gray-200 overflow-hidden">
              <div
                className="h-full rounded-full bg-green-500 transition-all"
                style={{ width: `${phase1Applicants.length > 0 ? (finalizedCount / phase1Applicants.length) * 100 : 0}%` }}
              />
            </div>
            <p className="text-[10px] text-ptba-gray text-right mt-0.5">
              {finalizedCount}/{phase1Applicants.length} final
            </p>
          </div>
        </div>
      </div>

      {phase1Applicants.length === 0 && (
        <div className="rounded-xl bg-white p-6 shadow-sm text-center">
          <Clock className="h-10 w-10 text-ptba-gray mx-auto mb-3" />
          <p className="text-ptba-gray">Belum ada mitra yang mendaftar untuk Fase 1.</p>
        </div>
      )}

      {/* Main Layout */}
      {phase1Applicants.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
          {/* Sidebar */}
          <div className="rounded-xl bg-white shadow-sm overflow-hidden">
            <div className="px-4 py-3 bg-ptba-navy">
              <h3 className="text-sm font-semibold text-white">Daftar Mitra</h3>
              <p className="text-[10px] text-white/60 mt-0.5">Pilih mitra untuk dievaluasi</p>
            </div>
            <div className="divide-y divide-gray-100">
              {phase1Applicants.map((app, idx) => {
                const state = evalStates[app.partnerId];
                const isSelected = app.partnerId === selectedPartnerId;
                const statusLabel = getMitraStatusLabel(app.partnerId);

                return (
                  <button
                    key={app.id}
                    onClick={() => navigateToMitra(app.partnerId)}
                    className={cn(
                      "w-full text-left px-4 py-3 transition-colors hover:bg-ptba-section-bg",
                      isSelected && "bg-ptba-section-bg border-l-3 border-l-ptba-navy"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span className={cn(
                        "flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold text-white shrink-0",
                        state?.status === "finalized" ? "bg-green-500" :
                        state?.status === "returned" ? "bg-amber-500" :
                        state?.saved ? "bg-ptba-steel-blue" : "bg-gray-300"
                      )}>
                        {state?.status === "finalized" ? (
                          <Lock className="h-3 w-3" />
                        ) : (
                          idx + 1
                        )}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          "text-sm font-medium truncate",
                          isSelected ? "text-ptba-navy" : "text-ptba-charcoal"
                        )}>
                          {app.partnerName}
                        </p>
                        <p className={cn("text-[10px]", statusLabel.color)}>
                          {statusLabel.text}
                        </p>
                      </div>
                      {state?.status === "returned" && (
                        <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Panel */}
          <div>
            {!selectedApp ? (
              <div className="rounded-xl bg-white p-12 shadow-sm text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-ptba-section-bg mx-auto mb-4">
                  <User className="h-8 w-8 text-ptba-gray" />
                </div>
                <h3 className="text-lg font-semibold text-ptba-charcoal mb-2">Pilih Mitra untuk Dievaluasi</h3>
                <p className="text-sm text-ptba-gray max-w-md mx-auto">
                  Klik salah satu mitra di panel kiri untuk memulai atau melanjutkan evaluasi.
                </p>
                {phase1Applicants.length > 0 && (
                  <button
                    onClick={() => navigateToMitra(phase1Applicants[0].partnerId)}
                    className="mt-6 inline-flex items-center gap-2 rounded-lg bg-ptba-navy px-5 py-2.5 text-sm font-semibold text-white hover:bg-ptba-navy/90 transition-colors"
                  >
                    Mulai Evaluasi Mitra Pertama <ChevronRight className="h-4 w-4" />
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-5">
                {(() => {
                  const app = selectedApp;
                  const state = evalStates[app.partnerId];
                  const weightedScore = calculateWeightedScore(app.partnerId);
                  const result = getResult(app.partnerId);
                  const existingEval = phase1Evals.find(
                    (ev) => ev.partnerId === app.partnerId && ev.phase1Eval
                  );
                  const allScored = isAllScored(app.partnerId);
                  const isFinalized = state?.status === "finalized";
                  const isReturned = state?.status === "returned";
                  const isEditable = !isFinalized;

                  return (
                    <>
                      {/* Mitra Header */}
                      <div className="rounded-xl bg-white shadow-sm overflow-hidden">
                        <div className={cn(
                          "px-6 py-4 border-b flex items-center justify-between",
                          isFinalized ? "bg-gray-50" : isReturned ? "bg-amber-50" : "bg-white"
                        )}>
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold text-white",
                              isFinalized
                                ? (result === "Lolos" ? "bg-green-500" : "bg-ptba-red")
                                : isReturned ? "bg-amber-500" : "bg-ptba-navy"
                            )}>
                              {isFinalized ? <Lock className="h-5 w-5" /> : app.partnerName.charAt(0)}
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-ptba-charcoal">{app.partnerName}</h3>
                              <p className="text-xs text-ptba-gray">
                                Mitra {currentIndex + 1} dari {phase1Applicants.length} · Mendaftar: {formatDate(app.appliedAt)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {isFinalized && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-gray-800 px-3 py-1 text-xs font-semibold text-white">
                                <Lock className="h-3 w-3" /> Final
                              </span>
                            )}
                            {isReturned && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                                <RotateCcw className="h-3 w-3" /> Dikembalikan
                              </span>
                            )}
                            {result === "Lolos" && (
                              <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">Lolos</span>
                            )}
                            {result === "Tidak Lolos" && (
                              <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-ptba-red">Tidak Lolos</span>
                            )}
                            {result === "Belum Dinilai" && !isFinalized && (
                              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-ptba-gray">Belum Dinilai</span>
                            )}
                          </div>
                        </div>

                        {/* Prev / Next */}
                        <div className="px-6 py-2.5 bg-gray-50 flex items-center justify-between text-sm border-b border-gray-100">
                          <button
                            onClick={() => prevMitra && navigateToMitra(prevMitra.partnerId)}
                            disabled={!prevMitra}
                            className={cn(
                              "inline-flex items-center gap-1 transition-colors",
                              prevMitra ? "text-ptba-navy hover:text-ptba-steel-blue" : "text-gray-300 cursor-not-allowed"
                            )}
                          >
                            <ChevronLeft className="h-4 w-4" /> Sebelumnya
                          </button>
                          <span className="text-xs text-ptba-gray">{currentIndex + 1} / {phase1Applicants.length}</span>
                          <button
                            onClick={() => nextMitra && navigateToMitra(nextMitra.partnerId)}
                            disabled={!nextMitra}
                            className={cn(
                              "inline-flex items-center gap-1 transition-colors",
                              nextMitra ? "text-ptba-navy hover:text-ptba-steel-blue" : "text-gray-300 cursor-not-allowed"
                            )}
                          >
                            Selanjutnya <ChevronRight className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {/* Returned warning banner */}
                      {isReturned && state.returnedReason && (
                        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
                          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-semibold text-amber-800">Nilai Dikembalikan oleh Atasan</p>
                            <p className="text-sm text-amber-700 mt-1">{state.returnedReason}</p>
                            <p className="text-xs text-amber-600 mt-2">Silakan perbaiki nilai dan finalisasi kembali.</p>
                          </div>
                        </div>
                      )}

                      {/* Finalized lock banner */}
                      {isFinalized && (
                        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 flex items-start gap-3">
                          <Lock className="h-5 w-5 text-ptba-gray shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-semibold text-ptba-charcoal">Nilai Telah Difinalisasi</p>
                            <p className="text-xs text-ptba-gray mt-1">
                              Nilai mitra ini sudah final dan tidak dapat diubah.
                              {state.finalizedAt && ` Difinalisasi pada ${formatDate(state.finalizedAt)}.`}
                            </p>
                            {/* Demo button to simulate return */}
                            <button
                              type="button"
                              onClick={() => handleSimulateReturn(app.partnerId)}
                              className="mt-2 text-xs text-amber-600 hover:text-amber-700 underline"
                            >
                              (Demo: Simulasi dikembalikan atasan)
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Tab navigation */}
                      <div className="rounded-xl bg-white shadow-sm overflow-hidden">
                        <div className="px-5 border-b border-ptba-light-gray">
                          <nav className="flex gap-0 -mb-px">
                            <button
                              type="button"
                              onClick={() => setEbdPanelTab("penilaian")}
                              className={cn(
                                "px-4 py-3 text-sm font-medium transition-all border-b-2 flex items-center gap-2",
                                ebdPanelTab === "penilaian"
                                  ? "border-b-ptba-gold text-ptba-navy"
                                  : "border-b-transparent text-ptba-gray hover:text-ptba-navy"
                              )}
                            >
                              <ClipboardCheck className="h-4 w-4" />
                              Penilaian
                            </button>
                            <button
                              type="button"
                              onClick={() => setEbdPanelTab("dokumen")}
                              className={cn(
                                "px-4 py-3 text-sm font-medium transition-all border-b-2 flex items-center gap-2",
                                ebdPanelTab === "dokumen"
                                  ? "border-b-ptba-gold text-ptba-navy"
                                  : "border-b-transparent text-ptba-gray hover:text-ptba-navy"
                              )}
                            >
                              <FileText className="h-4 w-4" />
                              Dokumen
                              {app.phase1Documents && app.phase1Documents.length > 0 && (
                                <span className="inline-flex items-center justify-center h-5 min-w-[20px] rounded-full bg-ptba-section-bg px-1.5 text-[10px] font-bold text-ptba-navy">
                                  {app.phase1Documents.length}
                                </span>
                              )}
                            </button>
                          </nav>
                        </div>

                        {/* Tab: Penilaian */}
                        {ebdPanelTab === "penilaian" && (
                          <div className={cn("p-6", isFinalized && "opacity-75")}>
                            <div className="space-y-4">
                              {PHASE1_CRITERIA.map((criteria) => {
                                const currentScore = state?.scores[criteria.id] || 0;
                                return (
                                  <div key={criteria.id} className="rounded-lg border border-gray-100 bg-gray-50/50 p-4">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                                      <div>
                                        <p className="text-sm font-semibold text-ptba-charcoal">{criteria.name}</p>
                                        <p className="text-xs text-ptba-gray">{criteria.description}</p>
                                        <p className="text-xs text-ptba-gray mt-0.5">Bobot: {criteria.weight}% | Skor Maks: {criteria.maxScore}</p>
                                      </div>
                                      <div className="text-right">
                                        <span className={cn("text-lg font-bold", currentScore > 0 ? "text-ptba-navy" : "text-gray-300")}>
                                          {currentScore > 0 ? currentScore : "-"}
                                        </span>
                                        <span className="text-sm text-ptba-gray"> / {criteria.maxScore}</span>
                                      </div>
                                    </div>

                                    {isEditable ? (
                                      <div className="flex items-center gap-2">
                                        <div className="flex gap-1.5">
                                          {[1, 2, 3, 4, 5].map((score) => (
                                            <button
                                              key={score}
                                              type="button"
                                              onClick={() => updateScore(app.partnerId, criteria.id, score)}
                                              className={cn(
                                                "w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all",
                                                score <= currentScore
                                                  ? "bg-ptba-gold text-white shadow-sm"
                                                  : "bg-gray-200 text-gray-500 hover:bg-ptba-gold/30 hover:text-ptba-charcoal"
                                              )}
                                            >
                                              {score}
                                            </button>
                                          ))}
                                        </div>
                                        <span className="text-xs text-ptba-gray ml-2">Klik untuk memberi skor</span>
                                      </div>
                                    ) : (
                                      <div className="flex gap-1.5">
                                        {[1, 2, 3, 4, 5].map((score) => (
                                          <div
                                            key={score}
                                            className={cn(
                                              "w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold",
                                              score <= currentScore ? "bg-ptba-gold text-white" : "bg-gray-200 text-gray-400"
                                            )}
                                          >
                                            {score}
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>

                            {/* Score Summary */}
                            <div className="mt-5 rounded-lg bg-ptba-section-bg p-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm font-medium text-ptba-gray">Skor Tertimbang</p>
                                  <p className="text-xs text-ptba-gray mt-0.5">Skor minimum lolos: {PHASE1_PASSING_SCORE.toFixed(1)}</p>
                                </div>
                                <div className="text-right">
                                  <p className={cn(
                                    "text-2xl font-extrabold",
                                    result === "Lolos" ? "text-green-600" :
                                    result === "Tidak Lolos" ? "text-ptba-red" : "text-ptba-navy"
                                  )}>
                                    {allScored ? weightedScore.toFixed(2) : "—"}
                                  </p>
                                  <p className="text-xs text-ptba-gray">/ 5.00</p>
                                </div>
                              </div>
                              {allScored && (
                                <div className="mt-3">
                                  <div className="h-2 w-full rounded-full bg-gray-200 overflow-hidden">
                                    <div
                                      className={cn("h-full rounded-full transition-all", result === "Lolos" ? "bg-green-500" : "bg-ptba-red")}
                                      style={{ width: `${Math.min((weightedScore / 5) * 100, 100)}%` }}
                                    />
                                  </div>
                                  <div className="flex justify-between mt-1">
                                    <span className="text-[10px] text-ptba-gray">0</span>
                                    <span className="text-[10px] text-ptba-gray font-medium">Batas Lolos: {PHASE1_PASSING_SCORE.toFixed(1)}</span>
                                    <span className="text-[10px] text-ptba-gray">5.0</span>
                                  </div>
                                </div>
                              )}
                            </div>

                            {existingEval?.phase1Eval?.notes && (
                              <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50/50 p-4">
                                <p className="text-xs font-medium text-ptba-gray mb-1">Catatan Evaluasi</p>
                                <p className="text-sm text-ptba-charcoal">{existingEval.phase1Eval.notes}</p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Tab: Dokumen */}
                        {ebdPanelTab === "dokumen" && (
                          <div className="p-6">
                            {app.phase1Documents && app.phase1Documents.length > 0 ? (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {app.phase1Documents.map((doc) => (
                                  <button
                                    key={doc.id}
                                    type="button"
                                    onClick={() => alert(`Mengunduh: ${doc.name}\n\n(Fitur unduh tersedia setelah integrasi backend)`)}
                                    className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50/50 px-3 py-2.5 text-left hover:bg-ptba-section-bg hover:border-ptba-steel-blue/30 transition-colors group"
                                  >
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-ptba-section-bg shrink-0 group-hover:bg-ptba-steel-blue/10">
                                      <FileText className="h-4 w-4 text-ptba-steel-blue" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm text-ptba-charcoal truncate">{doc.name}</p>
                                      <p className="text-[10px] text-ptba-gray">{doc.status} · {formatDate(doc.uploadDate)}</p>
                                    </div>
                                    <Download className="h-4 w-4 text-ptba-gray shrink-0 group-hover:text-ptba-steel-blue transition-colors" />
                                  </button>
                                ))}
                              </div>
                            ) : (
                              <div className="text-center py-6">
                                <FileText className="h-8 w-8 text-ptba-gray mx-auto mb-2" />
                                <p className="text-sm text-ptba-gray">
                                  Tidak ada dokumen Fase 1 untuk mitra ini.
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      {isEditable && (
                        <div className="rounded-xl bg-white p-5 shadow-sm">
                          {/* Finalization Confirmation Dialog */}
                          {confirmFinalize === app.partnerId ? (
                            <div className="rounded-lg border-2 border-amber-300 bg-amber-50 p-4">
                              <div className="flex items-start gap-3">
                                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                                <div className="flex-1">
                                  <p className="text-sm font-semibold text-amber-800">Konfirmasi Finalisasi Nilai</p>
                                  <p className="text-sm text-amber-700 mt-1">
                                    Setelah difinalisasi, nilai <strong>tidak dapat diubah</strong> kecuali dikembalikan oleh atasan.
                                    Pastikan semua penilaian sudah benar.
                                  </p>
                                  <div className="mt-3 rounded-lg bg-white/80 p-3">
                                    <p className="text-xs text-ptba-gray mb-1">Hasil evaluasi:</p>
                                    <p className={cn(
                                      "text-lg font-bold",
                                      result === "Lolos" ? "text-green-600" : "text-ptba-red"
                                    )}>
                                      {app.partnerName}: {result} ({weightedScore.toFixed(2)}/5.00)
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-3 mt-4">
                                    <button
                                      type="button"
                                      onClick={() => handleFinalize(app.partnerId)}
                                      className="inline-flex items-center gap-2 rounded-lg bg-ptba-red px-5 py-2.5 text-sm font-semibold text-white hover:bg-ptba-red/90 transition-colors"
                                    >
                                      <Lock className="h-4 w-4" /> Ya, Finalisasi Nilai
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setConfirmFinalize(null)}
                                      className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-ptba-gray hover:bg-gray-50 transition-colors"
                                    >
                                      Batal
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-3">
                              {/* Simpan Nilai (draft) */}
                              <button
                                type="button"
                                onClick={() => handleSaveNilai(app.partnerId)}
                                disabled={!allScored}
                                className={cn(
                                  "inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors",
                                  allScored
                                    ? "bg-ptba-navy text-white hover:bg-ptba-navy/90"
                                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                                )}
                              >
                                <Save className="h-4 w-4" /> Simpan Nilai
                              </button>

                              {/* Simpan & Finalisasi */}
                              <button
                                type="button"
                                onClick={() => setConfirmFinalize(app.partnerId)}
                                disabled={!allScored}
                                className={cn(
                                  "inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors",
                                  allScored
                                    ? "bg-ptba-gold text-white hover:bg-ptba-gold/90 shadow-md"
                                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                                )}
                              >
                                <Lock className="h-4 w-4" /> Simpan & Finalisasi Nilai
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            )}

            {/* Submit to Direksi */}
            <div className="rounded-xl bg-white p-6 shadow-sm mt-6 border border-gray-100">
              <div className="flex items-center gap-3 mb-4">
                <div className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-lg",
                  allFinalized ? "bg-ptba-gold" : "bg-gray-200"
                )}>
                  <Send className={cn("h-5 w-5", allFinalized ? "text-white" : "text-gray-400")} />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-ptba-navy">Kirim Hasil Evaluasi ke Direksi</h3>
                  <p className="text-sm text-ptba-gray mt-0.5">
                    {allFinalized
                      ? "Semua nilai mitra telah difinalisasi. Kirim ke Direksi untuk persetujuan."
                      : `${finalizedCount} dari ${phase1Applicants.length} mitra difinalisasi. Finalisasi semua mitra untuk mengirim ke Direksi.`}
                  </p>
                </div>
              </div>

              <div className="mb-4">
                <div className="flex items-center justify-between text-xs text-ptba-gray mb-1.5">
                  <span>Progress Finalisasi</span>
                  <span className="font-medium">{finalizedCount}/{phase1Applicants.length} mitra</span>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-200 overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all", allFinalized ? "bg-green-500" : "bg-ptba-steel-blue")}
                    style={{ width: `${phase1Applicants.length > 0 ? (finalizedCount / phase1Applicants.length) * 100 : 0}%` }}
                  />
                </div>
              </div>

              {allFinalized && (
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-center">
                    <p className="text-2xl font-bold text-green-600">
                      {phase1Applicants.filter((a) => getResult(a.partnerId) === "Lolos").length}
                    </p>
                    <p className="text-xs text-green-700">Mitra Lolos</p>
                  </div>
                  <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-center">
                    <p className="text-2xl font-bold text-ptba-red">
                      {phase1Applicants.filter((a) => getResult(a.partnerId) === "Tidak Lolos").length}
                    </p>
                    <p className="text-xs text-ptba-red">Mitra Tidak Lolos</p>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={handleSubmitForApproval}
                disabled={!allFinalized || submittedForApproval}
                className={cn(
                  "w-full inline-flex items-center justify-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold transition-colors",
                  allFinalized && !submittedForApproval
                    ? "bg-ptba-gold text-white hover:bg-ptba-gold/90 shadow-md"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                )}
              >
                {submittedForApproval ? (
                  <><CheckCircle2 className="h-4 w-4" /> Sudah Dikirim ke Direksi</>
                ) : (
                  <><Send className="h-4 w-4" /> Kirim ke Direksi untuk Persetujuan</>
                )}
              </button>

              {submittedForApproval && (
                <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-4 text-center">
                  <p className="text-sm text-green-700">
                    Item persetujuan telah muncul di antrian Direksi.
                  </p>
                  <Link
                    href="/approvals"
                    className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-ptba-navy hover:text-ptba-steel-blue transition-colors"
                  >
                    Lihat Antrian Persetujuan <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
