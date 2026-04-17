"use client";

import { use, useState, useMemo, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import {
  ArrowLeft,
  ArrowRight,
  Plus,
  Trash2,
  Save,
  Pencil,
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
  Download,
  ChevronDown,
  HelpCircle,
  MessageSquare,
  MessagesSquare,
  Inbox,
  CircleDot,
  CheckCheck,
  Lock,
  Unlock,
  CalendarClock,
  ImagePlus,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { sanitizeHtml } from "@/lib/utils/sanitize";
import { formatChatTime, formatChatDaySeparator, isSameDay } from "@/lib/utils/format";
import { useAuth } from "@/lib/auth/auth-context";
import { api, projectApi, authApi, downloadDocument, fetchWithAuth } from "@/lib/api/client";
import { PROJECT_STEPS, PHASE1_STEPS, PHASE2_STEPS, PHASE3_STEPS } from "@/lib/constants/project-steps";
import { DOCUMENT_TYPES } from "@/lib/constants/document-types";

function formatCurrency(value: number): string {
  if (value >= 1_000_000_000_000) return `Rp ${(value / 1_000_000_000_000).toFixed(1)} T`;
  if (value >= 1_000_000_000) return `Rp ${(value / 1_000_000_000).toFixed(1)} M`;
  return `Rp ${(value / 1_000_000).toFixed(0)} Jt`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

function formatDateTime(dateStr: string): string {
  const d = new Date(dateStr);
  const date = d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
  const time = d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" });
  return `${date}, ${time} WIB`;
}

/** Convert ISO timestamp to datetime-local value in WIB */
function formatToWibDatetime(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  const wib = new Date(d.getTime() + 7 * 60 * 60 * 1000);
  const yyyy = wib.getUTCFullYear();
  const mm = String(wib.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(wib.getUTCDate()).padStart(2, "0");
  const hh = String(wib.getUTCHours()).padStart(2, "0");
  const min = String(wib.getUTCMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
}

function statusBadgeClass(status: string): string {
  const map: Record<string, string> = {
    Draft: "bg-gray-100 text-gray-600",
    Dipublikasikan: "bg-teal-100 text-teal-700",
    Evaluasi: "bg-blue-100 text-blue-700",
    Persetujuan: "bg-amber-100 text-amber-700",
    Selesai: "bg-green-100 text-green-700",
    Dibatalkan: "bg-red-100 text-red-700",
  };
  return map[status] ?? "bg-gray-100 text-gray-600";
}

function typeBadgeClass(type: string): string {
  const map: Record<string, string> = {
    mining: "bg-amber-100 text-amber-700",
    power_generation: "bg-ptba-navy/10 text-ptba-navy",
    coal_processing: "bg-ptba-gold/10 text-ptba-gold",
    infrastructure: "bg-ptba-steel-blue/10 text-ptba-steel-blue",
    environmental: "bg-green-100 text-green-700",
    corporate: "bg-gray-100 text-gray-600",
    others: "bg-purple-100 text-purple-700",
    CAPEX: "bg-ptba-navy/10 text-ptba-navy",
    OPEX: "bg-ptba-steel-blue/10 text-ptba-steel-blue",
    Strategis: "bg-ptba-gold/10 text-ptba-gold",
  };
  return map[type] ?? "bg-gray-100 text-gray-600";
}

function typeLabel(type: string): string {
  const map: Record<string, string> = {
    mining: "Operasi Pertambangan",
    power_generation: "Pembangkit Listrik",
    coal_processing: "Pengolahan Batubara",
    infrastructure: "Infrastruktur",
    environmental: "Lingkungan & Reklamasi",
    corporate: "Layanan Korporat",
    others: "Lainnya",
  };
  return map[type] ?? type;
}

function phaseLabel(phase?: string): string {
  if (!phase) return "";
  const map: Record<string, string> = {
    phase1_registration: "Fase 1 - Pendaftaran",
    phase1_closed: "Fase 1 - Pendaftaran Ditutup",
    phase1_evaluation: "Fase 1 - Evaluasi Tahap 1",
    phase1_approval: "Fase 1 - Persetujuan",
    phase1_announcement: "Fase 1 - Pengumuman Shortlist",
    phase1_approved: "Fase 1 - Disetujui Ketua Tim",
    phase2_registration: "Fase 2 - Pendaftaran",
    phase2_evaluation: "Fase 2 - Evaluasi Tahap 2",
    phase2_approval: "Fase 2 - Persetujuan",
    phase2_announcement: "Fase 2 - Pengumuman",
    phase2_approved: "Fase 2 - Disetujui",
    completed: "Selesai",
    cancelled: "Dibatalkan",
  };
  return map[phase] ?? phase;
}

const DOC_TYPE_LABELS: Record<string, string> = {
  compro: "Company Profile",
  statement_eoi: "Surat Pernyataan EoI",
  portfolio: "Portfolio Proyek",
  financial_overview: "Gambaran Umum Keuangan",
  requirements_fulfillment: "Pemenuhan Persyaratan",
  confidential_guarantee_letter: "Confidential Guarantee Letter",
  adherence_letter: "Adherence Letter",
  confidential_guarantee_signed: "Confidential Guarantee (Signed)",
  loi_signed: "Letter of Intent (Signed)",
  financial_detail: "Laporan Keuangan Detail",
  info_detail: "Informasi Detail Perusahaan",
  proposal_detail: "Proposal Teknis & Komersial",
  rencana_kerja: "Rencana Kerja & Jadwal",
  rab: "Rencana Anggaran Biaya (RAB)",
  akta_pendirian: "Akta Pendirian",
  siup: "SIUP",
  tdp_nib: "TDP/NIB",
  npwp: "NPWP",
  laporan_keuangan: "Laporan Keuangan (3 tahun)",
  referensi_bank: "Surat Referensi Bank",
  pengalaman_kerja: "Daftar Pengalaman Kerja",
  sertifikat_iso: "Sertifikat ISO",
  profil_perusahaan: "Profil Perusahaan",
  struktur_organisasi: "Struktur Organisasi",
  surat_pernyataan: "Surat Pernyataan",
  jaminan_penawaran: "Jaminan Penawaran",
  jaminan_pelaksanaan: "Jaminan Pelaksanaan",
  surat_kuasa: "Surat Kuasa",
  amdal_ukl_upl: "AMDAL/UKL-UPL",
  daftar_peralatan: "Daftar Peralatan",
  daftar_tenaga_ahli: "Daftar Tenaga Ahli",
};

function formatDocTypeLabel(typeId: string): string {
  if (DOC_TYPE_LABELS[typeId]) return DOC_TYPE_LABELS[typeId];
  if (typeId.startsWith("credential_exp_")) return "Dokumen Kredensial";
  if (typeId.startsWith("custom_")) return typeId.slice(7).replace(/_/g, " ");
  return typeId.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

const DOC_NAME_MAP: Record<string, string> = {
  nib_document: "NIB Document",
  org_structure: "Struktur Organisasi",
  ebitda_dscr_calculation: "EBITDA & DSCR Calculation",
  credit_rating_evidence: "Credit Rating Evidence",
  cash_on_hand_evidence: "Cash on Hand Evidence",
  company_history: "Company History & Milestones",
};

function formatDocName(name: string): string {
  // Check for known doc type prefixes in the name
  if (name.startsWith("credential_exp_")) {
    const dashIdx = name.indexOf(" - ");
    if (dashIdx !== -1) return `Dokumen Kredensial${name.slice(dashIdx)}`;
    return "Dokumen Kredensial";
  }
  if (name.startsWith("audited_financial_")) {
    const dashIdx = name.indexOf(" - ");
    const year = name.match(/audited_financial_(\d{4})/)?.[1] || "";
    const suffix = dashIdx !== -1 ? name.slice(dashIdx) : "";
    return `Laporan Keuangan Audit ${year}${suffix}`;
  }
  // Check mapped names (e.g. "nib_document - tess" → "NIB Document - tess")
  for (const [key, label] of Object.entries(DOC_NAME_MAP)) {
    if (name.startsWith(key)) {
      const dashIdx = name.indexOf(" - ");
      const suffix = dashIdx !== -1 ? name.slice(dashIdx) : "";
      return `${label}${suffix}`;
    }
  }
  // Generic: replace underscores with spaces and title-case
  return name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function DokumenTab({ partners, accessToken }: { partners: any[]; accessToken: string | null }) {
  const [partnerDocs, setPartnerDocs] = useState<Record<string, any[]>>({});
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!accessToken || partners.length === 0) {
      setLoadingDocs(false);
      return;
    }
    Promise.all(
      partners.map(async (p) => {
        try {
          const res = await api<{ application: any }>(`/applications/${p.applicationId}`, { token: accessToken });
          const app = res.application;
          const docs = [
            ...(app.phase1Documents || []),
            ...(app.phase2Documents || []),
            ...(app.generalDocuments || []),
          ];
          return { partnerId: p.id, docs };
        } catch {
          return { partnerId: p.id, docs: [] };
        }
      })
    ).then((results) => {
      const map: Record<string, any[]> = {};
      for (const r of results) map[r.partnerId] = r.docs;
      setPartnerDocs(map);
    }).finally(() => setLoadingDocs(false));
  }, [accessToken, partners]);

  const handleDownload = async (fileKey: string) => {
    if (!accessToken) return;
    try {
      await downloadDocument(fileKey, accessToken);
    } catch { /* ignore */ }
  };

  if (loadingDocs) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-ptba-steel-blue" />
        <span className="ml-2 text-sm text-ptba-gray">Memuat dokumen...</span>
      </div>
    );
  }

  if (partners.length === 0) {
    return (
      <div className="rounded-xl bg-white p-12 shadow-sm text-center">
        <FileText className="h-12 w-12 text-ptba-light-gray mx-auto mb-3" />
        <h3 className="text-sm font-semibold text-ptba-charcoal">Belum Ada Dokumen</h3>
        <p className="text-xs text-ptba-gray mt-1">Belum ada mitra yang mendaftar untuk proyek ini.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {partners.map((partner) => {
        const docs = partnerDocs[partner.id] || [];
        const docComplete = docs.filter((d: any) => d.file_key).length;
        return (
          <div key={partner.id} className="rounded-xl bg-white shadow-sm overflow-hidden">
            <button
              type="button"
              onClick={() => setCollapsed((prev) => ({ ...prev, [partner.id]: !prev[partner.id] }))}
              className="w-full flex items-center justify-between p-5 text-left hover:bg-ptba-section-bg/50 transition-colors"
            >
              <h3 className="font-semibold text-ptba-charcoal">
                {partner.name}
                <span className="ml-2 text-sm font-normal text-ptba-gray">
                  ({docComplete}/{docs.length} dokumen lengkap)
                </span>
                {partner.isShortlisted && (
                  <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700">
                    Shortlisted
                  </span>
                )}
              </h3>
              <ChevronDown className={cn("h-5 w-5 text-ptba-gray transition-transform", !collapsed[partner.id] && "rotate-180")} />
            </button>
            {!collapsed[partner.id] && <div className="px-5 pb-5">
            {docs.length === 0 ? (
              <p className="text-sm text-ptba-gray">Belum ada dokumen yang diunggah.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-ptba-light-gray text-left">
                      <th className="pb-2 pr-4 font-semibold text-ptba-gray">Dokumen</th>
                      <th className="pb-2 pr-4 font-semibold text-ptba-gray">Tipe</th>
                      <th className="pb-2 pr-4 font-semibold text-ptba-gray">Status</th>
                      <th className="pb-2 pr-4 font-semibold text-ptba-gray">Tanggal Upload</th>
                      <th className="pb-2 font-semibold text-ptba-gray"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {docs.map((doc: any) => {
                      const status = doc.file_key ? "Lengkap" : "Belum Upload";
                      return (
                        <tr key={doc.id} className="border-b border-ptba-light-gray/50 last:border-b-0">
                          <td className="py-2 pr-4 font-medium text-ptba-charcoal">{formatDocName(doc.name)}</td>
                          <td className="py-2 pr-4 text-ptba-gray text-xs">{formatDocTypeLabel(doc.document_type_id)}</td>
                          <td className="py-2 pr-4">
                            <span className={cn(
                              "inline-block rounded-full px-2 py-0.5 text-xs font-medium",
                              status === "Lengkap" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                            )}>
                              {status}
                            </span>
                          </td>
                          <td className="py-2 pr-4 text-ptba-gray text-xs">{doc.upload_date ? formatDate(doc.upload_date) : "—"}</td>
                          <td className="py-2">
                            {doc.file_key && (
                              <button
                                onClick={() => handleDownload(doc.file_key)}
                                className="inline-flex items-center gap-1 rounded-lg border border-ptba-light-gray px-2.5 py-1.5 text-xs font-medium text-ptba-gray hover:bg-ptba-section-bg transition-colors"
                              >
                                <Download className="h-3 w-3" />
                                Unduh
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            </div>}
          </div>
        );
      })}
    </div>
  );
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

type Tab = "mitra" | "dokumen" | "informasi" | "faq" | "riwayat";

export default function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { role, accessToken, user: authUser } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("mitra");
  const [faqs, setFaqs] = useState<any[]>([]);
  const [faqQuestion, setFaqQuestion] = useState("");
  const [faqAnswer, setFaqAnswer] = useState("");
  const [faqCategory, setFaqCategory] = useState("umum");
  const [faqSection, setFaqSection] = useState("general");
  const [faqEditId, setFaqEditId] = useState<string | null>(null);
  const [faqSaving, setFaqSaving] = useState(false);
  const faqFormRef = useRef<HTMLDivElement | null>(null);
  const [faqFilter, setFaqFilter] = useState<"all" | "general" | "mitra">("all");
  // Q&A Tickets state
  const [faqSubTab, setFaqSubTab] = useState<"general" | "mitra" | "tickets">("general");
  const [questions, setQuestions] = useState<any[]>([]);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);
  const [questionMessages, setQuestionMessages] = useState<any[]>([]);
  const [questionReply, setQuestionReply] = useState("");
  const [questionImageFile, setQuestionImageFile] = useState<File | null>(null);
  const [questionImagePreview, setQuestionImagePreview] = useState<string | null>(null);
  const [questionLightboxSrc, setQuestionLightboxSrc] = useState<string | null>(null);
  const [questionStatusFilter, setQuestionStatusFilter] = useState<"all" | "open" | "answered" | "closed">("all");
  const [questionsOpen, setQuestionsOpen] = useState(false);
  const [questionsCloseAt, setQuestionsCloseAt] = useState("");
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [questionMessagesLoading, setQuestionMessagesLoading] = useState(false);
  const [questionReplyLoading, setQuestionReplyLoading] = useState(false);
  const [questionConfigSaving, setQuestionConfigSaving] = useState(false);
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  // PIC edit state
  const [showPicEdit, setShowPicEdit] = useState(false);
  type PicEntry = { phase: string; role: string; subcategory?: string; userId: string; userName?: string };
  const [picDraft, setPicDraft] = useState<PicEntry[]>([]);
  const [picUsers, setPicUsers] = useState<{ id: string; name: string; role: string }[]>([]);
  const [picSaving, setPicSaving] = useState(false);
  const [picEditTab, setPicEditTab] = useState<"phase1" | "phase2">("phase1");

  const PHASE_PIC_CONFIG = {
    phase1: {
      label: "Fase 1",
      roles: [
        { role: "ebd", label: "EBD — Pasar", multi: true, subcategory: "pasar" },
        { role: "ebd", label: "EBD — Teknis", multi: true, subcategory: "teknis" },
        { role: "ebd", label: "EBD — Komersial", multi: true, subcategory: "komersial" },
        { role: "keuangan", label: "Corporate Finance", multi: false },
        { role: "hukum", label: "Legal & Regulatory Affairs", multi: false },
        { role: "risiko", label: "Risk Management", multi: false },
        { role: "ketua_tim", label: "Ketua Tim", multi: false },
      ],
    },
    phase2: {
      label: "Fase 2",
      roles: [
        { role: "ebd", label: "EBD — Pasar", multi: true, subcategory: "pasar" },
        { role: "ebd", label: "EBD — Teknis", multi: true, subcategory: "teknis" },
        { role: "ebd", label: "EBD — Komersial", multi: true, subcategory: "komersial" },
        { role: "keuangan", label: "Corporate Finance", multi: false },
        { role: "hukum", label: "Legal & Regulatory Affairs", multi: false },
        { role: "risiko", label: "Risk Management", multi: false },
        { role: "ketua_tim", label: "Ketua Tim", multi: false },
      ],
    },
  } as const;

  const picDraftFor = (phase: string, role: string, sub?: string) =>
    picDraft.filter((p) => p.phase === phase && p.role === role && (p.subcategory ?? undefined) === sub);

  const setPicDraftSingle = (phase: string, role: string, userId: string, sub?: string) => {
    const u = picUsers.find((p) => p.id === userId);
    setPicDraft((prev) => [
      ...prev.filter((p) => !(p.phase === phase && p.role === role && (p.subcategory ?? undefined) === sub)),
      ...(userId ? [{ phase, role, subcategory: sub, userId, userName: u?.name }] : []),
    ]);
  };

  const addPicDraft = (phase: string, role: string, userId: string, sub?: string) => {
    const u = picUsers.find((p) => p.id === userId);
    setPicDraft((prev) => [
      ...prev.filter((p) => !(p.phase === phase && p.role === role && (p.subcategory ?? undefined) === sub && p.userId === userId)),
      { phase, role, subcategory: sub, userId, userName: u?.name },
    ]);
  };

  const removePicDraft = (phase: string, role: string, userId: string, sub?: string) => {
    setPicDraft((prev) =>
      prev.filter((p) => !(p.phase === phase && p.role === role && (p.subcategory ?? undefined) === sub && p.userId === userId))
    );
  };

  // Workflow state — must be declared before any conditional returns
  const [showPersetujuanModal, setShowPersetujuanModal] = useState(false);
  const [selectedMitra, setSelectedMitra] = useState<string[]>([]);
  const [persetujuanNotes, setPersetujuanNotes] = useState("");
  const [showPhase2Modal, setShowPhase2Modal] = useState(false);
  const [phase2Deadline, setPhase2Deadline] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    // Default to 23:59 WIB
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}T23:59`;
  });
  const [phase2Fee, setPhase2Fee] = useState(50000000);
  const [phase2Divisions, setPhase2Divisions] = useState<string[]>(["keuangan", "hukum", "risiko", "ebd"]);

  // Payment verification state
  type PaymentDecision = "pending" | "approved" | "rejected";
  const [paymentDecisions, setPaymentDecisions] = useState<Record<string, PaymentDecision>>({});
  const [payRejectNotes, setPayRejectNotes] = useState<Record<string, string>>({});
  const [showPayRejectForm, setShowPayRejectForm] = useState<string | null>(null);
  const [viewingPayProof, setViewingPayProof] = useState<string | null>(null);
  const [showUnverifiedWarning, setShowUnverifiedWarning] = useState(false);
  const [showOpenRegModal, setShowOpenRegModal] = useState(false);
  const [showCloseRegModal, setShowCloseRegModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [applicationCount, setApplicationCount] = useState(0);
  const [projectApplications, setProjectApplications] = useState<any[]>([]);
  const [projectEvaluations, setProjectEvaluations] = useState<any[]>([]);
  const [projectApprovals, setProjectApprovals] = useState<any[]>([]);

  // Edit mode state
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editDraft, setEditDraft] = useState({
    name: "", type: "", description: "",
    startDate: "", endDate: "", phase1Deadline: "", phase2Deadline: "",
  });
  const [reqDraft, setReqDraft] = useState<string[]>([]);

  const startEditing = () => {
    setEditDraft({
      name: project?.name || "",
      type: project?.type || "",
      description: project?.description || "",
      startDate: project?.startDate ? new Date(project.startDate).toISOString().split("T")[0] : "",
      endDate: project?.endDate ? new Date(project.endDate).toISOString().split("T")[0] : "",
      phase1Deadline: project?.phase1Deadline ? formatToWibDatetime(project.phase1Deadline) : "",
      phase2Deadline: project?.phase2Deadline ? formatToWibDatetime(project.phase2Deadline) : "",
    });
    const currentReqs = (project?.requirements || []).map((r: any) =>
      typeof r === "string" ? r : r.requirement
    );
    setReqDraft(currentReqs.length > 0 ? currentReqs : [""]);
    setEditMode(true);
  };

  const saveAll = async () => {
    if (!accessToken) return;
    setSaving(true);
    try {
      // Save basic info + timeline
      const updateData: Record<string, any> = {};
      if (editDraft.name) updateData.name = editDraft.name;
      if (editDraft.type) updateData.type = editDraft.type;
      if (editDraft.description !== undefined) updateData.description = editDraft.description;
      if (editDraft.startDate) updateData.startDate = editDraft.startDate;
      if (editDraft.endDate) updateData.endDate = editDraft.endDate;
      if (editDraft.phase1Deadline) updateData.phase1Deadline = editDraft.phase1Deadline;
      if (editDraft.phase2Deadline) updateData.phase2Deadline = editDraft.phase2Deadline;

      await projectApi(accessToken).update(id, updateData);

      // Save requirements
      const filteredReqs = reqDraft.filter((r) => r.trim());
      const res = await projectApi(accessToken).updateRequirements(id, filteredReqs);
      setProject(res.data);
      setEditMode(false);
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (!accessToken) return;
    setLoading(true);
    projectApi(accessToken).getById(id).then((res) => {
      setProject(res.data);
      if (Array.isArray(res.data.faqs)) setFaqs(res.data.faqs);
      if (res.data.registrationFee) setPhase2Fee(Number(res.data.registrationFee));
      if (typeof res.data.questionsOpen === "boolean") setQuestionsOpen(res.data.questionsOpen);
      const closeAt = (res.data as any).questionsCloseAt as string | null | undefined;
      if (closeAt) {
        // Format to datetime-local "YYYY-MM-DDTHH:mm"
        const d = new Date(closeAt);
        const pad = (n: number) => String(n).padStart(2, "0");
        setQuestionsCloseAt(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`);
      }
    }).catch(() => {
      setProject(null);
    }).finally(() => setLoading(false));

    // Fetch applications for this project
    api<{ applications: any[] }>("/applications", { token: accessToken }).then((res) => {
      const apps = (res.applications || []).filter((a: any) => a.project_id === id && a.status !== "Draft");
      setProjectApplications(apps);
      setApplicationCount(apps.length);
    }).catch(() => {});

    // Fetch per-category evaluations for this project and aggregate per mitra.
    // The legacy /evaluations/phase1/:id endpoint reads phase1_evaluations
    // (old score-based flow) which is empty for projects using the new
    // 6-category flow — so we aggregate phase1_category_evaluations instead.
    api<{ evaluations: any[] }>(`/evaluations/phase1-cat/${id}`, { token: accessToken })
      .then((res) => {
        const raw = Array.isArray(res) ? res : (res.evaluations || []);
        const byPartner = new Map<string, any>();
        for (const ev of raw) {
          if (!byPartner.has(ev.partner_id)) {
            byPartner.set(ev.partner_id, {
              id: ev.partner_id,
              partner_id: ev.partner_id,
              partner_name: ev.partner_name,
              application_id: ev.application_id,
              categories: [],
              evaluator_names: new Set<string>(),
              last_evaluated_at: null,
              finalized_count: 0,
              sesuai_count: 0,
              tidak_sesuai_count: 0,
              perlu_diskusi_count: 0,
            });
          }
          const entry = byPartner.get(ev.partner_id)!;
          const v = (ev.verdict || "").toLowerCase();
          entry.categories.push({ category: ev.category, verdict: ev.verdict, finalized: ev.is_finalized });
          if (ev.evaluator_name) entry.evaluator_names.add(ev.evaluator_name);
          if (ev.is_finalized) entry.finalized_count++;
          if (v === "sesuai") entry.sesuai_count++;
          else if (v === "tidak_sesuai") entry.tidak_sesuai_count++;
          else if (v === "perlu_diskusi") entry.perlu_diskusi_count++;
          if (ev.evaluated_at && (!entry.last_evaluated_at || ev.evaluated_at > entry.last_evaluated_at)) {
            entry.last_evaluated_at = ev.evaluated_at;
          }
        }
        const aggregated = Array.from(byPartner.values()).map((e) => ({
          ...e,
          evaluator_name: Array.from(e.evaluator_names).join(", "),
          evaluated_at: e.last_evaluated_at,
          is_finalized: e.finalized_count === 6,
        }));
        setProjectEvaluations(aggregated);
      })
      .catch(() => {});

    // Fetch approvals for this project
    api<{ approvals: any[] }>(`/approvals`, { token: accessToken })
      .then((res) => setProjectApprovals((res.approvals || []).filter((a: any) => a.project_id === id)))
      .catch(() => {});
  }, [id, accessToken]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-ptba-steel-blue" />
        <span className="ml-3 text-ptba-gray">Memuat proyek...</span>
      </div>
    );
  }

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

  // Derive partner list from applications + evaluations
  const shortlistedIds = new Set(
    projectApplications
      .filter((a: any) => a.status === "Shortlisted" || a.phase1_result === "Lolos")
      .map((a: any) => a.partner_id)
  );
  const projectPartners: any[] = projectApplications.map((a: any) => {
    const evaluation = projectEvaluations.find((e: any) => e.application_id === a.id);
    const allDocs = [
      ...(a.phase1Documents || []),
      ...(a.phase2Documents || []),
      ...(a.generalDocuments || []),
    ];
    return {
      id: a.partner_id,
      applicationId: a.id,
      name: a.partner_name,
      logoUrl: a.partner_logo_url,
      code: a.partner_id.substring(0, 8),
      status: a.status,
      appliedAt: a.applied_at,
      phase1Result: a.phase1_result,
      phase1Score: undefined,
      hasEvaluation: !!evaluation && evaluation.finalized_count === 6,
      phase: a.phase,
      isShortlisted: shortlistedIds.has(a.partner_id),
      documents: allDocs,
      docComplete: allDocs.filter((d: any) => d.file_key).length,
      docTotal: allDocs.length,
    };
  });
  // PIC check: is user assigned as PIC for the current phase of this project
  const projectPhasePics = project.phasePics || [];
  const isPhase1Pic = projectPhasePics.some((p: any) => p.phase === "phase1" && p.userId === authUser?.id);
  const isAnyPhasePic = projectPhasePics.some((p: any) => p.userId === authUser?.id);
  const isEbdPic = projectPhasePics.some((p: any) => p.userId === authUser?.id && p.role === "ebd");
  const isKetuaTimPic = projectPhasePics.some((p: any) => p.userId === authUser?.id && p.role === "ketua_tim");
  const isCreator = !!authUser && !!project?.createdBy && authUser.id === project.createdBy;
  // Can manage project (action buttons): super_admin, project creator, EBD PICs, or Ketua Tim
  // NOT keuangan/hukum/risiko — they can only view and evaluate their category
  const isAdmin = role === "super_admin" || isCreator || isEbdPic || isKetuaTimPic;
  const canEditPic = role === "super_admin" || isCreator;
  const isPhase1Approved = project.phase === "phase1_approved" || project.phase === "phase1_announcement";

  const allEvalsComplete = projectPartners.length > 0 && projectPartners.every(
    (p) => p.hasTechnicalEval && p.hasFinancialEval && p.hasLegalEval && p.hasRiskEval
  );

  const partnerScores = projectPartners.map((p: any) => ({
    ...p,
    totalScore: 0,
    grade: "-",
    technicalScore: 0,
    financialScore: 0,
    financialGrade: "-",
    legalStatus: "-",
    riskLevel: "-",
  }));

  const handleCloseRegistration = () => {
    setShowCloseRegModal(true);
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
    alert(`Persetujuan berhasil diajukan ke Ketua Tim.\nMitra direkomendasikan: ${names}`);
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

  // Can evaluate: super_admin, or user assigned as PIC for the relevant phase
  const isPhase2Pic = projectPhasePics.some((p: any) => p.phase === "phase2" && p.userId === authUser?.id);
  const canEvaluate = role === "super_admin" || isPhase1Pic || isPhase2Pic;

  function EvalActionButton({ partnerId, evalDone }: { partnerId: string; evalDone: boolean }) {
    if (!canEvaluate) return null;
    const registrationClosed = project.phase !== "phase1_registration";
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
    if (!registrationClosed) {
      return (
        <Link
          href={getEvalLink(partnerId)}
          className="inline-flex items-center gap-1 rounded px-2.5 py-1 text-xs font-medium bg-ptba-light-gray/80 text-ptba-gray hover:bg-ptba-light-gray transition-colors"
        >
          <Eye className="h-3 w-3" />
          Lihat Detail
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

      {/* Fase 1 Approved Banner */}
      {isPhase1Approved && isAdmin && (
        <div className="rounded-xl border border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 p-5 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 flex-shrink-0">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-green-800">Fase 1 Disetujui oleh Ketua Tim</h3>
                <p className="text-xs text-green-700 mt-0.5">
                  {shortlistedIds.size} mitra lolos shortlist dan siap melanjutkan ke Fase 2.
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

      {/* Fase 2 Configuration Modal */}
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
                {projectPartners.filter((p: any) => p.isShortlisted).map((p: any) => (
                  <span key={p.id} className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-medium text-ptba-charcoal border border-ptba-light-gray">
                    <CheckCircle2 className="h-3 w-3 text-green-600" />
                    {p.name}
                  </span>
                ))}
              </div>
            </div>

            {/* Deadline */}
            <div className="mb-4">
              <label className="flex items-center gap-1.5 text-sm font-semibold text-ptba-charcoal mb-1.5">
                <Calendar className="h-4 w-4 text-ptba-gray" />
                Batas Waktu Fase 2 <span className="text-ptba-gray font-normal">(WIB)</span>
              </label>
              <input
                type="datetime-local"
                value={phase2Deadline}
                onChange={(e) => setPhase2Deadline(e.target.value)}
                className="w-full rounded-lg border border-ptba-light-gray px-3 py-2 text-sm text-ptba-charcoal focus:border-ptba-navy focus:outline-none focus:ring-1 focus:ring-ptba-navy"
              />
            </div>

            {/* Registration fee */}
            <div className="mb-4">
              <label className="flex items-center gap-1.5 text-sm font-semibold text-ptba-charcoal mb-1.5">
                <DollarSign className="h-4 w-4 text-ptba-gray" />
                Commitment Fee Fase 2
              </label>
              <p className="text-[10px] text-ptba-gray mb-1.5 italic">Mitra wajib membayar commitment fee untuk melanjutkan proses seleksi ke Fase 2. Biaya ini bersifat non-refundable.</p>
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

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowPhase2Modal(false)}
                className="flex-1 rounded-lg border border-ptba-light-gray px-4 py-2.5 text-sm font-medium text-ptba-gray hover:bg-ptba-section-bg transition-colors"
              >
                Batal
              </button>
              <button
                onClick={async () => {
                  if (!accessToken) return;
                  setActionLoading(true);
                  try {
                    await api(`/projects/${id}/start-phase2`, {
                      method: "POST",
                      body: {
                        phase2Deadline,
                        registrationFee: phase2Fee,
                      },
                      token: accessToken,
                    });
                    setShowPhase2Modal(false);
                    window.location.reload();
                  } catch {
                    alert("Gagal memulai Fase 2");
                  } finally {
                    setActionLoading(false);
                  }
                }}
                disabled={actionLoading || !phase2Deadline}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-ptba-navy px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-ptba-steel-blue disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}
                {actionLoading ? "Memproses..." : "Mulai Fase 2"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unverified Payment Warning Modal */}
      {showUnverifiedWarning && (() => {
        const shortlistedIds = project.shortlistedPartners ?? [];
        const unverifiedMitra = shortlistedIds.filter((pid: string) => {
          const app = undefined as any;
          if (!app) return true;
          const decision = paymentDecisions[app.id];
          if (decision === "approved") return false;
          if (!decision && app.feePaymentStatus === "Sudah Bayar") return false;
          return true;
        }).map((pid: string) => (undefined as any)?.name ?? pid);

        const verifiedMitra = shortlistedIds.filter((pid: string) => {
          const app = undefined as any;
          if (!app) return false;
          const decision = paymentDecisions[app.id];
          if (decision === "approved") return true;
          if (!decision && app.feePaymentStatus === "Sudah Bayar") return true;
          return false;
        }).map((pid: string) => (undefined as any)?.name ?? pid);

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
                {unverifiedMitra.map((name: string) => (
                  <div key={name} className="flex items-center gap-1.5 text-xs text-red-700">
                    <XCircle className="h-3 w-3 shrink-0" /> {name}
                  </div>
                ))}
              </div>

              {/* Verified list */}
              {verifiedMitra.length > 0 && (
                <div className="rounded-lg border border-green-200 bg-green-50 p-3 mb-4">
                  <p className="text-xs font-semibold text-green-800 mb-1.5">Melanjutkan ke Fase 2:</p>
                  {verifiedMitra.map((name: string) => (
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
      <div className="rounded-xl bg-white shadow-sm overflow-hidden">
        <div className={cn("flex flex-col", project.coverImageUrl ? "lg:flex-row" : "")}>
          {/* Cover Image — left side */}
          {project.coverImageUrl && (
            <div className="lg:w-[400px] shrink-0 cursor-pointer" onClick={() => setLightboxSrc(project.coverImageUrl)}>
              <img src={project.coverImageUrl} alt={project.name} className="w-full h-48 lg:h-full object-cover hover:opacity-90 transition-opacity" />
            </div>
          )}

          {/* Details — right side */}
          <div className="flex-1 p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold", typeBadgeClass(project.type))}>
                    {typeLabel(project.type)}
                  </span>
                  <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold", statusBadgeClass(project.status))}>
                    {project.status}
                  </span>
                  {project.phase && project.phase !== "published" && (
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
                <p className="text-xs text-ptba-gray mt-1">{projectPartners.length} Mitra Berpartisipasi</p>
              </div>
            </div>

        {/* Action Buttons */}
        {isAdmin && project.status === "Draft" && (
          <div className="mt-4 flex items-center gap-3 rounded-lg border border-ptba-gold/30 bg-ptba-gold/5 p-4">
            <div className="flex-1">
              <p className="text-sm font-semibold text-ptba-charcoal">Proyek masih dalam Draft</p>
              <p className="text-xs text-ptba-gray mt-0.5">Publikasikan agar mitra dapat melihat proyek ini.</p>
            </div>
            <button
              disabled={actionLoading}
              onClick={async () => {
                if (!accessToken) return;
                setActionLoading(true);
                try {
                  const res = await projectApi(accessToken).publish(id);
                  setProject(res.data);
                } catch (err: any) {
                  alert(err.message || "Gagal mempublikasikan proyek");
                } finally {
                  setActionLoading(false);
                }
              }}
              className="inline-flex items-center gap-2 rounded-lg bg-ptba-gold px-4 py-2.5 text-sm font-bold text-ptba-charcoal shadow-sm hover:bg-ptba-gold-light transition-colors disabled:opacity-50"
            >
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Publikasikan
            </button>
          </div>
        )}

        {isAdmin && project.status === "Dipublikasikan" && !project.isOpenForApplication && (
          <div className="mt-4 flex items-center gap-3 rounded-lg border border-ptba-steel-blue/30 bg-ptba-steel-blue/5 p-4">
            <div className="flex-1">
              <p className="text-sm font-semibold text-ptba-charcoal">Proyek sudah dipublikasikan</p>
              <p className="text-xs text-ptba-gray mt-0.5">Mitra dapat melihat proyek ini. Buka pendaftaran agar mitra bisa mendaftar.</p>
            </div>
            <button
              onClick={() => setShowOpenRegModal(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-ptba-navy px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-ptba-steel-blue transition-colors"
            >
              <Rocket className="h-4 w-4" />
              Buka Pendaftaran
            </button>
          </div>
        )}

        {/* Confirmation Modal: Buka Pendaftaran */}
        {showOpenRegModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowOpenRegModal(false)}>
            <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl mx-4" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-ptba-charcoal">Buka Pendaftaran Mitra</h2>
                <button onClick={() => setShowOpenRegModal(false)} className="rounded-lg p-1.5 hover:bg-ptba-section-bg transition-colors">
                  <X className="h-5 w-5 text-ptba-gray" />
                </button>
              </div>
              <div className="rounded-lg bg-ptba-section-bg p-4 mb-4">
                <p className="text-sm text-ptba-charcoal leading-relaxed">
                  Dengan membuka pendaftaran, mitra yang telah terdaftar di sistem akan dapat melihat dan <strong>mendaftar</strong> ke proyek <strong>{project.name}</strong>.
                </p>
              </div>
              <div className="space-y-2 mb-5 text-xs text-ptba-gray">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0 mt-0.5" />
                  <span>Status proyek akan berubah menjadi <strong className="text-ptba-charcoal">Evaluasi</strong></span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0 mt-0.5" />
                  <span>Mitra dapat mengunggah dokumen EoI (Expression of Interest)</span>
                </div>
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                  <span>Pastikan persyaratan dan dokumen proyek sudah lengkap</span>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowOpenRegModal(false)}
                  className="flex-1 rounded-lg border border-ptba-light-gray px-4 py-2.5 text-sm font-medium text-ptba-gray hover:bg-ptba-section-bg transition-colors"
                >
                  Batal
                </button>
                <button
                  disabled={actionLoading}
                  onClick={async () => {
                    if (!accessToken) return;
                    setActionLoading(true);
                    try {
                      const res = await projectApi(accessToken).openRegistration(id);
                      setProject(res.data);
                      setShowOpenRegModal(false);
                    } catch (err: any) {
                      alert(err.message || "Gagal membuka pendaftaran");
                    } finally {
                      setActionLoading(false);
                    }
                  }}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-ptba-navy px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-ptba-steel-blue transition-colors disabled:opacity-50"
                >
                  {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}
                  Ya, Buka Pendaftaran
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Modal: Tutup Pendaftaran */}
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
                  disabled={actionLoading}
                  onClick={async () => {
                    if (!accessToken) return;
                    setActionLoading(true);
                    try {
                      const res = await projectApi(accessToken).closeRegistration(id);
                      setProject(res.data);
                      setShowCloseRegModal(false);
                    } catch (err: any) {
                      alert(err.message || "Gagal menutup pendaftaran");
                    } finally {
                      setActionLoading(false);
                    }
                  }}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-ptba-red px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LockKeyhole className="h-4 w-4" />}
                  Ya, Tutup Pendaftaran
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {isAdmin && project.status !== "Selesai" && project.status !== "Dibatalkan" && (
          <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-ptba-light-gray pt-4">
            {/* Fase 1 actions */}
            {isPhase1 && project.phase === "phase1_registration" && project.isOpenForApplication && (
              <button
                onClick={handleCloseRegistration}
                className="inline-flex items-center gap-2 rounded-lg border border-ptba-red/30 bg-ptba-red/5 px-4 py-2 text-sm font-medium text-ptba-red hover:bg-ptba-red/10 transition-colors"
              >
                <LockKeyhole className="h-4 w-4" />
                Tutup Pendaftaran Fase 1
              </button>
            )}
            {isPhase1 && (project.phase === "phase1_closed" || project.phase === "phase1_evaluation") && (
              <Link
                href={`/projects/${id}/evaluation/phase1`}
                className="inline-flex items-center gap-2 rounded-lg bg-ptba-navy px-4 py-2 text-sm font-medium text-white hover:bg-ptba-navy/90 transition-colors"
              >
                <ShieldCheck className="h-4 w-4" />
                Mulai Evaluasi Fase 1
              </Link>
            )}
            {isPhase1 && project.phase === "phase1_registration" && (
              <Link
                href={`/projects/${id}/evaluation/phase1`}
                className="inline-flex items-center gap-2 rounded-lg border border-ptba-navy/30 px-4 py-2 text-sm font-medium text-ptba-navy hover:bg-ptba-navy/5 transition-colors"
              >
                <Eye className="h-4 w-4" />
                Lihat Evaluasi
              </Link>
            )}
            {isPhase1 && project.phase === "phase1_approval" && (
              <Link
                href={`/projects/${id}/approval/phase1`}
                className="inline-flex items-center gap-2 rounded-lg bg-ptba-gold px-4 py-2 text-sm font-bold text-ptba-charcoal hover:bg-ptba-gold-light transition-colors"
              >
                <Send className="h-4 w-4" />
                Menunggu Persetujuan
              </Link>
            )}
            {project.phase === "phase1_announcement" && (
              <>
                <div className="inline-flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 px-4 py-2 text-sm font-medium text-green-700">
                  <CheckCircle2 className="h-4 w-4" />
                  Fase 1 Selesai
                </div>
                <button
                  onClick={() => setShowPhase2Modal(true)}
                  className="inline-flex items-center gap-2 rounded-lg bg-ptba-steel-blue px-4 py-2 text-sm font-bold text-white hover:bg-ptba-steel-blue/90 transition-colors"
                >
                  <ArrowRight className="h-4 w-4" />
                  Lanjutkan ke Fase 2
                </button>
              </>
            )}

            {/* Fase 2 actions */}
            {isPhase2 && project.phase === "phase2_registration" && (
              <button
                onClick={async () => {
                  if (!accessToken) return;
                  if (!confirm("Apakah Anda yakin ingin menutup pendaftaran Fase 2? Mitra tidak akan bisa mengunggah dokumen lagi.")) return;
                  setActionLoading(true);
                  try {
                    await api(`/projects/${id}/close-phase2-registration`, { method: "POST", token: accessToken });
                    window.location.reload();
                  } catch {
                    alert("Gagal menutup pendaftaran Fase 2");
                  } finally {
                    setActionLoading(false);
                  }
                }}
                disabled={actionLoading}
                className="inline-flex items-center gap-2 rounded-lg border border-ptba-red/30 bg-ptba-red/5 px-4 py-2 text-sm font-medium text-ptba-red hover:bg-ptba-red/10 transition-colors disabled:opacity-50"
              >
                <LockKeyhole className="h-4 w-4" />
                {actionLoading ? "Memproses..." : "Tutup Pendaftaran Fase 2"}
              </button>
            )}
            {isPhase2 && project.phase !== "phase2_registration" && (
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
                {allEvalsComplete && project.status === "Berjalan" && (
                  <button
                    onClick={() => setShowPersetujuanModal(true)}
                    className="inline-flex items-center gap-2 rounded-lg bg-ptba-gold px-4 py-2 text-sm font-bold text-ptba-charcoal shadow-sm hover:bg-ptba-gold-light transition-colors"
                  >
                    <Send className="h-4 w-4" />
                    Ajukan Persetujuan Ketua Tim
                  </button>
                )}
              </>
            )}
          </div>
        )}

        {/* Progress */}
        <div className="mt-6">
          {/* Current step card with integrated progress */}
          <div className="rounded-xl border border-ptba-light-gray bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-ptba-navy text-sm font-bold text-white shrink-0">
                {project.currentStep}
              </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-ptba-charcoal">{PROJECT_STEPS[project.currentStep - 1]?.name ?? "Inisiasi"}</p>
              <p className="text-xs text-ptba-gray truncate">{PROJECT_STEPS[project.currentStep - 1]?.description ?? ""}</p>
            </div>
            <span className="text-xs font-semibold text-ptba-navy shrink-0">
              {Math.round((project.currentStep / (project.totalSteps || 11)) * 100)}%
            </span>
            </div>

            {/* Progress bar */}
            <div className="relative h-2 rounded-full bg-ptba-light-gray overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-ptba-navy to-ptba-steel-blue transition-all duration-500"
                style={{ width: `${Math.round((project.currentStep / (project.totalSteps || 11)) * 100)}%` }}
              />
            </div>

            {/* Phase labels under bar */}
            <div className="flex justify-between mt-1.5 text-[10px] text-ptba-gray">
              <span>Pendaftaran</span>
              <span>Evaluasi Tahap 1</span>
              <span>Evaluasi Tahap 2</span>
              <span>Selesai</span>
            </div>
          </div>
          </div>
        </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-ptba-light-gray">
        <div className="flex items-center justify-between">
          <nav className="flex gap-6">
            {(
              [
                { key: "mitra", label: "Mitra yang Berminat", icon: Building2 },
                { key: "dokumen", label: "Dokumen", icon: FileText },
                { key: "informasi", label: "Informasi", icon: Info },
                // FAQ / Q&A management is restricted to EBD + super_admin.
                // Other divisions (keuangan, hukum, risiko, ketua_tim,
                // viewer) don't manage mitra-facing content.
                ...((role === "ebd" || role === "super_admin")
                  ? [{ key: "faq", label: "FAQ", icon: HelpCircle } as const]
                  : []),
                { key: "riwayat", label: "Riwayat", icon: Clock },
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
          {isAdmin && !editMode && (
            <div className="flex items-center gap-2 pb-2">
              {applicationCount > 0 && (
                <span className="text-xs text-amber-600">
                  {project.phase?.startsWith("phase2") ? "Hanya PIC yang dapat diedit" : "Beberapa bagian terkunci"}
                </span>
              )}
              <button onClick={() => router.push(`/projects/${id}/edit`)} className="inline-flex items-center gap-1.5 rounded-lg border border-ptba-navy px-4 py-2 text-xs font-medium text-ptba-navy hover:bg-ptba-navy/5 transition-colors">
                <Pencil className="h-3.5 w-3.5" />
                Edit Proyek
              </button>
              {canEditPic && applicationCount > 0 && (
                <button
                  onClick={async () => {
                    if (!accessToken) return;
                    try {
                      const res = await authApi().listUsers(accessToken);
                      setPicUsers(res.users.filter((u: any) => u.status === "active").map((u: any) => ({ id: u.id, name: u.name, role: u.role })));
                    } catch { /* ignore */ }
                    const entries = (project.phasePics || []).map((p: any) => ({
                      phase: p.phase,
                      role: p.role,
                      subcategory: p.subcategory || undefined,
                      userId: p.userId,
                      userName: p.userName || undefined,
                    }));
                    setPicDraft(entries);
                    setPicEditTab("phase1");
                    setShowPicEdit(true);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-ptba-steel-blue px-4 py-2 text-xs font-medium text-ptba-steel-blue hover:bg-ptba-steel-blue/5 transition-colors"
                >
                  <Users className="h-3.5 w-3.5" />
                  Edit PIC
                </button>
              )}
            </div>
          )}
        </div>
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

          {/* Fase 1 Active: Card-based EBD evaluation */}
          {isPhase1 && !isPhase1Approved && (
            <div className="space-y-3">
              {projectPartners.map((partner) => {
                const app = projectApplications.find((a: any) => a.partner_id === partner.id);
                const hasResult = !!partner.phase1Result || partner.hasEvaluation;
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
                        {partner.logoUrl ? (
                          <img src={partner.logoUrl} alt="" className="h-11 w-11 shrink-0 rounded-full object-cover border border-ptba-light-gray" />
                        ) : (
                          <div className={cn(
                            "flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white",
                            isLolos ? "bg-green-500" :
                            isTidakLolos ? "bg-red-500" :
                            "bg-ptba-navy"
                          )}>
                            {partner.name.charAt(0)}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-semibold text-ptba-charcoal truncate">{partner.name}</p>
                          <p className="text-xs text-ptba-gray">{partner.code}</p>
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center gap-1 rounded-full bg-ptba-section-bg px-2 py-0.5 text-[11px] text-ptba-gray">
                              <FileText className="h-3 w-3" /> {partner.status}
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

          {/* Fase 1 Approved / Phase 2 Registration: Payment Verification View */}
          {(isPhase1Approved || project.phase === "phase2_registration") && (() => {
            const shortlistedApps = projectApplications
              .filter((a: any) => a.status === "Shortlisted" || a.phase1_result === "Lolos")
              .map((a: any) => ({
                partner: { name: a.partner_name, code: a.partner_id?.substring(0, 8) },
                app: a,
                pid: a.partner_id,
              }));

            const getDecision = (appId?: string, status?: string): PaymentDecision => {
              if (appId && paymentDecisions[appId]) return paymentDecisions[appId];
              if (status === "Sudah Bayar") return "approved";
              if (status === "Ditolak") return "rejected";
              return "pending";
            };

            const pendingCount = shortlistedApps.filter(
              ({ app }: any) => app?.fee_payment_status === "Menunggu Verifikasi" && getDecision(app?.id, app?.fee_payment_status) === "pending"
            ).length;
            const verifiedCount = shortlistedApps.filter(
              ({ app }: any) => getDecision(app?.id, app?.fee_payment_status) === "approved"
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

                {shortlistedApps.map(({ partner, app, pid }: any) => {
                  const decision = getDecision(app?.id, app?.fee_payment_status);
                  const hasPendingPayment = app?.fee_payment_status === "Menunggu Verifikasi" && decision === "pending";

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
                                <p className="text-sm font-medium text-ptba-charcoal">{app?.fee_payment_proof}</p>
                                <p className="text-[10px] text-ptba-gray">Diunggah: {app?.feePaymentDate ? formatDate(app.fee_payment_date) : '-'}</p>
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

                          {viewingPayProof === pid && app?.fee_payment_proof && (
                            <div className="mb-3">
                              <button
                                onClick={async () => {
                                  try {
                                    await downloadDocument(app.fee_payment_proof, accessToken!);
                                  } catch { /* ignore */ }
                                }}
                                className="w-full rounded-lg border border-ptba-light-gray bg-ptba-section-bg p-4 text-center hover:bg-ptba-steel-blue/5 transition-colors"
                              >
                                <FileText className="mx-auto h-8 w-8 text-ptba-steel-blue mb-2" />
                                <p className="text-sm font-medium text-ptba-navy">Klik untuk membuka bukti pembayaran</p>
                                <p className="text-xs text-ptba-gray mt-0.5">{formatCurrency(project.registrationFee ?? 0)}</p>
                              </button>
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
                                  onClick={async () => {
                                    if (!app?.id || !accessToken) return;
                                    try {
                                      await api(`/applications/${app.id}/verify-fee`, { method: "PUT", token: accessToken, body: { decision: "reject", notes: payRejectNotes[pid] } });
                                      setPaymentDecisions((prev) => ({ ...prev, [app.id]: "rejected" }));
                                      setShowPayRejectForm(null);
                                    } catch { /* ignore */ }
                                  }}
                                  className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 transition-colors"
                                >Konfirmasi Tolak</button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex gap-3">
                              <button
                                onClick={async () => {
                                  if (!app?.id || !accessToken) return;
                                  try {
                                    await api(`/applications/${app.id}/verify-fee`, { method: "PUT", token: accessToken, body: { decision: "approve" } });
                                    setPaymentDecisions((prev) => ({ ...prev, [app.id]: "approved" }));
                                  } catch { /* ignore */ }
                                }}
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

                      {(!app?.fee_payment_status || app.feePaymentStatus === "Belum Bayar") && decision === "pending" && (
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

          {/* Fase 2 View: Full evaluation matrix — only after Phase 2
              registration closes (phase2_evaluation onward). During
              phase2_registration the list stays read-only (payment
              verification card above). */}
          {isPhase2 && project.phase !== "phase2_registration" && (
            <div className="overflow-x-auto">
              <div className="mb-4 flex items-center gap-2 rounded-lg bg-ptba-steel-blue/5 border border-ptba-steel-blue/20 px-4 py-2.5">
                <BarChart3 className="h-4 w-4 text-ptba-steel-blue" />
                <span className="text-sm font-medium text-ptba-steel-blue">Fase 2: Evaluasi Multi-Divisi</span>
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
            <div className="py-12 text-center">
              <Building2 className="mx-auto h-10 w-10 text-ptba-light-gray mb-3" />
              <p className="text-sm text-ptba-gray">
                {!project.phase || project.phase === "published"
                  ? "Pendaftaran mitra belum dibuka. Buka pendaftaran terlebih dahulu agar mitra dapat mendaftar."
                  : "Belum ada mitra yang berpartisipasi dalam proyek ini."}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Tab B: Dokumen */}
      {activeTab === "dokumen" && <DokumenTab partners={projectPartners} accessToken={accessToken} />}

      {/* Tab C: Informasi */}
      {activeTab === "informasi" && (() => {
        const inputCls = "w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-ptba-steel-blue focus:ring-2 focus:ring-ptba-steel-blue/20";
        const reqs = (project.requirements || []).map((r: any) => typeof r === "string" ? r : r.requirement);

        return (
        <div className="space-y-6">
          {/* Save / Cancel bar (only visible in edit mode) */}
          {isAdmin && editMode && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-ptba-gray">Mode edit aktif — ubah informasi proyek di bawah</p>
              <div className="flex gap-2">
                <button onClick={() => setEditMode(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                  Batal
                </button>
                <button disabled={saving} onClick={saveAll} className="inline-flex items-center gap-1.5 rounded-lg bg-ptba-navy px-5 py-2 text-xs font-medium text-white hover:bg-ptba-navy/90 transition-colors disabled:opacity-50">
                  {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                  Simpan Semua
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Deskripsi Proyek */}
            <div className="rounded-xl bg-white p-6 shadow-sm md:col-span-2">
              <h3 className="mb-3 font-semibold text-ptba-charcoal">Deskripsi Proyek</h3>
              {editMode ? (
                <textarea value={editDraft.description} onChange={(e) => setEditDraft((d) => ({ ...d, description: e.target.value }))} className={cn(inputCls, "min-h-[80px] resize-y")} />
              ) : project.description ? (
                <div
                  className="text-sm leading-relaxed text-ptba-gray prose prose-sm max-w-none overflow-hidden [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-lg [&_img]:cursor-pointer [&_img]:hover:opacity-90 [&_img]:transition-opacity [&_table]:w-full [&_table]:table-fixed"
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(project.description.replace(/&nbsp;/g, " ").replace(/\u00A0/g, " ")) }}
                  onClick={(e) => {
                    const target = e.target as HTMLElement;
                    if (target.tagName === "IMG") {
                      setLightboxSrc((target as HTMLImageElement).src);
                    }
                  }}
                />
              ) : (
                <p className="text-sm leading-relaxed text-ptba-gray">-</p>
              )}
            </div>

            {/* Gambar Deskripsi */}
            {!editMode && project.projectImages && project.projectImages.length > 0 && (
              <div className="rounded-xl bg-white p-6 shadow-sm md:col-span-2">
                <h3 className="mb-3 font-semibold text-ptba-charcoal">Gambar Deskripsi</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {project.projectImages.map((img: any) => (
                    <img
                      key={img.id}
                      src={img.url}
                      alt={img.caption || ""}
                      className="w-full rounded-lg object-cover cursor-pointer hover:opacity-90 transition-opacity border border-ptba-light-gray"
                      onClick={() => setLightboxSrc(img.url)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Informasi Umum */}
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <h3 className="mb-4 font-semibold text-ptba-charcoal">Informasi Umum</h3>
              {editMode ? (
                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-ptba-charcoal">Nama Proyek</label>
                    <input type="text" value={editDraft.name} onChange={(e) => setEditDraft((d) => ({ ...d, name: e.target.value }))} className={inputCls} />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-ptba-charcoal">Tipe Proyek</label>
                    <select value={editDraft.type} onChange={(e) => setEditDraft((d) => ({ ...d, type: e.target.value }))} className={inputCls}>
                      <option value="mining">Operasi Pertambangan</option>
                      <option value="power_generation">Pembangkit Listrik</option>
                      <option value="coal_processing">Pengolahan Batubara</option>
                      <option value="infrastructure">Infrastruktur</option>
                      <option value="environmental">Lingkungan & Reklamasi</option>
                      <option value="corporate">Layanan Korporat</option>
                      <option value="others">Lainnya</option>
                    </select>
                  </div>
                </div>
              ) : (
                <dl className="space-y-3 text-sm">
                  <div className="flex justify-between"><dt className="text-ptba-gray">ID Proyek</dt><dd className="font-medium text-ptba-charcoal text-xs">{project.id}</dd></div>
                  <div className="flex justify-between"><dt className="text-ptba-gray">Sektor</dt><dd><span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", typeBadgeClass(project.type))}>{typeLabel(project.type)}</span></dd></div>
                  <div className="flex justify-between"><dt className="text-ptba-gray">Status</dt><dd><span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", statusBadgeClass(project.status))}>{project.status}</span></dd></div>
                  <div className="flex justify-between"><dt className="text-ptba-gray">Phase</dt><dd className="font-medium text-ptba-steel-blue text-xs">{phaseLabel(project.phase)}</dd></div>
                  <div className="flex justify-between"><dt className="text-ptba-gray">Jumlah Mitra</dt><dd className="font-medium text-ptba-charcoal">{projectPartners.length} mitra</dd></div>
                </dl>
              )}
            </div>

            {/* Project Viability */}
            {(project.location || project.capacityMw || project.indicativeCapex) && (
              <div className="rounded-xl bg-white p-6 shadow-sm">
                <h3 className="mb-4 font-semibold text-ptba-charcoal">Project Viability</h3>
                <dl className="space-y-3 text-sm">
                  {project.location && <div className="flex justify-between"><dt className="text-ptba-gray">Lokasi</dt><dd className="font-medium text-ptba-charcoal">{project.location}</dd></div>}
                  {project.capacityMw && <div className="flex justify-between"><dt className="text-ptba-gray">Kapasitas</dt><dd className="font-medium text-ptba-charcoal">{project.capacityMw} MW</dd></div>}
                  {project.indicativeCapex && <div className="flex justify-between"><dt className="text-ptba-gray">Indicative Capex</dt><dd className="font-medium text-ptba-charcoal">$ {project.indicativeCapex} Mn</dd></div>}
                </dl>
              </div>
            )}

            {/* Indicative Financial Projection */}
            {(project.npv || project.der || project.lifetime || project.projectIrr || project.wacc) && (
              <div className="rounded-xl bg-white p-6 shadow-sm md:col-span-2">
                <h3 className="mb-4 font-semibold text-ptba-charcoal">Indicative Financial Projection</h3>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Net Present Value (NPV)", value: project.npv },
                    { label: "Debt to Equity Ratio (DER)", value: project.der },
                    { label: "Lifetime", value: project.lifetime },
                    { label: "Project IRR", value: project.projectIrr },
                    { label: "Equity IRR", value: project.equityIrr },
                    { label: "Payback Period", value: project.paybackPeriod },
                    { label: "WACC", value: project.wacc },
                    { label: "Tariff (Levelized)", value: project.tariffLevelized },
                    { label: `BPP${project.bppLocation ? ` ${project.bppLocation}` : ""}`, value: project.bppValue },
                  ].map((item) => (
                    <div key={item.label} className="rounded-lg border border-ptba-light-gray p-3 text-center">
                      <p className="text-[10px] font-semibold text-ptba-navy mb-1">{item.label}</p>
                      <p className="text-sm font-bold text-ptba-charcoal">{item.value || "-"}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Timeline */}
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <h3 className="mb-4 font-semibold text-ptba-charcoal">Timeline</h3>
              {editMode ? (
                <div className="space-y-3">
                  <div><label className="mb-1 block text-xs font-medium text-ptba-charcoal">Tanggal Mulai</label><input type="date" value={editDraft.startDate} onChange={(e) => setEditDraft((d) => ({ ...d, startDate: e.target.value }))} className={inputCls} /></div>
                  <div><label className="mb-1 block text-xs font-medium text-ptba-charcoal">Tanggal Selesai</label><input type="date" value={editDraft.endDate} onChange={(e) => setEditDraft((d) => ({ ...d, endDate: e.target.value }))} className={inputCls} /></div>
                  <div><label className="mb-1 block text-xs font-medium text-ptba-charcoal">Deadline Fase 1 <span className="text-ptba-gray font-normal">(WIB)</span></label><input type="datetime-local" value={editDraft.phase1Deadline} onChange={(e) => setEditDraft((d) => ({ ...d, phase1Deadline: e.target.value }))} className={inputCls} /></div>
                  <div><label className="mb-1 block text-xs font-medium text-ptba-charcoal">Deadline Fase 2 <span className="text-ptba-gray font-normal">(WIB)</span></label><input type="datetime-local" value={editDraft.phase2Deadline} onChange={(e) => setEditDraft((d) => ({ ...d, phase2Deadline: e.target.value }))} className={inputCls} /></div>
                </div>
              ) : (
                <dl className="space-y-3 text-sm">
                  <div className="flex justify-between"><dt className="text-ptba-gray">Tanggal Mulai</dt><dd className="font-medium text-ptba-charcoal">{formatDate(project.startDate)}</dd></div>
                  <div className="flex justify-between"><dt className="text-ptba-gray">Tanggal Selesai</dt><dd className="font-medium text-ptba-charcoal">{formatDate(project.endDate)}</dd></div>
                  {project.phase1Deadline && <div className="flex justify-between"><dt className="text-ptba-gray">Deadline Fase 1</dt><dd className="font-medium text-ptba-steel-blue">{formatDateTime(project.phase1Deadline)}</dd></div>}
                  {project.phase2Deadline && <div className="flex justify-between"><dt className="text-ptba-gray">Deadline Fase 2</dt><dd className="font-medium text-ptba-navy">{formatDateTime(project.phase2Deadline)}</dd></div>}
                  <div className="flex justify-between"><dt className="text-ptba-gray">Progres Langkah</dt><dd className="font-medium text-ptba-charcoal">{project.currentStep}/{project.totalSteps}</dd></div>
                  <div className="flex justify-between"><dt className="text-ptba-gray">Langkah Saat Ini</dt><dd className="font-medium text-ptba-charcoal">{PROJECT_STEPS[project.currentStep - 1]?.name ?? "-"}</dd></div>
                </dl>
              )}
            </div>

            {/* Persyaratan Mitra */}
            <div className="rounded-xl bg-white p-6 shadow-sm md:col-span-2">
              <h3 className="mb-4 font-semibold text-ptba-charcoal">Persyaratan Mitra</h3>
              {editMode ? (
                <div className="space-y-3">
                  {reqDraft.map((req, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ptba-navy/10 text-xs font-medium text-ptba-navy">{i + 1}</span>
                      <input type="text" value={req} onChange={(e) => { const next = [...reqDraft]; next[i] = e.target.value; setReqDraft(next); }} placeholder="Contoh: Pengalaman minimal 5 tahun di bidang pertambangan" className={cn(inputCls, "flex-1")} />
                      <button onClick={() => setReqDraft((prev) => prev.filter((_, idx) => idx !== i))} disabled={reqDraft.length <= 1} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-red-500 hover:bg-red-50 disabled:text-gray-300 disabled:cursor-not-allowed transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  <button onClick={() => setReqDraft((prev) => [...prev, ""])} className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-ptba-steel-blue/40 px-3 py-2 text-xs font-medium text-ptba-steel-blue hover:bg-ptba-steel-blue/5 transition-colors">
                    <Plus className="h-3.5 w-3.5" /> Tambah Persyaratan
                  </button>
                </div>
              ) : (
                <div>
                  {reqs.length === 0
                    ? <p className="text-sm text-ptba-gray italic">Belum ada persyaratan.</p>
                    : <ol className="space-y-2">{reqs.map((req: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ptba-navy/10 text-[10px] font-bold text-ptba-navy mt-0.5">{i + 1}</span>
                          <span className="text-ptba-charcoal">{req}</span>
                        </li>
                      ))}</ol>
                  }
                </div>
              )}
            </div>

          {/* Dokumen yang Diperlukan */}
          <div className="rounded-xl bg-white p-6 shadow-sm md:col-span-2">
            <h3 className="mb-4 font-semibold text-ptba-charcoal">Dokumen yang Diperlukan</h3>
            {(() => {
              const requiredDocs = project.requiredDocuments || [];
              const phase1Docs = requiredDocs.filter((d: any) => d.phase === "phase1");
              const phase2Docs = requiredDocs.filter((d: any) => d.phase === "phase2");
              const phase3Docs = requiredDocs.filter((d: any) => d.phase === "phase3");
              const generalDocs = requiredDocs.filter((d: any) => !["phase1", "phase2"].includes(d.phase));

              const getDocName = (typeId: string) => {
                const dt = DOCUMENT_TYPES.find((d) => d.id === typeId);
                return dt ? dt.name : typeId;
              };
              const getDocDesc = (typeId: string) => {
                const dt = DOCUMENT_TYPES.find((d) => d.id === typeId);
                return dt?.description || "";
              };

              if (requiredDocs.length === 0) {
                return <p className="text-sm text-ptba-gray italic">Belum ada dokumen yang dikonfigurasi.</p>;
              }

              const renderDocList = (docs: any[], color: string, label: string) => {
                if (docs.length === 0) return null;
                const borderColor = color === "steel-blue" ? "border-ptba-steel-blue/30" : color === "navy" ? "border-ptba-navy/30" : color === "gold" ? "border-ptba-gold/30" : "border-gray-200";
                const bgColor = color === "steel-blue" ? "bg-ptba-steel-blue/10" : color === "navy" ? "bg-ptba-navy/10" : color === "gold" ? "bg-ptba-gold/10" : "bg-gray-50";
                const textColor = color === "steel-blue" ? "text-ptba-steel-blue" : color === "navy" ? "text-ptba-navy" : color === "gold" ? "text-ptba-gold" : "text-ptba-gray";
                const iconColor = textColor;
                return (
                  <div className={cn("rounded-lg border overflow-hidden", borderColor)}>
                    <div className={cn("px-4 py-2", bgColor)}>
                      <p className={cn("text-xs font-semibold", textColor)}>{label} ({docs.length})</p>
                    </div>
                    <div className="divide-y divide-gray-100">
                      {docs.map((d: any) => (
                        <div key={d.id} className="px-4 py-2.5 flex items-start gap-2">
                          <FileText className={cn("h-4 w-4 shrink-0 mt-0.5", iconColor)} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-ptba-charcoal">{getDocName(d.documentTypeId)}</p>
                            <p className="text-xs text-ptba-gray">{getDocDesc(d.documentTypeId)}</p>
                            {d.templateFileName && (
                              <p className="text-[10px] text-ptba-steel-blue mt-0.5">Template: {d.templateFileName}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              };

              return (
                <div className="space-y-4">
                  {renderDocList(phase1Docs, "steel-blue", "Dokumen Fase 1")}
                  {renderDocList(phase2Docs, "navy", "Dokumen Fase 2")}
                  {renderDocList(generalDocs, "gray", "Dokumen Umum")}
                </div>
              );
            })()}
          </div>

          {/* Dokumen Pendukung Proyek (PTBA uploads) — grouped by phase */}
          <div className="rounded-xl bg-white p-6 shadow-sm md:col-span-2">
            <h3 className="mb-4 font-semibold text-ptba-charcoal">Dokumen Pendukung Proyek</h3>
            {project.ptbaDocuments && project.ptbaDocuments.length > 0 ? (
              <div className="space-y-4">
                {(["phase1", "phase2"] as const).map((phase) => {
                  const phaseDocs = project.ptbaDocuments.filter((d: any) => (d.phase || "phase1") === phase);
                  if (phaseDocs.length === 0) return null;
                  const phaseLabels: Record<string, { label: string; color: string }> = {
                    phase1: { label: "Fase 1 (Publik)", color: "steel-blue" },
                    phase2: { label: "Fase 2", color: "navy" },
                    // phase3 removed — 2-phase system
                  };
                  const { label, color } = phaseLabels[phase];
                  return (
                    <div key={phase}>
                      <p className={`text-xs font-semibold uppercase mb-2 text-ptba-${color}`}>{label}</p>
                      <div className="space-y-2">
                        {phaseDocs.map((doc: any) => (
                          <div key={doc.id} className="flex items-center gap-3 rounded-lg border border-gray-200 p-3">
                            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-ptba-${color}/10`}>
                              <FileText className={`h-4 w-4 text-ptba-${color}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-ptba-charcoal truncate">{doc.name}</p>
                              <p className="text-xs text-ptba-gray">{doc.type}</p>
                            </div>
                            {doc.fileKey && accessToken && (
                              <button
                                onClick={async () => {
                                  try {
                                    const res = await fetch(`/api/projects/${id}/documents/${doc.id}`, {
                                      headers: { Authorization: `Bearer ${accessToken}` },
                                    });
                                    if (!res.ok) return;
                                    const blob = await res.blob();
                                    const url = URL.createObjectURL(blob);
                                    window.open(url, "_blank");
                                  } catch { /* ignore */ }
                                }}
                                className="inline-flex items-center gap-1 rounded-lg bg-ptba-steel-blue px-3 py-1.5 text-xs font-medium text-white hover:bg-ptba-steel-blue/90 transition-colors shrink-0"
                              >
                                <ExternalLink className="h-3 w-3" />
                                Lihat
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-ptba-gray italic">Belum ada dokumen pendukung. Upload melalui halaman edit.</p>
            )}
          </div>

          {/* PIC yang Ditunjuk */}
          <div className="rounded-xl bg-white p-6 shadow-sm md:col-span-2">
            <h3 className="mb-4 font-semibold text-ptba-charcoal">PIC yang Ditunjuk</h3>
            {project.phasePics && project.phasePics.length > 0 ? (
              <div className="space-y-4">
                {["phase1", "phase2"].map((phase) => {
                  const pics = project.phasePics.filter((p: any) => p.phase === phase);
                  if (pics.length === 0) return null;
                  const phaseLabels: Record<string, string> = { phase1: "Fase 1 (PQ)", phase2: "Fase 2 (FRP)" };
                  return (
                    <div key={phase}>
                      <p className="text-xs font-medium text-ptba-gray uppercase mb-2">{phaseLabels[phase]}</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {pics.map((pic: any) => (
                          <div key={`${pic.userId}-${pic.subcategory ?? ""}`} className="flex items-center gap-3 rounded-lg border border-gray-200 p-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ptba-navy/10">
                              <UserCheck className="h-4 w-4 text-ptba-navy" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-ptba-charcoal truncate">{pic.userName || "-"}</p>
                              <p className="text-xs text-ptba-gray uppercase">{pic.role}{pic.subcategory ? ` (${pic.subcategory})` : ""}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-ptba-gray italic">Belum ada PIC yang ditunjuk.</p>
            )}
          </div>
          </div>

          {/* Bottom save bar in edit mode */}
          {editMode && isAdmin && (
            <div className="rounded-xl bg-white p-5 shadow-sm">
              <div className="flex items-center justify-end gap-3">
                <button onClick={() => setEditMode(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                  Batal
                </button>
                <button disabled={saving} onClick={saveAll} className="inline-flex items-center gap-1.5 rounded-lg bg-ptba-navy px-6 py-2 text-sm font-medium text-white hover:bg-ptba-navy/90 transition-colors disabled:opacity-50">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Simpan Semua Perubahan
                </button>
              </div>
            </div>
          )}
        </div>
        );
      })()}

      {/* PIC Edit Modal */}
      {showPicEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-ptba-light-gray px-6 py-4 shrink-0">
              <h3 className="text-lg font-semibold text-ptba-charcoal">Edit PIC</h3>
              <button onClick={() => setShowPicEdit(false)} className="rounded-lg p-1 text-ptba-gray hover:bg-ptba-section-bg">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Phase Tabs */}
            <div className="px-6 pt-4 shrink-0">
              <div className="flex gap-1 rounded-lg bg-ptba-section-bg p-1">
                {(["phase1", "phase2"] as const).map((key) => (
                  <button key={key} type="button" onClick={() => setPicEditTab(key)}
                    className={cn("flex-1 rounded-md px-3 py-2 text-xs font-medium transition-all",
                      picEditTab === key ? "bg-white text-ptba-navy shadow-sm" : "text-ptba-gray hover:text-ptba-charcoal"
                    )}
                  >
                    {PHASE_PIC_CONFIG[key].label}
                  </button>
                ))}
              </div>
            </div>

            {/* Roles for active tab */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {PHASE_PIC_CONFIG[picEditTab].roles.map((slot) => {
                const sub = "subcategory" in slot ? slot.subcategory : undefined;
                const slotKey = `${picEditTab}-${slot.role}-${sub ?? ""}`;
                const assigned = picDraftFor(picEditTab, slot.role, sub);
                const usersForRole = picUsers.filter((u) => u.role === slot.role);

                return (
                  <div key={slotKey}>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-sm font-medium text-ptba-charcoal">{slot.label}</label>
                      {slot.multi && <span className="text-[10px] text-ptba-steel-blue font-medium">Multi</span>}
                    </div>

                    {!slot.multi ? (
                      <select value={assigned[0]?.userId ?? ""} onChange={(e) => setPicDraftSingle(picEditTab, slot.role, e.target.value, sub)}
                        className="w-full rounded-lg border border-ptba-light-gray px-3 py-2 text-sm focus:border-ptba-navy focus:outline-none focus:ring-1 focus:ring-ptba-navy">
                        <option value="">Pilih PIC...</option>
                        {usersForRole.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                      </select>
                    ) : (
                      <div className="space-y-2">
                        {assigned.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {assigned.map((pic) => (
                              <span key={pic.userId} className="inline-flex items-center gap-1 rounded-full bg-ptba-navy/10 px-2.5 py-1 text-xs text-ptba-navy">
                                {pic.userName}
                                <button type="button" onClick={() => removePicDraft(picEditTab, slot.role, pic.userId, sub)} className="ml-0.5 text-ptba-navy/50 hover:text-ptba-red">×</button>
                              </span>
                            ))}
                          </div>
                        )}
                        <select value="" onChange={(e) => { if (e.target.value) addPicDraft(picEditTab, slot.role, e.target.value, sub); }}
                          className="w-full rounded-lg border border-ptba-light-gray px-3 py-2 text-sm focus:border-ptba-navy focus:outline-none focus:ring-1 focus:ring-ptba-navy">
                          <option value="">Tambah PIC...</option>
                          {usersForRole.filter((u) => !assigned.some((a) => a.userId === u.id)).map((u) => (
                            <option key={u.id} value={u.id}>{u.name}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end gap-3 border-t border-ptba-light-gray px-6 py-4 shrink-0">
              <button onClick={() => setShowPicEdit(false)} className="rounded-lg border border-ptba-light-gray px-4 py-2 text-sm font-medium text-ptba-gray hover:bg-ptba-section-bg transition-colors">
                Batal
              </button>
              <button disabled={picSaving} onClick={async () => {
                if (!accessToken) return;
                setPicSaving(true);
                try {
                  const res = await projectApi(accessToken).update(id, { phasePics: picDraft });
                  setProject(res.data);
                  setShowPicEdit(false);
                } catch { /* ignore */ }
                finally { setPicSaving(false); }
              }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-ptba-navy px-5 py-2 text-sm font-semibold text-white hover:bg-ptba-steel-blue transition-colors disabled:opacity-50">
                {picSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Simpan PIC
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab: FAQ & Q&A Tickets */}
      {activeTab === "faq" && (role === "ebd" || role === "super_admin") && (() => {
        const FAQ_CATEGORIES = [
          { value: "pendaftaran", label: "Pendaftaran", color: "bg-blue-100 text-blue-700" },
          { value: "evaluasi", label: "Evaluasi", color: "bg-purple-100 text-purple-700" },
          { value: "dokumen", label: "Dokumen", color: "bg-teal-100 text-teal-700" },
          { value: "keuangan", label: "Keuangan", color: "bg-amber-100 text-amber-700" },
          { value: "umum", label: "Umum", color: "bg-gray-100 text-gray-700" },
        ];
        const catColor = (cat: string) => FAQ_CATEGORIES.find((c) => c.value === cat)?.color || "bg-gray-100 text-gray-700";
        const catLabel = (cat: string) => FAQ_CATEGORIES.find((c) => c.value === cat)?.label || cat;

        const generalFaqs = faqs.filter((f) => (f.section || "general") === "general");
        const mitraFaqs = faqs.filter((f) => (f.section || "general") === "mitra");
        const activeSection: "general" | "mitra" = faqSubTab === "mitra" ? "mitra" : "general";
        const sectionFaqs = activeSection === "general" ? generalFaqs : mitraFaqs;
        // Group by category preserving FAQ_CATEGORIES order
        const groupedFaqs = FAQ_CATEGORIES
          .map((c) => ({ ...c, items: sectionFaqs.filter((f) => (f.category || "umum") === c.value) }))
          .filter((g) => g.items.length > 0);

        const openCount = questions.filter((q) => q.status === "open").length;
        const filteredQuestions =
          questionStatusFilter === "all" ? questions : questions.filter((q) => q.status === questionStatusFilter);
        const selectedQuestion = questions.find((q) => q.id === selectedQuestionId) || null;

        const resetForm = () => { setFaqEditId(null); setFaqQuestion(""); setFaqAnswer(""); setFaqCategory("umum"); setFaqSection(activeSection); };
        const saveFaq = async () => {
          if (!accessToken) return;
          setFaqSaving(true);
          try {
            const body = {
              question: faqQuestion,
              answer: faqAnswer,
              category: faqCategory,
              section: faqSection || activeSection,
              sort_order: faqEditId ? undefined : faqs.length,
            };
            if (faqEditId) {
              const res = await api<{ faq: any }>(`/projects/${id}/faqs/${faqEditId}`, { method: "PUT", token: accessToken, body });
              setFaqs((prev) => prev.map((f) => f.id === faqEditId ? res.faq : f));
            } else {
              const res = await api<{ faq: any }>(`/projects/${id}/faqs`, { method: "POST", token: accessToken, body });
              setFaqs((prev) => [...prev, res.faq]);
            }
            resetForm();
          } catch { alert("Gagal menyimpan FAQ"); }
          finally { setFaqSaving(false); }
        };

        const fetchQuestions = async () => {
          if (!accessToken) return;
          setQuestionsLoading(true);
          try {
            const res = await api<{ questions: any[] }>(`/projects/${id}/questions`, { token: accessToken });
            setQuestions(res.questions || []);
          } catch { /* ignore */ }
          finally { setQuestionsLoading(false); }
        };

        const fetchQuestionMessages = async (qid: string) => {
          if (!accessToken) return;
          setQuestionMessagesLoading(true);
          try {
            const res = await api<{ question: any; messages: any[] }>(`/projects/${id}/questions/${qid}`, { token: accessToken });
            setQuestionMessages(res.messages || []);
          } catch { /* ignore */ }
          finally { setQuestionMessagesLoading(false); }
        };

        const sendReply = async () => {
          if (!accessToken || !selectedQuestionId || (!questionReply.trim() && !questionImageFile)) return;
          setQuestionReplyLoading(true);
          try {
            const formData = new FormData();
            if (questionReply.trim()) formData.append("message", questionReply.trim());
            if (questionImageFile) formData.append("image", questionImageFile);
            await fetchWithAuth(`/api/projects/${id}/questions/${selectedQuestionId}/messages`, {
              method: "POST",
              token: accessToken,
              body: formData,
            });
            setQuestionReply("");
            setQuestionImageFile(null);
            if (questionImagePreview) { URL.revokeObjectURL(questionImagePreview); setQuestionImagePreview(null); }
            await fetchQuestionMessages(selectedQuestionId);
            await fetchQuestions();
          } catch { alert("Gagal mengirim balasan"); }
          finally { setQuestionReplyLoading(false); }
        };

        const updateQuestionStatus = async (qid: string, status: "open" | "answered" | "closed") => {
          if (!accessToken) return;
          try {
            await api(`/projects/${id}/questions/${qid}/status`, {
              method: "PATCH",
              token: accessToken,
              body: { status },
            });
            await fetchQuestions();
          } catch { alert("Gagal mengubah status"); }
        };

        const saveQuestionsConfig = async () => {
          if (!accessToken) return;
          setQuestionConfigSaving(true);
          try {
            await api(`/projects/${id}/questions-config`, {
              method: "PUT",
              token: accessToken,
              body: {
                questions_open: questionsOpen,
                questions_close_at: questionsCloseAt || null,
              },
            });
          } catch { alert("Gagal menyimpan konfigurasi"); }
          finally { setQuestionConfigSaving(false); }
        };

        const subTabs = [
          { key: "general" as const, label: "FAQ Umum", icon: HelpCircle, count: generalFaqs.length },
          { key: "mitra" as const, label: "Pertanyaan Mitra", icon: Users, count: mitraFaqs.length },
          { key: "tickets" as const, label: "Q&A Tiket", icon: MessagesSquare, count: questions.length, badge: openCount },
        ];

        const formatRelative = (dateStr?: string) => {
          if (!dateStr) return "-";
          const d = new Date(dateStr);
          const now = new Date();
          const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
          if (diff < 60) return "baru saja";
          if (diff < 3600) return `${Math.floor(diff / 60)} mnt lalu`;
          if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`;
          if (diff < 604800) return `${Math.floor(diff / 86400)} hari lalu`;
          return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
        };

        const statusBadge = (status: string) => {
          const map: Record<string, { label: string; cls: string; icon: any }> = {
            open: { label: "Terbuka", cls: "bg-amber-100 text-amber-700 border-amber-200", icon: CircleDot },
            answered: { label: "Terjawab", cls: "bg-green-100 text-green-700 border-green-200", icon: CheckCheck },
            closed: { label: "Ditutup", cls: "bg-gray-100 text-gray-600 border-gray-200", icon: Lock },
          };
          return map[status] || map.open;
        };

        return (
          <div className="space-y-5">
            {/* Sub-tab header */}
            <div className="rounded-xl bg-white shadow-sm overflow-hidden">
              <div className="border-b border-ptba-light-gray px-6 pt-5 pb-0">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-ptba-charcoal flex items-center gap-2">
                      <MessagesSquare className="h-5 w-5 text-ptba-navy" /> Pusat Tanya Jawab
                    </h3>
                    <p className="text-xs text-ptba-gray mt-0.5">Kelola FAQ dan tiket pertanyaan langsung dari mitra</p>
                  </div>
                </div>
                <div className="flex gap-1 -mb-px">
                  {subTabs.map((t) => {
                    const Icon = t.icon;
                    const isActive = faqSubTab === t.key;
                    return (
                      <button
                        key={t.key}
                        onClick={() => {
                          setFaqSubTab(t.key);
                          if (t.key !== "tickets") setFaqSection(t.key);
                          if (t.key === "tickets" && questions.length === 0) fetchQuestions();
                        }}
                        className={cn(
                          "relative inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors",
                          isActive
                            ? "border-ptba-navy text-ptba-navy"
                            : "border-transparent text-ptba-gray hover:text-ptba-charcoal hover:border-ptba-light-gray"
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        {t.label}
                        <span className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                          isActive ? "bg-ptba-navy/10 text-ptba-navy" : "bg-ptba-section-bg text-ptba-gray"
                        )}>{t.count}</span>
                        {t.badge && t.badge > 0 ? (
                          <span className="absolute -top-1 -right-1 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-ptba-red px-1 text-[9px] font-bold text-white">
                            {t.badge}
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* === FAQ VIEWS (general / mitra) === */}
            {faqSubTab !== "tickets" && (
              <>
                {/* Add / Edit form */}
                {isAdmin && (
                  <div ref={faqFormRef} className="rounded-xl bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-sm font-bold text-ptba-navy flex items-center gap-2">
                        {faqEditId ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                        {faqEditId ? "Edit FAQ" : `Tambah FAQ ${activeSection === "general" ? "Umum" : "untuk Mitra"}`}
                      </p>
                      <span className="text-[10px] uppercase tracking-wider font-semibold text-ptba-gray bg-ptba-section-bg px-2 py-1 rounded">
                        {activeSection === "general" ? "FAQ UMUM" : "PERTANYAAN MITRA"}
                      </span>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="mb-1 block text-xs font-medium text-ptba-charcoal">Kategori</label>
                        <div className="flex flex-wrap gap-2">
                          {FAQ_CATEGORIES.map((c) => (
                            <button
                              key={c.value}
                              type="button"
                              onClick={() => setFaqCategory(c.value)}
                              className={cn(
                                "rounded-full px-3 py-1.5 text-xs font-semibold border transition-all",
                                faqCategory === c.value
                                  ? `${c.color} border-current shadow-sm`
                                  : "bg-white text-ptba-gray border-ptba-light-gray hover:border-ptba-steel-blue"
                              )}
                            >
                              {c.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-ptba-charcoal">Pertanyaan</label>
                        <input
                          type="text"
                          placeholder="Misal: Bagaimana cara mendaftar sebagai mitra?"
                          value={faqQuestion}
                          onChange={(e) => setFaqQuestion(e.target.value)}
                          className="w-full rounded-lg border border-ptba-light-gray px-3 py-2 text-sm outline-none focus:border-ptba-steel-blue focus:ring-2 focus:ring-ptba-steel-blue/10"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-ptba-charcoal">Jawaban</label>
                        <textarea
                          placeholder="Tulis jawaban yang jelas dan informatif..."
                          value={faqAnswer}
                          onChange={(e) => setFaqAnswer(e.target.value)}
                          rows={3}
                          className="w-full rounded-lg border border-ptba-light-gray px-3 py-2 text-sm outline-none focus:border-ptba-steel-blue focus:ring-2 focus:ring-ptba-steel-blue/10 resize-y"
                        />
                      </div>
                      <div className="flex gap-2 pt-1">
                        <button
                          disabled={!faqQuestion.trim() || !faqAnswer.trim() || faqSaving}
                          onClick={saveFaq}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-ptba-navy px-4 py-2 text-sm font-medium text-white hover:bg-ptba-steel-blue disabled:opacity-50 transition-colors"
                        >
                          {faqSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                          {faqSaving ? "Menyimpan..." : faqEditId ? "Update FAQ" : "Tambahkan FAQ"}
                        </button>
                        {faqEditId && (
                          <button onClick={resetForm} className="rounded-lg border border-ptba-light-gray px-4 py-2 text-sm text-ptba-gray hover:bg-ptba-section-bg transition-colors">
                            Batal
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* FAQ list grouped by category */}
                {sectionFaqs.length === 0 ? (
                  <div className="rounded-xl bg-white p-12 shadow-sm text-center">
                    <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-ptba-navy/5 mb-4">
                      <HelpCircle className="h-8 w-8 text-ptba-navy/50" />
                    </div>
                    <p className="text-base font-semibold text-ptba-charcoal mb-1">Belum ada FAQ</p>
                    <p className="text-sm text-ptba-gray">
                      {activeSection === "general"
                        ? "FAQ Umum belum ditambahkan untuk proyek ini."
                        : "Belum ada pertanyaan dari mitra yang diarsipkan."}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {groupedFaqs.map((group) => (
                      <div key={group.value} className="rounded-xl bg-white shadow-sm overflow-hidden">
                        <div className="flex items-center justify-between border-b border-ptba-light-gray bg-ptba-section-bg/40 px-5 py-3">
                          <div className="flex items-center gap-2">
                            <span className={cn("rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider", group.color)}>
                              {group.label}
                            </span>
                            <span className="text-xs text-ptba-gray">{group.items.length} pertanyaan</span>
                          </div>
                        </div>
                        <div className="divide-y divide-gray-100">
                          {group.items.map((faq) => (
                            <details key={faq.id} className="group">
                              <summary className="flex items-center gap-3 px-5 py-4 cursor-pointer hover:bg-ptba-section-bg/40 transition-colors list-none">
                                <ChevronDown className="h-4 w-4 text-ptba-gray shrink-0 group-open:rotate-180 transition-transform" />
                                <span className="text-sm font-semibold text-ptba-charcoal flex-1">{faq.question}</span>
                                {isAdmin && (
                                  <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        if (!faq.id) return;
                                        setFaqEditId(String(faq.id));
                                        setFaqQuestion(faq.question);
                                        setFaqAnswer(faq.answer);
                                        setFaqCategory(faq.category || "umum");
                                        setFaqSection(faq.section || "general");
                                        faqFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                                      }}
                                      className="rounded p-1.5 text-ptba-steel-blue hover:bg-ptba-steel-blue/10"
                                    >
                                      <Pencil className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={async (e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        if (!confirm("Hapus FAQ ini?") || !accessToken) return;
                                        await api(`/projects/${id}/faqs/${faq.id}`, { method: "DELETE", token: accessToken });
                                        setFaqs((prev) => prev.filter((f) => f.id !== faq.id));
                                      }}
                                      className="rounded p-1.5 text-ptba-red hover:bg-red-50"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                )}
                              </summary>
                              <div className="px-5 pb-5 pl-12">
                                <div className="rounded-lg bg-ptba-section-bg/40 border-l-2 border-ptba-steel-blue p-4">
                                  <p className="text-sm text-ptba-charcoal/80 leading-relaxed whitespace-pre-line">{faq.answer}</p>
                                </div>
                              </div>
                            </details>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* === Q&A TICKETS VIEW === */}
            {faqSubTab === "tickets" && (
              <>
                {/* Config bar */}
                <div className={cn(
                  "rounded-xl shadow-sm overflow-hidden border",
                  questionsOpen ? "border-green-200 bg-gradient-to-r from-green-50 to-white" : "border-gray-200 bg-white"
                )}>
                  <div className="p-5">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl",
                          questionsOpen ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                        )}>
                          {questionsOpen ? <Unlock className="h-6 w-6" /> : <Lock className="h-6 w-6" />}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-ptba-charcoal">
                            {questionsOpen ? "Pertanyaan Dibuka" : "Pertanyaan Ditutup"}
                          </p>
                          <p className="text-xs text-ptba-gray">
                            {questionsOpen
                              ? "Mitra dapat mengirim pertanyaan baru ke proyek ini."
                              : "Mitra tidak dapat mengirim pertanyaan baru saat ini."}
                          </p>
                        </div>
                      </div>
                      {isAdmin && (
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
                          {/* Toggle */}
                          <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-medium text-ptba-gray uppercase tracking-wide">Status</label>
                            <button
                              type="button"
                              onClick={() => setQuestionsOpen((v) => !v)}
                              className={cn(
                                "relative inline-flex h-8 w-16 shrink-0 items-center rounded-full transition-colors",
                                questionsOpen ? "bg-green-500" : "bg-gray-300"
                              )}
                            >
                              <span className={cn(
                                "inline-block h-6 w-6 transform rounded-full bg-white shadow transition-transform",
                                questionsOpen ? "translate-x-9" : "translate-x-1"
                              )} />
                            </button>
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-medium text-ptba-gray uppercase tracking-wide">Tutup Otomatis (Opsional)</label>
                            <div className="flex items-center gap-2 rounded-lg border border-ptba-light-gray bg-white px-3 py-2">
                              <CalendarClock className="h-4 w-4 text-ptba-gray shrink-0" />
                              <input
                                type="datetime-local"
                                value={questionsCloseAt}
                                onChange={(e) => setQuestionsCloseAt(e.target.value)}
                                className="text-xs text-ptba-charcoal outline-none bg-transparent"
                              />
                              {questionsCloseAt && (
                                <button type="button" onClick={() => setQuestionsCloseAt("")} className="text-ptba-gray hover:text-ptba-red" title="Hapus tanggal">
                                  <X className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                          </div>
                          <button
                            disabled={questionConfigSaving}
                            onClick={saveQuestionsConfig}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-ptba-navy px-4 py-2.5 text-sm font-semibold text-white hover:bg-ptba-steel-blue disabled:opacity-50 transition-colors"
                          >
                            {questionConfigSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                            Simpan
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Split layout */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                  {/* LEFT: Questions list */}
                  <div className="lg:col-span-5 rounded-xl bg-white shadow-sm overflow-hidden flex flex-col" style={{ minHeight: 600 }}>
                    <div className="border-b border-ptba-light-gray p-4">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-bold text-ptba-charcoal flex items-center gap-2">
                          <Inbox className="h-4 w-4 text-ptba-navy" /> Kotak Masuk
                        </p>
                        <button
                          onClick={fetchQuestions}
                          className="text-[11px] text-ptba-steel-blue hover:underline font-medium"
                        >
                          {questionsLoading ? "Memuat..." : "Muat ulang"}
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {([
                          { key: "all", label: "Semua", count: questions.length },
                          { key: "open", label: "Terbuka", count: questions.filter((q) => q.status === "open").length },
                          { key: "answered", label: "Terjawab", count: questions.filter((q) => q.status === "answered").length },
                          { key: "closed", label: "Ditutup", count: questions.filter((q) => q.status === "closed").length },
                        ] as const).map((f) => (
                          <button
                            key={f.key}
                            onClick={() => setQuestionStatusFilter(f.key)}
                            className={cn(
                              "rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors",
                              questionStatusFilter === f.key
                                ? "bg-ptba-navy text-white"
                                : "bg-ptba-section-bg text-ptba-gray hover:bg-ptba-light-gray"
                            )}
                          >
                            {f.label} <span className="opacity-70">{f.count}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                      {questionsLoading && questions.length === 0 ? (
                        <div className="flex items-center justify-center h-40">
                          <Loader2 className="h-5 w-5 animate-spin text-ptba-gray" />
                        </div>
                      ) : filteredQuestions.length === 0 ? (
                        <div className="text-center py-12 px-6">
                          <Inbox className="h-10 w-10 text-ptba-gray/40 mx-auto mb-3" />
                          <p className="text-sm font-medium text-ptba-charcoal mb-1">Tidak ada tiket</p>
                          <p className="text-xs text-ptba-gray">Belum ada pertanyaan dari mitra di filter ini.</p>
                        </div>
                      ) : (
                        <ul className="divide-y divide-gray-100">
                          {filteredQuestions.map((q) => {
                            const sb = statusBadge(q.status || "open");
                            const isSelected = selectedQuestionId === q.id;
                            const isOpen = q.status === "open";
                            return (
                              <li key={q.id}>
                                <button
                                  onClick={() => {
                                    setSelectedQuestionId(q.id);
                                    fetchQuestionMessages(q.id);
                                  }}
                                  className={cn(
                                    "w-full text-left px-4 py-3 transition-colors relative",
                                    isSelected ? "bg-ptba-navy/5 border-l-4 border-ptba-navy" : "hover:bg-ptba-section-bg/40 border-l-4 border-transparent",
                                    isOpen && !isSelected && "bg-amber-50/30"
                                  )}
                                >
                                  <div className="flex items-start justify-between gap-2 mb-1">
                                    <p className="text-xs font-semibold text-ptba-navy truncate">
                                      {q.partner_name || q.partnerName || "Mitra"}
                                    </p>
                                    <span className="text-[10px] text-ptba-gray shrink-0">{formatRelative(q.updated_at || q.created_at)}</span>
                                  </div>
                                  <p className={cn("text-sm mb-1.5 line-clamp-2", isOpen ? "font-bold text-ptba-charcoal" : "font-medium text-ptba-charcoal/80")}>
                                    {q.subject || "(Tanpa judul)"}
                                  </p>
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    {q.category && (
                                      <span className={cn("rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase", catColor(q.category))}>
                                        {catLabel(q.category)}
                                      </span>
                                    )}
                                    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase", sb.cls)}>
                                      <sb.icon className="h-2.5 w-2.5" />
                                      {sb.label}
                                    </span>
                                  </div>
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                  </div>

                  {/* RIGHT: Chat view */}
                  <div className="lg:col-span-7 rounded-xl bg-white shadow-sm overflow-hidden flex flex-col" style={{ minHeight: 600 }}>
                    {!selectedQuestion ? (
                      <div className="flex-1 flex items-center justify-center text-center px-6 py-12">
                        <div>
                          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-ptba-navy/5 mb-4">
                            <MessageSquare className="h-8 w-8 text-ptba-navy/40" />
                          </div>
                          <p className="text-base font-semibold text-ptba-charcoal mb-1">Pilih sebuah tiket</p>
                          <p className="text-sm text-ptba-gray">Pilih pertanyaan dari kotak masuk untuk melihat percakapan.</p>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* Header */}
                        <div className="border-b border-ptba-light-gray p-4">
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div className="min-w-0 flex-1">
                              <p className="text-base font-bold text-ptba-charcoal">{selectedQuestion.subject || "(Tanpa judul)"}</p>
                              <div className="flex items-center gap-2 mt-1 text-xs text-ptba-gray">
                                <Building2 className="h-3.5 w-3.5" />
                                <span className="font-medium text-ptba-navy">{selectedQuestion.partner_name || selectedQuestion.partnerName || "Mitra"}</span>
                                <span>·</span>
                                <span>{formatRelative(selectedQuestion.created_at)}</span>
                              </div>
                            </div>
                            {isAdmin && (
                              <select
                                value={selectedQuestion.status || "open"}
                                onChange={(e) => updateQuestionStatus(selectedQuestion.id, e.target.value as any)}
                                className="rounded-lg border border-ptba-light-gray px-3 py-1.5 text-xs font-semibold text-ptba-charcoal outline-none focus:border-ptba-steel-blue bg-white"
                              >
                                <option value="open">Terbuka</option>
                                <option value="answered">Terjawab</option>
                                <option value="closed">Ditutup</option>
                              </select>
                            )}
                          </div>
                          {selectedQuestion.category && (
                            <span className={cn("inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase", catColor(selectedQuestion.category))}>
                              {catLabel(selectedQuestion.category)}
                            </span>
                          )}
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 bg-ptba-section-bg/30 space-y-3">
                          {questionMessagesLoading ? (
                            <div className="flex items-center justify-center h-32">
                              <Loader2 className="h-5 w-5 animate-spin text-ptba-gray" />
                            </div>
                          ) : questionMessages.length === 0 ? (
                            <p className="text-center text-xs text-ptba-gray py-8">Belum ada pesan.</p>
                          ) : (
                            questionMessages.map((m, idx) => {
                              const isMitra = m.sender_type === "mitra" || m.senderType === "mitra";
                              const prev = idx > 0 ? questionMessages[idx - 1] : null;
                              const showDaySeparator = !prev || !isSameDay(prev.created_at, m.created_at);
                              return (
                                <div key={m.id}>
                                  {showDaySeparator && (
                                    <div className="flex justify-center my-3">
                                      <span className="rounded-full bg-ptba-section-bg px-3 py-1 text-[10px] font-medium text-ptba-gray shadow-sm">
                                        {formatChatDaySeparator(m.created_at)}
                                      </span>
                                    </div>
                                  )}
                                  <div className={cn("flex", isMitra ? "justify-start" : "justify-end")}>
                                    <div className={cn("max-w-[80%]", isMitra ? "items-start" : "items-end")}>
                                      <div className={cn(
                                        "rounded-2xl px-4 py-2.5 shadow-sm",
                                        isMitra
                                          ? "bg-white text-ptba-charcoal rounded-tl-sm border border-ptba-light-gray"
                                          : "bg-ptba-navy text-white rounded-tr-sm"
                                      )}>
                                        <p className="text-[10px] font-bold mb-0.5 opacity-80">
                                          {isMitra ? (m.sender_name || "Mitra") : (m.sender_name || "Admin PTBA")}
                                        </p>
                                        {m.image_url && (
                                          <img
                                            src={m.image_url}
                                            alt=""
                                            className="rounded-lg max-w-full max-h-48 object-contain cursor-pointer mb-1.5 hover:opacity-90 transition-opacity"
                                            onClick={() => setQuestionLightboxSrc(m.image_url)}
                                          />
                                        )}
                                        {m.message && <p className="text-sm whitespace-pre-line leading-relaxed">{m.message}</p>}
                                      </div>
                                      <p className={cn("text-[10px] text-ptba-gray mt-1 px-1", isMitra ? "text-left" : "text-right")}>
                                        {formatChatTime(m.created_at)}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>

                        {/* Reply box */}
                        {isAdmin && (
                          <div className="border-t border-ptba-light-gray p-4 bg-white">
                            {selectedQuestion.status === "closed" ? (
                              <div className="rounded-lg bg-gray-50 border border-gray-200 px-4 py-3 text-center">
                                <Lock className="h-4 w-4 text-ptba-gray mx-auto mb-1" />
                                <p className="text-xs text-ptba-gray">Tiket ini telah ditutup. Ubah status untuk membalas.</p>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                {questionImagePreview && (
                                  <div className="relative inline-block">
                                    <img src={questionImagePreview} alt="Preview" className="h-20 rounded-lg border border-ptba-light-gray object-cover" />
                                    <button onClick={() => { setQuestionImageFile(null); URL.revokeObjectURL(questionImagePreview); setQuestionImagePreview(null); }} className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white shadow-sm hover:bg-red-600">
                                      <X className="h-3 w-3" />
                                    </button>
                                  </div>
                                )}
                                <div className="flex gap-2 items-end">
                                  <input type="file" accept="image/*" className="hidden" id="admin-qa-image" onChange={(e) => {
                                    const f = e.target.files?.[0];
                                    if (f && f.type.startsWith("image/")) { setQuestionImageFile(f); setQuestionImagePreview(URL.createObjectURL(f)); }
                                    e.target.value = "";
                                  }} />
                                  <button onClick={() => document.getElementById("admin-qa-image")?.click()} className="rounded-lg border border-ptba-light-gray px-2.5 py-2.5 text-ptba-gray hover:bg-ptba-section-bg transition-colors" title="Lampirkan gambar">
                                    <ImagePlus className="h-4 w-4" />
                                  </button>
                                  <textarea
                                    value={questionReply}
                                    onChange={(e) => setQuestionReply(e.target.value)}
                                    placeholder="Tulis balasan untuk mitra..."
                                    rows={2}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) sendReply();
                                    }}
                                    className="flex-1 rounded-lg border border-ptba-light-gray px-3 py-2 text-sm outline-none focus:border-ptba-steel-blue focus:ring-2 focus:ring-ptba-steel-blue/10 resize-none"
                                  />
                                  <button
                                    disabled={(!questionReply.trim() && !questionImageFile) || questionReplyLoading}
                                    onClick={sendReply}
                                    className="inline-flex items-center gap-1.5 rounded-lg bg-ptba-gold px-4 py-2.5 text-sm font-semibold text-white hover:bg-ptba-gold/90 disabled:opacity-50 transition-colors shrink-0"
                                  >
                                    {questionReplyLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                    Kirim
                                  </button>
                                </div>
                              </div>
                            )}
                            <p className="text-[10px] text-ptba-gray mt-1.5 text-right">Tekan Cmd/Ctrl + Enter untuk kirim</p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        );
      })()}

      {/* Tab D: Riwayat */}
      {activeTab === "riwayat" && (
        <div className="space-y-6">
          {/* Phase 1 Evaluations */}
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-ptba-charcoal mb-4 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-ptba-navy" />
              Evaluasi Tahap 1
            </h3>
            {projectEvaluations.length > 0 ? (
              <div className="space-y-3">
                {projectEvaluations.map((ev: any) => {
                  const allFinalized = ev.finalized_count === 6;
                  return (
                    <div key={ev.id} className={cn("rounded-lg border p-4", allFinalized ? "border-green-200 bg-green-50/30" : "border-amber-200 bg-amber-50/30")}>
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="text-sm font-semibold text-ptba-charcoal">{ev.partner_name}</p>
                          <p className="text-[10px] text-ptba-gray">
                            Evaluator: {ev.evaluator_name || "-"} · {ev.evaluated_at ? formatDate(ev.evaluated_at) : "-"}
                            {allFinalized ? " · Difinalisasi" : ` · ${ev.finalized_count}/6 difinalisasi`}
                          </p>
                        </div>
                        <span className={cn("px-3 py-1 rounded-full text-xs font-semibold", allFinalized ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700")}>
                          {ev.finalized_count} / 6 Aspek
                        </span>
                      </div>
                      <div className="mt-2 flex items-center gap-3 text-[11px]">
                        <span className="text-green-700"><span className="font-bold">{ev.sesuai_count}</span> Sesuai</span>
                        <span className="text-amber-700"><span className="font-bold">{ev.perlu_diskusi_count}</span> Perlu Diskusi</span>
                        <span className="text-ptba-red"><span className="font-bold">{ev.tidak_sesuai_count}</span> Tidak Sesuai</span>
                      </div>
                      <div className="mt-2">
                        <Link
                          href={`/projects/${id}/evaluation/phase1?partnerId=${ev.partner_id}`}
                          className="text-xs text-ptba-steel-blue hover:underline"
                        >
                          Lihat Detail Evaluasi →
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-ptba-gray italic">Belum ada evaluasi.</p>
            )}
          </div>

          {/* Approvals */}
          {(() => {
            const approvals = projectApprovals;
            return approvals.length > 0 ? (
              <div className="rounded-xl bg-white p-6 shadow-sm">
                <h3 className="text-lg font-bold text-ptba-charcoal mb-4 flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-ptba-gold" />
                  Persetujuan
                </h3>
                <div className="space-y-3">
                  {approvals.map((ap: any) => (
                    <div key={ap.id} className={cn("rounded-lg border p-4", ap.status === "Disetujui" ? "border-green-200 bg-green-50/30" : ap.status === "Ditolak" ? "border-red-200 bg-red-50/30" : "border-amber-200 bg-amber-50/30")}>
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="text-sm font-semibold text-ptba-charcoal">{ap.approval_category || ap.type}</p>
                          <p className="text-[10px] text-ptba-gray">
                            Diminta oleh: {ap.requested_by} · {ap.requested_at ? formatDate(ap.requested_at) : "-"}
                          </p>
                        </div>
                        <span className={cn("px-3 py-1 rounded-full text-xs font-semibold", ap.status === "Disetujui" ? "bg-green-100 text-green-700" : ap.status === "Ditolak" ? "bg-red-100 text-ptba-red" : ap.status === "Dikembalikan" ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-500")}>
                          {ap.status}
                        </span>
                      </div>
                      {ap.approver && (
                        <p className="text-xs text-ptba-gray">Approver: {ap.approver} {ap.approved_at ? `· ${formatDate(ap.approved_at)}` : ""}</p>
                      )}
                      {ap.notes && <p className="text-xs text-ptba-gray mt-1 italic">"{ap.notes}"</p>}
                      <div className="mt-2">
                        <Link
                          href={`/approvals/${ap.id}`}
                          className="text-xs text-ptba-steel-blue hover:underline"
                        >
                          Lihat Detail Persetujuan →
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null;
          })()}

          {/* Phase 2 Payment History */}
          {project.phase?.startsWith("phase2") && projectPartners.some((p: any) => p.feePaymentStatus) && (
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <h3 className="text-lg font-bold text-ptba-charcoal mb-4 flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-ptba-steel-blue" />
                Pembayaran Commitment Fee
              </h3>
              <div className="space-y-2">
                {projectPartners.filter((p: any) => p.feePaymentStatus).map((p: any) => (
                  <div key={p.id} className="flex items-center justify-between rounded-lg border border-gray-200 p-3">
                    <div>
                      <p className="text-sm font-medium text-ptba-charcoal">{p.name}</p>
                      <p className="text-[10px] text-ptba-gray">{p.feePaymentStatus}</p>
                    </div>
                    <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-semibold", p.feePaymentStatus === "Sudah Bayar" ? "bg-green-100 text-green-700" : p.feePaymentStatus === "Ditolak" ? "bg-red-100 text-ptba-red" : "bg-amber-100 text-amber-700")}>
                      {p.feePaymentStatus}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Persetujuan Modal */}
      {showPersetujuanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
            <div className="border-b border-ptba-light-gray px-6 py-4">
              <h2 className="text-lg font-bold text-ptba-charcoal">Ajukan Persetujuan ke Ketua Tim</h2>
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
                <label className="mb-1 block text-sm font-medium text-ptba-charcoal">Catatan untuk Ketua Tim (opsional)</label>
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
                    Ajukan ke Ketua Tim
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image Lightbox */}
      {(lightboxSrc || questionLightboxSrc) && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => { setLightboxSrc(null); setQuestionLightboxSrc(null); }}
        >
          <button
            onClick={() => { setLightboxSrc(null); setQuestionLightboxSrc(null); }}
            className="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            <span className="text-2xl leading-none">&times;</span>
          </button>
          <img
            src={(lightboxSrc || questionLightboxSrc)!}
            alt=""
            className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
