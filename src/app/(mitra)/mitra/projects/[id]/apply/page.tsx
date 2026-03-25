"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft, Upload, Download, CheckCircle2, FileText, AlertTriangle, Loader2,
  Building2, DollarSign, Briefcase, ShieldCheck, ChevronDown, ChevronUp, Plus, Trash2,
  PenLine, ClipboardCheck, Save,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useAuth } from "@/lib/auth/auth-context";
import { api, projectApi, ApiClientError } from "@/lib/api/client";
import { partnerApi } from "@/lib/api/client";
import { PHASE1_DOCUMENT_TYPES, DOCUMENT_TYPES } from "@/lib/constants/document-types";
import { useTranslations } from "next-intl";
import { useLocale } from "@/lib/i18n/locale-context";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002/api";

// ─── Types ───

type ExperienceCategory = 'developer' | 'om_contractor' | 'financing';

interface BaseExperience {
  uid: string;
  category: ExperienceCategory;
  plantName: string;
  location: string;
  totalCapacityMW: string;
}

interface DeveloperExperience extends BaseExperience {
  category: 'developer';
  equityPercent: string;
  ippOrCaptive: string;
  codYear: string;
}

interface OMContractorExperience extends BaseExperience {
  category: 'om_contractor';
  contractValueUSD: string;
  workPortionPercent: string;
  ippOrCaptive: string;
  codYear: string;
}

interface FinancingExperience extends BaseExperience {
  category: 'financing';
  financingType: string;
  amountUSD: string;
  year: string;
}

type CategorizedExperience = DeveloperExperience | OMContractorExperience | FinancingExperience;

