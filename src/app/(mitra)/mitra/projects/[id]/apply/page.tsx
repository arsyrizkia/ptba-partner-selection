"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft, Upload, Download, CheckCircle2, FileText, AlertTriangle, Loader2, Send,
  Building2, DollarSign, Briefcase, ShieldCheck, ChevronDown, ChevronUp, Plus, Trash2,
  PenLine, ClipboardCheck, Save, ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useAuth } from "@/lib/auth/auth-context";
import { api, projectApi, ApiClientError, fetchWithAuth } from "@/lib/api/client";
import { partnerApi } from "@/lib/api/client";
import { PHASE1_DOCUMENT_TYPES, DOCUMENT_TYPES } from "@/lib/constants/document-types";
import { useTranslations } from "next-intl";
import { useLocale } from "@/lib/i18n/locale-context";
import { downloadDocument } from "@/lib/api/client";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002/api";

// ─── Types ───

type ExperienceType = 'powerplant' | 'general';
type ExperienceCategory = 'developer' | 'om_contractor' | 'financing' | 'general';

interface BaseExperience {
  uid: string;
  experienceType: ExperienceType;
  category: ExperienceCategory;
  plantName: string;
  location: string;
  totalCapacityMW: string;
}

interface DeveloperExperience extends BaseExperience {
  experienceType: 'powerplant';
  category: 'developer';
  equityPercent: string;
  ippOrCaptive: string;
  codYear: string;
}

interface OMContractorExperience extends BaseExperience {
  experienceType: 'powerplant';
  category: 'om_contractor';
  contractValueUSD: string;
  workPortionPercent: string;
  ippOrCaptive: string;
  codYear: string;
}

interface FinancingExperience extends BaseExperience {
  experienceType: 'powerplant';
  category: 'financing';
  financingType: string;
  amountUSD: string;
  codYear: string;
}

interface GeneralExperience extends BaseExperience {
  experienceType: 'general';
  category: 'general';
  projectType: string;
  role: string;
  contractValueUSD: string;
  description: string;
  codYear: string;
}

type CategorizedExperience = DeveloperExperience | OMContractorExperience | FinancingExperience | GeneralExperience;

interface FinancialYear {
  year: string;
  currency: string;
  totalAsset: string;
  totalDebt: string;
  totalEquity: string;
  ebitda: string;
  dscr: string;
}

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_RANGE_OPTIONS = [
  [CURRENT_YEAR - 3, CURRENT_YEAR - 2, CURRENT_YEAR - 1],
  [CURRENT_YEAR - 4, CURRENT_YEAR - 3, CURRENT_YEAR - 2],
];

const IPP_CAPTIVE_OPTIONS = ['IPP', 'Captive'];
const FINANCING_TYPE_OPTIONS = ['Non-Recourse', 'Limited Recourse', 'Corporate Financing', 'Direct Loan', 'Export Credit Facility'];
const POWERPLANT_CATEGORIES: { key: ExperienceCategory; label: string; labelEn: string }[] = [
  { key: 'developer', label: 'Sebagai Developer', labelEn: 'As a Successful Developer' },
  { key: 'om_contractor', label: 'Sebagai Kontraktor O&M', labelEn: 'As a Successful O&M Contractor' },
  { key: 'financing', label: 'Sebagai Kontributor Pembiayaan Proyek', labelEn: 'As a Successful Project Financing Contributor' },
];

// ─── Document-to-Section mapping ───

interface DocSectionConfig {
  docId: string;
  sectionKey: string;
  icon: React.ComponentType<{ className?: string }>;
}

const SECTION_ORDER: DocSectionConfig[] = [
  { docId: "compro", sectionKey: "companyInfo", icon: Building2 },
  { docId: "statement_eoi", sectionKey: "eoiStatement", icon: PenLine },
  { docId: "portfolio", sectionKey: "portfolio", icon: Briefcase },
  { docId: "financial_overview", sectionKey: "financialOverview", icon: DollarSign },
  { docId: "requirements_fulfillment", sectionKey: "requirementsFulfillment", icon: ClipboardCheck },
];

// ─── File Upload Helper ───

