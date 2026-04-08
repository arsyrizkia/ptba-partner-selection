"use client";

import { use, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft, ChevronRight, CheckCircle2, Clock, FileText, Download,
  Save, Send, ChevronLeft, User, Lock, AlertTriangle, RotateCcw,
  Loader2, ChevronDown, LockKeyhole, X, Upload, Trash2, Eye,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useAuth } from "@/lib/auth/auth-context";
import { api, projectApi, downloadDocument, fetchWithAuth } from "@/lib/api/client";
import { formatDate } from "@/lib/utils/format";
import { sanitizeHtml } from "@/lib/utils/sanitize";
import { DOCUMENT_TYPES } from "@/lib/constants/document-types";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { generateApplicationPdf } from "@/lib/utils/generate-application-pdf";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002/api";

// ── Document name formatter ──────────────────────────────────────────────────
const DOC_NAME_MAP: Record<string, string> = {
  nib_document: "NIB Document",
  org_structure: "Struktur Organisasi",
  ebitda_dscr_calculation: "EBITDA & DSCR Calculation",
  credit_rating_evidence: "Credit Rating Evidence",
  cash_on_hand_evidence: "Cash on Hand Evidence",
  company_history: "Sejarah & Milestone Perusahaan",
  requirements_fulfillment: "Pemenuhan Persyaratan",
};
function fmtDocName(name: string, typeId?: string): string {
  if (typeId && DOC_NAME_MAP[typeId]) return DOC_NAME_MAP[typeId];
  if (name.startsWith("credential_exp_")) { const d = name.indexOf(" - "); return d !== -1 ? `Dokumen Kredensial${name.slice(d)}` : "Dokumen Kredensial"; }
  if (name.startsWith("audited_financial_")) { const yr = name.match(/\d{4}/)?.[0] || ""; const d = name.indexOf(" - "); return `Laporan Keuangan Audit ${yr}${d !== -1 ? name.slice(d) : ""}`; }
  if (typeId && DOC_NAME_MAP[typeId]) return DOC_NAME_MAP[typeId];
  const meta = DOCUMENT_TYPES.find((dt) => dt.id === (typeId || ""));
  if (meta?.name) return meta.name;
  return name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// ── Category config ──────────────────────────────────────────────────────────
const CATEGORY_LABELS: Record<string, { label: string; labelId: string; color: string; description: string }> = {
  pasar: { label: "Market Aspect", labelId: "Aspek Pasar", color: "bg-blue-100 text-blue-800",
    description: "Evaluasi kemampuan Calon Mitra dalam penguasaan pasar atas produk atau jasa yang dikerjasamakan, serta kepemilikan spesifikasi produk atau keahlian yang memadai untuk melaksanakan kerja sama yang dibutuhkan." },
  teknis: { label: "Technical Aspect", labelId: "Aspek Teknis", color: "bg-purple-100 text-purple-800",
    description: "Evaluasi kemampuan teknis dan usaha Calon Mitra dalam rencana kerja sama, termasuk menilai infrastruktur dan sumber daya teknis yang dimiliki." },
  komersial: { label: "ESG Aspect", labelId: "Aspek Lingkungan, Sosial & Tata Kelola", color: "bg-teal-100 text-teal-800",
    description: "Evaluasi keberlanjutan dalam rangka mendukung pencapaian tujuan pembangunan yang berkelanjutan." },
  keuangan: { label: "Financial Aspect", labelId: "Aspek Ekonomi & Keuangan", color: "bg-amber-100 text-amber-800",
    description: "Evaluasi ada tidaknya nilai tambah ekonomis bagi PTBA serta pemangku kepentingan, termasuk kelayakan finansial Calon Mitra." },
  hukum: { label: "Legal Aspect", labelId: "Aspek Legal", color: "bg-red-100 text-red-800",
    description: "Evaluasi status legalitas Calon Mitra dalam melaksanakan kerja sama, baik berdasarkan perizinan, penugasan area, ataupun dokumen-dokumen hukum lainnya yang dibutuhkan." },
  risiko: { label: "Risk Aspect", labelId: "Aspek Risiko", color: "bg-orange-100 text-orange-800",
    description: "Evaluasi potensi risiko yang dapat mempengaruhi ketercapaian tujuan dari Kerja Sama yang dilakukan beserta rencana untuk mitigasinya." },
};
const ALL_CATEGORIES = Object.keys(CATEGORY_LABELS);

function getUserCategory(project: any, userId: string, role: string): string | null {
  if (role === "super_admin") return null; // can view/evaluate any
  const pics = project.phasePics || [];
  const myPic = pics.find((p: any) => p.userId === userId && p.phase === "phase1");
  if (!myPic) return null;
  if (role === "keuangan") return "keuangan";
  if (role === "hukum") return "hukum";
  if (role === "risiko") return "risiko";
  if (role === "ebd" && myPic.subcategory) return myPic.subcategory;
  return null;
}

// ── Form Data Rendering ──────────────────────────────────────────────────────
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
        <EvalField label="Tipe Pemegang Saham" value={fd.shareholderType === "majority" ? "Pemegang Saham Mayoritas (>50% - 51%)" : fd.shareholderType === "minority" ? "Pemegang Saham Minoritas (&lt;50%)" : fd.shareholderType} />
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
      if (fd.noExperience) return <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2">Ditandai tidak memiliki pengalaman</p>;
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
                  <EvalField label="Tahun COD" value={exp.codYear || exp.year} />
                </>}
                {exp.category === "general" && <>
                  <EvalField label="Jenis Proyek" value={exp.projectType} />
                  <EvalField label="Peran" value={exp.role} />
                  {exp.contractValueUSD && <EvalField label="Nilai Kontrak (USD)" value={exp.contractValueUSD} />}
                  <EvalField label="Tahun COD" value={exp.codYear || exp.year} />
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
  financial: undefined as any,
  requirements: undefined as any,
};
EVAL_FORM_DATA_MAP.financial = EVAL_FORM_DATA_MAP.financial_overview;
EVAL_FORM_DATA_MAP.requirements = EVAL_FORM_DATA_MAP.requirements_fulfillment;

// ── Types ────────────────────────────────────────────────────────────────────
interface CatEval {
  id?: string;
  category: string;
  verdict: string | null;
  comment: string;
  notes: string;
  isFinalized: boolean;
  finalizedAt?: string;
  evaluatorId?: string;
  evaluatorName?: string;
  evidenceFiles: { id: string; fileName: string; fileKey: string }[];
}

interface AppCatStatus {
  evaluations: CatEval[];
  allFinalized: boolean;
  overallResult: string | null;
}

interface ApiApplication {
  id: string;
  partner_id: string;
  partner_name: string;
  project_id: string;
  project_name: string;
  status: string;
  phase: string;
  applied_at: string;
  form_data: Record<string, unknown> | null;
  phase1_result: string | null;
}

