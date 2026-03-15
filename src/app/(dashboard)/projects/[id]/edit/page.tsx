"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, Upload, CheckCircle2, UserPlus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { formatCurrency } from "@/lib/utils/format";
import { PHASE1_DOCUMENT_TYPES, PHASE2_DOCUMENT_TYPES, LEGACY_DOCUMENT_TYPES } from "@/lib/constants/document-types";
import { useAuth } from "@/lib/auth/auth-context";
import { authApi, projectApi, ApiClientError } from "@/lib/api/client";
import type { UserRole } from "@/lib/types";

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

const PIC_ROLES: { role: UserRole; label: string; description: string }[] = [
  { role: "ebd", label: "EBD (Evaluasi Bisnis & Development)", description: "Bertanggung jawab atas evaluasi pasar, teknis, dan ESG" },
  { role: "keuangan", label: "Keuangan", description: "Bertanggung jawab atas evaluasi keuangan (KEP-100)" },
  { role: "hukum", label: "Hukum", description: "Bertanggung jawab atas evaluasi aspek legal" },
  { role: "risiko", label: "Risiko", description: "Bertanggung jawab atas evaluasi dan mitigasi risiko" },
  { role: "direksi", label: "Direksi", description: "Approver akhir untuk persetujuan proyek" },
];

interface InternalUser {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  status: string;
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

export default function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { accessToken } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [loadingProject, setLoadingProject] = useState(true);
  const [loadError, setLoadError] = useState("");

  // Internal users for PIC
  const [internalUsers, setInternalUsers] = useState<InternalUser[]>([]);

  // Step 1
  const [projectName, setProjectName] = useState("");
  const [projectType, setProjectType] = useState("");
  const [capexValue, setCapexValue] = useState("");
  const [description, setDescription] = useState("");

