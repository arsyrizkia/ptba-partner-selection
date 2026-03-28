"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, Upload, CheckCircle2, Loader2, ChevronDown, ChevronRight, ImageIcon, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { PHASE1_DOCUMENT_TYPES, PHASE2_DOCUMENT_TYPES, PHASE3_DOCUMENT_TYPES, LEGACY_DOCUMENT_TYPES } from "@/lib/constants/document-types";
import { useAuth } from "@/lib/auth/auth-context";
import { authApi } from "@/lib/api/client";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import type { UserRole } from "@/lib/types";

// ── Constants ──────────────────────────────────────────────────────
const STEPS = [
  { key: 1, label: "Informasi Dasar" },
  { key: 2, label: "Timeline & Pendaftaran" },
  { key: 3, label: "Persyaratan & Dokumen" },
  { key: 4, label: "Penunjukan PIC" },
  { key: 5, label: "Ringkasan" },
];

const PROJECT_TYPES = [
  { value: "", label: "Pilih Sektor Proyek" },
  { value: "mining", label: "Operasi Pertambangan" },
  { value: "power_generation", label: "Pembangkit Listrik" },
  { value: "coal_processing", label: "Pengolahan Batubara" },
  { value: "infrastructure", label: "Infrastruktur" },
  { value: "environmental", label: "Lingkungan & Reklamasi" },
  { value: "corporate", label: "Layanan Korporat" },
  { value: "others", label: "Lainnya" },
];

const CATEGORY_LABELS: Record<string, string> = {
  legal: "Legal",
  keuangan: "Keuangan",
  teknis: "Teknis",
  administrasi: "Administrasi",
};

const CATEGORIES = ["legal", "keuangan", "teknis", "administrasi"] as const;

const PHASE_PIC_CONFIG = {
  phase1: {
    label: "Fase 1 — Filter Evaluasi",
    roles: [
      { role: "ebd" as UserRole, label: "Energy Business Development", multi: true, description: "Evaluator Fase 1 (boleh lebih dari 1)" },
      { role: "ketua_tim" as UserRole, label: "Ketua Tim", multi: false, description: "Approver" },
    ],
  },
  phase2: {
    label: "Fase 2 — Pra-Kualifikasi (PQ)",
    roles: [
      { role: "ebd" as UserRole, label: "EBD — Pasar", multi: true, subcategory: "pasar", description: "Evaluasi pasar" },
      { role: "ebd" as UserRole, label: "EBD — Teknis", multi: true, subcategory: "teknis", description: "Evaluasi teknis" },
      { role: "ebd" as UserRole, label: "EBD — Komersial", multi: true, subcategory: "komersial", description: "Evaluasi ESG/komersial" },
      { role: "keuangan" as UserRole, label: "Corporate Finance", multi: false, description: "Evaluasi keuangan" },
      { role: "hukum" as UserRole, label: "Legal & Regulatory Affairs", multi: false, description: "Evaluasi hukum" },
      { role: "risiko" as UserRole, label: "Risk Management", multi: false, description: "Evaluasi risiko" },
      { role: "ketua_tim" as UserRole, label: "Ketua Tim", multi: false, description: "Approver" },
    ],
  },
  phase3: {
    label: "Fase 3 — RFP & Proposal",
    roles: [
      { role: "ebd" as UserRole, label: "Energy Business Development", multi: true, description: "Evaluator Fase 3 (boleh lebih dari 1)" },
      { role: "ketua_tim" as UserRole, label: "Ketua Tim", multi: false, description: "Approver" },
    ],
  },
} as const;

type PhaseKey = keyof typeof PHASE_PIC_CONFIG;

// ── Types ──────────────────────────────────────────────────────────
interface InternalUser {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  status: string;
}

export interface SupportingFileNew {
  file: File;
  name: string;
  phase?: string;
}

export interface SupportingFileExisting {
  id: string;
  name: string;
  fileKey?: string;
  phase?: string;
}

export type SupportingFile = SupportingFileNew | SupportingFileExisting;

function isExistingFile(f: SupportingFile): f is SupportingFileExisting {
  return "id" in f;
}

function isNewFile(f: SupportingFile): f is SupportingFileNew {
  return "file" in f;
}

type PhasePicEntry = { phase: string; role: string; subcategory?: string; userId: string; userName?: string };

export interface ProjectFormData {
  projectName: string;
  projectType: string;
  description: string;
  startDate: string;
  endDate: string;
  phase1Deadline: string;
  phase2Deadline: string;
  phase3Deadline: string;
  isOpenForApplication: boolean;
  requirements: string[];
  selectedPhase1Docs: string[];
  selectedPhase2Docs: string[];
  selectedPhase3Docs: string[];
  selectedLegacyDocs: Record<string, "phase1" | "phase2" | "phase3" | "both">;
  customDocuments: { name: string; phase: "phase1" | "phase2" | "phase3" | "both" }[];
  picAssignments: Record<string, string>;
  phasePics: PhasePicEntry[];
  supportingFiles: SupportingFile[];
  internalUsers: InternalUser[];
  coverImageFile?: File | null;
  descriptionImageFiles?: File[];
  // Project Viability & Financial Projection
  location: string;
  capacityMw: string;
  indicativeCapex: string;
  npv: string;
  der: string;
  lifetime: string;
  projectIrr: string;
  equityIrr: string;
  paybackPeriod: string;
  wacc: string;
  tariffLevelized: string;
  bppValue: string;
  bppLocation: string;
}

export interface ProjectFormProps {
  mode: "create" | "edit";
  projectId?: string;
  initialData?: any; // existing project data for edit mode
  onSubmit: (formData: ProjectFormData, templateFiles: Record<string, File>, andPublish?: boolean) => Promise<void>;
  submitting: boolean;
  submitError: string;
  /** For edit mode: callback to upload a file immediately */
  onFileUpload?: (file: File) => Promise<SupportingFileExisting | null>;
  /** For edit mode: callback to delete an existing supporting file */
  onFileDelete?: (fileId: string) => Promise<void>;
  uploadingFile?: boolean;
  /** Where to navigate on cancel (step 1) */
  cancelHref: string;
}

function formatDateForInput(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    return d.toISOString().split("T")[0];
  } catch {
    return "";
  }
}