interface ApiApplicationDetail extends ApiApplication {
  phase1Documents: any[];
  phase2Documents: any[];
  generalDocuments: any[];
}

// ── Page Component ───────────────────────────────────────────────────────────
export default function Phase1EvaluationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { role, accessToken, user } = useAuth();

  // State
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [project, setProject] = useState<any>(null);
  const [applicants, setApplicants] = useState<ApiApplication[]>([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showCloseRegModal, setShowCloseRegModal] = useState(false);
  const [closingReg, setClosingReg] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Per-application category evaluations
  const [catEvals, setCatEvals] = useState<Record<string, AppCatStatus>>({});
  // My draft form state (per appId)
  const [myComment, setMyComment] = useState("");
  const [myNotes, setMyNotes] = useState("");
  const [myVerdict, setMyVerdict] = useState<string | null>(null);
  const [myEvidence, setMyEvidence] = useState<{ id: string; fileName: string; fileKey: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [confirmFinalize, setConfirmFinalize] = useState(false);
  const [submittedForApproval, setSubmittedForApproval] = useState(false);

  // Applicant detail
  const [appDocs, setAppDocs] = useState<any[]>([]);
  const [appFormData, setAppFormData] = useState<any>(null);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [downloadingZip, setDownloadingZip] = useState(false);

  // For super_admin: pick which category to evaluate
  const [superAdminCat, setSuperAdminCat] = useState<string>("pasar");

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Selected mitra
  const selectedPartnerId = searchParams.get("partnerId");
  const selectedApp = selectedPartnerId ? applicants.find((a) => a.partner_id === selectedPartnerId) : null;
  const currentIndex = selectedApp ? applicants.findIndex((a) => a.partner_id === selectedPartnerId) : -1;
  const prevMitra = currentIndex > 0 ? applicants[currentIndex - 1] : null;
  const nextMitra = currentIndex >= 0 && currentIndex < applicants.length - 1 ? applicants[currentIndex + 1] : null;

  const navigateToMitra = (partnerId: string) => {
    router.push(`/projects/${id}/evaluation/phase1?partnerId=${partnerId}`);
  };

  // Access control
  const myCategory = project && user ? getUserCategory(project, user.id, role || "") : undefined;
  const phase1Pics = (project?.phasePics || []).filter((p: any) => p.phase === "phase1");
  const isPhase1Pic = phase1Pics.some((p: any) => p.userId === user?.id);
  const isAuthorized = role === "super_admin" || isPhase1Pic;
  const activeCategory = role === "super_admin" ? superAdminCat : myCategory;

  // Phase checks
  const projectPhase = project?.phase as string | undefined;
  const isEvalPhase = projectPhase === "phase1_closed" || projectPhase === "phase1_evaluation";
  const isRegistrationPhase = projectPhase === "phase1_registration";
  const viewOnly = !!projectPhase && !isEvalPhase;

  // ── Fetch project + applicants ─────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const projectRes = await projectApi(accessToken).getById(id);
      setProject(projectRes.data);

      const appsRes = await api<{ applications: ApiApplication[] }>("/applications", { token: accessToken });
      const projectApps = appsRes.applications.filter((a) => a.project_id === id && a.status !== "Draft");
      setApplicants(projectApps);

      // Fetch all category evals summary
      try {
        const catRes = await api<{ evaluations: any[] }>(`/evaluations/phase1-cat/${id}`, { token: accessToken });
        const statusMap: Record<string, AppCatStatus> = {};
        for (const app of projectApps) {
          const appEvals = (catRes.evaluations || []).filter((e: any) => e.applicationId === app.id || e.application_id === app.id);
          statusMap[app.id] = {
            evaluations: appEvals.map(mapCatEval),
            allFinalized: ALL_CATEGORIES.every((cat) => appEvals.some((e: any) => (e.category === cat) && (e.isFinalized || e.is_finalized))),
            overallResult: null,
          };
        }
        setCatEvals(statusMap);
      } catch {
        // No evals yet
      }
    } catch (err) {
      console.error("Failed to load evaluation data:", err);
    } finally {
      setLoading(false);
    }
  }, [id, accessToken]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Fetch detail for selected app ──────────────────────────────────────────
  useEffect(() => {
    if (!selectedApp || !accessToken) {
      setAppDocs([]);
      setAppFormData(null);
      return;
    }
    const fetchDetail = async () => {
      setLoadingDocs(true);
      try {
        const res = await api<{ application: ApiApplicationDetail }>(`/applications/${selectedApp.id}`, { token: accessToken });
        setAppDocs(res.application.phase1Documents || []);
        const fd = (res.application as any).form_data;
        setAppFormData(fd ? (typeof fd === "string" ? JSON.parse(fd) : fd) : null);
      } catch {
        setAppDocs([]);
        setAppFormData(null);
      } finally {
        setLoadingDocs(false);
        setExpandedSections({});
      }
    };
    fetchDetail();
  }, [selectedApp?.id, accessToken]);

  // ── Fetch category evals for selected app ──────────────────────────────────
  useEffect(() => {
    if (!selectedApp || !accessToken) return;
    const fetchCatEvals = async () => {
      try {
        const res = await api<{ evaluations: any[]; allFinalized: boolean }>(`/evaluations/phase1-cat/${id}/${selectedApp.id}`, { token: accessToken });
        const evals = (res.evaluations || []).map(mapCatEval);
        setCatEvals((prev) => ({
          ...prev,
          [selectedApp.id]: {
            evaluations: evals,
            allFinalized: res.allFinalized ?? ALL_CATEGORIES.every((c) => evals.some((e) => e.category === c && e.isFinalized)),
            overallResult: null,
          },
        }));
        // Populate my form from my category
        const mine = evals.find((e) => e.category === activeCategory);
        if (mine) {
          setMyComment(mine.comment || "");
          setMyNotes(mine.notes || "");
          setMyVerdict(mine.verdict);
          setMyEvidence(mine.evidenceFiles || []);
        } else {
          setMyComment("");
          setMyNotes("");
          setMyVerdict(null);
          setMyEvidence([]);
        }
      } catch {
        setMyComment("");
        setMyNotes("");
        setMyVerdict(null);
        setMyEvidence([]);
      }
    };
    fetchCatEvals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedApp?.id, activeCategory, accessToken]);

  function mapCatEval(e: any): CatEval {
    return {
      id: e.id,
      category: e.category,
      verdict: e.verdict || null,
      comment: e.comment || "",
      notes: e.notes || "",
      isFinalized: e.isFinalized || e.is_finalized || false,
      finalizedAt: e.finalizedAt || e.finalized_at,
      evaluatorId: e.evaluatorId || e.evaluator_id,
      evaluatorName: e.evaluatorName || e.evaluator_name,
      evidenceFiles: (e.evidence || e.evidenceFiles || e.evidence_files || []).map((f: any) => ({
        id: f.id,
        fileName: f.fileName || f.file_name || f.name,
        fileKey: f.fileKey || f.file_key,
      })),
    };
  }

  // ── My evaluation helpers ──────────────────────────────────────────────────
  const myEval = selectedApp ? (catEvals[selectedApp.id]?.evaluations || []).find((e) => e.category === activeCategory) : null;
  const isMyFinalized = myEval?.isFinalized ?? false;
  const isEditable = !isMyFinalized && !viewOnly;

  const handleSaveDraft = async () => {
    if (!selectedApp || !accessToken || !activeCategory) return;
    setSaving(true);
    try {
      await api(`/evaluations/phase1-cat/${id}/${selectedApp.id}/${activeCategory}`, {
        method: "POST",
        token: accessToken,
        body: { verdict: myVerdict, comment: myComment, notes: myNotes },
      });
      showToast("Draft evaluasi berhasil disimpan.");
      // Re-fetch
      const res = await api<{ evaluations: any[]; allFinalized: boolean }>(`/evaluations/phase1-cat/${id}/${selectedApp.id}`, { token: accessToken });
      setCatEvals((prev) => ({
        ...prev,
        [selectedApp.id]: {
          evaluations: (res.evaluations || []).map(mapCatEval),
          allFinalized: res.allFinalized ?? false,
          overallResult: null,
        },
      }));
    } catch (err: any) {
      showToast(err.message || "Gagal menyimpan draft.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleFinalize = async () => {
    if (!selectedApp || !accessToken || !activeCategory) return;
    setSaving(true);
    try {
      // Save first
      await api(`/evaluations/phase1-cat/${id}/${selectedApp.id}/${activeCategory}`, {
        method: "POST",
        token: accessToken,
        body: { verdict: myVerdict, comment: myComment, notes: myNotes },
      });
      // Finalize
      await api(`/evaluations/phase1-cat/${id}/${selectedApp.id}/${activeCategory}/finalize`, {
        method: "POST",
        token: accessToken,
      });
      showToast("Evaluasi berhasil difinalisasi.");
      setConfirmFinalize(false);
      // Re-fetch evals
      const res = await api<{ evaluations: any[]; allFinalized: boolean }>(`/evaluations/phase1-cat/${id}/${selectedApp.id}`, { token: accessToken });
      setCatEvals((prev) => ({
        ...prev,
        [selectedApp.id]: {
          evaluations: (res.evaluations || []).map(mapCatEval),
          allFinalized: res.allFinalized ?? false,
          overallResult: null,
        },
      }));
      // Auto-navigate to next
      const nextUneval = applicants.find((a) => {
        if (a.id === selectedApp.id) return false;
        const status = catEvals[a.id];
        if (!status) return true;
        return !status.evaluations.some((e) => e.category === activeCategory && e.isFinalized);
      });
      if (nextUneval) navigateToMitra(nextUneval.partner_id);
    } catch (err: any) {
      showToast(err.message || "Gagal memfinalisasi evaluasi.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleUploadEvidence = async (file: File) => {
    if (!selectedApp || !accessToken || !activeCategory) return;
    setUploading(true);
    try {
      // Auto-save draft first to ensure evaluation record exists
      await api(`/evaluations/phase1-cat/${id}/${selectedApp.id}/${activeCategory}`, {
        method: "POST",
        body: { verdict: myVerdict || undefined, comment: myComment || undefined, notes: myNotes || undefined },
        token: accessToken,
      });

      const formData = new FormData();
      formData.append("file", file);
      const res = await fetchWithAuth(`/evaluations/phase1-cat/${id}/${selectedApp.id}/${activeCategory}/evidence`, {
        method: "POST",
        token: accessToken,
        body: formData,
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error((d as any).error || "Upload gagal"); }
      const data = await res.json();
      const newFile = { id: data.evidence?.id || data.file?.id || data.id, fileName: file.name, fileKey: data.evidence?.fileKey || data.evidence?.file_key || data.file?.fileKey || data.file?.file_key || data.fileKey || "" };
      setMyEvidence((prev) => [...prev, newFile]);
      showToast("File bukti berhasil diunggah.");
    } catch (err: any) {
      showToast(err.message || "Gagal mengunggah file.", "error");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteEvidence = async (fileId: string) => {
    if (!selectedApp || !accessToken || !activeCategory) return;
    try {
      await api(`/evaluations/phase1-cat/${id}/${selectedApp.id}/${activeCategory}/evidence/${fileId}`, {
        method: "DELETE",
        token: accessToken,
      });
      setMyEvidence((prev) => prev.filter((f) => f.id !== fileId));
      showToast("File bukti berhasil dihapus.");
    } catch (err: any) {
      showToast(err.message || "Gagal menghapus file.", "error");
    }
  };

  const handleSubmitForApproval = async () => {
    if (!accessToken) return;
    setSaving(true);
    try {
      await api(`/approvals/phase1/${id}/submit`, { method: "POST", token: accessToken });
      setSubmittedForApproval(true);
      showToast("Hasil evaluasi berhasil dikirim untuk persetujuan.");
    } catch (err: any) {
      showToast(err.message || "Gagal mengirim untuk persetujuan.", "error");
    } finally {
      setSaving(false);
    }
  };

  // ── Sidebar status helpers ─────────────────────────────────────────────────
  const getMitraStatus = (appId: string): { text: string; color: string; icon: "finalized" | "partial" | "none" } => {
    const status = catEvals[appId];
    if (!status) return { text: "Belum dinilai", color: "text-ptba-gray", icon: "none" };
    const finCount = status.evaluations.filter((e) => e.isFinalized).length;
    if (status.allFinalized) {
      const allLayak = status.evaluations.every((e) => e.verdict === "layak");
      return allLayak
        ? { text: "Layak (6/6)", color: "text-green-600", icon: "finalized" }
        : { text: "Tidak Layak", color: "text-ptba-red", icon: "finalized" };
    }
    if (finCount > 0) return { text: `${finCount}/6 selesai`, color: "text-ptba-steel-blue", icon: "partial" };
    return { text: "Belum dinilai", color: "text-ptba-gray", icon: "none" };
  };

  // Check if all apps have all 6 finalized
  const allAppsAllFinalized = applicants.length > 0 && applicants.every((a) => catEvals[a.id]?.allFinalized);
  const isEbdOrAdmin = role === "super_admin" || role === "ebd";

  // ── Render ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-ptba-navy" />
          <p className="text-sm text-ptba-gray">Memuat data evaluasi...</p>
        </div>
      </div>
    );
  }

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
          <span className="text-ptba-charcoal font-medium">Evaluasi 1</span>
        </nav>
        <div className="rounded-xl bg-white p-6 shadow-sm border border-red-200">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
              <Clock className="h-5 w-5 text-ptba-red" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-ptba-red">Akses Ditolak</h2>
              <p className="text-sm text-ptba-gray mt-1">
                Anda tidak memiliki akses ke halaman evaluasi Fase 1 proyek ini.
                Role: <span className="font-medium text-ptba-charcoal">{role ?? "Tidak teridentifikasi"}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Applicant data sections
  const DOC_SECTION_MAP: Record<string, string[]> = {
    compro: ["compro", "nib_document", "org_structure", "company_history"],
    statement_eoi: ["statement_eoi", "cash_on_hand_evidence"],
    portfolio: ["portfolio", ...appDocs.filter((d: any) => (d.document_type_id || "").startsWith("credential_exp_")).map((d: any) => d.document_type_id)],
    financial_overview: ["financial_overview", "credit_rating_evidence", ...appDocs.filter((d: any) => (d.document_type_id || "").startsWith("audited_financial_")).map((d: any) => d.document_type_id)],
    requirements_fulfillment: ["requirements_fulfillment"],
  };
  const SECTIONS = [
    { key: "compro", title: EVAL_FORM_DATA_MAP.compro?.title || "Company Profile" },
    { key: "statement_eoi", title: EVAL_FORM_DATA_MAP.statement_eoi?.title || "Surat Pernyataan EoI" },
    { key: "portfolio", title: EVAL_FORM_DATA_MAP.portfolio?.title || "Pengalaman Proyek" },
    { key: "financial_overview", title: EVAL_FORM_DATA_MAP.financial_overview?.title || "Data Keuangan" },
    { key: "requirements_fulfillment", title: EVAL_FORM_DATA_MAP.requirements_fulfillment?.title || "Pemenuhan Persyaratan" },
  ];

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-ptba-gray">
        <Link href="/projects" className="hover:text-ptba-navy">Proyek</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href={`/projects/${id}`} className="hover:text-ptba-navy">{project.name}</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-ptba-charcoal font-medium">Evaluasi 1</span>
      </nav>

      <button onClick={() => router.push(`/projects/${id}`)} className="inline-flex items-center gap-1.5 text-sm text-ptba-gray hover:text-ptba-navy transition-colors">
        <ArrowLeft className="h-4 w-4" /> Kembali ke Proyek
      </button>

      {/* Registration-open banner */}
      {isRegistrationPhase && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-100 shrink-0">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-amber-800">Mode Lihat Saja — Pendaftaran Masih Dibuka</p>
                <p className="text-xs text-amber-700 mt-0.5">Evaluasi hanya dapat dilakukan setelah pendaftaran Fase 1 ditutup.</p>
              </div>
            </div>
            {(role === "super_admin" || role === "ebd") && (
              <button onClick={() => setShowCloseRegModal(true)} className="inline-flex items-center gap-2 rounded-lg bg-ptba-red px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-red-700 transition-colors shrink-0">
                <LockKeyhole className="h-4 w-4" /> Tutup Pendaftaran
              </button>
            )}
          </div>
        </div>
      )}

      {/* Close Registration Modal */}
      {showCloseRegModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowCloseRegModal(false)}>
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-ptba-charcoal">Tutup Pendaftaran Fase 1</h2>
              <button onClick={() => setShowCloseRegModal(false)} className="rounded-lg p-1.5 hover:bg-ptba-section-bg transition-colors">
                <X className="h-5 w-5 text-ptba-gray" />
              </button>
            </div>
            <div className="rounded-lg bg-red-50 border border-red-200 p-4 mb-4">
              <p className="text-sm text-ptba-charcoal leading-relaxed">
                Pendaftaran untuk proyek <strong>{project.name}</strong> akan ditutup. Mitra tidak akan bisa mendaftar lagi setelah ini.
              </p>
            </div>
            <div className="space-y-2 mb-5 text-xs text-ptba-gray">
              <div className="flex items-start gap-2"><LockKeyhole className="h-3.5 w-3.5 text-ptba-red shrink-0 mt-0.5" /><span>Mitra tidak bisa mendaftar lagi</span></div>
              <div className="flex items-start gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0 mt-0.5" /><span>Proyek masuk tahap evaluasi</span></div>
              <div className="flex items-start gap-2"><AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" /><span>Pastikan semua mitra yang diharapkan sudah mendaftar</span></div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowCloseRegModal(false)} className="flex-1 rounded-lg border border-ptba-light-gray px-4 py-2.5 text-sm font-medium text-ptba-gray hover:bg-ptba-section-bg transition-colors">Batal</button>
              <button disabled={closingReg} onClick={async () => {
                if (!accessToken) return;
                setClosingReg(true);
                try { await projectApi(accessToken).closeRegistration(id); await fetchData(); setShowCloseRegModal(false); } catch (err: any) { alert(err.message || "Gagal menutup pendaftaran"); } finally { setClosingReg(false); }
              }} className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-ptba-red px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-red-700 transition-colors disabled:opacity-50">
                {closingReg ? <Loader2 className="h-4 w-4 animate-spin" /> : <LockKeyhole className="h-4 w-4" />} Ya, Tutup Pendaftaran
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-ptba-navy">Evaluasi Tahap 1 — Pra-kualifikasi</h1>
        {activeCategory && CATEGORY_LABELS[activeCategory] && (
          <div className="mt-3 rounded-xl border border-ptba-steel-blue/20 bg-ptba-steel-blue/5 px-4 py-3">
            <div className="flex items-center gap-2 mb-1.5">
              <span className={cn("inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold", CATEGORY_LABELS[activeCategory].color)}>
                {CATEGORY_LABELS[activeCategory].labelId}
              </span>
              <span className="text-[10px] text-ptba-gray">Keputusan Direksi No. 091/0100/2024</span>
            </div>
            <p className="text-xs text-ptba-charcoal leading-relaxed">
              {CATEGORY_LABELS[activeCategory].description}
            </p>
          </div>
        )}
      </div>

      {/* Super admin: category picker */}
      {role === "super_admin" && (
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-ptba-gray mb-2">Evaluasi sebagai kategori:</p>
          <div className="flex flex-wrap gap-2">
            {ALL_CATEGORIES.map((cat) => (
              <button key={cat} onClick={() => setSuperAdminCat(cat)} className={cn("rounded-full px-3 py-1.5 text-xs font-semibold transition-colors", superAdminCat === cat ? CATEGORY_LABELS[cat].color + " ring-2 ring-offset-1 ring-gray-400" : "bg-gray-100 text-gray-500 hover:bg-gray-200")}>
                {CATEGORY_LABELS[cat].labelId}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Summary strip */}
      <div className="rounded-xl bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-ptba-navy"><User className="h-4 w-4 text-white" /></div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-ptba-gray">Total Mitra Terdaftar</p>
            <p className="text-lg font-bold text-ptba-navy">{applicants.length}</p>
          </div>
        </div>
      </div>

      {applicants.length === 0 && (
        <div className="rounded-xl bg-white p-6 shadow-sm text-center">
          <Clock className="h-10 w-10 text-ptba-gray mx-auto mb-3" />
          <p className="text-ptba-gray">Belum ada mitra yang mendaftar untuk Fase 1.</p>
        </div>
      )}

      {/* Main Layout */}
      {applicants.length > 0 && (
        <div className={cn("grid grid-cols-1 gap-6", sidebarCollapsed ? "lg:grid-cols-1" : "lg:grid-cols-[280px_1fr]")}>
          {/* Sidebar */}
          <div className="rounded-xl bg-white shadow-sm overflow-hidden">
            <button type="button" onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="w-full px-4 py-3 bg-ptba-navy flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white text-left">Daftar Mitra ({applicants.length})</h3>
                {!sidebarCollapsed && <p className="text-[10px] text-white/60 mt-0.5 text-left">Pilih mitra untuk dievaluasi</p>}
              </div>
              <ChevronDown className={cn("h-4 w-4 text-white/60 transition-transform", !sidebarCollapsed && "rotate-180")} />
            </button>
            {!sidebarCollapsed && (
              <div className="divide-y divide-gray-100">
                {applicants.map((app, idx) => {
                  const isSelected = app.partner_id === selectedPartnerId;
                  const status = getMitraStatus(app.id);
                  return (
                    <button key={app.id} onClick={() => navigateToMitra(app.partner_id)} className={cn("w-full text-left px-4 py-3 transition-colors hover:bg-ptba-section-bg", isSelected && "bg-ptba-section-bg border-l-3 border-l-ptba-navy")}>
                      <div className="flex items-center gap-3">
                        <span className={cn("flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold text-white shrink-0", status.icon === "finalized" ? "bg-green-500" : status.icon === "partial" ? "bg-ptba-steel-blue" : "bg-gray-300")}>
                          {status.icon === "finalized" ? <Lock className="h-3 w-3" /> : idx + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className={cn("text-sm font-medium truncate", isSelected ? "text-ptba-navy" : "text-ptba-charcoal")}>{app.partner_name}</p>
                          <p className={cn("text-[10px]", status.color)}>{status.text}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Panel */}
          <div>
            {!selectedApp ? (
              <div className="rounded-xl bg-white p-12 shadow-sm text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-ptba-section-bg mx-auto mb-4">
                  <User className="h-8 w-8 text-ptba-gray" />
                </div>
                <h3 className="text-lg font-semibold text-ptba-charcoal mb-2">Pilih Mitra untuk Dievaluasi</h3>
                <p className="text-sm text-ptba-gray max-w-md mx-auto">Klik salah satu mitra di panel kiri untuk memulai evaluasi.</p>
                {applicants.length > 0 && (
                  <button onClick={() => navigateToMitra(applicants[0].partner_id)} className="mt-6 inline-flex items-center gap-2 rounded-lg bg-ptba-navy px-5 py-2.5 text-sm font-semibold text-white hover:bg-ptba-navy/90 transition-colors">
                    Mulai Evaluasi Mitra Pertama <ChevronRight className="h-4 w-4" />
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-5">
                {/* Mitra Header */}
                <div className="rounded-xl bg-white shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-ptba-navy text-sm font-bold text-white">
                        {selectedApp.partner_name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-ptba-charcoal">{selectedApp.partner_name}</h3>
                        <p className="text-xs text-ptba-gray">Mitra {currentIndex + 1} dari {applicants.length} · Mendaftar: {formatDate(selectedApp.applied_at)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {(() => {
                        const status = catEvals[selectedApp.id];
                        if (!status) return null;
                        const finCount = status.evaluations.filter((e) => e.isFinalized).length;
                        return (
                          <>
                            {finCount > 0 && <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">{finCount}/6 Kategori Final</span>}
                            {status.allFinalized && status.evaluations.every((e) => e.verdict === "layak") && <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">Layak</span>}
                            {status.allFinalized && !status.evaluations.every((e) => e.verdict === "layak") && <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-ptba-red">Tidak Layak</span>}
                          </>
                        );
                      })()}
                    </div>
                  </div>
                  {/* PDF/Download/Nav bar */}
                  <div className="px-6 py-2 bg-ptba-section-bg border-b border-gray-100 flex items-center gap-2 flex-wrap">
                    {appFormData && (
                      <button type="button" onClick={() => { try { generateApplicationPdf(selectedApp.partner_name || "Mitra", appFormData); } catch (err) { alert("Gagal membuat PDF: " + (err instanceof Error ? err.message : String(err))); } }} className="inline-flex items-center gap-1.5 rounded-lg border border-ptba-steel-blue px-3 py-1.5 text-xs font-medium text-ptba-steel-blue hover:bg-ptba-steel-blue/5 transition-colors">
                        <Download className="h-3.5 w-3.5" /> Unduh PDF Formulir
                      </button>
                    )}
                    {appDocs.length > 0 && (
                      <button type="button" disabled={downloadingZip} onClick={async () => {
                        setDownloadingZip(true);
                        try {
                          const JSZip = (await import("jszip")).default;
                          const zip = new JSZip();
                          for (const doc of appDocs) { const fk = (doc as any).file_key; if (!fk) continue; const r = await api<{ url: string }>(`/documents/download/${encodeURIComponent(fk)}`, { token: accessToken! }); if (r.url) { const blob = await fetch(r.url).then((r) => r.blob()); zip.file(`${doc.name || fk.split("/").pop()}.${fk.split(".").pop() || "pdf"}`, blob); } }
                          const content = await zip.generateAsync({ type: "blob" });
                          const url = URL.createObjectURL(content); const a = document.createElement("a"); a.href = url; a.download = `Dokumen_${(selectedApp.partner_name || "Mitra").replace(/\s+/g, "_")}.zip`; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
                        } catch { /* ignore */ } finally { setDownloadingZip(false); }
                      }} className="inline-flex items-center gap-1.5 rounded-lg border border-ptba-navy px-3 py-1.5 text-xs font-medium text-ptba-navy hover:bg-ptba-navy/5 transition-colors disabled:opacity-50">
                        {downloadingZip ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                        {downloadingZip ? "Mengunduh..." : `Unduh Semua Dokumen (${appDocs.length})`}
                      </button>
                    )}
                  </div>
                  <div className="px-6 py-2.5 bg-gray-50 flex items-center justify-between text-sm border-b border-gray-100">
                    <button onClick={() => prevMitra && navigateToMitra(prevMitra.partner_id)} disabled={!prevMitra} className={cn("inline-flex items-center gap-1 transition-colors", prevMitra ? "text-ptba-navy hover:text-ptba-steel-blue" : "text-gray-300 cursor-not-allowed")}>
                      <ChevronLeft className="h-4 w-4" /> Sebelumnya
                    </button>
                    <span className="text-xs text-ptba-gray">{currentIndex + 1} / {applicants.length}</span>
                    <button onClick={() => nextMitra && navigateToMitra(nextMitra.partner_id)} disabled={!nextMitra} className={cn("inline-flex items-center gap-1 transition-colors", nextMitra ? "text-ptba-navy hover:text-ptba-steel-blue" : "text-gray-300 cursor-not-allowed")}>
                      Selanjutnya <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Applicant Data (collapsible) */}
                <div className="rounded-xl bg-white shadow-sm overflow-hidden">
                  <button type="button" onClick={() => setExpandedSections((p) => ({ ...p, _appData: !(p._appData ?? true) }))} className="w-full flex items-center justify-between px-6 py-4 bg-ptba-section-bg hover:bg-ptba-light-gray/30 transition-colors">
                    <span className="text-sm font-bold text-ptba-navy">Data Pendaftaran Mitra</span>
                    <ChevronDown className={cn("h-4 w-4 text-ptba-gray transition-transform", (expandedSections._appData ?? true) && "rotate-180")} />
                  </button>
                  {(expandedSections._appData ?? true) && (
                    <div className="p-4 space-y-4">
                      {loadingDocs ? (
                        <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-ptba-navy" /></div>
                      ) : (
                        (() => {
                          const allMappedDocIds = Object.values(DOC_SECTION_MAP).flat();
                          const additionalDocs = appDocs.filter((d: any) => !allMappedDocIds.includes(d.document_type_id));
                          let sectionNum = 0;
                          return (
                            <>
                              {SECTIONS.map((section) => {
                                const relDocIds = DOC_SECTION_MAP[section.key] || [section.key];
                                const matchedDocs = appDocs.filter((d: any) => relDocIds.includes(d.document_type_id));
                                const formRenderer = EVAL_FORM_DATA_MAP[section.key];
                                const hasFormData = formRenderer && appFormData;
                                // Skip empty sections
                                const isRequirements = section.key === "requirements_fulfillment";
                                const hasRequirementData = isRequirements && appFormData?.requirementAnswers && Object.keys(appFormData.requirementAnswers).length > 0;
                                if (isRequirements && !hasRequirementData && matchedDocs.length === 0) return null;
                                if (!isRequirements && !hasFormData && matchedDocs.length === 0) return null;
                                sectionNum++;
                                const isOpen = expandedSections[`sec_${section.key}`] ?? true;
                                return (
                                  <div key={section.key} className="rounded-xl border border-gray-200 overflow-hidden">
                                    <button type="button" onClick={() => setExpandedSections((p) => ({ ...p, [`sec_${section.key}`]: !isOpen }))} className="w-full flex items-center justify-between px-4 py-3 bg-ptba-section-bg hover:bg-ptba-light-gray/30 transition-colors">
                                      <span className="text-sm font-bold text-ptba-navy">{sectionNum}. {section.title}</span>
                                      <ChevronDown className={cn("h-4 w-4 text-ptba-gray transition-transform", isOpen && "rotate-180")} />
                                    </button>
                                    {isOpen && (
                                      <div className="p-4 space-y-3">
                                        {hasFormData && <div className="rounded-lg border border-gray-200 bg-white p-3">{formRenderer.render(appFormData)}</div>}
                                        {matchedDocs.length > 0 && (
                                          <div className="space-y-1.5">
                                            <p className="text-[10px] font-semibold text-ptba-gray uppercase">Dokumen ({matchedDocs.length})</p>
                                            {matchedDocs.map((doc: any) => (
                                              <div key={doc.id} className="flex items-center gap-2 rounded border border-gray-200 bg-white px-3 py-2">
                                                <FileText className="h-4 w-4 text-ptba-steel-blue shrink-0" />
                                                <div className="flex-1 min-w-0">
                                                  <p className="text-xs text-ptba-charcoal truncate">{fmtDocName(doc.name, doc.document_type_id)}</p>
                                                  <p className="text-[10px] text-ptba-gray">{doc.status} · {formatDate(doc.upload_date || "")}</p>
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
                                  </div>
                                );
                              })}
                              {additionalDocs.length > 0 && (() => {
                                sectionNum++;
                                const isOpen = expandedSections.sec_additional ?? true;
                                return (
                                  <div className="rounded-xl border border-gray-200 overflow-hidden">
                                    <button type="button" onClick={() => setExpandedSections((p) => ({ ...p, sec_additional: !isOpen }))} className="w-full flex items-center justify-between px-4 py-3 bg-ptba-section-bg hover:bg-ptba-light-gray/30 transition-colors">
                                      <span className="text-sm font-bold text-ptba-navy">{sectionNum}. Dokumen Tambahan</span>
                                      <ChevronDown className={cn("h-4 w-4 text-ptba-gray transition-transform", isOpen && "rotate-180")} />
                                    </button>
                                    {isOpen && (
                                      <div className="p-4 space-y-1.5">
                                        {additionalDocs.map((doc: any) => (
                                          <div key={doc.id} className="flex items-center gap-2 rounded border border-gray-200 bg-white px-3 py-2">
                                            <FileText className="h-4 w-4 text-ptba-steel-blue shrink-0" />
                                            <div className="flex-1 min-w-0">
                                              <p className="text-xs text-ptba-charcoal truncate">{fmtDocName(doc.name, doc.document_type_id)}</p>
                                              <p className="text-[10px] text-ptba-gray">{doc.status} · {formatDate(doc.upload_date || "")}</p>
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
                                );
                              })()}
                            </>
                          );
                        })()
                      )}
                    </div>
                  )}
                </div>

                {/* My Evaluation */}
                {activeCategory && (
                  <div className="rounded-xl bg-white shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b bg-white flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className={cn("rounded-full px-3 py-1 text-xs font-semibold", CATEGORY_LABELS[activeCategory]?.color || "bg-gray-100 text-gray-700")}>
                          {CATEGORY_LABELS[activeCategory]?.labelId || activeCategory}
                        </span>
                        <h3 className="text-base font-semibold text-ptba-navy">Evaluasi Saya</h3>
                      </div>
                      {isMyFinalized && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-gray-800 px-3 py-1 text-xs font-semibold text-white">
                          <Lock className="h-3 w-3" /> Final
                        </span>
                      )}
                    </div>
                    <div className={cn("p-6 space-y-5", isMyFinalized && "opacity-75")}>
                      {/* Finalized banner */}
                      {isMyFinalized && (
                        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 flex items-center gap-2">
                          <Lock className="h-4 w-4 text-ptba-gray shrink-0" />
                          <p className="text-xs text-ptba-gray">Evaluasi ini telah difinalisasi dan tidak dapat diubah.{myEval?.finalizedAt && ` (${formatDate(myEval.finalizedAt)})`}</p>
                        </div>
                      )}

                      {/* Rich text comment */}
                      <div>
                        <label className="text-sm font-medium text-ptba-charcoal mb-2 block">Komentar Evaluasi</label>
                        {isEditable ? (
                          <RichTextEditor value={myComment} onChange={setMyComment} placeholder="Tulis komentar evaluasi Anda di sini..." />
                        ) : (
                          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: myComment ? sanitizeHtml(myComment) : "<em class='text-gray-400'>Belum ada komentar.</em>" }} />
                        )}
                      </div>

                      {/* Evidence files */}
                      <div>
                        <label className="text-sm font-medium text-ptba-charcoal mb-2 block">File Bukti / Evidence</label>
                        <div className="space-y-2">
                          {myEvidence.map((f) => (
                            <div key={f.id} className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 bg-gray-50">
                              <FileText className="h-4 w-4 text-ptba-steel-blue shrink-0" />
                              <span className="text-xs text-ptba-charcoal flex-1 truncate">{f.fileName}</span>
                              {f.fileKey && (
                                <button type="button" onClick={() => downloadDocument(f.fileKey, accessToken!, f.fileName)} className="text-ptba-steel-blue hover:text-ptba-navy transition-colors">
                                  <Eye className="h-3.5 w-3.5" />
                                </button>
                              )}
                              {isEditable && (
                                <button type="button" onClick={() => handleDeleteEvidence(f.id)} className="text-red-400 hover:text-ptba-red transition-colors">
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          ))}
                          {isEditable && (
                            <label className="inline-flex items-center gap-2 rounded-lg border border-dashed border-gray-300 px-4 py-2.5 text-xs font-medium text-ptba-gray hover:bg-ptba-section-bg transition-colors cursor-pointer">
                              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                              {uploading ? "Mengunggah..." : "Unggah File Bukti"}
                              <input type="file" className="hidden" disabled={uploading} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUploadEvidence(f); e.target.value = ""; }} />
                            </label>
                          )}
                        </div>
                      </div>

                      {/* Verdict */}
                      <div>
                        <label className="text-sm font-medium text-ptba-charcoal mb-3 block">Verdict</label>
                        {isEditable ? (
                          <div className="flex gap-3">
                            <button type="button" onClick={() => setMyVerdict("sesuai")} className={cn("flex-1 rounded-xl py-4 text-center text-sm font-bold transition-all border-2", myVerdict === "sesuai" ? "border-green-500 bg-green-50 text-green-700 ring-2 ring-green-200" : "border-gray-200 bg-white text-gray-400 hover:border-green-300 hover:bg-green-50/50")}>
                              <CheckCircle2 className={cn("h-6 w-6 mx-auto mb-1", myVerdict === "sesuai" ? "text-green-500" : "text-gray-300")} />
                              Sesuai
                            </button>
                            <button type="button" onClick={() => setMyVerdict("tidak_sesuai")} className={cn("flex-1 rounded-xl py-4 text-center text-sm font-bold transition-all border-2", myVerdict === "tidak_sesuai" ? "border-red-500 bg-red-50 text-red-700 ring-2 ring-red-200" : "border-gray-200 bg-white text-gray-400 hover:border-red-300 hover:bg-red-50/50")}>
                              <X className={cn("h-6 w-6 mx-auto mb-1", myVerdict === "tidak_sesuai" ? "text-red-500" : "text-gray-300")} />
                              Tidak Sesuai
                            </button>
                            <button type="button" onClick={() => setMyVerdict("perlu_diskusi")} className={cn("flex-1 rounded-xl py-4 text-center text-sm font-bold transition-all border-2", myVerdict === "perlu_diskusi" ? "border-amber-500 bg-amber-50 text-amber-700 ring-2 ring-amber-200" : "border-gray-200 bg-white text-gray-400 hover:border-amber-300 hover:bg-amber-50/50")}>
                              <AlertTriangle className={cn("h-6 w-6 mx-auto mb-1", myVerdict === "perlu_diskusi" ? "text-amber-500" : "text-gray-300")} />
                              Perlu Diskusi
                            </button>
                          </div>
                        ) : (
                          <div className={cn("rounded-xl py-3 px-4 text-center text-sm font-bold", myVerdict === "sesuai" ? "bg-green-100 text-green-700" : myVerdict === "tidak_sesuai" ? "bg-red-100 text-ptba-red" : myVerdict === "perlu_diskusi" ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-500")}>
                            {myVerdict === "sesuai" ? "Sesuai" : myVerdict === "tidak_sesuai" ? "Tidak Sesuai" : myVerdict === "perlu_diskusi" ? "Perlu Didiskusikan Lebih Lanjut" : "Belum ada verdict"}
                          </div>
                        )}
                      </div>

                      {/* Action buttons */}
                      {isEditable && !confirmFinalize && (
                        <div className="flex items-center gap-3 pt-2">
                          <button type="button" onClick={handleSaveDraft} disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-ptba-navy px-5 py-2.5 text-sm font-semibold text-white hover:bg-ptba-navy/90 transition-colors disabled:opacity-50">
                            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Simpan Draft
                          </button>
                          <button type="button" onClick={() => setConfirmFinalize(true)} disabled={!myVerdict || !myComment || saving} className={cn("inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors", myVerdict && myComment ? "bg-ptba-gold text-white hover:bg-ptba-gold/90 shadow-md" : "bg-gray-200 text-gray-400 cursor-not-allowed")}>
                            <Lock className="h-4 w-4" /> Finalisasi
                          </button>
                        </div>
                      )}

                      {/* Finalize confirmation */}
                      {isEditable && confirmFinalize && (
                        <div className="rounded-lg border-2 border-amber-300 bg-amber-50 p-4">
                          <div className="flex items-start gap-3">
                            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-amber-800">Konfirmasi Finalisasi</p>
                              <p className="text-sm text-amber-700 mt-1">Setelah difinalisasi, evaluasi <strong>tidak dapat diubah</strong>.</p>
                              <div className="mt-3 rounded-lg bg-white/80 p-3">
                                <p className="text-xs text-ptba-gray mb-1">Verdict Anda:</p>
                                <p className={cn("text-lg font-bold", myVerdict === "sesuai" ? "text-green-600" : myVerdict === "perlu_diskusi" ? "text-amber-600" : "text-ptba-red")}>
                                  {selectedApp.partner_name}: {myVerdict === "sesuai" ? "Sesuai" : myVerdict === "perlu_diskusi" ? "Perlu Diskusi" : "Tidak Sesuai"}
                                </p>
                              </div>
                              <div className="flex items-center gap-3 mt-4">
                                <button type="button" onClick={handleFinalize} disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-ptba-red px-5 py-2.5 text-sm font-semibold text-white hover:bg-ptba-red/90 transition-colors disabled:opacity-50">
                                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />} Ya, Finalisasi
                                </button>
                                <button type="button" onClick={() => setConfirmFinalize(false)} className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-ptba-gray hover:bg-gray-50 transition-colors">Batal</button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Other Evaluations (read-only accordion) */}
                <div className="rounded-xl bg-white shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b">
                    <h3 className="text-base font-semibold text-ptba-navy">Evaluasi Kategori Lain</h3>
                    <p className="text-xs text-ptba-gray mt-0.5">Hanya evaluasi yang sudah difinalisasi yang ditampilkan.</p>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {ALL_CATEGORIES.filter((c) => c !== activeCategory).map((cat) => {
                      const evalData = (catEvals[selectedApp.id]?.evaluations || []).find((e) => e.category === cat);
                      const isOpen = expandedSections[`other_${cat}`] ?? false;
                      const catInfo = CATEGORY_LABELS[cat];
                      return (
                        <div key={cat}>
                          <button type="button" onClick={() => { if (evalData?.isFinalized) setExpandedSections((p) => ({ ...p, [`other_${cat}`]: !isOpen })); }} className={cn("w-full flex items-center justify-between px-6 py-3 transition-colors", evalData?.isFinalized ? "hover:bg-ptba-section-bg cursor-pointer" : "cursor-default")}>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3">
                                <span className={cn("rounded-full px-2.5 py-0.5 text-[10px] font-semibold shrink-0", catInfo.color)}>{catInfo.labelId}</span>
                                {evalData?.isFinalized ? (
                                  <span className={cn("text-xs font-semibold", evalData.verdict === "sesuai" || evalData.verdict === "layak" ? "text-green-600" : evalData.verdict === "perlu_diskusi" ? "text-amber-600" : "text-ptba-red")}>
                                    {evalData.verdict === "sesuai" || evalData.verdict === "layak" ? "Sesuai" : evalData.verdict === "perlu_diskusi" ? "Perlu Diskusi" : "Tidak Sesuai"}
                                  </span>
                                ) : (
                                  <span className="text-xs text-ptba-gray">Belum difinalisasi</span>
                                )}
                              </div>
                              <p className="text-[10px] text-ptba-gray/70 italic mt-0.5 truncate">{catInfo.description}</p>
                            </div>
                            {evalData?.isFinalized && <ChevronDown className={cn("h-4 w-4 text-ptba-gray transition-transform", isOpen && "rotate-180")} />}
                          </button>
                          {isOpen && evalData?.isFinalized && (
                            <div className="px-6 pb-4 space-y-2">
                              {evalData.evaluatorName && <p className="text-[10px] text-ptba-gray">Evaluator: {evalData.evaluatorName}</p>}
                              {evalData.comment && (
                                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 prose prose-sm max-w-none text-xs" dangerouslySetInnerHTML={{ __html: sanitizeHtml(evalData.comment) }} />
                              )}
                              {evalData.evidenceFiles.length > 0 && (
                                <div className="space-y-1">
                                  <p className="text-[10px] font-semibold text-ptba-gray uppercase">Evidence</p>
                                  {evalData.evidenceFiles.map((f) => (
                                    <div key={f.id} className="flex items-center gap-2 text-xs">
                                      <FileText className="h-3.5 w-3.5 text-ptba-steel-blue" />
                                      <span className="truncate flex-1">{f.fileName}</span>
                                      {f.fileKey && <button type="button" onClick={() => downloadDocument(f.fileKey, accessToken!, f.fileName)} className="text-ptba-steel-blue hover:text-ptba-navy"><Eye className="h-3 w-3" /></button>}
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
                </div>
              </div>
            )}

            {/* Submit for Approval */}
            {!viewOnly && isEbdOrAdmin && (
              <div className="rounded-xl bg-white p-6 shadow-sm mt-6 border border-gray-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", allAppsAllFinalized ? "bg-ptba-gold" : "bg-gray-200")}>
                    <Send className={cn("h-5 w-5", allAppsAllFinalized ? "text-white" : "text-gray-400")} />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-ptba-navy">Kirim Hasil Evaluasi untuk Persetujuan</h3>
                    <p className="text-sm text-ptba-gray mt-0.5">
                      {allAppsAllFinalized ? "Semua evaluasi (6 kategori) telah difinalisasi untuk semua mitra." : "Semua 6 kategori evaluasi harus difinalisasi untuk setiap mitra sebelum dapat dikirim."}
                    </p>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex items-center justify-between text-xs text-ptba-gray mb-1.5">
                    <span>Progress</span>
                    <span className="font-medium">{applicants.filter((a) => catEvals[a.id]?.allFinalized).length}/{applicants.length} mitra selesai (semua kategori)</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-gray-200 overflow-hidden">
                    <div className={cn("h-full rounded-full transition-all", allAppsAllFinalized ? "bg-green-500" : "bg-ptba-steel-blue")} style={{ width: `${applicants.length > 0 ? (applicants.filter((a) => catEvals[a.id]?.allFinalized).length / applicants.length) * 100 : 0}%` }} />
                  </div>
                </div>

                <button type="button" onClick={handleSubmitForApproval} disabled={!allAppsAllFinalized || submittedForApproval || saving} className={cn("w-full inline-flex items-center justify-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold transition-colors", allAppsAllFinalized && !submittedForApproval && !saving ? "bg-ptba-gold text-white hover:bg-ptba-gold/90 shadow-md" : "bg-gray-200 text-gray-400 cursor-not-allowed")}>
                  {submittedForApproval ? <><CheckCircle2 className="h-4 w-4" /> Sudah Dikirim untuk Persetujuan</> : saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Mengirim...</> : <><Send className="h-4 w-4" /> Kirim untuk Persetujuan</>}
                </button>

                {submittedForApproval && (
                  <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-4 text-center">
                    <p className="text-sm text-green-700">Item persetujuan telah dikirim.</p>
                    <Link href="/approvals" className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-ptba-navy hover:text-ptba-steel-blue transition-colors">
                      Lihat Antrian Persetujuan <ChevronRight className="h-4 w-4" />
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 toast-enter">
          <div className={cn("relative overflow-hidden rounded-xl shadow-2xl border min-w-[320px] max-w-[420px]", toast.type === "success" ? "bg-white border-green-200" : "bg-white border-red-200")}>
            <div className="flex items-start gap-3 px-5 py-4">
              <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full mt-0.5", toast.type === "success" ? "bg-green-100" : "bg-red-100")}>
                {toast.type === "success" ? <CheckCircle2 className="h-4.5 w-4.5 text-green-600" /> : <AlertTriangle className="h-4.5 w-4.5 text-red-600" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn("text-xs font-semibold", toast.type === "success" ? "text-green-800" : "text-red-800")}>{toast.type === "success" ? "Berhasil" : "Gagal"}</p>
                <p className="text-sm text-ptba-charcoal mt-0.5">{toast.message}</p>
              </div>
              <button onClick={() => setToast(null)} className="shrink-0 rounded-lg p-1 text-ptba-gray hover:bg-ptba-section-bg hover:text-ptba-charcoal transition-colors">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className={cn("h-1 toast-progress-bar", toast.type === "success" ? "bg-green-400" : "bg-red-400")} />
          </div>
        </div>
      )}
    </div>
  );
}
