"use client";

import { use, useState, useEffect, useCallback } from "react";
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
  Loader2,
  ChevronDown,
  ChevronUp,
  LockKeyhole,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useAuth } from "@/lib/auth/auth-context";
import { api, projectApi, downloadDocument } from "@/lib/api/client";
import {
  PHASE1_DOCUMENT_ITEMS,
  PHASE1_FORM_SECTION_ITEMS,
  ALL_FILTRATION_ITEMS,
} from "@/lib/constants/phase1-criteria";
import { formatDate } from "@/lib/utils/format";
import { DOCUMENT_TYPES } from "@/lib/constants/document-types";
import FormDataViewer from "@/components/features/project/form-data-viewer";
import { generateApplicationPdf } from "@/lib/utils/generate-application-pdf";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002/api";

// ── Form Data Rendering for Evaluator ─────────────────────────────────────────

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
                  <th className="py-1 text-left text-ptba-gray font-medium">Mata Uang</th>
                  <th className="py-1 text-left text-ptba-gray font-medium">Total Debt</th>
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
  // Aliases for section_financial → financial, section_requirements → requirements
  financial: undefined as any,
  requirements: undefined as any,
};
// Map aliases
EVAL_FORM_DATA_MAP.financial = EVAL_FORM_DATA_MAP.financial_overview;
EVAL_FORM_DATA_MAP.requirements = EVAL_FORM_DATA_MAP.requirements_fulfillment;

// ── Types ──────────────────────────────────────────────────────────────────────
interface MitraChecks {
  [itemId: string]: boolean | null; // null = not yet assessed
}

interface MitraComments {
  [itemId: string]: string;
}

type MitraStatus = "draft" | "finalized" | "returned";

interface MitraEvalState {
  checks: MitraChecks;
  comments: MitraComments;
  saved: boolean;
  status: MitraStatus;
  finalizedAt?: string;
  returnedReason?: string;
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
  phase1Documents: ApiDocument[];
  phase2Documents: ApiDocument[];
  generalDocuments: ApiDocument[];
}

interface ApiDocument {
  id: string;
  name: string;
  status: string;
  uploadDate: string;
  upload_date?: string;
  file_url?: string;
  fileUrl?: string;
}

interface ApiEvaluation {
  id: string;
  application_id: string;
  evaluator_id: string;
  overall_result: string | null;
  weighted_score: number | null;
  notes: string | null;
  evaluated_at: string | null;
  is_finalized: boolean;
  partner_id: string;
  partner_name: string;
  application_status: string;
  phase1_result: string | null;
}

interface ApiEvalDetail extends ApiEvaluation {
  scores: { criterion_id: string; score: number | null; passed: boolean | null; item_type: string; notes: string | null }[];
}

interface ApiProject {
  id: string;
  name: string;
  type: string;
  status: string;
  [key: string]: unknown;
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
  const { role, accessToken } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [downloadingZip, setDownloadingZip] = useState(false);

