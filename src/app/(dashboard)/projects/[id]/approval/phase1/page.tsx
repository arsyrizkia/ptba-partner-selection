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
import { api, projectApi, downloadDocument, fetchWithAuth } from "@/lib/api/client";
// import { ALL_FILTRATION_ITEMS } from "@/lib/constants/phase1-criteria";
import { DOCUMENT_TYPES } from "@/lib/constants/document-types";
import { formatDate } from "@/lib/utils/format";
import { generateApplicationPdf } from "@/lib/utils/generate-application-pdf";
import FormDataViewer from "@/components/features/project/form-data-viewer";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

const CATEGORY_LABELS: Record<string, string> = {
  pasar: "Pasar", teknis: "Teknis", komersial: "Komersial",
  keuangan: "Keuangan", hukum: "Hukum", risiko: "Risiko",
};
const ALL_CATEGORIES = Object.keys(CATEGORY_LABELS);

/** Normalize verdict: "layak" → "Layak", "tidak layak" → "Tidak Layak" */
function normalizeVerdict(v: string | null | undefined): string | null {
  if (!v) return null;
  const lower = v.toLowerCase();
  if (lower === "layak") return "Layak";
  if (lower === "tidak layak") return "Tidak Layak";
  return v;
}

interface CatEvalRaw {
  id: string;
  application_id: string;
  evaluator_id: string;
  category: string;
  verdict: string | null;
  is_finalized: boolean;
  evaluated_at: string;
  partner_id: string;
  partner_name: string;
  evaluator_name: string;
  application_status: string;
}

interface MitraCatSummary {
  partner_id: string;
  partner_name: string;
  application_id: string;
  categories: Record<string, { verdict: string | null; isFinalized: boolean; evaluatorName: string; comment?: string; evidence?: any[] }>;
  overall_result: string; // "Layak" if all 6 finalized & Layak, else "Tidak Layak"
  allFinalized: boolean;
}

