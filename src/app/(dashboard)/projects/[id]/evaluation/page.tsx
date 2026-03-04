"use client";

import { use, useState } from "react";
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
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { formatDate } from "@/lib/utils/format";
import { mockProjects } from "@/lib/mock-data/projects";
import { mockPartners } from "@/lib/mock-data/partners";
import { mockEvaluations } from "@/lib/mock-data/evaluations";
import { mockApplications } from "@/lib/mock-data/applications";

function EvalStatusPill({
  done,
  label,
}: {
  done: boolean;
  label: string;
}) {
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

  const toggleDocs = (partnerId: string) => {
    setExpandedDocs((prev) => ({ ...prev, [partnerId]: !prev[partnerId] }));
  };

  const project = mockProjects.find((p) => p.id === id);

  if (!project) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-sm text-ptba-gray hover:text-ptba-navy"
        >
          <ArrowLeft className="h-4 w-4" /> Kembali
        </button>
        <p className="text-ptba-gray">Proyek tidak ditemukan.</p>
      </div>
    );
  }

  const projectPartners = project.partners.map((pid) => {
    const partner = mockPartners.find((p) => p.id === pid);
    const eval0 = mockEvaluations.find(
      (e) => e.projectId === project.id && e.partnerId === pid
    );
    const application = mockApplications.find(
      (a) => a.projectId === project.id && a.partnerId === pid
    );
    return {
      id: pid,
      name: partner?.name ?? pid,
      code: partner?.code ?? pid,
      hasFinancialEval: !!eval0?.financial,
      hasLegalEval: !!eval0?.legal,
      hasRiskEval: !!eval0?.risk,
      hasTechnicalEval: !!eval0?.technical,
      hasEBDEval: !!eval0?.market,
      financialGrade: eval0?.financial?.grade,
      legalStatus: eval0?.legal?.overallStatus,
      riskLevel: eval0?.risk?.overallLevel,
      evalStatus: eval0?.status,
      totalScore: eval0?.totalScore,
      grade: eval0?.grade,
      documents: application?.documents ?? [],
      applicationStatus: application?.status,
    };
  });

  const base = `/projects/${id}/evaluation`;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-ptba-gray">
        <Link href="/projects" className="hover:text-ptba-navy">Proyek</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href={`/projects/${id}`} className="hover:text-ptba-navy">
          {project.name}
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-ptba-charcoal font-medium">Hub Evaluasi</span>
      </nav>

      {/* Back link */}
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-1.5 text-sm text-ptba-gray hover:text-ptba-navy transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Kembali ke Proyek
      </button>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ptba-charcoal">Hub Evaluasi</h1>
          <p className="mt-1 text-sm text-ptba-gray">{project.name}</p>
        </div>
        <Link
          href={`/projects/${id}/ranking`}
          className="inline-flex items-center gap-1.5 rounded-lg bg-ptba-gold/10 px-4 py-2 text-sm font-medium text-ptba-gold hover:bg-ptba-gold/20 transition-colors"
        >
          <BarChart3 className="h-4 w-4" /> Lihat Ranking
        </Link>
      </div>

      {/* Per-Partner Evaluation Summary */}
      <div className="space-y-4">
        {projectPartners.map((partner) => {
          const isFocused = focusPartnerId === partner.id;
          const allDone =
            partner.hasFinancialEval &&
            partner.hasLegalEval &&
            partner.hasRiskEval &&
            partner.hasTechnicalEval;

          return (
            <div
              key={partner.id}
              className={cn(
                "rounded-xl bg-white p-5 shadow-sm transition-shadow hover:shadow-md",
                isFocused && "ring-2 ring-ptba-navy"
              )}
            >
              {/* Partner header */}
              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="font-semibold text-ptba-charcoal">{partner.name}</h3>
                  <p className="text-xs text-ptba-gray">{partner.code}</p>
                </div>
                <div className="flex items-center gap-2">
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
                    <span className="rounded-lg bg-ptba-navy/10 px-2.5 py-1 text-xs font-bold text-ptba-navy">
                      Grade: {partner.grade}
                    </span>
                  )}
                  {partner.totalScore && (
                    <span className="text-xs text-ptba-gray">
                      Skor: {partner.totalScore.toFixed(1)}
                    </span>
                  )}
                </div>
              </div>

              {/* Division cards */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                {/* Technical */}
                <div className="rounded-lg border border-ptba-light-gray p-3">
                  <p className="mb-2 text-xs font-semibold text-ptba-gray">Teknis & Pasar</p>
                  <EvalStatusPill done={partner.hasTechnicalEval} label="Selesai" />
                  {partner.hasTechnicalEval ? (
                    <Link
                      href={`${base}/market?partnerId=${partner.id}`}
                      className="mt-2 flex items-center gap-1 text-xs text-ptba-steel-blue hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" /> Lihat
                    </Link>
                  ) : (
                    <Link
                      href={`${base}/market?partnerId=${partner.id}`}
                      className="mt-2 flex items-center gap-1 text-xs text-ptba-navy hover:underline font-medium"
                    >
                      Mulai Evaluasi →
                    </Link>
                  )}
                </div>

                {/* Financial */}
                <div className="rounded-lg border border-ptba-light-gray p-3">
                  <p className="mb-2 text-xs font-semibold text-ptba-gray">Keuangan</p>
                  <EvalStatusPill done={partner.hasFinancialEval} label={partner.financialGrade ?? "Selesai"} />
                  {partner.hasFinancialEval ? (
                    <Link
                      href={`${base}/financial?partnerId=${partner.id}`}
                      className="mt-2 flex items-center gap-1 text-xs text-ptba-steel-blue hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" /> Lihat
                    </Link>
                  ) : (
                    <Link
                      href={`${base}/financial?partnerId=${partner.id}`}
                      className="mt-2 flex items-center gap-1 text-xs text-ptba-navy hover:underline font-medium"
                    >
                      Mulai Evaluasi →
                    </Link>
                  )}
                </div>

                {/* Legal */}
                <div className="rounded-lg border border-ptba-light-gray p-3">
                  <p className="mb-2 text-xs font-semibold text-ptba-gray">Hukum</p>
                  <EvalStatusPill done={partner.hasLegalEval} label={partner.legalStatus ?? "Selesai"} />
                  {partner.hasLegalEval ? (
                    <Link
                      href={`${base}/legal?partnerId=${partner.id}`}
                      className="mt-2 flex items-center gap-1 text-xs text-ptba-steel-blue hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" /> Lihat
                    </Link>
                  ) : (
                    <Link
                      href={`${base}/legal?partnerId=${partner.id}`}
                      className="mt-2 flex items-center gap-1 text-xs text-ptba-navy hover:underline font-medium"
                    >
                      Mulai Evaluasi →
                    </Link>
                  )}
                </div>

                {/* Risk */}
                <div className="rounded-lg border border-ptba-light-gray p-3">
                  <p className="mb-2 text-xs font-semibold text-ptba-gray">Risiko</p>
                  <EvalStatusPill done={partner.hasRiskEval} label={partner.riskLevel ?? "Selesai"} />
                  {partner.hasRiskEval ? (
                    <Link
                      href={`${base}/risk?partnerId=${partner.id}`}
                      className="mt-2 flex items-center gap-1 text-xs text-ptba-steel-blue hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" /> Lihat
                    </Link>
                  ) : (
                    <Link
                      href={`${base}/risk?partnerId=${partner.id}`}
                      className="mt-2 flex items-center gap-1 text-xs text-ptba-navy hover:underline font-medium"
                    >
                      Mulai Evaluasi →
                    </Link>
                  )}
                </div>

                {/* EBD */}
                <div className="rounded-lg border border-ptba-navy/20 bg-ptba-navy/5 p-3">
                  <p className="mb-2 text-xs font-semibold text-ptba-navy">EBD</p>
                  <EvalStatusPill done={partner.hasEBDEval} label="Selesai" />
                  {partner.hasEBDEval ? (
                    <Link
                      href={`${base}/ebd?partnerId=${partner.id}`}
                      className="mt-2 flex items-center gap-1 text-xs text-ptba-steel-blue hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" /> Lihat
                    </Link>
                  ) : (
                    <Link
                      href={`${base}/ebd?partnerId=${partner.id}`}
                      className="mt-2 flex items-center gap-1 text-xs text-ptba-navy hover:underline font-medium"
                    >
                      Mulai Evaluasi →
                    </Link>
                  )}
                </div>
              </div>

              {/* Dokumen Mitra Section */}
              {partner.documents.length > 0 && (
                <div className="mt-4 border-t border-ptba-light-gray pt-4">
                  <button
                    onClick={() => toggleDocs(partner.id)}
                    className="flex w-full items-center justify-between text-left"
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-ptba-steel-blue" />
                      <span className="text-sm font-semibold text-ptba-charcoal">
                        Dokumen Mitra
                      </span>
                      <span className="rounded-full bg-ptba-section-bg px-2 py-0.5 text-xs text-ptba-gray">
                        {partner.documents.length} terunggah
                      </span>
                    </div>
                    {expandedDocs[partner.id] ? (
                      <ChevronUp className="h-4 w-4 text-ptba-gray" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-ptba-gray" />
                    )}
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
                            <tr
                              key={doc.id}
                              className={
                                docIdx % 2 === 0 ? "bg-white" : "bg-ptba-off-white"
                              }
                            >
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

      {projectPartners.length === 0 && (
        <div className="rounded-xl bg-white p-10 text-center shadow-sm">
          <p className="text-ptba-gray">Belum ada mitra yang terdaftar dalam proyek ini.</p>
        </div>
      )}
    </div>
  );
}
