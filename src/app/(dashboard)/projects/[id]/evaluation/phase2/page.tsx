"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  AlertCircle,
  Building2,
  BarChart3,
  ShieldCheck,
  Scale,
  AlertTriangle,
  ClipboardCheck,
  Send,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { mockProjects } from "@/lib/mock-data/projects";
import { mockPartners } from "@/lib/mock-data/partners";
import { mockEvaluations } from "@/lib/mock-data/evaluations";

type EvalStatus = "belum" | "sedang" | "selesai";

const DIVISIONS = [
  { key: "ebd_pasar", label: "Pasar", sublabel: "EBD", icon: ClipboardCheck, path: "market" },
  { key: "ebd_teknis", label: "Teknis", sublabel: "EBD", icon: ClipboardCheck, path: "market" },
  { key: "ebd_komersial", label: "Komersial", sublabel: "EBD / ESG", icon: ClipboardCheck, path: "market" },
  { key: "keuangan", label: "Keuangan", sublabel: "KEP-100", icon: BarChart3, path: "financial" },
  { key: "hukum", label: "Hukum", sublabel: "Regulasi", icon: Scale, path: "legal" },
  { key: "risiko", label: "Risiko", sublabel: "Manajemen", icon: AlertTriangle, path: "risk" },
] as const;

function getEvalStatus(
  projectId: string,
  partnerId: string,
  divKey: string
): EvalStatus {
  const eval0 = mockEvaluations.find(
    (e) => e.projectId === projectId && e.partnerId === partnerId && e.phase === "phase2"
  );
  if (!eval0) return "belum";

  switch (divKey) {
    case "keuangan":
      return eval0.financial ? "selesai" : "belum";
    case "hukum":
      return eval0.legal ? "selesai" : "belum";
    case "risiko":
      return eval0.risk ? "selesai" : "belum";
    case "ebd":
      return eval0.market || eval0.technical ? "selesai" : "belum";
    default:
      return "belum";
  }
}

function StatusBadge({ status }: { status: EvalStatus }) {
  switch (status) {
    case "selesai":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700">
          <CheckCircle2 className="h-3 w-3" /> Selesai
        </span>
      );
    case "sedang":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700">
          <Clock className="h-3 w-3" /> Sedang Berjalan
        </span>
      );
    case "belum":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-500">
          <AlertCircle className="h-3 w-3" /> Belum Mulai
        </span>
      );
  }
}

