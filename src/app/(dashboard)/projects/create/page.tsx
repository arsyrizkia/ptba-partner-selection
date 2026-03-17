"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, Upload, CheckCircle2, UserPlus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { PHASE1_DOCUMENT_TYPES, PHASE2_DOCUMENT_TYPES, PHASE3_DOCUMENT_TYPES, LEGACY_DOCUMENT_TYPES } from "@/lib/constants/document-types";
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

export default function CreateProjectPage() {
  const router = useRouter();
  const { accessToken } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Internal users for PIC
  const [internalUsers, setInternalUsers] = useState<InternalUser[]>([]);

  useEffect(() => {
    if (!accessToken) return;
    authApi().listUsers(accessToken).then((res) => {
      setInternalUsers(res.users.filter((u) => u.role !== "mitra" && u.status === "active"));
    }).catch(() => {});
  }, [accessToken]);

  // Step 1
  const [projectName, setProjectName] = useState("");
  const [projectType, setProjectType] = useState("");
  const [description, setDescription] = useState("");

  // Step 2
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [phase1Deadline, setPhase1Deadline] = useState("");
  const [phase2Deadline, setPhase2Deadline] = useState("");
  const [phase3Deadline, setPhase3Deadline] = useState("");
  const [supportingFiles, setSupportingFiles] = useState<{ file: File; name: string }[]>([]);
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

  // Template files per document type ID (stored in state until project is created)
  const [templateFiles, setTemplateFiles] = useState<Record<string, File>>({});

  // Step 4 - PIC Assignments
  const [picAssignments, setPicAssignments] = useState<Record<string, string>>({});

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
  const updateCustomDocPhase = (index: number, value: "phase1" | "phase2" | "phase3" | "both") => {
    setCustomDocuments((prev) => prev.map((d, i) => (i === index ? { ...d, phase: value } : d)));
  };

  // Supporting files - real file selection
  const handleAddFile = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png";
    input.onchange = (e) => {
      const f = (e.target as HTMLInputElement).files?.[0];
      if (f) setSupportingFiles((prev) => [...prev, { file: f, name: f.name }]);
    };
    input.click();
  };
  const removeFile = (index: number) => {
    setSupportingFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // PIC handlers
  const handlePICChange = (role: string, userId: string) => {
    setPicAssignments((prev) => ({ ...prev, [role]: userId }));
  };

  const getUsersForRole = (role: UserRole) => {
    return internalUsers.filter((u) => u.role === role);
  };

  const handleSubmit = async (andPublish = false) => {
    if (!accessToken || !projectType) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      const reqs = requirements.filter((r) => r.trim());
      const p1Docs = selectedPhase1Docs.map((id) => ({ documentTypeId: id }));
      const p2Docs = selectedPhase2Docs.map((id) => ({ documentTypeId: id }));
      const legacyDocs = Object.entries(selectedLegacyDocs).map(([id, phase]) => ({
        documentTypeId: id,
        phase,
      }));
      const pics = Object.entries(picAssignments)
        .filter(([, userId]) => userId)
        .map(([role, userId]) => {
          const user = internalUsers.find((u) => u.id === userId);
          return { role, userId, userName: user?.name };
        });

      const p3Docs = selectedPhase3Docs.map((id) => ({ documentTypeId: id }));
      const res = await projectApi(accessToken).create({
        name: projectName,
        type: projectType as any,
        description: description || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        phase1Deadline: phase1Deadline || undefined,
        phase2Deadline: phase2Deadline || undefined,
        phase3Deadline: phase3Deadline || undefined,
        requirements: reqs,
        phase1Documents: p1Docs,
        phase2Documents: p2Docs,
        phase3Documents: p3Docs,
        requiredDocuments: legacyDocs,
        picAssignments: pics,
        ptbaDocuments: [],
      });

      const newProjectId = res.data?.id;

      const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002/api";

      // Upload supporting files to MinIO
      if (newProjectId && supportingFiles.length > 0) {
        for (const sf of supportingFiles) {
          const formData = new FormData();
          formData.append("file", sf.file);
          formData.append("name", sf.name);
          formData.append("type", "supporting");
          await fetch(`${API_BASE}/projects/${newProjectId}/documents`, {
            method: "POST",
            headers: { Authorization: `Bearer ${accessToken}` },
            body: formData,
          });
        }
      }

      // Upload document templates
      if (newProjectId && Object.keys(templateFiles).length > 0) {
        const reqDocs = res.data?.requiredDocuments || [];
        for (const [docTypeId, file] of Object.entries(templateFiles)) {
          const reqDoc = reqDocs.find((d: any) => d.documentTypeId === docTypeId);
          if (reqDoc?.id) {
            const formData = new FormData();
            formData.append("file", file);
            await fetch(`${API_BASE}/projects/${newProjectId}/required-documents/${reqDoc.id}/template`, {
              method: "POST",
              headers: { Authorization: `Bearer ${accessToken}` },
              body: formData,
            });
          }
        }
      }

      if (andPublish && newProjectId) {
        await projectApi(accessToken).publish(newProjectId);
      }

      router.push("/projects");
    } catch (err) {
      if (err instanceof ApiClientError) {
        setSubmitError(err.message);
      } else {
        setSubmitError("Gagal membuat proyek. Silakan coba lagi.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    "w-full rounded-lg border border-ptba-light-gray bg-ptba-off-white px-3 py-2.5 text-sm outline-none focus:border-ptba-steel-blue focus:ring-2 focus:ring-ptba-steel-blue/20";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/projects"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-ptba-light-gray text-ptba-gray hover:bg-ptba-off-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-ptba-charcoal">Buat Proyek Baru</h1>
          <p className="text-sm text-ptba-gray">Lengkapi informasi proyek untuk memulai proses seleksi mitra</p>
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

            <div>
              <label className="mb-1 block text-sm font-medium text-ptba-charcoal">Dokumen Pendukung Proyek</label>
              <p className="mb-2 text-xs text-ptba-gray">Upload dokumen yang dapat dilihat oleh mitra (TOR, spesifikasi teknis, gambar, dll.)</p>
              <button
                type="button"
                onClick={handleAddFile}
                className="flex items-center gap-2 rounded-lg border border-ptba-light-gray px-4 py-2.5 text-sm text-ptba-gray hover:bg-ptba-off-white transition-colors"
              >
                <Upload className="h-4 w-4" />
                Tambah File
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
                                Upload Template
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
                                Upload Template
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
                                    const val = e.target.value as "phase1" | "phase2" | "phase3" | "both";
                                    setSelectedLegacyDocs((prev) => ({ ...prev, [doc.id]: val }));
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                  className="shrink-0 rounded-md border border-ptba-light-gray bg-white px-2 py-1 text-xs font-medium text-ptba-charcoal outline-none focus:border-ptba-steel-blue focus:ring-1 focus:ring-ptba-steel-blue/20"
                                >
                                  <option value="phase1">Fase 1</option>
                                  <option value="phase2">Fase 2</option>
                                  <option value="phase3">Fase 3</option>
                                  <option value="both">Semua Fase</option>
                                </select>
                              )}
                            </div>
                            {isSelected && (
                              <div className="ml-7 mt-2">
                                {templateFiles[doc.id] ? (
                                  <div className="flex items-center gap-2 rounded border border-green-200 bg-green-50/50 px-3 py-1.5">
                                    <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                                    <span className="text-xs text-green-700 truncate flex-1">{templateFiles[doc.id].name}</span>
                                    <button type="button" onClick={() => setTemplateFiles((p) => { const n = { ...p }; delete n[doc.id]; return n; })} className="text-xs text-red-500 hover:text-red-700 shrink-0">Hapus</button>
                                  </div>
                                ) : (
                                  <label className="inline-flex items-center gap-1.5 rounded border border-dashed border-ptba-light-gray px-3 py-1.5 text-xs text-ptba-gray hover:bg-ptba-off-white cursor-pointer transition-colors">
                                    <Upload className="h-3 w-3" />
                                    Upload Template
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
                          <option value="both">Fase 1 & 2</option>
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
                  <span className="text-sm text-ptba-gray">Tipe Proyek</span>
                  <span className="text-sm font-medium text-ptba-charcoal">{projectType || "-"}</span>
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
            onClick={currentStep === 1 ? () => router.push("/projects") : goPrev}
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
          )}
        </div>
      </div>
    </div>
  );
}
