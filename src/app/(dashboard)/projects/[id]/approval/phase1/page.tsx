"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Send,
  AlertTriangle,
  RotateCcw,
  MessageSquare,
  FileText,
  Download,
  ClipboardCheck,
  User,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useAuth } from "@/lib/auth/auth-context";
import { mockProjects } from "@/lib/mock-data/projects";
import { mockEvaluations } from "@/lib/mock-data/evaluations";
import { mockApplications } from "@/lib/mock-data/applications";
import { PHASE1_CRITERIA, PHASE1_PASSING_SCORE } from "@/lib/constants/phase1-criteria";
import { formatDate } from "@/lib/utils/format";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface MitraApprovalState {
  partnerId: string;
  decision: "pending" | "approved" | "rejected";
  notes: string;
}

type DireksiMitraDecision = "pending" | "setujui" | "re-evaluasi";

interface DireksiMitraState {
  partnerId: string;
  decision: DireksiMitraDecision;
  notes: string;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function computeWeightedAverage(
  criteria: { name: string; score: number; maxScore: number }[]
): number {
  const criteriaWeights = PHASE1_CRITERIA.reduce<Record<string, number>>(
    (acc, c) => { acc[c.name] = c.weight; return acc; }, {}
  );
  let totalWeight = 0;
  let weightedSum = 0;
  for (const c of criteria) {
    const w = criteriaWeights[c.name] ?? 0;
    weightedSum += c.score * w;
    totalWeight += w;
  }
  return totalWeight > 0 ? weightedSum / totalWeight : 0;
}

/* ------------------------------------------------------------------ */
/*  Page Component                                                     */
/* ------------------------------------------------------------------ */

export default function Phase1ApprovalPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { role } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  /* ---- data look-ups ---- */
  const project = mockProjects.find((p) => p.id === id);
  const phase1Evals = mockEvaluations.filter(
    (ev) => ev.projectId === id && ev.phase === "phase1" && ev.phase1Eval
  );
  const projectApps = mockApplications.filter((a) => a.projectId === id);

  /* ---- PIC local state ---- */
  const [mitraStates, setMitraStates] = useState<MitraApprovalState[]>(() =>
    phase1Evals.map((ev) => ({
      partnerId: ev.partnerId, decision: "pending", notes: "",
    }))
  );
  const [submitted, setSubmitted] = useState(false);

  /* ---- Direksi local state ---- */
  const [direksiMitraStates, setDireksiMitraStates] = useState<DireksiMitraState[]>(() =>
    phase1Evals.map((ev) => ({
      partnerId: ev.partnerId, decision: "pending", notes: "",
    }))
  );
  const [direksiGlobalNotes, setDireksiGlobalNotes] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [direksiSubmitted, setDireksiSubmitted] = useState(false);

  /* ---- Panel tab state ---- */
  const [panelTab, setPanelTab] = useState<"penilaian" | "dokumen">("penilaian");

  /* ---- Selected mitra ---- */
  const selectedPartnerId = searchParams.get("partnerId");
  const selectedEval = selectedPartnerId
    ? phase1Evals.find((ev) => ev.partnerId === selectedPartnerId)
    : null;
  const selectedApp = selectedPartnerId
    ? projectApps.find((a) => a.partnerId === selectedPartnerId)
    : null;

  const navigateToMitra = (partnerId: string) => {
    router.push(`/projects/${id}/approval/phase1?partnerId=${partnerId}`);
    setPanelTab("penilaian");
  };

  const currentIndex = selectedEval
    ? phase1Evals.findIndex((ev) => ev.partnerId === selectedPartnerId)
    : -1;
  const prevMitra = currentIndex > 0 ? phase1Evals[currentIndex - 1] : null;
  const nextMitra = currentIndex >= 0 && currentIndex < phase1Evals.length - 1
    ? phase1Evals[currentIndex + 1] : null;

  /* ---- PIC handlers ---- */
  const updateMitraDecision = (partnerId: string, decision: "approved" | "rejected") => {
    setMitraStates((prev) =>
      prev.map((m) => (m.partnerId === partnerId ? { ...m, decision } : m))
    );
  };
  const updateMitraNotes = (partnerId: string, notes: string) => {
    setMitraStates((prev) =>
      prev.map((m) => (m.partnerId === partnerId ? { ...m, notes } : m))
    );
  };
  const handlePICSubmit = () => { setSubmitted(true); };