interface CatEvalDetail {
  category: string;
  verdict: string | null;
  comment: string;
  notes: string;
  isFinalized: boolean;
  evaluatorName: string;
  evidence: { id: string; fileName: string; fileKey: string }[];
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

type KetuaTimMitraDecision = "pending" | "layak" | "tidak_layak";

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
        {(fd.companyVision || fd.companyMission) && (
          <dl className="grid grid-cols-2 gap-x-6 gap-y-2">
            <EvalField label="Visi" value={fd.companyVision} />
            <EvalField label="Misi" value={fd.companyMission} />
          </dl>
        )}
        {fd.companyHistory && (
          <dl className="grid grid-cols-2 gap-x-6 gap-y-2">
            <EvalField label="Sejarah & Milestone" value={fd.companyHistory} />
          </dl>
        )}
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
          <EvalField label="Status Perusahaan" value={fd.companyStatus} />
        </dl>
        {fd.shareholderComposition && (
          <dl className="grid grid-cols-2 gap-x-6 gap-y-2">
            <EvalField label="Komposisi Pemegang Saham" value={fd.shareholderComposition} />
          </dl>
        )}
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
        <EvalField label="Tipe Pemegang Saham" value={fd.shareholderType === "majority" ? "Pemegang Saham Mayoritas (>50%)" : fd.shareholderType === "minority" ? "Pemegang Saham Minoritas (45–50%)" : fd.shareholderType} />
        <EvalField label="Ekuitas Joint Venture" value={fd.minorityEquityPercent ? `${fd.minorityEquityPercent}%` : undefined} />
        <EvalField label="Dapat Dinegosiasikan" value={fd.equityNegotiable === "yes" ? "Ya" : fd.equityNegotiable === "no" ? "Tidak" : fd.equityNegotiable} />
        {fd.equityNegotiable === "yes" && fd.shareholderType === "majority" && (
          <EvalField label="Dapat Menjadi Minoritas" value={fd.canBecomeMinority === "yes" ? "Ya" : fd.canBecomeMinority === "no" ? "Tidak" : fd.canBecomeMinority} />
        )}
        {fd.equityNegotiable === "yes" && (
          <EvalField label="Ekuitas Minimum yang Diterima" value={fd.equityMinPercent ? `${fd.equityMinPercent}%` : undefined} />
        )}
        <EvalField label="Cash on Hand" value={fd.cashOnHand ? `$ ${fd.cashOnHand} Mn` : undefined} />
        <EvalField label="Menyetujui EoI" value={fd.eoiAgreed ? "Ya" : "Tidak"} />
      </dl>
    ),
  },
  portfolio: {
    title: "Pengalaman Proyek",
    render: (fd) => {
      const exps = fd.experiences || [];
      if (exps.length === 0) return <p className="text-xs text-ptba-gray">Tidak ada data pengalaman.</p>;
      const catLabels: Record<string, string> = { developer: "Developer", om_contractor: "O&M Contractor", financing: "Pembiayaan", general: "Proyek Umum" };
      return (
        <div className="space-y-2">
          {exps.map((exp: any, i: number) => (
            <div key={i} className="rounded-lg border border-ptba-light-gray/50 p-2.5">
              <p className="text-[10px] font-semibold text-ptba-charcoal mb-1">Pengalaman #{i + 1} — {catLabels[exp.category] || exp.category}</p>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-1">
                <EvalField label="Nama Proyek / Pembangkit" value={exp.plantName} />
                <EvalField label="Lokasi" value={exp.location} />
                {exp.totalCapacityMW && <EvalField label="Kapasitas (MW)" value={exp.totalCapacityMW} />}
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
                {exp.category === "general" && <>
                  <EvalField label="Jenis Proyek" value={exp.projectType} />
                  <EvalField label="Peran" value={exp.role} />
                  {exp.contractValueUSD && <EvalField label="Nilai Kontrak (USD)" value={exp.contractValueUSD} />}
                  <EvalField label="Tahun" value={exp.year} />
                  {exp.description && <EvalField label="Deskripsi" value={exp.description} />}
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
                  <th className="py-1 text-left text-ptba-gray font-medium">Mata Uang</th>
                  <th className="py-1 text-left text-ptba-gray font-medium">Total Liability</th>
                  <th className="py-1 text-left text-ptba-gray font-medium">Total Equity</th>
                  <th className="py-1 text-left text-ptba-gray font-medium">Total Asset</th>
                  <th className="py-1 text-left text-ptba-gray font-medium">EBITDA</th>
                  <th className="py-1 text-left text-ptba-gray font-medium">DSCR</th>
                </tr>
              </thead>
              <tbody>
                {years.map((fy: any, i: number) => (
                  <tr key={i} className="border-b border-ptba-light-gray/30">
                    <td className="py-1 text-ptba-charcoal">{fy.year}</td>
                    <td className="py-1 text-ptba-charcoal font-medium">{fy.currency || "-"}</td>
                    <td className="py-1 text-ptba-charcoal">{fy.totalDebt || "-"}</td>
                    <td className="py-1 text-ptba-charcoal">{fy.totalEquity || "-"}</td>
                    <td className="py-1 text-ptba-charcoal font-medium">{fy.totalAsset || "-"}</td>
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
  const { role, accessToken, user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  /* ---- loading / data state ---- */
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [project, setProject] = useState<{ id: string; name: string; [key: string]: unknown } | null>(null);
  const [mitraSummaries, setMitraSummaries] = useState<MitraCatSummary[]>([]);
  const [approvalRecord, setApprovalRecord] = useState<ApprovalRecord | null>(null);

  /* ---- detail loading for selected mitra ---- */
  const [selectedCatDetails, setSelectedCatDetails] = useState<CatEvalDetail[]>([]);
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
  const [plenoFile, setPlenoFile] = useState<File | null>(null);
  const [plenoUploading, setPlenoUploading] = useState(false);
  const [plenoUploaded, setPlenoUploaded] = useState<{ fileKey: string; fileName: string } | null>(null);

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
        const [projectRes, catEvalsRes, approvalsRes] = await Promise.all([
          projectApi(accessToken!).getById(id),
          api<CatEvalRaw[]>(`/evaluations/phase1-cat/${id}`, { token: accessToken! }),
          api<{ approvals: ApprovalRecord[] }>(`/approvals?project_id=${id}&type=phase1_evaluation`, { token: accessToken! }),
        ]);

        if (cancelled) return;

        setProject(projectRes.data);

        // Group category evals by partner
        const rawEvals = Array.isArray(catEvalsRes) ? catEvalsRes : (catEvalsRes as any).evaluations || [];
        const byPartner = new Map<string, MitraCatSummary>();
        for (const ev of rawEvals) {
          if (!byPartner.has(ev.partner_id)) {
            byPartner.set(ev.partner_id, {
              partner_id: ev.partner_id,
              partner_name: ev.partner_name,
              application_id: ev.application_id,
              categories: {},
              overall_result: "Tidak Layak",
              allFinalized: false,
            });
          }
          const entry = byPartner.get(ev.partner_id)!;
          entry.categories[ev.category] = {
            verdict: normalizeVerdict(ev.verdict),
            isFinalized: ev.is_finalized,
            evaluatorName: ev.evaluator_name,
          };
        }
        // Compute overall result
        const summaries = Array.from(byPartner.values()).map((s) => {
          const cats = Object.values(s.categories);
          s.allFinalized = ALL_CATEGORIES.every((c) => s.categories[c]?.isFinalized);
          s.overall_result = s.allFinalized && ALL_CATEGORIES.every((c) => s.categories[c]?.verdict === "Layak") ? "Layak" : "Tidak Layak";
          return s;
        });
        setMitraSummaries(summaries);

        // Find the approval record for this project
        const approvals = approvalsRes.approvals || [];
        const approval = approvals.find(
          (a) => a.project_id === id && a.type === "phase1_evaluation"
        ) || null;
        setApprovalRecord(approval);

        const alreadyDecided = approval && approval.status !== "Menunggu";

        // If already decided, set states based on approval outcome
        if (alreadyDecided) {
          setSubmitted(true);
          setKetuaTimSubmitted(true);

          const isApproved = approval.status === "Disetujui";
          setMitraStates(
            summaries.map((s) => ({
              partnerId: s.partner_id,
              decision: "approved" as const,
              notes: "",
            }))
          );
          setKetuaTimMitraStates(
            summaries.map((s) => ({
              partnerId: s.partner_id,
              decision: isApproved ? "layak" as const : "tidak_layak" as const,
              notes: (approval.notes as string) || "",
            }))
          );
        } else {
          // Initialize as pending
          setMitraStates(
            summaries.map((s) => ({
              partnerId: s.partner_id,
              decision: "pending" as const,
              notes: "",
            }))
          );
          setKetuaTimMitraStates(
            summaries.map((s) => ({
              partnerId: s.partner_id,
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

  /* ---- Fetch detail evaluations when a mitra is selected ---- */
  const fetchEvalDetail = useCallback(
    async (partnerId: string) => {
      if (!accessToken) return;
      const s = mitraSummaries.find((m) => m.partner_id === partnerId);
      if (!s) return;

      setDetailLoading(true);
      setSelectedCatDetails([]);
      try {
        const res = await api<{ evaluations: any[] }>(
          `/evaluations/phase1-cat/${id}/${s.application_id}`,
          { token: accessToken }
        );
        const evals = res.evaluations || [];
        setSelectedCatDetails(evals.map((e: any) => ({
          category: e.category,
          verdict: normalizeVerdict(e.verdict),
          comment: e.comment || "",
          notes: e.notes || "",
          isFinalized: e.isFinalized || e.is_finalized || false,
          evaluatorName: e.evaluatorName || e.evaluator_name || "",
          evidence: (e.evidence || e.evidenceFiles || []).map((f: any) => ({
            id: f.id,
            fileName: f.fileName || f.file_name || f.name,
            fileKey: f.fileKey || f.file_key,
          })),
        })));
      } catch {
        setSelectedCatDetails([]);
      } finally {
        setDetailLoading(false);
      }
    },
    [accessToken, id, mitraSummaries]
  );

  /* ---- Fetch application detail for document tab ---- */
  const fetchAppDetail = useCallback(
    async (partnerId: string) => {
      if (!accessToken) return;
      const s = mitraSummaries.find((m) => m.partner_id === partnerId);
      if (!s) return;

      setAppDetailLoading(true);
      setSelectedAppDetail(null);
      try {
        const res = await api<{ application: ApplicationDetail }>(
          `/applications/${s.application_id}`,
          { token: accessToken }
        );
        setSelectedAppDetail(res.application);
      } catch {
        setSelectedAppDetail(null);
      } finally {
        setAppDetailLoading(false);
      }
    },
    [accessToken, mitraSummaries]
  );

  /* ---- Fetch detail when selectedPartnerId changes ---- */
  useEffect(() => {
    if (selectedPartnerId) {
      fetchEvalDetail(selectedPartnerId);
      fetchAppDetail(selectedPartnerId);
    }
  }, [selectedPartnerId, fetchEvalDetail, fetchAppDetail]);

  const selectedEval = selectedPartnerId
    ? mitraSummaries.find((s) => s.partner_id === selectedPartnerId)
    : null;

  const navigateToMitra = (partnerId: string) => {
    router.push(`/projects/${id}/approval/phase1?partnerId=${partnerId}`);
    setPanelTab("penilaian");
    setExpandedDocs({});
  };

  const currentIndex = selectedEval
    ? mitraSummaries.findIndex((s) => s.partner_id === selectedPartnerId)
    : -1;
  const prevMitra = currentIndex > 0 ? mitraSummaries[currentIndex - 1] : null;
  const nextMitra = currentIndex >= 0 && currentIndex < mitraSummaries.length - 1
    ? mitraSummaries[currentIndex + 1] : null;

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
      const tidakLayakMitra = ketuaTimMitraStates.filter((m) => m.decision === "tidak_layak");
      const allLayak = tidakLayakMitra.length === 0;

      let status: string;
      let notes = ketuaTimGlobalNotes;

      if (allLayak) {
        status = "Disetujui";
      } else {
        status = "Disetujui";
        // Build notes listing which mitra are tidak layak
        const tidakLayakNames = tidakLayakMitra.map((m) => {
          const s = mitraSummaries.find((ms) => ms.partner_id === m.partnerId);
          return s?.partner_name || m.partnerId;
        });
        const tdkNote = `Mitra Tidak Layak: ${tidakLayakNames.join(", ")}`;
        notes = notes ? `${notes}\n\n${tdkNote}` : tdkNote;

        // Append per-mitra notes if any
        for (const m of tidakLayakMitra) {
          if (m.notes) {
            const s = mitraSummaries.find((ms) => ms.partner_id === m.partnerId);
            const name = s?.partner_name || m.partnerId;
            notes += `\n- ${name}: ${m.notes}`;
          }
        }
      }

      await api(`/approvals/${approvalRecord.id}/decide`, {
        method: "PUT",
        body: {
          status, notes,
          pleno_document_key: plenoUploaded?.fileKey,
          pleno_document_name: plenoUploaded?.fileName,
        },
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

  if (mitraSummaries.length === 0) {
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

  // Access control: only super_admin and ketua_tim PIC can access approval
  const phase1KetuaPics = ((project as any)?.phasePics || []).filter((p: any) => p.phase === "phase1" && p.role === "ketua_tim");
  const isKetuaTim = role === "super_admin" || (role === "ketua_tim" && phase1KetuaPics.some((p: any) => p.userId === user?.id));
  const isPIC = (role === "ebd" || role === "keuangan" || role === "hukum" || role === "risiko") && !isKetuaTim;

  if (!isKetuaTim) {
    return (
      <div className="space-y-6">
        <BackHeader projectId={id} projectName={project.name} />
        <div className="rounded-xl bg-white p-6 shadow-sm border border-red-200">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle className="h-5 w-5 text-ptba-red" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-ptba-red">Akses Ditolak</h2>
              <p className="text-sm text-ptba-gray mt-1">
                Halaman persetujuan hanya dapat diakses oleh Ketua Tim atau Super Admin.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  const allPICDecided = mitraStates.every((m) => m.decision !== "pending");
  const approvedCount = mitraStates.filter((m) => m.decision === "approved").length;
  const rejectedCount = mitraStates.filter((m) => m.decision === "rejected").length;

  const allKetuaTimDecided = ketuaTimMitraStates.every((m) => m.decision !== "pending");
  const ketuaTimLayakCount = ketuaTimMitraStates.filter((m) => m.decision === "layak").length;
  const ketuaTimTdkLayakCount = ketuaTimMitraStates.filter((m) => m.decision === "tidak_layak").length;

  /* ---- sidebar helpers ---- */
  const getSidebarStatus = (partnerId: string) => {
    const s = mitraSummaries.find((m) => m.partner_id === partnerId);
    const passed = s?.overall_result === "Layak";
    const picState = mitraStates.find((m) => m.partnerId === partnerId);
    const dirState = ketuaTimMitraStates.find((m) => m.partnerId === partnerId);

    if (isKetuaTim && ketuaTimSubmitted && dirState) {
      return dirState.decision === "layak"
        ? { text: "Layak", color: "text-green-600" }
        : { text: "Tidak Layak", color: "text-ptba-red" };
    }
    if (isKetuaTim && dirState?.decision !== "pending") {
      return dirState?.decision === "layak"
        ? { text: "Layak", color: "text-green-600" }
        : { text: "Tidak Layak", color: "text-ptba-red" };
    }
    if (isPIC && submitted && picState) {
      return picState.decision === "approved"
        ? { text: "Layak", color: "text-green-600" }
        : { text: "Tidak Layak", color: "text-ptba-red" };
    }
    return passed
      ? { text: "Layak", color: "text-green-600" }
      : { text: "Tidak Layak", color: "text-ptba-red" };
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
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-5">
          <SummaryBox label="Total Mitra" value={mitraSummaries.length} />
          <SummaryBox label="Layak" value={mitraSummaries.filter((s) => s.overall_result === "Layak").length} color="green" />
          <SummaryBox label="Tidak Layak" value={mitraSummaries.filter((s) => s.overall_result !== "Layak").length} color="red" />
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
              <h3 className="text-sm font-semibold text-white text-left">Daftar Mitra ({mitraSummaries.length})</h3>
              {!sidebarCollapsed && <p className="text-[10px] text-white/60 mt-0.5 text-left">Pilih mitra untuk direview</p>}
            </div>
            <ChevronDown className={cn("h-4 w-4 text-white/60 transition-transform", !sidebarCollapsed && "rotate-180")} />
          </button>
          {!sidebarCollapsed && <div className="divide-y divide-gray-100">
            {mitraSummaries.map((s) => {
              const passed = s.overall_result === "Layak";
              const isSelected = s.partner_id === selectedPartnerId;
              const status = getSidebarStatus(s.partner_id);

              return (
                <button
                  key={s.partner_id}
                  onClick={() => navigateToMitra(s.partner_id)}
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
                        {s.partner_name}
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
              {mitraSummaries.length > 0 && (
                <button
                  onClick={() => navigateToMitra(mitraSummaries[0].partner_id)}
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
                const passed = ev.overall_result === "Layak";
                const mitraState = mitraStates.find((m) => m.partnerId === ev.partner_id);
                const ketuaTimMitraState = ketuaTimMitraStates.find((m) => m.partnerId === ev.partner_id);
                const appDetail = selectedAppDetail;

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
                              Mitra {currentIndex + 1} dari {mitraSummaries.length}
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
                        <span className="text-xs text-ptba-gray">{currentIndex + 1} / {mitraSummaries.length}</span>
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

                    {/* Tabs: Penilaian / Dokumen & Formulir */}
                    <div className="rounded-xl bg-white shadow-sm overflow-hidden">
                      <div className="flex border-b border-gray-200">
                        {(["penilaian", "dokumen_formulir"] as const).map((tab) => (
                          <button key={tab} type="button" onClick={() => setPanelTab(tab)}
                            className={cn("flex-1 py-3 text-sm font-medium transition-colors border-b-2",
                              panelTab === tab ? "border-ptba-navy text-ptba-navy" : "border-transparent text-ptba-gray hover:text-ptba-charcoal"
                            )}>
                            {tab === "penilaian" ? "Penilaian" : "Dokumen & Formulir"}
                          </button>
                        ))}
                      </div>

                      {panelTab === "penilaian" && (
                        <div className="px-5 py-4">
                          {detailLoading ? (
                            <div className="flex items-center justify-center py-8">
                              <Loader2 className="h-6 w-6 text-ptba-navy animate-spin" />
                              <span className="ml-2 text-sm text-ptba-gray">Memuat detail penilaian...</span>
                            </div>
                          ) : selectedCatDetails.length > 0 ? (
                            <>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                                {ALL_CATEGORIES.map((cat) => {
                                  const detail = selectedCatDetails.find((d) => d.category === cat);
                                  const verdict = detail?.verdict;
                                  const finalized = detail?.isFinalized;
                                  const isOpen = expandedDocs[`cat_${cat}`] ?? false;
                                  return (
                                    <div key={cat} className={cn("rounded-lg border overflow-hidden", finalized ? (verdict === "Layak" ? "border-green-200" : "border-red-200") : "border-gray-200")}>
                                      <button type="button" onClick={() => finalized && setExpandedDocs((prev) => ({ ...prev, [`cat_${cat}`]: !isOpen }))} className={cn("w-full flex items-center justify-between px-3 py-2.5 transition-colors", finalized ? "bg-ptba-section-bg hover:bg-ptba-light-gray/30 cursor-pointer" : "bg-gray-50 cursor-default")}>
                                        <div className="flex items-center gap-2">
                                          {finalized ? (
                                            verdict === "Layak" ? <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" /> : <XCircle className="h-4 w-4 text-red-600 shrink-0" />
                                          ) : (
                                            <div className="h-4 w-4 rounded-full border-2 border-gray-300 shrink-0" />
                                          )}
                                          <span className="text-sm font-semibold text-ptba-navy">{CATEGORY_LABELS[cat]}</span>
                                        </div>
                                        {finalized && <ChevronDown className={cn("h-3.5 w-3.5 text-ptba-gray transition-transform", isOpen && "rotate-180")} />}
                                      </button>
                                      {isOpen && detail && (
                                        <div className="px-3 pb-3 pt-1 space-y-2 border-t border-gray-100">
                                          {detail.evaluatorName && <p className="text-[10px] text-ptba-gray">Evaluator: {detail.evaluatorName}</p>}
                                          {detail.comment && (
                                            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 prose prose-sm max-w-none text-xs" dangerouslySetInnerHTML={{ __html: detail.comment }} />
                                          )}
                                          {detail.evidence.length > 0 && (
                                            <div className="space-y-1">
                                              <p className="text-[10px] font-semibold text-ptba-gray uppercase">Bukti Pendukung</p>
                                              {detail.evidence.map((f) => (
                                                <div key={f.id} className="flex items-center gap-2 text-xs">
                                                  <FileText className="h-3.5 w-3.5 text-ptba-steel-blue" />
                                                  <span className="truncate flex-1">{f.fileName}</span>
                                                  {f.fileKey && accessToken && (
                                                    <button type="button" onClick={() => downloadDocument(f.fileKey, accessToken!, f.fileName)} className="text-ptba-steel-blue hover:text-ptba-navy">
                                                      <Download className="h-3 w-3" />
                                                    </button>
                                                  )}
                                                </div>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>

                              {/* Overall result */}
                              <div className="rounded-lg bg-ptba-section-bg p-3">
                                <div className="flex items-center justify-between">
                                  <p className="text-sm font-medium text-ptba-gray">Hasil Evaluasi</p>
                                  <p className={cn("text-lg font-bold", passed ? "text-green-600" : "text-ptba-red")}>
                                    {ev.overall_result}
                                  </p>
                                </div>
                                <p className="text-xs text-ptba-gray mt-1">
                                  {selectedCatDetails.filter((d) => d.verdict === "Layak").length} / {ALL_CATEGORIES.length} kategori Layak
                                </p>
                              </div>
                            </>
                          ) : (
                            <div className="text-center py-6">
                              <AlertTriangle className="h-8 w-8 text-ptba-gold mx-auto mb-2" />
                              <p className="text-sm text-ptba-gray">Belum ada evaluasi kategori untuk mitra ini.</p>
                            </div>
                          )}
                        </div>
                      )}

                      {panelTab === "dokumen_formulir" && (
                        <div className="px-5 py-4">
                          {appDetailLoading ? (
                            <div className="flex items-center justify-center py-8">
                              <Loader2 className="h-6 w-6 text-ptba-navy animate-spin" />
                              <span className="ml-2 text-sm text-ptba-gray">Memuat dokumen...</span>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              {/* Action buttons */}
                              <div className="flex flex-wrap gap-2">
                                {appDetail?.form_data && (
                                  <button type="button" onClick={() => { try { generateApplicationPdf(ev.partner_name || "Mitra", appDetail.form_data!); } catch {} }}
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-ptba-steel-blue px-3 py-1.5 text-xs font-medium text-ptba-steel-blue hover:bg-ptba-steel-blue/5 transition-colors">
                                    <Download className="h-3.5 w-3.5" /> Download Formulir (PDF)
                                  </button>
                                )}
                                {(appDetail?.phase1Documents || []).length > 0 && (
                                  <button type="button" onClick={async () => {
                                    for (const doc of (appDetail?.phase1Documents || [])) {
                                      if (doc.file_key) { try { await downloadDocument(doc.file_key, accessToken!, doc.name); } catch {} }
                                    }
                                  }}
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-ptba-light-gray px-3 py-1.5 text-xs font-medium text-ptba-gray hover:bg-ptba-section-bg transition-colors">
                                    <Download className="h-3.5 w-3.5" /> Download Semua Dokumen
                                  </button>
                                )}
                              </div>

                              {/* Form data */}
                              {appDetail?.form_data && (
                                <div className="space-y-3">
                                  {Object.entries(EVAL_FORM_DATA_MAP).filter(([key, val]) => val && !["financial", "requirements"].includes(key)).map(([key, section]) => {
                                    if (!section) return null;
                                    const isOpen = expandedDocs[`form_${key}`] ?? false;
                                    return (
                                      <div key={key} className="rounded-lg border border-gray-200 overflow-hidden">
                                        <button type="button" onClick={() => setExpandedDocs((p) => ({ ...p, [`form_${key}`]: !isOpen }))} className="w-full flex items-center justify-between px-4 py-2.5 bg-ptba-section-bg hover:bg-ptba-light-gray/30 transition-colors">
                                          <span className="text-sm font-semibold text-ptba-navy">{section.title}</span>
                                          <ChevronDown className={cn("h-4 w-4 text-ptba-gray transition-transform", isOpen && "rotate-180")} />
                                        </button>
                                        {isOpen && (
                                          <div className="p-4">
                                            {section.render(appDetail.form_data!)}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}

                              {/* Documents list */}
                              {(appDetail?.phase1Documents || []).length > 0 && (
                                <div>
                                  <p className="text-xs font-semibold text-ptba-navy mb-2">Dokumen Terunggah ({appDetail!.phase1Documents!.length})</p>
                                  <div className="space-y-1.5">
                                    {appDetail!.phase1Documents!.map((doc: any) => (
                                      <div key={doc.document_type_id || doc.id} className="flex items-center gap-2 rounded border border-gray-200 bg-white px-3 py-2">
                                        <FileText className="h-4 w-4 text-ptba-steel-blue shrink-0" />
                                        <div className="flex-1 min-w-0">
                                          <p className="text-xs text-ptba-charcoal truncate">{doc.name}</p>
                                          <p className="text-[10px] text-ptba-gray">{doc.status} · {formatDate(doc.upload_date)}</p>
                                        </div>
                                        {doc.file_key && (
                                          <button type="button" onClick={() => downloadDocument(doc.file_key, accessToken!, doc.name)}
                                            className="inline-flex items-center gap-1 rounded-lg border border-ptba-light-gray px-2 py-1 text-[10px] font-medium text-ptba-gray hover:bg-ptba-section-bg transition-colors shrink-0">
                                            <Download className="h-3 w-3" /> Unduh
                                          </button>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {!appDetail?.form_data && (appDetail?.phase1Documents || []).length === 0 && (
                                <div className="text-center py-6">
                                  <FileText className="h-8 w-8 text-ptba-gray mx-auto mb-2" />
                                  <p className="text-sm text-ptba-gray">Belum ada dokumen atau formulir.</p>
                                </div>
                              )}
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
                            <ShieldCheck className="h-3.5 w-3.5" /> Keputusan untuk Mitra Ini
                          </p>
                          <div className="flex flex-col sm:flex-row gap-3">
                            <button type="button" onClick={() => updateKetuaTimMitraDecision(ev.partner_id, "layak")}
                              className={cn("inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                                ketuaTimMitraState?.decision === "layak" ? "bg-green-600 text-white shadow-sm" : "bg-white border border-green-300 text-green-700 hover:bg-green-50"
                              )}>
                              <CheckCircle2 className="h-4 w-4" /> Layak
                            </button>
                            <button type="button" onClick={() => updateKetuaTimMitraDecision(ev.partner_id, "tidak_layak")}
                              className={cn("inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                                ketuaTimMitraState?.decision === "tidak_layak" ? "bg-red-600 text-white shadow-sm" : "bg-white border border-red-300 text-red-700 hover:bg-red-50"
                              )}>
                              <XCircle className="h-4 w-4" /> Tidak Layak
                            </button>
                          </div>
                          <textarea
                            value={ketuaTimMitraState?.notes ?? ""}
                            onChange={(e) => updateKetuaTimMitraNotes(ev.partner_id, e.target.value)}
                            placeholder="Catatan (opsional)..."
                            rows={2}
                            className="mt-3 w-full rounded-lg border border-ptba-light-gray bg-white px-3 py-2 text-sm text-ptba-charcoal placeholder:text-ptba-gray/60 focus:outline-none focus:ring-2 focus:ring-ptba-steel-blue/40"
                          />
                        </div>
                      </div>
                    )}

                    {isKetuaTim && ketuaTimSubmitted && ketuaTimMitraState && (
                      <div className={cn("rounded-xl p-4 flex items-center gap-2 text-sm",
                        ketuaTimMitraState.decision === "layak" ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"
                      )}>
                        {ketuaTimMitraState.decision === "layak"
                          ? <CheckCircle2 className="h-4 w-4 text-green-600" />
                          : <XCircle className="h-4 w-4 text-red-600" />}
                        <span className={cn("font-medium", ketuaTimMitraState.decision === "layak" ? "text-green-700" : "text-red-700")}>
                          {ketuaTimMitraState.decision === "layak" ? "Layak" : "Tidak Layak"}
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

          {/* Ketua Tim submit — only show after all mitra decided */}
          {isKetuaTim && !ketuaTimSubmitted && allKetuaTimDecided && (
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <div className="flex items-start gap-3 mb-5">
                <ShieldCheck className="h-5 w-5 text-ptba-navy mt-0.5 shrink-0" />
                <div>
                  <h2 className="text-base font-semibold text-ptba-navy">Keputusan Akhir Ketua Tim</h2>
                  <p className="text-xs text-ptba-gray mt-0.5">
                    Semua mitra telah dinilai. Kirim keputusan akhir untuk melanjutkan proses.
                  </p>
                </div>
              </div>

              <div className="rounded-lg border border-ptba-light-gray bg-ptba-section-bg p-4 mb-5">
                <p className="text-xs font-semibold text-ptba-navy mb-3">Ringkasan Keputusan Per Mitra</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="rounded-lg bg-white p-3 text-center">
                    <p className="text-2xl font-bold text-green-600">{ketuaTimLayakCount}</p>
                    <p className="text-xs text-green-700">Layak</p>
                  </div>
                  <div className="rounded-lg bg-white p-3 text-center">
                    <p className="text-2xl font-bold text-red-600">{ketuaTimTdkLayakCount}</p>
                    <p className="text-xs text-red-700">Tidak Layak</p>
                  </div>
                </div>
              </div>

              {/* Pleno Document Upload */}
              <div className="rounded-lg border border-ptba-light-gray bg-ptba-section-bg p-4 mb-5">
                <p className="text-xs font-semibold text-ptba-navy mb-2">Dokumen Rapat Pleno <span className="text-ptba-red">*</span></p>
                <p className="text-[10px] text-ptba-gray mb-3">Upload dokumen hasil rapat pleno sebagai bukti persetujuan.</p>
                {plenoUploaded ? (
                  <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2">
                    <FileText className="h-4 w-4 text-green-600 shrink-0" />
                    <span className="text-xs text-green-800 flex-1 truncate">{plenoUploaded.fileName}</span>
                    <button type="button" onClick={() => { setPlenoUploaded(null); setPlenoFile(null); }} className="text-xs text-ptba-gray hover:text-ptba-red">Hapus</button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <label className={cn("inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium cursor-pointer transition-colors",
                      plenoUploading ? "border-gray-200 text-gray-400" : "border-ptba-steel-blue text-ptba-steel-blue hover:bg-ptba-steel-blue/5"
                    )}>
                      {plenoUploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ClipboardCheck className="h-3.5 w-3.5" />}
                      {plenoUploading ? "Mengunggah..." : "Pilih File"}
                      <input type="file" className="hidden" accept=".pdf,.doc,.docx" disabled={plenoUploading} onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file || !approvalRecord || !accessToken) return;
                        setPlenoFile(file);
                        setPlenoUploading(true);
                        try {
                          const formData = new FormData();
                          formData.append("file", file);
                          const res = await fetchWithAuth(`/approvals/${approvalRecord.id}/pleno-document`, { method: "POST", token: accessToken, body: formData });
                          if (!res.ok) throw new Error("Upload gagal");
                          const data = await res.json();
                          setPlenoUploaded({ fileKey: data.fileKey, fileName: data.fileName });
                        } catch { setPlenoFile(null); alert("Gagal mengunggah dokumen pleno."); }
                        finally { setPlenoUploading(false); e.target.value = ""; }
                      }} />
                    </label>
                    {plenoFile && !plenoUploading && <span className="text-xs text-ptba-gray">{plenoFile.name}</span>}
                  </div>
                )}
              </div>

              <textarea
                value={ketuaTimGlobalNotes}
                onChange={(e) => setketuaTimGlobalNotes(e.target.value)}
                placeholder="Catatan umum Ketua Tim (opsional)..."
                rows={3}
                className="w-full rounded-lg border border-ptba-light-gray bg-white px-3 py-2 text-sm text-ptba-charcoal placeholder:text-ptba-gray/60 focus:outline-none focus:ring-2 focus:ring-ptba-steel-blue/40 mb-4"
              />

              <button type="button" onClick={handleKetuaTimSubmit} disabled={!plenoUploaded}
                className={cn("w-full inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold transition-colors shadow-md",
                  plenoUploaded ? "bg-ptba-navy text-white hover:bg-ptba-navy/90" : "bg-gray-200 text-gray-400 cursor-not-allowed"
                )}>
                <Send className="h-4 w-4" />
                {plenoUploaded ? `Finalisasi (${ketuaTimLayakCount} Layak, ${ketuaTimTdkLayakCount} Tidak Layak)` : "Upload dokumen pleno terlebih dahulu"}
              </button>
            </div>
          )}

          {isKetuaTim && ketuaTimSubmitted && (
            <div className="rounded-xl border p-5 shadow-sm flex items-start gap-3 bg-green-50 border-green-200">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-green-800">Keputusan Dikirim</p>
                <p className="text-xs mt-1 text-green-700">
                  {ketuaTimLayakCount} mitra Layak, {ketuaTimTdkLayakCount} mitra Tidak Layak. Mitra yang Layak akan diundang ke Fase 2.
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
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-ptba-navy/10">
                <ShieldCheck className="h-5 w-5 text-ptba-navy" />
              </div>
              <h3 className="text-lg font-bold text-ptba-navy">Konfirmasi Keputusan</h3>
            </div>
            <p className="text-sm text-ptba-charcoal mb-4">
              Anda akan mengirim keputusan untuk proyek <span className="font-semibold">{project.name}</span>:
            </p>
            <div className="space-y-2 mb-5">
              {ketuaTimLayakCount > 0 && (
                <div className="rounded-lg bg-green-50 border border-green-200 p-3 flex items-center gap-3">
                  <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                  <p className="text-sm font-medium text-green-800">{ketuaTimLayakCount} mitra Layak — lanjut ke Fase 2</p>
                </div>
              )}
              {ketuaTimTdkLayakCount > 0 && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-3 flex items-center gap-3">
                  <XCircle className="h-4 w-4 text-red-600 shrink-0" />
                  <p className="text-sm font-medium text-red-800">{ketuaTimTdkLayakCount} mitra Tidak Layak</p>
                </div>
              )}
            </div>
            <div className="rounded-lg border border-ptba-light-gray bg-ptba-section-bg p-3 mb-5">
              <p className="text-xs font-medium text-ptba-navy mb-2">Detail per mitra:</p>
              <div className="space-y-1.5">
                {ketuaTimMitraStates.map((m) => {
                  const mEv = mitraSummaries.find((s) => s.partner_id === m.partnerId);
                  return (
                    <div key={m.partnerId} className="flex items-center gap-2 text-xs">
                      {m.decision === "layak" ? <CheckCircle2 className="h-3.5 w-3.5 text-green-600 shrink-0" /> : <XCircle className="h-3.5 w-3.5 text-red-600 shrink-0" />}
                      <span className="text-ptba-charcoal font-medium">{mEv?.partner_name ?? m.partnerId}</span>
                      <span className={cn("ml-auto", m.decision === "layak" ? "text-green-700" : "text-red-700")}>
                        {m.decision === "layak" ? "Layak" : "Tidak Layak"}
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
                  "bg-ptba-navy hover:bg-ptba-navy/90",
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