  // Step 2
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [phase1Deadline, setPhase1Deadline] = useState("");
  const [phase2Deadline, setPhase2Deadline] = useState("");
  const [supportingFiles, setSupportingFiles] = useState<{ id: string; name: string; fileKey?: string }[]>([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [isOpenForApplication, setIsOpenForApplication] = useState(false);

  // Step 3
  const [requirements, setRequirements] = useState<string[]>([""]);
  const [selectedPhase1Docs, setSelectedPhase1Docs] = useState<string[]>(
    PHASE1_DOCUMENT_TYPES.filter((d) => d.required).map((d) => d.id)
  );
  const [selectedPhase2Docs, setSelectedPhase2Docs] = useState<string[]>(
    PHASE2_DOCUMENT_TYPES.filter((d) => d.required).map((d) => d.id)
  );
  const [selectedLegacyDocs, setSelectedLegacyDocs] = useState<Record<string, "phase1" | "phase2" | "both">>({});
  const [customDocuments, setCustomDocuments] = useState<{ name: string; phase: "phase1" | "phase2" | "both" }[]>([]);

  // Step 4 - PIC Assignments
  const [picAssignments, setPicAssignments] = useState<Record<string, string>>({});

  // Fetch internal users
  useEffect(() => {
    if (!accessToken) return;
    authApi().listUsers(accessToken).then((res) => {
      setInternalUsers(res.users.filter((u) => u.role !== "mitra" && u.status === "active"));
    }).catch(() => {});
  }, [accessToken]);

  // Fetch existing project data
  useEffect(() => {
    if (!accessToken) return;
    setLoadingProject(true);
    setLoadError("");
    projectApi(accessToken)
      .getById(id)
      .then((res) => {
        const project = res.data;
        if (!project) {
          setLoadError("Proyek tidak ditemukan.");
          return;
        }

        // Step 1: Basic info
        setProjectName(project.name || "");
        setProjectType(project.type || "");
        setCapexValue(project.capexValue ? String(project.capexValue) : "");
        setDescription(typeof project.description === "string" ? project.description : "");

        // Step 2: Timeline
        setStartDate(formatDateForInput(project.startDate as string));
        setEndDate(formatDateForInput(project.endDate as string));
        setPhase1Deadline(formatDateForInput(project.phase1Deadline as string));
        setPhase2Deadline(formatDateForInput(project.phase2Deadline as string));
        setIsOpenForApplication(!!project.isOpenForApplication);

        // Supporting files from ptbaDocuments
        if (project.ptbaDocuments && Array.isArray(project.ptbaDocuments)) {
          setSupportingFiles(project.ptbaDocuments.map((d: any) => ({
            id: d.id,
            name: d.name || d.fileName || "",
            fileKey: d.fileKey,
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
          const legacyDocs: Record<string, "phase1" | "phase2" | "both"> = {};

          const phase1Ids = new Set(PHASE1_DOCUMENT_TYPES.map((d) => d.id));
          const phase2Ids = new Set(PHASE2_DOCUMENT_TYPES.map((d) => d.id));

          for (const doc of project.requiredDocuments) {
            const docId = doc.documentTypeId;
            const phase = doc.phase;

            if (phase1Ids.has(docId) && (phase === "phase1" || !phase)) {
              p1Docs.push(docId);
            } else if (phase2Ids.has(docId) && (phase === "phase2" || !phase)) {
              p2Docs.push(docId);
            } else if (phase === "phase1" || phase === "phase2" || phase === "both" || phase === "general") {
              legacyDocs[docId] = phase === "general" ? "both" : (phase as "phase1" | "phase2" | "both");
            }
          }

          if (p1Docs.length > 0) setSelectedPhase1Docs(p1Docs);
          if (p2Docs.length > 0) setSelectedPhase2Docs(p2Docs);
          if (Object.keys(legacyDocs).length > 0) setSelectedLegacyDocs(legacyDocs);
        }

        // Step 4: PIC Assignments
        if (project.picAssignments && Array.isArray(project.picAssignments)) {
          const pics: Record<string, string> = {};
          for (const pic of project.picAssignments) {
            pics[pic.role] = pic.userId;
          }
          setPicAssignments(pics);
        }
      })
      .catch((err) => {
        if (err instanceof ApiClientError) {
          setLoadError(err.message);
        } else {
          setLoadError("Gagal memuat data proyek.");
        }
      })
      .finally(() => {
        setLoadingProject(false);
      });
  }, [accessToken, id]);

  const [stepError, setStepError] = useState("");

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
        return null; // PIC optional
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

  // Requirements handlers
  const addRequirement = () => setRequirements((prev) => [...prev, ""]);
  const removeRequirement = (index: number) => {
    if (requirements.length <= 1) return;
    setRequirements((prev) => prev.filter((_, i) => i !== index));
  };
  const updateRequirement = (index: number, value: string) => {
    setRequirements((prev) => prev.map((r, i) => (i === index ? value : r)));
  };

  // Document selection handlers
  const toggleDoc = (docId: string, list: string[], setList: (v: string[]) => void) => {
    setList(list.includes(docId) ? list.filter((id) => id !== docId) : [...list, docId]);
  };

  // Custom document handlers
  const addCustomDocument = () => setCustomDocuments((prev) => [...prev, { name: "", phase: "both" }]);
  const removeCustomDocument = (index: number) => {
    setCustomDocuments((prev) => prev.filter((_, i) => i !== index));
  };
  const updateCustomDocName = (index: number, value: string) => {
    setCustomDocuments((prev) => prev.map((d, i) => (i === index ? { ...d, name: value } : d)));
  };
  const updateCustomDocPhase = (index: number, value: "phase1" | "phase2" | "both") => {
    setCustomDocuments((prev) => prev.map((d, i) => (i === index ? { ...d, phase: value } : d)));
  };

  // Supporting files - real upload
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002/api";

  const handleFileUpload = async (file: File) => {
    if (!accessToken) return;
    setUploadingFile(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("name", file.name);
      formData.append("type", "supporting");

      const res = await fetch(`${API_BASE}/projects/${id}/documents`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Gagal mengunggah");
      }

      const data = await res.json();
      setSupportingFiles((prev) => [...prev, {
        id: data.document.id,
        name: data.document.name,
        fileKey: data.document.fileKey,
      }]);
    } catch (err: any) {
      setSubmitError(err.message || "Gagal mengunggah dokumen");
    } finally {
      setUploadingFile(false);
    }
  };

  const removeFile = async (index: number) => {
    const file = supportingFiles[index];
    if (file?.id && accessToken) {
      try {
        await fetch(`${API_BASE}/projects/${id}/documents/${file.id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${accessToken}` },
        });
      } catch { /* ignore */ }
    }
    setSupportingFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // PIC handlers
  const handlePICChange = (role: string, userId: string) => {
    setPicAssignments((prev) => ({ ...prev, [role]: userId }));
  };

  const getUsersForRole = (role: UserRole) => {
    return internalUsers.filter((u) => u.role === role);
  };

  const handleSubmit = async () => {
    if (!accessToken || !projectType) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      // Update basic fields
      await projectApi(accessToken).update(id, {
        name: projectName,
        type: projectType as any,
        capexValue: Number(capexValue) || undefined,
        description: description || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        phase1Deadline: phase1Deadline || undefined,
        phase2Deadline: phase2Deadline || undefined,
      });

      // Update requirements
      const reqs = requirements.filter((r) => r.trim());
      await projectApi(accessToken).updateRequirements(id, reqs);

      // Update required documents (phase1 + phase2 + legacy + custom)
      const allDocs: { documentTypeId: string; phase: string }[] = [
        ...selectedPhase1Docs.map((docId) => ({ documentTypeId: docId, phase: "phase1" })),
        ...selectedPhase2Docs.map((docId) => ({ documentTypeId: docId, phase: "phase2" })),
        ...Object.entries(selectedLegacyDocs).map(([docId, phase]) => ({ documentTypeId: docId, phase })),
        ...customDocuments.filter((d) => d.name.trim()).map((d) => ({ documentTypeId: `custom_${d.name.replace(/\s+/g, "_").toLowerCase()}`, phase: d.phase })),
      ];
      await projectApi(accessToken).updateRequiredDocuments(id, allDocs);

      router.push(`/projects/${id}`);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setSubmitError(err.message);
      } else {
        setSubmitError("Gagal menyimpan perubahan. Silakan coba lagi.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const parsedCapex = Number(capexValue) || 0;

  const inputClass =
    "w-full rounded-lg border border-ptba-light-gray bg-ptba-off-white px-3 py-2.5 text-sm outline-none focus:border-ptba-steel-blue focus:ring-2 focus:ring-ptba-steel-blue/20";

  // Loading state
  if (loadingProject) {
    return (
      <div className="mx-auto max-w-3xl flex flex-col items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-ptba-navy mb-4" />
        <p className="text-sm text-ptba-gray">Memuat data proyek...</p>
      </div>
    );
  }

  // Error state
  if (loadError) {
    return (
      <div className="mx-auto max-w-3xl flex flex-col items-center justify-center py-20">
        <div className="rounded-lg bg-red-50 border border-red-200 px-6 py-4 text-center">
          <p className="text-sm text-red-700 mb-3">{loadError}</p>
          <Link
            href={`/projects/${id}`}
            className="text-sm font-medium text-ptba-navy hover:underline"
          >
            Kembali ke Detail Proyek
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href={`/projects/${id}`}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-ptba-light-gray text-ptba-gray hover:bg-ptba-off-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-ptba-charcoal">Edit Proyek</h1>
          <p className="text-sm text-ptba-gray">Perbarui informasi proyek</p>
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
              <label className="mb-1 block text-sm font-medium text-ptba-charcoal">Nilai Proyek</label>
              <input
                type="number"
                placeholder="0"
                value={capexValue}
                onChange={(e) => setCapexValue(e.target.value)}
                className={inputClass}
              />
              {parsedCapex > 0 && (
                <p className="mt-1 text-xs text-ptba-gray">{formatCurrency(parsedCapex)}</p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-ptba-charcoal">Deskripsi</label>
              <textarea
                placeholder="Jelaskan ruang lingkup dan tujuan proyek..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={cn(inputClass, "min-h-[100px] resize-y")}
              />
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-ptba-charcoal">Deadline Fase 1 (EoI)</label>
                  <input type="date" onClick={(e) => (e.target as HTMLInputElement).showPicker?.()} value={phase1Deadline} onChange={(e) => setPhase1Deadline(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-ptba-charcoal">Deadline Fase 2 (Assessment)</label>
                  <input type="date" onClick={(e) => (e.target as HTMLInputElement).showPicker?.()} value={phase2Deadline} onChange={(e) => setPhase2Deadline(e.target.value)} className={inputClass} />
                </div>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-ptba-charcoal">Dokumen Pendukung Proyek</label>
              <p className="mb-2 text-xs text-ptba-gray">Upload dokumen yang dapat dilihat oleh mitra (TOR, spesifikasi teknis, gambar, dll.)</p>
              <button
                type="button"
                disabled={uploadingFile}
                onClick={() => {
                  const input = document.createElement("input");
                  input.type = "file";
                  input.accept = ".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png";
                  input.onchange = (e) => {
                    const f = (e.target as HTMLInputElement).files?.[0];
                    if (f) handleFileUpload(f);
                  };
                  input.click();
                }}
                className={cn(
                  "flex items-center gap-2 rounded-lg border border-ptba-light-gray px-4 py-2.5 text-sm text-ptba-gray hover:bg-ptba-off-white transition-colors",
                  uploadingFile && "opacity-50 cursor-not-allowed"
                )}
              >
                {uploadingFile ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {uploadingFile ? "Mengunggah..." : "Tambah File"}
              </button>
              {supportingFiles.length > 0 && (
                <div className="mt-2 space-y-1.5">
                  {supportingFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between rounded-lg bg-ptba-off-white px-3 py-2">
                      <span className="flex items-center gap-1.5 text-sm text-ptba-charcoal">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        {file.name}
                      </span>
                      <button type="button" onClick={() => removeFile(index)} className="text-ptba-red hover:text-red-700 transition-colors">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
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
                      <label
                        key={doc.id}
                        className={cn(
                          "flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors",
                          isSelected ? "bg-ptba-steel-blue/5" : "hover:bg-ptba-off-white"
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleDoc(doc.id, selectedPhase1Docs, setSelectedPhase1Docs)}
                          className="mt-0.5 h-4 w-4 rounded border-ptba-light-gray text-ptba-steel-blue focus:ring-ptba-steel-blue/20"
                        />
                        <div>
                          <p className="text-sm font-medium text-ptba-charcoal">
                            {doc.name}
                            {doc.required && <span className="ml-1 text-[10px] text-ptba-red">*Wajib</span>}
                          </p>
                          <p className="text-xs text-ptba-gray">{doc.description}</p>
                        </div>
                      </label>
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
                      <label
                        key={doc.id}
                        className={cn(
                          "flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors",
                          isSelected ? "bg-ptba-navy/5" : "hover:bg-ptba-off-white"
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleDoc(doc.id, selectedPhase2Docs, setSelectedPhase2Docs)}
                          className="mt-0.5 h-4 w-4 rounded border-ptba-light-gray text-ptba-navy focus:ring-ptba-navy/20"
                        />
                        <div>
                          <p className="text-sm font-medium text-ptba-charcoal">
                            {doc.name}
                            {doc.required && <span className="ml-1 text-[10px] text-ptba-red">*Wajib</span>}
                          </p>
                          <p className="text-xs text-ptba-gray">{doc.description}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Legacy/General Documents */}
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-ptba-charcoal">Dokumen Kualifikasi Umum (Opsional)</h3>
                <p className="text-xs text-ptba-gray mt-0.5">Pilih dokumen dan tentukan fase pengumpulan untuk setiap dokumen</p>
              </div>
              {CATEGORIES.map((category) => {
                const docs = LEGACY_DOCUMENT_TYPES.filter((d) => d.category === category);
                const allSelected = docs.every((d) => d.id in selectedLegacyDocs);
                return (
                  <div key={category} className="rounded-lg border border-ptba-light-gray overflow-hidden">
                    <div className="flex items-center justify-between bg-ptba-section-bg px-4 py-2.5">
                      <h3 className="text-sm font-semibold text-ptba-charcoal">{CATEGORY_LABELS[category]}</h3>
                      <button
                        type="button"
                        onClick={() => {
                          if (allSelected) {
                            setSelectedLegacyDocs((prev) => {
                              const next = { ...prev };
                              docs.forEach((d) => delete next[d.id]);
                              return next;
                            });
                          } else {
                            setSelectedLegacyDocs((prev) => {
                              const next = { ...prev };
                              docs.forEach((d) => { if (!(d.id in next)) next[d.id] = "both"; });
                              return next;
                            });
                          }
                        }}
                        className={cn(
                          "text-xs font-medium transition-colors",
                          allSelected ? "text-ptba-red hover:text-red-700" : "text-ptba-steel-blue hover:text-ptba-navy"
                        )}
                      >
                        {allSelected ? "Batal Semua" : "Pilih Semua"}
                      </button>
                    </div>
                    <div className="divide-y divide-ptba-light-gray/50">
                      {docs.map((doc) => {
                        const isSelected = doc.id in selectedLegacyDocs;
                        return (
                          <div
                            key={doc.id}
                            className={cn(
                              "px-4 py-3 transition-colors",
                              isSelected ? "bg-ptba-steel-blue/5" : "hover:bg-ptba-off-white"
                            )}
                          >
                            <div className="flex items-start gap-3">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => {
                                  setSelectedLegacyDocs((prev) => {
                                    const next = { ...prev };
                                    if (isSelected) {
                                      delete next[doc.id];
                                    } else {
                                      next[doc.id] = "both";
                                    }
                                    return next;
                                  });
                                }}
                                className="mt-0.5 h-4 w-4 rounded border-ptba-light-gray text-ptba-steel-blue focus:ring-ptba-steel-blue/20 cursor-pointer"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-ptba-charcoal">{doc.name}</p>
                                <p className="text-xs text-ptba-gray">{doc.description}</p>
                              </div>
                              {isSelected && (
                                <select
                                  value={selectedLegacyDocs[doc.id]}
                                  onChange={(e) => {
                                    const val = e.target.value as "phase1" | "phase2" | "both";
                                    setSelectedLegacyDocs((prev) => ({ ...prev, [doc.id]: val }));
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                  className="shrink-0 rounded-md border border-ptba-light-gray bg-white px-2 py-1 text-xs font-medium text-ptba-charcoal outline-none focus:border-ptba-steel-blue focus:ring-1 focus:ring-ptba-steel-blue/20"
                                >
                                  <option value="phase1">Fase 1</option>
                                  <option value="phase2">Fase 2</option>
                                  <option value="both">Fase 1 & 2</option>
                                </select>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

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
                      <div key={index} className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Contoh: Sertifikat K3, Izin Lingkungan, dll."
                          value={doc.name}
                          onChange={(e) => updateCustomDocName(index, e.target.value)}
                          className={cn(inputClass, "flex-1")}
                        />
                        <select
                          value={doc.phase}
                          onChange={(e) => updateCustomDocPhase(index, e.target.value as "phase1" | "phase2" | "both")}
                          className="shrink-0 rounded-md border border-ptba-light-gray bg-white px-2 py-1 text-xs font-medium text-ptba-charcoal outline-none focus:border-ptba-steel-blue focus:ring-1 focus:ring-ptba-steel-blue/20"
                        >
                          <option value="phase1">Fase 1</option>
                          <option value="phase2">Fase 2</option>
                          <option value="both">Fase 1 &amp; 2</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => removeCustomDocument(index)}
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-ptba-red hover:bg-ptba-red/5 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Penunjukan PIC */}
        {currentStep === 4 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-semibold text-ptba-charcoal">Penunjukan PIC</h2>
              <p className="text-sm text-ptba-gray mt-1">Tentukan penanggung jawab evaluasi untuk setiap divisi</p>
            </div>

            <div className="space-y-3">
              {PIC_ROLES.map(({ role, label, description: desc }) => {
                const usersForRole = getUsersForRole(role);
                const selectedUserId = picAssignments[role] || "";
                return (
                  <div key={role} className="rounded-lg border border-ptba-light-gray p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-ptba-navy/10">
                        <UserPlus className="h-5 w-5 text-ptba-navy" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-ptba-charcoal">{label}</p>
                        <p className="text-xs text-ptba-gray">{desc}</p>
                        <select
                          value={selectedUserId}
                          onChange={(e) => handlePICChange(role, e.target.value)}
                          className={cn(inputClass, "mt-2")}
                        >
                          <option value="">Pilih PIC...</option>
                          {usersForRole.map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.name} ({u.department})
                            </option>
                          ))}
                        </select>
                      </div>
                      {selectedUserId && (
                        <CheckCircle2 className="h-5 w-5 shrink-0 text-green-500 mt-1" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="rounded-lg bg-ptba-gold/10 border border-ptba-gold/20 p-3">
              <p className="text-xs text-ptba-gray">
                <span className="font-medium text-ptba-charcoal">Info:</span> Hanya PIC yang ditunjuk yang dapat mengakses dan melakukan evaluasi pada proyek ini. Super Admin dan Direksi tetap memiliki akses penuh.
              </p>
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
                <div className="flex justify-between py-2.5">
                  <span className="text-sm text-ptba-gray">Nilai Proyek</span>
                  <span className="text-sm font-medium text-ptba-charcoal">
                    {parsedCapex > 0 ? formatCurrency(parsedCapex) : "-"}
                  </span>
                </div>
              </div>
            </div>

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
                {Object.keys(selectedLegacyDocs).length > 0 && (
                  <p className="text-xs text-ptba-gray">Kualifikasi Umum: {Object.keys(selectedLegacyDocs).length} dokumen</p>
                )}
              </div>
            </div>

            {/* PIC Summary */}
            <div className="rounded-lg border border-ptba-light-gray overflow-hidden">
              <div className="bg-ptba-section-bg px-4 py-2.5">
                <h3 className="text-sm font-semibold text-ptba-charcoal">PIC yang Ditunjuk</h3>
              </div>
              <div className="divide-y divide-ptba-light-gray/50 px-4">
                {PIC_ROLES.map(({ role, label }) => {
                  const userId = picAssignments[role];
                  const user = userId ? internalUsers.find((u) => u.id === userId) : null;
                  return (
                    <div key={role} className="flex justify-between py-2.5">
                      <span className="text-sm text-ptba-gray">{label}</span>
                      <span className="text-sm font-medium text-ptba-charcoal">
                        {user ? user.name : <span className="text-ptba-red text-xs">Belum ditunjuk</span>}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Submit Error */}
        {submitError && (
          <div className="mt-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {submitError}
          </div>
        )}

        {/* Step Error */}
        {stepError && (
          <div className="mt-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {stepError}
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-8 pt-4 border-t border-ptba-light-gray">
          <button
            onClick={currentStep === 1 ? () => router.push(`/projects/${id}`) : goPrev}
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