  /* ---- Direksi handlers ---- */
  const updateDireksiMitraDecision = (partnerId: string, decision: DireksiMitraDecision) => {
    setDireksiMitraStates((prev) =>
      prev.map((m) => (m.partnerId === partnerId ? { ...m, decision } : m))
    );
  };
  const updateDireksiMitraNotes = (partnerId: string, notes: string) => {
    setDireksiMitraStates((prev) =>
      prev.map((m) => (m.partnerId === partnerId ? { ...m, notes } : m))
    );
  };
  const handleDireksiSubmit = () => { setShowConfirm(true); };
  const handleConfirmFinal = () => {
    setShowConfirm(false);
    setDireksiSubmitted(true);
  };

  /* ---- guards ---- */
  if (!project) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-ptba-gold mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-ptba-navy mb-1">Proyek Tidak Ditemukan</h2>
          <p className="text-sm text-ptba-gray mb-4">Proyek dengan ID &quot;{id}&quot; tidak tersedia.</p>
          <Link href="/projects" className="text-sm text-ptba-steel-blue hover:underline">Kembali ke Daftar Proyek</Link>
        </div>
      </div>
    );
  }

  if (phase1Evals.length === 0) {
    return (
      <div className="space-y-6">
        <BackHeader projectId={id} projectName={project.name} />
        <div className="rounded-xl bg-white p-6 shadow-sm text-center">
          <AlertTriangle className="h-10 w-10 text-ptba-gold mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-ptba-navy mb-1">Belum Ada Evaluasi Fase 1</h2>
          <p className="text-sm text-ptba-gray">Evaluasi Fase 1 belum selesai untuk proyek ini.</p>
        </div>
      </div>
    );
  }

  const isDireksi = role === "direksi";
  const isPIC = role === "ebd" || role === "keuangan" || role === "hukum" || role === "risiko" || role === "super_admin";
  const allPICDecided = mitraStates.every((m) => m.decision !== "pending");
  const approvedCount = mitraStates.filter((m) => m.decision === "approved").length;
  const rejectedCount = mitraStates.filter((m) => m.decision === "rejected").length;

  const allDireksiDecided = direksiMitraStates.every((m) => m.decision !== "pending");
  const direksiSetujuiCount = direksiMitraStates.filter((m) => m.decision === "setujui").length;
  const direksiReEvalCount = direksiMitraStates.filter((m) => m.decision === "re-evaluasi").length;
  const hasReEvalRequests = direksiReEvalCount > 0;

  /* ---- sidebar helpers ---- */
  const getSidebarStatus = (partnerId: string) => {
    const ev = phase1Evals.find((e) => e.partnerId === partnerId);
    const passed = ev?.phase1Eval?.overallResult === "Lolos";
    const picState = mitraStates.find((m) => m.partnerId === partnerId);
    const dirState = direksiMitraStates.find((m) => m.partnerId === partnerId);

    if (isDireksi && direksiSubmitted && dirState) {
      return dirState.decision === "setujui"
        ? { text: "Disetujui", color: "text-green-600" }
        : { text: "Re-evaluasi", color: "text-amber-600" };
    }
    if (isDireksi && dirState?.decision !== "pending") {
      return dirState?.decision === "setujui"
        ? { text: "Setujui", color: "text-green-600" }
        : { text: "Minta re-eval", color: "text-amber-600" };
    }
    if (isPIC && submitted && picState) {
      return picState.decision === "approved"
        ? { text: "Disetujui", color: "text-green-600" }
        : { text: "Tidak Disetujui", color: "text-ptba-red" };
    }
    return passed
      ? { text: "Lolos", color: "text-green-600" }
      : { text: "Tidak Lolos", color: "text-ptba-red" };
  };

  /* ================================================================ */
  /*  Render                                                           */
  /* ================================================================ */

  return (
    <div className="space-y-6">
      <BackHeader projectId={id} projectName={project.name} />

      {/* ---- Page title + summary ---- */}
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <ShieldCheck className="h-6 w-6 text-ptba-navy mt-0.5 shrink-0" />
          <div>
            <h1 className="text-xl font-bold text-ptba-navy">Persetujuan Hasil Evaluasi Fase 1</h1>
            <p className="text-sm text-ptba-gray mt-1">
              Review dan setujui hasil shortlist Fase 1 untuk seluruh mitra sebelum melanjutkan ke Fase 2.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5">
          <SummaryBox label="Total Mitra" value={phase1Evals.length} />
          <SummaryBox label="Lolos" value={phase1Evals.filter((e) => e.phase1Eval?.overallResult === "Lolos").length} color="green" />
          <SummaryBox label="Tidak Lolos" value={phase1Evals.filter((e) => e.phase1Eval?.overallResult === "Tidak Lolos").length} color="red" />
          <SummaryBox label="Passing Score" value={PHASE1_PASSING_SCORE.toFixed(1)} />
        </div>
      </div>

      {/* ---- Sidebar + Detail Layout ---- */}
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        {/* Sidebar */}
        <div className="rounded-xl bg-white shadow-sm overflow-hidden">
          <div className="px-4 py-3 bg-ptba-navy">
            <h3 className="text-sm font-semibold text-white">Daftar Mitra</h3>
            <p className="text-[10px] text-white/60 mt-0.5">Pilih mitra untuk direview</p>
          </div>
          <div className="divide-y divide-gray-100">
            {phase1Evals.map((ev, idx) => {
              const p1 = ev.phase1Eval!;
              const passed = p1.overallResult === "Lolos";
              const isSelected = ev.partnerId === selectedPartnerId;
              const status = getSidebarStatus(ev.partnerId);

              return (
                <button
                  key={ev.id}
                  onClick={() => navigateToMitra(ev.partnerId)}
                  className={cn(
                    "w-full text-left px-4 py-3 transition-colors hover:bg-ptba-section-bg",
                    isSelected && "bg-ptba-section-bg border-l-3 border-l-ptba-navy"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className={cn(
                      "flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold text-white shrink-0",
                      passed ? "bg-green-500" : "bg-ptba-red"
                    )}>
                      {passed ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "text-sm font-medium truncate",
                        isSelected ? "text-ptba-navy" : "text-ptba-charcoal"
                      )}>
                        {p1.partnerName}
                      </p>
                      <p className={cn("text-[10px]", status.color)}>{status.text}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Panel */}
        <div>
          {!selectedEval ? (
            <div className="rounded-xl bg-white p-12 shadow-sm text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-ptba-section-bg mx-auto mb-4">
                <User className="h-8 w-8 text-ptba-gray" />
              </div>
              <h3 className="text-lg font-semibold text-ptba-charcoal mb-2">Pilih Mitra untuk Direview</h3>
              <p className="text-sm text-ptba-gray max-w-md mx-auto">
                Klik salah satu mitra di panel kiri untuk melihat detail evaluasi dan memberikan keputusan.
              </p>
              {phase1Evals.length > 0 && (
                <button
                  onClick={() => navigateToMitra(phase1Evals[0].partnerId)}
                  className="mt-6 inline-flex items-center gap-2 rounded-lg bg-ptba-navy px-5 py-2.5 text-sm font-semibold text-white hover:bg-ptba-navy/90 transition-colors"
                >
                  Review Mitra Pertama <ChevronRight className="h-4 w-4" />
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-5">
              {(() => {
                const ev = selectedEval;
                const p1 = ev.phase1Eval!;
                const weightedAvg = computeWeightedAverage(p1.criteria);
                const passed = p1.overallResult === "Lolos";
                const app = selectedApp;
                const mitraState = mitraStates.find((m) => m.partnerId === ev.partnerId);
                const direksiMitraState = direksiMitraStates.find((m) => m.partnerId === ev.partnerId);

                return (
                  <>
                    {/* Mitra Header */}
                    <div className="rounded-xl bg-white shadow-sm overflow-hidden">
                      <div className={cn(
                        "px-6 py-4 border-b flex items-center justify-between",
                        passed ? "bg-green-50" : "bg-red-50"
                      )}>
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold text-white",
                            passed ? "bg-green-500" : "bg-ptba-red"
                          )}>
                            {passed ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-ptba-charcoal">{p1.partnerName}</h3>
                            <p className="text-xs text-ptba-gray">
                              Mitra {currentIndex + 1} dari {phase1Evals.length}
                              {app && ` · Mendaftar: ${formatDate(app.appliedAt)}`}
                            </p>
                          </div>
                        </div>
                        <span className={cn(
                          "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
                          passed ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                        )}>
                          {p1.overallResult}
                        </span>
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
                        <span className="text-xs text-ptba-gray">{currentIndex + 1} / {phase1Evals.length}</span>
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

                    {/* Tabs: Penilaian / Dokumen */}
                    <div className="rounded-xl bg-white shadow-sm overflow-hidden">
                      <div className="px-5 border-b border-ptba-light-gray">
                        <nav className="flex gap-0 -mb-px">
                          <button
                            type="button"
                            onClick={() => setPanelTab("penilaian")}
                            className={cn(
                              "px-4 py-3 text-sm font-medium transition-all border-b-2 flex items-center gap-2",
                              panelTab === "penilaian"
                                ? "border-b-ptba-gold text-ptba-navy"
                                : "border-b-transparent text-ptba-gray hover:text-ptba-navy"
                            )}
                          >
                            <ClipboardCheck className="h-4 w-4" /> Penilaian
                          </button>
                          <button
                            type="button"
                            onClick={() => setPanelTab("dokumen")}
                            className={cn(
                              "px-4 py-3 text-sm font-medium transition-all border-b-2 flex items-center gap-2",
                              panelTab === "dokumen"
                                ? "border-b-ptba-gold text-ptba-navy"
                                : "border-b-transparent text-ptba-gray hover:text-ptba-navy"
                            )}
                          >
                            <FileText className="h-4 w-4" /> Dokumen
                            {app?.phase1Documents && app.phase1Documents.length > 0 && (
                              <span className="inline-flex items-center justify-center h-5 min-w-[20px] rounded-full bg-ptba-section-bg px-1.5 text-[10px] font-bold text-ptba-navy">
                                {app.phase1Documents.length}
                              </span>
                            )}
                          </button>
                        </nav>
                      </div>

                      {/* Tab: Penilaian */}
                      {panelTab === "penilaian" && (
                        <div className="px-5 py-4">
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b border-ptba-light-gray">
                                  <th className="text-left py-2 pr-3 font-medium text-ptba-navy">Kriteria</th>
                                  <th className="text-center py-2 px-3 font-medium text-ptba-navy w-20">Bobot</th>
                                  <th className="text-center py-2 px-3 font-medium text-ptba-navy w-20">Skor</th>
                                  <th className="text-center py-2 px-3 font-medium text-ptba-navy w-28">Skor Tertimbang</th>
                                  <th className="text-left py-2 pl-3 font-medium text-ptba-navy">Catatan</th>
                                </tr>
                              </thead>
                              <tbody>
                                {p1.criteria.map((criterion, ci) => {
                                  const def = PHASE1_CRITERIA.find((c) => c.name === criterion.name);
                                  const weight = def?.weight ?? 0;
                                  const weightedScore = (criterion.score * weight) / 100;
                                  return (
                                    <tr key={ci} className="border-b border-gray-50 last:border-0">
                                      <td className="py-2.5 pr-3 text-ptba-charcoal">{criterion.name}</td>
                                      <td className="py-2.5 px-3 text-center text-ptba-gray">{weight}%</td>
                                      <td className="py-2.5 px-3 text-center font-semibold text-ptba-charcoal">{criterion.score}/{criterion.maxScore}</td>
                                      <td className="py-2.5 px-3 text-center font-semibold text-ptba-navy">{weightedScore.toFixed(2)}</td>
                                      <td className="py-2.5 pl-3 text-xs text-ptba-gray">{criterion.notes ?? "-"}</td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                              <tfoot>
                                <tr className="border-t-2 border-ptba-light-gray">
                                  <td className="py-3 pr-3 font-semibold text-ptba-navy">Rata-rata Tertimbang</td>
                                  <td className="py-3 px-3 text-center font-semibold text-ptba-navy">100%</td>
                                  <td />
                                  <td className={cn("py-3 px-3 text-center font-bold text-base", weightedAvg >= PHASE1_PASSING_SCORE ? "text-green-700" : "text-red-700")}>
                                    {weightedAvg.toFixed(2)}
                                  </td>
                                  <td className="py-3 pl-3 text-xs text-ptba-gray">Min. {PHASE1_PASSING_SCORE.toFixed(1)} untuk Lolos</td>
                                </tr>
                              </tfoot>
                            </table>
                          </div>
                          {p1.notes && (
                            <div className="mt-3 rounded-lg bg-ptba-section-bg px-4 py-3">
                              <p className="text-xs font-medium text-ptba-navy mb-1">Catatan Evaluator</p>
                              <p className="text-sm text-ptba-charcoal">{p1.notes}</p>
                            </div>
                          )}
                          <div className="mt-3 flex flex-wrap gap-4 text-xs text-ptba-gray">
                            <span>Evaluator: {p1.evaluatedBy}</span>
                            <span>Tanggal: {formatDate(p1.evaluatedAt)}</span>
                          </div>
                        </div>
                      )}

                      {/* Tab: Dokumen */}
                      {panelTab === "dokumen" && (
                        <div className="px-5 py-4">
                          {app?.phase1Documents && app.phase1Documents.length > 0 ? (
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
                              <p className="text-sm text-ptba-gray">Tidak ada dokumen Fase 1 untuk mitra ini.</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* PIC decision per mitra */}
                    {isPIC && !submitted && (
                      <div className="rounded-xl bg-white shadow-sm overflow-hidden">
                        <div className="px-5 py-4 bg-ptba-off-white">
                          <p className="text-xs font-semibold text-ptba-navy mb-3">Keputusan Anda untuk Mitra Ini</p>
                          <div className="flex flex-col sm:flex-row gap-3">
                            <button type="button" onClick={() => updateMitraDecision(ev.partnerId, "approved")}
                              className={cn("inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                                mitraState?.decision === "approved" ? "bg-green-600 text-white" : "bg-white border border-green-300 text-green-700 hover:bg-green-50"
                              )}>
                              <CheckCircle2 className="h-4 w-4" /> Setujui Hasil
                            </button>
                            <button type="button" onClick={() => updateMitraDecision(ev.partnerId, "rejected")}
                              className={cn("inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                                mitraState?.decision === "rejected" ? "bg-red-600 text-white" : "bg-white border border-red-300 text-red-700 hover:bg-red-50"
                              )}>
                              <XCircle className="h-4 w-4" /> Tidak Setuju
                            </button>
                          </div>
                          <textarea
                            value={mitraState?.notes ?? ""}
                            onChange={(e) => updateMitraNotes(ev.partnerId, e.target.value)}
                            placeholder="Catatan persetujuan (opsional)..."
                            rows={2}
                            className="mt-3 w-full rounded-lg border border-ptba-light-gray bg-white px-3 py-2 text-sm text-ptba-charcoal placeholder:text-ptba-gray/60 focus:outline-none focus:ring-2 focus:ring-ptba-steel-blue/40"
                          />
                        </div>
                      </div>
                    )}

                    {isPIC && submitted && mitraState && (
                      <div className={cn("rounded-xl p-4 flex items-center gap-2 text-sm",
                        mitraState.decision === "approved" ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"
                      )}>
                        {mitraState.decision === "approved" ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-red-600" />}
                        <span className="font-medium text-ptba-charcoal">{mitraState.decision === "approved" ? "Disetujui" : "Tidak Disetujui"}</span>
                        {mitraState.notes && <span className="text-ptba-gray ml-2">— {mitraState.notes}</span>}
                      </div>
                    )}

                    {/* Direksi per-mitra decision */}
                    {isDireksi && !direksiSubmitted && (
                      <div className="rounded-xl bg-white shadow-sm overflow-hidden">
                        <div className="px-5 py-4 bg-blue-50/50 border-t-2 border-ptba-navy/20">
                          <p className="text-xs font-semibold text-ptba-navy mb-3 flex items-center gap-1.5">
                            <ShieldCheck className="h-3.5 w-3.5" /> Keputusan Direksi untuk Mitra Ini
                          </p>
                          <div className="flex flex-col sm:flex-row gap-3">
                            <button type="button" onClick={() => updateDireksiMitraDecision(ev.partnerId, "setujui")}
                              className={cn("inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                                direksiMitraState?.decision === "setujui" ? "bg-green-600 text-white shadow-sm" : "bg-white border border-green-300 text-green-700 hover:bg-green-50"
                              )}>
                              <CheckCircle2 className="h-4 w-4" /> Setujui Hasil
                            </button>
                            <button type="button" onClick={() => updateDireksiMitraDecision(ev.partnerId, "re-evaluasi")}
                              className={cn("inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                                direksiMitraState?.decision === "re-evaluasi" ? "bg-amber-500 text-white shadow-sm" : "bg-white border border-amber-300 text-amber-700 hover:bg-amber-50"
                              )}>
                              <RotateCcw className="h-4 w-4" /> Minta Re-evaluasi oleh EBD
                            </button>
                          </div>
                          <textarea
                            value={direksiMitraState?.notes ?? ""}
                            onChange={(e) => updateDireksiMitraNotes(ev.partnerId, e.target.value)}
                            placeholder={direksiMitraState?.decision === "re-evaluasi" ? "Jelaskan apa yang perlu di-review ulang oleh EBD..." : "Catatan Direksi (opsional)..."}
                            rows={2}
                            className="mt-3 w-full rounded-lg border border-ptba-light-gray bg-white px-3 py-2 text-sm text-ptba-charcoal placeholder:text-ptba-gray/60 focus:outline-none focus:ring-2 focus:ring-ptba-steel-blue/40"
                          />
                        </div>
                      </div>
                    )}

                    {isDireksi && direksiSubmitted && direksiMitraState && (
                      <div className={cn("rounded-xl p-4 flex items-center gap-2 text-sm",
                        direksiMitraState.decision === "setujui" ? "bg-green-50 border border-green-200" : "bg-amber-50 border border-amber-200"
                      )}>
                        {direksiMitraState.decision === "setujui"
                          ? <CheckCircle2 className="h-4 w-4 text-green-600" />
                          : <RotateCcw className="h-4 w-4 text-amber-600" />}
                        <span className={cn("font-medium", direksiMitraState.decision === "setujui" ? "text-green-700" : "text-amber-700")}>
                          {direksiMitraState.decision === "setujui" ? "Hasil Disetujui" : "Dikembalikan ke EBD untuk Re-evaluasi"}
                        </span>
                        {direksiMitraState.notes && <span className="text-ptba-gray ml-2">— {direksiMitraState.notes}</span>}
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          )}

          {/* ---- Submit sections (below right panel) ---- */}
          {/* PIC submit */}
          {isPIC && !submitted && (
            <div className="rounded-xl bg-white p-5 shadow-sm">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-ptba-charcoal">
                    {allPICDecided
                      ? `Semua keputusan telah diisi (${approvedCount} disetujui, ${rejectedCount} tidak disetujui)`
                      : `${mitraStates.filter((m) => m.decision !== "pending").length} dari ${mitraStates.length} mitra telah direview`}
                  </p>
                  {!allPICDecided && <p className="text-xs text-ptba-gray mt-0.5">Harap review semua mitra sebelum mengirim keputusan.</p>}
                </div>
                <button type="button" onClick={handlePICSubmit} disabled={!allPICDecided}
                  className={cn("inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors",
                    allPICDecided ? "bg-ptba-navy text-white hover:bg-ptba-navy/90" : "bg-gray-200 text-gray-400 cursor-not-allowed"
                  )}>
                  <Send className="h-4 w-4" /> Kirim Keputusan
                </button>
              </div>
            </div>
          )}

          {isPIC && submitted && (
            <div className="rounded-xl bg-green-50 border border-green-200 p-5 shadow-sm flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-green-800">Keputusan Berhasil Dikirim</p>
                <p className="text-xs text-green-700 mt-0.5">Keputusan Anda telah dikirim ke Direksi untuk persetujuan akhir.</p>
              </div>
            </div>
          )}

          {/* Direksi submit */}
          {isDireksi && !direksiSubmitted && (
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <div className="flex items-start gap-3 mb-5">
                <ShieldCheck className="h-5 w-5 text-ptba-navy mt-0.5 shrink-0" />
                <div>
                  <h2 className="text-base font-semibold text-ptba-navy">Keputusan Akhir Direksi</h2>
                  <p className="text-xs text-ptba-gray mt-0.5">
                    Pilih keputusan untuk setiap mitra di atas, lalu kirim keputusan akhir.
                  </p>
                </div>
              </div>

              <div className="rounded-lg border border-ptba-light-gray bg-ptba-section-bg p-4 mb-5">
                <p className="text-xs font-semibold text-ptba-navy mb-3">Ringkasan Keputusan Per Mitra</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="rounded-lg bg-white p-3 text-center">
                    <p className="text-2xl font-bold text-ptba-gray">{direksiMitraStates.filter((m) => m.decision === "pending").length}</p>
                    <p className="text-xs text-ptba-gray">Belum Diputuskan</p>
                  </div>
                  <div className="rounded-lg bg-white p-3 text-center">
                    <p className="text-2xl font-bold text-green-600">{direksiSetujuiCount}</p>
                    <p className="text-xs text-green-700">Disetujui</p>
                  </div>
                  <div className="rounded-lg bg-white p-3 text-center">
                    <p className="text-2xl font-bold text-amber-600">{direksiReEvalCount}</p>
                    <p className="text-xs text-amber-700">Minta Re-evaluasi</p>
                  </div>
                </div>
              </div>

              <textarea
                value={direksiGlobalNotes}
                onChange={(e) => setDireksiGlobalNotes(e.target.value)}
                placeholder="Catatan umum Direksi (opsional)..."
                rows={3}
                className="w-full rounded-lg border border-ptba-light-gray bg-white px-3 py-2 text-sm text-ptba-charcoal placeholder:text-ptba-gray/60 focus:outline-none focus:ring-2 focus:ring-ptba-steel-blue/40 mb-4"
              />

              <button type="button" onClick={handleDireksiSubmit} disabled={!allDireksiDecided}
                className={cn("w-full inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold transition-colors",
                  allDireksiDecided ? "bg-ptba-navy text-white hover:bg-ptba-navy/90 shadow-md" : "bg-gray-200 text-gray-400 cursor-not-allowed"
                )}>
                <Send className="h-4 w-4" />
                {!allDireksiDecided ? "Putuskan semua mitra terlebih dahulu"
                  : hasReEvalRequests ? `Kirim Keputusan (${direksiSetujuiCount} Setujui, ${direksiReEvalCount} Re-evaluasi)`
                  : `Setujui Semua & Lanjutkan ke Fase 2`}
              </button>
            </div>
          )}

          {isDireksi && direksiSubmitted && (
            <div className={cn("rounded-xl border p-5 shadow-sm flex items-start gap-3",
              hasReEvalRequests ? "bg-amber-50 border-amber-200" : "bg-green-50 border-green-200"
            )}>
              {hasReEvalRequests ? <RotateCcw className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" /> : <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />}
              <div>
                <p className={cn("text-sm font-semibold", hasReEvalRequests ? "text-amber-800" : "text-green-800")}>
                  {hasReEvalRequests ? "Keputusan Dikirim — Menunggu Re-evaluasi EBD" : "Keputusan Dikirim — Proyek Lanjut ke Fase 2"}
                </p>
                <p className={cn("text-xs mt-1", hasReEvalRequests ? "text-amber-700" : "text-green-700")}>
                  {hasReEvalRequests
                    ? `${direksiReEvalCount} mitra dikembalikan ke EBD. ${direksiSetujuiCount} mitra disetujui.`
                    : "Semua hasil evaluasi Fase 1 telah disetujui. Mitra yang lolos akan diundang ke Fase 2."}
                </p>
                <Link href="/approvals" className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-ptba-navy hover:text-ptba-steel-blue transition-colors">
                  Kembali ke Antrian Persetujuan <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ---- Confirmation modal ---- */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="rounded-xl bg-white p-6 shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className={cn("flex items-center justify-center w-10 h-10 rounded-full", hasReEvalRequests ? "bg-amber-100" : "bg-green-100")}>
                {hasReEvalRequests ? <RotateCcw className="h-5 w-5 text-amber-600" /> : <CheckCircle2 className="h-5 w-5 text-green-600" />}
              </div>
              <h3 className="text-lg font-bold text-ptba-navy">Konfirmasi Keputusan Direksi</h3>
            </div>
            <p className="text-sm text-ptba-charcoal mb-4">
              Anda akan mengirim keputusan untuk proyek <span className="font-semibold">{project.name}</span>:
            </p>
            <div className="space-y-2 mb-5">
              {direksiSetujuiCount > 0 && (
                <div className="rounded-lg bg-green-50 border border-green-200 p-3 flex items-center gap-3">
                  <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-green-800">{direksiSetujuiCount} mitra disetujui</p>
                    <p className="text-xs text-green-700">Hasil evaluasi diterima, lanjut ke Fase 2</p>
                  </div>
                </div>
              )}
              {direksiReEvalCount > 0 && (
                <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 flex items-center gap-3">
                  <RotateCcw className="h-4 w-4 text-amber-600 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-amber-800">{direksiReEvalCount} mitra diminta re-evaluasi</p>
                    <p className="text-xs text-amber-700">Dikembalikan ke EBD untuk dicek ulang</p>
                  </div>
                </div>
              )}
            </div>
            <div className="rounded-lg border border-ptba-light-gray bg-ptba-section-bg p-3 mb-5">
              <p className="text-xs font-medium text-ptba-navy mb-2">Detail per mitra:</p>
              <div className="space-y-1.5">
                {direksiMitraStates.map((m) => {
                  const mEv = phase1Evals.find((e) => e.partnerId === m.partnerId);
                  return (
                    <div key={m.partnerId} className="flex items-center gap-2 text-xs">
                      {m.decision === "setujui" ? <CheckCircle2 className="h-3.5 w-3.5 text-green-600 shrink-0" /> : <RotateCcw className="h-3.5 w-3.5 text-amber-600 shrink-0" />}
                      <span className="text-ptba-charcoal font-medium">{mEv?.phase1Eval?.partnerName ?? m.partnerId}</span>
                      <span className={cn("ml-auto", m.decision === "setujui" ? "text-green-700" : "text-amber-700")}>
                        {m.decision === "setujui" ? "Disetujui" : "Re-evaluasi"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setShowConfirm(false)}
                className="flex-1 rounded-lg border border-ptba-light-gray px-4 py-2 text-sm font-medium text-ptba-charcoal hover:bg-gray-50 transition-colors">
                Batal
              </button>
              <button type="button" onClick={handleConfirmFinal}
                className={cn("flex-1 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors",
                  hasReEvalRequests ? "bg-ptba-navy hover:bg-ptba-navy/90" : "bg-green-600 hover:bg-green-700"
                )}>
                Ya, Kirim Keputusan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function BackHeader({ projectId, projectName }: { projectId: string; projectName: string }) {
  return (
    <div className="flex items-center gap-3">
      <Link href={`/projects/${projectId}`}
        className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-white border border-ptba-light-gray text-ptba-gray hover:text-ptba-navy hover:border-ptba-navy transition-colors">
        <ArrowLeft className="h-4 w-4" />
      </Link>
      <div className="flex items-center gap-1.5 text-sm text-ptba-gray">
        <Link href="/projects" className="hover:text-ptba-steel-blue">Proyek</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href={`/projects/${projectId}`} className="hover:text-ptba-steel-blue">{projectName}</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-ptba-navy font-medium">Approval Fase 1</span>
      </div>
    </div>
  );
}

function SummaryBox({ label, value, color }: { label: string; value: number | string; color?: "green" | "red" }) {
  return (
    <div className="rounded-lg bg-ptba-section-bg p-3 text-center">
      <p className="text-xs text-ptba-gray mb-1">{label}</p>
      <p className={cn("text-xl font-bold", color === "green" ? "text-green-700" : color === "red" ? "text-red-700" : "text-ptba-navy")}>
        {value}
      </p>
    </div>
  );
}
