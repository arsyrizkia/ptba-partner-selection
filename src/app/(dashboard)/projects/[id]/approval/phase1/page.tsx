"use client";

import React, { use, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Send,
  AlertTriangle,
  RotateCcw,
  FileText,
  Download,
  ClipboardCheck,
  User,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useAuth } from "@/lib/auth/auth-context";
import { api, projectApi, downloadDocument } from "@/lib/api/client";
import { ALL_FILTRATION_ITEMS } from "@/lib/constants/phase1-criteria";
import { DOCUMENT_TYPES } from "@/lib/constants/document-types";
import { formatDate } from "@/lib/utils/format";
import FormDataViewer from "@/components/features/project/form-data-viewer";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Phase1EvalSummary {
  id: string;
  application_id: string;
  evaluator_id: string;
  overall_result: string;
  weighted_score: number | null;
  notes: string | null;
  evaluated_at: string;
  partner_id: string;
  partner_name: string;
}

interface Phase1ScoreDetail {
  criterion_id: string;
  score: number | null;
  passed: boolean | null;
  item_type: string;
  notes: string | null;
}

interface Phase1EvalDetail {
  id: string;
  weighted_score: number | null;
  overall_result: string;
  notes: string | null;
  evaluated_at: string;
  partner_name: string;
  scores: Phase1ScoreDetail[];
}

interface AppDocument {
  id?: string;
  document_type_id: string;
  name: string;
  file_key: string;
  status: string;
  upload_date: string;
}

interface ApplicationDetail {
  id: string;
  partner_id: string;
  partner_name?: string;
  applied_at?: string;
  phase1Documents?: AppDocument[];
  form_data?: Record<string, any>;
}

interface ApprovalRecord {
  id: string;
  project_id: string;
  type: string;
  status: string;
  [key: string]: unknown;
}

interface MitraApprovalState {
  partnerId: string;
  decision: "pending" | "approved" | "rejected";
  notes: string;
}

type KetuaTimMitraDecision = "pending" | "setujui" | "re-evaluasi";

interface KetuaTimMitraState {
  partnerId: string;
  decision: KetuaTimMitraDecision;
  notes: string;
}

/* ------------------------------------------------------------------ */
/*  Form Data Rendering for Document Tab                               */
/* ------------------------------------------------------------------ */

function EvalField({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <dt className="text-[10px] text-ptba-gray">{label}</dt>
      <dd className="text-xs text-ptba-charcoal">{value || "-"}</dd>
    </div>
  );
}