// ── Component ──────────────────────────────────────────────────────
export default function ProjectForm({
  mode,
  projectId,
  initialData,
  onSubmit,
  submitting,
  submitError,
  onFileUpload,
  onFileDelete,
  uploadingFile = false,
  cancelHref,
}: ProjectFormProps) {
  const router = useRouter();
  const { accessToken } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);

  // Internal users for PIC
  const [internalUsers, setInternalUsers] = useState<InternalUser[]>([]);

  useEffect(() => {
    if (!accessToken) return;
    authApi().listUsers(accessToken).then((res) => {
      setInternalUsers(res.users.filter((u: InternalUser) => u.role !== "mitra" && u.status === "active"));
    }).catch(() => {});
  }, [accessToken]);

  // Step 1
  const [projectName, setProjectName] = useState("");
  const [projectType, setProjectType] = useState("");
  const [description, setDescription] = useState("");
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);
  const [descriptionImageFiles, setDescriptionImageFiles] = useState<File[]>([]);
  const [descriptionImagePreviews, setDescriptionImagePreviews] = useState<string[]>([]);
  const [existingDescriptionImages, setExistingDescriptionImages] = useState<{ id: string; url: string }[]>([]);

  // Step 1 — Project Viability & Financial Projection
  const [location, setLocation] = useState("");
  const [capacityMw, setCapacityMw] = useState("");
  const [indicativeCapex, setIndicativeCapex] = useState("");
  const [npv, setNpv] = useState("");
  const [der, setDer] = useState("");
  const [lifetime, setLifetime] = useState("");
  const [projectIrr, setProjectIrr] = useState("");
  const [equityIrr, setEquityIrr] = useState("");
  const [paybackPeriod, setPaybackPeriod] = useState("");
  const [wacc, setWacc] = useState("");
  const [tariffLevelized, setTariffLevelized] = useState("");
  const [bppValue, setBppValue] = useState("");
  const [bppLocation, setBppLocation] = useState("");

  // Step 2
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [phase1Deadline, setPhase1Deadline] = useState("");
  const [phase2Deadline, setPhase2Deadline] = useState("");
  const [phase3Deadline, setPhase3Deadline] = useState("");
  const [supportingFiles, setSupportingFiles] = useState<SupportingFile[]>([]);
  const [isOpenForApplication, setIsOpenForApplication] = useState(false);

  // Step 3
  const [requirements, setRequirements] = useState<string[]>([""]);
  const [selectedPhase1Docs, setSelectedPhase1Docs] = useState<string[]>(
    PHASE1_DOCUMENT_TYPES.filter((d) => d.required).map((d) => d.id)
  );
  const [selectedPhase2Docs, setSelectedPhase2Docs] = useState<string[]>(
    PHASE2_DOCUMENT_TYPES.filter((d) => d.required).map((d) => d.id)
  );
  const [selectedPhase3Docs, setSelectedPhase3Docs] = useState<string[]>(
    PHASE3_DOCUMENT_TYPES.filter((d) => d.required).map((d) => d.id)
  );
  const [selectedLegacyDocs, setSelectedLegacyDocs] = useState<Record<string, "phase1" | "phase2" | "phase3" | "both">>({});
  const [customDocuments, setCustomDocuments] = useState<{ name: string; phase: "phase1" | "phase2" | "phase3" | "both" }[]>([]);

  // Template files per document type ID
  const [templateFiles, setTemplateFiles] = useState<Record<string, File>>({});

  // Accordion state for legacy doc categories
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({});
  const toggleCategory = (cat: string) => setOpenCategories((p) => ({ ...p, [cat]: !p[cat] }));

  // Step 4 - PIC Assignments
  const [phasePics, setPhasePics] = useState<PhasePicEntry[]>([]);
  const [picPhaseTab, setPicPhaseTab] = useState<PhaseKey>("phase1");

  const [stepError, setStepError] = useState("");

  // ── Pre-fill from initialData (edit mode) ──────────────────────
  useEffect(() => {
    if (mode !== "edit" || !initialData) return;
    const project = initialData;

    // Step 1
    setProjectName(project.name || "");
    setProjectType(project.type || "");
    setDescription(typeof project.description === "string" ? project.description : "");

    // Step 1 — Viability & Financial
    setLocation(project.location || "");
    setCapacityMw(project.capacityMw || project.capacity_mw || "");
    setIndicativeCapex(project.indicativeCapex || project.indicative_capex || "");
    setNpv(project.npv || "");
    setDer(project.der || "");
    setLifetime(project.lifetime || "");
    setProjectIrr(project.projectIrr || project.project_irr || "");
    setEquityIrr(project.equityIrr || project.equity_irr || "");
    setPaybackPeriod(project.paybackPeriod || project.payback_period || "");
    setWacc(project.wacc || "");
    setTariffLevelized(project.tariffLevelized || project.tariff_levelized || "");
    setBppValue(project.bppValue || project.bpp_value || "");
    setBppLocation(project.bppLocation || project.bpp_location || "");

    // Step 2
    setStartDate(formatDateForInput(project.startDate as string));
    setEndDate(formatDateForInput(project.endDate as string));
    setPhase1Deadline(formatDateForInput(project.phase1Deadline as string));
    setPhase2Deadline(formatDateForInput(project.phase2Deadline as string));
    setPhase3Deadline(formatDateForInput(project.phase3Deadline as string));
    setIsOpenForApplication(!!project.isOpenForApplication);

    // Cover image preview
    if (project.coverImageKey && accessToken) {
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002/api";
      fetch(`${API_BASE}/documents/download/${project.coverImageKey}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      }).then(r => r.json()).then(d => { if (d.url) setCoverImagePreview(d.url); }).catch(() => {});
    }

    // Description images
    if (project.projectImages && Array.isArray(project.projectImages) && accessToken) {
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002/api";
      Promise.all(
        project.projectImages.map(async (img: any) => {
          try {
            const r = await fetch(`${API_BASE}/documents/download/${img.fileKey}`, {
              headers: { Authorization: `Bearer ${accessToken}` },
            });
            const d = await r.json();
            return { id: img.id, url: d.url || "" };
          } catch { return { id: img.id, url: "" }; }
        })
      ).then(setExistingDescriptionImages);
    }

    // Supporting files from ptbaDocuments
    if (project.ptbaDocuments && Array.isArray(project.ptbaDocuments)) {
      setSupportingFiles(project.ptbaDocuments.map((d: any) => ({
        id: d.id,
        name: d.name || d.fileName || "",
        fileKey: d.fileKey,
        phase: d.phase || "phase1",
      })));
    }

    // Step 3: Requirements
    if (project.requirements && Array.isArray(project.requirements) && project.requirements.length > 0) {
      setRequirements(project.requirements.map((r: any) => (typeof r === "string" ? r : r.requirement || "")));
    }

    // Required documents
    if (project.requiredDocuments && Array.isArray(project.requiredDocuments)) {
      const p1Docs: string[] = [];
      const p2Docs: string[] = [];
      const p3Docs: string[] = [];
      const legacyDocs: Record<string, "phase1" | "phase2" | "phase3" | "both"> = {};

      const phase1Ids = new Set(PHASE1_DOCUMENT_TYPES.map((d) => d.id));
      const phase2Ids = new Set(PHASE2_DOCUMENT_TYPES.map((d) => d.id));
      const phase3Ids = new Set(PHASE3_DOCUMENT_TYPES.map((d) => d.id));
      const legacyIds = new Set(LEGACY_DOCUMENT_TYPES.map((d) => d.id));
      const customDocs: { name: string; phase: "phase1" | "phase2" | "phase3" | "both" }[] = [];

      for (const doc of project.requiredDocuments) {
        const docId = doc.documentTypeId;
        const phase = doc.phase;

        if (phase1Ids.has(docId) && (phase === "phase1" || !phase)) {
          p1Docs.push(docId);
        } else if (phase2Ids.has(docId) && (phase === "phase2" || !phase)) {
          p2Docs.push(docId);
        } else if (phase3Ids.has(docId) && (phase === "phase3" || !phase)) {
          p3Docs.push(docId);
        } else if (legacyIds.has(docId)) {
          legacyDocs[docId] = phase === "general" ? "both" : (phase as "phase1" | "phase2" | "phase3" | "both");
        } else {
          // Custom document — not in any predefined list
          const docPhase = phase === "general" ? "both" : (phase as "phase1" | "phase2" | "phase3" | "both") || "both";
          // Strip "custom_" prefix and convert underscores to spaces
          const displayName = docId.startsWith("custom_") ? docId.slice(7).replace(/_/g, " ") : docId.replace(/_/g, " ");
          customDocs.push({ name: displayName, phase: docPhase });
        }
      }

      if (p1Docs.length > 0) setSelectedPhase1Docs(p1Docs);
      if (p2Docs.length > 0) setSelectedPhase2Docs(p2Docs);
      if (p3Docs.length > 0) setSelectedPhase3Docs(p3Docs);
      if (Object.keys(legacyDocs).length > 0) setSelectedLegacyDocs(legacyDocs);
      if (customDocs.length > 0) setCustomDocuments(customDocs);
    }

    // Step 4: PIC Assignments
    if (project.phasePics && Array.isArray(project.phasePics)) {
      setPhasePics(project.phasePics.map((p: any) => ({
        phase: p.phase,
        role: p.role,
        subcategory: p.subcategory || undefined,
        userId: p.userId,
        userName: p.userName || undefined,
      })));
    } else if (project.picAssignments && Array.isArray(project.picAssignments)) {
      setPhasePics(project.picAssignments.map((p: any) => ({
        phase: 'phase1',
        role: p.role,
        userId: p.userId,
        userName: p.userName || undefined,
      })));
    }
  }, [mode, initialData]);

  // ── Validation ─────────────────────────────────────────────────
  const validateStep = (step: number): string | null => {
    switch (step) {
      case 1:
        if (!projectName.trim()) return "Nama proyek wajib diisi";
        if (!projectType) return "Tipe proyek wajib dipilih";
        return null;
      case 2:
        if (!startDate) return "Tanggal mulai wajib diisi";
        if (!endDate) return "Tanggal selesai wajib diisi";
        return null;
      case 3:
        if (selectedPhase1Docs.length === 0) return "Pilih minimal 1 dokumen Fase 1";
        return null;
      case 4:
        return null;
      default:
        return null;
    }
  };

  const goNext = () => {
    const err = validateStep(currentStep);
    if (err) {
      setStepError(err);
      return;
    }
    setStepError("");
    if (currentStep < 5) setCurrentStep((prev) => prev + 1);
  };
  const goPrev = () => {
    setStepError("");
    if (currentStep > 1) setCurrentStep((prev) => prev - 1);
  };

  // ── Requirements handlers ──────────────────────────────────────
  const addRequirement = () => setRequirements((prev) => [...prev, ""]);
  const removeRequirement = (index: number) => {
    if (requirements.length <= 1) return;
    setRequirements((prev) => prev.filter((_, i) => i !== index));
  };
  const updateRequirement = (index: number, value: string) => {
    setRequirements((prev) => prev.map((r, i) => (i === index ? value : r)));
  };

  // ── Document selection handlers ────────────────────────────────
  const toggleDoc = (docId: string, list: string[], setList: (v: string[]) => void) => {
    setList(list.includes(docId) ? list.filter((id) => id !== docId) : [...list, docId]);
  };

  // ── Custom document handlers ───────────────────────────────────
  const addCustomDocument = () => setCustomDocuments((prev) => [...prev, { name: "", phase: "both" }]);
  const removeCustomDocument = (index: number) => {
    setCustomDocuments((prev) => prev.filter((_, i) => i !== index));
  };
  const updateCustomDocName = (index: number, value: string) => {
    setCustomDocuments((prev) => prev.map((d, i) => (i === index ? { ...d, name: value } : d)));
  };
  const updateCustomDocPhase = (index: number, value: "phase1" | "phase2" | "phase3" | "both") => {
    setCustomDocuments((prev) => prev.map((d, i) => (i === index ? { ...d, phase: value } : d)));
  };

  // ── Supporting files handlers ──────────────────────────────────
  const handleAddFileWithPhase = (phase: string) => {
    if (mode === "edit" && onFileUpload) {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png";
      input.onchange = async (e) => {
        const f = (e.target as HTMLInputElement).files?.[0];
        if (f) {
          const result = await onFileUpload(f);
          if (result) {
            setSupportingFiles((prev) => [...prev, { ...result, phase }]);
          }
        }
      };
      input.click();
    } else {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png";
      input.onchange = (e) => {
        const f = (e.target as HTMLInputElement).files?.[0];
        if (f) setSupportingFiles((prev) => [...prev, { file: f, name: f.name, phase }]);
      };
      input.click();
    }
  };

  const handleAddFile = () => handleAddFileWithPhase("phase1");

  const removeFile = async (index: number) => {
    const file = supportingFiles[index];
    if (mode === "edit" && isExistingFile(file) && file.id && onFileDelete) {
      await onFileDelete(file.id);
    }
    setSupportingFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // ── PIC handlers ───────────────────────────────────────────────
  const addPhasePic = (phase: string, role: string, userId: string, subcategory?: string) => {
    const user = internalUsers.find((u) => u.id === userId);
    setPhasePics((prev) => [
      ...prev.filter((p) => !(p.phase === phase && p.role === role && p.subcategory === subcategory && p.userId === userId)),
      { phase, role, subcategory, userId, userName: user?.name },
    ]);
  };

  const removePhasePic = (phase: string, role: string, userId: string, subcategory?: string) => {
    setPhasePics((prev) =>
      prev.filter((p) => !(p.phase === phase && p.role === role && (p.subcategory ?? undefined) === subcategory && p.userId === userId))
    );
  };

  const setSinglePhasePic = (phase: string, role: string, userId: string, subcategory?: string) => {
    const user = internalUsers.find((u) => u.id === userId);
    setPhasePics((prev) => [
      ...prev.filter((p) => !(p.phase === phase && p.role === role && (p.subcategory ?? undefined) === subcategory)),
      ...(userId ? [{ phase, role, subcategory, userId, userName: user?.name }] : []),
    ]);
  };

  const getPhasePicsFor = (phase: string, role: string, subcategory?: string) => {
    return phasePics.filter((p) => p.phase === phase && p.role === role && (p.subcategory ?? undefined) === subcategory);
  };

  // ── Submit ─────────────────────────────────────────────────────
  const handleSubmit = async (andPublish = false) => {
    await onSubmit(
      {
        projectName,
        projectType,
        description,
        startDate,
        endDate,
        phase1Deadline,
        phase2Deadline,
        phase3Deadline,
        isOpenForApplication,
        requirements,
        selectedPhase1Docs,
        selectedPhase2Docs,
        selectedPhase3Docs,
        selectedLegacyDocs,
        customDocuments,
        picAssignments: {},
        phasePics,
        supportingFiles,
        internalUsers,
        coverImageFile,
        descriptionImageFiles,
        location,
        capacityMw,
        indicativeCapex,
        npv,
        der,
        lifetime,
        projectIrr,
        equityIrr,
        paybackPeriod,
        wacc,
        tariffLevelized,
        bppValue,
        bppLocation,
      },
      templateFiles,
      andPublish
    );
  };

  const inputClass =
    "w-full rounded-lg border border-ptba-light-gray bg-ptba-off-white px-3 py-2.5 text-sm outline-none focus:border-ptba-steel-blue focus:ring-2 focus:ring-ptba-steel-blue/20";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href={cancelHref}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-ptba-light-gray text-ptba-gray hover:bg-ptba-off-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-ptba-charcoal">
            {mode === "create" ? "Buat Proyek Baru" : "Edit Proyek"}
          </h1>
          <p className="text-sm text-ptba-gray">
            {mode === "create"
              ? "Lengkapi informasi proyek untuk memulai proses seleksi mitra"
              : "Perbarui informasi proyek"}
          </p>
        </div>
      </div>

      {/* Card */}
      <div className="rounded-xl bg-white p-6 shadow-sm">
        {/* Stepper */}
        <div className="flex items-center justify-center gap-0 mb-8">
          {STEPS.map((step, index) => {
            const isActive = step.key === currentStep;
            const isCompleted = step.key < currentStep;
            const isLast = index === STEPS.length - 1;
            return (
              <div key={step.key} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold transition-all",
                      isCompleted
                        ? "bg-green-500 text-white"
                        : isActive
                          ? "bg-ptba-gold text-ptba-charcoal"
                          : "bg-ptba-light-gray text-ptba-gray"
                    )}
                  >
                    {isCompleted ? (
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      step.key
                    )}
                  </div>
                  <p
                    className={cn(
                      "mt-1.5 text-[10px] font-medium text-center w-20",
                      isActive ? "text-ptba-navy" : isCompleted ? "text-green-600" : "text-ptba-gray"
                    )}
                  >
                    {step.label}
                  </p>
                </div>
                {!isLast && (
                  <div className={cn("h-0.5 w-8 mx-0.5 mb-5", isCompleted ? "bg-green-500" : "bg-ptba-light-gray")} />
                )}
              </div>
            );
          })}
        </div>

        {/* Step 1: Informasi Dasar */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-ptba-charcoal">Informasi Dasar</h2>
            <div>
              <label className="mb-1 block text-sm font-medium text-ptba-charcoal">Nama Proyek</label>
              <input
                type="text"
                placeholder="Contoh: Pengadaan Conveyor Belt Unit 5"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-ptba-charcoal">Sektor Proyek</label>
              <select
                value={projectType}
                onChange={(e) => setProjectType(e.target.value)}
                className={inputClass}
              >
                {PROJECT_TYPES.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-ptba-charcoal">Deskripsi</label>
              <RichTextEditor
                value={description}
                onChange={setDescription}
                placeholder="Jelaskan ruang lingkup dan tujuan proyek..."
              />
            </div>

            {/* Cover Image */}
            <div>
              <label className="mb-1 block text-sm font-medium text-ptba-charcoal">Cover Image</label>
              <p className="mb-2 text-xs text-ptba-gray">Gambar utama yang ditampilkan di kartu proyek. Ukuran ideal: <strong>1920 × 1080 px</strong> (rasio 16:9).</p>
              {coverImagePreview ? (
                <div className="relative inline-block">
                  <img src={coverImagePreview} alt="Cover" className="h-32 rounded-lg object-cover border border-ptba-light-gray" />
                  <button
                    type="button"
                    onClick={() => { setCoverImageFile(null); setCoverImagePreview(null); }}
                    className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white shadow"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    const input = document.createElement("input");
                    input.type = "file";
                    input.accept = "image/jpeg,image/png,image/webp";
                    input.onchange = (e) => {
                      const f = (e.target as HTMLInputElement).files?.[0];
                      if (f) {
                        setCoverImageFile(f);
                        setCoverImagePreview(URL.createObjectURL(f));
                      }
                    };
                    input.click();
                  }}
                  className="flex items-center gap-2 rounded-lg border border-dashed border-ptba-light-gray px-4 py-3 text-sm text-ptba-gray hover:bg-ptba-off-white transition-colors"
                >
                  <ImageIcon className="h-4 w-4" />
                  Pilih Cover Image
                </button>
              )}
            </div>

            {/* Description Images */}
            <div>
              <label className="mb-1 block text-sm font-medium text-ptba-charcoal">Gambar Deskripsi</label>
              <p className="mb-2 text-xs text-ptba-gray">Gambar pendukung yang ditampilkan di halaman detail proyek (bisa lebih dari satu).</p>
              <div className="flex flex-wrap gap-3">
                {existingDescriptionImages.map((img) => (
                  <div key={img.id} className="relative">
                    <img src={img.url} alt="" className="h-24 w-24 rounded-lg object-cover border border-ptba-light-gray" />
                    <button
                      type="button"
                      onClick={() => setExistingDescriptionImages((prev) => prev.filter((i) => i.id !== img.id))}
                      className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white shadow"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                {descriptionImagePreviews.map((url, i) => (
                  <div key={i} className="relative">
                    <img src={url} alt="" className="h-24 w-24 rounded-lg object-cover border border-ptba-light-gray" />
                    <button
                      type="button"
                      onClick={() => {
                        setDescriptionImageFiles((prev) => prev.filter((_, idx) => idx !== i));
                        setDescriptionImagePreviews((prev) => prev.filter((_, idx) => idx !== i));
                      }}
                      className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white shadow"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    const input = document.createElement("input");
                    input.type = "file";
                    input.accept = "image/jpeg,image/png,image/webp";
                    input.multiple = true;
                    input.onchange = (e) => {
                      const files = Array.from((e.target as HTMLInputElement).files || []);
                      setDescriptionImageFiles((prev) => [...prev, ...files]);
                      setDescriptionImagePreviews((prev) => [...prev, ...files.map((f) => URL.createObjectURL(f))]);
                    };
                    input.click();
                  }}
                  className="flex h-24 w-24 items-center justify-center rounded-lg border border-dashed border-ptba-light-gray text-ptba-gray hover:bg-ptba-off-white transition-colors"
                >
                  <Plus className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* ── Project Viability ── */}
            <div className="border-t border-ptba-light-gray pt-4 mt-2">
              <h3 className="text-sm font-semibold text-ptba-charcoal mb-3">Project Viability</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-ptba-charcoal">Lokasi</label>
                  <input type="text" placeholder="Contoh: Mempawah, Kalimantan Barat" value={location} onChange={(e) => setLocation(e.target.value)} className={inputClass} />
                </div>
                {projectType === "power_generation" && (
                  <div>
                    <label className="mb-1 block text-xs font-medium text-ptba-charcoal">Kapasitas</label>
                    <div className="relative">
                      <input type="text" placeholder="Contoh: 1250" value={capacityMw} onChange={(e) => setCapacityMw(e.target.value)} className={cn(inputClass, "pr-12")} />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-ptba-gray">MW</span>
                    </div>
                  </div>
                )}
                <div>
                  <label className="mb-1 block text-xs font-medium text-ptba-charcoal">Indicative Capex</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium text-ptba-gray">USD</span>
                    <input type="text" placeholder="1.93 bn" value={indicativeCapex} onChange={(e) => setIndicativeCapex(e.target.value)} className={cn(inputClass, "pl-12")} />
                  </div>
                </div>
              </div>
            </div>

            {/* ── Indicative Financial Projection ── */}
            <div className="border-t border-ptba-light-gray pt-4">
              <h3 className="text-sm font-semibold text-ptba-charcoal mb-3">Indicative Financial Projection</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-ptba-charcoal">Net Present Value (NPV)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium text-ptba-gray">USD</span>
                    <input type="text" placeholder="±515.8 Mn" value={npv} onChange={(e) => setNpv(e.target.value)} className={cn(inputClass, "pl-12")} />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-ptba-charcoal">Debt to Equity Ratio (DER)</label>
                  <input type="text" placeholder="70:30" value={der} onChange={(e) => setDer(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-ptba-charcoal">Lifetime</label>
                  <div className="relative">
                    <input type="number" placeholder="30" value={lifetime} onChange={(e) => setLifetime(e.target.value)} className={cn(inputClass, "pr-14")} />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-ptba-gray">Years</span>
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-ptba-charcoal">Project Internal Rate of Return (Project IRR)</label>
                  <div className="relative">
                    <input type="number" step="0.01" placeholder="10.70" value={projectIrr} onChange={(e) => setProjectIrr(e.target.value)} className={cn(inputClass, "pr-8")} />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-ptba-gray">%</span>
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-ptba-charcoal">Equity Internal Rate of Return (Equity IRR)</label>
                  <div className="relative">
                    <input type="number" step="0.01" placeholder="16.69" value={equityIrr} onChange={(e) => setEquityIrr(e.target.value)} className={cn(inputClass, "pr-8")} />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-ptba-gray">%</span>
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-ptba-charcoal">Payback Period</label>
                  <div className="relative">
                    <input type="number" placeholder="11" value={paybackPeriod} onChange={(e) => setPaybackPeriod(e.target.value)} className={cn(inputClass, "pr-14")} />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-ptba-gray">Years</span>
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-ptba-charcoal">Weighted Average Cost of Capital (WACC)</label>
                  <div className="relative">
                    <input type="number" step="0.01" placeholder="7.7" value={wacc} onChange={(e) => setWacc(e.target.value)} className={cn(inputClass, "pr-8")} />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-ptba-gray">%</span>
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-ptba-charcoal">Tariff Levelized</label>
                  <div className="relative">
                    <input type="number" step="0.01" placeholder="7.9" value={tariffLevelized} onChange={(e) => setTariffLevelized(e.target.value)} className={cn(inputClass, "pr-20")} />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-ptba-gray">cUSD/kWh</span>
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-ptba-charcoal">Biaya Pokok Produksi (BPP)</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input type="number" step="0.01" placeholder="10.5" value={bppValue} onChange={(e) => setBppValue(e.target.value)} className={cn(inputClass, "pr-20")} />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-ptba-gray">cUSD/kWh</span>
                    </div>
                    <input type="text" placeholder="Lokasi PLN" value={bppLocation} onChange={(e) => setBppLocation(e.target.value)} className={cn(inputClass, "w-28")} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Timeline & Pendaftaran */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-ptba-charcoal">Timeline & Pendaftaran</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-ptba-charcoal">Tanggal Mulai</label>
                <input type="date" onClick={(e) => (e.target as HTMLInputElement).showPicker?.()} value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-ptba-charcoal">Tanggal Selesai</label>
                <input type="date" onClick={(e) => (e.target as HTMLInputElement).showPicker?.()} value={endDate} onChange={(e) => setEndDate(e.target.value)} className={inputClass} />
              </div>
            </div>

            {/* Phase deadlines */}
            <div className="rounded-lg border border-ptba-steel-blue/20 bg-ptba-steel-blue/5 p-4 space-y-3">
              <h3 className="text-sm font-semibold text-ptba-steel-blue">Deadline Per Fase</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-ptba-charcoal">Deadline Fase 1 (EoI)</label>
                  <input type="date" onClick={(e) => (e.target as HTMLInputElement).showPicker?.()} value={phase1Deadline} onChange={(e) => setPhase1Deadline(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-ptba-charcoal">Deadline Fase 2 (Assessment)</label>
                  <input type="date" onClick={(e) => (e.target as HTMLInputElement).showPicker?.()} value={phase2Deadline} onChange={(e) => setPhase2Deadline(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-ptba-charcoal">Deadline Fase 3 (Proposal)</label>
                  <input type="date" onClick={(e) => (e.target as HTMLInputElement).showPicker?.()} value={phase3Deadline} onChange={(e) => setPhase3Deadline(e.target.value)} className={inputClass} />
                </div>
              </div>
            </div>

            {/* Dokumen Pendukung Proyek — per fase */}
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-ptba-charcoal">Dokumen Pendukung Proyek</label>
                <p className="text-xs text-ptba-gray">Upload dokumen yang dapat dilihat oleh mitra. Dokumen Fase 1 bersifat publik.</p>
              </div>

              {(["phase1", "phase2", "phase3"] as const).map((phase) => {
                const cfg: Record<string, { label: string; desc: string; border: string; bg: string; text: string }> = {
                  phase1: { label: "Fase 1 — Publik", desc: "Dapat dilihat semua mitra yang melihat proyek ini.", border: "border-green-200", bg: "bg-green-50/50", text: "text-green-800" },
                  phase2: { label: "Fase 2 — Assessment", desc: "Hanya mitra yang lolos Fase 1 dan sudah bayar.", border: "border-ptba-steel-blue/20", bg: "bg-ptba-steel-blue/5", text: "text-ptba-steel-blue" },
                  phase3: { label: "Fase 3 — Proposal", desc: "Hanya mitra yang lolos Fase 2.", border: "border-ptba-gold/30", bg: "bg-ptba-gold/5", text: "text-ptba-gold" },
                };
                const { label, desc, border, bg, text } = cfg[phase];
                const phaseFiles = supportingFiles
                  .map((f, i) => ({ ...f, originalIndex: i }))
                  .filter((f) => (f.phase || "phase1") === phase);
                return (
                  <div key={phase} className={cn("rounded-lg border p-4 space-y-3", border, bg)}>
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className={cn("text-sm font-semibold", text)}>{label}</h3>
                        <p className="text-xs text-ptba-gray">{desc}</p>
                      </div>
                      <button
                        type="button"
                        disabled={uploadingFile}
                        onClick={() => handleAddFileWithPhase(phase)}
                        className="flex items-center gap-1 rounded-lg border border-ptba-light-gray bg-white px-3 py-1.5 text-xs text-ptba-gray hover:bg-ptba-off-white transition-colors shrink-0"
                      >
                        {uploadingFile ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                        Tambah
                      </button>
                    </div>
                    {phaseFiles.length > 0 ? (
                      <div className="space-y-1.5">
                        {phaseFiles.map((file) => (
                          <div key={file.originalIndex} className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 border border-ptba-light-gray">
                            <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                            <span className="text-sm text-ptba-charcoal flex-1 min-w-0 truncate">{file.name}</span>
                            <button type="button" onClick={() => removeFile(file.originalIndex)} className="text-ptba-red hover:text-red-700 transition-colors shrink-0">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-ptba-gray italic">Belum ada dokumen.</p>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex items-center gap-3 rounded-lg border border-ptba-light-gray p-4">
              <button
                type="button"
                role="switch"
                aria-checked={isOpenForApplication}
                onClick={() => setIsOpenForApplication(!isOpenForApplication)}
                className={cn(
                  "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors",
                  isOpenForApplication ? "bg-green-500" : "bg-ptba-light-gray"
                )}
              >
                <span
                  className={cn(
                    "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition-transform mt-0.5",
                    isOpenForApplication ? "translate-x-5 ml-0.5" : "translate-x-0.5"
                  )}
                />
              </button>
              <div>
                <p className="text-sm font-medium text-ptba-charcoal">Buka Pendaftaran Mitra</p>
                <p className="text-xs text-ptba-gray">
                  {isOpenForApplication ? "Mitra dapat mendaftar ke proyek ini" : "Pendaftaran mitra belum dibuka"}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Persyaratan & Dokumen */}
        {currentStep === 3 && (
          <div className="space-y-6">
            {/* Persyaratan Mitra */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-ptba-charcoal">Persyaratan Mitra</h2>
                <button
                  type="button"
                  onClick={addRequirement}
                  className="flex items-center gap-1.5 rounded-lg border border-ptba-navy px-3 py-1.5 text-xs font-medium text-ptba-navy hover:bg-ptba-navy/5 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Tambah
                </button>
              </div>
              <div className="space-y-2">
                {requirements.map((req, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ptba-navy/10 text-xs font-medium text-ptba-navy">
                      {index + 1}
                    </span>
                    <input
                      type="text"
                      placeholder="Contoh: Pengalaman minimal 5 tahun di bidang pertambangan"
                      value={req}
                      onChange={(e) => updateRequirement(index, e.target.value)}
                      className={cn(inputClass, "flex-1")}
                    />
                    <button
                      type="button"
                      onClick={() => removeRequirement(index)}
                      disabled={requirements.length <= 1}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-ptba-red hover:bg-ptba-red/5 disabled:text-ptba-light-gray disabled:cursor-not-allowed transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Fase 1 EoI Documents */}
            <div className="space-y-3">
              <div className="rounded-lg border border-ptba-steel-blue/30 overflow-hidden">
                <div className="bg-ptba-steel-blue/10 px-4 py-2.5">
                  <h3 className="text-sm font-semibold text-ptba-steel-blue">Fase 1 - Dokumen EoI (Expression of Interest)</h3>
                  <p className="text-xs text-ptba-gray mt-0.5">Dokumen yang harus diunggah mitra pada tahap pendaftaran awal</p>
                </div>
                <div className="divide-y divide-ptba-light-gray/50">
                  {PHASE1_DOCUMENT_TYPES.map((doc) => {
                    const isSelected = selectedPhase1Docs.includes(doc.id);
                    return (
                      <div
                        key={doc.id}
                        className={cn(
                          "px-4 py-3 transition-colors",
                          isSelected ? "bg-ptba-steel-blue/5" : "hover:bg-ptba-off-white"
                        )}
                      >
                        <label className="flex items-start gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleDoc(doc.id, selectedPhase1Docs, setSelectedPhase1Docs)}
                            className="mt-0.5 h-4 w-4 rounded border-ptba-light-gray text-ptba-steel-blue focus:ring-ptba-steel-blue/20"
                          />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-ptba-charcoal">
                              {doc.name}
                              {doc.required && <span className="ml-1 text-[10px] text-ptba-red">*Wajib</span>}
                            </p>
                            <p className="text-xs text-ptba-gray">{doc.description}</p>
                          </div>
                        </label>
                        {isSelected && (
                          <div className="ml-7 mt-2">
                            {templateFiles[doc.id] ? (
                              <div className="flex items-center gap-2 rounded border border-green-200 bg-green-50/50 px-3 py-1.5">
                                <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                                <span className="text-xs text-green-700 truncate flex-1">{templateFiles[doc.id].name}</span>
                                <button type="button" onClick={() => setTemplateFiles((p) => { const n = { ...p }; delete n[doc.id]; return n; })} className="text-xs text-red-500 hover:text-red-700 shrink-0">Hapus</button>
                              </div>
                            ) : (
                              <label className="inline-flex items-center gap-1.5 rounded border border-dashed border-ptba-steel-blue/40 px-3 py-1.5 text-xs text-ptba-steel-blue hover:bg-ptba-steel-blue/5 cursor-pointer transition-colors">
                                <Upload className="h-3 w-3" />
                                Lampirkan Template (jika ada)
                                <input type="file" className="hidden" accept=".pdf,.doc,.docx,.xls,.xlsx" onChange={(e) => { const f = e.target.files?.[0]; if (f) setTemplateFiles((p) => ({ ...p, [doc.id]: f })); e.target.value = ""; }} />
                              </label>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Fase 2 Documents */}
            <div className="space-y-3">
              <div className="rounded-lg border border-ptba-navy/30 overflow-hidden">
                <div className="bg-ptba-navy/10 px-4 py-2.5">
                  <h3 className="text-sm font-semibold text-ptba-navy">Fase 2 - Dokumen Detailed Assessment</h3>
                  <p className="text-xs text-ptba-gray mt-0.5">Dokumen yang harus diunggah mitra yang lolos shortlist</p>
                </div>
                <div className="divide-y divide-ptba-light-gray/50">
                  {PHASE2_DOCUMENT_TYPES.map((doc) => {
                    const isSelected = selectedPhase2Docs.includes(doc.id);
                    return (
                      <div
                        key={doc.id}
                        className={cn(
                          "px-4 py-3 transition-colors",
                          isSelected ? "bg-ptba-navy/5" : "hover:bg-ptba-off-white"
                        )}
                      >
                        <label className="flex items-start gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleDoc(doc.id, selectedPhase2Docs, setSelectedPhase2Docs)}
                            className="mt-0.5 h-4 w-4 rounded border-ptba-light-gray text-ptba-navy focus:ring-ptba-navy/20"
                          />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-ptba-charcoal">
                              {doc.name}
                              {doc.required && <span className="ml-1 text-[10px] text-ptba-red">*Wajib</span>}
                            </p>
                            <p className="text-xs text-ptba-gray">{doc.description}</p>
                          </div>
                        </label>
                        {isSelected && (
                          <div className="ml-7 mt-2">
                            {templateFiles[doc.id] ? (
                              <div className="flex items-center gap-2 rounded border border-green-200 bg-green-50/50 px-3 py-1.5">
                                <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                                <span className="text-xs text-green-700 truncate flex-1">{templateFiles[doc.id].name}</span>
                                <button type="button" onClick={() => setTemplateFiles((p) => { const n = { ...p }; delete n[doc.id]; return n; })} className="text-xs text-red-500 hover:text-red-700 shrink-0">Hapus</button>
                              </div>
                            ) : (
                              <label className="inline-flex items-center gap-1.5 rounded border border-dashed border-ptba-navy/40 px-3 py-1.5 text-xs text-ptba-navy hover:bg-ptba-navy/5 cursor-pointer transition-colors">
                                <Upload className="h-3 w-3" />
                                Lampirkan Template (jika ada)
                                <input type="file" className="hidden" accept=".pdf,.doc,.docx,.xls,.xlsx" onChange={(e) => { const f = e.target.files?.[0]; if (f) setTemplateFiles((p) => ({ ...p, [doc.id]: f })); e.target.value = ""; }} />
                              </label>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Fase 3 Documents */}
            {PHASE3_DOCUMENT_TYPES.length > 0 && (
            <div className="space-y-3">
              <div className="rounded-lg border border-ptba-gold/30 overflow-hidden">
                <div className="bg-ptba-gold/10 px-4 py-2.5">
                  <h3 className="text-sm font-semibold text-ptba-gold-dark">Fase 3 - Dokumen Proposal</h3>
                  <p className="text-xs text-ptba-gray mt-0.5">Dokumen yang harus diunggah mitra pada tahap proposal akhir</p>
                </div>
                <div className="divide-y divide-ptba-light-gray/50">
                  {PHASE3_DOCUMENT_TYPES.map((doc) => {
                    const isSelected = selectedPhase3Docs.includes(doc.id);
                    return (
                      <div
                        key={doc.id}
                        className={cn(
                          "px-4 py-3 transition-colors",
                          isSelected ? "bg-ptba-gold/5" : "hover:bg-ptba-off-white"
                        )}
                      >
                        <label className="flex items-start gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleDoc(doc.id, selectedPhase3Docs, setSelectedPhase3Docs)}
                            className="mt-0.5 h-4 w-4 rounded border-ptba-light-gray text-ptba-gold focus:ring-ptba-gold/20"
                          />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-ptba-charcoal">
                              {doc.name}
                              {doc.required && <span className="ml-1 text-[10px] text-ptba-red">*Wajib</span>}
                            </p>
                            <p className="text-xs text-ptba-gray">{doc.description}</p>
                          </div>
                        </label>
                        {isSelected && (
                          <div className="ml-7 mt-2">
                            {templateFiles[doc.id] ? (
                              <div className="flex items-center gap-2 rounded border border-green-200 bg-green-50/50 px-3 py-1.5">
                                <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                                <span className="text-xs text-green-700 truncate flex-1">{templateFiles[doc.id].name}</span>
                                <button type="button" onClick={() => setTemplateFiles((p) => { const n = { ...p }; delete n[doc.id]; return n; })} className="text-xs text-red-500 hover:text-red-700 shrink-0">Hapus</button>
                              </div>
                            ) : (
                              <label className="inline-flex items-center gap-1.5 rounded border border-dashed border-ptba-gold/40 px-3 py-1.5 text-xs text-ptba-gold-dark hover:bg-ptba-gold/5 cursor-pointer transition-colors">
                                <Upload className="h-3 w-3" />
                                Lampirkan Template (jika ada)
                                <input type="file" className="hidden" accept=".pdf,.doc,.docx,.xls,.xlsx" onChange={(e) => { const f = e.target.files?.[0]; if (f) setTemplateFiles((p) => ({ ...p, [doc.id]: f })); e.target.value = ""; }} />
                              </label>
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

            {/* Legacy/General Documents - Accordion */}
            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-semibold text-ptba-charcoal">Dokumen Kualifikasi Umum <span className="text-xs font-normal text-ptba-gray">(opsional)</span></h3>
                <p className="text-xs text-ptba-gray mt-0.5">Pilih dokumen tambahan dan tentukan fase</p>
              </div>
              <div className="rounded-lg border border-ptba-light-gray overflow-hidden">
                {CATEGORIES.map((category) => {
                  const docs = LEGACY_DOCUMENT_TYPES.filter((d) => d.category === category);
                  const isOpen = openCategories[category] ?? false;
                  const selectedCount = docs.filter((d) => d.id in selectedLegacyDocs).length;
                  return (
                    <div key={category}>
                      <button
                        type="button"
                        onClick={() => toggleCategory(category)}
                        className="flex items-center justify-between w-full bg-ptba-section-bg px-3 py-2 border-b border-ptba-light-gray/50 hover:bg-ptba-section-bg/80 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          {isOpen ? <ChevronDown className="h-3.5 w-3.5 text-ptba-gray" /> : <ChevronRight className="h-3.5 w-3.5 text-ptba-gray" />}
                          <span className="text-xs font-semibold text-ptba-charcoal">{CATEGORY_LABELS[category]}</span>
                          {selectedCount > 0 && <span className="rounded-full bg-ptba-steel-blue/10 px-1.5 py-0.5 text-[10px] font-medium text-ptba-steel-blue">{selectedCount}</span>}
                        </div>
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            const allSelected = docs.every((d) => d.id in selectedLegacyDocs);
                            setSelectedLegacyDocs((prev) => {
                              const next = { ...prev };
                              if (allSelected) { docs.forEach((d) => delete next[d.id]); }
                              else { docs.forEach((d) => { if (!(d.id in next)) next[d.id] = "both"; }); }
                              return next;
                            });
                          }}
                          className="text-[10px] font-medium text-ptba-steel-blue hover:text-ptba-navy"
                        >
                          {docs.every((d) => d.id in selectedLegacyDocs) ? "Batal" : "Semua"}
                        </span>
                      </button>
                      {isOpen && docs.map((doc) => {
                        const isSelected = doc.id in selectedLegacyDocs;
                        return (
                          <div key={doc.id} className={cn("flex items-center gap-2 px-3 py-2 border-b border-ptba-light-gray/30", isSelected ? "bg-ptba-steel-blue/5" : "hover:bg-ptba-off-white")}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {
                                setSelectedLegacyDocs((prev) => {
                                  const next = { ...prev };
                                  if (isSelected) delete next[doc.id]; else next[doc.id] = "both";
                                  return next;
                                });
                              }}
                              className="h-3.5 w-3.5 rounded border-ptba-light-gray text-ptba-steel-blue focus:ring-ptba-steel-blue/20 cursor-pointer shrink-0"
                            />
                            <span className="text-xs font-medium text-ptba-charcoal flex-1 truncate">{doc.name}</span>
                            {isSelected && (
                              <>
                                <select
                                  value={selectedLegacyDocs[doc.id]}
                                  onChange={(e) => setSelectedLegacyDocs((prev) => ({ ...prev, [doc.id]: e.target.value as any }))}
                                  onClick={(e) => e.stopPropagation()}
                                  className="rounded border border-ptba-light-gray bg-white px-1.5 py-0.5 text-[10px] font-medium text-ptba-charcoal outline-none shrink-0"
                                >
                                  <option value="phase1">Fase 1</option>
                                  <option value="phase2">Fase 2</option>
                                  <option value="phase3">Fase 3</option>
                                  <option value="both">Semua Fase</option>
                                </select>
                                {templateFiles[doc.id] ? (
                                  <div className="flex items-center gap-1 shrink-0">
                                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                                    <button type="button" onClick={() => setTemplateFiles((p) => { const n = { ...p }; delete n[doc.id]; return n; })} className="text-[10px] text-red-500">x</button>
                                  </div>
                                ) : (
                                  <label className="text-[10px] text-ptba-steel-blue hover:text-ptba-navy cursor-pointer shrink-0">
                                    +Template
                                    <input type="file" className="hidden" accept=".pdf,.doc,.docx,.xls,.xlsx" onChange={(e) => { const f = e.target.files?.[0]; if (f) setTemplateFiles((p) => ({ ...p, [doc.id]: f })); e.target.value = ""; }} />
                                  </label>
                                )}
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Custom Documents */}
            <div className="rounded-lg border border-dashed border-ptba-steel-blue/40 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-ptba-charcoal">Dokumen Lainnya</h3>
                  <p className="text-xs text-ptba-gray">Tambahkan dokumen tambahan yang tidak ada di daftar</p>
                </div>
                <button
                  type="button"
                  onClick={addCustomDocument}
                  className="flex items-center gap-1.5 rounded-lg border border-ptba-navy px-3 py-1.5 text-xs font-medium text-ptba-navy hover:bg-ptba-navy/5 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Tambah
                </button>
              </div>
              {customDocuments.length > 0 && (
                <div className="space-y-2">
                  {customDocuments.map((doc, index) => (
                    <div key={index} className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Contoh: Sertifikat K3, Izin Lingkungan, dll."
                          value={doc.name}
                          onChange={(e) => updateCustomDocName(index, e.target.value)}
                          className={cn(inputClass, "flex-1")}
                        />
                        <select
                          value={doc.phase}
                          onChange={(e) => updateCustomDocPhase(index, e.target.value as "phase1" | "phase2" | "phase3" | "both")}
                          className="shrink-0 rounded-md border border-ptba-light-gray bg-white px-2 py-1 text-xs font-medium text-ptba-charcoal outline-none"
                        >
                          <option value="phase1">Fase 1</option>
                          <option value="phase2">Fase 2</option>
                          <option value="phase3">Fase 3</option>
                          <option value="both">Semua Fase</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => removeCustomDocument(index)}
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-ptba-red hover:bg-ptba-red/5 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      {doc.name.trim() && (
                        <div className="ml-1">
                          {templateFiles[`custom_${index}`] ? (
                            <div className="flex items-center gap-2 rounded border border-green-200 bg-green-50/50 px-2 py-1">
                              <CheckCircle2 className="h-3 w-3 text-green-500 shrink-0" />
                              <span className="text-[10px] text-green-700 truncate flex-1">{templateFiles[`custom_${index}`].name}</span>
                              <button type="button" onClick={() => setTemplateFiles((p) => { const n = { ...p }; delete n[`custom_${index}`]; return n; })} className="text-[10px] text-red-500">Hapus</button>
                            </div>
                          ) : (
                            <label className="inline-flex items-center gap-1 text-[10px] text-ptba-steel-blue hover:text-ptba-navy cursor-pointer">
                              <Upload className="h-3 w-3" />
                              Lampirkan Template (jika ada)
                              <input type="file" className="hidden" accept=".pdf,.doc,.docx,.xls,.xlsx" onChange={(e) => { const f = e.target.files?.[0]; if (f) setTemplateFiles((p) => ({ ...p, [`custom_${index}`]: f })); e.target.value = ""; }} />
                            </label>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 4: Penunjukan PIC */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div className="rounded-xl bg-white p-6 shadow-sm border border-ptba-light-gray">
              <h2 className="text-lg font-semibold text-ptba-charcoal">Penunjukan PIC per Fase</h2>
              <p className="text-xs text-ptba-gray mt-1">Tentukan PIC untuk setiap fase proyek</p>

              <div className="mt-4 flex gap-1 rounded-lg bg-ptba-section-bg p-1">
                {(Object.keys(PHASE_PIC_CONFIG) as PhaseKey[]).map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setPicPhaseTab(key)}
                    className={cn(
                      "flex-1 rounded-md px-3 py-2 text-xs font-medium transition-all",
                      picPhaseTab === key ? "bg-white text-ptba-navy shadow-sm" : "text-ptba-gray hover:text-ptba-charcoal"
                    )}
                  >
                    {PHASE_PIC_CONFIG[key].label}
                  </button>
                ))}
              </div>

              <div className="mt-5 space-y-4">
                {PHASE_PIC_CONFIG[picPhaseTab].roles.map((slot) => {
                  const slotKey = `${picPhaseTab}-${slot.role}-${"subcategory" in slot ? slot.subcategory : ""}`;
                  const subcategory = "subcategory" in slot ? slot.subcategory : undefined;
                  const assigned = getPhasePicsFor(picPhaseTab, slot.role, subcategory);
                  const usersForRole = internalUsers.filter((u) => u.role === slot.role);

                  return (
                    <div key={slotKey} className="rounded-lg border border-ptba-light-gray p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="text-sm font-semibold text-ptba-charcoal">{slot.label}</p>
                          <p className="text-xs text-ptba-gray">{slot.description}</p>
                        </div>
                        {slot.multi && (
                          <span className="rounded-full bg-ptba-steel-blue/10 px-2 py-0.5 text-[10px] font-medium text-ptba-steel-blue">Multi</span>
                        )}
                      </div>

                      {!slot.multi && (
                        <select
                          value={assigned[0]?.userId ?? ""}
                          onChange={(e) => setSinglePhasePic(picPhaseTab, slot.role, e.target.value, subcategory)}
                          className="w-full rounded-lg border border-ptba-light-gray px-3 py-2 text-sm focus:border-ptba-navy focus:outline-none focus:ring-1 focus:ring-ptba-navy"
                        >
                          <option value="">Pilih PIC...</option>
                          {usersForRole.map((u) => (
                            <option key={u.id} value={u.id}>{u.name}</option>
                          ))}
                        </select>
                      )}

                      {slot.multi && (
                        <div className="space-y-2">
                          {assigned.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {assigned.map((pic) => (
                                <span key={pic.userId} className="inline-flex items-center gap-1 rounded-full bg-ptba-navy/10 px-2.5 py-1 text-xs text-ptba-navy">
                                  {pic.userName}
                                  <button type="button" onClick={() => removePhasePic(picPhaseTab, slot.role, pic.userId, subcategory)} className="ml-0.5 text-ptba-navy/50 hover:text-ptba-red">×</button>
                                </span>
                              ))}
                            </div>
                          )}
                          <select
                            value=""
                            onChange={(e) => { if (e.target.value) addPhasePic(picPhaseTab, slot.role, e.target.value, subcategory); }}
                            className="w-full rounded-lg border border-ptba-light-gray px-3 py-2 text-sm focus:border-ptba-navy focus:outline-none focus:ring-1 focus:ring-ptba-navy"
                          >
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

              <div className="mt-4 rounded-lg bg-blue-50 border border-blue-100 p-3">
                <p className="text-xs text-blue-700">
                  <span className="font-medium">Info:</span> Fase 1 (Filter Evaluasi) & Fase 3 (RFP & Proposal) hanya memerlukan EBD dan Ketua Tim. Fase 2 (PQ) memerlukan minimal 7 PIC dari 6 kategori evaluasi + Ketua Tim.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Ringkasan */}
        {currentStep === 5 && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-ptba-charcoal">Ringkasan Proyek</h2>

            {/* Informasi Dasar */}
            <div className="rounded-lg border border-ptba-light-gray overflow-hidden">
              <div className="bg-ptba-section-bg px-4 py-2.5">
                <h3 className="text-sm font-semibold text-ptba-charcoal">Informasi Dasar</h3>
              </div>
              <div className="divide-y divide-ptba-light-gray/50 px-4">
                <div className="flex justify-between py-2.5">
                  <span className="text-sm text-ptba-gray">Nama Proyek</span>
                  <span className="text-sm font-medium text-ptba-charcoal">{projectName || "-"}</span>
                </div>
                <div className="flex justify-between py-2.5">
                  <span className="text-sm text-ptba-gray">Sektor Proyek</span>
                  <span className="text-sm font-medium text-ptba-charcoal">{projectType || "-"}</span>
                </div>
              </div>
            </div>

            {/* Project Viability & Financial */}
            {(location || capacityMw || indicativeCapex || npv || der || lifetime) && (
              <div className="rounded-lg border border-ptba-light-gray overflow-hidden">
                <div className="bg-ptba-section-bg px-4 py-2.5">
                  <h3 className="text-sm font-semibold text-ptba-charcoal">Project Viability & Financial Projection</h3>
                </div>
                <div className="divide-y divide-ptba-light-gray/50 px-4">
                  {location && <div className="flex justify-between py-2.5"><span className="text-sm text-ptba-gray">Lokasi</span><span className="text-sm font-medium text-ptba-charcoal">{location}</span></div>}
                  {capacityMw && <div className="flex justify-between py-2.5"><span className="text-sm text-ptba-gray">Kapasitas</span><span className="text-sm font-medium text-ptba-charcoal">{capacityMw} MW</span></div>}
                  {indicativeCapex && <div className="flex justify-between py-2.5"><span className="text-sm text-ptba-gray">Indicative Capex</span><span className="text-sm font-medium text-ptba-charcoal">{indicativeCapex}</span></div>}
                  {npv && <div className="flex justify-between py-2.5"><span className="text-sm text-ptba-gray">Net Present Value (NPV)</span><span className="text-sm font-medium text-ptba-charcoal">{npv}</span></div>}
                  {der && <div className="flex justify-between py-2.5"><span className="text-sm text-ptba-gray">Debt to Equity Ratio (DER)</span><span className="text-sm font-medium text-ptba-charcoal">{der}</span></div>}
                  {lifetime && <div className="flex justify-between py-2.5"><span className="text-sm text-ptba-gray">Lifetime</span><span className="text-sm font-medium text-ptba-charcoal">{lifetime}</span></div>}
                  {projectIrr && <div className="flex justify-between py-2.5"><span className="text-sm text-ptba-gray">Project IRR</span><span className="text-sm font-medium text-ptba-charcoal">{projectIrr}</span></div>}
                  {equityIrr && <div className="flex justify-between py-2.5"><span className="text-sm text-ptba-gray">Equity IRR</span><span className="text-sm font-medium text-ptba-charcoal">{equityIrr}</span></div>}
                  {paybackPeriod && <div className="flex justify-between py-2.5"><span className="text-sm text-ptba-gray">Payback Period</span><span className="text-sm font-medium text-ptba-charcoal">{paybackPeriod}</span></div>}
                  {wacc && <div className="flex justify-between py-2.5"><span className="text-sm text-ptba-gray">WACC</span><span className="text-sm font-medium text-ptba-charcoal">{wacc}</span></div>}
                  {tariffLevelized && <div className="flex justify-between py-2.5"><span className="text-sm text-ptba-gray">Tariff (Levelized)</span><span className="text-sm font-medium text-ptba-charcoal">{tariffLevelized}</span></div>}
                  {bppValue && <div className="flex justify-between py-2.5"><span className="text-sm text-ptba-gray">BPP{bppLocation ? ` ${bppLocation}` : ""}</span><span className="text-sm font-medium text-ptba-charcoal">{bppValue}</span></div>}
                </div>
              </div>
            )}

            {/* Timeline */}
            <div className="rounded-lg border border-ptba-light-gray overflow-hidden">
              <div className="bg-ptba-section-bg px-4 py-2.5">
                <h3 className="text-sm font-semibold text-ptba-charcoal">Timeline & Pendaftaran</h3>
              </div>
              <div className="divide-y divide-ptba-light-gray/50 px-4">
                <div className="flex justify-between py-2.5">
                  <span className="text-sm text-ptba-gray">Periode Proyek</span>
                  <span className="text-sm font-medium text-ptba-charcoal">{startDate || "-"} s/d {endDate || "-"}</span>
                </div>
                <div className="flex justify-between py-2.5">
                  <span className="text-sm text-ptba-gray">Deadline Fase 1</span>
                  <span className="text-sm font-medium text-ptba-charcoal">{phase1Deadline || "-"}</span>
                </div>
                <div className="flex justify-between py-2.5">
                  <span className="text-sm text-ptba-gray">Deadline Fase 2</span>
                  <span className="text-sm font-medium text-ptba-charcoal">{phase2Deadline || "-"}</span>
                </div>
                <div className="flex justify-between py-2.5">
                  <span className="text-sm text-ptba-gray">Deadline Fase 3</span>
                  <span className="text-sm font-medium text-ptba-charcoal">{phase3Deadline || "-"}</span>
                </div>
                <div className="flex justify-between py-2.5">
                  <span className="text-sm text-ptba-gray">Pendaftaran Mitra</span>
                  <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", isOpenForApplication ? "bg-green-100 text-green-700" : "bg-ptba-gray/10 text-ptba-gray")}>
                    {isOpenForApplication ? "Dibuka" : "Ditutup"}
                  </span>
                </div>
              </div>
            </div>

            {/* Documents Summary */}
            <div className="rounded-lg border border-ptba-light-gray overflow-hidden">
              <div className="bg-ptba-section-bg px-4 py-2.5">
                <h3 className="text-sm font-semibold text-ptba-charcoal">Dokumen</h3>
              </div>
              <div className="px-4 py-3 space-y-2">
                <p className="text-xs font-medium text-ptba-steel-blue">Fase 1 EoI: {selectedPhase1Docs.length} dokumen</p>
                <p className="text-xs font-medium text-ptba-navy">Fase 2 Assessment: {selectedPhase2Docs.length} dokumen</p>
                {selectedPhase3Docs.length > 0 && (
                  <p className="text-xs font-medium text-ptba-gold-dark">Fase 3 Proposal: {selectedPhase3Docs.length} dokumen</p>
                )}
                {Object.keys(selectedLegacyDocs).length > 0 && (
                  <p className="text-xs text-ptba-gray">Kualifikasi Umum: {Object.keys(selectedLegacyDocs).length} dokumen</p>
                )}
              </div>
            </div>

            {/* PIC Summary */}
            <div className="rounded-lg border border-ptba-light-gray p-4">
              <h3 className="text-sm font-semibold text-ptba-charcoal">PIC yang Ditunjuk</h3>
              {(Object.keys(PHASE_PIC_CONFIG) as PhaseKey[]).map((phaseKey) => {
                const pics = phasePics.filter((p) => p.phase === phaseKey);
                if (pics.length === 0) return null;
                return (
                  <div key={phaseKey} className="mt-3">
                    <p className="text-xs font-medium text-ptba-gray mb-1">{PHASE_PIC_CONFIG[phaseKey].label}</p>
                    <div className="space-y-1">
                      {pics.map((pic, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span className="text-ptba-gray">{pic.role.toUpperCase()}{pic.subcategory ? ` (${pic.subcategory})` : ""}</span>
                          <span className="font-medium text-ptba-charcoal">{pic.userName || pic.userId}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
              {phasePics.length === 0 && <p className="mt-2 text-xs text-ptba-red">Belum ada PIC yang ditunjuk.</p>}
            </div>
          </div>
        )}

        {/* Step Validation Error */}
        {stepError && (
          <div className="mt-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {stepError}
          </div>
        )}

        {/* Submit Error */}
        {submitError && (
          <div className="mt-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {submitError}
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-8 pt-4 border-t border-ptba-light-gray">
          <button
            onClick={currentStep === 1 ? () => router.push(cancelHref) : goPrev}
            disabled={submitting}
            className="rounded-lg border border-ptba-navy px-4 py-2 text-sm font-medium text-ptba-navy hover:bg-ptba-navy/5 transition-colors disabled:opacity-50"
          >
            {currentStep === 1 ? "Batal" : "Sebelumnya"}
          </button>
          {currentStep < 5 ? (
            <button
              onClick={goNext}
              className="rounded-lg bg-ptba-navy px-4 py-2 text-sm font-medium text-white hover:bg-ptba-navy/90 transition-colors"
            >
              Selanjutnya
            </button>
          ) : mode === "create" ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleSubmit(false)}
                disabled={submitting || !projectName || !projectType}
                className="flex items-center gap-2 rounded-lg border border-ptba-navy px-4 py-2 text-sm font-medium text-ptba-navy hover:bg-ptba-navy/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Simpan Draft
              </button>
              <button
                onClick={() => handleSubmit(true)}
                disabled={submitting || !projectName || !projectType}
                className="flex items-center gap-2 rounded-lg bg-ptba-gold px-5 py-2 text-sm font-bold text-ptba-charcoal hover:bg-ptba-gold-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Publikasikan
              </button>
            </div>
          ) : (
            <button
              onClick={() => handleSubmit()}
              disabled={submitting || !projectName || !projectType}
              className="flex items-center gap-2 rounded-lg bg-ptba-gold px-5 py-2 text-sm font-bold text-ptba-charcoal hover:bg-ptba-gold-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Simpan Perubahan
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