function FileUploadButton({
  label,
  accept,
  uploaded,
  uploading,
  fileName,
  onSelect,
  onDelete,
  templateFileName,
  onDownloadTemplate,
  readOnly,
  onDownload,
  error,
}: {
  label: string;
  accept?: string;
  uploaded: boolean;
  uploading: boolean;
  fileName?: string;
  onSelect: (file: File) => void;
  onDelete?: () => void;
  templateFileName?: string;
  onDownloadTemplate?: () => void;
  readOnly?: boolean;
  onDownload?: () => void;
  error?: boolean;
}) {
  const tc = useTranslations("common");

  // Read-only mode: show uploaded doc with download button, or nothing
  if (readOnly) {
    if (!uploaded && !fileName) return null;
    return (
      <div className="rounded-lg border border-green-200 bg-green-50/50 p-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
            <div className="min-w-0">
              <p className="text-xs font-medium text-ptba-charcoal">{label}</p>
              {fileName && <p className="text-[10px] text-green-600 truncate">{fileName}</p>}
            </div>
          </div>
          {onDownload && (
            <button
              type="button"
              onClick={onDownload}
              className="inline-flex items-center gap-1 rounded-lg border border-ptba-light-gray px-2.5 py-1.5 text-xs font-medium text-ptba-gray hover:bg-ptba-section-bg transition-colors shrink-0"
            >
              <Download className="h-3 w-3" /> {tc("download")}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {templateFileName && onDownloadTemplate && (
        <div className="flex items-center gap-2 rounded-lg border border-ptba-steel-blue/20 bg-ptba-steel-blue/5 px-3 py-2">
          <Download className="h-3.5 w-3.5 text-ptba-steel-blue shrink-0" />
          <span className="text-[11px] text-ptba-gray flex-1 truncate">Template: {templateFileName}</span>
          <button
            type="button"
            onClick={onDownloadTemplate}
            className="text-xs font-medium text-ptba-steel-blue hover:text-ptba-navy transition-colors shrink-0"
          >
            {tc("download")}
          </button>
        </div>
      )}
      <div className={cn(
        "rounded-lg border p-3 transition-colors",
        uploaded ? "border-green-200 bg-green-50/50" : error ? "border-ptba-red/60 bg-red-50/30 ring-2 ring-ptba-red/10" : "border-ptba-light-gray"
      )}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {uploaded ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
            ) : uploading ? (
              <Loader2 className="h-4 w-4 shrink-0 animate-spin text-ptba-gold" />
            ) : (
              <FileText className="h-4 w-4 shrink-0 text-ptba-gray" />
            )}
            <div className="min-w-0">
              <p className="text-xs font-medium text-ptba-charcoal">{label}</p>
              {fileName && <p className="text-[10px] text-green-600 truncate">{fileName}</p>}
              {uploading && <p className="text-[10px] text-ptba-gold">{tc("uploading")}</p>}
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {uploaded && onDelete && (
              <>
                {onDownload && (
                  <button
                    onClick={onDownload}
                    className="inline-flex items-center gap-1 rounded-lg border border-ptba-steel-blue/50 px-2 py-1.5 text-xs font-medium text-ptba-steel-blue hover:bg-ptba-steel-blue/5 transition-colors"
                    title={tc("view")}
                  >
                    <ExternalLink className="h-3 w-3" />
                    {tc("view")}
                  </button>
                )}
                <button
                  onClick={onDelete}
                  className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="h-3 w-3" />
                  {tc("delete")}
                </button>
                <label className="inline-flex items-center gap-1 rounded-lg border border-ptba-navy px-2 py-1.5 text-xs font-medium text-ptba-navy hover:bg-ptba-navy/5 transition-colors cursor-pointer">
                  <Upload className="h-3 w-3" />
                  {tc("replace")}
                  <input
                    type="file"
                    className="hidden"
                    accept={accept || ".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) onSelect(f);
                      e.target.value = "";
                    }}
                  />
                </label>
              </>
            )}
            {!uploaded && !uploading && (
              <label className="inline-flex items-center gap-1 rounded-lg bg-ptba-navy px-2.5 py-1.5 text-xs font-medium text-white hover:bg-ptba-navy/90 transition-colors cursor-pointer">
                <Upload className="h-3 w-3" />
                {tc("upload")}
                <input
                  type="file"
                  className="hidden"
                  accept={accept || ".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) onSelect(f);
                    e.target.value = "";
                  }}
                />
              </label>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Section Wrapper ───

function Section({
  id,
  number,
  title,
  icon: Icon,
  complete,
  open,
  onToggle,
  children,
  readOnly,
  isRequired,
}: {
  id?: string;
  number: number;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  complete: boolean;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  readOnly?: boolean;
  isRequired?: boolean;
}) {
  const { locale } = useLocale();
  return (
    <div id={id} className="rounded-xl bg-white shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-5 text-left hover:bg-ptba-off-white/50 transition-colors"
      >
        <div className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold",
          complete ? "bg-green-500 text-white" : "bg-ptba-navy/10 text-ptba-navy"
        )}>
          {complete ? <CheckCircle2 className="h-4 w-4" /> : number}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-ptba-charcoal">{title}</p>
            {isRequired !== undefined && (
              isRequired
                ? <span className="text-[9px] font-bold text-ptba-red bg-red-50 border border-red-200 rounded px-1.5 py-0.5">{locale === "en" ? "Required" : "Wajib"}</span>
                : <span className="text-[9px] font-medium text-ptba-gray bg-gray-100 border border-gray-200 rounded px-1.5 py-0.5">{locale === "en" ? "Preferable" : "Opsional"}</span>
            )}
          </div>
        </div>
        <Icon className="h-4 w-4 text-ptba-gray shrink-0" />
        {open ? <ChevronUp className="h-4 w-4 text-ptba-gray" /> : <ChevronDown className="h-4 w-4 text-ptba-gray" />}
      </button>
      {open && (
        <fieldset disabled={readOnly} className="border-0 border-t border-ptba-light-gray p-5 space-y-4 min-w-0 m-0">
          {children}
        </fieldset>
      )}
    </div>
  );
}

// ─── Main Page ───

export default function MitraProjectApplyPage() {
  const router = useRouter();
  const params = useParams();
  const { user, accessToken } = useAuth();
  const projectId = params.id as string;

  const t = useTranslations("apply");
  const tc = useTranslations("common");
  const { locale } = useLocale();

  // Data
  const [project, setProject] = useState<any>(null);
  const [application, setApplication] = useState<any>(null);
  const [_partner, setPartner] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);
  const [error, setError] = useState("");
  const [openSection, setOpenSection] = useState(1);
  const [showErrors, setShowErrors] = useState(false);

  // Section: Informasi Perusahaan (compro)
  const [companyName, setCompanyName] = useState("");
  const [companyCode, setCompanyCode] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [companyIndonesiaAddress, setCompanyIndonesiaAddress] = useState("");
  const [companyPhone, setCompanyPhone] = useState("");
  const [companyEmail, setCompanyEmail] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [companyStatus, setCompanyStatus] = useState("");
  const [yearEstablished, setYearEstablished] = useState("");
  const [countryEstablished, setCountryEstablished] = useState("Indonesia");
  const [businessOverview, setBusinessOverview] = useState("");
  const [marketShare, setMarketShare] = useState("");
  const [orgStructure, setOrgStructure] = useState("");
  const [subsidiaries, setSubsidiaries] = useState("");
  const [nib, setNib] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [shareholderType, setShareholderType] = useState<"majority" | "minority" | "">("");
  const [minorityEquityPercent, setMinorityEquityPercent] = useState("");
  const [equityNegotiable, setEquityNegotiable] = useState<"yes" | "no" | "">("");
  const [equityMinPercent, setEquityMinPercent] = useState("");
  const [canBecomeMinority, setCanBecomeMinority] = useState<"yes" | "no" | "">("");
  const [companyVision, setCompanyVision] = useState("");
  const [companyMission, setCompanyMission] = useState("");
  const [companyHistory, setCompanyHistory] = useState("");
  const [ceoName, setCeoName] = useState("");
  const [cooName, setCooName] = useState("");
  const [cfoName, setCfoName] = useState("");
  const [otherDirectors, setOtherDirectors] = useState("");
  const [shareholderComposition, setShareholderComposition] = useState("");

  // Section: Surat Pernyataan EoI (statement_eoi)
  const [signerName, setSignerName] = useState("");
  const [signerPosition, setSignerPosition] = useState("");
  const [signerDate, setSignerDate] = useState("");
  const [eoiAgreed, setEoiAgreed] = useState(false);

  // Section: Kriteria Keuangan (financial_overview)
  const [financialYears, setFinancialYears] = useState<FinancialYear[]>(
    YEAR_RANGE_OPTIONS[0].map((y) => ({ year: String(y), currency: "IDR", totalAsset: "", totalDebt: "", totalEquity: "", ebitda: "", dscr: "" }))
  );
  const selectedRangeKey = financialYears.map((f) => f.year).join("-");
  const handleYearRangeChange = (rangeIndex: number) => {
    const newYears = YEAR_RANGE_OPTIONS[rangeIndex];
    setFinancialYears(newYears.map((y) => ({ year: String(y), currency: "IDR", totalAsset: "", totalDebt: "", totalEquity: "", ebitda: "", dscr: "" })));
  };
  const [creditRatingAgency, setCreditRatingAgency] = useState("");
  const [creditRatingValue, setCreditRatingValue] = useState("");
  const [cashOnHand, setCashOnHand] = useState("");

  // Section: Pengalaman Proyek (portfolio)
  const [experiences, setExperiences] = useState<CategorizedExperience[]>([]);
  const [noExperience, setNoExperience] = useState(false);

  // Section: Pemenuhan Persyaratan (requirements_fulfillment)
  const [requirementAnswers, setRequirementAnswers] = useState<Record<number, boolean>>({});
  const [requirementNotes, setRequirementNotes] = useState("");

  // Section: Pernyataan Akhir
  const [agreedFinal, setAgreedFinal] = useState(false);

  // Document uploads tracking (docId → { name, uploading, dbId for deletion })
  const [uploadedDocs, setUploadedDocs] = useState<Record<string, { name: string; uploading: boolean; dbId?: string }>>({});

  // ─── Derived: which phase1 documents are required ───
  // Read from project.requiredDocuments (from DB: project_required_documents table)
  // Each entry has { documentTypeId, phase } — filter by phase === 'phase1'

  const requiredPhase1Docs = useMemo(() => {
    if (!project?.requiredDocuments || project.requiredDocuments.length === 0) {
      return PHASE1_DOCUMENT_TYPES.map((d) => d.id);
    }
    return project.requiredDocuments
      .filter((d: any) => d.phase === "phase1")
      .map((d: any) => d.documentTypeId);
  }, [project]);

  const activeSections = useMemo(() => {
    return SECTION_ORDER.filter((s) => requiredPhase1Docs.includes(s.docId));
  }, [requiredPhase1Docs]);

  // Track which sections are optional (isRequired === false from API)
  const optionalSectionIds = useMemo(() => {
    if (!project?.requiredDocuments) return new Set<string>();
    const set = new Set<string>();
    for (const d of project.requiredDocuments) {
      if (d.isRequired === false && d.phase === "phase1") set.add(d.documentTypeId);
    }
    return set;
  }, [project]);

  // Additional phase1 documents (docs assigned to phase1 that don't have a dedicated section)
  const sectionDocIds = new Set(SECTION_ORDER.map((s) => s.docId));
  const additionalPhase1Docs = useMemo(() => {
    if (!project?.requiredDocuments) return [];
    return project.requiredDocuments
      .filter((d: any) => (d.phase === "phase1" || d.phase === "both" || d.phase === "general") && !sectionDocIds.has(d.documentTypeId))
      .map((d: any) => {
        const meta = DOCUMENT_TYPES.find((dt) => dt.id === d.documentTypeId);
        return {
          id: d.documentTypeId,
          name: meta?.name || (d.documentTypeId.startsWith("custom_") ? d.documentTypeId.slice(7) : d.documentTypeId).replace(/_/g, " "),
          description: d.description || meta?.description || "",
          isRequired: d.isRequired !== false,
        };
      });
  }, [project]);

  const hasDoc = (docId: string) => requiredPhase1Docs.includes(docId);

  // ─── Fetch Data ───

  const fetchData = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const [projRes, appRes] = await Promise.all([
        projectApi(accessToken).getById(projectId),
        api<{ applications: any[] }>("/applications", { token: accessToken }),
      ]);
      setProject(projRes.data);
      const existingBasic = (appRes.applications || []).find((a: any) => a.project_id === projectId);

      // If a draft/existing application exists, fetch full detail (includes documents)
      let existing = existingBasic;
      if (existingBasic?.id) {
        try {
          const detailRes = await api<{ application: any }>(`/applications/${existingBasic.id}`, { token: accessToken });
          existing = detailRes.application;
        } catch {
          // Fall back to basic if detail fails
        }
      }
      setApplication(existing || null);

      // Restore uploaded documents from server
      if (existing?.phase1Documents?.length) {
        const restored: Record<string, { name: string; uploading: boolean; dbId?: string }> = {};
        for (const doc of existing.phase1Documents) {
          restored[doc.document_type_id] = { name: doc.name, uploading: false, dbId: doc.id };
        }
        setUploadedDocs(restored);
      }

      // Restore saved form data if exists
      if (existing?.form_data) {
        const fd = typeof existing.form_data === "string" ? JSON.parse(existing.form_data) : existing.form_data;
        if (fd.signerName) setSignerName(fd.signerName);
        if (fd.signerPosition) setSignerPosition(fd.signerPosition);
        if (fd.signerDate) setSignerDate(fd.signerDate);
        if (fd.eoiAgreed) setEoiAgreed(fd.eoiAgreed);
        if (fd.financialYears) setFinancialYears(fd.financialYears);
        if (fd.creditRatingAgency) setCreditRatingAgency(fd.creditRatingAgency);
        if (fd.creditRatingValue) setCreditRatingValue(fd.creditRatingValue);
        if (fd.cashOnHand) setCashOnHand(fd.cashOnHand);
        if (fd.experiences?.length && fd.experiences[0]?.category) setExperiences(fd.experiences);
        if (fd.noExperience) setNoExperience(true);
        if (fd.requirementAnswers) setRequirementAnswers(fd.requirementAnswers);
        if (fd.requirementNotes) setRequirementNotes(fd.requirementNotes);
        if (fd.agreedFinal) setAgreedFinal(fd.agreedFinal);
        if (fd.orgStructure) setOrgStructure(fd.orgStructure);
        if (fd.subsidiaries) setSubsidiaries(fd.subsidiaries);
        if (fd.shareholderType) setShareholderType(fd.shareholderType);
        if (fd.minorityEquityPercent) setMinorityEquityPercent(fd.minorityEquityPercent);
        if (fd.equityNegotiable) setEquityNegotiable(fd.equityNegotiable);
        if (fd.equityMinPercent) setEquityMinPercent(fd.equityMinPercent);
        if (fd.canBecomeMinority) setCanBecomeMinority(fd.canBecomeMinority);
        // Note: businessOverview, contactPerson/Phone/Email, companyAddress, etc.
        // are merged with partner profile data below (draft takes priority)
      }

      // Load partner profile — only use as defaults when no draft data exists
      if (user?.partnerId) {
        const p = await partnerApi(accessToken).getById(user.partnerId);
        setPartner(p);
        const hasDraft = !!existing?.form_data;
        const fd = hasDraft ? (typeof existing.form_data === "string" ? JSON.parse(existing.form_data) : existing.form_data) : null;
        // Always set from partner (these are not in form_data)
        setCompanyName(p.name || "");
        setCompanyCode(p.code || "");
        setCompanyStatus(p.status || "");
        setYearEstablished(p.registration_date ? new Date(p.registration_date).getFullYear().toString() : "");
        // For fields that can be in both partner profile AND form_data, draft takes priority
        setCompanyAddress(fd?.companyAddress || p.address || "");
        setCompanyIndonesiaAddress(fd?.companyIndonesiaAddress || p.indonesia_office_address || "");
        setCompanyPhone(fd?.companyPhone || p.phone || "");
        setCompanyEmail(fd?.companyEmail || (p.company_domain ? `info@${p.company_domain}` : "") || "");
        setCompanyWebsite(fd?.companyWebsite || p.website || "");
        if (fd?.companyStatus) setCompanyStatus(fd.companyStatus);
        setBusinessOverview(fd?.businessOverview || p.business_overview || "");
        if (fd?.marketShare) setMarketShare(fd.marketShare);
        setNib(fd?.nib || p.nib || "");
        setContactPerson(fd?.contactPerson || p.contact_person || "");
        setContactPhone(fd?.contactPhone || p.contact_phone || "");
        setContactEmail(fd?.contactEmail || p.contact_email || "");
        if (fd?.companyVision) setCompanyVision(fd.companyVision);
        if (fd?.companyMission) setCompanyMission(fd.companyMission);
        if (fd?.companyHistory) setCompanyHistory(fd.companyHistory);
        if (fd?.ceoName) setCeoName(fd.ceoName);
        if (fd?.cooName) setCooName(fd.cooName);
        if (fd?.cfoName) setCfoName(fd.cfoName);
        if (fd?.otherDirectors) setOtherDirectors(fd.otherDirectors);
        if (fd?.shareholderComposition) setShareholderComposition(fd.shareholderComposition);
      }
    } catch {
      setProject(null);
    } finally {
      setLoading(false);
    }
  }, [projectId, accessToken, user?.partnerId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ─── Upload Helper ───

  const uploadDoc = async (docTypeId: string, _docName: string, file: File, phase = "phase1") => {
    if (!accessToken) return;
    setError("");
    const existingDoc = uploadedDocs[docTypeId];

    // Auto-name: document type name + company name
    const docTypeMeta = [...PHASE1_DOCUMENT_TYPES, ...DOCUMENT_TYPES].find((dt) => dt.id === docTypeId);
    const autoName = `${docTypeMeta?.name || docTypeId} - ${companyName || "Mitra"}`;

    setUploadedDocs((prev) => ({ ...prev, [docTypeId]: { name: autoName, uploading: true } }));

    try {
      let appId = application?.id;
      if (!appId) {
        const res = await api<{ application: any }>("/applications", {
          method: "POST",
          body: { projectId },
          token: accessToken,
        });
        appId = res.application.id;
        setApplication(res.application);
      }

      // Delete old document if replacing
      if (existingDoc?.dbId) {
        await fetchWithAuth(`${API_BASE}/applications/${appId}/documents/${existingDoc.dbId}`, {
          method: "DELETE",
          token: accessToken,
        });
      }

      const formData = new FormData();
      formData.append("file", file);
      formData.append("documentTypeId", docTypeId);
      formData.append("name", autoName);
      formData.append("phase", phase);

      const res = await fetchWithAuth(`${API_BASE}/applications/${appId}/documents`, {
        method: "POST",
        token: accessToken,
        body: formData,
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || "Gagal mengunggah");
      }

      setUploadedDocs((prev) => ({ ...prev, [docTypeId]: { name: autoName, uploading: false, dbId: resData.document?.id } }));

      // Auto-save form data after upload
      await saveFormDataToServer(appId);
    } catch (err: any) {
      setError(err.message || t("errors.uploadFailed"));
      setUploadedDocs((prev) => {
        const next = { ...prev };
        delete next[docTypeId];
        return next;
      });
    }
  };

  // ─── Delete Document ───

  const deleteDoc = async (docTypeId: string) => {
    if (!accessToken || !application?.id) return;
    const doc = uploadedDocs[docTypeId];
    if (!doc?.dbId) return;

    setUploadedDocs((prev) => ({ ...prev, [docTypeId]: { ...prev[docTypeId], uploading: true } }));
    try {
      const res = await fetchWithAuth(`${API_BASE}/applications/${application.id}/documents/${doc.dbId}`, {
        method: "DELETE",
        token: accessToken,
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || t("errors.deleteFailed"));
      }
      setUploadedDocs((prev) => {
        const next = { ...prev };
        delete next[docTypeId];
        return next;
      });
    } catch (err: any) {
      setError(err.message || t("errors.deleteFailed"));
      setUploadedDocs((prev) => ({ ...prev, [docTypeId]: { ...doc, uploading: false } }));
    }
  };

  // ─── Download Template ───

  const getTemplateInfo = (docTypeId: string) => {
    if (!project?.requiredDocuments) return null;
    const doc = project.requiredDocuments.find(
      (d: any) => d.documentTypeId === docTypeId && d.templateFileKey
    );
    return doc ? { id: doc.id, fileName: doc.templateFileName } : null;
  };

  const downloadTemplate = async (docTypeId: string) => {
    if (!accessToken || !project) return;
    const reqDoc = project.requiredDocuments?.find(
      (d: any) => d.documentTypeId === docTypeId && d.templateFileKey
    );
    if (!reqDoc) return;
    try {
      const res = await fetch(
        `${API_BASE}/projects/${projectId}/required-documents/${reqDoc.id}/template-url`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const data = await res.json();
      if (data.url) {
        const blob = await fetch(data.url).then((r) => r.blob());
        const ext = (reqDoc.templateFileName || reqDoc.templateFileKey || "").split(".").pop() || "pdf";
        const fileName = reqDoc.templateFileName || `Template_${docTypeId}.${ext}`;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch {
      setError(t("errors.templateFailed"));
    }
  };

  // ─── Save Form Data ───

  const buildFormData = () => ({
    signerName,
    signerPosition,
    signerDate,
    eoiAgreed,
    financialYears,
    creditRatingAgency,
    creditRatingValue,
    cashOnHand,
    experiences,
    noExperience,
    requirementAnswers,
    requirementNotes,
    agreedFinal,
    companyName,
    companyAddress,
    companyIndonesiaAddress,
    companyPhone,
    companyEmail,
    companyWebsite,
    companyStatus,
    yearEstablished,
    countryEstablished,
    businessOverview,
    marketShare,
    orgStructure,
    subsidiaries,
    nib,
    contactPerson,
    contactPhone,
    contactEmail,
    companyVision,
    companyMission,
    companyHistory,
    ceoName,
    cooName,
    cfoName,
    otherDirectors,
    shareholderComposition,
    shareholderType,
    minorityEquityPercent,
    equityNegotiable,
    equityMinPercent,
    canBecomeMinority,
  });

  const buildFormDataRef = useRef(buildFormData);
  buildFormDataRef.current = buildFormData;

  const saveFormDataToServer = useCallback(async (appId: string) => {
    if (!accessToken) return;
    await fetchWithAuth(`${API_BASE}/applications/${appId}/form-data`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      token: accessToken,
      body: JSON.stringify({ formData: buildFormDataRef.current() }),
    });
  }, [accessToken]);

  // ─── Auto-save (debounced) ───
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);
  const autoSaveFormData = useCallback(() => {
    if (!application?.id || !accessToken) return;
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      saveFormDataToServer(application.id).catch(() => {});
    }, 2000);
  }, [application?.id, accessToken]);

  // Trigger auto-save when form fields change (skip in read-only mode)
  useEffect(() => {
    if (!application?.id || readOnly) return;
    autoSaveFormData();
    return () => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current); };
  }, [
    signerName, signerPosition, signerDate, eoiAgreed, shareholderType, minorityEquityPercent, equityNegotiable, equityMinPercent, canBecomeMinority, cashOnHand,
    creditRatingAgency, creditRatingValue, financialYears, experiences, noExperience,
    requirementAnswers, requirementNotes, agreedFinal,
    companyName, companyAddress, companyIndonesiaAddress, companyPhone, companyEmail,
    companyWebsite, companyStatus, yearEstablished, countryEstablished, businessOverview, marketShare,
    orgStructure, subsidiaries, nib, contactPerson, contactPhone, contactEmail,
    companyVision, companyMission, companyHistory, ceoName, cooName, cfoName, otherDirectors, shareholderComposition,
    autoSaveFormData, application?.id,
  ]);

  // ─── Submit ───

  const handleSubmit = async () => {
    if (!accessToken || !application?.id) return;
    setSubmitting(true);
    setError("");
    try {
      // Save form data first
      await saveFormDataToServer(application.id);

      await api(`/applications/${application.id}/submit`, {
        method: "POST",
        token: accessToken,
      });
      router.push(`/mitra/projects/${projectId}/apply/success`);
    } catch (err) {
      const msg = err instanceof ApiClientError ? err.message : t("errors.submitFailed");
      setError(msg);
      setShowErrors(true);
      setTimeout(() => {
        scrollToFirstIncomplete();
        // Also scroll to error banner if no incomplete section found
        const errBanner = document.querySelector('[class*="bg-red-50"][class*="border-red"]');
        if (errBanner) errBanner.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 100);
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Save Draft ───

  const handleSaveDraft = async () => {
    if (!accessToken) return;
    setSavingDraft(true);
    setError("");
    setDraftSaved(false);
    try {
      let appId = application?.id;
      if (!appId) {
        const res = await api<{ application: any }>("/applications", {
          method: "POST",
          body: { projectId },
          token: accessToken,
        });
        appId = res.application.id;
        setApplication(res.application);
      }
      await saveFormDataToServer(appId);
      setDraftSaved(true);
      setTimeout(() => setDraftSaved(false), 3000);
    } catch (err) {
      if (err instanceof ApiClientError) setError(err.message);
      else setError(t("errors.draftFailed"));
    } finally {
      setSavingDraft(false);
    }
  };

  // ─── Section Completeness ───

  const isDoc = (id: string) => uploadedDocs[id] && !uploadedDocs[id].uploading;

  // requirements from API are objects: { id, requirement, sortOrder }
  const projectRequirements: string[] = (project?.requirements || []).map((r: any) =>
    typeof r === "string" ? r : r.requirement
  );

  const sectionComplete: Record<string, boolean> = {
    compro: !!companyName && !!companyAddress && !!businessOverview && !!companyPhone && !!companyEmail && !!companyWebsite && !!companyStatus && !!yearEstablished && !!countryEstablished && !!contactPerson && !!contactPhone && !!contactEmail && !!companyVision && !!companyMission && isDoc("company_history") && !!shareholderComposition && isDoc("nib_document") && isDoc("org_structure") && isDoc("compro"),
    statement_eoi: !!signerName && !!signerPosition && !!signerDate && !!shareholderType && !!minorityEquityPercent && !!equityNegotiable && (equityNegotiable !== "yes" || (!!equityMinPercent && (shareholderType !== "majority" || !!canBecomeMinority))) && !!cashOnHand && eoiAgreed && isDoc("statement_eoi") && isDoc("cash_on_hand_evidence"),
    portfolio: noExperience || (experiences.length >= 1 && experiences.every((exp) => {
      const hasCred = isDoc(`credential_exp_${exp.uid}`);
      if (exp.category === 'general') {
        return !!exp.plantName && !!exp.location && hasCred && !!(exp as any).projectType && !!(exp as any).role && !!(exp as any).codYear;
      }
      const base = !!exp.plantName && !!exp.location && !!exp.totalCapacityMW && hasCred;
      if (exp.category === 'developer') return base && !!exp.equityPercent && !!exp.ippOrCaptive && !!exp.codYear;
      if (exp.category === 'om_contractor') return base && !!exp.contractValueUSD && !!exp.workPortionPercent && !!exp.ippOrCaptive && !!exp.codYear;
      if (exp.category === 'financing') return base && !!exp.financingType && !!exp.amountUSD && !!exp.codYear;
      return false;
    })),
    financial_overview: financialYears.every((f) => (f.totalDebt || f.totalEquity) && f.ebitda && f.dscr)
      && financialYears.every((f) => isDoc(`audited_financial_${f.year}`))
      && !!creditRatingAgency && !!creditRatingValue
      && isDoc("credit_rating_evidence")
      && isDoc("ebitda_dscr_calculation"),
    requirements_fulfillment: (projectRequirements.length
      ? projectRequirements.every((_: string, i: number) => requirementAnswers[i] === true)
      : true) && isDoc("requirements_fulfillment"),
    final: agreedFinal,
  };

  const activeSectionIds = activeSections.map((s) => s.docId);
  const hasAdditionalDocs = additionalPhase1Docs.length > 0;
  const additionalDocsComplete = hasAdditionalDocs ? additionalPhase1Docs.every((d: { id: string; isRequired?: boolean }) => !d.isRequired || isDoc(d.id)) : true;
  const completedCount = activeSectionIds.filter((id) => sectionComplete[id]).length
    + (hasAdditionalDocs && additionalDocsComplete ? 1 : 0)
    + (sectionComplete.final ? 1 : 0);
  const totalSections = activeSections.length + (hasAdditionalDocs ? 1 : 0) + 1;
  const allComplete = activeSectionIds.every((id) => optionalSectionIds.has(id) || sectionComplete[id]) && additionalDocsComplete && sectionComplete.final;

  const scrollToFirstIncomplete = () => {
    const scrollToEl = (el: Element, sectionNum: number) => {
      setOpenSection(sectionNum);
      // Delay to let section expand, then scroll to first error field
      setTimeout(() => {
        const errField = el.querySelector('[class*="border-ptba-red"], [class*="ring-ptba-red"], [class*="border-red"]');
        if (errField) {
          errField.scrollIntoView({ behavior: "smooth", block: "center" });
        } else {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 150);
    };

    // Check main sections
    for (const id of activeSectionIds) {
      if (!sectionComplete[id]) {
        const el = document.getElementById(`section-${id}`);
        if (el) scrollToEl(el, getSectionNumber(id));
        return;
      }
    }
    // Check additional docs section
    if (hasAdditionalDocs && !additionalDocsComplete) {
      const el = document.getElementById("section-additional");
      if (el) scrollToEl(el, additionalDocsSectionNumber);
      return;
    }
    // Check final section
    if (!sectionComplete.final) {
      const el = document.getElementById("section-final");
      if (el) scrollToEl(el, finalSectionNumber);
    }
  };

  // ─── Experience Handlers ───

  const addExperience = (category: ExperienceCategory) => {
    const uid = crypto.randomUUID();
    const base = { uid, plantName: "", location: "", totalCapacityMW: "" };
    let newExp: CategorizedExperience;
    if (category === 'developer') {
      newExp = { ...base, experienceType: 'powerplant' as const, category: 'developer', equityPercent: "", ippOrCaptive: "", codYear: "" };
    } else if (category === 'om_contractor') {
      newExp = { ...base, experienceType: 'powerplant' as const, category: 'om_contractor', contractValueUSD: "", workPortionPercent: "", ippOrCaptive: "", codYear: "" };
    } else if (category === 'financing') {
      newExp = { ...base, experienceType: 'powerplant' as const, category: 'financing', financingType: "", amountUSD: "", codYear: "" };
    } else {
      newExp = { ...base, experienceType: 'general' as const, category: 'general', projectType: "", role: "", contractValueUSD: "", description: "", codYear: "" };
    }
    setExperiences((prev) => [...prev, newExp]);
  };
  const removeExperience = (i: number) => {
    const exp = experiences[i];
    if (exp) deleteDoc(`credential_exp_${exp.uid}`);
    setExperiences((prev) => prev.filter((_, idx) => idx !== i));
  };
  const updateExperience = (i: number, field: string, value: string) =>
    setExperiences((prev) => prev.map((e, idx) => idx === i ? { ...e, [field]: value } : e) as CategorizedExperience[]);
  const changeExperienceType = (i: number, newType: ExperienceType) => {
    setExperiences((prev) => prev.map((e, idx) => {
      if (idx !== i) return e;
      const base = { uid: e.uid, plantName: e.plantName, location: e.location, totalCapacityMW: e.totalCapacityMW };
      if (newType === 'powerplant') return { ...base, experienceType: 'powerplant' as const, category: 'developer' as const, equityPercent: "", ippOrCaptive: "", codYear: "" };
      return { ...base, experienceType: 'general' as const, category: 'general' as const, projectType: "", role: "", contractValueUSD: "", description: "", codYear: "" };
    }));
  };
  const changeExperienceCategory = (i: number, newCategory: ExperienceCategory) => {
    setExperiences((prev) => prev.map((e, idx) => {
      if (idx !== i) return e;
      const base = { uid: e.uid, experienceType: e.experienceType || 'powerplant' as ExperienceType, plantName: e.plantName, location: e.location, totalCapacityMW: e.totalCapacityMW };
      if (newCategory === 'developer') return { ...base, experienceType: 'powerplant' as const, category: 'developer' as const, equityPercent: "", ippOrCaptive: "", codYear: "" };
      if (newCategory === 'om_contractor') return { ...base, experienceType: 'powerplant' as const, category: 'om_contractor' as const, contractValueUSD: "", workPortionPercent: "", ippOrCaptive: "", codYear: "" };
      if (newCategory === 'general') return { ...base, experienceType: 'general' as const, category: 'general' as const, projectType: "", role: "", contractValueUSD: "", description: "", codYear: "" };
      return { ...base, experienceType: 'powerplant' as const, category: 'financing' as const, financingType: "", amountUSD: "", codYear: "" };
    }));
  };

  // Read-only mode: form already submitted
  const readOnly = !!(application && application.status !== "Draft");

  // Helper to get file_key for a document type (for download in readOnly mode)
  const getDocFileKey = (docTypeId: string): string | undefined => {
    const docs = application?.phase1Documents || application?.documents || [];
    return docs.find((d: any) => d.document_type_id === docTypeId)?.file_key;
  };
  const docDownloadHandler = (docTypeId: string) => {
    const fileKey = getDocFileKey(docTypeId);
    return fileKey ? () => downloadDocument(fileKey, accessToken!, uploadedDocs[docTypeId]?.name) : undefined;
  };

  const inputClass = cn(
    "w-full rounded-lg border px-3 py-2 text-sm outline-none",
    readOnly
      ? "border-ptba-light-gray/50 bg-transparent text-ptba-charcoal"
      : "border-ptba-light-gray bg-ptba-off-white focus:border-ptba-steel-blue focus:ring-2 focus:ring-ptba-steel-blue/20"
  );

  // Error highlight: returns red border class when field is empty and showErrors is active
  // Format number with thousand separators for display (10000 → 10,000)
  const fmtThousand = (val: string) => {
    const clean = val.replace(/,/g, "");
    const num = parseFloat(clean);
    if (!clean || isNaN(num)) return val;
    // Preserve decimal part
    const parts = clean.split(".");
    const intPart = parseInt(parts[0]).toLocaleString("en-US");
    return parts.length > 1 ? `${intPart}.${parts[1]}` : intPart;
  };

  const errBorder = (value: string | boolean) => showErrors && !value ? "!border-ptba-red/60 !ring-2 !ring-ptba-red/10" : "";
  const errMsg = (value: string | boolean) => showErrors && !value;
  const ErrText = ({ show }: { show: boolean }) => show ? <p className="text-[10px] text-ptba-red mt-0.5">{locale === "en" ? "This field is required" : "Wajib diisi"}</p> : null;
  const ErrDocText = ({ docId }: { docId: string }) => showErrors && !isDoc(docId) ? <p className="text-[10px] text-ptba-red mt-1">{locale === "en" ? "Document required" : "Dokumen wajib diunggah"}</p> : null;

  const dateLocale = locale === "en" ? "en-US" : "id-ID";

  // ─── Loading / Guards ───

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-ptba-steel-blue" />
        <span className="ml-3 text-ptba-gray">{tc("loading")}</span>
      </div>
    );
  }

  if (!project || (!readOnly && !project.isOpenForApplication)) {
    return (
      <div className="space-y-6">
        <button onClick={() => router.back()} className="inline-flex items-center gap-1.5 text-sm text-ptba-steel-blue hover:text-ptba-navy">
          <ArrowLeft className="h-4 w-4" /> {tc("back")}
        </button>
        <div className="rounded-xl bg-white p-12 text-center shadow-sm">
          <AlertTriangle className="mx-auto h-12 w-12 text-ptba-gold" />
          <p className="mt-3 text-lg font-semibold text-ptba-charcoal">{!project ? t("projectNotFound") : t("registrationNotOpen")}</p>
        </div>
      </div>
    );
  }

  // Build dynamic section numbering
  const getSectionNumber = (docId: string) => {
    const idx = activeSections.findIndex((s) => s.docId === docId);
    return idx + 1;
  };
  const additionalDocsSectionNumber = activeSections.length + 1;
  const finalSectionNumber = activeSections.length + (hasAdditionalDocs ? 1 : 0) + 1;

  // Get phase1 doc metadata
  const getDocMeta = (docId: string) => PHASE1_DOCUMENT_TYPES.find((d) => d.id === docId);

  // Helper to get section title/description from translation key
  const getSectionTitle = (sectionKey: string) => t(`sections.${sectionKey}`);
  const getSectionDesc = (sectionKey: string) => t(`sections.${sectionKey}Desc`);
  const sectionTitle = (_docId: string, sectionKey: string) => t(`sections.${sectionKey}`);

  return (
    <div className="space-y-6">
      <button onClick={() => router.push(`/mitra/projects/${projectId}`)} className="inline-flex items-center gap-1.5 text-sm text-ptba-steel-blue hover:text-ptba-navy">
        <ArrowLeft className="h-4 w-4" /> {tc("backToProjectDetail")}
      </button>

      <div>
        <h1 className="text-2xl font-bold text-ptba-charcoal">{t("title")}</h1>
        <p className="text-sm text-ptba-gray mt-1">
          {t("phaseLabel")} — <span className="font-medium text-ptba-charcoal">{project.name}</span>
        </p>
      </div>

      {/* Status Banner (read-only) */}
      {readOnly && (
        <div className="rounded-xl bg-green-50 border border-green-200 p-5">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-6 w-6 text-green-600 shrink-0" />
            <div>
              <p className="text-sm font-bold text-green-800">{t("alreadyRegistered")}</p>
              <p className="text-xs text-green-700 mt-0.5">
                {t("statusLabel", { status: application.status })} · {tc("submitted")}: {application.applied_at ? `${new Date(application.applied_at).toLocaleDateString(locale === "en" ? "en-US" : "id-ID", { day: "numeric", month: "long", year: "numeric" })} ${new Date(application.applied_at).toLocaleTimeString(locale === "en" ? "en-US" : "id-ID", { hour: "2-digit", minute: "2-digit" })}` : ""}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* EoI Description */}
      {!readOnly && <div className="rounded-xl bg-white shadow-sm overflow-hidden">
        <div className="bg-ptba-navy px-5 py-3">
          <p className="text-sm font-bold text-white">{t("importantInfo")}</p>
        </div>
        <div className="p-5 space-y-3">
          <p className="text-sm text-ptba-charcoal leading-relaxed">
            {t.rich("eoiIntro", {
              projectName: project.name,
              strong: (chunks) => <strong>{chunks}</strong>,
            })}
          </p>
          <p className="text-sm text-ptba-charcoal leading-relaxed font-semibold">
            {t("officialSourceDisclaimer", { projectName: project.name })}
          </p>
          <div className="rounded-lg bg-ptba-section-bg p-4">
            <p className="text-xs font-semibold text-ptba-navy mb-2">{t("requiredDocs")}</p>
            <ol className="text-xs text-ptba-gray space-y-1.5 list-decimal list-inside">
              {activeSections.map((sec) => {
                return (
                  <li key={sec.docId}>
                    <strong>{getSectionTitle(sec.sectionKey)}</strong> — {getSectionDesc(sec.sectionKey)}
                  </li>
                );
              })}
              <li>{t("checkFinalAgreement")}</li>
            </ol>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 rounded-lg border border-ptba-steel-blue/20 bg-ptba-steel-blue/5 p-3">
              <p className="text-xs font-semibold text-ptba-steel-blue">{t("docFormat")}</p>
              <p className="text-[11px] text-ptba-gray mt-0.5">{t.rich("docFormatDesc", { strong: (chunks) => <strong>{chunks}</strong> })}</p>
            </div>
            <div className="flex-1 rounded-lg border border-ptba-gold/20 bg-ptba-gold/5 p-3">
              <p className="text-xs font-semibold text-ptba-gold">{t("deadline")}</p>
              <p className="text-[11px] text-ptba-gray mt-0.5">
                {project.phase1Deadline
                  ? <>{t.rich("deadlineDesc", { date: new Date(project.phase1Deadline).toLocaleDateString(dateLocale, { day: "numeric", month: "long", year: "numeric" }), strong: (chunks) => <strong>{chunks}</strong> })}</>
                  : <>{t("deadlineDescDefault")}</>
                }
              </p>
            </div>
            <div className="flex-1 rounded-lg border border-green-200 bg-green-50 p-3">
              <p className="text-xs font-semibold text-green-700">{t("evaluationResult")}</p>
              <p className="text-[11px] text-ptba-gray mt-0.5">{t.rich("evaluationResultDesc", { strong: (chunks) => <strong>{chunks}</strong> })}</p>
            </div>
          </div>
        </div>
      </div>}

      {/* Progress */}
      {!readOnly && (
        <div className="rounded-xl bg-ptba-navy/5 border border-ptba-navy/10 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-ptba-gray">{t("formCompleteness")}</span>
            <span className="text-sm font-bold text-ptba-navy">{t("sectionsCount", { completed: completedCount, total: totalSections })}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-ptba-light-gray">
            <div className={cn("h-full rounded-full transition-all", allComplete ? "bg-green-500" : "bg-ptba-gold")} style={{ width: `${(completedCount / totalSections) * 100}%` }} />
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {/* ═══ Dynamic Sections Based on phase1Documents ═══ */}

      {/* ─── Section: Informasi & Profil Perusahaan (compro) ─── */}
      {hasDoc("compro") && (
        <Section
          id="section-compro"
          number={getSectionNumber("compro")}
          title={sectionTitle("compro", "companyInfo")}
          icon={Building2}
          complete={sectionComplete.compro}
          isRequired={!optionalSectionIds.has("compro")}
          open={readOnly || openSection === getSectionNumber("compro")}
          onToggle={() => setOpenSection(openSection === getSectionNumber("compro") ? 0 : getSectionNumber("compro"))}
          readOnly={readOnly}
        >
          <p className="text-xs text-ptba-gray">{t("sections.companyInfoDesc")}</p>

          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-ptba-charcoal">{t("companyFields.companyName")} <span className="text-ptba-red">*</span></label>
              <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} className={cn(inputClass, errBorder(companyName))} />
              <ErrText show={errMsg(companyName) as boolean} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-ptba-charcoal">{t("companyFields.companyCode")}</label>
              <input type="text" value={companyCode} readOnly className={cn(inputClass, "bg-ptba-light-gray/30")} />
            </div>
          </div>

          {/* Business Overview & Product/Service Description */}
          <div>
            <label className="mb-1 block text-xs font-medium text-ptba-charcoal">{t("companyFields.businessOverview")} <span className="text-ptba-red">*</span></label>
            <div className="rounded-lg bg-ptba-section-bg border border-ptba-steel-blue/10 px-3 py-2 mb-2">
              <p className="text-[11px] text-ptba-gray leading-relaxed">
                <span className="font-bold text-ptba-charcoal">{locale === "en" ? "Important:" : "Penting:"}</span>{" "}
                {locale === "en"
                  ? <>Must include: <span className="font-semibold underline">main line of business</span>, <span className="font-semibold underline">product and service description</span>, <span className="font-semibold underline">business process overview</span>, and <span className="font-semibold underline">key competitive advantages</span>.</>
                  : <>Wajib mencakup: <span className="font-semibold underline">bidang usaha utama</span>, <span className="font-semibold underline">deskripsi produk dan jasa</span>, <span className="font-semibold underline">gambaran proses bisnis</span>, dan <span className="font-semibold underline">keunggulan kompetitif utama</span>.</>}
              </p>
            </div>
            <textarea value={businessOverview} onChange={(e) => setBusinessOverview(e.target.value)} placeholder={locale === "en" ? "Company business overview, products & services..." : "Overview bisnis perusahaan, produk & jasa..."} className={cn(inputClass, "min-h-[80px] resize-y", errBorder(businessOverview))} />
            <ErrText show={errMsg(businessOverview) as boolean} />
          </div>

          {/* Vision & Mission */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-ptba-charcoal">{locale === "en" ? "Vision" : "Visi"} <span className="text-ptba-red">*</span></label>
              <p className="mb-1 text-[10px] text-ptba-gray italic">{locale === "en" ? "Company vision statement" : "Pernyataan visi perusahaan"}</p>
              <textarea value={companyVision} onChange={(e) => setCompanyVision(e.target.value)} placeholder={locale === "en" ? "Company vision..." : "Visi perusahaan..."} className={cn(inputClass, "min-h-[60px] resize-y", errBorder(companyVision))} />
              <ErrText show={errMsg(companyVision) as boolean} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-ptba-charcoal">{locale === "en" ? "Mission" : "Misi"} <span className="text-ptba-red">*</span></label>
              <p className="mb-1 text-[10px] text-ptba-gray italic">{locale === "en" ? "Company mission statement" : "Pernyataan misi perusahaan"}</p>
              <textarea value={companyMission} onChange={(e) => setCompanyMission(e.target.value)} placeholder={locale === "en" ? "Company mission..." : "Misi perusahaan..."} className={cn(inputClass, "min-h-[60px] resize-y", errBorder(companyMission))} />
              <ErrText show={errMsg(companyMission) as boolean} />
            </div>
          </div>

          {/* Company History */}
          <div>
            <label className="mb-1 block text-xs font-medium text-ptba-charcoal">{locale === "en" ? "Company History & Milestones" : "Sejarah & Milestone Perusahaan"} <span className="text-ptba-red">*</span></label>
            <div className="rounded-lg bg-ptba-section-bg border border-ptba-steel-blue/10 px-3 py-2 mb-2">
              <p className="text-[11px] text-ptba-gray leading-relaxed">
                <span className="font-bold text-ptba-charcoal">{locale === "en" ? "Important:" : "Penting:"}</span>{" "}
                {locale === "en"
                  ? <>Upload document containing: <span className="font-semibold underline">company history & timeline</span>, <span className="font-semibold underline">founding date</span>, <span className="font-semibold underline">major achievements</span>, <span className="font-semibold underline">expansions</span>, and <span className="font-semibold underline">significant corporate events</span>. Accepted: PDF, JPG, PNG.</>
                  : <>Unggah dokumen berisi: <span className="font-semibold underline">sejarah & timeline perusahaan</span>, <span className="font-semibold underline">tanggal pendirian</span>, <span className="font-semibold underline">pencapaian besar</span>, <span className="font-semibold underline">ekspansi</span>, dan <span className="font-semibold underline">peristiwa korporat penting</span>. Format: PDF, JPG, PNG.</>}
              </p>
            </div>
            <FileUploadButton
              label={locale === "en" ? "Company History & Milestones Document" : "Dokumen Sejarah & Milestone Perusahaan"}
              accept=".pdf,.jpg,.jpeg,.png"
              uploaded={isDoc("company_history")}
              uploading={uploadedDocs["company_history"]?.uploading ?? false}
              fileName={uploadedDocs["company_history"]?.name}
              onSelect={(f) => uploadDoc("company_history", "Company History & Milestones", f)}
              onDelete={() => deleteDoc("company_history")}
              readOnly={readOnly}
              onDownload={docDownloadHandler("company_history")}
              error={showErrors && !isDoc("company_history")}
            />
          </div>

          {/* Shareholder Composition */}
          <div>
            <label className="mb-1 block text-xs font-medium text-ptba-charcoal">{locale === "en" ? "Shareholder Composition" : "Komposisi Pemegang Saham"} <span className="text-ptba-red">*</span></label>
            <p className="mb-1 text-[10px] text-ptba-gray italic">{locale === "en" ? "Percentage and holdings structure" : "Persentase dan struktur kepemilikan"}</p>
            <textarea value={shareholderComposition} onChange={(e) => setShareholderComposition(e.target.value)} placeholder={locale === "en" ? "e.g. PT ABC 51%, PT XYZ 30%, Public 19%" : "Contoh: PT ABC 51%, PT XYZ 30%, Publik 19%"} className={cn(inputClass, "min-h-[60px] resize-y", errBorder(shareholderComposition))} />
            <ErrText show={errMsg(shareholderComposition) as boolean} />
          </div>

          {/* Addresses */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-ptba-charcoal">{t("companyFields.hqAddress")} <span className="text-ptba-red">*</span></label>
              <textarea value={companyAddress} onChange={(e) => setCompanyAddress(e.target.value)} className={cn(inputClass, "min-h-[60px] resize-y", errBorder(companyAddress))} />
              <ErrText show={errMsg(companyAddress) as boolean} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-ptba-charcoal">{t("companyFields.indonesiaOffice")}</label>
              <textarea value={companyIndonesiaAddress} onChange={(e) => setCompanyIndonesiaAddress(e.target.value)} placeholder={t("companyFields.indonesiaOfficePlaceholder")} className={cn(inputClass, "min-h-[60px] resize-y")} />
            </div>
          </div>

          {/* Contact & Legal */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-ptba-charcoal">{t("companyFields.companyPhone")} <span className="text-ptba-red">*</span></label>
              <input type="text" value={companyPhone} onChange={(e) => setCompanyPhone(e.target.value)} className={cn(inputClass, errBorder(companyPhone))} />
              <ErrText show={errMsg(companyPhone) as boolean} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-ptba-charcoal">{t("companyFields.companyEmail")} <span className="text-ptba-red">*</span></label>
              <input type="email" value={companyEmail} onChange={(e) => setCompanyEmail(e.target.value)} className={cn(inputClass, errBorder(companyEmail))} />
              <ErrText show={errMsg(companyEmail) as boolean} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-ptba-charcoal">{t("companyFields.website")} <span className="text-ptba-red">*</span></label>
              <input type="text" value={companyWebsite} onChange={(e) => setCompanyWebsite(e.target.value)} className={cn(inputClass, errBorder(companyWebsite))} />
              <ErrText show={errMsg(companyWebsite) as boolean} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-ptba-charcoal">{t("companyFields.nib")} <span className="text-ptba-red">*</span></label>
              <p className="mb-1 text-[10px] text-ptba-gray italic">Upload NIB document (PDF)</p>
              <FileUploadButton
                label="NIB Document"
                accept=".pdf"
                uploaded={isDoc("nib_document")}
                uploading={uploadedDocs["nib_document"]?.uploading ?? false}
                fileName={uploadedDocs["nib_document"]?.name}
                onSelect={(f) => uploadDoc("nib_document", "NIB Document", f)}
                onDelete={() => deleteDoc("nib_document")}
                readOnly={readOnly}
                onDownload={docDownloadHandler("nib_document")}
                error={showErrors && !isDoc("nib_document")}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-ptba-charcoal">{t("companyFields.yearEstablished")} <span className="text-ptba-red">*</span></label>
              <input type="text" value={yearEstablished} onChange={(e) => setYearEstablished(e.target.value)} className={cn(inputClass, errBorder(yearEstablished))} />
              <ErrText show={errMsg(yearEstablished) as boolean} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-ptba-charcoal">{t("companyFields.country")} <span className="text-ptba-red">*</span></label>
              <input type="text" value={countryEstablished} onChange={(e) => setCountryEstablished(e.target.value)} className={cn(inputClass, errBorder(countryEstablished))} />
              <ErrText show={errMsg(countryEstablished) as boolean} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-ptba-charcoal">{locale === "en" ? "Company Status" : "Status Perusahaan"} <span className="text-ptba-red">*</span></label>
              <select value={companyStatus} onChange={(e) => setCompanyStatus(e.target.value)} className={cn(inputClass, errBorder(companyStatus))}>
                <option value="">{locale === "en" ? "Select..." : "Pilih..."}</option>
                <option value="BUMN">{locale === "en" ? "State-Owned Enterprise (BUMN)" : "BUMN (Badan Usaha Milik Negara)"}</option>
                <option value="Private">{locale === "en" ? "Private Company" : "Perusahaan Swasta"}</option>
                <option value="Public">{locale === "en" ? "Public Company (Tbk)" : "Perusahaan Publik (Tbk)"}</option>
              </select>
              <ErrText show={errMsg(companyStatus) as boolean} />
            </div>
          </div>

          {/* Org Structure & Subsidiaries */}
          <div>
            <label className="mb-1 block text-xs font-medium text-ptba-charcoal">{t("companyFields.orgStructure")} <span className="text-ptba-red">*</span></label>
            <div className="rounded-lg bg-ptba-section-bg border border-ptba-steel-blue/10 px-3 py-2 mb-2">
              <p className="text-[11px] text-ptba-gray leading-relaxed">
                <span className="font-bold text-ptba-charcoal">{locale === "en" ? "Important:" : "Penting:"}</span>{" "}
                {locale === "en"
                  ? <>Upload chart including <span className="font-semibold underline">names and positions of top management</span> (CEO, COO, CFO, Directors, etc.). Accepted: PDF, JPG, PNG.</>
                  : <>Unggah bagan berisi <span className="font-semibold underline">nama dan jabatan manajemen puncak</span> (Direktur Utama, COO, CFO, Direksi, dll.). Format: PDF, JPG, PNG.</>}
              </p>
            </div>
            <FileUploadButton
              label="Company Organizational Structure"
              accept=".pdf,.png,.jpg,.jpeg"
              uploaded={isDoc("org_structure")}
              uploading={uploadedDocs["org_structure"]?.uploading ?? false}
              fileName={uploadedDocs["org_structure"]?.name}
              onSelect={(f) => uploadDoc("org_structure", "Organizational Structure", f)}
              onDelete={() => deleteDoc("org_structure")}
              readOnly={readOnly}
              onDownload={docDownloadHandler("org_structure")}
              error={showErrors && !isDoc("org_structure")}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-ptba-charcoal">{t("companyFields.subsidiaries")}</label>
            <textarea value={subsidiaries} onChange={(e) => setSubsidiaries(e.target.value)} placeholder={t("companyFields.subsidiariesPlaceholder")} className={cn(inputClass, "min-h-[60px] resize-y")} />
          </div>

          {/* Contact Person */}
          <div className="border-t border-ptba-light-gray pt-3">
            <p className="text-xs font-semibold text-ptba-charcoal mb-2">{t("companyFields.contactPerson")}</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-ptba-charcoal">{t("companyFields.cpName")} <span className="text-ptba-red">*</span></label>
                <input type="text" value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} className={cn(inputClass, errBorder(contactPerson))} />
                <ErrText show={errMsg(contactPerson) as boolean} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-ptba-charcoal">{t("companyFields.cpPhone")} <span className="text-ptba-red">*</span></label>
                <input type="text" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} className={cn(inputClass, errBorder(contactPhone))} />
                <ErrText show={errMsg(contactPhone) as boolean} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-ptba-charcoal">{t("companyFields.cpEmail")} <span className="text-ptba-red">*</span></label>
                <input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} className={cn(inputClass, errBorder(contactEmail))} />
                <ErrText show={errMsg(contactEmail) as boolean} />
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <p className="text-xs font-semibold text-ptba-charcoal">{t("companyFields.comproDoc")} <span className="text-ptba-red">*</span></p>
            <FileUploadButton
              label={t("companyFields.comproLabel")}
              accept=".pdf"
              uploaded={isDoc("compro")}
              uploading={uploadedDocs["compro"]?.uploading ?? false}
              fileName={uploadedDocs["compro"]?.name}
              onSelect={(f) => uploadDoc("compro", "Company Profile", f)}
              templateFileName={getTemplateInfo("compro")?.fileName}
              onDownloadTemplate={() => downloadTemplate("compro")}
              onDelete={() => deleteDoc("compro")}
              readOnly={readOnly}
              onDownload={docDownloadHandler("compro")}
              error={showErrors && !isDoc("compro")}
            />
          </div>
        </Section>
      )}

      {/* ─── Section: Surat Pernyataan EoI (statement_eoi) ─── */}
      {hasDoc("statement_eoi") && (
        <Section
          id="section-statement_eoi"
          number={getSectionNumber("statement_eoi")}
          title={sectionTitle("statement_eoi", "eoiStatement")}
          icon={PenLine}
          complete={sectionComplete.statement_eoi}
          isRequired={!optionalSectionIds.has("statement_eoi")}
          open={readOnly || openSection === getSectionNumber("statement_eoi")}
          onToggle={() => setOpenSection(openSection === getSectionNumber("statement_eoi") ? 0 : getSectionNumber("statement_eoi"))}
          readOnly={readOnly}
        >
          <p className="text-xs text-ptba-gray">{t("sections.eoiStatementDesc")}</p>

          <div className="rounded-lg border border-ptba-light-gray p-4 space-y-3">
            <p className="text-xs font-semibold text-ptba-navy">{t("eoiFields.signerData")}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-ptba-charcoal">{t("eoiFields.signerName")} <span className="text-ptba-red">*</span></label>
                <input
                  type="text"
                  placeholder={t("eoiFields.signerNamePlaceholder")}
                  value={signerName}
                  onChange={(e) => setSignerName(e.target.value)}
                  className={cn(inputClass, errBorder(signerName))}
                />
                <ErrText show={errMsg(signerName) as boolean} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-ptba-charcoal">{t("eoiFields.signerPosition")} <span className="text-ptba-red">*</span></label>
                <input
                  type="text"
                  placeholder={t("eoiFields.signerPositionPlaceholder")}
                  value={signerPosition}
                  onChange={(e) => setSignerPosition(e.target.value)}
                  className={cn(inputClass, errBorder(signerPosition))}
                />
                <ErrText show={errMsg(signerPosition) as boolean} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-ptba-charcoal">{t("eoiFields.signerDate")} <span className="text-ptba-red">*</span></label>
                <input
                  type="date"
                  onClick={(e) => (e.target as HTMLInputElement).showPicker?.()}
                  value={signerDate}
                  onChange={(e) => setSignerDate(e.target.value)}
                  className={cn(inputClass, errBorder(signerDate))}
                />
                <ErrText show={errMsg(signerDate) as boolean} />
              </div>
            </div>
          </div>

          {/* EoI Document Upload */}
          <div className="space-y-2 pt-2">
            <p className="text-xs font-semibold text-ptba-charcoal">{t("eoiFields.eoiDoc")} <span className="text-ptba-red">*</span></p>
            <FileUploadButton
              label={t("eoiFields.eoiDocLabel")}
              accept=".pdf"
              uploaded={isDoc("statement_eoi")}
              uploading={uploadedDocs["statement_eoi"]?.uploading ?? false}
              fileName={uploadedDocs["statement_eoi"]?.name}
              onSelect={(f) => uploadDoc("statement_eoi", "Signed EoI Letter", f)}
              templateFileName={getTemplateInfo("statement_eoi")?.fileName}
              onDownloadTemplate={() => downloadTemplate("statement_eoi")}
              onDelete={() => deleteDoc("statement_eoi")}
              readOnly={readOnly}
              onDownload={docDownloadHandler("statement_eoi")}
              error={showErrors && !isDoc("statement_eoi")}
            />
          </div>

          {/* JV Equity & Cash on Hand — side by side */}
          {(() => {
            // Auto-calculate equity breakdown from project Capex + DER
            const capexMillion = parseFloat(String(project.indicativeCapex || project.indicative_capex || "0"));
            const derStr = String(project.der || "");
            const derParts = derStr.split(":");
            const equityRatio = derParts.length === 2 ? parseFloat(derParts[1]) / 100 : 0;
            const jvPercent = parseFloat(minorityEquityPercent || "0");
            const hasProjectData = capexMillion > 0 && equityRatio > 0;
            const totalEquity = capexMillion * equityRatio;
            const mitraContribution = totalEquity * (jvPercent / 100);
            const minCashOnHand = mitraContribution * 1.5;
            const fmtUsd = (v: number) => v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            const cashNum = parseFloat(String(cashOnHand).replace(/,/g, "") || "0");

            return (
              <>
                {/* Shareholder Type + Equity Percentage */}
                <div className="border-t border-ptba-light-gray pt-4">
                  <p className="text-xs font-semibold text-ptba-navy mb-1">{locale === "en" ? "Joint Venture Equity Proposal" : "Pengajuan Ekuitas Joint Venture"}</p>
                  <p className="text-[10px] text-ptba-gray mb-3">{locale === "en" ? "Define your proposed equity stake and negotiation terms for the joint venture partnership." : "Tentukan ekuitas yang diajukan dan ketentuan negosiasi untuk kemitraan joint venture."}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* A. Shareholder Type */}
                  <div className="rounded-lg border border-ptba-light-gray p-4">
                    <label className="mb-1 block text-xs font-semibold text-ptba-charcoal">{t("eoiFields.shareholderType")} <span className="text-ptba-red">*</span></label>
                    <select
                      value={shareholderType}
                      onChange={(e) => { setShareholderType(e.target.value as any); setMinorityEquityPercent(""); setEquityNegotiable(""); setEquityMinPercent(""); setCanBecomeMinority(""); }}
                      className={cn(inputClass, errBorder(shareholderType))}
                      disabled={readOnly}
                    >
                      <option value="">{locale === "en" ? "Select..." : "Pilih..."}</option>
                      <option value="majority">{t("eoiFields.majority")}</option>
                      <option value="minority">{t("eoiFields.minority")}</option>
                    </select>
                    <ErrText show={errMsg(shareholderType) as boolean} />
                  </div>

                  {/* B. Equity Percentage */}
                  <div className="rounded-lg border border-ptba-light-gray p-4">
                    <label className="mb-1 block text-xs font-semibold text-ptba-charcoal">{t("eoiFields.equityPercent")} <span className="text-ptba-red">*</span></label>
                    <p className="mb-2 text-[10px] text-ptba-gray italic">{t("eoiFields.equityPercentHint")}</p>
                    <div className="relative">
                      <input
                        type="text"
                        inputMode="decimal"
                        value={minorityEquityPercent}
                        onChange={(e) => setMinorityEquityPercent(e.target.value.replace(/[^0-9.,]/g, ""))}
                        placeholder={shareholderType === "majority" ? "51" : shareholderType === "minority" ? "49" : "49"}
                        className={cn(inputClass, "pr-10", errBorder(minorityEquityPercent),
                          shareholderType === "majority" && minorityEquityPercent && (() => { const v = parseFloat(minorityEquityPercent.replace(",", ".")); return v <= 50 || v > 51; })() && "!border-ptba-red/60 !ring-2 !ring-ptba-red/10",
                          shareholderType === "minority" && minorityEquityPercent && (parseFloat(minorityEquityPercent.replace(",", ".")) >= 50) && "!border-ptba-red/60 !ring-2 !ring-ptba-red/10",
                        )}
                        disabled={readOnly}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-ptba-gray">%</span>
                    </div>
                    {shareholderType === "majority" && minorityEquityPercent && (() => { const v = parseFloat(minorityEquityPercent.replace(",", ".")); return v <= 50 || v > 51; })() && (
                      <p className="text-[10px] text-ptba-red mt-1">{locale === "en" ? "Majority equity must be >50% and ≤51%" : "Ekuitas mayoritas harus >50% dan ≤51%"}</p>
                    )}
                    {shareholderType === "minority" && minorityEquityPercent && (parseFloat(minorityEquityPercent.replace(",", ".")) >= 50) && (
                      <p className="text-[10px] text-ptba-red mt-1">{t("eoiFields.errMinority")}</p>
                    )}
                  </div>
                </div>

                {/* C. Negotiable + D. Conditional fields */}
                {shareholderType && (
                  <div className="rounded-lg border border-ptba-light-gray p-4 space-y-4">
                    <div>
                      <label className="mb-2 block text-xs font-semibold text-ptba-charcoal">{t("eoiFields.negotiable")} <span className="text-ptba-red">*</span></label>
                      <div className="flex gap-3">
                        {(["yes", "no"] as const).map((val) => (
                          <label key={val} className={cn("flex items-center gap-2 rounded-lg border px-4 py-2.5 cursor-pointer transition-colors text-xs font-medium", equityNegotiable === val ? "border-ptba-steel-blue bg-ptba-steel-blue/5 text-ptba-steel-blue" : "border-ptba-light-gray text-ptba-gray hover:border-ptba-steel-blue/50")}>
                            <input type="radio" name="equityNegotiable" value={val} checked={equityNegotiable === val} onChange={() => { setEquityNegotiable(val); if (val === "no") { setEquityMinPercent(""); setCanBecomeMinority(""); } }} className="sr-only" disabled={readOnly} />
                            {val === "yes" ? t("eoiFields.negotiableYes") : t("eoiFields.negotiableNo")}
                          </label>
                        ))}
                      </div>
                      {showErrors && !equityNegotiable && <ErrText show />}
                    </div>

                    {equityNegotiable === "yes" && (
                      <>
                        {/* Can become minority — only for majority */}
                        {shareholderType === "majority" && (
                          <div>
                            <label className="mb-2 block text-xs font-semibold text-ptba-charcoal">{t("eoiFields.canBecomeMinority")} <span className="text-ptba-red">*</span></label>
                            <div className="flex gap-3">
                              {(["yes", "no"] as const).map((val) => (
                                <label key={val} className={cn("flex items-center gap-2 rounded-lg border px-4 py-2.5 cursor-pointer transition-colors text-xs font-medium", canBecomeMinority === val ? "border-ptba-steel-blue bg-ptba-steel-blue/5 text-ptba-steel-blue" : "border-ptba-light-gray text-ptba-gray hover:border-ptba-steel-blue/50")}>
                                  <input type="radio" name="canBecomeMinority" value={val} checked={canBecomeMinority === val} onChange={() => setCanBecomeMinority(val)} className="sr-only" disabled={readOnly} />
                                  {val === "yes" ? (locale === "en" ? "Yes" : "Ya") : (locale === "en" ? "No" : "Tidak")}
                                </label>
                              ))}
                            </div>
                            {canBecomeMinority === "yes" && (
                              <p className="mt-2 text-[10px] text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                                {locale === "en" ? "Note: If the minimum equity falls below 50%, your shareholder status may become minority." : "Catatan: Jika ekuitas minimum di bawah 50%, status pemegang saham Anda dapat menjadi minoritas."}
                              </p>
                            )}
                            {showErrors && !canBecomeMinority && <ErrText show />}
                          </div>
                        )}

                        {/* Min equity percent */}
                        <div>
                          <label className="mb-1 block text-xs font-semibold text-ptba-charcoal">{t("eoiFields.minEquityPercent")} <span className="text-ptba-red">*</span></label>
                          <p className="mb-2 text-[10px] text-ptba-gray italic">{t("eoiFields.minEquityHint")}</p>
                          <div className="relative">
                            <input
                              type="text"
                              inputMode="decimal"
                              value={equityMinPercent}
                              onChange={(e) => setEquityMinPercent(e.target.value.replace(/[^0-9.,]/g, ""))}
                              placeholder={shareholderType === "majority" && canBecomeMinority !== "yes" ? "51" : "45"}
                              className={cn(inputClass, "pr-10", errBorder(equityMinPercent), (() => {
                                const minVal = parseFloat(equityMinPercent.replace(",", "."));
                                const propVal = parseFloat(minorityEquityPercent.replace(",", "."));
                                if (!equityMinPercent || isNaN(minVal)) return "";
                                if (shareholderType === "majority" && canBecomeMinority !== "yes" && minVal <= 50) return "!border-ptba-red/60 !ring-2 !ring-ptba-red/10";
                                if (shareholderType === "majority" && canBecomeMinority === "yes" && minVal < 45) return "!border-ptba-red/60 !ring-2 !ring-ptba-red/10";
                                if (shareholderType === "minority" && (minVal >= 50)) return "!border-ptba-red/60 !ring-2 !ring-ptba-red/10";
                                if (!isNaN(propVal) && minVal >= propVal) return "!border-ptba-red/60 !ring-2 !ring-ptba-red/10";
                                return "";
                              })())}
                              disabled={readOnly}
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-ptba-gray">%</span>
                          </div>
                          {(() => {
                            const minVal = parseFloat(equityMinPercent.replace(",", "."));
                            const propVal = parseFloat(minorityEquityPercent.replace(",", "."));
                            if (!equityMinPercent || isNaN(minVal)) return null;
                            if (!isNaN(propVal) && minVal >= propVal) return <p className="text-[10px] text-ptba-red mt-1">{locale === "en" ? "Minimum equity must be lower than the proposed equity percentage" : "Ekuitas minimum harus lebih rendah dari persentase ekuitas yang diajukan"}</p>;
                            if (shareholderType === "majority" && canBecomeMinority !== "yes" && minVal <= 50) return <p className="text-[10px] text-ptba-red mt-1">{t("eoiFields.errMinMajority")}</p>;
                            if (shareholderType === "majority" && canBecomeMinority === "yes" && minVal < 45) return <p className="text-[10px] text-ptba-red mt-1">{t("eoiFields.errMinMajorityFlex")}</p>;
                            if (shareholderType === "minority" && (minVal >= 50)) return <p className="text-[10px] text-ptba-red mt-1">{t("eoiFields.errMinMinority")}</p>;
                            return null;
                          })()}
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Cash on Hand */}
                <div className="rounded-lg border border-ptba-light-gray p-4">
                  <label className="mb-1 block text-xs font-semibold text-ptba-charcoal">{t("eoiFields.cashOnHand")} <span className="text-ptba-red">*</span></label>
                  <p className="mb-2 text-[10px] text-ptba-gray italic">{t("eoiFields.cashOnHandHint")}</p>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium text-ptba-gray">USD</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={cashOnHand}
                      onChange={(e) => setCashOnHand(e.target.value.replace(/[^0-9.,]/g, ""))}
                      placeholder={hasProjectData && jvPercent > 0 ? fmtUsd(minCashOnHand) : "350"}
                      className={cn(inputClass, "pl-12 pr-12", errBorder(cashOnHand), hasProjectData && jvPercent > 0 && cashNum > 0 && cashNum < minCashOnHand && "!border-ptba-red/60 !ring-2 !ring-ptba-red/10")}
                      disabled={readOnly}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-ptba-gray">Million</span>
                  </div>
                  {hasProjectData && jvPercent > 0 && cashNum > 0 && cashNum < minCashOnHand && (
                    <p className="text-[10px] text-ptba-red mt-1">
                      {locale === "en"
                        ? `Minimum cash on hand is USD ${fmtUsd(minCashOnHand)} Million (1.5x equity contribution)`
                        : `Minimum cash on hand adalah USD ${fmtUsd(minCashOnHand)} Million (1.5x kontribusi ekuitas)`}
                    </p>
                  )}
                  <div className="mt-3">
                    <p className="text-xs font-semibold text-ptba-charcoal mb-1">{locale === "en" ? "Cash on Hand Evidence" : "Bukti Cash on Hand"} <span className="text-ptba-red">*</span></p>
                    <p className="text-[10px] text-ptba-gray italic mb-2">{locale === "en" ? "Upload proof of cash on hand (bank statement, financial report, etc.)" : "Unggah bukti cash on hand (rekening koran, laporan keuangan, dll.)"}</p>
                    <FileUploadButton
                      label={locale === "en" ? "Cash on Hand Evidence (PDF)" : "Bukti Cash on Hand (PDF)"}
                      accept=".pdf"
                      uploaded={isDoc("cash_on_hand_evidence")}
                      uploading={uploadedDocs["cash_on_hand_evidence"]?.uploading ?? false}
                      fileName={uploadedDocs["cash_on_hand_evidence"]?.name}
                      onSelect={(f) => uploadDoc("cash_on_hand_evidence", "Cash on Hand Evidence", f)}
                      onDelete={() => deleteDoc("cash_on_hand_evidence")}
                      readOnly={readOnly}
                      onDownload={docDownloadHandler("cash_on_hand_evidence")}
                      error={showErrors && !isDoc("cash_on_hand_evidence")}
                    />
                  </div>
                </div>

                {/* Equity Breakdown Card */}
                {hasProjectData && jvPercent > 0 && (
                  <div className="rounded-lg border border-ptba-steel-blue/30 bg-ptba-steel-blue/5 p-4 space-y-3">
                    <p className="text-xs font-semibold text-ptba-navy">
                      {locale === "en" ? "Equity Contribution Breakdown" : "Rincian Kontribusi Ekuitas"}
                    </p>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="rounded-lg bg-white p-3 text-center border border-ptba-light-gray">
                        <p className="text-[10px] text-ptba-gray mb-1">{locale === "en" ? "Total Project Equity" : "Total Ekuitas Proyek"}</p>
                        <p className="text-sm font-bold text-ptba-navy">USD {fmtUsd(totalEquity)} Million</p>
                        <p className="text-[9px] text-ptba-gray mt-0.5">Capex {fmtUsd(capexMillion)} × {(equityRatio * 100).toFixed(0)}%</p>
                      </div>
                      <div className="rounded-lg bg-white p-3 text-center border border-ptba-light-gray">
                        <p className="text-[10px] text-ptba-gray mb-1">{locale === "en" ? "Your Equity Contribution" : "Kontribusi Ekuitas Anda"}</p>
                        <p className="text-sm font-bold text-ptba-steel-blue">USD {fmtUsd(mitraContribution)} Million</p>
                        <p className="text-[9px] text-ptba-gray mt-0.5">{fmtUsd(totalEquity)} × {jvPercent}%</p>
                      </div>
                      <div className="rounded-lg bg-white p-3 text-center border border-ptba-gold/30">
                        <p className="text-[10px] text-ptba-gray mb-1">{locale === "en" ? "Min. Cash on Hand (1.5x)" : "Min. Cash on Hand (1.5x)"}</p>
                        <p className="text-sm font-bold text-ptba-gold">USD {fmtUsd(minCashOnHand)} Million</p>
                        <p className="text-[9px] text-ptba-gray mt-0.5">{fmtUsd(mitraContribution)} × 1.5</p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            );
          })()}

          <div className="rounded-lg bg-ptba-section-bg p-4 text-sm text-ptba-charcoal leading-relaxed">
            {t.rich("eoiFields.eoiDeclaration", { projectName: project.name, equityPercent: minorityEquityPercent || "-", strong: (chunks) => <strong>{chunks}</strong> })}
          </div>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={eoiAgreed}
              onChange={(e) => setEoiAgreed(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-ptba-light-gray text-ptba-navy focus:ring-ptba-steel-blue"
            />
            <span className="text-sm text-ptba-gray">
              {t.rich("eoiFields.agreeStatement", { strong: (chunks) => <strong>{chunks}</strong> })}
            </span>
          </label>

        </Section>
      )}

      {/* ─── Section: Pengalaman & Portfolio Proyek (portfolio) ─── */}
      {hasDoc("portfolio") && (
        <Section
          id="section-portfolio"
          number={getSectionNumber("portfolio")}
          title={sectionTitle("portfolio", "portfolio")}
          icon={Briefcase}
          complete={sectionComplete.portfolio}
          isRequired={!optionalSectionIds.has("portfolio")}
          open={readOnly || openSection === getSectionNumber("portfolio")}
          onToggle={() => setOpenSection(openSection === getSectionNumber("portfolio") ? 0 : getSectionNumber("portfolio"))}
          readOnly={readOnly}
        >
          <div className="space-y-1">
            <p className="text-sm font-semibold text-ptba-charcoal">{t("portfolioFields.relevantProjects")}</p>
          </div>

          <div className="rounded-lg border border-ptba-steel-blue/30 bg-ptba-steel-blue/5 p-3 space-y-1.5">
            <p className="text-xs text-ptba-charcoal font-medium">{t("portfolioFields.notes")}</p>
            <ul className="text-xs text-ptba-gray space-y-1 list-disc pl-4">
              <li>{t("portfolioFields.note1")}</li>
              <li>{t("portfolioFields.note2")}</li>
              <li>{t("portfolioFields.note3")}</li>
            </ul>
          </div>

          {experiences.map((exp, i) => (
            <div key={exp.uid} className="rounded-lg border border-ptba-light-gray p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-ptba-charcoal">{t("portfolioFields.experienceNumber", { number: i + 1 })}</p>
                {!readOnly && (
                  <button onClick={() => removeExperience(i)} className="text-ptba-red hover:text-red-700 transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Experience Type selector */}
                <div>
                  <label className="mb-1 block text-xs font-medium text-ptba-charcoal">{locale === "en" ? "Experience Type" : "Tipe Pengalaman"} <span className="text-ptba-red">*</span></label>
                  <select value={(exp as any).experienceType || 'powerplant'} onChange={(e) => changeExperienceType(i, e.target.value as ExperienceType)} className={inputClass}>
                    <option value="powerplant">{locale === "en" ? "Power Plant (Preferable)" : "Pembangkit Listrik (Preferable)"}</option>
                    <option value="general">{locale === "en" ? "General Project" : "Proyek Umum"}</option>
                  </select>
                </div>

                {/* Category selector (only for power plant) */}
                {((exp as any).experienceType || 'powerplant') === 'powerplant' && (
                  <div>
                    <label className="mb-1 block text-xs font-medium text-ptba-charcoal">{t("portfolioFields.experienceCategory")} <span className="text-ptba-red">*</span></label>
                    <select value={exp.category} onChange={(e) => changeExperienceCategory(i, e.target.value as ExperienceCategory)} className={inputClass}>
                      {POWERPLANT_CATEGORIES.map((cat) => (
                        <option key={cat.key} value={cat.key}>
                          {locale === "en" ? cat.labelEn : cat.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Common fields */}
                <div>
                  <label className="mb-1 block text-xs font-medium text-ptba-charcoal">
                    {((exp as any).experienceType || 'powerplant') === 'powerplant'
                      ? (locale === "en" ? "Power Plant Name" : "Nama Pembangkit Listrik")
                      : (locale === "en" ? "Project Name" : "Nama Proyek")
                    } <span className="text-ptba-red">*</span>
                  </label>
                  <input type="text" value={exp.plantName} onChange={(e) => updateExperience(i, "plantName", e.target.value)} className={cn(inputClass, errBorder(exp.plantName))} />
                  <ErrText show={errMsg(exp.plantName) as boolean} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-ptba-charcoal">{t("portfolioFields.location")} <span className="text-ptba-red">*</span></label>
                  <input type="text" value={exp.location} onChange={(e) => updateExperience(i, "location", e.target.value)} className={cn(inputClass, errBorder(exp.location))} />
                  <ErrText show={errMsg(exp.location) as boolean} />
                </div>
                {((exp as any).experienceType || 'powerplant') === 'powerplant' && (
                  <div>
                    <label className="mb-1 block text-xs font-medium text-ptba-charcoal">{t("portfolioFields.totalCapacity")} <span className="text-ptba-red">*</span></label>
                    <input type="text" placeholder={t("portfolioFields.capacityPlaceholder")} inputMode="decimal" value={fmtThousand(exp.totalCapacityMW)} onChange={(e) => updateExperience(i, "totalCapacityMW", e.target.value.replace(/[^0-9.,]/g, "").replace(/,/g, ""))} className={inputClass} />
                  </div>
                )}

                {/* Developer-specific fields */}
                {exp.category === 'developer' && (
                  <>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-ptba-charcoal">{t("portfolioFields.equity")} <span className="text-ptba-red">*</span></label>
                      <input type="text" placeholder={t("portfolioFields.equityPlaceholder")} inputMode="decimal" value={exp.equityPercent} onChange={(e) => { let v = e.target.value.replace(/,/g, ".").replace(/[^0-9.]/g, ""); const num = parseFloat(v); if (!isNaN(num) && num > 100) v = "100"; updateExperience(i, "equityPercent", v); }} className={inputClass} />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-ptba-charcoal">{t("portfolioFields.ippCaptive")} <span className="text-ptba-red">*</span></label>
                      <select value={exp.ippOrCaptive} onChange={(e) => updateExperience(i, "ippOrCaptive", e.target.value)} className={inputClass}>
                        <option value="">{t("portfolioFields.selectPlaceholder")}</option>
                        {IPP_CAPTIVE_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-ptba-charcoal">{t("portfolioFields.codYear")} <span className="text-ptba-red">*</span></label>
                      <input type="text" placeholder={t("portfolioFields.codYearPlaceholder")} inputMode="numeric" value={exp.codYear} onChange={(e) => updateExperience(i, "codYear", e.target.value.replace(/[^0-9]/g, ""))} className={inputClass} />
                    </div>
                  </>
                )}

                {/* O&M Contractor-specific fields */}
                {exp.category === 'om_contractor' && (
                  <>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-ptba-charcoal">{t("portfolioFields.contractValue")} <span className="text-ptba-red">*</span></label>
                      <input type="text" placeholder={t("portfolioFields.contractValuePlaceholder")} inputMode="decimal" value={fmtThousand(exp.contractValueUSD)} onChange={(e) => updateExperience(i, "contractValueUSD", e.target.value.replace(/[^0-9.,]/g, "").replace(/,/g, ""))} className={inputClass} />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-ptba-charcoal">{t("portfolioFields.workPortion")} <span className="text-ptba-red">*</span></label>
                      <input type="text" placeholder={t("portfolioFields.workPortionPlaceholder")} inputMode="decimal" value={exp.workPortionPercent} onChange={(e) => { let v = e.target.value.replace(/,/g, ".").replace(/[^0-9.]/g, ""); const num = parseFloat(v); if (!isNaN(num) && num > 100) v = "100"; updateExperience(i, "workPortionPercent", v); }} className={inputClass} />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-ptba-charcoal">{t("portfolioFields.ippCaptive")} <span className="text-ptba-red">*</span></label>
                      <select value={exp.ippOrCaptive} onChange={(e) => updateExperience(i, "ippOrCaptive", e.target.value)} className={inputClass}>
                        <option value="">{t("portfolioFields.selectPlaceholder")}</option>
                        {IPP_CAPTIVE_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-ptba-charcoal">{t("portfolioFields.codYear")} <span className="text-ptba-red">*</span></label>
                      <input type="text" placeholder={t("portfolioFields.codYearPlaceholder")} inputMode="numeric" value={exp.codYear} onChange={(e) => updateExperience(i, "codYear", e.target.value.replace(/[^0-9]/g, ""))} className={inputClass} />
                    </div>
                  </>
                )}

                {/* Financing-specific fields */}
                {exp.category === 'financing' && (
                  <>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-ptba-charcoal">{t("portfolioFields.financingType")} <span className="text-ptba-red">*</span></label>
                      <select value={exp.financingType} onChange={(e) => updateExperience(i, "financingType", e.target.value)} className={inputClass}>
                        <option value="">{t("portfolioFields.selectPlaceholder")}</option>
                        {FINANCING_TYPE_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-ptba-charcoal">{t("portfolioFields.amount")} <span className="text-ptba-red">*</span></label>
                      <input type="text" placeholder={t("portfolioFields.amountPlaceholder")} inputMode="decimal" value={fmtThousand(exp.amountUSD)} onChange={(e) => updateExperience(i, "amountUSD", e.target.value.replace(/[^0-9.,]/g, "").replace(/,/g, ""))} className={inputClass} />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-ptba-charcoal">{t("portfolioFields.codYear")} <span className="text-ptba-red">*</span></label>
                      <input type="text" placeholder={t("portfolioFields.codYearPlaceholder")} inputMode="numeric" value={exp.codYear} onChange={(e) => updateExperience(i, "codYear", e.target.value.replace(/[^0-9]/g, ""))} className={inputClass} />
                    </div>
                  </>
                )}

                {/* General project experience fields */}
                {exp.category === 'general' && (
                  <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-ptba-charcoal">{locale === "en" ? "Project Type" : "Jenis Proyek"} <span className="text-ptba-red">*</span></label>
                      <input type="text" placeholder={locale === "en" ? "e.g. Coal Mining, Infrastructure" : "Contoh: Pertambangan Batubara, Infrastruktur"} value={(exp as any).projectType || ""} onChange={(e) => { const next = [...experiences]; (next[i] as any).projectType = e.target.value; setExperiences(next); }} className={cn(inputClass, errBorder((exp as any).projectType))} />
                      <ErrText show={errMsg((exp as any).projectType) as boolean} />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-ptba-charcoal">{locale === "en" ? "Role in Project" : "Peran dalam Proyek"} <span className="text-ptba-red">*</span></label>
                      <input type="text" placeholder={locale === "en" ? "e.g. Developer, EPC Contractor" : "Contoh: Developer, Kontraktor EPC"} value={(exp as any).role || ""} onChange={(e) => { const next = [...experiences]; (next[i] as any).role = e.target.value; setExperiences(next); }} className={cn(inputClass, errBorder((exp as any).role))} />
                      <ErrText show={errMsg((exp as any).role) as boolean} />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-ptba-charcoal">{t("portfolioFields.contractValue")} <span className="text-ptba-red">*</span></label>
                      <input type="text" inputMode="decimal" placeholder={t("portfolioFields.contractValuePlaceholder")} value={fmtThousand((exp as any).contractValueUSD || "")} onChange={(e) => { const next = [...experiences]; (next[i] as any).contractValueUSD = e.target.value.replace(/[^0-9.,]/g, "").replace(/,/g, ""); setExperiences(next); }} className={inputClass} />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-ptba-charcoal">{t("portfolioFields.codYear")} <span className="text-ptba-red">*</span></label>
                      <input type="text" inputMode="numeric" placeholder={t("portfolioFields.codYearPlaceholder")} value={(exp as any).codYear || ""} onChange={(e) => { const next = [...experiences]; (next[i] as any).codYear = e.target.value.replace(/[^0-9]/g, ""); setExperiences(next); }} className={cn(inputClass, errBorder((exp as any).codYear))} />
                      <ErrText show={errMsg((exp as any).codYear) as boolean} />
                    </div>
                    <div className="md:col-span-2">
                      <label className="mb-1 block text-xs font-medium text-ptba-charcoal">{locale === "en" ? "Project Description" : "Deskripsi Proyek"}</label>
                      <textarea placeholder={locale === "en" ? "Brief description of the project..." : "Deskripsi singkat proyek..."} value={(exp as any).description || ""} onChange={(e) => { const next = [...experiences]; (next[i] as any).description = e.target.value; setExperiences(next); }} className={cn(inputClass, "min-h-[60px] resize-y")} />
                    </div>
                  </div>
                )}
              </div>

              {/* Per-experience credential document */}
              <div className="pt-2">
                <p className="text-[10px] text-ptba-gray italic mb-1.5">{t("portfolioFields.credentialDocHint")}</p>
                <FileUploadButton
                  label={t("portfolioFields.credentialDoc")}
                  accept=".pdf"
                  uploaded={isDoc(`credential_exp_${exp.uid}`)}
                  uploading={uploadedDocs[`credential_exp_${exp.uid}`]?.uploading ?? false}
                  fileName={uploadedDocs[`credential_exp_${exp.uid}`]?.name}
                  onSelect={(f) => uploadDoc(`credential_exp_${exp.uid}`, `Bukti Kontrak & Profil - ${exp.plantName || 'Proyek'}`, f)}
                  onDelete={() => deleteDoc(`credential_exp_${exp.uid}`)}
                  readOnly={readOnly}
                  onDownload={docDownloadHandler(`credential_exp_${exp.uid}`)}
                  error={showErrors && !isDoc(`credential_exp_${exp.uid}`)}
                />
              </div>
            </div>
          ))}

          {!readOnly && !noExperience && (
            <button
              onClick={() => addExperience('developer')}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-ptba-steel-blue/30 py-3 text-sm font-medium text-ptba-steel-blue hover:bg-ptba-steel-blue/5 transition-colors"
            >
              <Plus className="h-4 w-4" />
              {t("portfolioFields.addExperience")}
            </button>
          )}

          {!readOnly && experiences.length === 0 && !noExperience && (
            <button
              onClick={() => setNoExperience(true)}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-ptba-light-gray py-3 text-sm font-medium text-ptba-gray hover:bg-ptba-section-bg transition-colors"
            >
              {locale === "en" ? "I don't have relevant experience" : "Tidak memiliki pengalaman"}
            </button>
          )}

          {noExperience && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 flex items-center justify-between">
              <p className="text-sm text-amber-800">{locale === "en" ? "Marked as no relevant experience" : "Ditandai tidak memiliki pengalaman"}</p>
              {!readOnly && (
                <button onClick={() => setNoExperience(false)} className="text-xs font-medium text-ptba-steel-blue hover:underline">
                  {locale === "en" ? "Cancel" : "Batalkan"}
                </button>
              )}
            </div>
          )}

        </Section>
      )}

      {/* ─── Section: Gambaran Umum Keuangan (financial_overview) ─── */}
      {hasDoc("financial_overview") && (
        <Section
          id="section-financial_overview"
          number={getSectionNumber("financial_overview")}
          title={sectionTitle("financial_overview", "financialOverview")}
          icon={DollarSign}
          complete={sectionComplete.financial_overview}
          isRequired={!optionalSectionIds.has("financial_overview")}
          open={readOnly || openSection === getSectionNumber("financial_overview")}
          onToggle={() => setOpenSection(openSection === getSectionNumber("financial_overview") ? 0 : getSectionNumber("financial_overview"))}
          readOnly={readOnly}
        >
          <p className="text-xs text-ptba-gray">{t("sections.financialOverviewDesc")}</p>

          {/* Year Range Selector */}
          <div className="mt-3 mb-1">
            <label className="mb-1.5 block text-xs font-semibold text-ptba-charcoal">{t("financialFields.yearRange")}</label>
            <p className="text-[10px] text-ptba-gray mb-2">{t("financialFields.yearRangeHint")}</p>
            <div>
              <select
                value={YEAR_RANGE_OPTIONS.findIndex((r) => r.join("-") === selectedRangeKey)}
                onChange={(e) => handleYearRangeChange(Number(e.target.value))}
                className="rounded-lg border border-ptba-light-gray bg-white px-3 py-2 text-sm text-ptba-charcoal outline-none focus:border-ptba-steel-blue focus:ring-2 focus:ring-ptba-steel-blue/20"
              >
                {YEAR_RANGE_OPTIONS.map((range, idx) => (
                  <option key={range.join("-")} value={idx}>
                    {range[0]}–{range[2]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Financial Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ptba-light-gray">
                  <th className="py-2 pr-3 text-left text-xs font-semibold text-ptba-gray w-28"></th>
                  {financialYears.map((fy) => (
                    <th key={fy.year} className="py-2 px-2 text-center text-xs font-semibold text-ptba-navy">{fy.year}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-ptba-light-gray/50">
                  <td className="py-2 pr-3 text-xs font-medium text-ptba-charcoal">{t("financialFields.currency")}</td>
                  {financialYears.map((fy, i) => (
                    <td key={fy.year} className="py-2 px-2">
                      <select value={fy.currency} onChange={(e) => {
                        const next = [...financialYears]; next[i].currency = e.target.value; setFinancialYears(next);
                      }} className="w-full rounded border border-ptba-light-gray px-2 py-1 text-xs">
                        <option value="IDR">IDR</option>
                        <option value="USD">USD</option>
                      </select>
                    </td>
                  ))}
                </tr>
                {/* Total Debt */}
                <tr className="border-b border-ptba-light-gray/50">
                  <td className="py-2 pr-3 text-xs font-medium text-ptba-charcoal">
                    {t("financialFields.totalDebt")} <span className="text-ptba-red">*</span>
                    <span className="block text-[10px] text-ptba-gray font-normal">({financialYears[0]?.currency === "USD" ? t("financialFields.unitUSD") : t("financialFields.unitIDR")})</span>
                  </td>
                  {financialYears.map((fy, i) => (
                    <td key={fy.year} className="py-2 px-2">
                      <input
                        type="text"
                        placeholder="0"
                        value={fmtThousand(fy.totalDebt)}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9.,-]/g, "").replace(/,/g, "");
                          const next = [...financialYears];
                          next[i].totalDebt = val;
                          const debt = parseFloat(val || "0") || 0;
                          const equity = parseFloat(next[i].totalEquity.replace(/,/g, "") || "0") || 0;
                          next[i].totalAsset = String(debt + equity);
                          setFinancialYears(next);
                        }}
                        className="w-full rounded border border-ptba-light-gray px-2 py-1.5 text-xs text-right outline-none focus:border-ptba-steel-blue"
                      />
                    </td>
                  ))}
                </tr>
                {/* Total Equity */}
                <tr className="border-b border-ptba-light-gray/50">
                  <td className="py-2 pr-3 text-xs font-medium text-ptba-charcoal">
                    {t("financialFields.totalEquity")} <span className="text-ptba-red">*</span>
                    <span className="block text-[10px] text-ptba-gray font-normal">({financialYears[0]?.currency === "USD" ? t("financialFields.unitUSD") : t("financialFields.unitIDR")})</span>
                  </td>
                  {financialYears.map((fy, i) => (
                    <td key={fy.year} className="py-2 px-2">
                      <input
                        type="text"
                        placeholder="0"
                        value={fmtThousand(fy.totalEquity)}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9.,-]/g, "").replace(/,/g, "");
                          const next = [...financialYears];
                          next[i].totalEquity = val;
                          const debt = parseFloat(next[i].totalDebt.replace(/,/g, "") || "0") || 0;
                          const equity = parseFloat(val.replace(/,/g, "") || "0") || 0;
                          next[i].totalAsset = String(debt + equity);
                          setFinancialYears(next);
                        }}
                        className="w-full rounded border border-ptba-light-gray px-2 py-1.5 text-xs text-right outline-none focus:border-ptba-steel-blue"
                      />
                    </td>
                  ))}
                </tr>
                {/* Total Aset (auto-calculated) */}
                <tr className="border-b border-ptba-light-gray/50 bg-ptba-section-bg">
                  <td className="py-2 pr-3 text-xs font-semibold text-ptba-charcoal">
                    {t("financialFields.totalAsset")}
                    <span className="block text-[10px] text-ptba-gray font-normal">({financialYears[0]?.currency === "USD" ? t("financialFields.unitUSD") : t("financialFields.unitIDR")})</span>
                  </td>
                  {financialYears.map((fy) => (
                    <td key={fy.year} className="py-2 px-2">
                      <div className="w-full rounded bg-ptba-light-gray/30 px-2 py-1.5 text-xs text-right font-semibold text-ptba-charcoal">
                        {fy.totalAsset && Number(fy.totalAsset) !== 0 ? Number(fy.totalAsset).toLocaleString("en-US") : "0"}
                      </div>
                    </td>
                  ))}
                </tr>
                {/* EBITDA & DSCR */}
                {[
                  { key: "ebitda" as const, label: t("financialFields.ebitda"), hasUnit: true },
                  { key: "dscr" as const, label: t("financialFields.dscr"), hasUnit: false },
                ].map((row) => (
                  <tr key={row.key} className="border-b border-ptba-light-gray/50">
                    <td className="py-2 pr-3 text-xs font-medium text-ptba-charcoal">
                      {row.label} <span className="text-ptba-red">*</span>
                      {row.hasUnit && <span className="block text-[10px] text-ptba-gray font-normal">({financialYears[0]?.currency === "USD" ? t("financialFields.unitUSD") : t("financialFields.unitIDR")})</span>}
                    </td>
                    {financialYears.map((fy, i) => (
                      <td key={fy.year} className="py-2 px-2">
                        <input
                          type="text"
                          placeholder="0"
                          value={fy[row.key]}
                          onChange={(e) => {
                            const next = [...financialYears]; next[i][row.key] = e.target.value.replace(/[^0-9.,-]/g, ""); setFinancialYears(next);
                          }}
                          className="w-full rounded border border-ptba-light-gray px-2 py-1.5 text-xs text-right outline-none focus:border-ptba-steel-blue"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Credit Rating */}
          <div className="space-y-3">
            <label className="block text-xs font-medium text-ptba-charcoal">{t("financialFields.ratingAgency")} <span className="text-ptba-red">*</span></label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {[
                { value: "DNDB", label: "DNDB" },
                { value: "S&P", label: "S&P (Pefindo)" },
                { value: "Moodys", label: "Moody's" },
                { value: "Fitch", label: "Fitch" },
                { value: "Other", label: "Other" },
              ].map((agency) => (
                <label key={agency.value} className="flex items-center gap-2 text-xs text-ptba-charcoal cursor-pointer">
                  <input
                    type="checkbox"
                    checked={creditRatingAgency === agency.value}
                    onChange={() => setCreditRatingAgency(creditRatingAgency === agency.value ? "" : agency.value)}
                    className="h-3.5 w-3.5 rounded border-ptba-light-gray text-ptba-navy focus:ring-ptba-navy"
                  />
                  {agency.label}
                </label>
              ))}
            </div>
            {creditRatingAgency && (
              <div>
                <label className="mb-1 block text-xs font-medium text-ptba-charcoal">{t("financialFields.ratingValue")} ({creditRatingAgency}) <span className="text-ptba-red">*</span></label>
                <input
                  type="text"
                  placeholder={creditRatingAgency === "DNDB" ? "e.g. SA2" : creditRatingAgency === "S&P" ? "e.g. AA+" : creditRatingAgency === "Moodys" ? "e.g. Aaa" : creditRatingAgency === "Fitch" ? "e.g. AAA" : "e.g. A+"}
                  value={creditRatingValue}
                  onChange={(e) => setCreditRatingValue(e.target.value)}
                  className={cn(inputClass, "max-w-xs")}
                />
              </div>
            )}
          </div>

          {/* EBITDA & DSCR Calculation */}
          <div className="space-y-2 pt-2 border-t border-ptba-light-gray mt-4">
            <p className="text-xs font-semibold text-ptba-charcoal pt-3">EBITDA & DSCR Calculation <span className="text-ptba-red">*</span></p>
            <p className="text-[10px] text-ptba-gray">Download the calculation form, fill it in, then upload the completed file (xlsx format, max 20 MB).</p>
            <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50/50 px-3 py-2">
              <Download className="h-3.5 w-3.5 text-green-600 shrink-0" />
              <span className="text-[11px] text-ptba-gray flex-1">Click here for EBITDA and DSCR calculation</span>
              <a
                href={`/templates/ebitda-dscr-calculation-${financialYears[0].year}-${financialYears[2].year}.xlsx`}
                download
                className="inline-flex items-center gap-1 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700 transition-colors shrink-0"
              >
                <Download className="h-3 w-3" />
                Download
              </a>
            </div>
            <FileUploadButton
              label="Upload EBITDA and DSCR calculation"
              accept=".xlsx,.xls"
              uploaded={isDoc("ebitda_dscr_calculation")}
              uploading={uploadedDocs["ebitda_dscr_calculation"]?.uploading ?? false}
              fileName={uploadedDocs["ebitda_dscr_calculation"]?.name}
              onSelect={(f) => uploadDoc("ebitda_dscr_calculation", "EBITDA & DSCR Calculation", f)}
              onDelete={() => deleteDoc("ebitda_dscr_calculation")}
              readOnly={readOnly}
              onDownload={docDownloadHandler("ebitda_dscr_calculation")}
              error={showErrors && !isDoc("ebitda_dscr_calculation")}
            />
          </div>

          {/* Credit Rating Evidence */}
          <div className="space-y-2 pt-2">
            <p className="text-xs font-semibold text-ptba-charcoal">Upload Credit Rating Evidence <span className="text-ptba-red">*</span></p>
            <p className="text-[10px] text-ptba-gray">Pdf format, Max size 20 MB</p>
            <FileUploadButton
              label="Credit Rating Evidence"
              accept=".pdf"
              uploaded={isDoc("credit_rating_evidence")}
              uploading={uploadedDocs["credit_rating_evidence"]?.uploading ?? false}
              fileName={uploadedDocs["credit_rating_evidence"]?.name}
              onSelect={(f) => uploadDoc("credit_rating_evidence", "Credit Rating Evidence", f)}
              onDelete={() => deleteDoc("credit_rating_evidence")}
              readOnly={readOnly}
              onDownload={docDownloadHandler("credit_rating_evidence")}
              error={showErrors && !isDoc("credit_rating_evidence")}
            />
          </div>

          {/* Audited Financial Statements per year */}
          <div className="space-y-3 pt-2 border-t border-ptba-light-gray mt-4">
            <p className="text-xs font-semibold text-ptba-charcoal pt-3">Audited Financial Statements <span className="text-ptba-red">*</span></p>
            <p className="text-[10px] text-ptba-gray">Upload audited financial statement for each year. Pdf format, Max size 20 MB.</p>
            {financialYears.map((fy) => {
              const docId = `audited_financial_${fy.year}`;
              return (
                <FileUploadButton
                  key={docId}
                  label={`Upload Audited Financial Statement for years ${fy.year}`}
                  accept=".pdf"
                  uploaded={isDoc(docId)}
                  uploading={uploadedDocs[docId]?.uploading ?? false}
                  fileName={uploadedDocs[docId]?.name}
                  onSelect={(f) => uploadDoc(docId, `Audited Financial Statement ${fy.year}`, f)}
                  onDelete={() => deleteDoc(docId)}
                  readOnly={readOnly}
                  onDownload={docDownloadHandler(docId)}
                  error={showErrors && !isDoc(docId)}
                />
              );
            })}
          </div>
        </Section>
      )}

      {/* ─── Section: Pemenuhan Persyaratan (requirements_fulfillment) ─── */}
      {hasDoc("requirements_fulfillment") && (
        <Section
          id="section-requirements_fulfillment"
          number={getSectionNumber("requirements_fulfillment")}
          title={sectionTitle("requirements_fulfillment", "requirementsFulfillment")}
          icon={ClipboardCheck}
          complete={sectionComplete.requirements_fulfillment}
          isRequired={!optionalSectionIds.has("requirements_fulfillment")}
          open={readOnly || openSection === getSectionNumber("requirements_fulfillment")}
          onToggle={() => setOpenSection(openSection === getSectionNumber("requirements_fulfillment") ? 0 : getSectionNumber("requirements_fulfillment"))}
          readOnly={readOnly}
        >
          <p className="text-xs text-ptba-gray">{t("sections.requirementsFulfillmentDesc")}</p>

          {/* Download template button */}
          <div className="rounded-lg border border-ptba-steel-blue/20 bg-ptba-steel-blue/5 p-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-ptba-steel-blue">{t("requirementsFields.templateDoc")}</p>
                <p className="text-[11px] text-ptba-gray mt-0.5">
                  {t("requirementsFields.templateDocDesc")}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const params = new URLSearchParams({
                    project: project.name || "Proyek",
                    requirements: (projectRequirements.length > 0 ? projectRequirements : ["(Tidak ada persyaratan khusus)"]).join("||"),
                  });
                  window.location.href = `/api/templates/pemenuhan-persyaratan?${params.toString()}`;
                }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-ptba-steel-blue px-3 py-2 text-xs font-medium text-white hover:bg-ptba-steel-blue/90 transition-colors shrink-0"
              >
                <FileText className="h-3.5 w-3.5" />
                {t("requirementsFields.downloadTemplate")}
              </button>
            </div>
          </div>

          {/* Show project requirements as checklist */}
          {projectRequirements.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-ptba-navy">{t("requirementsFields.projectRequirements")}</p>
              {projectRequirements.map((req: string, i: number) => (
                <label
                  key={i}
                  className={cn(
                    "flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors",
                    requirementAnswers[i] ? "border-green-200 bg-green-50/50" : "border-ptba-light-gray hover:bg-ptba-off-white"
                  )}
                >
                  <input
                    type="checkbox"
                    checked={requirementAnswers[i] || false}
                    onChange={(e) => setRequirementAnswers((prev) => ({ ...prev, [i]: e.target.checked }))}
                    className="mt-0.5 h-4 w-4 rounded border-ptba-light-gray text-green-600 focus:ring-green-500/20"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-ptba-charcoal">{req}</p>
                    {requirementAnswers[i] && (
                      <p className="text-[10px] text-green-600 mt-0.5">{t("requirementsFields.fulfilled")}</p>
                    )}
                  </div>
                </label>
              ))}
            </div>
          ) : (
            <div className="rounded-lg bg-ptba-section-bg p-4">
              <p className="text-xs text-ptba-gray">{t("requirementsFields.noSpecificRequirements")}</p>
            </div>
          )}

          <div>
            <label className="mb-1 block text-xs font-medium text-ptba-charcoal">{t("requirementsFields.additionalNotes")}</label>
            <textarea
              placeholder={t("requirementsFields.additionalNotesPlaceholder")}
              value={requirementNotes}
              onChange={(e) => setRequirementNotes(e.target.value)}
              className={cn(inputClass, "min-h-[60px] resize-y")}
            />
          </div>

          <div className="space-y-2 pt-2">
            <p className="text-xs font-semibold text-ptba-charcoal">{t("requirementsFields.requirementsDoc")} <span className="text-ptba-red">*</span></p>
            <FileUploadButton
              label={t("requirementsFields.requirementsDocLabel")}
              accept=".pdf"
              uploaded={isDoc("requirements_fulfillment")}
              uploading={uploadedDocs["requirements_fulfillment"]?.uploading ?? false}
              fileName={uploadedDocs["requirements_fulfillment"]?.name}
              onSelect={(f) => uploadDoc("requirements_fulfillment", "Pemenuhan Persyaratan", f)}
              templateFileName={getTemplateInfo("requirements_fulfillment")?.fileName}
              onDownloadTemplate={() => downloadTemplate("requirements_fulfillment")}
              onDelete={() => deleteDoc("requirements_fulfillment")}
              readOnly={readOnly}
              onDownload={docDownloadHandler("requirements_fulfillment")}
              error={showErrors && !isDoc("requirements_fulfillment")}
            />
          </div>
        </Section>
      )}

      {/* ═══ Section: Dokumen Tambahan (if any legacy docs assigned to phase1) ═══ */}
      {hasAdditionalDocs && (
        <Section
          id="section-additional"
          number={additionalDocsSectionNumber}
          title={t("sections.additionalDocs")}
          icon={FileText}
          complete={additionalDocsComplete}
          open={readOnly || openSection === additionalDocsSectionNumber}
          onToggle={() => setOpenSection(openSection === additionalDocsSectionNumber ? 0 : additionalDocsSectionNumber)}
          readOnly={readOnly}
        >
          <p className="text-xs text-ptba-gray">{t("sections.additionalDocsDesc")}</p>
          <div className="space-y-2">
            {additionalPhase1Docs.map((doc: { id: string; name: string; description: string; isRequired?: boolean }) => (
              <div key={doc.id} className="space-y-2">
                <div className="flex items-center gap-2">
                  {doc.isRequired !== false
                    ? <span className="text-[10px] text-ptba-red font-semibold">*{locale === "en" ? "Required" : "Wajib"}</span>
                    : <span className="text-[10px] text-ptba-gray font-medium">{locale === "en" ? "Optional" : "Opsional"}</span>}
                  <span className="text-xs font-semibold text-ptba-charcoal">{doc.name}</span>
                </div>
                {doc.description && (
                  <div className="rounded-lg bg-ptba-section-bg border border-ptba-steel-blue/10 px-3 py-2">
                    <p className="text-[11px] text-ptba-gray leading-relaxed"><span className="font-semibold text-ptba-charcoal">{locale === "en" ? "Notes:" : "Keterangan:"}</span> {doc.description}</p>
                  </div>
                )}
                <FileUploadButton
                  label={doc.name}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                  uploaded={isDoc(doc.id)}
                  uploading={uploadedDocs[doc.id]?.uploading ?? false}
                  fileName={uploadedDocs[doc.id]?.name}
                  onSelect={(f) => uploadDoc(doc.id, doc.name, f)}
                  onDelete={() => deleteDoc(doc.id)}
                  templateFileName={getTemplateInfo(doc.id)?.fileName}
                  onDownloadTemplate={() => downloadTemplate(doc.id)}
                  readOnly={readOnly}
                  onDownload={docDownloadHandler(doc.id)}
                  error={doc.isRequired !== false && showErrors && !isDoc(doc.id)}
                />
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ═══ Section: Pernyataan Akhir & Submit (always shown) ═══ */}
      <Section
        id="section-final"
        number={finalSectionNumber}
        title={t("sections.finalStatement")}
        icon={ShieldCheck}
        complete={sectionComplete.final}
        open={readOnly || openSection === finalSectionNumber}
        onToggle={() => setOpenSection(openSection === finalSectionNumber ? 0 : finalSectionNumber)}
        readOnly={readOnly}
      >
        <div className="rounded-lg bg-ptba-section-bg p-4 text-sm text-ptba-charcoal leading-relaxed">
          {t("finalStatement.declaration")}
        </div>

        <label className={cn("flex items-start gap-3 cursor-pointer rounded-lg p-3 -m-3 transition-colors", showErrors && !agreedFinal && "bg-red-50 ring-2 ring-ptba-red/20")}>
          <input
            type="checkbox"
            checked={agreedFinal}
            onChange={(e) => setAgreedFinal(e.target.checked)}
            className={cn("mt-0.5 h-4 w-4 rounded text-ptba-navy focus:ring-ptba-steel-blue", showErrors && !agreedFinal ? "border-ptba-red" : "border-ptba-light-gray")}
          />
          <span className="text-sm text-ptba-gray">
            {t.rich("finalStatement.agreeStatement", { strong: (chunks) => <strong>{chunks}</strong> })}
          </span>
        </label>
      </Section>

      {/* ═══ Submit Bar ═══ */}
      {!readOnly && <div className="rounded-xl bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-ptba-charcoal">{t("submitBar.sectionsCompleted", { completed: completedCount, total: totalSections })}</p>
            <p className="text-xs text-ptba-gray mt-0.5">
              {allComplete ? t("submitBar.readyToSubmit") : t("submitBar.completeAllSections")}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {draftSaved && (
              <span className="text-xs text-green-600 font-medium">{t("submitBar.draftSaved")}</span>
            )}
            <button
              onClick={() => router.push(`/mitra/projects/${projectId}`)}
              className="rounded-lg border border-ptba-navy px-4 py-2.5 text-sm font-medium text-ptba-navy hover:bg-ptba-navy/5 transition-colors"
            >
              {tc("cancel")}
            </button>
            <button
              onClick={handleSaveDraft}
              disabled={savingDraft}
              className="inline-flex items-center gap-2 rounded-lg border border-ptba-steel-blue px-4 py-2.5 text-sm font-medium text-ptba-steel-blue hover:bg-ptba-steel-blue/5 transition-colors"
            >
              {savingDraft ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {savingDraft ? t("submitBar.savingDraft") : t("submitBar.saveDraft")}
            </button>
            <button
              onClick={allComplete ? () => setShowSubmitConfirm(true) : () => { setShowErrors(true); scrollToFirstIncomplete(); }}
              disabled={submitting}
              className={cn(
                "inline-flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-bold transition-colors",
                submitting
                  ? "bg-ptba-light-gray text-ptba-gray"
                  : "bg-ptba-navy text-white hover:bg-ptba-navy/90"
              )}
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {submitting ? t("submitBar.submitting") : t("submitBar.submitEoi")}
            </button>
          </div>
        </div>
      </div>}

      {/* Submit Confirmation Modal */}
      {!readOnly && showSubmitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => !submitting && setShowSubmitConfirm(false)}>
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100">
                <AlertTriangle className="h-7 w-7 text-amber-600" />
              </div>
              <h2 className="text-lg font-bold text-ptba-charcoal">
                {locale === "en" ? "Confirm Submission" : "Konfirmasi Pengajuan"}
              </h2>
              <p className="mt-2 text-sm text-ptba-gray">
                {locale === "en"
                  ? "Once submitted, your registration cannot be edited. Please make sure all data and documents are correct before proceeding."
                  : "Setelah dikirim, pendaftaran Anda tidak dapat diubah lagi. Pastikan semua data dan dokumen sudah benar sebelum melanjutkan."}
              </p>
              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setShowSubmitConfirm(false)}
                  disabled={submitting}
                  className="flex-1 rounded-lg border border-ptba-light-gray px-4 py-2.5 text-sm font-medium text-ptba-charcoal hover:bg-ptba-section-bg transition-colors disabled:opacity-50"
                >
                  {locale === "en" ? "Review Again" : "Periksa Kembali"}
                </button>
                <button
                  onClick={async () => {
                    await handleSubmit();
                    setShowSubmitConfirm(false);
                  }}
                  disabled={submitting}
                  className="flex-1 rounded-lg bg-ptba-gold px-4 py-2.5 text-sm font-bold text-ptba-charcoal hover:bg-ptba-gold-light transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  {submitting ? (locale === "en" ? "Submitting..." : "Mengirim...") : (locale === "en" ? "Submit" : "Kirim Pendaftaran")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