  // ── Loading & data state ────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCloseRegModal, setShowCloseRegModal] = useState(false);
  const [closingReg, setClosingReg] = useState(false);
  const [project, setProject] = useState<ApiProject | null>(null);
  const [phase1Applicants, setPhase1Applicants] = useState<ApiApplication[]>([]);
  const [evalStates, setEvalStates] = useState<Record<string, MitraEvalState>>({});
  const [submittedForApproval, setSubmittedForApproval] = useState(false);
  const [confirmFinalize, setConfirmFinalize] = useState<string | null>(null);
  const [ebdPanelTab, setEbdPanelTab] = useState<"penilaian" | "dokumen_formulir">("penilaian");
  const [evalDocSectionOpen, setEvalDocSectionOpen] = useState(true);
  const [evalFormSectionOpen, setEvalFormSectionOpen] = useState(true);
  const [selectedAppDocuments, setSelectedAppDocuments] = useState<ApiDocument[]>([]);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };
  const [selectedAppFormData, setSelectedAppFormData] = useState<any>(null);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [expandedDocs, setExpandedDocs] = useState<Record<string, boolean>>({});
  const [evalNotes, setEvalNotes] = useState<Record<string, string | null>>({});

  // ── Selected mitra ─────────────────────────────────────────────────────────
  const selectedPartnerId = searchParams.get("partnerId");
  const selectedApp = selectedPartnerId
    ? phase1Applicants.find((app) => app.partner_id === selectedPartnerId)
    : null;

  const navigateToMitra = (partnerId: string) => {
    router.push(`/projects/${id}/evaluation/phase1?partnerId=${partnerId}`);
  };

  const currentIndex = selectedApp
    ? phase1Applicants.findIndex((app) => app.partner_id === selectedPartnerId)
    : -1;
  const prevMitra = currentIndex > 0 ? phase1Applicants[currentIndex - 1] : null;
  const nextMitra = currentIndex >= 0 && currentIndex < phase1Applicants.length - 1
    ? phase1Applicants[currentIndex + 1] : null;

  const isAuthorized = role === "ebd" || role === "super_admin";

  // View-only: before registration is closed OR after evaluation/approval is done
  const projectPhase = (project as any)?.phase as string | undefined;
  const isEvalPhase = projectPhase === "phase1_closed" || projectPhase === "phase1_evaluation";
  const isRegistrationPhase = projectPhase === "phase1_registration";
  const viewOnly = !!projectPhase && !isEvalPhase;

  // ── Fetch project + applicants + evaluations ─────────────────────────────
  const fetchData = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      // Fetch project
      const projectRes = await projectApi(accessToken).getById(id);
      setProject(projectRes.data as ApiProject);

      // Fetch applications for this project
      const appsRes = await api<{ applications: ApiApplication[] }>("/applications", {
        token: accessToken,
      });
      const projectApps = appsRes.applications.filter(
        (app) => app.project_id === id && app.status !== "Draft"
      );
      setPhase1Applicants(projectApps);

      // Fetch existing evaluations
      let existingEvals: ApiEvaluation[] = [];
      try {
        const evalsRes = await api<{ evaluations: ApiEvaluation[] }>(
          `/evaluations/phase1/${id}`,
          { token: accessToken }
        );
        existingEvals = evalsRes.evaluations;
      } catch {
        // No evaluations yet — that's OK
      }

      // Build initial eval state from existing evaluations
      const state: Record<string, MitraEvalState> = {};
      const notes: Record<string, string | null> = {};

      for (const app of projectApps) {
        const existingEval = existingEvals.find(
          (ev) => ev.partner_id === app.partner_id || ev.application_id === app.id
        );

        if (existingEval && existingEval.evaluated_at) {
          // Fetch detailed scores for this evaluation
          try {
            const detailRes = await api<{ evaluation: ApiEvalDetail }>(
              `/evaluations/phase1/${id}/${app.id}`,
              { token: accessToken }
            );
            const checks: MitraChecks = {};
            const itemComments: MitraComments = {};
            detailRes.evaluation.scores.forEach((s) => {
              checks[s.criterion_id] = s.passed ?? null;
              if (s.notes) itemComments[s.criterion_id] = s.notes;
            });
            notes[app.partner_id] = detailRes.evaluation.notes;
            const isFinalized = !!existingEval.is_finalized;
            state[app.partner_id] = {
              checks,
              comments: itemComments,
              saved: true,
              status: isFinalized ? "finalized" : "draft",
              finalizedAt: isFinalized ? existingEval.evaluated_at ?? undefined : undefined,
            };
          } catch {
            const checks: MitraChecks = {};
            ALL_FILTRATION_ITEMS.forEach((c) => { checks[c.id] = null; });
            state[app.partner_id] = { checks, comments: {}, saved: false, status: "draft" };
          }
        } else {
          const checks: MitraChecks = {};
          ALL_FILTRATION_ITEMS.forEach((c) => { checks[c.id] = null; });
          state[app.partner_id] = { checks, comments: {}, saved: false, status: "draft" };
        }
      }

      setEvalStates(state);
      setEvalNotes(notes);
    } catch (err) {
      console.error("Failed to load evaluation data:", err);
    } finally {
      setLoading(false);
    }
  }, [id, accessToken]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Fetch documents when a mitra is selected and dokumen tab is active ────
  useEffect(() => {
    if (!selectedApp || !accessToken) {
      setSelectedAppDocuments([]);
      setSelectedAppFormData(null);
      setExpandedDocs({});
      return;
    }

    const fetchDocs = async () => {
      setLoadingDocs(true);
      try {
        const res = await api<{ application: ApiApplicationDetail }>(
          `/applications/${selectedApp.id}`,
          { token: accessToken }
        );
        setSelectedAppDocuments(res.application.phase1Documents || []);
        const fd = (res.application as any).form_data;
        setSelectedAppFormData(fd ? (typeof fd === "string" ? JSON.parse(fd) : fd) : null);
      } catch {
        setSelectedAppDocuments([]);
        setSelectedAppFormData(null);
      } finally {
        setLoadingDocs(false);
        setExpandedDocs({});
      }
    };

    fetchDocs();
  }, [selectedApp?.id, accessToken]);

  // ── Fetch detailed scores when a mitra is selected ────────────────────────
  useEffect(() => {
    if (!selectedApp || !accessToken) return;

    const partnerId = selectedApp.partner_id;
    const state = evalStates[partnerId];
    // Only fetch if we have a saved state but maybe haven't loaded scores yet
    if (!state || !state.saved) return;

    const fetchScores = async () => {
      try {
        const detailRes = await api<{ evaluation: ApiEvalDetail }>(
          `/evaluations/phase1/${id}/${selectedApp.id}`,
          { token: accessToken }
        );
        const checks: MitraChecks = {};
        const itemComments: MitraComments = {};
        detailRes.evaluation.scores.forEach((s) => {
          checks[s.criterion_id] = s.passed ?? null;
          if (s.notes) itemComments[s.criterion_id] = s.notes;
        });
        setEvalStates((prev) => ({
          ...prev,
          [partnerId]: {
            ...prev[partnerId],
            checks: { ...prev[partnerId].checks, ...checks },
            comments: { ...prev[partnerId].comments, ...itemComments },
          },
        }));
        setEvalNotes((prev) => ({
          ...prev,
          [partnerId]: detailRes.evaluation.notes,
        }));
      } catch {
        // Ignore — checks already in state from initial load
      }
    };

    fetchScores();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedApp?.id]);

  // ── Check helpers ──────────────────────────────────────────────────────────
  const updateCheck = (partnerId: string, itemId: string, passed: boolean) => {
    const state = evalStates[partnerId];
    if (state?.status === "finalized") return;
    setEvalStates((prev) => ({
      ...prev,
      [partnerId]: {
        ...prev[partnerId],
        checks: { ...prev[partnerId].checks, [itemId]: passed },
        saved: false,
      },
    }));
  };

  const updateComment = (partnerId: string, itemId: string, comment: string) => {
    const state = evalStates[partnerId];
    if (state?.status === "finalized") return;
    setEvalStates((prev) => ({
      ...prev,
      [partnerId]: {
        ...prev[partnerId],
        comments: { ...prev[partnerId].comments, [itemId]: comment },
        saved: false,
      },
    }));
  };

  const getPassedCount = (partnerId: string): { passed: number; total: number } => {
    const state = evalStates[partnerId];
    if (!state) return { passed: 0, total: ALL_FILTRATION_ITEMS.length };
    const passed = ALL_FILTRATION_ITEMS.filter((c) => state.checks[c.id] === true).length;
    return { passed, total: ALL_FILTRATION_ITEMS.length };
  };

  const getResult = (partnerId: string): "Lolos" | "Tidak Lolos" | "Belum Dinilai" => {
    const state = evalStates[partnerId];
    if (!state) return "Belum Dinilai";
    const allAssessed = ALL_FILTRATION_ITEMS.every((c) => state.checks[c.id] !== null && state.checks[c.id] !== undefined);
    if (!allAssessed) return "Belum Dinilai";
    return ALL_FILTRATION_ITEMS.every((c) => state.checks[c.id] === true) ? "Lolos" : "Tidak Lolos";
  };

  const isAllScored = (partnerId: string): boolean => {
    const state = evalStates[partnerId];
    if (!state) return false;
    return ALL_FILTRATION_ITEMS.every((c) => state.checks[c.id] !== null && state.checks[c.id] !== undefined);
  };

  // Build items payload from current state
  const buildItemsPayload = (partnerId: string) => {
    const state = evalStates[partnerId];
    if (!state) return [];
    return ALL_FILTRATION_ITEMS.map((item) => ({
      itemId: item.id,
      itemType: item.type,
      passed: state.checks[item.id] === true,
      notes: state.comments[item.id] || undefined,
    }));
  };

  // Save as draft (editable) — POST to API
  const handleSaveNilai = async (partnerId: string) => {
    const app = phase1Applicants.find((a) => a.partner_id === partnerId);
    if (!app || !accessToken) return;

    setSaving(true);
    try {
      await api(`/evaluations/phase1/${id}/${app.id}`, {
        method: "POST",
        token: accessToken,
        body: { items: buildItemsPayload(partnerId) },
      });

      setEvalStates((prev) => ({
        ...prev,
        [partnerId]: { ...prev[partnerId], saved: true },
      }));
      showToast("Filtrasi berhasil disimpan. Anda masih dapat mengubah penilaian ini.");
    } catch (err) {
      console.error("Failed to save filtration:", err);
      showToast("Gagal menyimpan evaluasi. Silakan coba lagi.", "error");
    } finally {
      setSaving(false);
    }
  };

  // Finalize (locked) — save then mark as finalized
  const handleFinalize = async (partnerId: string) => {
    const app = phase1Applicants.find((a) => a.partner_id === partnerId);
    if (!app || !accessToken) return;

    setSaving(true);
    try {
      // Save items first
      await api(`/evaluations/phase1/${id}/${app.id}`, {
        method: "POST",
        token: accessToken,
        body: { items: buildItemsPayload(partnerId) },
      });

      // Then lock the evaluation
      await api(`/evaluations/phase1/${id}/${app.id}/finalize`, {
        method: "POST",
        token: accessToken,
      });

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
      showToast("Nilai berhasil difinalisasi dan dikunci.");

      // Auto-navigate to next unfinalized mitra
      const nextUnfinalized = phase1Applicants.find(
        (a) => a.partner_id !== partnerId && evalStates[a.partner_id]?.status !== "finalized"
      );
      if (nextUnfinalized) {
        navigateToMitra(nextUnfinalized.partner_id);
      }
    } catch (err) {
      console.error("Failed to finalize evaluation:", err);
      showToast("Gagal memfinalisasi nilai. Silakan coba lagi.", "error");
    } finally {
      setSaving(false);
    }
  };

  // Submit all evaluations for approval — POST finalize endpoint
  const handleSubmitForApproval = async () => {
    if (!accessToken) return;
    setSaving(true);
    try {
      await api(`/approvals/phase1/${id}/submit`, {
        method: "POST",
        token: accessToken,
      });
      setSubmittedForApproval(true);
    } catch (err) {
      console.error("Failed to submit for approval:", err);
      showToast("Gagal mengirim evaluasi. Silakan coba lagi.", "error");
    } finally {
      setSaving(false);
    }
  };

  const allFinalized = phase1Applicants.length > 0 && phase1Applicants.every(
    (app) => evalStates[app.partner_id]?.status === "finalized"
  );

  const finalizedCount = phase1Applicants.filter(
    (app) => evalStates[app.partner_id]?.status === "finalized"
  ).length;

  // ── Status helpers for sidebar ─────────────────────────────────────────────
  const getMitraStatusLabel = (partnerId: string): { text: string; color: string } => {
    const state = evalStates[partnerId];
    if (!state) return { text: "Belum dinilai", color: "text-ptba-gray" };
    if (state.status === "finalized") {
      const r = getResult(partnerId);
      return r === "Lolos"
        ? { text: "Final \u00B7 Lolos", color: "text-green-600" }
        : { text: "Final \u00B7 Tidak Lolos", color: "text-ptba-red" };
    }
    if (state.status === "returned") return { text: "Dikembalikan", color: "text-amber-600" };
    if (state.saved) return { text: "Draft tersimpan", color: "text-ptba-steel-blue" };
    const allScored = isAllScored(partnerId);
    if (allScored) return { text: "Siap disimpan", color: "text-ptba-navy" };
    return { text: "Belum dinilai", color: "text-ptba-gray" };
  };

  // ── Render: Loading state ─────────────────────────────────────────────────
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
        <span className="text-ptba-charcoal font-medium">Evaluasi 1</span>
      </nav>

      <button
        onClick={() => router.push(`/projects/${id}`)}
        className="inline-flex items-center gap-1.5 text-sm text-ptba-gray hover:text-ptba-navy transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Kembali ke Proyek
      </button>

      {/* View-only banner during registration */}
      {isRegistrationPhase && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-100 shrink-0">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-amber-800">Mode Lihat Saja — Pendaftaran Masih Dibuka</p>
                <p className="text-xs text-amber-700 mt-0.5">Evaluasi hanya dapat dilakukan setelah pendaftaran Fase 1 ditutup. Saat ini Anda dapat melihat data dan mengunduh dokumen mitra.</p>
              </div>
            </div>
            <button
              onClick={() => setShowCloseRegModal(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-ptba-red px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-red-700 transition-colors shrink-0"
            >
              <LockKeyhole className="h-4 w-4" />
              Tutup Pendaftaran
            </button>
          </div>
        </div>
      )}

      {/* Close Registration Confirmation Modal */}
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
              <div className="flex items-start gap-2">
                <LockKeyhole className="h-3.5 w-3.5 text-ptba-red shrink-0 mt-0.5" />
                <span>Mitra tidak bisa mendaftar lagi ke proyek ini</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0 mt-0.5" />
                <span>Proyek akan masuk ke tahap evaluasi dokumen EoI</span>
              </div>
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                <span>Pastikan semua mitra yang diharapkan sudah mendaftar</span>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCloseRegModal(false)}
                className="flex-1 rounded-lg border border-ptba-light-gray px-4 py-2.5 text-sm font-medium text-ptba-gray hover:bg-ptba-section-bg transition-colors"
              >
                Batal
              </button>
              <button
                disabled={closingReg}
                onClick={async () => {
                  if (!accessToken) return;
                  setClosingReg(true);
                  try {
                    await projectApi(accessToken).closeRegistration(id);
                    await fetchData();
                    setShowCloseRegModal(false);
                  } catch (err: any) {
                    alert(err.message || "Gagal menutup pendaftaran");
                  } finally {
                    setClosingReg(false);
                  }
                }}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-ptba-red px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {closingReg ? <Loader2 className="h-4 w-4 animate-spin" /> : <LockKeyhole className="h-4 w-4" />}
                Ya, Tutup Pendaftaran
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-ptba-navy">Evaluasi Tahap 1 (EBD)</h1>
        <p className="text-sm text-ptba-gray mt-1">
          Evaluasi kelayakan mitra berdasarkan dokumen dan data Expression of Interest (EoI).
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
            <p className="text-[10px] uppercase tracking-wider text-ptba-gray">Sistem</p>
            <p className="text-sm font-bold text-ptba-navy">Lulus / Tidak Lulus</p>
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
        <div className={cn("grid grid-cols-1 gap-6", sidebarCollapsed ? "lg:grid-cols-1" : "lg:grid-cols-[280px_1fr]")}>
          {/* Sidebar */}
          <div className="rounded-xl bg-white shadow-sm overflow-hidden">
            <button
              type="button"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="w-full px-4 py-3 bg-ptba-navy flex items-center justify-between"
            >
              <div>
                <h3 className="text-sm font-semibold text-white text-left">Daftar Mitra ({phase1Applicants.length})</h3>
                {!sidebarCollapsed && <p className="text-[10px] text-white/60 mt-0.5 text-left">Pilih mitra untuk dievaluasi</p>}
              </div>
              <ChevronDown className={cn("h-4 w-4 text-white/60 transition-transform", !sidebarCollapsed && "rotate-180")} />
            </button>
            {!sidebarCollapsed && <div className="divide-y divide-gray-100">
              {phase1Applicants.map((app, idx) => {
                const state = evalStates[app.partner_id];
                const isSelected = app.partner_id === selectedPartnerId;
                const statusLabel = getMitraStatusLabel(app.partner_id);

                return (
                  <button
                    key={app.id}
                    onClick={() => navigateToMitra(app.partner_id)}
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
                          {app.partner_name}
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
            </div>}
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
                    onClick={() => navigateToMitra(phase1Applicants[0].partner_id)}
                    className="mt-6 inline-flex items-center gap-2 rounded-lg bg-ptba-navy px-5 py-2.5 text-sm font-semibold text-white hover:bg-ptba-navy/90 transition-colors"
                  >
                    Mulai Filtrasi Mitra Pertama <ChevronRight className="h-4 w-4" />
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-5">
                {(() => {
                  const app = selectedApp;
                  const state = evalStates[app.partner_id];
                  const passedCount = getPassedCount(app.partner_id);
                  const result = getResult(app.partner_id);
                  const allScored = isAllScored(app.partner_id);
                  const isFinalized = state?.status === "finalized";
                  const isReturned = state?.status === "returned";
                  const isEditable = !isFinalized && !viewOnly;
                  const existingNotes = evalNotes[app.partner_id];

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
                              {isFinalized ? <Lock className="h-5 w-5" /> : app.partner_name.charAt(0)}
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-ptba-charcoal">{app.partner_name}</h3>
                              <p className="text-xs text-ptba-gray">
                                Mitra {currentIndex + 1} dari {phase1Applicants.length} · Mendaftar: {formatDate(app.applied_at)}
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

                        {/* PDF Download + Download All Docs + Prev / Next */}
                        <div className="px-6 py-2 bg-ptba-section-bg border-b border-gray-100 flex items-center gap-2 flex-wrap">
                          {selectedAppFormData && (
                            <button
                              type="button"
                              onClick={() => {
                                try {
                                  generateApplicationPdf(app.partner_name || "Mitra", selectedAppFormData);
                                } catch (err) {
                                  console.error("PDF generation failed:", err);
                                  alert("Gagal membuat PDF: " + (err instanceof Error ? err.message : String(err)));
                                }
                              }}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-ptba-steel-blue px-3 py-1.5 text-xs font-medium text-ptba-steel-blue hover:bg-ptba-steel-blue/5 transition-colors"
                            >
                              <Download className="h-3.5 w-3.5" /> Unduh PDF Formulir
                            </button>
                          )}
                          {selectedAppDocuments.length > 0 && (
                            <button
                              type="button"
                              disabled={downloadingZip}
                              onClick={async () => {
                                setDownloadingZip(true);
                                try {
                                  const JSZip = (await import("jszip")).default;
                                  const zip = new JSZip();
                                  for (const doc of selectedAppDocuments) {
                                    const fk = (doc as any).file_key;
                                    if (!fk) continue;
                                    const res = await api<{ url: string }>(`/documents/download/${encodeURIComponent(fk)}`, { token: accessToken! });
                                    if (res.url) {
                                      const blob = await fetch(res.url).then((r) => r.blob());
                                      const ext = fk.split(".").pop() || "pdf";
                                      const name = `${doc.name || fk.split("/").pop()}.${ext}`;
                                      zip.file(name, blob);
                                    }
                                  }
                                  const content = await zip.generateAsync({ type: "blob" });
                                  const url = URL.createObjectURL(content);
                                  const a = document.createElement("a");
                                  a.href = url;
                                  a.download = `Dokumen_${(app.partner_name || "Mitra").replace(/\s+/g, "_")}.zip`;
                                  document.body.appendChild(a);
                                  a.click();
                                  document.body.removeChild(a);
                                  URL.revokeObjectURL(url);
                                } catch { /* ignore */ } finally {
                                  setDownloadingZip(false);
                                }
                              }}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-ptba-navy px-3 py-1.5 text-xs font-medium text-ptba-navy hover:bg-ptba-navy/5 transition-colors disabled:opacity-50"
                            >
                              {downloadingZip ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                              {downloadingZip ? "Mengunduh dokumen..." : `Unduh Semua Dokumen (${selectedAppDocuments.length})`}
                            </button>
                          )}
                        </div>
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
                          <span className="text-xs text-ptba-gray">{currentIndex + 1} / {phase1Applicants.length}</span>
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
                          </div>
                        </div>
                      )}

                      {/* Evaluation Panel */}
                      <div className="rounded-xl bg-white shadow-sm overflow-hidden">

                        {/* Penilaian Content — unified sections mirroring EoI form */}
                        {(
                          <div className={cn("p-6", isFinalized && "opacity-75")}>
                            {/* Unified sections: each combines doc eval + form eval + related documents */}
                            {(() => {
                              const DOC_SECTION_MAP: Record<string, string[]> = {
                                compro: ["compro", "nib_document", "org_structure"],
                                statement_eoi: ["statement_eoi"],
                                portfolio: ["portfolio", ...selectedAppDocuments.filter((d: any) => (d.document_type_id || "").startsWith("credential_exp_")).map((d: any) => d.document_type_id)],
                                financial_overview: ["financial_overview", "ebitda_dscr_calculation", "credit_rating_evidence", ...selectedAppDocuments.filter((d: any) => (d.document_type_id || "").startsWith("audited_financial_")).map((d: any) => d.document_type_id)],
                                requirements_fulfillment: ["requirements_fulfillment"],
                              };
                              const UNIFIED_SECTIONS = [
                                { docItem: PHASE1_DOCUMENT_ITEMS[0], formItem: PHASE1_FORM_SECTION_ITEMS[0], title: EVAL_FORM_DATA_MAP.compro?.title || "Company Profile", formKey: "compro" },
                                { docItem: PHASE1_DOCUMENT_ITEMS[1], formItem: PHASE1_FORM_SECTION_ITEMS[1], title: EVAL_FORM_DATA_MAP.statement_eoi?.title || "Surat Pernyataan EoI", formKey: "statement_eoi" },
                                { docItem: PHASE1_DOCUMENT_ITEMS[2], formItem: PHASE1_FORM_SECTION_ITEMS[2], title: EVAL_FORM_DATA_MAP.portfolio?.title || "Pengalaman Proyek", formKey: "portfolio" },
                                { docItem: PHASE1_DOCUMENT_ITEMS[3], formItem: PHASE1_FORM_SECTION_ITEMS[3], title: EVAL_FORM_DATA_MAP.financial?.title || "Data Keuangan", formKey: "financial_overview" },
                                { docItem: PHASE1_DOCUMENT_ITEMS[4], formItem: PHASE1_FORM_SECTION_ITEMS[4], title: EVAL_FORM_DATA_MAP.requirements?.title || "Pemenuhan Persyaratan", formKey: "requirements_fulfillment" },
                              ];
                              // Find additional docs not in any section
                              const allMappedDocIds = Object.values(DOC_SECTION_MAP).flat();
                              const additionalDocs = selectedAppDocuments.filter((d: any) => !allMappedDocIds.includes(d.document_type_id));

                              return (
                                <div className="space-y-4">
                                  {UNIFIED_SECTIONS.map((section, sIdx) => {
                                    const docChecked = state?.checks[section.docItem.id];
                                    const docComment = state?.comments[section.docItem.id] || "";
                                    const formChecked = state?.checks[section.formItem.id];
                                    const formComment = state?.comments[section.formItem.id] || "";
                                    const relatedDocIds = DOC_SECTION_MAP[section.docItem.id] || [section.docItem.id];
                                    const matchedDocs = selectedAppDocuments.filter((d: any) => relatedDocIds.includes(d.document_type_id));
                                    const sectionKey = section.formItem.id.replace("section_", "");
                                    const formRenderer = EVAL_FORM_DATA_MAP[sectionKey];
                                    const isOpen = expandedDocs[`section_${sIdx}`] ?? true;

                                    return (
                                      <div key={sIdx} className="rounded-xl border border-gray-200 overflow-hidden">
                                        {/* Section header */}
                                        <button type="button" onClick={() => setExpandedDocs((prev) => ({ ...prev, [`section_${sIdx}`]: !isOpen }))} className="w-full flex items-center justify-between px-4 py-3 bg-ptba-section-bg hover:bg-ptba-light-gray/30 transition-colors">
                                          <span className="text-sm font-bold text-ptba-navy">{sIdx + 1}. {section.title}</span>
                                          <ChevronDown className={cn("h-4 w-4 text-ptba-gray transition-transform", isOpen && "rotate-180")} />
                                        </button>

                                        {isOpen && (
                                          <div className="p-4 space-y-3">
                                            {/* Form Data */}
                                            {formRenderer && selectedAppFormData && (
                                              <div className="rounded-lg border border-gray-200 bg-white p-3">
                                                {formRenderer.render(selectedAppFormData)}
                                              </div>
                                            )}

                                            {/* Documents */}
                                            {matchedDocs.length > 0 && (
                                              <div className="space-y-1.5">
                                                <p className="text-[10px] font-semibold text-ptba-gray uppercase">Dokumen ({matchedDocs.length})</p>
                                                {matchedDocs.map((doc: any) => (
                                                  <div key={doc.id} className="flex items-center gap-2 rounded border border-gray-200 bg-white px-3 py-2">
                                                    <FileText className="h-4 w-4 text-ptba-steel-blue shrink-0" />
                                                    <div className="flex-1 min-w-0">
                                                      <p className="text-xs text-ptba-charcoal truncate">{doc.name}</p>
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

                                        {/* Evaluation pass/fail — always visible, side by side */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 border-t border-gray-200 bg-gray-50/30">
                                          <div className={cn("rounded-lg border p-3", docChecked === true ? "border-green-200 bg-green-50/30" : docChecked === false ? "border-red-200 bg-red-50/30" : "border-gray-100 bg-white")}>
                                            <div className="flex items-center justify-between mb-1.5">
                                              <p className="text-xs font-medium text-ptba-gray">Penilaian Dokumen</p>
                                              {isEditable ? (
                                                <div className="flex gap-1.5">
                                                  <button type="button" onClick={() => updateCheck(app.partner_id, section.docItem.id, true)} className={cn("px-3 py-1 rounded-full text-xs font-semibold transition-all", docChecked === true ? "bg-green-500 text-white" : "bg-gray-200 text-gray-500 hover:bg-green-100")}>Lulus</button>
                                                  <button type="button" onClick={() => updateCheck(app.partner_id, section.docItem.id, false)} className={cn("px-3 py-1 rounded-full text-xs font-semibold transition-all", docChecked === false ? "bg-ptba-red text-white" : "bg-gray-200 text-gray-500 hover:bg-red-100")}>Tidak Lulus</button>
                                                </div>
                                              ) : (
                                                <span className={cn("px-3 py-1 rounded-full text-xs font-semibold", docChecked === true ? "bg-green-100 text-green-700" : docChecked === false ? "bg-red-100 text-ptba-red" : "bg-gray-100 text-gray-500")}>{docChecked === true ? "Lulus" : docChecked === false ? "Tidak Lulus" : "Belum"}</span>
                                              )}
                                            </div>
                                            {isEditable ? (
                                              <textarea placeholder="Komentar dokumen..." value={docComment} onChange={(e) => updateComment(app.partner_id, section.docItem.id, e.target.value)} className="w-full rounded border border-gray-200 px-2.5 py-1.5 text-xs text-ptba-charcoal outline-none focus:border-ptba-steel-blue resize-none" rows={1} />
                                            ) : docComment ? <p className="text-xs text-ptba-gray">{docComment}</p> : null}
                                          </div>

                                          <div className={cn("rounded-lg border p-3", formChecked === true ? "border-green-200 bg-green-50/30" : formChecked === false ? "border-red-200 bg-red-50/30" : "border-gray-100 bg-white")}>
                                            <div className="flex items-center justify-between mb-1.5">
                                              <p className="text-xs font-medium text-ptba-gray">Penilaian Data Formulir</p>
                                              {isEditable ? (
                                                <div className="flex gap-1.5">
                                                  <button type="button" onClick={() => updateCheck(app.partner_id, section.formItem.id, true)} className={cn("px-3 py-1 rounded-full text-xs font-semibold transition-all", formChecked === true ? "bg-green-500 text-white" : "bg-gray-200 text-gray-500 hover:bg-green-100")}>Lulus</button>
                                                  <button type="button" onClick={() => updateCheck(app.partner_id, section.formItem.id, false)} className={cn("px-3 py-1 rounded-full text-xs font-semibold transition-all", formChecked === false ? "bg-ptba-red text-white" : "bg-gray-200 text-gray-500 hover:bg-red-100")}>Tidak Lulus</button>
                                                </div>
                                              ) : (
                                                <span className={cn("px-3 py-1 rounded-full text-xs font-semibold", formChecked === true ? "bg-green-100 text-green-700" : formChecked === false ? "bg-red-100 text-ptba-red" : "bg-gray-100 text-gray-500")}>{formChecked === true ? "Lulus" : formChecked === false ? "Tidak Lulus" : "Belum"}</span>
                                              )}
                                            </div>
                                            {isEditable ? (
                                              <textarea placeholder="Komentar data..." value={formComment} onChange={(e) => updateComment(app.partner_id, section.formItem.id, e.target.value)} className="w-full rounded border border-gray-200 px-2.5 py-1.5 text-xs text-ptba-charcoal outline-none focus:border-ptba-steel-blue resize-none" rows={1} />
                                            ) : formComment ? <p className="text-xs text-ptba-gray">{formComment}</p> : null}
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}

                                  {/* Additional Documents (not in any section) */}
                                  {additionalDocs.length > 0 && (() => {
                                    const addChecked = state?.checks["additional_docs"];
                                    const addComment = state?.comments["additional_docs"] || "";
                                    return (
                                      <div className="rounded-xl border border-gray-200 overflow-hidden">
                                        <div className="px-4 py-3 bg-ptba-section-bg">
                                          <span className="text-sm font-bold text-ptba-navy">6. Dokumen Tambahan ({additionalDocs.length})</span>
                                        </div>
                                        <div className="p-4 space-y-1.5">
                                          {additionalDocs.map((doc: any) => (
                                            <div key={doc.id} className="flex items-center gap-2 rounded border border-gray-200 bg-white px-3 py-2">
                                              <FileText className="h-4 w-4 text-ptba-steel-blue shrink-0" />
                                              <div className="flex-1 min-w-0">
                                                <p className="text-xs text-ptba-charcoal truncate">{doc.name}</p>
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
                                        <div className={cn("p-4 border-t border-gray-200 bg-gray-50/30", addChecked === true ? "bg-green-50/30" : addChecked === false ? "bg-red-50/30" : "")}>
                                          <div className="flex items-center justify-between mb-1.5">
                                            <p className="text-xs font-medium text-ptba-gray">Penilaian Dokumen Tambahan</p>
                                            {isEditable ? (
                                              <div className="flex gap-1.5">
                                                <button type="button" onClick={() => updateCheck(app.partner_id, "additional_docs", true)} className={cn("px-3 py-1 rounded-full text-xs font-semibold transition-all", addChecked === true ? "bg-green-500 text-white" : "bg-gray-200 text-gray-500 hover:bg-green-100")}>Lulus</button>
                                                <button type="button" onClick={() => updateCheck(app.partner_id, "additional_docs", false)} className={cn("px-3 py-1 rounded-full text-xs font-semibold transition-all", addChecked === false ? "bg-ptba-red text-white" : "bg-gray-200 text-gray-500 hover:bg-red-100")}>Tidak Lulus</button>
                                              </div>
                                            ) : (
                                              <span className={cn("px-3 py-1 rounded-full text-xs font-semibold", addChecked === true ? "bg-green-100 text-green-700" : addChecked === false ? "bg-red-100 text-ptba-red" : "bg-gray-100 text-gray-500")}>{addChecked === true ? "Lulus" : addChecked === false ? "Tidak Lulus" : "Belum"}</span>
                                            )}
                                          </div>
                                          {isEditable ? (
                                            <textarea placeholder="Catatan dokumen tambahan..." value={addComment} onChange={(e) => updateComment(app.partner_id, "additional_docs", e.target.value)} className="w-full rounded border border-gray-200 px-2.5 py-1.5 text-xs text-ptba-charcoal outline-none focus:border-ptba-steel-blue resize-none" rows={1} />
                                          ) : addComment ? <p className="text-xs text-ptba-gray">{addComment}</p> : null}
                                        </div>
                                      </div>
                                    );
                                  })()}
                                </div>
                              );
                            })()}

                            {/* Summary */}
                            <div className="rounded-lg bg-ptba-section-bg p-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm font-medium text-ptba-gray">Hasil Evaluasi</p>
                                  <p className="text-xs text-ptba-gray mt-0.5">Semua item harus Lulus untuk lolos</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-bold text-ptba-charcoal">{passedCount.passed} / {passedCount.total} Lulus</p>
                                  <p className={cn("text-lg font-extrabold", result === "Lolos" ? "text-green-600" : result === "Tidak Lolos" ? "text-ptba-red" : "text-ptba-navy")}>
                                    {result}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {existingNotes && (
                              <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50/50 p-4">
                                <p className="text-xs font-medium text-ptba-gray mb-1">Catatan</p>
                                <p className="text-sm text-ptba-charcoal">{existingNotes}</p>
                              </div>
                            )}
                          </div>
                        )}

                      </div>

                      {/* Action Buttons */}
                      {isEditable && (
                        <div className="rounded-xl bg-white p-5 shadow-sm">
                          {/* Finalization Confirmation Dialog */}
                          {confirmFinalize === app.partner_id ? (
                            <div className="rounded-lg border-2 border-amber-300 bg-amber-50 p-4">
                              <div className="flex items-start gap-3">
                                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                                <div className="flex-1">
                                  <p className="text-sm font-semibold text-amber-800">Konfirmasi Finalisasi Filtrasi</p>
                                  <p className="text-sm text-amber-700 mt-1">
                                    Setelah difinalisasi, hasil <strong>tidak dapat diubah</strong> kecuali dikembalikan oleh atasan.
                                    Pastikan semua penilaian sudah benar.
                                  </p>
                                  <div className="mt-3 rounded-lg bg-white/80 p-3">
                                    <p className="text-xs text-ptba-gray mb-1">Hasil evaluasi:</p>
                                    <p className={cn(
                                      "text-lg font-bold",
                                      result === "Lolos" ? "text-green-600" : "text-ptba-red"
                                    )}>
                                      {app.partner_name}: {result} ({passedCount.passed}/{passedCount.total} Lulus)
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-3 mt-4">
                                    <button
                                      type="button"
                                      onClick={() => handleFinalize(app.partner_id)}
                                      disabled={saving}
                                      className="inline-flex items-center gap-2 rounded-lg bg-ptba-red px-5 py-2.5 text-sm font-semibold text-white hover:bg-ptba-red/90 transition-colors disabled:opacity-50"
                                    >
                                      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />} Ya, Finalisasi Nilai
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
                                onClick={() => handleSaveNilai(app.partner_id)}
                                disabled={!allScored || saving}
                                className={cn(
                                  "inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors",
                                  allScored && !saving
                                    ? "bg-ptba-navy text-white hover:bg-ptba-navy/90"
                                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                                )}
                              >
                                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Simpan Nilai Sementara
                              </button>

                              {/* Finalisasi Nilai */}
                              <button
                                type="button"
                                onClick={() => setConfirmFinalize(app.partner_id)}
                                disabled={!allScored || saving}
                                className={cn(
                                  "inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors",
                                  allScored && !saving
                                    ? "bg-ptba-gold text-white hover:bg-ptba-gold/90 shadow-md"
                                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                                )}
                              >
                                <Lock className="h-4 w-4" /> Finalisasi Nilai
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

            {/* Submit to Ketua Tim */}
            {!viewOnly && <div className="rounded-xl bg-white p-6 shadow-sm mt-6 border border-gray-100">
              <div className="flex items-center gap-3 mb-4">
                <div className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-lg",
                  allFinalized ? "bg-ptba-gold" : "bg-gray-200"
                )}>
                  <Send className={cn("h-5 w-5", allFinalized ? "text-white" : "text-gray-400")} />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-ptba-navy">Kirim Hasil Evaluasi untuk Persetujuan</h3>
                  <p className="text-sm text-ptba-gray mt-0.5">
                    {(project as any)?.isOpenForApplication
                      ? "Pendaftaran Fase 1 masih dibuka. Tutup pendaftaran terlebih dahulu sebelum mengirim untuk persetujuan."
                      : allFinalized
                        ? "Semua nilai mitra telah difinalisasi. Kirim untuk persetujuan pimpinan."
                        : `${finalizedCount} dari ${phase1Applicants.length} mitra difinalisasi. Finalisasi semua mitra untuk mengirim persetujuan.`}
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
                      {phase1Applicants.filter((a) => getResult(a.partner_id) === "Lolos").length}
                    </p>
                    <p className="text-xs text-green-700">Mitra Lolos</p>
                  </div>
                  <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-center">
                    <p className="text-2xl font-bold text-ptba-red">
                      {phase1Applicants.filter((a) => getResult(a.partner_id) === "Tidak Lolos").length}
                    </p>
                    <p className="text-xs text-ptba-red">Mitra Tidak Lolos</p>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={handleSubmitForApproval}
                disabled={!allFinalized || submittedForApproval || saving || !!(project as any)?.isOpenForApplication}
                className={cn(
                  "w-full inline-flex items-center justify-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold transition-colors",
                  allFinalized && !submittedForApproval && !saving && !(project as any)?.isOpenForApplication
                    ? "bg-ptba-gold text-white hover:bg-ptba-gold/90 shadow-md"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                )}
              >
                {submittedForApproval ? (
                  <><CheckCircle2 className="h-4 w-4" /> Sudah Dikirim untuk Persetujuan</>
                ) : saving ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Mengirim...</>
                ) : (project as any)?.isOpenForApplication ? (
                  <><Clock className="h-4 w-4" /> Pendaftaran Masih Dibuka</>
                ) : (
                  <><Send className="h-4 w-4" /> Kirim untuk Persetujuan</>
                )}
              </button>

              {submittedForApproval && (
                <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-4 text-center">
                  <p className="text-sm text-green-700">
                    Item persetujuan telah dikirim.
                  </p>
                  <Link
                    href="/approvals"
                    className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-ptba-navy hover:text-ptba-steel-blue transition-colors"
                  >
                    Lihat Antrian Persetujuan <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              )}
            </div>}
          </div>
        </div>
      )}

      {/* Toast notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 toast-enter">
          <div className={cn(
            "relative overflow-hidden rounded-xl shadow-2xl border min-w-[320px] max-w-[420px]",
            toast.type === "success"
              ? "bg-white border-green-200"
              : "bg-white border-red-200"
          )}>
            <div className="flex items-start gap-3 px-5 py-4">
              <div className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full mt-0.5",
                toast.type === "success" ? "bg-green-100" : "bg-red-100"
              )}>
                {toast.type === "success" ? (
                  <CheckCircle2 className="h-4.5 w-4.5 text-green-600" />
                ) : (
                  <AlertTriangle className="h-4.5 w-4.5 text-red-600" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn(
                  "text-xs font-semibold",
                  toast.type === "success" ? "text-green-800" : "text-red-800"
                )}>
                  {toast.type === "success" ? "Berhasil" : "Gagal"}
                </p>
                <p className="text-sm text-ptba-charcoal mt-0.5">{toast.message}</p>
              </div>
              <button
                onClick={() => setToast(null)}
                className="shrink-0 rounded-lg p-1 text-ptba-gray hover:bg-ptba-section-bg hover:text-ptba-charcoal transition-colors"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {/* Progress bar */}
            <div className={cn(
              "h-1 toast-progress-bar",
              toast.type === "success" ? "bg-green-400" : "bg-red-400"
            )} />
          </div>
        </div>
      )}
    </div>
  );
}