export default function Phase2EvaluationHubPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [finalized, setFinalized] = useState(false);

  const project = mockProjects.find((p) => p.id === id);

  if (!project) {
    return (
      <div className="space-y-4">
        <Link href="/projects" className="inline-flex items-center gap-1.5 text-sm text-ptba-gray hover:text-ptba-navy">
          <ArrowLeft className="h-4 w-4" /> Kembali
        </Link>
        <p className="text-ptba-gray">Proyek tidak ditemukan.</p>
      </div>
    );
  }

  const partnerIds = project.shortlistedPartners ?? project.partners;
  const partners = partnerIds.map((pid) => {
    const partner = mockPartners.find((p) => p.id === pid);
    return { id: pid, name: partner?.name ?? pid, code: partner?.code ?? pid };
  });

  // Build the matrix
  const matrix = partners.map((partner) => {
    const statuses = DIVISIONS.map((div) => ({
      divKey: div.key,
      status: getEvalStatus(project.id, partner.id, div.key),
    }));
    return { partner, statuses };
  });

  // Count totals
  const totalCells = matrix.length * DIVISIONS.length;
  const completedCells = matrix.reduce(
    (sum, row) => sum + row.statuses.filter((s) => s.status === "selesai").length,
    0
  );
  const allComplete = completedCells === totalCells && totalCells > 0;
  const progressPct = totalCells > 0 ? Math.round((completedCells / totalCells) * 100) : 0;

  return (
    <div className="space-y-6">
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-1.5 text-sm text-ptba-gray hover:text-ptba-navy transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Kembali
      </button>

      {/* Header */}
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="rounded-full bg-ptba-steel-blue/10 px-2.5 py-0.5 text-xs font-semibold text-ptba-steel-blue">
                Fase 2
              </span>
              <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
                Evaluasi Komprehensif
              </span>
            </div>
            <h1 className="text-xl font-bold text-ptba-charcoal">{project.name}</h1>
            <p className="text-sm text-ptba-gray mt-0.5">
              Hub evaluasi multi-divisi — {partners.length} mitra shortlist
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-ptba-gray">Progres Evaluasi</p>
            <p className="text-2xl font-bold text-ptba-navy">{completedCells}/{totalCells}</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-ptba-gray mb-1.5">
            <span>{completedCells} dari {totalCells} evaluasi selesai</span>
            <span className="font-semibold">{progressPct}%</span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-ptba-light-gray">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                allComplete ? "bg-green-500" : progressPct > 50 ? "bg-ptba-steel-blue" : "bg-ptba-gold"
              )}
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Matrix Table */}
      <div className="rounded-xl bg-white shadow-sm overflow-hidden">
        <div className="p-5 border-b border-ptba-light-gray">
          <h2 className="text-lg font-semibold text-ptba-charcoal">Matriks Evaluasi</h2>
          <p className="text-xs text-ptba-gray mt-0.5">Klik sel untuk membuka halaman evaluasi divisi terkait</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-ptba-section-bg">
                <th className="text-left px-5 py-3 text-xs font-semibold text-ptba-navy w-56">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Mitra
                  </div>
                </th>
                {DIVISIONS.map((div) => {
                  const Icon = div.icon;
                  return (
                    <th key={div.key} className="text-center px-4 py-3 text-xs font-semibold text-ptba-navy min-w-[140px]">
                      <div className="flex flex-col items-center gap-0.5">
                        <Icon className="h-4 w-4 mb-0.5" />
                        <span>{div.label}</span>
                        <span className="text-[10px] font-normal text-ptba-gray">{div.sublabel}</span>
                      </div>
                    </th>
                  );
                })}
                <th className="text-center px-4 py-3 text-xs font-semibold text-ptba-navy min-w-[100px]">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {matrix.map((row, idx) => {
                const allRowDone = row.statuses.every((s) => s.status === "selesai");
                const doneCount = row.statuses.filter((s) => s.status === "selesai").length;
                return (
                  <tr
                    key={row.partner.id}
                    className={cn(
                      "border-b border-ptba-light-gray/50 last:border-b-0",
                      idx % 2 === 0 ? "bg-white" : "bg-ptba-section-bg/30"
                    )}
                  >
                    {/* Partner name */}
                    <td className="px-5 py-4">
                      <p className="text-sm font-semibold text-ptba-charcoal">{row.partner.name}</p>
                      <p className="text-[10px] text-ptba-gray">{row.partner.code}</p>
                    </td>

                    {/* Division cells */}
                    {DIVISIONS.map((div, dIdx) => {
                      const cellStatus = row.statuses[dIdx].status;
                      return (
                        <td key={div.key} className="px-4 py-4 text-center">
                          <Link
                            href={`/projects/${id}/evaluation/${div.path}?partnerId=${row.partner.id}`}
                            className={cn(
                              "inline-flex flex-col items-center gap-1 rounded-lg px-3 py-2 transition-all hover:shadow-md",
                              cellStatus === "selesai"
                                ? "bg-green-50 border border-green-200 hover:bg-green-100"
                                : cellStatus === "sedang"
                                ? "bg-amber-50 border border-amber-200 hover:bg-amber-100"
                                : "bg-gray-50 border border-gray-200 hover:bg-gray-100"
                            )}
                          >
                            <StatusBadge status={cellStatus} />
                            <span className="text-[10px] text-ptba-gray flex items-center gap-0.5">
                              <ExternalLink className="h-2.5 w-2.5" />
                              {cellStatus === "selesai" ? "Lihat" : "Evaluasi"}
                            </span>
                          </Link>
                        </td>
                      );
                    })}

                    {/* Row status */}
                    <td className="px-4 py-4 text-center">
                      {allRowDone ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Lengkap
                        </span>
                      ) : (
                        <span className="text-xs text-ptba-gray font-medium">
                          {doneCount}/{DIVISIONS.length}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Finalize section */}
      <div className={cn(
        "rounded-xl p-5 shadow-sm",
        finalized ? "bg-green-50 border border-green-200" : "bg-white"
      )}>
        {finalized ? (
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-bold text-green-800">Evaluasi Fase 2 Telah Difinalisasi</p>
              <p className="text-xs text-green-700 mt-0.5">
                Hasil evaluasi telah dikunci. Proyek siap masuk tahap Pemeringkatan.
              </p>
              <Link
                href={`/projects/${id}/ranking`}
                className="inline-flex items-center gap-1.5 mt-2 text-xs font-semibold text-ptba-navy hover:text-ptba-steel-blue transition-colors"
              >
                Lihat Peringkat <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-sm font-bold text-ptba-charcoal">Finalisasi Evaluasi Fase 2</h3>
              <p className="text-xs text-ptba-gray mt-0.5">
                {allComplete
                  ? "Semua evaluasi telah selesai. Anda dapat memfinalisasi dan melanjutkan ke tahap pemeringkatan."
                  : `Masih ada ${totalCells - completedCells} evaluasi yang belum selesai. Selesaikan semua evaluasi terlebih dahulu.`}
              </p>
            </div>
            <button
              onClick={() => {
                if (confirm("Finalisasi evaluasi Fase 2? Hasil evaluasi akan dikunci dan proyek akan lanjut ke tahap Pemeringkatan.")) {
                  setFinalized(true);
                }
              }}
              disabled={!allComplete}
              className={cn(
                "inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold shadow-sm transition-colors flex-shrink-0",
                allComplete
                  ? "bg-ptba-navy text-white hover:bg-ptba-steel-blue"
                  : "bg-ptba-light-gray text-ptba-gray cursor-not-allowed"
              )}
            >
              <Send className="h-4 w-4" />
              Finalisasi Evaluasi
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
