"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  BarChart3,
  CheckCircle2,
  Clock,
  AlertCircle,
  ExternalLink,
  FileText,
  Download,
  ShieldCheck,
  CreditCard,
  Building2,
  Eye,
  ThumbsUp,
  ThumbsDown,
  XCircle,
  Rocket,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { formatDate, formatCurrency } from "@/lib/utils/format";
import { mockProjects } from "@/lib/mock-data/projects";
import { mockPartners } from "@/lib/mock-data/partners";
import { mockEvaluations } from "@/lib/mock-data/evaluations";
import { mockApplications } from "@/lib/mock-data/applications";

function EvalStatusPill({ done, label }: { done: boolean; label: string }) {
  if (done) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
        <CheckCircle2 className="h-3 w-3" /> {label}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
      <Clock className="h-3 w-3" /> Pending
    </span>
  );
}

function DocStatusBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
      <CheckCircle2 className="h-3 w-3" /> Terunggah
    </span>
  );
}

export default function EvaluationHubPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ partnerId?: string }>;
}) {
  const { id } = use(params);
  const { partnerId: focusPartnerId } = use(searchParams);
  const router = useRouter();
  const [expandedDocs, setExpandedDocs] = useState<Record<string, boolean>>({});
  // Payment verification state (for phase1_approved view)
  type PaymentDecision = "pending" | "approved" | "rejected";
  const [paymentDecisions, setPaymentDecisions] = useState<Record<string, PaymentDecision>>({});
  const [rejectNotes, setRejectNotes] = useState<Record<string, string>>({});
  const [showRejectForm, setShowRejectForm] = useState<string | null>(null);
  const [viewingProof, setViewingProof] = useState<string | null>(null);

  const toggleDocs = (partnerId: string) => {
    setExpandedDocs((prev) => ({ ...prev, [partnerId]: !prev[partnerId] }));
  };

  const project = mockProjects.find((p) => p.id === id);

  if (!project) {
    return (
      <div className="space-y-4">
        <button onClick={() => router.back()} className="inline-flex items-center gap-1.5 text-sm text-ptba-gray hover:text-ptba-navy">
          <ArrowLeft className="h-4 w-4" /> Kembali
        </button>
        <p className="text-ptba-gray">Proyek tidak ditemukan.</p>
      </div>
    );
  }

  const isPhase1Active = project.phase?.startsWith("phase1") && project.phase !== "phase1_approved";
  const isPhase1Approved = project.phase === "phase1_approved";
  const isPhase1 = isPhase1Active || isPhase1Approved;
  const isPhase2 = project.phase?.startsWith("phase2");

  // Redirect Fase 2 projects to the dedicated hub
  useEffect(() => {
    if (isPhase2) {
      router.replace(`/projects/${id}/evaluation/phase2`);
    }
  }, [isPhase2, id, router]);

  if (isPhase2) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-ptba-gray">Mengarahkan ke Hub Evaluasi Fase 2...</p>
      </div>
    );
  }

  // For Fase 2, only show shortlisted partners
  const partnerIds = isPhase2 && project.shortlistedPartners
    ? project.shortlistedPartners
    : project.partners;

  const projectPartners = partnerIds.map((pid) => {
    const partner = mockPartners.find((p) => p.id === pid);
    const phase2Eval = mockEvaluations.find(
      (e) => e.projectId === project.id && e.partnerId === pid && e.phase === "phase2"
    );
    const phase1Eval = mockEvaluations.find(
      (e) => e.projectId === project.id && e.partnerId === pid && e.phase === "phase1"
    );
    const application = mockApplications.find(
      (a) => a.projectId === project.id && a.partnerId === pid
    );
    return {
      id: pid,
      name: partner?.name ?? pid,
      code: partner?.code ?? pid,
      hasFinancialEval: !!phase2Eval?.financial,
      hasLegalEval: !!phase2Eval?.legal,
      hasRiskEval: !!phase2Eval?.risk,
      hasTechnicalEval: !!phase2Eval?.technical,
      hasEBDEval: !!phase2Eval?.market,
      hasPhase1Eval: !!phase1Eval?.phase1Eval,
      phase1Result: phase1Eval?.phase1Eval?.overallResult,
      financialGrade: phase2Eval?.financial?.grade,
      legalStatus: phase2Eval?.legal?.overallStatus,
      riskLevel: phase2Eval?.risk?.overallLevel,
      evalStatus: phase2Eval?.status,
      totalScore: phase2Eval?.totalScore,
      grade: phase2Eval?.grade,
      documents: application?.documents ?? [],
      applicationStatus: application?.status,
      isShortlisted: project.shortlistedPartners?.includes(pid) ?? false,
      feePaymentStatus: application?.feePaymentStatus,
      feePaymentProof: application?.feePaymentProof,
      feePaymentDate: application?.feePaymentDate,
      applicationId: application?.id,
    };
  });

  const base = `/projects/${id}/evaluation`;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-ptba-gray">
        <Link href="/projects" className="hover:text-ptba-navy">Proyek</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href={`/projects/${id}`} className="hover:text-ptba-navy">{project.name}</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-ptba-charcoal font-medium">Hub Evaluasi</span>
      </nav>

      <button onClick={() => router.back()} className="inline-flex items-center gap-1.5 text-sm text-ptba-gray hover:text-ptba-navy transition-colors">
        <ArrowLeft className="h-4 w-4" /> Kembali ke Proyek
      </button>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ptba-charcoal">Hub Evaluasi</h1>
          <p className="mt-1 text-sm text-ptba-gray">{project.name}</p>
          {project.phase && (
            <span className="mt-1 inline-flex rounded-full bg-ptba-steel-blue/10 px-2.5 py-0.5 text-xs font-semibold text-ptba-steel-blue">
              {isPhase1Approved ? "Fase 1 Disetujui — Verifikasi Pembayaran" : isPhase1Active ? "Fase 1: Evaluasi EBD" : "Fase 2: Evaluasi Komprehensif"}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          {isPhase1Active && (
            <Link
              href={`${base}/phase1`}
              className="inline-flex items-center gap-1.5 rounded-lg bg-ptba-steel-blue/10 px-4 py-2 text-sm font-medium text-ptba-steel-blue hover:bg-ptba-steel-blue/20 transition-colors"
            >
              <ShieldCheck className="h-4 w-4" /> Evaluasi Fase 1
            </Link>
          )}
          {isPhase2 && (
            <Link
              href={`/projects/${id}/ranking`}
              className="inline-flex items-center gap-1.5 rounded-lg bg-ptba-gold/10 px-4 py-2 text-sm font-medium text-ptba-gold hover:bg-ptba-gold/20 transition-colors"
            >
              <BarChart3 className="h-4 w-4" /> Lihat Ranking
            </Link>
          )}
        </div>
      </div>

      {/* Fase 1 Active: EBD-only evaluation cards */}
      {isPhase1Active && (
        <div className="space-y-4">
          {projectPartners.map((partner) => {
            const isFocused = focusPartnerId === partner.id;
            return (
              <div
                key={partner.id}
                className={cn(
                  "rounded-xl bg-white p-5 shadow-sm transition-shadow hover:shadow-md",
                  isFocused && "ring-2 ring-ptba-navy"
                )}
              >
                <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="font-semibold text-ptba-charcoal">{partner.name}</h3>
                    <p className="text-xs text-ptba-gray">{partner.code}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {partner.hasPhase1Eval ? (
                      <span className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium",
                        partner.phase1Result === "Lolos"
                          ? "bg-green-100 text-green-700"
                          : partner.phase1Result === "Tidak Lolos"
                          ? "bg-red-100 text-red-600"
                          : "bg-amber-100 text-amber-700"
                      )}>
                        {partner.phase1Result === "Lolos" && <CheckCircle2 className="h-3 w-3" />}
                        {partner.phase1Result ?? "Pending"}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700">
                        <AlertCircle className="h-3 w-3" /> Belum Dievaluasi
                      </span>
                    )}
                  </div>
                </div>

                {/* Single EBD evaluation card */}
                <div className="grid grid-cols-1">
                  <div className="rounded-lg border border-ptba-navy/20 bg-ptba-navy/5 p-3">
                    <p className="mb-2 text-xs font-semibold text-ptba-navy">Evaluasi EBD (Fase 1)</p>
                    <EvalStatusPill done={partner.hasPhase1Eval} label={partner.phase1Result ?? "Selesai"} />
                    {partner.hasPhase1Eval ? (
                      <Link
                        href={`${base}/phase1`}
                        className="mt-2 flex items-center gap-1 text-xs text-ptba-steel-blue hover:underline"
                      >
                        <ExternalLink className="h-3 w-3" /> Lihat Hasil
                      </Link>
                    ) : (
                      <Link
                        href={`${base}/phase1`}
                        className="mt-2 flex items-center gap-1 text-xs text-ptba-navy hover:underline font-medium"
                      >
                        Mulai Evaluasi →
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Fase 1 Approved: Payment Verification View */}
      {isPhase1Approved && (() => {
        const shortlistedIds = project.shortlistedPartners ?? [];
        const shortlistedApps = shortlistedIds.map((pid) => {
          const partner = mockPartners.find((p) => p.id === pid);
          const app = mockApplications.find((a) => a.projectId === id && a.partnerId === pid);
          return { partner, app, pid };
        });

        // Initialize payment decisions from mock data
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
            {/* Payment verification header */}
            <div className="rounded-xl border border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <CreditCard className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                  <div>
                    <h3 className="text-sm font-bold text-green-800">Verifikasi Pembayaran Mitra</h3>
                    <p className="text-xs text-green-700 mt-0.5">
                      Fase 1 telah disetujui Direksi. Verifikasi bukti pembayaran dari {shortlistedApps.length} mitra shortlist sebelum memulai Fase 2.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm shrink-0">
                  <div className="text-center">
                    <p className="text-xl font-bold text-amber-600">{pendingCount}</p>
                    <p className="text-[10px] text-ptba-gray">Menunggu</p>
                  </div>
                  <div className="h-6 w-px bg-green-300" />
                  <div className="text-center">
                    <p className="text-xl font-bold text-green-600">{verifiedCount}</p>
                    <p className="text-[10px] text-ptba-gray">Terverifikasi</p>
                  </div>
                  <div className="h-6 w-px bg-green-300" />
                  <div className="text-center">
                    <p className="text-xs text-ptba-gray">Biaya</p>
                    <p className="text-sm font-bold text-ptba-navy">{formatCurrency(project.registrationFee ?? 0)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Partner payment cards */}
            {shortlistedApps.map(({ partner, app, pid }) => {
              const decision = getDecision(app?.id, app?.feePaymentStatus);
              const hasPendingPayment = app?.feePaymentStatus === "Menunggu Verifikasi" && decision === "pending";

              return (
                <div
                  key={pid}
                  className={cn(
                    "rounded-xl bg-white shadow-sm overflow-hidden",
                    hasPendingPayment && "ring-1 ring-amber-300"
                  )}
                >
                  {/* Partner header */}
                  <div className={cn(
                    "px-6 py-4 flex items-center justify-between",
                    hasPendingPayment ? "bg-amber-50 border-b border-amber-200" : "border-b border-ptba-light-gray"
                  )}>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-ptba-section-bg">
                        <Building2 className="h-5 w-5 text-ptba-navy" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-ptba-charcoal">{partner?.name ?? pid}</p>
                        <p className="text-[10px] text-ptba-gray">{partner?.code ?? pid}</p>
                      </div>
                    </div>
                    {decision === "approved" ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700">
                        <CheckCircle2 className="h-3 w-3" /> Terverifikasi
                      </span>
                    ) : decision === "rejected" ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700">
                        <XCircle className="h-3 w-3" /> Ditolak
                      </span>
                    ) : app?.feePaymentStatus === "Menunggu Verifikasi" ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700">
                        <Clock className="h-3 w-3" /> Menunggu Verifikasi
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-500">
                        <AlertCircle className="h-3 w-3" /> Belum Bayar
                      </span>
                    )}
                  </div>

                  {/* Payment details */}
                  <div className="px-6 py-4">
                    {(!app?.feePaymentStatus || app.feePaymentStatus === "Belum Bayar") && decision === "pending" && (
                      <div className="flex items-center gap-2 text-sm text-ptba-gray">
                        <AlertCircle className="h-4 w-4" />
                        Mitra belum melakukan pembayaran
                      </div>
                    )}

                    {app?.feePaymentStatus === "Menunggu Verifikasi" && decision === "pending" && (
                      <>
                        {/* Proof info */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <FileText className="h-5 w-5 text-ptba-gray" />
                            <div>
                              <p className="text-sm font-medium text-ptba-charcoal">{app.feePaymentProof}</p>
                              <p className="text-[10px] text-ptba-gray">
                                Diunggah: {app.feePaymentDate ? formatDate(app.feePaymentDate) : '-'}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => setViewingProof(viewingProof === pid ? null : pid)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-ptba-light-gray px-3 py-1.5 text-xs font-medium text-ptba-navy hover:bg-ptba-section-bg transition-colors"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            Lihat Bukti
                          </button>
                        </div>

                        {/* Proof preview (mock) */}
                        {viewingProof === pid && (
                          <div className="mb-4 rounded-lg border border-ptba-light-gray bg-ptba-section-bg p-6 text-center">
                            <div className="mx-auto h-40 w-64 rounded-lg bg-white border border-ptba-light-gray flex items-center justify-center">
                              <div className="text-center">
                                <FileText className="mx-auto h-8 w-8 text-ptba-gray mb-2" />
                                <p className="text-xs text-ptba-gray">Preview Bukti Transfer</p>
                                <p className="text-[10px] text-ptba-gray mt-1">{app.feePaymentProof}</p>
                                <p className="text-xs font-bold text-ptba-navy mt-2">{formatCurrency(project.registrationFee ?? 0)}</p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Reject form */}
                        {showRejectForm === pid && (
                          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4">
                            <p className="text-xs font-semibold text-red-800 mb-2">Alasan Penolakan</p>
                            <textarea
                              value={rejectNotes[pid] ?? ""}
                              onChange={(e) => setRejectNotes((prev) => ({ ...prev, [pid]: e.target.value }))}
                              placeholder="Jelaskan alasan penolakan bukti pembayaran..."
                              className="w-full rounded-lg border border-red-200 px-3 py-2 text-sm text-ptba-charcoal placeholder:text-red-300 focus:border-red-400 focus:outline-none focus:ring-1 focus:ring-red-400 mb-3"
                              rows={2}
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => setShowRejectForm(null)}
                                className="rounded-lg border border-ptba-light-gray px-3 py-1.5 text-xs font-medium text-ptba-gray hover:bg-white transition-colors"
                              >
                                Batal
                              </button>
                              <button
                                onClick={() => {
                                  if (app?.id) setPaymentDecisions((prev) => ({ ...prev, [app.id]: "rejected" }));
                                  setShowRejectForm(null);
                                }}
                                className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 transition-colors"
                              >
                                Konfirmasi Tolak
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Action buttons */}
                        {showRejectForm !== pid && (
                          <div className="flex gap-3">
                            <button
                              onClick={() => {
                                if (app?.id) setPaymentDecisions((prev) => ({ ...prev, [app.id]: "approved" }));
                              }}
                              className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 transition-colors"
                            >
                              <ThumbsUp className="h-4 w-4" />
                              Verifikasi Pembayaran
                            </button>
                            <button
                              onClick={() => setShowRejectForm(pid)}
                              className="inline-flex items-center gap-2 rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 transition-colors"
                            >
                              <ThumbsDown className="h-4 w-4" />
                              Tolak
                            </button>
                          </div>
                        )}
                      </>
                    )}

                    {decision === "approved" && (
                      <div className="flex items-center gap-2 text-sm text-green-700">
                        <CheckCircle2 className="h-4 w-4" />
                        Pembayaran telah diverifikasi — mitra dapat melanjutkan proses Fase 2
                      </div>
                    )}

                    {decision === "rejected" && (
                      <div className="flex items-start gap-2 text-sm text-red-700">
                        <XCircle className="h-4 w-4 mt-0.5 shrink-0" />
                        <div>
                          <p>Bukti pembayaran ditolak</p>
                          {rejectNotes[pid] && (
                            <p className="text-xs text-red-600 mt-0.5">Catatan: {rejectNotes[pid]}</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Mulai Fase 2 CTA */}
            {verifiedCount > 0 && (
              <div className="rounded-xl border border-ptba-navy/20 bg-ptba-navy/5 p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-ptba-navy">{verifiedCount} dari {shortlistedApps.length} mitra telah membayar</h3>
                    <p className="text-xs text-ptba-gray mt-0.5">
                      Mitra yang telah terverifikasi dapat memulai proses Fase 2.
                    </p>
                  </div>
                  <Link
                    href={`/projects/${id}`}
                    className="inline-flex items-center gap-2 rounded-lg bg-ptba-navy px-5 py-2.5 text-sm font-semibold text-white hover:bg-ptba-steel-blue transition-colors shrink-0"
                  >
                    <Rocket className="h-4 w-4" />
                    Konfigurasi & Mulai Fase 2
                  </Link>
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* Fase 2: Full 5-division evaluation cards (shortlisted mitra only) */}
      {(isPhase2 || (!isPhase1 && !isPhase2)) && (
        <div className="space-y-4">
          {projectPartners.map((partner) => {
            const isFocused = focusPartnerId === partner.id;
            const allDone = partner.hasFinancialEval && partner.hasLegalEval && partner.hasRiskEval && partner.hasTechnicalEval;

            return (
              <div
                key={partner.id}
                className={cn(
                  "rounded-xl bg-white p-5 shadow-sm transition-shadow hover:shadow-md",
                  isFocused && "ring-2 ring-ptba-navy"
                )}
              >
                <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="font-semibold text-ptba-charcoal">{partner.name}</h3>
                    <p className="text-xs text-ptba-gray">{partner.code}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {partner.isShortlisted && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700">
                        <CheckCircle2 className="h-2.5 w-2.5" /> Shortlisted
                      </span>
                    )}
                    {allDone ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700">
                        <CheckCircle2 className="h-3 w-3" /> Semua Selesai
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700">
                        <AlertCircle className="h-3 w-3" /> Belum Lengkap
                      </span>
                    )}
                    {partner.grade && (
                      <span className="rounded-lg bg-ptba-navy/10 px-2.5 py-1 text-xs font-bold text-ptba-navy">Grade: {partner.grade}</span>
                    )}
                    {partner.totalScore != null && partner.totalScore > 0 && (
                      <span className="text-xs text-ptba-gray">Skor: {partner.totalScore.toFixed(1)}</span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                  {/* Technical */}
                  <div className="rounded-lg border border-ptba-light-gray p-3">
                    <p className="mb-2 text-xs font-semibold text-ptba-gray">Teknis & Pasar</p>
                    <EvalStatusPill done={partner.hasTechnicalEval} label="Selesai" />
                    <Link
                      href={`${base}/market?partnerId=${partner.id}`}
                      className={cn("mt-2 flex items-center gap-1 text-xs hover:underline",
                        partner.hasTechnicalEval ? "text-ptba-steel-blue" : "text-ptba-navy font-medium"
                      )}
                    >
                      {partner.hasTechnicalEval ? <><ExternalLink className="h-3 w-3" /> Lihat</> : "Mulai Evaluasi →"}
                    </Link>
                  </div>

                  {/* Financial */}
                  <div className="rounded-lg border border-ptba-light-gray p-3">
                    <p className="mb-2 text-xs font-semibold text-ptba-gray">Keuangan</p>
                    <EvalStatusPill done={partner.hasFinancialEval} label={partner.financialGrade ?? "Selesai"} />
                    <Link
                      href={`${base}/financial?partnerId=${partner.id}`}
                      className={cn("mt-2 flex items-center gap-1 text-xs hover:underline",
                        partner.hasFinancialEval ? "text-ptba-steel-blue" : "text-ptba-navy font-medium"
                      )}
                    >
                      {partner.hasFinancialEval ? <><ExternalLink className="h-3 w-3" /> Lihat</> : "Mulai Evaluasi →"}
                    </Link>
                  </div>

                  {/* Legal */}
                  <div className="rounded-lg border border-ptba-light-gray p-3">
                    <p className="mb-2 text-xs font-semibold text-ptba-gray">Hukum</p>
                    <EvalStatusPill done={partner.hasLegalEval} label={partner.legalStatus ?? "Selesai"} />
                    <Link
                      href={`${base}/legal?partnerId=${partner.id}`}
                      className={cn("mt-2 flex items-center gap-1 text-xs hover:underline",
                        partner.hasLegalEval ? "text-ptba-steel-blue" : "text-ptba-navy font-medium"
                      )}
                    >
                      {partner.hasLegalEval ? <><ExternalLink className="h-3 w-3" /> Lihat</> : "Mulai Evaluasi →"}
                    </Link>
                  </div>

                  {/* Risk */}
                  <div className="rounded-lg border border-ptba-light-gray p-3">
                    <p className="mb-2 text-xs font-semibold text-ptba-gray">Risiko</p>
                    <EvalStatusPill done={partner.hasRiskEval} label={partner.riskLevel ?? "Selesai"} />
                    <Link
                      href={`${base}/risk?partnerId=${partner.id}`}
                      className={cn("mt-2 flex items-center gap-1 text-xs hover:underline",
                        partner.hasRiskEval ? "text-ptba-steel-blue" : "text-ptba-navy font-medium"
                      )}
                    >
                      {partner.hasRiskEval ? <><ExternalLink className="h-3 w-3" /> Lihat</> : "Mulai Evaluasi →"}
                    </Link>
                  </div>

                  {/* EBD */}
                  <div className="rounded-lg border border-ptba-navy/20 bg-ptba-navy/5 p-3">
                    <p className="mb-2 text-xs font-semibold text-ptba-navy">EBD</p>
                    <EvalStatusPill done={partner.hasEBDEval} label="Selesai" />
                    <Link
                      href={`${base}/ebd?partnerId=${partner.id}`}
                      className={cn("mt-2 flex items-center gap-1 text-xs hover:underline",
                        partner.hasEBDEval ? "text-ptba-steel-blue" : "text-ptba-navy font-medium"
                      )}
                    >
                      {partner.hasEBDEval ? <><ExternalLink className="h-3 w-3" /> Lihat</> : "Mulai Evaluasi →"}
                    </Link>
                  </div>
                </div>

                {/* Dokumen Mitra Section */}
                {partner.documents.length > 0 && (
                  <div className="mt-4 border-t border-ptba-light-gray pt-4">
                    <button onClick={() => toggleDocs(partner.id)} className="flex w-full items-center justify-between text-left">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-ptba-steel-blue" />
                        <span className="text-sm font-semibold text-ptba-charcoal">Dokumen Mitra</span>
                        <span className="rounded-full bg-ptba-section-bg px-2 py-0.5 text-xs text-ptba-gray">{partner.documents.length} terunggah</span>
                      </div>
                      {expandedDocs[partner.id] ? <ChevronUp className="h-4 w-4 text-ptba-gray" /> : <ChevronDown className="h-4 w-4 text-ptba-gray" />}
                    </button>
                    {expandedDocs[partner.id] && (
                      <div className="mt-3 overflow-x-auto rounded-lg border border-ptba-light-gray">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-ptba-section-bg">
                              <th className="px-3 py-2 text-left text-xs font-medium text-ptba-gray">No</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-ptba-gray">Dokumen</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-ptba-gray">Tanggal Upload</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-ptba-gray">Status</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-ptba-gray">Aksi</th>
                            </tr>
                          </thead>
                          <tbody>
                            {partner.documents.map((doc, docIdx) => (
                              <tr key={doc.id} className={docIdx % 2 === 0 ? "bg-white" : "bg-ptba-off-white"}>
                                <td className="px-3 py-2 text-xs text-ptba-gray">{docIdx + 1}</td>
                                <td className="px-3 py-2">
                                  <div className="flex items-center gap-2">
                                    <FileText className="h-3.5 w-3.5 text-ptba-steel-blue flex-shrink-0" />
                                    <span className="text-xs font-medium text-ptba-charcoal">{doc.name}</span>
                                  </div>
                                </td>
                                <td className="px-3 py-2 text-xs text-ptba-gray">{formatDate(doc.uploadDate)}</td>
                                <td className="px-3 py-2"><DocStatusBadge /></td>
                                <td className="px-3 py-2">
                                  <button
                                    onClick={() => alert(`Mengunduh: ${doc.name}`)}
                                    className="inline-flex items-center gap-1 text-xs text-ptba-steel-blue hover:underline"
                                  >
                                    <Download className="h-3 w-3" /> Unduh
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {projectPartners.length === 0 && (
        <div className="rounded-xl bg-white p-10 text-center shadow-sm">
          <p className="text-ptba-gray">Belum ada mitra yang terdaftar dalam proyek ini.</p>
        </div>
      )}
    </div>
  );
}