interface FinancialYear {
  year: string;
  currency: string;
  totalAsset: string;
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
const EXPERIENCE_CATEGORIES: { key: ExperienceCategory; label: string; labelEn: string }[] = [
  { key: 'developer', label: 'Sebagai Developer yang Berhasil', labelEn: 'As a Successful Developer' },
  { key: 'om_contractor', label: 'Sebagai Kontraktor O&M yang Berhasil', labelEn: 'As a Successful O&M Contractor' },
  { key: 'financing', label: 'Sebagai Kontributor Pembiayaan Proyek yang Berhasil', labelEn: 'As a Successful Project Financing Contributor' },
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
}) {
  const tc = useTranslations("common");
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
        uploaded ? "border-green-200 bg-green-50/50" : "border-ptba-light-gray"
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
}: {
  id?: string;
  number: number;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  complete: boolean;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
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
          <p className="text-sm font-semibold text-ptba-charcoal">{title}</p>
        </div>
        <Icon className="h-4 w-4 text-ptba-gray shrink-0" />
        {open ? <ChevronUp className="h-4 w-4 text-ptba-gray" /> : <ChevronDown className="h-4 w-4 text-ptba-gray" />}
      </button>
      {open && <div className="border-t border-ptba-light-gray p-5 space-y-4">{children}</div>}
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
  const [savingDraft, setSavingDraft] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);
  const [error, setError] = useState("");
  const [openSection, setOpenSection] = useState(1);

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
  const [orgStructure, setOrgStructure] = useState("");
  const [subsidiaries, setSubsidiaries] = useState("");
  const [nib, setNib] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [minorityEquityPercent, setMinorityEquityPercent] = useState("");

  // Section: Surat Pernyataan EoI (statement_eoi)
  const [signerName, setSignerName] = useState("");
  const [signerPosition, setSignerPosition] = useState("");
  const [signerDate, setSignerDate] = useState("");
  const [eoiAgreed, setEoiAgreed] = useState(false);

  // Section: Kriteria Keuangan (financial_overview)
  const [financialYears, setFinancialYears] = useState<FinancialYear[]>(
    YEAR_RANGE_OPTIONS[0].map((y) => ({ year: String(y), currency: "IDR", totalAsset: "", ebitda: "", dscr: "" }))
  );
  const selectedRangeKey = financialYears.map((f) => f.year).join("-");
  const handleYearRangeChange = (rangeIndex: number) => {
    const newYears = YEAR_RANGE_OPTIONS[rangeIndex];
    setFinancialYears(newYears.map((y) => ({ year: String(y), currency: "IDR", totalAsset: "", ebitda: "", dscr: "" })));
  };
  const [creditRatingAgency, setCreditRatingAgency] = useState("");
  const [creditRatingValue, setCreditRatingValue] = useState("");
  const [cashOnHand, setCashOnHand] = useState("");

  // Section: Pengalaman Proyek (portfolio)
  const [experiences, setExperiences] = useState<CategorizedExperience[]>([]);

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

  // Additional phase1 documents (docs assigned to phase1 that don't have a dedicated section)
  const sectionDocIds = new Set(SECTION_ORDER.map((s) => s.docId));
  const additionalPhase1Docs = useMemo(() => {
    if (!project?.requiredDocuments) return [];
    return project.requiredDocuments
      .filter((d: any) => (d.phase === "phase1" || d.phase === "both") && !sectionDocIds.has(d.documentTypeId))
      .map((d: any) => {
        const meta = DOCUMENT_TYPES.find((dt) => dt.id === d.documentTypeId);
        return {
          id: d.documentTypeId,
          name: meta?.name || (d.documentTypeId.startsWith("custom_") ? d.documentTypeId.slice(7) : d.documentTypeId).replace(/_/g, " "),
          description: meta?.description || "",
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
        if (fd.requirementAnswers) setRequirementAnswers(fd.requirementAnswers);
        if (fd.requirementNotes) setRequirementNotes(fd.requirementNotes);
        if (fd.agreedFinal) setAgreedFinal(fd.agreedFinal);
        if (fd.orgStructure) setOrgStructure(fd.orgStructure);
        if (fd.subsidiaries) setSubsidiaries(fd.subsidiaries);
        if (fd.minorityEquityPercent) setMinorityEquityPercent(fd.minorityEquityPercent);
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
        setBusinessOverview(fd?.businessOverview || p.business_overview || "");
        setNib(fd?.nib || p.nib || "");
        setContactPerson(fd?.contactPerson || p.contact_person || "");
        setContactPhone(fd?.contactPhone || p.contact_phone || "");
        setContactEmail(fd?.contactEmail || p.contact_email || "");
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
        await fetch(`${API_BASE}/applications/${appId}/documents/${existingDoc.dbId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${accessToken}` },
        });
      }

      const formData = new FormData();
      formData.append("file", file);
      formData.append("documentTypeId", docTypeId);
      formData.append("name", autoName);
      formData.append("phase", phase);

      const res = await fetch(`${API_BASE}/applications/${appId}/documents`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
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
      const res = await fetch(`${API_BASE}/applications/${application.id}/documents/${doc.dbId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` },
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
      if (data.url) window.open(data.url, "_blank");
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
    requirementAnswers,
    requirementNotes,
    agreedFinal,
    companyName,
    companyAddress,
    companyIndonesiaAddress,
    companyPhone,
    companyEmail,
    companyWebsite,
    yearEstablished,
    countryEstablished,
    businessOverview,
    orgStructure,
    subsidiaries,
    nib,
    contactPerson,
    contactPhone,
    contactEmail,
    minorityEquityPercent,
  });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const saveFormDataToServer = useCallback(async (appId: string) => {
    if (!accessToken) return;
    await fetch(`${API_BASE}/applications/${appId}/form-data`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ formData: buildFormData() }),
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

  // Trigger auto-save when form fields change
  useEffect(() => {
    if (!application?.id) return;
    autoSaveFormData();
    return () => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current); };
  }, [
    signerName, signerPosition, signerDate, eoiAgreed, minorityEquityPercent, cashOnHand,
    creditRatingAgency, creditRatingValue, financialYears, experiences,
    requirementAnswers, requirementNotes, agreedFinal,
    companyName, companyAddress, companyIndonesiaAddress, companyPhone, companyEmail,
    companyWebsite, yearEstablished, countryEstablished, businessOverview,
    orgStructure, subsidiaries, nib, contactPerson, contactPhone, contactEmail,
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
      if (err instanceof ApiClientError) setError(err.message);
      else setError(t("errors.submitFailed"));
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
    compro: !!companyName && !!companyAddress && isDoc("compro"),
    statement_eoi: !!signerName && !!signerPosition && !!signerDate && eoiAgreed && isDoc("statement_eoi"),
    portfolio: experiences.length >= 2 && isDoc("portfolio") && experiences.every((exp) => {
      const hasCred = isDoc(`credential_exp_${exp.uid}`);
      const base = !!exp.plantName && !!exp.location && !!exp.totalCapacityMW && hasCred;
      if (exp.category === 'developer') return base && !!exp.equityPercent && !!exp.ippOrCaptive && !!exp.codYear;
      if (exp.category === 'om_contractor') return base && !!exp.contractValueUSD && !!exp.workPortionPercent && !!exp.ippOrCaptive && !!exp.codYear;
      if (exp.category === 'financing') return base && !!exp.financingType && !!exp.amountUSD && !!exp.year;
      return false;
    }),
    financial_overview: financialYears.every((f) => f.totalAsset && f.ebitda) && isDoc("financial_overview")
      && financialYears.every((f) => isDoc(`audited_financial_${f.year}`))
      && isDoc("credit_rating_evidence")
      && isDoc("ebitda_dscr_calculation"),
    requirements_fulfillment: (projectRequirements.length
      ? projectRequirements.every((_: string, i: number) => requirementAnswers[i] === true)
      : true) && isDoc("requirements_fulfillment"),
    final: agreedFinal,
  };

  const activeSectionIds = activeSections.map((s) => s.docId);
  const hasAdditionalDocs = additionalPhase1Docs.length > 0;
  const additionalDocsComplete = hasAdditionalDocs ? additionalPhase1Docs.every((d: { id: string }) => isDoc(d.id)) : true;
  const completedCount = activeSectionIds.filter((id) => sectionComplete[id]).length
    + (hasAdditionalDocs && additionalDocsComplete ? 1 : 0)
    + (sectionComplete.final ? 1 : 0);
  const totalSections = activeSections.length + (hasAdditionalDocs ? 1 : 0) + 1;
  const allComplete = activeSectionIds.every((id) => sectionComplete[id]) && additionalDocsComplete && sectionComplete.final;

  const scrollToFirstIncomplete = () => {
    // Check main sections
    for (const id of activeSectionIds) {
      if (!sectionComplete[id]) {
        const el = document.getElementById(`section-${id}`);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          setOpenSection(getSectionNumber(id));
        }
        return;
      }
    }
    // Check additional docs section
    if (hasAdditionalDocs && !additionalDocsComplete) {
      const el = document.getElementById("section-additional");
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        setOpenSection(additionalDocsSectionNumber);
      }
      return;
    }
    // Check final section
    if (!sectionComplete.final) {
      const el = document.getElementById("section-final");
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        setOpenSection(finalSectionNumber);
      }
    }
  };

  // ─── Experience Handlers ───

  const addExperience = (category: ExperienceCategory) => {
    const uid = crypto.randomUUID();
    const base = { uid, plantName: "", location: "", totalCapacityMW: "" };
    let newExp: CategorizedExperience;
    if (category === 'developer') {
      newExp = { ...base, category: 'developer', equityPercent: "", ippOrCaptive: "", codYear: "" };
    } else if (category === 'om_contractor') {
      newExp = { ...base, category: 'om_contractor', contractValueUSD: "", workPortionPercent: "", ippOrCaptive: "", codYear: "" };
    } else {
      newExp = { ...base, category: 'financing', financingType: "", amountUSD: "", year: "" };
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
  const changeExperienceCategory = (i: number, newCategory: ExperienceCategory) => {
    setExperiences((prev) => prev.map((e, idx) => {
      if (idx !== i) return e;
      const base = { uid: e.uid, plantName: e.plantName, location: e.location, totalCapacityMW: e.totalCapacityMW };
      if (newCategory === 'developer') return { ...base, category: 'developer' as const, equityPercent: "", ippOrCaptive: "", codYear: "" };
      if (newCategory === 'om_contractor') return { ...base, category: 'om_contractor' as const, contractValueUSD: "", workPortionPercent: "", ippOrCaptive: "", codYear: "" };
      return { ...base, category: 'financing' as const, financingType: "", amountUSD: "", year: "" };
    }));
  };

  const inputClass = "w-full rounded-lg border border-ptba-light-gray bg-ptba-off-white px-3 py-2 text-sm outline-none focus:border-ptba-steel-blue focus:ring-2 focus:ring-ptba-steel-blue/20";

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

  if (application && application.status !== "Draft") {
    return (
      <div className="space-y-6">
        <button onClick={() => router.back()} className="inline-flex items-center gap-1.5 text-sm text-ptba-steel-blue hover:text-ptba-navy">
          <ArrowLeft className="h-4 w-4" /> {tc("back")}
        </button>
        <div className="rounded-xl bg-white p-12 text-center shadow-sm">
          <CheckCircle2 className="mx-auto h-12 w-12 text-green-500" />
          <p className="mt-3 text-lg font-semibold text-ptba-charcoal">{t("alreadyRegistered")}</p>
          <p className="mt-1 text-sm text-ptba-gray">{t("statusLabel", { status: application.status })}</p>
          <button onClick={() => router.push(`/mitra/projects/${projectId}`)} className="mt-4 rounded-lg bg-ptba-navy px-4 py-2 text-sm font-medium text-white">
            {t("viewProjectDetail")}
          </button>
        </div>
      </div>
    );
  }

  if (!project || !project.isOpenForApplication) {
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

      {/* EoI Description */}
      <div className="rounded-xl bg-white shadow-sm overflow-hidden">
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
      </div>

      {/* Progress */}
      <div className="rounded-xl bg-ptba-navy/5 border border-ptba-navy/10 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-ptba-gray">{t("formCompleteness")}</span>
          <span className="text-sm font-bold text-ptba-navy">{t("sectionsCount", { completed: completedCount, total: totalSections })}</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-ptba-light-gray">
          <div className={cn("h-full rounded-full transition-all", allComplete ? "bg-green-500" : "bg-ptba-gold")} style={{ width: `${(completedCount / totalSections) * 100}%` }} />
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {/* ═══ Dynamic Sections Based on phase1Documents ═══ */}

      {/* ─── Section: Informasi & Profil Perusahaan (compro) ─── */}
      {hasDoc("compro") && (
        <Section
          id="section-compro"
          number={getSectionNumber("compro")}
          title={t("sections.companyInfo")}
          icon={Building2}
          complete={sectionComplete.compro}
          open={openSection === getSectionNumber("compro")}
          onToggle={() => setOpenSection(openSection === getSectionNumber("compro") ? 0 : getSectionNumber("compro"))}
        >
          <p className="text-xs text-ptba-gray">{t("sections.companyInfoDesc")}</p>

          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-ptba-charcoal">{t("companyFields.companyName")} <span className="text-ptba-red">*</span></label>
              <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-ptba-charcoal">{t("companyFields.companyCode")}</label>
              <input type="text" value={companyCode} readOnly className={cn(inputClass, "bg-ptba-light-gray/30")} />
            </div>
          </div>

          {/* Business Overview */}
          <div>
            <label className="mb-1 block text-xs font-medium text-ptba-charcoal">{t("companyFields.businessOverview")} <span className="text-ptba-red">*</span></label>
            <p className="mb-1 text-[10px] text-ptba-gray italic">{t("companyFields.businessOverviewHint")}</p>
            <textarea value={businessOverview} onChange={(e) => setBusinessOverview(e.target.value)} placeholder={t("companyFields.businessOverviewPlaceholder")} className={cn(inputClass, "min-h-[60px] resize-y")} />
          </div>

          {/* Addresses */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-ptba-charcoal">{t("companyFields.hqAddress")} <span className="text-ptba-red">*</span></label>
              <textarea value={companyAddress} onChange={(e) => setCompanyAddress(e.target.value)} className={cn(inputClass, "min-h-[60px] resize-y")} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-ptba-charcoal">{t("companyFields.indonesiaOffice")}</label>
              <textarea value={companyIndonesiaAddress} onChange={(e) => setCompanyIndonesiaAddress(e.target.value)} placeholder={t("companyFields.indonesiaOfficePlaceholder")} className={cn(inputClass, "min-h-[60px] resize-y")} />
            </div>
          </div>

          {/* Contact & Legal */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-ptba-charcoal">{t("companyFields.companyPhone")}</label>
              <input type="text" value={companyPhone} onChange={(e) => setCompanyPhone(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-ptba-charcoal">{t("companyFields.companyEmail")}</label>
              <input type="email" value={companyEmail} onChange={(e) => setCompanyEmail(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-ptba-charcoal">{t("companyFields.website")}</label>
              <input type="text" value={companyWebsite} onChange={(e) => setCompanyWebsite(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-ptba-charcoal">{t("companyFields.nib")}</label>
              <p className="mb-1 text-[10px] text-ptba-gray italic">Upload NIB document (PDF)</p>
              <FileUploadButton
                label="NIB Document"
                accept=".pdf"
                uploaded={isDoc("nib_document")}
                uploading={uploadedDocs["nib_document"]?.uploading ?? false}
                fileName={uploadedDocs["nib_document"]?.name}
                onSelect={(f) => uploadDoc("nib_document", "NIB Document", f)}
                onDelete={() => deleteDoc("nib_document")}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-ptba-charcoal">{t("companyFields.yearEstablished")}</label>
              <input type="text" value={yearEstablished} onChange={(e) => setYearEstablished(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-ptba-charcoal">{t("companyFields.country")}</label>
              <input type="text" value={countryEstablished} onChange={(e) => setCountryEstablished(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-ptba-charcoal">{t("companyFields.status")}</label>
              <input type="text" value={companyStatus} readOnly className={cn(inputClass, "bg-ptba-light-gray/30")} />
            </div>
          </div>

          {/* Org Structure & Subsidiaries */}
          <div>
            <label className="mb-1 block text-xs font-medium text-ptba-charcoal">{t("companyFields.orgStructure")}</label>
            <p className="mb-1 text-[10px] text-ptba-gray italic">Upload company organizational structure (PDF or image)</p>
            <FileUploadButton
              label="Company Organizational Structure"
              accept=".pdf,.png,.jpg,.jpeg"
              uploaded={isDoc("org_structure")}
              uploading={uploadedDocs["org_structure"]?.uploading ?? false}
              fileName={uploadedDocs["org_structure"]?.name}
              onSelect={(f) => uploadDoc("org_structure", "Organizational Structure", f)}
              onDelete={() => deleteDoc("org_structure")}
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
                <label className="mb-1 block text-xs font-medium text-ptba-charcoal">{t("companyFields.cpName")}</label>
                <input type="text" value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-ptba-charcoal">{t("companyFields.cpPhone")}</label>
                <input type="text" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-ptba-charcoal">{t("companyFields.cpEmail")}</label>
                <input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} className={inputClass} />
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
            />
          </div>
        </Section>
      )}

      {/* ─── Section: Surat Pernyataan EoI (statement_eoi) ─── */}
      {hasDoc("statement_eoi") && (
        <Section
          id="section-statement_eoi"
          number={getSectionNumber("statement_eoi")}
          title={t("sections.eoiStatement")}
          icon={PenLine}
          complete={sectionComplete.statement_eoi}
          open={openSection === getSectionNumber("statement_eoi")}
          onToggle={() => setOpenSection(openSection === getSectionNumber("statement_eoi") ? 0 : getSectionNumber("statement_eoi"))}
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
                  className={inputClass}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-ptba-charcoal">{t("eoiFields.signerPosition")} <span className="text-ptba-red">*</span></label>
                <input
                  type="text"
                  placeholder={t("eoiFields.signerPositionPlaceholder")}
                  value={signerPosition}
                  onChange={(e) => setSignerPosition(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-ptba-charcoal">{t("eoiFields.signerDate")} <span className="text-ptba-red">*</span></label>
                <input
                  type="date"
                  onClick={(e) => (e.target as HTMLInputElement).showPicker?.()}
                  value={signerDate}
                  onChange={(e) => setSignerDate(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          {/* JV Equity & Cash on Hand — side by side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-lg border border-ptba-light-gray p-4">
              <label className="mb-1 block text-xs font-semibold text-ptba-charcoal">{t("eoiFields.equityPercent")}</label>
              <p className="mb-2 text-[10px] text-ptba-gray italic">{t("eoiFields.equityPercentHint")}</p>
              <div className="relative">
                <input type="text" value={minorityEquityPercent} onChange={(e) => setMinorityEquityPercent(e.target.value)} placeholder="35" className={cn(inputClass, "pr-10")} />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-ptba-gray">%</span>
              </div>
            </div>
            <div className="rounded-lg border border-ptba-light-gray p-4">
              <label className="mb-1 block text-xs font-semibold text-ptba-charcoal">{t("eoiFields.cashOnHand")}</label>
              <p className="mb-2 text-[10px] text-ptba-gray italic">{t("eoiFields.cashOnHandHint")}</p>
              <div className="relative">
                <input type="text" value={cashOnHand} onChange={(e) => setCashOnHand(e.target.value)} placeholder="350,000,000" className={cn(inputClass, "pr-14")} />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-ptba-gray">USD</span>
              </div>
            </div>
          </div>

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
            />
          </div>
        </Section>
      )}

      {/* ─── Section: Pengalaman & Portfolio Proyek (portfolio) ─── */}
      {hasDoc("portfolio") && (
        <Section
          id="section-portfolio"
          number={getSectionNumber("portfolio")}
          title={t("sections.portfolio")}
          icon={Briefcase}
          complete={sectionComplete.portfolio}
          open={openSection === getSectionNumber("portfolio")}
          onToggle={() => setOpenSection(openSection === getSectionNumber("portfolio") ? 0 : getSectionNumber("portfolio"))}
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
                <button onClick={() => removeExperience(i)} className="text-ptba-red hover:text-red-700 transition-colors">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Category selector */}
                <div className="md:col-span-2">
                  <label className="mb-1 block text-xs font-medium text-ptba-charcoal">{t("portfolioFields.experienceCategory")} <span className="text-ptba-red">*</span></label>
                  <select value={exp.category} onChange={(e) => changeExperienceCategory(i, e.target.value as ExperienceCategory)} className={inputClass}>
                    {EXPERIENCE_CATEGORIES.map((cat) => (
                      <option key={cat.key} value={cat.key}>
                        {t(`portfolioFields.category${cat.key === 'developer' ? 'Developer' : cat.key === 'om_contractor' ? 'OmContractor' : 'Financing'}`)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Common fields */}
                <div>
                  <label className="mb-1 block text-xs font-medium text-ptba-charcoal">{t("portfolioFields.plantName")} <span className="text-ptba-red">*</span></label>
                  <input type="text" value={exp.plantName} onChange={(e) => updateExperience(i, "plantName", e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-ptba-charcoal">{t("portfolioFields.location")} <span className="text-ptba-red">*</span></label>
                  <input type="text" value={exp.location} onChange={(e) => updateExperience(i, "location", e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-ptba-charcoal">{t("portfolioFields.totalCapacity")} <span className="text-ptba-red">*</span></label>
                  <input type="text" placeholder={t("portfolioFields.capacityPlaceholder")} value={exp.totalCapacityMW} onChange={(e) => updateExperience(i, "totalCapacityMW", e.target.value)} className={inputClass} />
                </div>

                {/* Developer-specific fields */}
                {exp.category === 'developer' && (
                  <>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-ptba-charcoal">{t("portfolioFields.equity")} <span className="text-ptba-red">*</span></label>
                      <input type="text" placeholder={t("portfolioFields.equityPlaceholder")} value={exp.equityPercent} onChange={(e) => updateExperience(i, "equityPercent", e.target.value)} className={inputClass} />
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
                      <input type="text" placeholder={t("portfolioFields.codYearPlaceholder")} value={exp.codYear} onChange={(e) => updateExperience(i, "codYear", e.target.value)} className={inputClass} />
                    </div>
                  </>
                )}

                {/* O&M Contractor-specific fields */}
                {exp.category === 'om_contractor' && (
                  <>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-ptba-charcoal">{t("portfolioFields.contractValue")} <span className="text-ptba-red">*</span></label>
                      <input type="text" placeholder={t("portfolioFields.contractValuePlaceholder")} value={exp.contractValueUSD} onChange={(e) => updateExperience(i, "contractValueUSD", e.target.value)} className={inputClass} />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-ptba-charcoal">{t("portfolioFields.workPortion")} <span className="text-ptba-red">*</span></label>
                      <input type="text" placeholder={t("portfolioFields.workPortionPlaceholder")} value={exp.workPortionPercent} onChange={(e) => updateExperience(i, "workPortionPercent", e.target.value)} className={inputClass} />
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
                      <input type="text" placeholder={t("portfolioFields.codYearPlaceholder")} value={exp.codYear} onChange={(e) => updateExperience(i, "codYear", e.target.value)} className={inputClass} />
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
                      <input type="text" placeholder={t("portfolioFields.amountPlaceholder")} value={exp.amountUSD} onChange={(e) => updateExperience(i, "amountUSD", e.target.value)} className={inputClass} />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-ptba-charcoal">{t("portfolioFields.year")} <span className="text-ptba-red">*</span></label>
                      <input type="text" placeholder={t("portfolioFields.yearPlaceholder")} value={exp.year} onChange={(e) => updateExperience(i, "year", e.target.value)} className={inputClass} />
                    </div>
                  </>
                )}
              </div>

              {/* Per-experience credential document */}
              <div className="pt-1">
                <FileUploadButton
                  label={t("portfolioFields.credentialDoc")}
                  accept=".pdf"
                  uploaded={isDoc(`credential_exp_${exp.uid}`)}
                  uploading={uploadedDocs[`credential_exp_${exp.uid}`]?.uploading ?? false}
                  fileName={uploadedDocs[`credential_exp_${exp.uid}`]?.name}
                  onSelect={(f) => uploadDoc(`credential_exp_${exp.uid}`, `Credential - ${exp.plantName || 'Experience'}`, f)}
                  onDelete={() => deleteDoc(`credential_exp_${exp.uid}`)}
                />
              </div>
            </div>
          ))}

          <button
            onClick={() => addExperience('developer')}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-ptba-steel-blue/30 py-3 text-sm font-medium text-ptba-steel-blue hover:bg-ptba-steel-blue/5 transition-colors"
          >
            <Plus className="h-4 w-4" />
            {t("portfolioFields.addExperience")}
          </button>

          <div className="space-y-2 pt-2">
            <p className="text-xs font-semibold text-ptba-charcoal">{t("portfolioFields.portfolioDoc")} <span className="text-ptba-red">*</span></p>
            <FileUploadButton
              label={t("portfolioFields.portfolioDocLabel")}
              accept=".pdf"
              uploaded={isDoc("portfolio")}
              uploading={uploadedDocs["portfolio"]?.uploading ?? false}
              fileName={uploadedDocs["portfolio"]?.name}
              onSelect={(f) => uploadDoc("portfolio", "Portfolio", f)}
              templateFileName={getTemplateInfo("portfolio")?.fileName}
              onDownloadTemplate={() => downloadTemplate("portfolio")}
              onDelete={() => deleteDoc("portfolio")}
            />
          </div>
        </Section>
      )}

      {/* ─── Section: Gambaran Umum Keuangan (financial_overview) ─── */}
      {hasDoc("financial_overview") && (
        <Section
          id="section-financial_overview"
          number={getSectionNumber("financial_overview")}
          title={t("sections.financialOverview")}
          icon={DollarSign}
          complete={sectionComplete.financial_overview}
          open={openSection === getSectionNumber("financial_overview")}
          onToggle={() => setOpenSection(openSection === getSectionNumber("financial_overview") ? 0 : getSectionNumber("financial_overview"))}
        >
          <p className="text-xs text-ptba-gray">{t("sections.financialOverviewDesc")}</p>

          {/* Year Range Selector */}
          <div className="mt-3 mb-1">
            <label className="mb-1.5 block text-xs font-semibold text-ptba-charcoal">{t("financialFields.yearRange")}</label>
            <p className="text-[10px] text-ptba-gray mb-2">{t("financialFields.yearRangeHint")}</p>
            <div className="flex gap-2">
              {YEAR_RANGE_OPTIONS.map((range, idx) => {
                const key = range.join("-");
                const isSelected = selectedRangeKey === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleYearRangeChange(idx)}
                    className={cn(
                      "rounded-lg px-3 py-1.5 text-xs font-medium border transition-colors",
                      isSelected
                        ? "bg-ptba-navy text-white border-ptba-navy"
                        : "bg-white text-ptba-charcoal border-ptba-light-gray hover:border-ptba-steel-blue"
                    )}
                  >
                    {range[0]}–{range[2]}
                  </button>
                );
              })}
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
                {[
                  { key: "totalAsset" as const, label: t("financialFields.totalAsset") },
                  { key: "ebitda" as const, label: t("financialFields.ebitda") },
                  { key: "dscr" as const, label: t("financialFields.dscr") },
                ].map((row) => (
                  <tr key={row.key} className="border-b border-ptba-light-gray/50">
                    <td className="py-2 pr-3 text-xs font-medium text-ptba-charcoal">{row.label} <span className="text-ptba-red">*</span></td>
                    {financialYears.map((fy, i) => (
                      <td key={fy.year} className="py-2 px-2">
                        <input
                          type="text"
                          placeholder="0"
                          value={fy[row.key]}
                          onChange={(e) => {
                            const next = [...financialYears]; next[i][row.key] = e.target.value; setFinancialYears(next);
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
            <label className="block text-xs font-medium text-ptba-charcoal">{t("financialFields.ratingAgency")}</label>
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
                <label className="mb-1 block text-xs font-medium text-ptba-charcoal">{t("financialFields.ratingValue")} ({creditRatingAgency})</label>
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
            />
          </div>

          {/* Financial Overview Document */}
          <div className="space-y-2 pt-2">
            <p className="text-xs font-semibold text-ptba-charcoal">{t("financialFields.financialDoc")} <span className="text-ptba-red">*</span></p>
            <FileUploadButton
              label={t("financialFields.financialDocLabel")}
              accept=".pdf"
              uploaded={isDoc("financial_overview")}
              uploading={uploadedDocs["financial_overview"]?.uploading ?? false}
              fileName={uploadedDocs["financial_overview"]?.name}
              onSelect={(f) => uploadDoc("financial_overview", "Gambaran Umum Keuangan", f)}
              templateFileName={getTemplateInfo("financial_overview")?.fileName}
              onDownloadTemplate={() => downloadTemplate("financial_overview")}
              onDelete={() => deleteDoc("financial_overview")}
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
          title={t("sections.requirementsFulfillment")}
          icon={ClipboardCheck}
          complete={sectionComplete.requirements_fulfillment}
          open={openSection === getSectionNumber("requirements_fulfillment")}
          onToggle={() => setOpenSection(openSection === getSectionNumber("requirements_fulfillment") ? 0 : getSectionNumber("requirements_fulfillment"))}
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
          open={openSection === additionalDocsSectionNumber}
          onToggle={() => setOpenSection(openSection === additionalDocsSectionNumber ? 0 : additionalDocsSectionNumber)}
        >
          <p className="text-xs text-ptba-gray">{t("sections.additionalDocsDesc")}</p>
          <div className="space-y-2">
            {additionalPhase1Docs.map((doc: { id: string; name: string; description: string }) => (
              <FileUploadButton
                key={doc.id}
                label={`${doc.name}${doc.description ? ` — ${doc.description}` : ""}`}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                uploaded={isDoc(doc.id)}
                uploading={uploadedDocs[doc.id]?.uploading ?? false}
                fileName={uploadedDocs[doc.id]?.name}
                onSelect={(f) => uploadDoc(doc.id, doc.name, f)}
                onDelete={() => deleteDoc(doc.id)}
                templateFileName={getTemplateInfo(doc.id)?.fileName}
                onDownloadTemplate={() => downloadTemplate(doc.id)}
              />
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
        open={openSection === finalSectionNumber}
        onToggle={() => setOpenSection(openSection === finalSectionNumber ? 0 : finalSectionNumber)}
      >
        <div className="rounded-lg bg-ptba-section-bg p-4 text-sm text-ptba-charcoal leading-relaxed">
          {t("finalStatement.declaration")}
        </div>

        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={agreedFinal}
            onChange={(e) => setAgreedFinal(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-ptba-light-gray text-ptba-navy focus:ring-ptba-steel-blue"
          />
          <span className="text-sm text-ptba-gray">
            {t.rich("finalStatement.agreeStatement", { strong: (chunks) => <strong>{chunks}</strong> })}
          </span>
        </label>
      </Section>

      {/* ═══ Submit Bar ═══ */}
      <div className="rounded-xl bg-white p-5 shadow-sm">
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
              onClick={allComplete ? handleSubmit : scrollToFirstIncomplete}
              disabled={submitting}
              className={cn(
                "inline-flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-bold transition-colors",
                allComplete && !submitting
                  ? "bg-ptba-gold text-ptba-charcoal hover:bg-ptba-gold-light"
                  : "bg-ptba-light-gray text-ptba-gray hover:bg-ptba-light-gray/80"
              )}
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {submitting ? t("submitBar.submitting") : t("submitBar.submitEoi")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
