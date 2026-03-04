"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, Upload, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { formatCurrency } from "@/lib/utils/format";
import { DOCUMENT_TYPES } from "@/lib/constants/document-types";

const STEPS = [
  { key: 1, label: "Informasi Dasar" },
  { key: 2, label: "Timeline & Pendaftaran" },
  { key: 3, label: "Persyaratan & Dokumen" },
  { key: 4, label: "Ringkasan" },
];

const PROJECT_TYPES = [
  { value: "", label: "Pilih Tipe Proyek" },
  { value: "CAPEX", label: "CAPEX" },
  { value: "OPEX", label: "OPEX" },
  { value: "Strategis", label: "Strategis" },
];

const CATEGORY_LABELS: Record<string, string> = {
  legal: "Legal",
  keuangan: "Keuangan",
  teknis: "Teknis",
  administrasi: "Administrasi",
};

const CATEGORIES = ["legal", "keuangan", "teknis", "administrasi"] as const;

export default function CreateProjectPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);

  // Step 1
  const [projectName, setProjectName] = useState("");
  const [projectType, setProjectType] = useState("");
  const [capexValue, setCapexValue] = useState("");
  const [description, setDescription] = useState("");

  // Step 2
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [applicationDeadline, setApplicationDeadline] = useState("");
  const [supportingFiles, setSupportingFiles] = useState<string[]>([]);
  const [isOpenForApplication, setIsOpenForApplication] = useState(false);

  // Step 3
  const [requirements, setRequirements] = useState<string[]>([""]);
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [customDocuments, setCustomDocuments] = useState<string[]>([]);

  const goNext = () => {
    if (currentStep < 4) setCurrentStep((prev) => prev + 1);
  };
  const goPrev = () => {
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
  const toggleDocument = (docId: string) => {
    setSelectedDocuments((prev) =>
      prev.includes(docId) ? prev.filter((id) => id !== docId) : [...prev, docId]
    );
  };

  const toggleCategory = (category: string) => {
    const categoryDocIds = DOCUMENT_TYPES.filter((d) => d.category === category).map((d) => d.id);
    const allSelected = categoryDocIds.every((id) => selectedDocuments.includes(id));
    if (allSelected) {
      setSelectedDocuments((prev) => prev.filter((id) => !categoryDocIds.includes(id)));
    } else {
      setSelectedDocuments((prev) => [...new Set([...prev, ...categoryDocIds])]);
    }
  };

  // Custom document handlers
  const addCustomDocument = () => setCustomDocuments((prev) => [...prev, ""]);
  const removeCustomDocument = (index: number) => {
    setCustomDocuments((prev) => prev.filter((_, i) => i !== index));
  };
  const updateCustomDocument = (index: number, value: string) => {
    setCustomDocuments((prev) => prev.map((d, i) => (i === index ? value : d)));
  };

  // Supporting files simulation
  const handleAddFile = () => {
    const fileName = `Dokumen_${projectName.replace(/\s+/g, "_") || "Proyek"}_${supportingFiles.length + 1}.pdf`;
    setSupportingFiles((prev) => [...prev, fileName]);
  };
  const removeFile = (index: number) => {
    setSupportingFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    alert("Proyek berhasil dibuat!");
    router.push("/projects");
  };

  const parsedCapex = Number(capexValue) || 0;

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
                      "mt-1.5 text-[10px] font-medium text-center w-24",
                      isActive ? "text-ptba-navy" : isCompleted ? "text-green-600" : "text-ptba-gray"
                    )}
                  >
                    {step.label}
                  </p>
                </div>
                {!isLast && (
                  <div className={cn("h-0.5 w-10 mx-1 mb-5", isCompleted ? "bg-green-500" : "bg-ptba-light-gray")} />
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
              <label className="mb-1 block text-sm font-medium text-ptba-charcoal">Tipe Proyek</label>
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
              <label className="mb-1 block text-sm font-medium text-ptba-charcoal">Nilai CAPEX</label>
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
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-ptba-charcoal">Tanggal Selesai</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-ptba-charcoal">
                Batas Waktu Pendaftaran Mitra
              </label>
              <input
                type="date"
                value={applicationDeadline}
                onChange={(e) => setApplicationDeadline(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-ptba-charcoal">
                Dokumen Pendukung Proyek
              </label>
              <p className="mb-2 text-xs text-ptba-gray">
                Upload dokumen yang dapat dilihat oleh mitra (TOR, spesifikasi teknis, gambar, dll.)
              </p>
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
                        {file}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="text-ptba-red hover:text-red-700 transition-colors"
                      >
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
                  {isOpenForApplication
                    ? "Mitra dapat mendaftar ke proyek ini"
                    : "Pendaftaran mitra belum dibuka"}
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

            {/* Dokumen yang Diperlukan */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-ptba-charcoal">Dokumen yang Diperlukan</h2>
              {CATEGORIES.map((category) => {
                const docs = DOCUMENT_TYPES.filter((d) => d.category === category);
                const allSelected = docs.every((d) => selectedDocuments.includes(d.id));
                return (
                  <div key={category} className="rounded-lg border border-ptba-light-gray overflow-hidden">
                    {/* Category header */}
                    <div className="flex items-center justify-between bg-ptba-section-bg px-4 py-2.5">
                      <h3 className="text-sm font-semibold text-ptba-charcoal">
                        {CATEGORY_LABELS[category]}
                      </h3>
                      <button
                        type="button"
                        onClick={() => toggleCategory(category)}
                        className={cn(
                          "text-xs font-medium transition-colors",
                          allSelected ? "text-ptba-red hover:text-red-700" : "text-ptba-steel-blue hover:text-ptba-navy"
                        )}
                      >
                        {allSelected ? "Batal Semua" : "Pilih Semua"}
                      </button>
                    </div>
                    {/* Documents */}
                    <div className="divide-y divide-ptba-light-gray/50">
                      {docs.map((doc) => {
                        const isSelected = selectedDocuments.includes(doc.id);
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
                              onChange={() => toggleDocument(doc.id)}
                              className="mt-0.5 h-4 w-4 rounded border-ptba-light-gray text-ptba-steel-blue focus:ring-ptba-steel-blue/20"
                            />
                            <div>
                              <p className="text-sm font-medium text-ptba-charcoal">{doc.name}</p>
                              <p className="text-xs text-ptba-gray">{doc.description}</p>
                            </div>
                          </label>
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
                          value={doc}
                          onChange={(e) => updateCustomDocument(index, e.target.value)}
                          className={cn(inputClass, "flex-1")}
                        />
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

        {/* Step 4: Ringkasan */}
        {currentStep === 4 && (
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
                <div className="flex justify-between py-2.5">
                  <span className="text-sm text-ptba-gray">Nilai CAPEX</span>
                  <span className="text-sm font-medium text-ptba-charcoal">
                    {parsedCapex > 0 ? formatCurrency(parsedCapex) : "-"}
                  </span>
                </div>
                <div className="flex justify-between py-2.5">
                  <span className="text-sm text-ptba-gray">Deskripsi</span>
                  <span className="max-w-[60%] text-right text-sm font-medium text-ptba-charcoal">
                    {description || "-"}
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
                  <span className="text-sm text-ptba-gray">Tanggal Mulai</span>
                  <span className="text-sm font-medium text-ptba-charcoal">{startDate || "-"}</span>
                </div>
                <div className="flex justify-between py-2.5">
                  <span className="text-sm text-ptba-gray">Tanggal Selesai</span>
                  <span className="text-sm font-medium text-ptba-charcoal">{endDate || "-"}</span>
                </div>
                <div className="flex justify-between py-2.5">
                  <span className="text-sm text-ptba-gray">Batas Pendaftaran Mitra</span>
                  <span className="text-sm font-medium text-ptba-charcoal">{applicationDeadline || "-"}</span>
                </div>
                <div className="flex justify-between py-2.5">
                  <span className="text-sm text-ptba-gray">Dokumen Pendukung</span>
                  <span className="text-sm font-medium text-ptba-charcoal">
                    {supportingFiles.length > 0 ? `${supportingFiles.length} file` : "Belum ada"}
                  </span>
                </div>
                <div className="flex justify-between py-2.5">
                  <span className="text-sm text-ptba-gray">Pendaftaran Mitra</span>
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-0.5 text-xs font-medium",
                      isOpenForApplication
                        ? "bg-green-100 text-green-700"
                        : "bg-ptba-gray/10 text-ptba-gray"
                    )}
                  >
                    {isOpenForApplication ? "Dibuka" : "Ditutup"}
                  </span>
                </div>
              </div>
            </div>

            {/* Persyaratan */}
            <div className="rounded-lg border border-ptba-light-gray overflow-hidden">
              <div className="bg-ptba-section-bg px-4 py-2.5">
                <h3 className="text-sm font-semibold text-ptba-charcoal">Persyaratan Mitra</h3>
              </div>
              <div className="px-4 py-3">
                {requirements.filter((r) => r.trim()).length > 0 ? (
                  <ul className="space-y-1.5">
                    {requirements
                      .filter((r) => r.trim())
                      .map((req, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-ptba-charcoal">
                          <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-ptba-navy" />
                          {req}
                        </li>
                      ))}
                  </ul>
                ) : (
                  <p className="text-sm text-ptba-gray">Belum ada persyaratan ditambahkan</p>
                )}
              </div>
            </div>

            {/* Dokumen */}
            <div className="rounded-lg border border-ptba-light-gray overflow-hidden">
              <div className="bg-ptba-section-bg px-4 py-2.5">
                <h3 className="text-sm font-semibold text-ptba-charcoal">
                  Dokumen yang Diperlukan ({selectedDocuments.length + customDocuments.filter((d) => d.trim()).length})
                </h3>
              </div>
              <div className="px-4 py-3">
                {selectedDocuments.length > 0 || customDocuments.filter((d) => d.trim()).length > 0 ? (
                  <div className="space-y-1.5">
                    {selectedDocuments.map((docId) => {
                      const doc = DOCUMENT_TYPES.find((d) => d.id === docId);
                      if (!doc) return null;
                      return (
                        <div key={docId} className="flex items-center gap-2 text-sm text-ptba-charcoal">
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
                          {doc.name}
                        </div>
                      );
                    })}
                    {customDocuments
                      .filter((d) => d.trim())
                      .map((doc, i) => (
                        <div key={`custom-${i}`} className="flex items-center gap-2 text-sm text-ptba-charcoal">
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-ptba-steel-blue" />
                          {doc}
                          <span className="text-[10px] text-ptba-gray">(custom)</span>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-sm text-ptba-gray">Belum ada dokumen dipilih</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-8 pt-4 border-t border-ptba-light-gray">
          <button
            onClick={currentStep === 1 ? () => router.push("/projects") : goPrev}
            className="rounded-lg border border-ptba-navy px-4 py-2 text-sm font-medium text-ptba-navy hover:bg-ptba-navy/5 transition-colors"
          >
            {currentStep === 1 ? "Batal" : "Sebelumnya"}
          </button>
          {currentStep < 4 ? (
            <button
              onClick={goNext}
              className="rounded-lg bg-ptba-navy px-4 py-2 text-sm font-medium text-white hover:bg-ptba-navy/90 transition-colors"
            >
              Selanjutnya
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              className="rounded-lg bg-ptba-gold px-5 py-2 text-sm font-bold text-ptba-charcoal hover:bg-ptba-gold-light transition-colors"
            >
              Buat Proyek
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
