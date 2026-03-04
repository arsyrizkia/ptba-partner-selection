"use client";

import { use, useState } from "react";
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
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useAuth } from "@/lib/auth/auth-context";
import { mockProjects } from "@/lib/mock-data/projects";
import { mockPartners } from "@/lib/mock-data/partners";
import { mockEvaluations } from "@/lib/mock-data/evaluations";

const STEP_NAMES = [
  "Inisiasi",
  "Identifikasi Kebutuhan",
  "Penyusunan HPS",
  "Kualifikasi Mitra",
  "Dokumen Pengadaan",
  "Penawaran",
  "Evaluasi Teknis",
  "Evaluasi Keuangan",
  "Evaluasi Hukum",
  "Evaluasi Risiko",
  "Negosiasi",
  "Persetujuan",
  "Kontrak",
];

function formatCurrency(value: number): string {
  if (value >= 1_000_000_000_000) {
    return `Rp ${(value / 1_000_000_000_000).toFixed(1)} T`;
  }
  if (value >= 1_000_000_000) {
    return `Rp ${(value / 1_000_000_000).toFixed(1)} M`;
  }
  return `Rp ${(value / 1_000_000).toFixed(0)} Jt`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
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
        <Link
          href="/projects"
          className="inline-flex items-center gap-1.5 text-sm text-ptba-gray hover:text-ptba-navy"
        >
          <ArrowLeft className="h-4 w-4" /> Kembali ke Daftar Proyek
        </Link>
        <p className="text-ptba-gray">Proyek tidak ditemukan.</p>
      </div>
    );
  }

  // Resolve partners for this project
  const projectPartners = project.partners.map((pid) => {
    const partner = mockPartners.find((p) => p.id === pid);
    const evals = mockEvaluations.filter(
      (e) => e.projectId === project.id && e.partnerId === pid
    );
    const eval0 = evals[0];
    const docTotal = partner?.documents.length ?? 0;
    const docComplete =
      partner?.documents.filter((d) => d.status === "Lengkap").length ?? 0;
    const docPct = docTotal > 0 ? Math.round((docComplete / docTotal) * 100) : 0;

    return {
      id: pid,
      name: partner?.name ?? pid,
      code: partner?.code ?? pid,
      docPct,
      docTotal,
      docComplete,
      documents: partner?.documents ?? [],
      hasFinancialEval: !!eval0?.financial,
      hasLegalEval: !!eval0?.legal,
      hasRiskEval: !!eval0?.risk,
      hasTechnicalEval: !!eval0?.technical,
      evalStatus: eval0?.status,
    };
  });

  // Workflow state
  const [showPersetujuanModal, setShowPersetujuanModal] = useState(false);
  const [selectedMitra, setSelectedMitra] = useState<string[]>([]);
  const [persetujuanNotes, setPersetujuanNotes] = useState("");
  const isAdmin = role === "ebd" || role === "super_admin";

  // Check if all evaluations are complete for all partners
  const allEvalsComplete = projectPartners.length > 0 && projectPartners.every(
    (p) => p.hasTechnicalEval && p.hasFinancialEval && p.hasLegalEval && p.hasRiskEval
  );

  // Get evaluation scores for modal
  const partnerScores = projectPartners.map((p) => {
    const eval0 = mockEvaluations.find(
      (e) => e.projectId === project.id && e.partnerId === p.id
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
    alert("Pendaftaran mitra berhasil ditutup.");
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
    const names = selectedMitra
      .map((id) => projectPartners.find((p) => p.id === id)?.name)
      .join(", ");
    alert(`Persetujuan berhasil diajukan ke Direksi.\nMitra direkomendasikan: ${names}`);
    setShowPersetujuanModal(false);
    setSelectedMitra([]);
    setPersetujuanNotes("");
  };

  // Role-based eval link
  function getEvalLink(partnerId: string): string {
    const base = `/projects/${id}/evaluation`;
    if (role === "keuangan") return `${base}/financial?partnerId=${partnerId}`;
    if (role === "hukum") return `${base}/legal?partnerId=${partnerId}`;
    if (role === "risiko") return `${base}/risk?partnerId=${partnerId}`;
    if (role === "ebd") return `${base}/ebd?partnerId=${partnerId}`;
    if (role === "super_admin")
      return `${base}/ebd?partnerId=${partnerId}`;
    return base;
  }

  const canEvaluate = ["keuangan", "hukum", "risiko", "ebd", "super_admin"].includes(
    role ?? ""
  );

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
      {/* Back link */}
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-1.5 text-sm text-ptba-gray hover:text-ptba-navy transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Kembali
      </button>

      {/* Header Card */}
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                  typeBadgeClass(project.type)
                )}
              >
                {project.type}
              </span>
              <span
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                  statusBadgeClass(project.status)
                )}
              >
                {project.status}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-ptba-charcoal">
              {project.name}
            </h1>
            <p className="text-sm text-ptba-gray">
              {formatDate(project.startDate)} — {formatDate(project.endDate)}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-xs text-ptba-gray">Nilai CAPEX</p>
            <p className="text-2xl font-bold text-ptba-navy">
              {formatCurrency(project.capexValue)}
            </p>
            <p className="text-xs text-ptba-gray mt-1">
              {project.partners.length} Mitra Berpartisipasi
            </p>
          </div>
        </div>

        {/* Action Buttons for EBD/Super Admin */}
        {isAdmin && project.status !== "Selesai" && project.status !== "Dibatalkan" && (
          <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-ptba-light-gray pt-4">
            {/* Close Registration */}
            {project.isOpenForApplication && (
              <button
                onClick={handleCloseRegistration}
                className="inline-flex items-center gap-2 rounded-lg border border-ptba-red/30 bg-ptba-red/5 px-4 py-2 text-sm font-medium text-ptba-red hover:bg-ptba-red/10 transition-colors"
              >
                <LockKeyhole className="h-4 w-4" />
                Tutup Pendaftaran Mitra
              </button>
            )}

            {/* All Evaluations Complete Indicator */}
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

            {/* Submit Persetujuan */}
            {allEvalsComplete && project.status === "Evaluasi" && (
              <button
                onClick={() => setShowPersetujuanModal(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-ptba-gold px-4 py-2 text-sm font-bold text-ptba-charcoal shadow-sm hover:bg-ptba-gold-light transition-colors"
              >
                <Send className="h-4 w-4" />
                Ajukan Persetujuan Direksi
              </button>
            )}
          </div>
        )}

        {/* 13-step Progress Bar */}
        <div className="mt-6">
          <div className="mb-2 flex items-center justify-between text-xs text-ptba-gray">
            <span>Langkah {project.currentStep} dari {project.totalSteps}</span>
            <span className="font-medium text-ptba-navy">
              {STEP_NAMES[project.currentStep - 1]}
            </span>
          </div>
          <div className="flex gap-0.5 overflow-hidden rounded-full">
            {STEP_NAMES.map((name, idx) => {
              const step = idx + 1;
              const isCompleted = step < project.currentStep;
              const isCurrent = step === project.currentStep;
              return (
                <div
                  key={name}
                  title={`${step}. ${name}`}
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
          <div className="mt-1.5 flex justify-between text-[10px] text-ptba-gray/60">
            <span>Inisiasi</span>
            <span>Kontrak</span>
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
            <div className="mb-4 flex justify-end">
              <Link
                href={`/projects/${id}/ranking`}
                className="inline-flex items-center gap-1.5 rounded-lg bg-ptba-gold/10 px-3 py-1.5 text-sm font-medium text-ptba-gold hover:bg-ptba-gold/20 transition-colors"
              >
                <BarChart3 className="h-4 w-4" /> Lihat Ranking
              </Link>
            </div>
          )}
          <div className="overflow-x-auto">
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
                {projectPartners.map((partner) => {
                  const evalDone =
                    role === "keuangan"
                      ? partner.hasFinancialEval
                      : role === "hukum"
                      ? partner.hasLegalEval
                      : role === "risiko"
                      ? partner.hasRiskEval
                      : partner.hasTechnicalEval;

                  return (
                    <tr
                      key={partner.id}
                      className="border-b border-ptba-light-gray/50 last:border-b-0"
                    >
                      <td className="py-3 pr-4">
                        <div className="font-medium text-ptba-charcoal">
                          {partner.name}
                        </div>
                        <div className="text-xs text-ptba-gray">{partner.code}</div>
                      </td>
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-20 overflow-hidden rounded-full bg-ptba-light-gray">
                            <div
                              className={cn(
                                "h-full rounded-full",
                                partner.docPct === 100
                                  ? "bg-green-500"
                                  : partner.docPct >= 70
                                  ? "bg-ptba-steel-blue"
                                  : "bg-ptba-gold"
                              )}
                              style={{ width: `${partner.docPct}%` }}
                            />
                          </div>
                          <span className="text-xs text-ptba-gray">
                            {partner.docPct}%
                          </span>
                        </div>
                        <div className="text-xs text-ptba-gray">
                          {partner.docComplete}/{partner.docTotal} dok
                        </div>
                      </td>
                      <td className="py-3 pr-4 text-center">
                        <EvalStatusCell done={partner.hasTechnicalEval} />
                      </td>
                      <td className="py-3 pr-4 text-center">
                        <EvalStatusCell done={partner.hasFinancialEval} />
                      </td>
                      <td className="py-3 pr-4 text-center">
                        <EvalStatusCell done={partner.hasLegalEval} />
                      </td>
                      <td className="py-3 pr-4 text-center">
                        <EvalStatusCell done={partner.hasRiskEval} />
                      </td>
                      <td className="py-3">
                        <EvalActionButton
                          partnerId={partner.id}
                          evalDone={!!evalDone}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
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
                      <tr
                        key={doc.id}
                        className="border-b border-ptba-light-gray/50 last:border-b-0"
                      >
                        <td className="py-2 pr-4 font-medium text-ptba-charcoal">
                          {doc.name}
                        </td>
                        <td className="py-2 pr-4 text-ptba-gray text-xs">
                          {doc.type}
                        </td>
                        <td className="py-2 pr-4">
                          <span
                            className={cn(
                              "inline-block rounded-full px-2 py-0.5 text-xs font-medium",
                              doc.status === "Lengkap" &&
                                "bg-green-100 text-green-700",
                              doc.status === "Pending" &&
                                "bg-amber-100 text-amber-700",
                              doc.status === "Ditolak" &&
                                "bg-red-100 text-red-700",
                              doc.status === "Belum Upload" &&
                                "bg-gray-100 text-gray-500"
                            )}
                          >
                            {doc.status}
                          </span>
                        </td>
                        <td className="py-2 text-ptba-gray text-xs">
                          {doc.uploadDate
                            ? formatDate(doc.uploadDate)
                            : "—"}
                        </td>
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
            <h3 className="mb-3 font-semibold text-ptba-charcoal">
              Deskripsi Proyek
            </h3>
            <p className="text-sm leading-relaxed text-ptba-gray">
              {project.description}
            </p>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h3 className="mb-4 font-semibold text-ptba-charcoal">
              Informasi Umum
            </h3>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-ptba-gray">ID Proyek</dt>
                <dd className="font-medium text-ptba-charcoal">{project.id}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ptba-gray">Tipe</dt>
                <dd>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-xs font-semibold",
                      typeBadgeClass(project.type)
                    )}
                  >
                    {project.type}
                  </span>
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ptba-gray">Status</dt>
                <dd>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-xs font-semibold",
                      statusBadgeClass(project.status)
                    )}
                  >
                    {project.status}
                  </span>
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ptba-gray">Nilai CAPEX</dt>
                <dd className="font-bold text-ptba-navy">
                  {formatCurrency(project.capexValue)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ptba-gray">Jumlah Mitra</dt>
                <dd className="font-medium text-ptba-charcoal">
                  {project.partners.length} mitra
                </dd>
              </div>
            </dl>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h3 className="mb-4 font-semibold text-ptba-charcoal">Timeline</h3>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-ptba-gray">Tanggal Mulai</dt>
                <dd className="font-medium text-ptba-charcoal">
                  {formatDate(project.startDate)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ptba-gray">Tanggal Selesai</dt>
                <dd className="font-medium text-ptba-charcoal">
                  {formatDate(project.endDate)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ptba-gray">Dibuat Pada</dt>
                <dd className="font-medium text-ptba-charcoal">
                  {formatDate(project.createdAt)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ptba-gray">Progres Langkah</dt>
                <dd className="font-medium text-ptba-charcoal">
                  {project.currentStep}/{project.totalSteps}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ptba-gray">Langkah Saat Ini</dt>
                <dd className="font-medium text-ptba-charcoal">
                  {STEP_NAMES[project.currentStep - 1]}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      )}

      {/* Persetujuan Modal */}
      {showPersetujuanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
            {/* Modal Header */}
            <div className="border-b border-ptba-light-gray px-6 py-4">
              <h2 className="text-lg font-bold text-ptba-charcoal">Ajukan Persetujuan ke Direksi</h2>
              <p className="text-sm text-ptba-gray">
                Pilih mitra yang direkomendasikan untuk proyek {project.name}
              </p>
            </div>

            {/* Mitra List with Scores */}
            <div className="max-h-[400px] overflow-y-auto px-6 py-4">
              <div className="space-y-3">
                {partnerScores.map((partner, index) => {
                  const isSelected = selectedMitra.includes(partner.id);
                  return (
                    <label
                      key={partner.id}
                      className={cn(
                        "flex items-start gap-4 rounded-xl border-2 p-4 cursor-pointer transition-all",
                        isSelected
                          ? "border-ptba-gold bg-ptba-gold/5"
                          : "border-ptba-light-gray hover:border-ptba-steel-blue/30"
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
                              index === 1 ? "bg-gray-200 text-gray-600" :
                              index === 2 ? "bg-amber-100 text-amber-700" :
                              "bg-ptba-light-gray text-ptba-gray"
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
                              partner.grade === "B" ? "bg-blue-100 text-blue-700" :
                              partner.grade === "C" ? "bg-amber-100 text-amber-700" :
                              "bg-gray-100 text-gray-600"
                            )}>
                              Grade {partner.grade}
                            </span>
                          </div>
                        </div>
                        {/* Score breakdown */}
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

              {/* Notes */}
              <div className="mt-4">
                <label className="mb-1 block text-sm font-medium text-ptba-charcoal">
                  Catatan untuk Direksi (opsional)
                </label>
                <textarea
                  placeholder="Tambahkan catatan atau justifikasi rekomendasi..."
                  value={persetujuanNotes}
                  onChange={(e) => setPersetujuanNotes(e.target.value)}
                  className="w-full rounded-lg border border-ptba-light-gray bg-ptba-off-white px-3 py-2.5 text-sm outline-none focus:border-ptba-steel-blue focus:ring-2 focus:ring-ptba-steel-blue/20 min-h-[80px] resize-y"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between border-t border-ptba-light-gray px-6 py-4">
              <p className="text-sm text-ptba-gray">
                {selectedMitra.length > 0
                  ? `${selectedMitra.length} mitra dipilih`
                  : "Belum ada mitra dipilih"}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowPersetujuanModal(false);
                    setSelectedMitra([]);
                    setPersetujuanNotes("");
                  }}
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
