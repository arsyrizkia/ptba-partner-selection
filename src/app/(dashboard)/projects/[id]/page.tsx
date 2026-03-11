"use client";

import { use, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Building2,
  FileText,
  Info,
  BarChart3,
  ExternalLink,
  LockKeyhole,
  Send,
  ShieldCheck,
  AlertTriangle,
  UserCheck,
  Users,
  Rocket,
  X,
  Calendar,
  DollarSign,
  CreditCard,
  Eye,
  ThumbsUp,
  ThumbsDown,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useAuth } from "@/lib/auth/auth-context";
import { mockProjects } from "@/lib/mock-data/projects";
import { mockPartners } from "@/lib/mock-data/partners";
import { mockEvaluations } from "@/lib/mock-data/evaluations";
import { mockApplications } from "@/lib/mock-data/applications";
import { PROJECT_STEPS, PHASE1_STEPS, PHASE2_STEPS } from "@/lib/constants/project-steps";

function formatCurrency(value: number): string {
  if (value >= 1_000_000_000_000) return `Rp ${(value / 1_000_000_000_000).toFixed(1)} T`;
  if (value >= 1_000_000_000) return `Rp ${(value / 1_000_000_000).toFixed(1)} M`;
  return `Rp ${(value / 1_000_000).toFixed(0)} Jt`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

function statusBadgeClass(status: string): string {
  const map: Record<string, string> = {
    Draft: "bg-gray-100 text-gray-600",
    Evaluasi: "bg-blue-100 text-blue-700",
    Persetujuan: "bg-amber-100 text-amber-700",
    Selesai: "bg-green-100 text-green-700",
    Dibatalkan: "bg-red-100 text-red-700",
  };
  return map[status] ?? "bg-gray-100 text-gray-600";
}

function typeBadgeClass(type: string): string {
  const map: Record<string, string> = {
    CAPEX: "bg-ptba-navy/10 text-ptba-navy",
    OPEX: "bg-ptba-steel-blue/10 text-ptba-steel-blue",
    Strategis: "bg-ptba-gold/10 text-ptba-gold",
  };
  return map[type] ?? "bg-gray-100 text-gray-600";
}

function phaseLabel(phase?: string): string {
  if (!phase) return "";
  const map: Record<string, string> = {
    phase1_registration: "Fase 1 - Pendaftaran EoI",
    phase1_closed: "Fase 1 - Pendaftaran Ditutup",
    phase1_evaluation: "Fase 1 - Evaluasi EBD",
    phase1_approval: "Fase 1 - Persetujuan",
    phase1_announcement: "Fase 1 - Pengumuman Shortlist",
    phase1_approved: "Fase 1 - Disetujui Direksi",
    phase2_registration: "Fase 2 - Pendaftaran",
    phase2_evaluation: "Fase 2 - Evaluasi Komprehensif",
    phase2_ranking: "Fase 2 - Peringkat",
    phase2_negotiation: "Fase 2 - Negosiasi",
    phase2_approval: "Fase 2 - Persetujuan BoD",
    phase2_announcement: "Fase 2 - Pengumuman Pemenang",
    completed: "Selesai",
    cancelled: "Dibatalkan",
  };
  return map[phase] ?? phase;
}

function EvalStatusCell({ done }: { done: boolean }) {
  if (done) {
    return (
      <span className="inline-flex items-center gap-1 text-green-600 text-xs font-medium">
        <CheckCircle2 className="h-3.5 w-3.5" /> Selesai
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-amber-500 text-xs">
      <Clock className="h-3.5 w-3.5" /> Pending
    </span>
  );
}

type Tab = "mitra" | "dokumen" | "informasi";

export default function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { role } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("mitra");

  const project = mockProjects.find((p) => p.id === id);

  if (!project) {
    return (
      <div className="space-y-4">
        <Link href="/projects" className="inline-flex items-center gap-1.5 text-sm text-ptba-gray hover:text-ptba-navy">
          <ArrowLeft className="h-4 w-4" /> Kembali ke Daftar Proyek
        </Link>
        <p className="text-ptba-gray">Proyek tidak ditemukan.</p>
      </div>
    );
  }

  const isPhase1 = project.phase?.startsWith("phase1");
  const isPhase2 = project.phase?.startsWith("phase2");

  // Get applications for this project
  const projectApplications = mockApplications.filter((a) => a.projectId === project.id);

  // Resolve partners for this project
  const projectPartners = project.partners.map((pid) => {
    const partner = mockPartners.find((p) => p.id === pid);
    const evals = mockEvaluations.filter(
      (e) => e.projectId === project.id && e.partnerId === pid
    );
    const phase2Eval = evals.find((e) => e.phase === "phase2");
    const phase1Eval = evals.find((e) => e.phase === "phase1");
    const application = projectApplications.find((a) => a.partnerId === pid);
    const docTotal = partner?.documents.length ?? 0;
    const docComplete = partner?.documents.filter((d) => d.status === "Lengkap").length ?? 0;
    const docPct = docTotal > 0 ? Math.round((docComplete / docTotal) * 100) : 0;
    const isShortlisted = project.shortlistedPartners?.includes(pid) ?? false;

    return {
      id: pid,
      name: partner?.name ?? pid,
      code: partner?.code ?? pid,
      docPct,
      docTotal,
      docComplete,
      documents: partner?.documents ?? [],
      hasFinancialEval: !!phase2Eval?.financial,
      hasLegalEval: !!phase2Eval?.legal,
      hasRiskEval: !!phase2Eval?.risk,
      hasTechnicalEval: !!phase2Eval?.technical,
      evalStatus: phase2Eval?.status,
      phase1Result: phase1Eval?.phase1Eval?.overallResult ?? application?.phase1Result,
      phase1Score: phase1Eval?.phase1Eval
        ? phase1Eval.phase1Eval.criteria.reduce((sum, c) => sum + (c.score / c.maxScore) * (
            c.name === "Kualitas Profil Perusahaan" ? 20 :
            c.name === "Pengalaman Proyek Relevan" ? 25 :
            c.name === "Kemampuan Pembiayaan" ? 25 :
            c.name === "Gambaran Umum Keuangan" ? 15 : 15
          ) / 100 * 5, 0)
        : undefined,
      isShortlisted,
      applicationPhase: application?.phase,
    };
  });

  // Workflow state
  const [showPersetujuanModal, setShowPersetujuanModal] = useState(false);
  const [selectedMitra, setSelectedMitra] = useState<string[]>([]);
  const [persetujuanNotes, setPersetujuanNotes] = useState("");
  const [showPhase2Modal, setShowPhase2Modal] = useState(false);
  const [phase2Deadline, setPhase2Deadline] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split("T")[0];
  });
  const [phase2Fee, setPhase2Fee] = useState(project.registrationFee ?? 50000000);
  const [phase2Divisions, setPhase2Divisions] = useState<string[]>(["keuangan", "hukum", "risiko", "ebd"]);
  const isAdmin = role === "ebd" || role === "super_admin";
  const isPhase1Approved = project.phase === "phase1_approved";

  // Payment verification state
  type PaymentDecision = "pending" | "approved" | "rejected";
  const [paymentDecisions, setPaymentDecisions] = useState<Record<string, PaymentDecision>>({});
  const [payRejectNotes, setPayRejectNotes] = useState<Record<string, string>>({});
  const [showPayRejectForm, setShowPayRejectForm] = useState<string | null>(null);
  const [viewingPayProof, setViewingPayProof] = useState<string | null>(null);
  const [showUnverifiedWarning, setShowUnverifiedWarning] = useState(false);

  const allEvalsComplete = projectPartners.length > 0 && projectPartners.every(
    (p) => p.hasTechnicalEval && p.hasFinancialEval && p.hasLegalEval && p.hasRiskEval
  );

  const partnerScores = projectPartners.map((p) => {
    const eval0 = mockEvaluations.find(
      (e) => e.projectId === project.id && e.partnerId === p.id && e.phase === "phase2"
    );
    return {
      ...p,
      totalScore: eval0?.totalScore ?? 0,
      grade: eval0?.grade ?? "-",
      technicalScore: eval0?.technical?.total ?? 0,
      financialScore: eval0?.financial?.totalScore ?? 0,
      financialGrade: eval0?.financial?.grade ?? "-",
      legalStatus: eval0?.legal?.overallStatus ?? "-",
      riskLevel: eval0?.risk?.overallLevel ?? "-",
    };
  }).sort((a, b) => b.totalScore - a.totalScore);

  const handleCloseRegistration = () => {
    alert("Pendaftaran mitra Phase 1 berhasil ditutup.");
  };

  const toggleMitraSelection = (partnerId: string) => {
    setSelectedMitra((prev) =>
      prev.includes(partnerId) ? prev.filter((id) => id !== partnerId) : [...prev, partnerId]
    );
  };

  const handleSubmitPersetujuan = () => {
    if (selectedMitra.length === 0) {
      alert("Pilih minimal 1 mitra yang direkomendasikan.");
      return;
    }
    const names = selectedMitra.map((mid) => projectPartners.find((p) => p.id === mid)?.name).join(", ");
    alert(`Persetujuan berhasil diajukan ke Direksi.\nMitra direkomendasikan: ${names}`);
    setShowPersetujuanModal(false);
    setSelectedMitra([]);
    setPersetujuanNotes("");
  };

  function getEvalLink(partnerId: string): string {
    const base = `/projects/${id}/evaluation`;
    if (isPhase1) return `${base}/phase1?partnerId=${partnerId}`;
    if (role === "keuangan") return `${base}/financial?partnerId=${partnerId}`;
    if (role === "hukum") return `${base}/legal?partnerId=${partnerId}`;
    if (role === "risiko") return `${base}/risk?partnerId=${partnerId}`;
    if (role === "ebd") return `${base}/ebd?partnerId=${partnerId}`;
    if (role === "super_admin") return `${base}/ebd?partnerId=${partnerId}`;
    return base;
  }

  const canEvaluate = ["keuangan", "hukum", "risiko", "ebd", "super_admin"].includes(role ?? "");

  function EvalActionButton({ partnerId, evalDone }: { partnerId: string; evalDone: boolean }) {
    if (!canEvaluate) return null;
    if (evalDone) {
      return (
        <Link
          href={getEvalLink(partnerId)}
          className="inline-flex items-center gap-1 rounded px-2.5 py-1 text-xs font-medium bg-ptba-section-bg text-ptba-navy hover:bg-ptba-navy/10 transition-colors"
        >
          <ExternalLink className="h-3 w-3" /> Lihat Hasil
        </Link>
      );
    }
    return (
      <Link
        href={getEvalLink(partnerId)}
        className="inline-flex items-center gap-1 rounded px-2.5 py-1 text-xs font-medium bg-ptba-navy text-white hover:bg-ptba-navy/90 transition-colors"
      >
        Mulai Evaluasi
      </Link>
    );
  }

  return (
    <div className="space-y-6">
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-1.5 text-sm text-ptba-gray hover:text-ptba-navy transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Kembali
      </button>

      {/* Phase 1 Approved Banner */}
      {isPhase1Approved && isAdmin && (
        <div className="rounded-xl border border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 p-5 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 flex-shrink-0">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-green-800">Fase 1 Disetujui oleh Direksi</h3>
                <p className="text-xs text-green-700 mt-0.5">
                  {project.shortlistedPartners?.length ?? 0} mitra lolos shortlist dan siap melanjutkan ke Fase 2.
                  Verifikasi pembayaran mitra dan konfigurasi parameter Fase 2 untuk memulai proses selanjutnya.
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row shrink-0">
              <button
                onClick={() => setShowPhase2Modal(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-ptba-navy px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-ptba-steel-blue"
              >
                <Rocket className="h-4 w-4" />
                Mulai Fase 2
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Phase 2 Configuration Modal */}
      {showPhase2Modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowPhase2Modal(false)}>
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-ptba-charcoal">Konfigurasi Fase 2</h2>
                <p className="text-xs text-ptba-gray mt-0.5">Atur parameter sebelum memulai Fase 2</p>
              </div>
              <button onClick={() => setShowPhase2Modal(false)} className="rounded-lg p-1.5 hover:bg-ptba-section-bg transition-colors">
                <X className="h-5 w-5 text-ptba-gray" />
              </button>
            </div>

            {/* Shortlisted mitra info */}
            <div className="rounded-lg bg-ptba-section-bg p-3 mb-5">
              <p className="text-xs font-semibold text-ptba-navy mb-1.5">Mitra yang Lolos Fase 1</p>
              <div className="flex flex-wrap gap-1.5">
                {(project.shortlistedPartners ?? []).map((pid) => {
                  const partner = mockPartners.find((p) => p.id === pid);
                  return (
                    <span key={pid} className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-medium text-ptba-charcoal border border-ptba-light-gray">
                      <CheckCircle2 className="h-3 w-3 text-green-600" />
                      {partner?.name ?? pid}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Deadline */}
            <div className="mb-4">
              <label className="flex items-center gap-1.5 text-sm font-semibold text-ptba-charcoal mb-1.5">
                <Calendar className="h-4 w-4 text-ptba-gray" />
                Batas Waktu Fase 2
              </label>
              <input
                type="date"
                value={phase2Deadline}
                onChange={(e) => setPhase2Deadline(e.target.value)}
                className="w-full rounded-lg border border-ptba-light-gray px-3 py-2 text-sm text-ptba-charcoal focus:border-ptba-navy focus:outline-none focus:ring-1 focus:ring-ptba-navy"
              />
            </div>

            {/* Registration fee */}
            <div className="mb-4">
              <label className="flex items-center gap-1.5 text-sm font-semibold text-ptba-charcoal mb-1.5">
                <DollarSign className="h-4 w-4 text-ptba-gray" />
                Biaya Pendaftaran Fase 2
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-ptba-gray">Rp</span>
                <input
                  type="text"
                  value={phase2Fee.toLocaleString("id-ID")}
                  onChange={(e) => {
                    const num = parseInt(e.target.value.replace(/\D/g, ""), 10);
                    if (!isNaN(num)) setPhase2Fee(num);
                  }}
                  className="w-full rounded-lg border border-ptba-light-gray pl-10 pr-3 py-2 text-sm text-ptba-charcoal focus:border-ptba-navy focus:outline-none focus:ring-1 focus:ring-ptba-navy"
                />
              </div>
            </div>

            {/* Required divisions */}
            <div className="mb-6">
              <label className="text-sm font-semibold text-ptba-charcoal mb-1.5 block">Divisi Evaluasi yang Diperlukan</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: "keuangan", label: "Keuangan (KEP-100)" },
                  { key: "hukum", label: "Hukum & Regulasi" },
                  { key: "risiko", label: "Manajemen Risiko" },
                  { key: "ebd", label: "EBD (Teknis & Pasar)" },
                ].map((div) => (
                  <label
                    key={div.key}
                    className={cn(
                      "flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium cursor-pointer transition-colors",
                      phase2Divisions.includes(div.key)
                        ? "border-ptba-navy bg-ptba-navy/5 text-ptba-navy"
                        : "border-ptba-light-gray text-ptba-gray hover:bg-ptba-section-bg"
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={phase2Divisions.includes(div.key)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setPhase2Divisions((prev) => [...prev, div.key]);
                        } else {
                          setPhase2Divisions((prev) => prev.filter((d) => d !== div.key));
                        }
                      }}
                      className="rounded border-ptba-light-gray text-ptba-navy focus:ring-ptba-navy h-3.5 w-3.5"
                    />
                    {div.label}
                  </label>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowPhase2Modal(false)}
                className="flex-1 rounded-lg border border-ptba-light-gray px-4 py-2.5 text-sm font-medium text-ptba-gray hover:bg-ptba-section-bg transition-colors"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  // Check if all shortlisted mitra payments are verified
                  const shortlistedIds = project.shortlistedPartners ?? [];
                  const allPaid = shortlistedIds.every((pid) => {
                    const app = mockApplications.find((a) => a.projectId === id && a.partnerId === pid);
                    if (!app) return false;
                    const decision = paymentDecisions[app.id];
                    if (decision === "approved") return true;
                    if (!decision && app.feePaymentStatus === "Sudah Bayar") return true;
                    return false;
                  });

                  if (!allPaid) {
                    setShowUnverifiedWarning(true);
                  } else {
                    alert(
                      `Fase 2 berhasil dimulai!\n\nBatas Waktu: ${phase2Deadline}\nBiaya Pendaftaran: Rp ${phase2Fee.toLocaleString("id-ID")}\nDivisi: ${phase2Divisions.join(", ")}\n\nNotifikasi telah dikirim ke ${shortlistedIds.length} mitra yang lolos.`
                    );
                    setShowPhase2Modal(false);
                  }
                }}
                disabled={phase2Divisions.length === 0}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-ptba-navy px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-ptba-steel-blue disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Rocket className="h-4 w-4" />
                Mulai Fase 2
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unverified Payment Warning Modal */}
      {showUnverifiedWarning && (() => {
        const shortlistedIds = project.shortlistedPartners ?? [];
        const unverifiedMitra = shortlistedIds.filter((pid) => {
          const app = mockApplications.find((a) => a.projectId === id && a.partnerId === pid);
          if (!app) return true;
          const decision = paymentDecisions[app.id];
          if (decision === "approved") return false;
          if (!decision && app.feePaymentStatus === "Sudah Bayar") return false;
          return true;
        }).map((pid) => mockPartners.find((p) => p.id === pid)?.name ?? pid);

        const verifiedMitra = shortlistedIds.filter((pid) => {
          const app = mockApplications.find((a) => a.projectId === id && a.partnerId === pid);
          if (!app) return false;
          const decision = paymentDecisions[app.id];
          if (decision === "approved") return true;
          if (!decision && app.feePaymentStatus === "Sudah Bayar") return true;
          return false;
        }).map((pid) => mockPartners.find((p) => p.id === pid)?.name ?? pid);

        return (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40" onClick={() => setShowUnverifiedWarning(false)}>
            <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl mx-4" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-start gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 shrink-0">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-ptba-charcoal">Pembayaran Belum Lengkap</h3>
                  <p className="text-sm text-ptba-gray mt-1">
                    Terdapat <span className="font-semibold text-amber-600">{unverifiedMitra.length} mitra</span> yang belum menyelesaikan pembayaran. Mitra tersebut akan <span className="font-semibold text-red-600">gagal</span> melanjutkan ke Fase 2.
                  </p>
                </div>
              </div>

              {/* Unverified list */}
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 mb-3">
                <p className="text-xs font-semibold text-red-800 mb-1.5">Tidak Dapat Melanjutkan:</p>
                {unverifiedMitra.map((name) => (
                  <div key={name} className="flex items-center gap-1.5 text-xs text-red-700">
                    <XCircle className="h-3 w-3 shrink-0" /> {name}
                  </div>
                ))}
              </div>

              {/* Verified list */}
              {verifiedMitra.length > 0 && (
                <div className="rounded-lg border border-green-200 bg-green-50 p-3 mb-4">
                  <p className="text-xs font-semibold text-green-800 mb-1.5">Melanjutkan ke Fase 2:</p>
                  {verifiedMitra.map((name) => (
                    <div key={name} className="flex items-center gap-1.5 text-xs text-green-700">
                      <CheckCircle2 className="h-3 w-3 shrink-0" /> {name}
                    </div>
                  ))}
                </div>
              )}

              <p className="text-xs text-ptba-gray mb-4">Apakah Anda yakin ingin melanjutkan?</p>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowUnverifiedWarning(false)}
                  className="flex-1 rounded-lg border border-ptba-light-gray px-4 py-2.5 text-sm font-medium text-ptba-gray hover:bg-ptba-section-bg transition-colors"
                >
                  Kembali
                </button>
                <button
                  onClick={() => {
                    const verifiedCount = verifiedMitra.length;
                    alert(
                      `Fase 2 berhasil dimulai!\n\nBatas Waktu: ${phase2Deadline}\nBiaya Pendaftaran: Rp ${phase2Fee.toLocaleString("id-ID")}\nDivisi: ${phase2Divisions.join(", ")}\n\nNotifikasi dikirim ke ${verifiedCount} mitra yang terverifikasi.\n${unverifiedMitra.length} mitra gagal melanjutkan.`
                    );
                    setShowUnverifiedWarning(false);
                    setShowPhase2Modal(false);
                  }}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-amber-700"
                >
                  <AlertTriangle className="h-4 w-4" />
                  Tetap Lanjutkan
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Header Card */}
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold", typeBadgeClass(project.type))}>
                {project.type}
              </span>
              <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold", statusBadgeClass(project.status))}>
                {project.status}
              </span>
              {project.phase && (
                <span className="rounded-full bg-ptba-steel-blue/10 px-2.5 py-0.5 text-xs font-semibold text-ptba-steel-blue">
                  {phaseLabel(project.phase)}
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold text-ptba-charcoal">{project.name}</h1>
            <p className="text-sm text-ptba-gray">
              {formatDate(project.startDate)} — {formatDate(project.endDate)}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-xs text-ptba-gray">Nilai CAPEX</p>
            <p className="text-2xl font-bold text-ptba-navy">{formatCurrency(project.capexValue)}</p>
            <p className="text-xs text-ptba-gray mt-1">{project.partners.length} Mitra Berpartisipasi</p>
          </div>
        </div>

        {/* PIC Display */}
        {project.picAssignments && project.picAssignments.length > 0 && (
          <div className="mt-4 rounded-lg bg-ptba-section-bg p-3">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-ptba-navy" />
              <span className="text-xs font-semibold text-ptba-navy">PIC yang Ditunjuk</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {project.picAssignments.map((pic) => (
                <span key={pic.userId} className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs text-ptba-charcoal border border-ptba-light-gray">
                  <UserCheck className="h-3 w-3 text-ptba-steel-blue" />
                  <span className="font-medium">{pic.userName}</span>
                  <span className="text-ptba-gray">({pic.role.toUpperCase()})</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {isAdmin && project.status !== "Selesai" && project.status !== "Dibatalkan" && (
          <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-ptba-light-gray pt-4">
            {/* Phase 1 actions */}
            {isPhase1 && project.phase === "phase1_registration" && project.isOpenForApplication && (
              <button
                onClick={handleCloseRegistration}
                className="inline-flex items-center gap-2 rounded-lg border border-ptba-red/30 bg-ptba-red/5 px-4 py-2 text-sm font-medium text-ptba-red hover:bg-ptba-red/10 transition-colors"
              >
                <LockKeyhole className="h-4 w-4" />
                Tutup Pendaftaran Phase 1
              </button>
            )}
            {isPhase1 && (project.phase === "phase1_closed" || project.phase === "phase1_evaluation") && (
              <Link
                href={`/projects/${id}/evaluation/phase1`}
                className="inline-flex items-center gap-2 rounded-lg bg-ptba-navy px-4 py-2 text-sm font-medium text-white hover:bg-ptba-navy/90 transition-colors"
              >
                <ShieldCheck className="h-4 w-4" />
                Mulai Evaluasi Phase 1
              </Link>
            )}
            {isPhase1 && project.phase === "phase1_approval" && (
              <Link
                href={`/projects/${id}/approval/phase1`}
                className="inline-flex items-center gap-2 rounded-lg bg-ptba-gold px-4 py-2 text-sm font-bold text-ptba-charcoal hover:bg-ptba-gold-light transition-colors"
              >
                <Send className="h-4 w-4" />
                Persetujuan Shortlist
              </Link>
            )}

            {/* Phase 2 actions */}
            {isPhase2 && (
              <>
                {allEvalsComplete ? (
                  <div className="inline-flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 px-4 py-2 text-sm font-medium text-green-700">
                    <ShieldCheck className="h-4 w-4" />
                    Semua Evaluasi Selesai
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 px-4 py-2 text-sm font-medium text-amber-700">
                    <AlertTriangle className="h-4 w-4" />
                    Evaluasi Belum Lengkap
                  </div>
                )}
                {allEvalsComplete && project.status === "Evaluasi" && (
                  <button
                    onClick={() => setShowPersetujuanModal(true)}
                    className="inline-flex items-center gap-2 rounded-lg bg-ptba-gold px-4 py-2 text-sm font-bold text-ptba-charcoal shadow-sm hover:bg-ptba-gold-light transition-colors"
                  >
                    <Send className="h-4 w-4" />
                    Ajukan Persetujuan Direksi
                  </button>
                )}
              </>
            )}
          </div>
        )}

        {/* Two-Phase Progress Bar */}
        <div className="mt-6">
          <div className="mb-2 flex items-center justify-between text-xs text-ptba-gray">
            <span>Langkah {project.currentStep} dari {project.totalSteps}</span>
            <span className="font-medium text-ptba-navy">
              {PROJECT_STEPS[project.currentStep - 1]?.name ?? ""}
            </span>
          </div>
          <div className="flex items-center gap-0">
            {/* Phase 1 */}
            <div className="flex-1">
              <div className="flex gap-0.5 overflow-hidden rounded-l-full">
                {PHASE1_STEPS.map((s) => {
                  const isCompleted = s.step < project.currentStep;
                  const isCurrent = s.step === project.currentStep;
                  return (
                    <div
                      key={s.step}
                      title={`${s.step}. ${s.name}`}
                      className={cn(
                        "h-3 flex-1 transition-colors",
                        isCompleted && "bg-ptba-navy",
                        isCurrent && "bg-ptba-gold",
                        !isCompleted && !isCurrent && "bg-ptba-light-gray"
                      )}
                    />
                  );
                })}
              </div>
            </div>
            {/* Separator */}
            <div className="w-1 h-5 bg-ptba-charcoal/20 mx-0.5 rounded" />
            {/* Phase 2 */}
            <div className="flex-1">
              <div className="flex gap-0.5 overflow-hidden rounded-r-full">
                {PHASE2_STEPS.map((s) => {
                  const isCompleted = s.step < project.currentStep;
                  const isCurrent = s.step === project.currentStep;
                  return (
                    <div
                      key={s.step}
                      title={`${s.step}. ${s.name}`}
                      className={cn(
                        "h-3 flex-1 transition-colors",
                        isCompleted && "bg-ptba-steel-blue",
                        isCurrent && "bg-ptba-gold",
                        !isCompleted && !isCurrent && "bg-ptba-light-gray"
                      )}
                    />
                  );
                })}
              </div>
            </div>
          </div>
          <div className="mt-1.5 flex justify-between text-[10px] text-ptba-gray/60">
            <span>Phase 1: EoI</span>
            <span className="text-ptba-charcoal/30">|</span>
            <span>Phase 2: Assessment</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-ptba-light-gray">
        <nav className="flex gap-6">
          {(
            [
              { key: "mitra", label: "Mitra", icon: Building2 },
              { key: "dokumen", label: "Dokumen", icon: FileText },
              { key: "informasi", label: "Informasi", icon: Info },
            ] as const
          ).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={cn(
                "flex items-center gap-2 pb-3 pt-1 text-sm font-medium border-b-2 transition-colors",
                activeTab === key
                  ? "border-ptba-navy text-ptba-navy"
                  : "border-transparent text-ptba-gray hover:text-ptba-charcoal"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab A: Mitra */}
      {activeTab === "mitra" && (
        <div className="rounded-xl bg-white p-5 shadow-sm">
          {(role === "ebd" || role === "super_admin") && (
            <div className="mb-4 flex justify-between items-center">
              <div className="flex gap-2">
                {isPhase1 && !isPhase1Approved && (
                  <Link
                    href={`/projects/${id}/evaluation/phase1`}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-ptba-steel-blue/10 px-3 py-1.5 text-sm font-medium text-ptba-steel-blue hover:bg-ptba-steel-blue/20 transition-colors"
                  >
                    <ShieldCheck className="h-4 w-4" /> Evaluasi Fase 1
                  </Link>
                )}
              </div>
              {isPhase2 && (
                <Link
                  href={`/projects/${id}/ranking`}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-ptba-gold/10 px-3 py-1.5 text-sm font-medium text-ptba-gold hover:bg-ptba-gold/20 transition-colors"
                >
                  <BarChart3 className="h-4 w-4" /> Lihat Ranking
                </Link>
              )}
            </div>
          )}

          {/* Phase 1 Active: Card-based EBD evaluation */}
          {isPhase1 && !isPhase1Approved && (
            <div className="space-y-3">
              {projectPartners.map((partner) => {
                const app = projectApplications.find((a) => a.partnerId === partner.id);
                const phase1DocCount = app?.phase1Documents?.length ?? 0;
                const hasResult = !!partner.phase1Result;
                const isLolos = partner.phase1Result === "Lolos";
                const isTidakLolos = partner.phase1Result === "Tidak Lolos";

                return (
                  <div
                    key={partner.id}
                    className={cn(
                      "rounded-xl border-2 p-5 transition-colors",
                      isLolos ? "border-green-200 bg-green-50/30" :
                      isTidakLolos ? "border-red-200 bg-red-50/30" :
                      "border-ptba-light-gray bg-white"
                    )}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className={cn(
                          "flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white",
                          isLolos ? "bg-green-500" :
                          isTidakLolos ? "bg-red-500" :
                          "bg-ptba-navy"
                        )}>
                          {partner.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-ptba-charcoal truncate">{partner.name}</p>
                          <p className="text-xs text-ptba-gray">{partner.code}</p>
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center gap-1 rounded-full bg-ptba-section-bg px-2 py-0.5 text-[11px] text-ptba-gray">
                              <FileText className="h-3 w-3" /> {phase1DocCount} dokumen EoI
                            </span>
                            {hasResult ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-medium text-green-700">
                                <CheckCircle2 className="h-3 w-3" /> Sudah Dievaluasi
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                                <Clock className="h-3 w-3" /> Belum Dievaluasi
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        {isLolos && (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 border border-green-200 px-3 py-1 text-xs font-semibold text-green-700">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Lolos
                          </span>
                        )}
                        {isTidakLolos && (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 border border-red-200 px-3 py-1 text-xs font-semibold text-red-600">
                            Tidak Lolos
                          </span>
                        )}
                        {!hasResult && (
                          <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-ptba-gray">
                            Menunggu
                          </span>
                        )}
                        <EvalActionButton partnerId={partner.id} evalDone={hasResult} />
                      </div>
                    </div>
                    {hasResult && partner.phase1Score !== undefined && (
                      <div className="mt-3 pt-3 border-t border-ptba-light-gray/50">
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="text-ptba-gray">Skor Tertimbang</span>
                          <span className={cn("font-bold", isLolos ? "text-green-600" : "text-red-600")}>
                            {partner.phase1Score.toFixed(2)} / 5.00
                          </span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-gray-200 overflow-hidden">
                          <div
                            className={cn("h-full rounded-full transition-all", isLolos ? "bg-green-500" : "bg-red-500")}
                            style={{ width: `${Math.min((partner.phase1Score / 5) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Phase 1 Approved: Payment Verification View */}
          {isPhase1Approved && (() => {
            const shortlistedIds = project.shortlistedPartners ?? [];
            const shortlistedApps = shortlistedIds.map((pid) => {
              const partner = mockPartners.find((p) => p.id === pid);
              const app = mockApplications.find((a) => a.projectId === id && a.partnerId === pid);
              return { partner, app, pid };
            });

            const getDecision = (appId?: string, status?: string): PaymentDecision => {
              if (appId && paymentDecisions[appId]) return paymentDecisions[appId];
              if (status === "Sudah Bayar") return "approved";
              if (status === "Ditolak") return "rejected";
              return "pending";
            };

            const pendingCount = shortlistedApps.filter(
              ({ app }) => app?.feePaymentStatus === "Menunggu Verifikasi" && getDecision(app?.id, app?.feePaymentStatus) === "pending"
            ).length;
            const verifiedCount = shortlistedApps.filter(
              ({ app }) => getDecision(app?.id, app?.feePaymentStatus) === "approved"
            ).length;

            return (
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-ptba-navy" />
                    <span className="text-sm font-bold text-ptba-charcoal">Verifikasi Pembayaran Fase 2</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-amber-600 font-semibold">{pendingCount} Menunggu</span>
                    <span className="text-green-600 font-semibold">{verifiedCount} Terverifikasi</span>
                    <span className="text-ptba-gray">Biaya: <span className="font-bold text-ptba-navy">{formatCurrency(project.registrationFee ?? 0)}</span></span>
                  </div>
                </div>

                {shortlistedApps.map(({ partner, app, pid }) => {
                  const decision = getDecision(app?.id, app?.feePaymentStatus);
                  const hasPendingPayment = app?.feePaymentStatus === "Menunggu Verifikasi" && decision === "pending";

                  return (
                    <div
                      key={pid}
                      className={cn(
                        "rounded-xl border-2 p-5 transition-colors",
                        decision === "approved" ? "border-green-200 bg-green-50/30" :
                        hasPendingPayment ? "border-amber-300 bg-amber-50/30" :
                        "border-ptba-light-gray bg-white"
                      )}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 min-w-0">
                          <div className={cn(
                            "flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white",
                            decision === "approved" ? "bg-green-500" :
                            hasPendingPayment ? "bg-amber-500" :
                            "bg-ptba-navy"
                          )}>
                            {(partner?.name ?? pid).charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-ptba-charcoal truncate">{partner?.name ?? pid}</p>
                            <p className="text-xs text-ptba-gray">{partner?.code ?? pid}</p>
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-medium text-green-700">
                                <CheckCircle2 className="h-3 w-3" /> Lolos Fase 1
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          {decision === "approved" ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 border border-green-200 px-3 py-1 text-xs font-semibold text-green-700">
                              <CheckCircle2 className="h-3.5 w-3.5" /> Terverifikasi
                            </span>
                          ) : decision === "rejected" ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 border border-red-200 px-3 py-1 text-xs font-semibold text-red-600">
                              <XCircle className="h-3.5 w-3.5" /> Ditolak
                            </span>
                          ) : hasPendingPayment ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 border border-amber-200 px-3 py-1 text-xs font-semibold text-amber-700">
                              <Clock className="h-3.5 w-3.5" /> Menunggu Verifikasi
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-ptba-gray">
                              Belum Bayar
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Payment action area */}
                      {hasPendingPayment && isAdmin && (
                        <div className="mt-4 pt-4 border-t border-amber-200/50">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-ptba-gray" />
                              <div>
                                <p className="text-sm font-medium text-ptba-charcoal">{app?.feePaymentProof}</p>
                                <p className="text-[10px] text-ptba-gray">Diunggah: {app?.feePaymentDate ? formatDate(app.feePaymentDate) : '-'}</p>
                              </div>
                            </div>
                            <button
                              onClick={() => setViewingPayProof(viewingPayProof === pid ? null : pid)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-ptba-light-gray px-3 py-1.5 text-xs font-medium text-ptba-navy hover:bg-ptba-section-bg transition-colors"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              Lihat Bukti
                            </button>
                          </div>

                          {viewingPayProof === pid && (
                            <div className="mb-3 rounded-lg border border-ptba-light-gray bg-ptba-section-bg p-6 text-center">
                              <div className="mx-auto h-32 w-56 rounded-lg bg-white border border-ptba-light-gray flex items-center justify-center">
                                <div className="text-center">
                                  <FileText className="mx-auto h-6 w-6 text-ptba-gray mb-1" />
                                  <p className="text-[10px] text-ptba-gray">{app?.feePaymentProof}</p>
                                  <p className="text-xs font-bold text-ptba-navy mt-1">{formatCurrency(project.registrationFee ?? 0)}</p>
                                </div>
                              </div>
                            </div>
                          )}

                          {showPayRejectForm === pid ? (
                            <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                              <p className="text-xs font-semibold text-red-800 mb-2">Alasan Penolakan</p>
                              <textarea
                                value={payRejectNotes[pid] ?? ""}
                                onChange={(e) => setPayRejectNotes((prev) => ({ ...prev, [pid]: e.target.value }))}
                                placeholder="Jelaskan alasan penolakan..."
                                className="w-full rounded-lg border border-red-200 px-3 py-2 text-sm text-ptba-charcoal placeholder:text-red-300 focus:border-red-400 focus:outline-none focus:ring-1 focus:ring-red-400 mb-2"
                                rows={2}
                              />
                              <div className="flex gap-2">
                                <button onClick={() => setShowPayRejectForm(null)} className="rounded-lg border border-ptba-light-gray px-3 py-1.5 text-xs text-ptba-gray hover:bg-white transition-colors">Batal</button>
                                <button
                                  onClick={() => { if (app?.id) setPaymentDecisions((prev) => ({ ...prev, [app.id]: "rejected" })); setShowPayRejectForm(null); }}
                                  className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 transition-colors"
                                >Konfirmasi Tolak</button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex gap-3">
                              <button
                                onClick={() => { if (app?.id) setPaymentDecisions((prev) => ({ ...prev, [app.id]: "approved" })); }}
                                className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 transition-colors"
                              >
                                <ThumbsUp className="h-4 w-4" /> Verifikasi Pembayaran
                              </button>
                              <button
                                onClick={() => setShowPayRejectForm(pid)}
                                className="inline-flex items-center gap-2 rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 transition-colors"
                              >
                                <ThumbsDown className="h-4 w-4" /> Tolak
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {decision === "approved" && (
                        <div className="mt-3 pt-3 border-t border-green-200/50 flex items-center gap-2 text-sm text-green-700">
                          <CheckCircle2 className="h-4 w-4" />
                          Pembayaran terverifikasi — mitra dapat melanjutkan Fase 2
                        </div>
                      )}

                      {decision === "rejected" && (
                        <div className="mt-3 pt-3 border-t border-red-200/50 flex items-start gap-2 text-sm text-red-700">
                          <XCircle className="h-4 w-4 mt-0.5 shrink-0" />
                          <div>
                            <p>Bukti pembayaran ditolak</p>
                            {payRejectNotes[pid] && <p className="text-xs text-red-600 mt-0.5">{payRejectNotes[pid]}</p>}
                          </div>
                        </div>
                      )}

                      {(!app?.feePaymentStatus || app.feePaymentStatus === "Belum Bayar") && decision === "pending" && (
                        <div className="mt-3 pt-3 border-t border-ptba-light-gray/50 flex items-center gap-2 text-sm text-ptba-gray">
                          <Clock className="h-4 w-4" />
                          Mitra belum melakukan pembayaran
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })()}

          {/* Phase 2 View: Full evaluation matrix */}
          {(isPhase2 || (!isPhase1 && !isPhase2)) && (
            <div className="overflow-x-auto">
              <div className="mb-4 flex items-center gap-2 rounded-lg bg-ptba-steel-blue/5 border border-ptba-steel-blue/20 px-4 py-2.5">
                <BarChart3 className="h-4 w-4 text-ptba-steel-blue" />
                <span className="text-sm font-medium text-ptba-steel-blue">Phase 2: Evaluasi Multi-Divisi</span>
                <span className="text-xs text-ptba-gray ml-1">— Hanya mitra shortlisted yang ditampilkan</span>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-ptba-light-gray text-left">
                    <th className="pb-3 pr-4 font-semibold text-ptba-gray">Mitra</th>
                    <th className="pb-3 pr-4 font-semibold text-ptba-gray">Kelengkapan Dok</th>
                    <th className="pb-3 pr-4 font-semibold text-ptba-gray text-center">Teknis</th>
                    <th className="pb-3 pr-4 font-semibold text-ptba-gray text-center">Keuangan</th>
                    <th className="pb-3 pr-4 font-semibold text-ptba-gray text-center">Hukum</th>
                    <th className="pb-3 pr-4 font-semibold text-ptba-gray text-center">Risiko</th>
                    <th className="pb-3 font-semibold text-ptba-gray">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {projectPartners
                    .filter((p) => !isPhase2 || p.isShortlisted)
                    .map((partner) => {
                      const evalDone =
                        role === "keuangan" ? partner.hasFinancialEval :
                        role === "hukum" ? partner.hasLegalEval :
                        role === "risiko" ? partner.hasRiskEval :
                        partner.hasTechnicalEval;

                      return (
                        <tr key={partner.id} className="border-b border-ptba-light-gray/50 last:border-b-0">
                          <td className="py-3 pr-4">
                            <div className="font-medium text-ptba-charcoal">{partner.name}</div>
                            <div className="text-xs text-ptba-gray">{partner.code}</div>
                            {partner.isShortlisted && (
                              <span className="inline-flex items-center gap-1 mt-1 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700">
                                <CheckCircle2 className="h-2.5 w-2.5" /> Shortlisted
                              </span>
                            )}
                          </td>
                          <td className="py-3 pr-4">
                            <div className="flex items-center gap-2">
                              <div className="h-1.5 w-20 overflow-hidden rounded-full bg-ptba-light-gray">
                                <div
                                  className={cn(
                                    "h-full rounded-full",
                                    partner.docPct === 100 ? "bg-green-500" :
                                    partner.docPct >= 70 ? "bg-ptba-steel-blue" : "bg-ptba-gold"
                                  )}
                                  style={{ width: `${partner.docPct}%` }}
                                />
                              </div>
                              <span className="text-xs text-ptba-gray">{partner.docPct}%</span>
                            </div>
                          </td>
                          <td className="py-3 pr-4 text-center"><EvalStatusCell done={partner.hasTechnicalEval} /></td>
                          <td className="py-3 pr-4 text-center"><EvalStatusCell done={partner.hasFinancialEval} /></td>
                          <td className="py-3 pr-4 text-center"><EvalStatusCell done={partner.hasLegalEval} /></td>
                          <td className="py-3 pr-4 text-center"><EvalStatusCell done={partner.hasRiskEval} /></td>
                          <td className="py-3">
                            <EvalActionButton partnerId={partner.id} evalDone={!!evalDone} />
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}

          {projectPartners.length === 0 && (
            <p className="py-8 text-center text-sm text-ptba-gray">
              Belum ada mitra yang berpartisipasi dalam proyek ini.
            </p>
          )}
        </div>
      )}

      {/* Tab B: Dokumen */}
      {activeTab === "dokumen" && (
        <div className="space-y-4">
          {projectPartners.map((partner) => (
            <div key={partner.id} className="rounded-xl bg-white p-5 shadow-sm">
              <h3 className="mb-4 font-semibold text-ptba-charcoal">
                {partner.name}
                <span className="ml-2 text-sm font-normal text-ptba-gray">
                  ({partner.docComplete}/{partner.docTotal} dokumen lengkap)
                </span>
                {partner.isShortlisted && (
                  <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700">
                    Shortlisted
                  </span>
                )}
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-ptba-light-gray text-left">
                      <th className="pb-2 pr-4 font-semibold text-ptba-gray">Dokumen</th>
                      <th className="pb-2 pr-4 font-semibold text-ptba-gray">Tipe</th>
                      <th className="pb-2 pr-4 font-semibold text-ptba-gray">Status</th>
                      <th className="pb-2 font-semibold text-ptba-gray">Tanggal Upload</th>
                    </tr>
                  </thead>
                  <tbody>
                    {partner.documents.map((doc) => (
                      <tr key={doc.id} className="border-b border-ptba-light-gray/50 last:border-b-0">
                        <td className="py-2 pr-4 font-medium text-ptba-charcoal">{doc.name}</td>
                        <td className="py-2 pr-4 text-ptba-gray text-xs">{doc.type}</td>
                        <td className="py-2 pr-4">
                          <span className={cn(
                            "inline-block rounded-full px-2 py-0.5 text-xs font-medium",
                            doc.status === "Lengkap" && "bg-green-100 text-green-700",
                            doc.status === "Pending" && "bg-amber-100 text-amber-700",
                            doc.status === "Ditolak" && "bg-red-100 text-red-700",
                            doc.status === "Belum Upload" && "bg-gray-100 text-gray-500"
                          )}>
                            {doc.status}
                          </span>
                        </td>
                        <td className="py-2 text-ptba-gray text-xs">{doc.uploadDate ? formatDate(doc.uploadDate) : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab C: Informasi */}
      {activeTab === "informasi" && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="rounded-xl bg-white p-6 shadow-sm md:col-span-2">
            <h3 className="mb-3 font-semibold text-ptba-charcoal">Deskripsi Proyek</h3>
            <p className="text-sm leading-relaxed text-ptba-gray">{project.description}</p>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h3 className="mb-4 font-semibold text-ptba-charcoal">Informasi Umum</h3>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-ptba-gray">ID Proyek</dt>
                <dd className="font-medium text-ptba-charcoal">{project.id}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ptba-gray">Tipe</dt>
                <dd><span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", typeBadgeClass(project.type))}>{project.type}</span></dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ptba-gray">Status</dt>
                <dd><span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", statusBadgeClass(project.status))}>{project.status}</span></dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ptba-gray">Phase</dt>
                <dd className="font-medium text-ptba-steel-blue text-xs">{phaseLabel(project.phase)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ptba-gray">Nilai CAPEX</dt>
                <dd className="font-bold text-ptba-navy">{formatCurrency(project.capexValue)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ptba-gray">Jumlah Mitra</dt>
                <dd className="font-medium text-ptba-charcoal">{project.partners.length} mitra</dd>
              </div>
              {project.shortlistedPartners && (
                <div className="flex justify-between">
                  <dt className="text-ptba-gray">Mitra Shortlisted</dt>
                  <dd className="font-medium text-green-600">{project.shortlistedPartners.length} mitra</dd>
                </div>
              )}
            </dl>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h3 className="mb-4 font-semibold text-ptba-charcoal">Timeline</h3>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-ptba-gray">Tanggal Mulai</dt>
                <dd className="font-medium text-ptba-charcoal">{formatDate(project.startDate)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ptba-gray">Tanggal Selesai</dt>
                <dd className="font-medium text-ptba-charcoal">{formatDate(project.endDate)}</dd>
              </div>
              {project.phase1Deadline && (
                <div className="flex justify-between">
                  <dt className="text-ptba-gray">Deadline Phase 1</dt>
                  <dd className="font-medium text-ptba-steel-blue">{formatDate(project.phase1Deadline)}</dd>
                </div>
              )}
              {project.phase2Deadline && (
                <div className="flex justify-between">
                  <dt className="text-ptba-gray">Deadline Phase 2</dt>
                  <dd className="font-medium text-ptba-navy">{formatDate(project.phase2Deadline)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-ptba-gray">Progres Langkah</dt>
                <dd className="font-medium text-ptba-charcoal">{project.currentStep}/{project.totalSteps}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ptba-gray">Langkah Saat Ini</dt>
                <dd className="font-medium text-ptba-charcoal">{PROJECT_STEPS[project.currentStep - 1]?.name ?? "-"}</dd>
              </div>
            </dl>
          </div>
        </div>
      )}

      {/* Persetujuan Modal */}
      {showPersetujuanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
            <div className="border-b border-ptba-light-gray px-6 py-4">
              <h2 className="text-lg font-bold text-ptba-charcoal">Ajukan Persetujuan ke Direksi</h2>
              <p className="text-sm text-ptba-gray">Pilih mitra yang direkomendasikan untuk proyek {project.name}</p>
            </div>
            <div className="max-h-[400px] overflow-y-auto px-6 py-4">
              <div className="space-y-3">
                {partnerScores.map((partner, index) => {
                  const isSelected = selectedMitra.includes(partner.id);
                  return (
                    <label
                      key={partner.id}
                      className={cn(
                        "flex items-start gap-4 rounded-xl border-2 p-4 cursor-pointer transition-all",
                        isSelected ? "border-ptba-gold bg-ptba-gold/5" : "border-ptba-light-gray hover:border-ptba-steel-blue/30"
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleMitraSelection(partner.id)}
                        className="mt-1 h-4 w-4 rounded border-ptba-light-gray text-ptba-gold focus:ring-ptba-gold/20"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold",
                              index === 0 ? "bg-ptba-gold/20 text-ptba-gold" :
                              index === 1 ? "bg-gray-200 text-gray-600" : "bg-ptba-light-gray text-ptba-gray"
                            )}>
                              {index + 1}
                            </span>
                            <div>
                              <p className="font-semibold text-ptba-charcoal">{partner.name}</p>
                              <p className="text-xs text-ptba-gray">{partner.code}</p>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-lg font-bold text-ptba-navy">{partner.totalScore.toFixed(1)}</p>
                            <span className={cn(
                              "inline-block rounded-full px-2 py-0.5 text-[10px] font-bold",
                              partner.grade === "A" ? "bg-green-100 text-green-700" :
                              partner.grade === "B" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"
                            )}>
                              Grade {partner.grade}
                            </span>
                          </div>
                        </div>
                        <div className="mt-2 grid grid-cols-4 gap-2">
                          <div className="rounded-lg bg-ptba-off-white px-2 py-1.5 text-center">
                            <p className="text-[10px] text-ptba-gray">Teknis</p>
                            <p className="text-xs font-semibold text-ptba-charcoal">{partner.technicalScore.toFixed(1)}/5</p>
                          </div>
                          <div className="rounded-lg bg-ptba-off-white px-2 py-1.5 text-center">
                            <p className="text-[10px] text-ptba-gray">Keuangan</p>
                            <p className="text-xs font-semibold text-ptba-charcoal">{partner.financialScore.toFixed(1)}</p>
                          </div>
                          <div className="rounded-lg bg-ptba-off-white px-2 py-1.5 text-center">
                            <p className="text-[10px] text-ptba-gray">Hukum</p>
                            <p className={cn("text-xs font-semibold",
                              partner.legalStatus === "Lulus" ? "text-green-600" :
                              partner.legalStatus === "Bersyarat" ? "text-amber-600" : "text-red-600"
                            )}>{partner.legalStatus}</p>
                          </div>
                          <div className="rounded-lg bg-ptba-off-white px-2 py-1.5 text-center">
                            <p className="text-[10px] text-ptba-gray">Risiko</p>
                            <p className={cn("text-xs font-semibold",
                              partner.riskLevel === "Rendah" ? "text-green-600" :
                              partner.riskLevel === "Sedang" ? "text-amber-600" : "text-red-600"
                            )}>{partner.riskLevel}</p>
                          </div>
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
              <div className="mt-4">
                <label className="mb-1 block text-sm font-medium text-ptba-charcoal">Catatan untuk Direksi (opsional)</label>
                <textarea
                  placeholder="Tambahkan catatan atau justifikasi rekomendasi..."
                  value={persetujuanNotes}
                  onChange={(e) => setPersetujuanNotes(e.target.value)}
                  className="w-full rounded-lg border border-ptba-light-gray bg-ptba-off-white px-3 py-2.5 text-sm outline-none focus:border-ptba-steel-blue focus:ring-2 focus:ring-ptba-steel-blue/20 min-h-[80px] resize-y"
                />
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-ptba-light-gray px-6 py-4">
              <p className="text-sm text-ptba-gray">
                {selectedMitra.length > 0 ? `${selectedMitra.length} mitra dipilih` : "Belum ada mitra dipilih"}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => { setShowPersetujuanModal(false); setSelectedMitra([]); setPersetujuanNotes(""); }}
                  className="rounded-lg border border-ptba-navy px-4 py-2 text-sm font-medium text-ptba-navy hover:bg-ptba-navy/5 transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleSubmitPersetujuan}
                  disabled={selectedMitra.length === 0}
                  className="rounded-lg bg-ptba-gold px-4 py-2 text-sm font-bold text-ptba-charcoal shadow-sm hover:bg-ptba-gold-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="flex items-center gap-2">
                    <Send className="h-4 w-4" />
                    Ajukan ke Direksi
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