const EVAL_FORM_DATA_MAP: Record<string, { title: string; render: (fd: any) => React.ReactNode }> = {
  compro: {
    title: "Informasi Perusahaan",
    render: (fd) => (
      <div className="space-y-3">
        <dl className="grid grid-cols-2 gap-x-6 gap-y-2">
          <EvalField label="Nama Perusahaan" value={fd.companyName} />
          <EvalField label="Overview Bidang Usaha" value={fd.businessOverview} />
        </dl>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-2">
          <EvalField label="Alamat Kantor Pusat" value={fd.companyAddress} />
          <EvalField label="Alamat Kantor Rep. Indonesia" value={fd.companyIndonesiaAddress} />
        </dl>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-2">
          <EvalField label="Telepon" value={fd.companyPhone} />
          <EvalField label="Email" value={fd.companyEmail} />
          <EvalField label="Website" value={fd.companyWebsite} />
          <EvalField label="NIB" value={fd.nib} />
        </dl>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-2">
          <EvalField label="Tahun Berdiri" value={fd.yearEstablished} />
          <EvalField label="Negara" value={fd.countryEstablished} />
        </dl>
        {(fd.orgStructure || fd.subsidiaries) && (
          <dl className="grid grid-cols-2 gap-x-6 gap-y-2">
            {fd.orgStructure && <EvalField label="Struktur Organisasi" value={fd.orgStructure} />}
            {fd.subsidiaries && <EvalField label="Anak Perusahaan / Afiliasi" value={fd.subsidiaries} />}
          </dl>
        )}
        <div className="border-t border-gray-200 pt-2">
          <p className="text-[10px] font-semibold text-ptba-gray uppercase mb-1">Contact Person</p>
          <dl className="grid grid-cols-3 gap-x-4 gap-y-2">
            <EvalField label="Nama" value={fd.contactPerson} />
            <EvalField label="Telepon" value={fd.contactPhone} />
            <EvalField label="Email" value={fd.contactEmail} />
          </dl>
        </div>
      </div>
    ),
  },
  statement_eoi: {
    title: "Surat Pernyataan Expression of Interest",
    render: (fd) => (
      <dl className="grid grid-cols-2 gap-x-6 gap-y-2">
        <EvalField label="Nama Penandatangan" value={fd.signerName} />
        <EvalField label="Jabatan" value={fd.signerPosition} />
        <EvalField label="Tanggal" value={fd.signerDate} />
        <EvalField label="Ekuitas Joint Venture (%)" value={fd.minorityEquityPercent ? `${fd.minorityEquityPercent}%` : undefined} />
        <EvalField label="Cash on Hand (USD)" value={fd.cashOnHand} />
        <EvalField label="Menyetujui EoI" value={fd.eoiAgreed ? "Ya" : "Tidak"} />
      </dl>
    ),
  },
  portfolio: {
    title: "Pengalaman Proyek",
    render: (fd) => {
      const exps = fd.experiences || [];
      if (exps.length === 0) return <p className="text-xs text-ptba-gray">Tidak ada data pengalaman.</p>;
      const catLabels: Record<string, string> = { developer: "Developer", om_contractor: "O&M Contractor", financing: "Pembiayaan" };
      return (
        <div className="space-y-2">
          {exps.map((exp: any, i: number) => (
            <div key={i} className="rounded-lg border border-ptba-light-gray/50 p-2.5">
              <p className="text-[10px] font-semibold text-ptba-charcoal mb-1">Pengalaman #{i + 1} — {catLabels[exp.category] || exp.category}</p>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-1">
                <EvalField label="Nama Pembangkit" value={exp.plantName} />
                <EvalField label="Lokasi" value={exp.location} />
                <EvalField label="Kapasitas (MW)" value={exp.totalCapacityMW} />
                {exp.category === "developer" && <>
                  <EvalField label="Ekuitas (%)" value={exp.equityPercent} />
                  <EvalField label="IPP / Captive" value={exp.ippOrCaptive} />
                  <EvalField label="Tahun COD" value={exp.codYear} />
                </>}
                {exp.category === "om_contractor" && <>
                  <EvalField label="Nilai Kontrak (USD)" value={exp.contractValueUSD} />
                  <EvalField label="Porsi Kerja (%)" value={exp.workPortionPercent} />
                  <EvalField label="IPP / Captive" value={exp.ippOrCaptive} />
                  <EvalField label="Tahun COD" value={exp.codYear} />
                </>}
                {exp.category === "financing" && <>
                  <EvalField label="Tipe Pembiayaan" value={exp.financingType} />
                  <EvalField label="Jumlah (USD)" value={exp.amountUSD} />
                  <EvalField label="Tahun" value={exp.year} />
                </>}
              </dl>
            </div>
          ))}
        </div>
      );
    },
  },
  financial_overview: {
    title: "Data Keuangan",
    render: (fd) => {
      const years = fd.financialYears || [];
      return (
        <div className="space-y-2">
          {years.length > 0 && (
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-ptba-light-gray">
                  <th className="py-1 text-left text-ptba-gray font-medium">Tahun</th>
                  <th className="py-1 text-left text-ptba-gray font-medium">Total Asset</th>
                  <th className="py-1 text-left text-ptba-gray font-medium">EBITDA</th>
                  <th className="py-1 text-left text-ptba-gray font-medium">DSCR</th>
                </tr>
              </thead>
              <tbody>
                {years.map((fy: any, i: number) => (
                  <tr key={i} className="border-b border-ptba-light-gray/30">
                    <td className="py-1 text-ptba-charcoal">{fy.year}</td>
                    <td className="py-1 text-ptba-charcoal">{fy.totalAsset || "-"}</td>
                    <td className="py-1 text-ptba-charcoal">{fy.ebitda || "-"}</td>
                    <td className="py-1 text-ptba-charcoal">{fy.dscr || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {(fd.creditRatingAgency || fd.creditRatingValue) && (
            <dl className="grid grid-cols-2 gap-x-4 gap-y-1">
              <EvalField label="Lembaga Rating" value={fd.creditRatingAgency} />
              <EvalField label="Nilai Rating" value={fd.creditRatingValue} />
            </dl>
          )}
        </div>
      );
    },
  },
  requirements_fulfillment: {
    title: "Pemenuhan Persyaratan",
    render: (fd) => (
      <div className="space-y-1">
        {fd.requirementAnswers && Object.keys(fd.requirementAnswers).length > 0 ? (
          <p className="text-xs text-green-700">Semua persyaratan telah dikonfirmasi.</p>
        ) : (
          <p className="text-xs text-ptba-gray">Tidak ada data persyaratan.</p>
        )}
        {fd.requirementNotes && (
          <div>
            <span className="text-[10px] text-ptba-gray">Catatan:</span>
            <p className="text-xs text-ptba-charcoal">{fd.requirementNotes}</p>
          </div>
        )}
      </div>
    ),
  },
  // Aliases
  financial: undefined as any,
  requirements: undefined as any,
};
EVAL_FORM_DATA_MAP.financial = EVAL_FORM_DATA_MAP.financial_overview;
EVAL_FORM_DATA_MAP.requirements = EVAL_FORM_DATA_MAP.requirements_fulfillment;

/* ------------------------------------------------------------------ */
/*  Page Component                                                     */
/* ------------------------------------------------------------------ */

export default function Phase1ApprovalPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { role, accessToken } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  /* ---- loading / data state ---- */
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [project, setProject] = useState<{ id: string; name: string; [key: string]: unknown } | null>(null);
  const [phase1Evals, setPhase1Evals] = useState<Phase1EvalSummary[]>([]);
  const [approvalRecord, setApprovalRecord] = useState<ApprovalRecord | null>(null);

  /* ---- detail loading for selected mitra ---- */
  const [selectedDetail, setSelectedDetail] = useState<Phase1EvalDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedAppDetail, setSelectedAppDetail] = useState<ApplicationDetail | null>(null);
  const [appDetailLoading, setAppDetailLoading] = useState(false);

  /* ---- PIC local state ---- */
  const [mitraStates, setMitraStates] = useState<MitraApprovalState[]>([]);
  const [submitted, setSubmitted] = useState(false);

  /* ---- Ketua Tim local state ---- */
  const [ketuaTimMitraStates, setKetuaTimMitraStates] = useState<KetuaTimMitraState[]>([]);
  const [ketuaTimGlobalNotes, setketuaTimGlobalNotes] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [ketuaTimSubmitted, setKetuaTimSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  /* ---- Panel tab state ---- */
  const [panelTab, setPanelTab] = useState<"penilaian" | "dokumen_formulir">("penilaian");
  const [docSectionOpen, setDocSectionOpen] = useState(true);
  const [formSectionOpen, setFormSectionOpen] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  /* ---- Accordion state for document form data ---- */
  const [expandedDocs, setExpandedDocs] = useState<Record<string, boolean>>({});

  /* ---- Selected mitra ---- */
  const selectedPartnerId = searchParams.get("partnerId");

  /* ---- Fetch initial data ---- */
  useEffect(() => {
    if (!accessToken) return;

    let cancelled = false;

    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const [projectRes, evalsRes, approvalsRes] = await Promise.all([
          projectApi(accessToken!).getById(id),
          api<{ evaluations: Phase1EvalSummary[] }>(`/evaluations/phase1/${id}`, { token: accessToken! }),
          api<{ approvals: ApprovalRecord[] }>(`/approvals?project_id=${id}&type=phase1_evaluation`, { token: accessToken! }),
        ]);

        if (cancelled) return;

        setProject(projectRes.data);
        setPhase1Evals(evalsRes.evaluations || []);

        // Find the approval record for this project
        const approvals = approvalsRes.approvals || [];
        const approval = approvals.find(
          (a) => a.project_id === id && a.type === "phase1_evaluation"
        ) || null;
        setApprovalRecord(approval);

        const evals = evalsRes.evaluations || [];
        const alreadyDecided = approval && approval.status !== "Menunggu";

        // If already decided, set states based on approval outcome
        if (alreadyDecided) {
          setSubmitted(true);
          setKetuaTimSubmitted(true);

          const isApproved = approval.status === "Disetujui";
          setMitraStates(
            evals.map((ev) => ({
              partnerId: ev.partner_id,
              decision: "approved" as const,
              notes: "",
            }))
          );
          setKetuaTimMitraStates(
            evals.map((ev) => ({
              partnerId: ev.partner_id,
              decision: isApproved ? "setujui" as const : "re-evaluasi" as const,
              notes: (approval.notes as string) || "",
            }))
          );
        } else {
          // Initialize as pending
          setMitraStates(
            evals.map((ev) => ({
              partnerId: ev.partner_id,
              decision: "pending" as const,
              notes: "",
            }))
          );
          setKetuaTimMitraStates(
            evals.map((ev) => ({
              partnerId: ev.partner_id,
              decision: "pending" as const,
              notes: "",
            }))
          );
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message || "Gagal memuat data");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchData();
    return () => { cancelled = true; };
  }, [id, accessToken]);

  /* ---- Fetch detail scores when a mitra is selected ---- */
  const fetchEvalDetail = useCallback(
    async (partnerId: string) => {
      if (!accessToken) return;
      const ev = phase1Evals.find((e) => e.partner_id === partnerId);
      if (!ev) return;

      setDetailLoading(true);
      setSelectedDetail(null);
      try {
        const res = await api<{ evaluation: Phase1EvalDetail }>(
          `/evaluations/phase1/${id}/${ev.application_id}`,
          { token: accessToken }
        );
        setSelectedDetail(res.evaluation);
      } catch {
        setSelectedDetail(null);
      } finally {
        setDetailLoading(false);
      }
    },
    [accessToken, id, phase1Evals]
  );

  /* ---- Fetch application detail for document tab ---- */
  const fetchAppDetail = useCallback(
    async (partnerId: string) => {
      if (!accessToken) return;
      const ev = phase1Evals.find((e) => e.partner_id === partnerId);
      if (!ev) return;

      setAppDetailLoading(true);
      setSelectedAppDetail(null);
      try {
        const res = await api<{ application: ApplicationDetail }>(
          `/applications/${ev.application_id}`,
          { token: accessToken }
        );
        setSelectedAppDetail(res.application);
      } catch {
        setSelectedAppDetail(null);
      } finally {
        setAppDetailLoading(false);
      }
    },
    [accessToken, phase1Evals]
  );

  /* ---- Fetch detail when selectedPartnerId changes ---- */
  useEffect(() => {
    if (selectedPartnerId) {
      fetchEvalDetail(selectedPartnerId);
      fetchAppDetail(selectedPartnerId);
    }
  }, [selectedPartnerId, fetchEvalDetail, fetchAppDetail]);

  const selectedEval = selectedPartnerId
    ? phase1Evals.find((ev) => ev.partner_id === selectedPartnerId)
    : null;

  const navigateToMitra = (partnerId: string) => {
    router.push(`/projects/${id}/approval/phase1?partnerId=${partnerId}`);
    setPanelTab("penilaian");
    setExpandedDocs({});
  };

  const currentIndex = selectedEval
    ? phase1Evals.findIndex((ev) => ev.partner_id === selectedPartnerId)
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

  /* ---- Ketua Tim handlers ---- */
  const updateKetuaTimMitraDecision = (partnerId: string, decision: KetuaTimMitraDecision) => {
    setKetuaTimMitraStates((prev) =>
      prev.map((m) => (m.partnerId === partnerId ? { ...m, decision } : m))
    );
  };
  const updateKetuaTimMitraNotes = (partnerId: string, notes: string) => {
    setKetuaTimMitraStates((prev) =>
      prev.map((m) => (m.partnerId === partnerId ? { ...m, notes } : m))
    );
  };
  const handleKetuaTimSubmit = () => { setShowConfirm(true); };

  const handleConfirmFinal = async () => {
    if (!approvalRecord || !accessToken) return;

    setSubmitting(true);
    try {
      const reEvalMitra = ketuaTimMitraStates.filter((m) => m.decision === "re-evaluasi");
      const allApproved = reEvalMitra.length === 0;

      let status: string;
      let notes = ketuaTimGlobalNotes;

      if (allApproved) {
        status = "Disetujui";
      } else {
        status = "Dikembalikan";
        // Build notes listing which mitra need re-evaluation
        const reEvalNames = reEvalMitra.map((m) => {
          const ev = phase1Evals.find((e) => e.partner_id === m.partnerId);
          return ev?.partner_name || m.partnerId;
        });
        const reEvalNote = `Mitra yang perlu re-evaluasi: ${reEvalNames.join(", ")}`;
        notes = notes ? `${notes}\n\n${reEvalNote}` : reEvalNote;

        // Append per-mitra notes if any
        for (const m of reEvalMitra) {
          if (m.notes) {
            const ev = phase1Evals.find((e) => e.partner_id === m.partnerId);
            const name = ev?.partner_name || m.partnerId;
            notes += `\n- ${name}: ${m.notes}`;
          }
        }
      }

      await api(`/approvals/${approvalRecord.id}/decide`, {
        method: "PUT",
        body: { status, notes },
        token: accessToken,
      });

      setShowConfirm(false);
      setKetuaTimSubmitted(true);
    } catch (err: any) {
      alert(`Gagal mengirim keputusan: ${err.message || "Terjadi kesalahan"}`);
    } finally {
      setSubmitting(false);
    }
  };

  /* ---- Loading state ---- */
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-10 w-10 text-ptba-navy mx-auto mb-3 animate-spin" />
          <p className="text-sm text-ptba-gray">Memuat data evaluasi...</p>
        </div>
      </div>
    );
  }

  /* ---- Error state ---- */
  if (error || !project) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-ptba-gold mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-ptba-navy mb-1">
            {error ? "Gagal Memuat Data" : "Proyek Tidak Ditemukan"}
          </h2>
          <p className="text-sm text-ptba-gray mb-4">
            {error || `Proyek dengan ID "${id}" tidak tersedia.`}
          </p>
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
          <h2 className="text-lg font-semibold text-ptba-navy mb-1">Belum Ada Evaluasi 1</h2>
          <p className="text-sm text-ptba-gray">Evaluasi 1 belum selesai untuk proyek ini.</p>
        </div>
      </div>
    );
  }

  const isKetuaTim = role === "ketua_tim" || role === "super_admin";
  const isPIC = (role === "ebd" || role === "keuangan" || role === "hukum" || role === "risiko") && !isKetuaTim;
  const allPICDecided = mitraStates.every((m) => m.decision !== "pending");
  const approvedCount = mitraStates.filter((m) => m.decision === "approved").length;
  const rejectedCount = mitraStates.filter((m) => m.decision === "rejected").length;

  const allKetuaTimDecided = ketuaTimMitraStates.every((m) => m.decision !== "pending");
  const ketuaTimSetujuiCount = ketuaTimMitraStates.filter((m) => m.decision === "setujui").length;
  const ketuaTimReEvalCount = ketuaTimMitraStates.filter((m) => m.decision === "re-evaluasi").length;
  const hasReEvalRequests = ketuaTimReEvalCount > 0;

  /* ---- sidebar helpers ---- */
  const getSidebarStatus = (partnerId: string) => {
    const ev = phase1Evals.find((e) => e.partner_id === partnerId);
    const passed = ev?.overall_result === "Lolos";
    const picState = mitraStates.find((m) => m.partnerId === partnerId);
    const dirState = ketuaTimMitraStates.find((m) => m.partnerId === partnerId);

    if (isKetuaTim && ketuaTimSubmitted && dirState) {
      return dirState.decision === "setujui"
        ? { text: "Disetujui", color: "text-green-600" }
        : { text: "Re-evaluasi", color: "text-amber-600" };
    }
    if (isKetuaTim && dirState?.decision !== "pending") {
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
            <h1 className="text-xl font-bold text-ptba-navy">Persetujuan Hasil Evaluasi 1</h1>
            <p className="text-sm text-ptba-gray mt-1">
              Review dan setujui hasil shortlist Fase 1 untuk seluruh mitra sebelum melanjutkan ke Fase 2.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5">
          <SummaryBox label="Total Mitra" value={phase1Evals.length} />
          <SummaryBox label="Lolos" value={phase1Evals.filter((e) => e.overall_result === "Lolos").length} color="green" />
          <SummaryBox label="Tidak Lolos" value={phase1Evals.filter((e) => e.overall_result === "Tidak Lolos").length} color="red" />
          <SummaryBox label="Sistem" value="Lulus / Tidak Lulus" />
        </div>
      </div>

      {/* ---- Sidebar + Detail Layout ---- */}
      <div className={cn("grid grid-cols-1 gap-6", sidebarCollapsed ? "lg:grid-cols-1" : "lg:grid-cols-[280px_1fr]")}>
        {/* Sidebar */}
        <div className="rounded-xl bg-white shadow-sm overflow-hidden">
          <button
            type="button"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-full px-4 py-3 bg-ptba-navy flex items-center justify-between"
          >
            <div>
              <h3 className="text-sm font-semibold text-white text-left">Daftar Mitra ({phase1Evals.length})</h3>
              {!sidebarCollapsed && <p className="text-[10px] text-white/60 mt-0.5 text-left">Pilih mitra untuk direview</p>}
            </div>
            <ChevronDown className={cn("h-4 w-4 text-white/60 transition-transform", !sidebarCollapsed && "rotate-180")} />
          </button>
          {!sidebarCollapsed && <div className="divide-y divide-gray-100">
            {phase1Evals.map((ev) => {
              const passed = ev.overall_result === "Lolos";
              const isSelected = ev.partner_id === selectedPartnerId;
              const status = getSidebarStatus(ev.partner_id);

              return (
                <button
                  key={ev.id}
                  onClick={() => navigateToMitra(ev.partner_id)}
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
                        {ev.partner_name}
                      </p>
                      <p className={cn("text-[10px]", status.color)}>{status.text}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>}
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
                  onClick={() => navigateToMitra(phase1Evals[0].partner_id)}
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
                const passed = ev.overall_result === "Lolos";
                const mitraState = mitraStates.find((m) => m.partnerId === ev.partner_id);
                const ketuaTimMitraState = ketuaTimMitraStates.find((m) => m.partnerId === ev.partner_id);
                const appDetail = selectedAppDetail;
                const formData = appDetail?.form_data;
                const phase1Docs = appDetail?.phase1Documents || [];

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
                            <h3 className="text-lg font-semibold text-ptba-charcoal">{ev.partner_name}</h3>
                            <p className="text-xs text-ptba-gray">
                              Mitra {currentIndex + 1} dari {phase1Evals.length}
                              {appDetail?.applied_at && ` · Mendaftar: ${formatDate(appDetail.applied_at)}`}
                            </p>
                          </div>
                        </div>
                        <span className={cn(
                          "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
                          passed ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                        )}>
                          {ev.overall_result}
                        </span>
                      </div>

                      {/* Prev / Next */}
                      <div className="px-6 py-2.5 bg-gray-50 flex items-center justify-between text-sm border-b border-gray-100">
                        <button
                          onClick={() => prevMitra && navigateToMitra(prevMitra.partner_id)}
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
                          onClick={() => nextMitra && navigateToMitra(nextMitra.partner_id)}
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

                    {/* Penilaian Panel — documents and form data inline */}
                    <div className="rounded-xl bg-white shadow-sm overflow-hidden">

                      {/* Tab: Penilaian */}
                      {(
                        <div className="px-5 py-4">
                          {detailLoading ? (
                            <div className="flex items-center justify-center py-8">
                              <Loader2 className="h-6 w-6 text-ptba-navy animate-spin" />
                              <span className="ml-2 text-sm text-ptba-gray">Memuat detail penilaian...</span>
                            </div>
                          ) : selectedDetail ? (
                            <>
                              {/* Unified sections — same layout as evaluation page */}
                              {(() => {
                                const DOC_SECTION_MAP: Record<string, string[]> = {
                                  compro: ["compro", "nib_document", "org_structure"],
                                  statement_eoi: ["statement_eoi"],
                                  portfolio: ["portfolio", ...phase1Docs.filter((d: any) => (d.document_type_id || "").startsWith("credential_exp_")).map((d: any) => d.document_type_id)],
                                  financial_overview: ["financial_overview", "ebitda_dscr_calculation", "credit_rating_evidence", ...phase1Docs.filter((d: any) => (d.document_type_id || "").startsWith("audited_financial_")).map((d: any) => d.document_type_id)],
                                  requirements_fulfillment: ["requirements_fulfillment"],
                                };
                                const SECTIONS = [
                                  { docId: "compro", formId: "section_compro", title: EVAL_FORM_DATA_MAP.compro?.title || "Informasi Perusahaan", formKey: "compro" },
                                  { docId: "statement_eoi", formId: "section_statement_eoi", title: EVAL_FORM_DATA_MAP.statement_eoi?.title || "Surat Pernyataan EoI", formKey: "statement_eoi" },
                                  { docId: "portfolio", formId: "section_portfolio", title: EVAL_FORM_DATA_MAP.portfolio?.title || "Pengalaman Proyek", formKey: "portfolio" },
                                  { docId: "financial_overview", formId: "section_financial", title: EVAL_FORM_DATA_MAP.financial?.title || "Data Keuangan", formKey: "financial_overview" },
                                  { docId: "requirements_fulfillment", formId: "section_requirements", title: EVAL_FORM_DATA_MAP.requirements?.title || "Pemenuhan Persyaratan", formKey: "requirements_fulfillment" },
                                ];
                                const allMappedDocIds = Object.values(DOC_SECTION_MAP).flat();
                                const additionalDocs = phase1Docs.filter((d: any) => !allMappedDocIds.includes(d.document_type_id));

                                return (
                                  <div className="space-y-4">
                                    {SECTIONS.map((section, sIdx) => {
                                      const docScore = selectedDetail.scores.find((s) => s.criterion_id === section.docId);
                                      const formScore = selectedDetail.scores.find((s) => s.criterion_id === section.formId);
                                      const relatedDocIds = DOC_SECTION_MAP[section.docId] || [section.docId];
                                      const matchedDocs = phase1Docs.filter((d: any) => relatedDocIds.includes(d.document_type_id));
                                      const sectionKey = section.formId.replace("section_", "");
                                      const formRenderer = EVAL_FORM_DATA_MAP[sectionKey];
                                      const isOpen = expandedDocs[`section_${sIdx}`] ?? true;

                                      return (
                                        <div key={sIdx} className="rounded-xl border border-gray-200 overflow-hidden">
                                          <button type="button" onClick={() => setExpandedDocs((prev) => ({ ...prev, [`section_${sIdx}`]: !isOpen }))} className="w-full flex items-center justify-between px-4 py-3 bg-ptba-section-bg hover:bg-ptba-light-gray/30 transition-colors">
                                            <span className="text-sm font-bold text-ptba-navy">{sIdx + 1}. {section.title}</span>
                                            <ChevronDown className={cn("h-4 w-4 text-ptba-gray transition-transform", isOpen && "rotate-180")} />
                                          </button>

                                          {isOpen && (
                                            <div className="p-4 space-y-3">
                                              {formRenderer && formData && (
                                                <div className="rounded-lg border border-gray-200 bg-white p-3">
                                                  {formRenderer.render(formData)}
                                                </div>
                                              )}
                                              {matchedDocs.length > 0 && (
                                                <div className="space-y-1.5">
                                                  <p className="text-[10px] font-semibold text-ptba-gray uppercase">Dokumen ({matchedDocs.length})</p>
                                                  {matchedDocs.map((doc: any) => (
                                                    <div key={doc.document_type_id} className="flex items-center gap-2 rounded border border-gray-200 bg-white px-3 py-2">
                                                      <FileText className="h-4 w-4 text-ptba-steel-blue shrink-0" />
                                                      <div className="flex-1 min-w-0">
                                                        <p className="text-xs text-ptba-charcoal truncate">{doc.name}</p>
                                                        <p className="text-[10px] text-ptba-gray">{doc.status} · {formatDate(doc.upload_date)}</p>
                                                      </div>
                                                      {doc.file_key && (
                                                        <button type="button" onClick={async () => { try { await downloadDocument(doc.file_key, accessToken!, doc.name); } catch {} }} className="inline-flex items-center gap-1 rounded-lg border border-ptba-light-gray px-2 py-1 text-[10px] font-medium text-ptba-gray hover:bg-ptba-section-bg transition-colors shrink-0">
                                                          <Download className="h-3 w-3" /> Unduh
                                                        </button>
                                                      )}
                                                    </div>
                                                  ))}
                                                </div>
                                              )}
                                            </div>
                                          )}

                                          {/* Eval results — always visible, side by side */}
                                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 border-t border-gray-200 bg-gray-50/30">
                                            <div className={cn("rounded-lg border p-3", docScore?.passed ? "border-green-200 bg-green-50/30" : docScore?.passed === false ? "border-red-200 bg-red-50/30" : "border-gray-100 bg-white")}>
                                              <div className="flex items-center justify-between">
                                                <p className="text-xs font-medium text-ptba-gray">Penilaian Dokumen</p>
                                                <span className={cn("px-3 py-1 rounded-full text-xs font-semibold", docScore?.passed ? "bg-green-100 text-green-700" : docScore?.passed === false ? "bg-red-100 text-ptba-red" : "bg-gray-100 text-gray-500")}>{docScore?.passed ? "Lulus" : docScore?.passed === false ? "Tidak Lulus" : "Belum"}</span>
                                              </div>
                                              {docScore?.notes && <p className="mt-1 text-xs text-ptba-gray">{docScore.notes}</p>}
                                            </div>
                                            <div className={cn("rounded-lg border p-3", formScore?.passed ? "border-green-200 bg-green-50/30" : formScore?.passed === false ? "border-red-200 bg-red-50/30" : "border-gray-100 bg-white")}>
                                              <div className="flex items-center justify-between">
                                                <p className="text-xs font-medium text-ptba-gray">Penilaian Data</p>
                                                <span className={cn("px-3 py-1 rounded-full text-xs font-semibold", formScore?.passed ? "bg-green-100 text-green-700" : formScore?.passed === false ? "bg-red-100 text-ptba-red" : "bg-gray-100 text-gray-500")}>{formScore?.passed ? "Lulus" : formScore?.passed === false ? "Tidak Lulus" : "Belum"}</span>
                                              </div>
                                              {formScore?.notes && <p className="mt-1 text-xs text-ptba-gray">{formScore.notes}</p>}
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })}

                                    {/* Additional docs */}
                                    {additionalDocs.length > 0 && (
                                      <div className="rounded-xl border border-gray-200 overflow-hidden">
                                        <div className="px-4 py-3 bg-ptba-section-bg">
                                          <span className="text-sm font-bold text-ptba-navy">6. Dokumen Tambahan ({additionalDocs.length})</span>
                                        </div>
                                        <div className="p-4 space-y-1.5">
                                          {additionalDocs.map((doc: any) => (
                                            <div key={doc.document_type_id} className="flex items-center gap-2 rounded border border-gray-200 bg-white px-3 py-2">
                                              <FileText className="h-4 w-4 text-ptba-steel-blue shrink-0" />
                                              <div className="flex-1 min-w-0">
                                                <p className="text-xs text-ptba-charcoal truncate">{doc.name}</p>
                                                <p className="text-[10px] text-ptba-gray">{doc.status} · {formatDate(doc.upload_date)}</p>
                                              </div>
                                              {doc.file_key && (
                                                <button type="button" onClick={async () => { try { await downloadDocument(doc.file_key, accessToken!, doc.name); } catch {} }} className="inline-flex items-center gap-1 rounded-lg border border-ptba-light-gray px-2 py-1 text-[10px] font-medium text-ptba-gray hover:bg-ptba-section-bg transition-colors shrink-0">
                                                  <Download className="h-3 w-3" /> Unduh
                                                </button>
                                              )}
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })()}

                              <div className="mt-3 rounded-lg bg-ptba-section-bg p-3">
                                <div className="flex items-center justify-between">
                                  <p className="text-sm font-medium text-ptba-gray">Hasil Evaluasi</p>
                                  <p className={cn("text-lg font-bold", selectedDetail.overall_result === "Lolos" ? "text-green-600" : "text-ptba-red")}>
                                    {selectedDetail.overall_result}
                                  </p>
                                </div>
                                <p className="text-xs text-ptba-gray mt-1">
                                  {selectedDetail.scores.filter((s) => s.passed).length} / {selectedDetail.scores.length} item Lulus
                                </p>
                              </div>
                              {selectedDetail.notes && (
                                <div className="mt-3 rounded-lg bg-ptba-section-bg px-4 py-3">
                                  <p className="text-xs font-medium text-ptba-navy mb-1">Catatan Evaluator</p>
                                  <p className="text-sm text-ptba-charcoal">{selectedDetail.notes}</p>
                                </div>
                              )}
                              <div className="mt-3 flex flex-wrap gap-4 text-xs text-ptba-gray">
                                <span>Tanggal: {formatDate(selectedDetail.evaluated_at)}</span>
                              </div>
                            </>
                          ) : (
                            <div className="text-center py-6">
                              <AlertTriangle className="h-8 w-8 text-ptba-gold mx-auto mb-2" />
                              <p className="text-sm text-ptba-gray">Gagal memuat detail penilaian.</p>
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
                            <button type="button" onClick={() => updateMitraDecision(ev.partner_id, "approved")}
                              className={cn("inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                                mitraState?.decision === "approved" ? "bg-green-600 text-white" : "bg-white border border-green-300 text-green-700 hover:bg-green-50"
                              )}>
                              <CheckCircle2 className="h-4 w-4" /> Setujui Hasil
                            </button>
                            <button type="button" onClick={() => updateMitraDecision(ev.partner_id, "rejected")}
                              className={cn("inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                                mitraState?.decision === "rejected" ? "bg-red-600 text-white" : "bg-white border border-red-300 text-red-700 hover:bg-red-50"
                              )}>
                              <XCircle className="h-4 w-4" /> Tidak Setuju
                            </button>
                          </div>
                          <textarea
                            value={mitraState?.notes ?? ""}
                            onChange={(e) => updateMitraNotes(ev.partner_id, e.target.value)}
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

                    {/* Ketua Tim per-mitra decision */}
                    {isKetuaTim && !ketuaTimSubmitted && (
                      <div className="rounded-xl bg-white shadow-sm overflow-hidden">
                        <div className="px-5 py-4 bg-blue-50/50 border-t-2 border-ptba-navy/20">
                          <p className="text-xs font-semibold text-ptba-navy mb-3 flex items-center gap-1.5">
                            <ShieldCheck className="h-3.5 w-3.5" /> Keputusan Pimpinan untuk Mitra Ini
                          </p>
                          <div className="flex flex-col sm:flex-row gap-3">
                            <button type="button" onClick={() => updateKetuaTimMitraDecision(ev.partner_id, "setujui")}
                              className={cn("inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                                ketuaTimMitraState?.decision === "setujui" ? "bg-green-600 text-white shadow-sm" : "bg-white border border-green-300 text-green-700 hover:bg-green-50"
                              )}>
                              <CheckCircle2 className="h-4 w-4" /> Setujui Hasil
                            </button>
                            <button type="button" onClick={() => updateKetuaTimMitraDecision(ev.partner_id, "re-evaluasi")}
                              className={cn("inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                                ketuaTimMitraState?.decision === "re-evaluasi" ? "bg-amber-500 text-white shadow-sm" : "bg-white border border-amber-300 text-amber-700 hover:bg-amber-50"
                              )}>
                              <RotateCcw className="h-4 w-4" /> Minta Re-evaluasi oleh EBD
                            </button>
                          </div>
                          <textarea
                            value={ketuaTimMitraState?.notes ?? ""}
                            onChange={(e) => updateKetuaTimMitraNotes(ev.partner_id, e.target.value)}
                            placeholder={ketuaTimMitraState?.decision === "re-evaluasi" ? "Jelaskan apa yang perlu di-review ulang oleh EBD..." : "Catatan Ketua Tim (opsional)..."}
                            rows={2}
                            className="mt-3 w-full rounded-lg border border-ptba-light-gray bg-white px-3 py-2 text-sm text-ptba-charcoal placeholder:text-ptba-gray/60 focus:outline-none focus:ring-2 focus:ring-ptba-steel-blue/40"
                          />
                        </div>
                      </div>
                    )}

                    {isKetuaTim && ketuaTimSubmitted && ketuaTimMitraState && (
                      <div className={cn("rounded-xl p-4 flex items-center gap-2 text-sm",
                        ketuaTimMitraState.decision === "setujui" ? "bg-green-50 border border-green-200" : "bg-amber-50 border border-amber-200"
                      )}>
                        {ketuaTimMitraState.decision === "setujui"
                          ? <CheckCircle2 className="h-4 w-4 text-green-600" />
                          : <RotateCcw className="h-4 w-4 text-amber-600" />}
                        <span className={cn("font-medium", ketuaTimMitraState.decision === "setujui" ? "text-green-700" : "text-amber-700")}>
                          {ketuaTimMitraState.decision === "setujui" ? "Hasil Disetujui" : "Dikembalikan ke EBD untuk Re-evaluasi"}
                        </span>
                        {ketuaTimMitraState.notes && <span className="text-ptba-gray ml-2">— {ketuaTimMitraState.notes}</span>}
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
                <p className="text-xs text-green-700 mt-0.5">Keputusan Anda telah dikirim untuk persetujuan akhir.</p>
              </div>
            </div>
          )}

          {/* Ketua Tim submit */}
          {isKetuaTim && !ketuaTimSubmitted && (
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <div className="flex items-start gap-3 mb-5">
                <ShieldCheck className="h-5 w-5 text-ptba-navy mt-0.5 shrink-0" />
                <div>
                  <h2 className="text-base font-semibold text-ptba-navy">Keputusan Akhir Ketua Tim</h2>
                  <p className="text-xs text-ptba-gray mt-0.5">
                    Pilih keputusan untuk setiap mitra di atas, lalu kirim keputusan akhir.
                  </p>
                </div>
              </div>

              <div className="rounded-lg border border-ptba-light-gray bg-ptba-section-bg p-4 mb-5">
                <p className="text-xs font-semibold text-ptba-navy mb-3">Ringkasan Keputusan Per Mitra</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="rounded-lg bg-white p-3 text-center">
                    <p className="text-2xl font-bold text-ptba-gray">{ketuaTimMitraStates.filter((m) => m.decision === "pending").length}</p>
                    <p className="text-xs text-ptba-gray">Belum Diputuskan</p>
                  </div>
                  <div className="rounded-lg bg-white p-3 text-center">
                    <p className="text-2xl font-bold text-green-600">{ketuaTimSetujuiCount}</p>
                    <p className="text-xs text-green-700">Disetujui</p>
                  </div>
                  <div className="rounded-lg bg-white p-3 text-center">
                    <p className="text-2xl font-bold text-amber-600">{ketuaTimReEvalCount}</p>
                    <p className="text-xs text-amber-700">Minta Re-evaluasi</p>
                  </div>
                </div>
              </div>

              <textarea
                value={ketuaTimGlobalNotes}
                onChange={(e) => setketuaTimGlobalNotes(e.target.value)}
                placeholder="Catatan umum Ketua Tim (opsional)..."
                rows={3}
                className="w-full rounded-lg border border-ptba-light-gray bg-white px-3 py-2 text-sm text-ptba-charcoal placeholder:text-ptba-gray/60 focus:outline-none focus:ring-2 focus:ring-ptba-steel-blue/40 mb-4"
              />

              <button type="button" onClick={handleKetuaTimSubmit} disabled={!allKetuaTimDecided}
                className={cn("w-full inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold transition-colors",
                  allKetuaTimDecided ? "bg-ptba-navy text-white hover:bg-ptba-navy/90 shadow-md" : "bg-gray-200 text-gray-400 cursor-not-allowed"
                )}>
                <Send className="h-4 w-4" />
                {!allKetuaTimDecided ? "Putuskan semua mitra terlebih dahulu"
                  : hasReEvalRequests ? `Kirim Keputusan (${ketuaTimSetujuiCount} Setujui, ${ketuaTimReEvalCount} Re-evaluasi)`
                  : `Setujui Semua & Lanjutkan ke Fase 2`}
              </button>
            </div>
          )}

          {isKetuaTim && ketuaTimSubmitted && (
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
                    ? `${ketuaTimReEvalCount} mitra dikembalikan ke EBD. ${ketuaTimSetujuiCount} mitra disetujui.`
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
              <h3 className="text-lg font-bold text-ptba-navy">Konfirmasi Keputusan</h3>
            </div>
            <p className="text-sm text-ptba-charcoal mb-4">
              Anda akan mengirim keputusan untuk proyek <span className="font-semibold">{project.name}</span>:
            </p>
            <div className="space-y-2 mb-5">
              {ketuaTimSetujuiCount > 0 && (
                <div className="rounded-lg bg-green-50 border border-green-200 p-3 flex items-center gap-3">
                  <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-green-800">{ketuaTimSetujuiCount} mitra disetujui</p>
                    <p className="text-xs text-green-700">Hasil evaluasi diterima, lanjut ke Fase 2</p>
                  </div>
                </div>
              )}
              {ketuaTimReEvalCount > 0 && (
                <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 flex items-center gap-3">
                  <RotateCcw className="h-4 w-4 text-amber-600 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-amber-800">{ketuaTimReEvalCount} mitra diminta re-evaluasi</p>
                    <p className="text-xs text-amber-700">Dikembalikan ke EBD untuk dicek ulang</p>
                  </div>
                </div>
              )}
            </div>
            <div className="rounded-lg border border-ptba-light-gray bg-ptba-section-bg p-3 mb-5">
              <p className="text-xs font-medium text-ptba-navy mb-2">Detail per mitra:</p>
              <div className="space-y-1.5">
                {ketuaTimMitraStates.map((m) => {
                  const mEv = phase1Evals.find((e) => e.partner_id === m.partnerId);
                  return (
                    <div key={m.partnerId} className="flex items-center gap-2 text-xs">
                      {m.decision === "setujui" ? <CheckCircle2 className="h-3.5 w-3.5 text-green-600 shrink-0" /> : <RotateCcw className="h-3.5 w-3.5 text-amber-600 shrink-0" />}
                      <span className="text-ptba-charcoal font-medium">{mEv?.partner_name ?? m.partnerId}</span>
                      <span className={cn("ml-auto", m.decision === "setujui" ? "text-green-700" : "text-amber-700")}>
                        {m.decision === "setujui" ? "Disetujui" : "Re-evaluasi"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setShowConfirm(false)} disabled={submitting}
                className="flex-1 rounded-lg border border-ptba-light-gray px-4 py-2 text-sm font-medium text-ptba-charcoal hover:bg-gray-50 transition-colors">
                Batal
              </button>
              <button type="button" onClick={handleConfirmFinal} disabled={submitting}
                className={cn("flex-1 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors inline-flex items-center justify-center gap-2",
                  hasReEvalRequests ? "bg-ptba-navy hover:bg-ptba-navy/90" : "bg-green-600 hover:bg-green-700",
                  submitting && "opacity-70 cursor-not-allowed"
                )}>
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {submitting ? "Mengirim..." : "Ya, Kirim Keputusan"}
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
