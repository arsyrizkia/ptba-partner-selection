"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Upload,
  CheckCircle2,
  FileText,
  Download,
  AlertTriangle,
  Loader2,
  Trash2,
  Lock,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useLocale } from "@/lib/i18n/locale-context";
import { cn } from "@/lib/utils/cn";
import { useAuth } from "@/lib/auth/auth-context";
import { api, projectApi, downloadDocument } from "@/lib/api/client";
import { DOCUMENT_TYPES } from "@/lib/constants/document-types";
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002/api";

export default function MitraPhase2Page() {
  const router = useRouter();
  const params = useParams();
  const { user, accessToken } = useAuth();
  const projectId = params.id as string;
  const t = useTranslations("phase2");
  const tc = useTranslations("common");
  const { locale } = useLocale();

  // Data state
  const [project, setProject] = useState<any>(null);
  const [application, setApplication] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // PTBA doc downloads
  const [downloadedDocs, setDownloadedDocs] = useState<Set<string>>(new Set());
  const [downloadingDoc, setDownloadingDoc] = useState<string | null>(null);

  // Phase 2 document uploads: docTypeId -> { name, uploading, dbId }
  const [uploadedDocs, setUploadedDocs] = useState<
    Record<string, { name: string; uploading: boolean; dbId?: string }>
  >({});

  // Submission
  const [submitting, setSubmitting] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Phase 2 upload document types — driven by the project's
  // project_required_documents rows (phase2), editable by admin
  const phase2DocTypes: { id: string; name: string; description: string; required: boolean }[] =
    (project?.requiredDocuments || [])
      .filter((d: any) => d.phase === "phase2")
      .map((d: any) => {
        const meta = DOCUMENT_TYPES.find((dt) => dt.id === d.documentTypeId);
        return {
          id: d.documentTypeId,
          name:
            meta?.name ||
            (d.documentTypeId.startsWith("custom_")
              ? d.documentTypeId.slice(7)
              : d.documentTypeId
            ).replace(/_/g, " "),
          description: d.description || meta?.description || "",
          required: d.isRequired !== false,
        };
      });

  // ─── Fetch Data ───

  const fetchData = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError("");
    try {
      const [projRes, appRes] = await Promise.all([
        projectApi(accessToken).getById(projectId),
        api<{ applications: any[] }>("/applications", { token: accessToken }),
      ]);
      setProject(projRes.data);

      const existingBasic = (appRes.applications || []).find(
        (a: any) => a.project_id === projectId
      );

      if (!existingBasic) {
        setApplication(null);
        setLoading(false);
        return;
      }

      // Fetch full detail to get documents
      let existing = existingBasic;
      try {
        const detailRes = await api<{ application: any }>(
          `/applications/${existingBasic.id}`,
          { token: accessToken }
        );
        existing = detailRes.application;
      } catch {
        // Fall back to basic
      }

      setApplication(existing);

      // Initialize uploaded phase2 documents
      if (existing.phase2Documents?.length) {
        const restored: Record<string, { name: string; uploading: boolean; dbId?: string }> = {};
        for (const doc of existing.phase2Documents) {
          restored[doc.document_type_id] = {
            name: doc.name,
            uploading: false,
            dbId: doc.id,
          };
        }
        setUploadedDocs(restored);
      }

      // Check if already submitted for phase2
      if (existing.phase === "phase2" && existing.status === "Dikirim") {
        setSubmitted(true);
      }
    } catch {
      setProject(null);
    } finally {
      setLoading(false);
    }
  }, [projectId, accessToken]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ─── Handlers ───

  const handleDownloadDoc = async (docId: string, fileKey: string) => {
    if (!accessToken || !application?.id) return;
    setDownloadingDoc(docId);
    setError("");

    try {
      // Record the download via API
      await api<{ url: string; document: any }>(
        `/applications/${application.id}/download-ptba-doc/${docId}`,
        { method: "POST", token: accessToken }
      );

      // Download through the helper
      await downloadDocument(fileKey, accessToken!);

      setDownloadedDocs((prev) => new Set(prev).add(docId));
    } catch (err: any) {
      setError(err.message || t("errors.downloadFailed"));
    } finally {
      setDownloadingDoc(null);
    }
  };

  const handleUploadDoc = async (docTypeId: string, file: File) => {
    if (!accessToken || !application?.id) return;
    setError("");

    const docTypeMeta = phase2DocTypes.find((d) => d.id === docTypeId);
    const autoName = `${docTypeMeta?.name || docTypeId} - ${user?.name || "Mitra"}`;

    const existingDoc = uploadedDocs[docTypeId];
    setUploadedDocs((prev) => ({
      ...prev,
      [docTypeId]: { name: autoName, uploading: true },
    }));

    try {
      // Delete old document if replacing
      if (existingDoc?.dbId) {
        await fetch(
          `${API_BASE}/applications/${application.id}/documents/${existingDoc.dbId}`,
          {
            method: "DELETE",
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );
      }

      const formData = new FormData();
      formData.append("file", file);
      formData.append("documentTypeId", docTypeId);
      formData.append("name", autoName);
      formData.append("phase", "phase2");

      const res = await fetch(
        `${API_BASE}/applications/${application.id}/documents`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${accessToken}` },
          body: formData,
        }
      );

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || t("errors.uploadDocFailed"));
      }

      setUploadedDocs((prev) => ({
        ...prev,
        [docTypeId]: {
          name: autoName,
          uploading: false,
          dbId: resData.document?.id,
        },
      }));
    } catch (err: any) {
      setError(err.message || t("errors.uploadDocFailed"));
      setUploadedDocs((prev) => {
        const next = { ...prev };
        delete next[docTypeId];
        return next;
      });
    }
  };

  const handleDeleteDoc = async (docTypeId: string) => {
    if (!accessToken || !application?.id) return;
    const doc = uploadedDocs[docTypeId];
    if (!doc?.dbId) return;

    setUploadedDocs((prev) => ({
      ...prev,
      [docTypeId]: { ...prev[docTypeId], uploading: true },
    }));

    try {
      const res = await fetch(
        `${API_BASE}/applications/${application.id}/documents/${doc.dbId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
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
      setUploadedDocs((prev) => ({
        ...prev,
        [docTypeId]: { ...doc, uploading: false },
      }));
    }
  };

  const handleSubmit = async () => {
    if (!accessToken || !application?.id) return;
    setSubmitting(true);
    setError("");

    try {
      await api(`/applications/${application.id}/submit-phase2`, {
        method: "POST",
        token: accessToken,
      });
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || t("errors.submitFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Derived state ───

  const allPtbaDocuments: any[] = project?.ptbaDocuments ?? project?.ptba_documents ?? [];
  const ptbaDocuments = allPtbaDocuments.filter((d: any) => d.phase === "phase2");

  // Phase 2 part timelines
  const phase2Config = project?.phase2Config as { part1Start?: string; part1End?: string; part2Start?: string; part2End?: string } | null;
  const now = new Date();
  const isPart1Period = phase2Config?.part1Start && phase2Config?.part1End
    ? now >= new Date(phase2Config.part1Start) && now <= new Date(phase2Config.part1End)
    : !phase2Config; // fallback: no config → allow both (legacy)
  const isPart2Period = phase2Config?.part2Start && phase2Config?.part2End
    ? now >= new Date(phase2Config.part2Start) && now <= new Date(phase2Config.part2End)
    : !phase2Config;
  const isBeforePhase2 = phase2Config?.part1Start ? now < new Date(phase2Config.part1Start) : false;
  const isAfterPart1 = phase2Config?.part1End ? now > new Date(phase2Config.part1End) : false;
  const canUpload = isPart2Period && !submitted;

  const requiredPhase2Count = phase2DocTypes.filter(
    (d) => d.required
  ).length;
  const uploadedRequiredCount = phase2DocTypes.filter(
    (d) => d.required && uploadedDocs[d.id]
  ).length;
  const allRequiredUploaded = uploadedRequiredCount === requiredPhase2Count;
  const canSubmit = phase2DocTypes.length > 0 && allRequiredUploaded && !submitting && !submitted;

  // ─── Loading state ───

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-ptba-navy" />
        <span className="ml-3 text-ptba-gray">{tc("loadingData")}</span>
      </div>
    );
  }

  // ─── Guard: project not found ───

  if (!project) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-sm text-ptba-steel-blue hover:text-ptba-navy"
        >
          <ArrowLeft className="h-4 w-4" /> {tc("back")}
        </button>
        <div className="rounded-xl bg-white p-12 text-center shadow-sm">
          <p className="text-ptba-gray">{tc("projectNotFound")}</p>
        </div>
      </div>
    );
  }

  // ─── Guard: no application found ───

  if (!application) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-sm text-ptba-steel-blue hover:text-ptba-navy"
        >
          <ArrowLeft className="h-4 w-4" /> {tc("back")}
        </button>
        <div className="rounded-xl bg-white p-12 text-center shadow-sm">
          <AlertTriangle className="mx-auto h-12 w-12 text-ptba-gold" />
          <p className="mt-3 text-lg font-semibold text-ptba-charcoal">
            {t("applicationNotFound")}
          </p>
          <p className="mt-1 text-sm text-ptba-gray">
            {t("applicationNotFoundDesc")}
          </p>
        </div>
      </div>
    );
  }

  // ─── Guard: project not in phase2 yet ───

  const projectPhase = project?.phase || "";
  if (!projectPhase.startsWith("phase2") && !projectPhase.startsWith("phase3") && projectPhase !== "completed") {
    return (
      <div className="space-y-6">
        <button onClick={() => router.back()} className="inline-flex items-center gap-1.5 text-sm text-ptba-steel-blue hover:text-ptba-navy">
          <ArrowLeft className="h-4 w-4" /> {tc("back")}
        </button>
        <div className="rounded-xl bg-white p-12 text-center shadow-sm">
          <Lock className="mx-auto h-12 w-12 text-ptba-gray" />
          <p className="mt-3 text-lg font-semibold text-ptba-charcoal">Fase 2 Belum Dibuka</p>
          <p className="mt-1 text-sm text-ptba-gray">Proses Fase 2 belum dimulai untuk proyek ini. Silakan tunggu pemberitahuan dari tim PTBA.</p>
          <button onClick={() => router.push(`/mitra/projects/${projectId}`)} className="mt-4 rounded-lg bg-ptba-navy px-4 py-2 text-sm font-medium text-white hover:bg-ptba-navy/90 transition-colors">
            {tc("backToProjectDetail")}
          </button>
        </div>
      </div>
    );
  }

  // ─── Guard: not shortlisted (phase1_result !== 'Lolos') ───

  if (application.phase1_result !== "Lolos") {
    return (
      <div className="space-y-6">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-sm text-ptba-steel-blue hover:text-ptba-navy"
        >
          <ArrowLeft className="h-4 w-4" /> {tc("back")}
        </button>
        <div className="rounded-xl bg-white p-12 text-center shadow-sm">
          <Lock className="mx-auto h-12 w-12 text-ptba-gray" />
          <p className="mt-3 text-lg font-semibold text-ptba-charcoal">
            {t("accessDenied")}
          </p>
          <p className="mt-1 text-sm text-ptba-gray">
            {t("accessDeniedDesc")}
          </p>
          <button
            onClick={() => router.push(`/mitra/projects/${projectId}`)}
            className="mt-4 rounded-lg bg-ptba-navy px-4 py-2 text-sm font-medium text-white hover:bg-ptba-navy/90 transition-colors"
          >
            {tc("backToProjectDetail")}
          </button>
        </div>
      </div>
    );
  }

  // Helper to get file_key for download in submitted mode
  const getPhase2DocFileKey = (docTypeId: string): string | undefined => {
    const docs = application?.phase2Documents || [];
    return docs.find((d: any) => d.document_type_id === docTypeId)?.file_key;
  };

  const fmtDate = (d?: string) => d
    ? new Date(d).toLocaleString("id-ID", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" }) + " WIB"
    : "—";

  return (
    <div className="space-y-6">
      {/* Error banner */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Back button */}
      <button
        onClick={() => router.push(`/mitra/projects/${projectId}`)}
        className="inline-flex items-center gap-1.5 text-sm text-ptba-steel-blue hover:text-ptba-navy"
      >
        <ArrowLeft className="h-4 w-4" /> {tc("backToProjectDetail")}
      </button>

      {/* Status Banner (submitted) */}
      {submitted && (
        <div className="rounded-xl bg-green-50 border border-green-200 p-5">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-6 w-6 text-green-600 shrink-0" />
            <div>
              <p className="text-sm font-bold text-green-800">{t("submittedTitle")}</p>
              <p className="text-xs text-green-700 mt-0.5">
                {t("submittedDesc")} <span className="font-medium">{project.name}</span>. {t("submittedEvaluation")}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="rounded-xl bg-gradient-to-r from-ptba-navy to-ptba-steel-blue p-6 text-white">
        <p className="text-white/70 text-sm">{t("title")}</p>
        <h1 className="mt-1 text-2xl font-bold">{project.name}</h1>
        <p className="mt-2 text-white/80 text-sm">
          {t("description")}
        </p>
        <div className="mt-4 flex items-center gap-6 text-sm">
          <span className="flex items-center gap-1.5">
            <FileText className="h-4 w-4" />
            {uploadedRequiredCount}/{requiredPhase2Count} {t("requiredDocs")}
          </span>
        </div>
      </div>

      {/* Part timeline banner */}
      {phase2Config && !submitted && (
        <div className={cn(
          "rounded-xl border p-4",
          isBeforePhase2 ? "border-ptba-light-gray bg-white" :
          isPart1Period ? "border-blue-200 bg-blue-50" :
          isPart2Period ? "border-green-200 bg-green-50" :
          "border-ptba-light-gray bg-white"
        )}>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {isBeforePhase2 && <Lock className="h-4 w-4 text-ptba-gray shrink-0" />}
              {isPart1Period && <FileText className="h-4 w-4 text-blue-600 shrink-0" />}
              {isPart2Period && <Upload className="h-4 w-4 text-green-600 shrink-0" />}
              {!isPart1Period && !isPart2Period && !isBeforePhase2 && <CheckCircle2 className="h-4 w-4 text-ptba-gray shrink-0" />}
              <div>
                {isBeforePhase2 && <p className="text-sm font-semibold text-ptba-charcoal">Fase 2 Belum Dimulai</p>}
                {isPart1Period && <p className="text-sm font-semibold text-blue-800">Bagian 1: Pelajari Dokumen</p>}
                {isPart2Period && <p className="text-sm font-semibold text-green-800">Bagian 2: Pengiriman Dokumen</p>}
                {!isPart1Period && !isPart2Period && !isBeforePhase2 && <p className="text-sm font-semibold text-ptba-charcoal">Periode Pengiriman Telah Berakhir</p>}
                <p className="text-xs text-ptba-gray mt-0.5">
                  {isBeforePhase2 && `Bagian 1 (Pelajari Dokumen) dimulai pada ${fmtDate(phase2Config?.part1Start)}`}
                  {isPart1Period && `Berlangsung hingga ${fmtDate(phase2Config?.part1End)} — Pengiriman dibuka ${fmtDate(phase2Config?.part2Start)}`}
                  {isPart2Period && `Deadline pengiriman: ${fmtDate(phase2Config?.part2End)}`}
                  {!isPart1Period && !isPart2Period && !isBeforePhase2 && "Dokumen tidak dapat diubah lagi."}
                </p>
              </div>
            </div>
            <div className="flex gap-3 text-[11px] font-medium shrink-0">
              <div className={cn("rounded-full px-2.5 py-1", isAfterPart1 || isPart2Period ? "bg-green-100 text-green-700" : isPart1Period ? "bg-blue-600 text-white" : "bg-ptba-light-gray text-ptba-gray")}>Bagian 1</div>
              <div className={cn("rounded-full px-2.5 py-1", submitted ? "bg-green-100 text-green-700" : isPart2Period ? "bg-green-600 text-white" : "bg-ptba-light-gray text-ptba-gray")}>Bagian 2</div>
            </div>
          </div>
        </div>
      )}

      {/* Progress Stepper */}
      {!submitted && <div className="rounded-xl bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          {[
            { step: 1, label: "Pelajari Dokumen PTBA", done: downloadedDocs.size === ptbaDocuments.length && ptbaDocuments.length > 0 },
            { step: 2, label: "Unggah Dokumen", done: phase2DocTypes.length > 0 && allRequiredUploaded },
            { step: 3, label: "Menunggu Evaluasi", done: submitted },
          ].map((s, idx, arr) => (
            <div key={s.step} className="flex items-center flex-1 last:flex-initial">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors",
                    s.done
                      ? "bg-green-100 text-green-700"
                      : idx === 0 || arr[idx - 1].done
                      ? "bg-ptba-navy text-white"
                      : "bg-ptba-light-gray text-ptba-gray"
                  )}
                >
                  {s.done ? <CheckCircle2 className="h-4 w-4" /> : s.step}
                </div>
                <span className={cn(
                  "mt-1.5 text-[10px] font-medium text-center max-w-[80px]",
                  s.done ? "text-green-700" : "text-ptba-gray"
                )}>
                  {s.label}
                </span>
              </div>
              {idx < arr.length - 1 && (
                <div className={cn(
                  "flex-1 h-0.5 mx-2 mt-[-18px]",
                  arr[idx].done ? "bg-green-300" : "bg-ptba-light-gray"
                )} />
              )}
            </div>
          ))}
        </div>
      </div>}

      {/* Section 1: Download PTBA Documents */}
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold bg-ptba-gold-light text-ptba-charcoal"
          >
            1
          </div>
          <h2 className="text-lg font-semibold text-ptba-charcoal">
            {t("ptbaDocs.title")}
          </h2>
        </div>

        <div className="space-y-3">
          {ptbaDocuments.length === 0 ? (
            <p className="text-sm text-ptba-gray py-4 text-center">
              {t("ptbaDocs.noDocs")}
            </p>
          ) : (
            ptbaDocuments.map((doc: any) => {
              const docId = doc.id;
              const fileKey = doc.fileKey ?? doc.file_key;
              const isDownloaded = downloadedDocs.has(docId);
              const isDownloading = downloadingDoc === docId;
              return (
                <div
                  key={docId}
                  className={cn(
                    "rounded-lg border p-4 transition-colors",
                    isDownloaded
                      ? "border-green-200 bg-green-50/50"
                      : "border-ptba-light-gray"
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {isDownloaded ? (
                        <CheckCircle2 className="h-5 w-5 shrink-0 text-green-500" />
                      ) : (
                        <FileText className="h-5 w-5 shrink-0 text-ptba-gray" />
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-ptba-charcoal truncate">
                          {doc.name}
                        </p>
                        <p className="text-xs text-ptba-gray">{doc.type}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDownloadDoc(docId, fileKey)}
                      disabled={isDownloading}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors shrink-0",
                        isDownloaded
                          ? "border border-green-300 text-green-700 hover:bg-green-50"
                          : "bg-ptba-navy text-white hover:bg-ptba-navy/90"
                      )}
                    >
                      {isDownloading ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Download className="h-3.5 w-3.5" />
                      )}
                      {isDownloading ? tc("downloading") : isDownloaded ? tc("redownload") : tc("download")}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Section 2: Upload Fase 2 Documents */}
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-2">
          <div className={cn("flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold", isPart2Period || !phase2Config ? "bg-ptba-gold-light text-ptba-charcoal" : "bg-ptba-light-gray text-ptba-gray")}>
            2
          </div>
          <h2 className="text-lg font-semibold text-ptba-charcoal">
            {t("uploadDocs.title")}
          </h2>
          {phase2Config && !isPart2Period && !submitted && (
            <span className="inline-flex items-center gap-1 rounded-full bg-ptba-light-gray px-2.5 py-0.5 text-xs font-medium text-ptba-gray">
              <Lock className="h-3 w-3" />
              {isPart1Period ? `Dibuka ${fmtDate(phase2Config?.part2Start)}` : "Terkunci"}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-ptba-gray">
            {t("uploadDocs.description")}
          </p>
          {phase2DocTypes.length > 0 && (
            <span className="text-sm text-ptba-gray">
              {uploadedRequiredCount}/{requiredPhase2Count} {t("uploadDocs.fulfilled")}
            </span>
          )}
        </div>

        {/* Progress bar */}
        {phase2DocTypes.length > 0 && <div className="mb-6 h-2 overflow-hidden rounded-full bg-ptba-light-gray">
          <div
            className={cn(
              "h-full rounded-full transition-all",
              allRequiredUploaded ? "bg-green-500" : "bg-ptba-gold"
            )}
            style={{
              width: `${
                requiredPhase2Count > 0
                  ? (uploadedRequiredCount / requiredPhase2Count) * 100
                  : 0
              }%`,
            }}
          />
        </div>}

        <div className="space-y-3">
          {phase2DocTypes.length === 0 && (
            <p className="text-sm text-ptba-gray py-4 text-center">
              {t("uploadDocs.noDocs")}
            </p>
          )}
          {phase2DocTypes.map((doc) => {
            const docState = uploadedDocs[doc.id];
            const isUploaded = !!docState && !docState.uploading;
            const isUploading = !!docState?.uploading;
            return (
              <div
                key={doc.id}
                className={cn(
                  "rounded-lg border p-4 transition-colors",
                  isUploaded
                    ? "border-green-200 bg-green-50/50"
                    : "border-ptba-light-gray"
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    {isUploading ? (
                      <Loader2 className="h-5 w-5 mt-0.5 shrink-0 animate-spin text-ptba-gold" />
                    ) : isUploaded ? (
                      <CheckCircle2 className="h-5 w-5 mt-0.5 shrink-0 text-green-500" />
                    ) : (
                      <FileText className="h-5 w-5 mt-0.5 shrink-0 text-ptba-gray" />
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-ptba-charcoal">
                        {doc.name}
                        {doc.required && (
                          <span className="ml-1 text-[10px] text-ptba-red font-medium">
                            {tc("requiredMark")}
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-ptba-gray mt-0.5">
                        {doc.description}
                      </p>
                      {isUploaded && docState && (
                        <p className="text-xs text-green-600 mt-1">
                          {docState.name}
                        </p>
                      )}
                      {isUploading && (
                        <p className="text-xs text-ptba-gold mt-1">{tc("uploading")}</p>
                      )}
                    </div>
                  </div>
                  <div className="shrink-0 flex items-center gap-1.5">
                    {(submitted || (!canUpload && isUploaded)) ? (
                      /* Read-only: show download button */
                      (() => {
                        const fileKey = getPhase2DocFileKey(doc.id);
                        return fileKey ? (
                          <button
                            type="button"
                            onClick={() => downloadDocument(fileKey, accessToken!, docState?.name)}
                            className="inline-flex items-center gap-1 rounded-lg border border-ptba-light-gray px-2.5 py-1.5 text-xs font-medium text-ptba-gray hover:bg-ptba-section-bg transition-colors"
                          >
                            <Download className="h-3 w-3" /> {tc("download")}
                          </button>
                        ) : null;
                      })()
                    ) : !canUpload ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-ptba-light-gray px-2.5 py-1 text-xs font-medium text-ptba-gray">
                        <Lock className="h-3 w-3" />
                        Belum dibuka
                      </span>
                    ) : isUploaded ? (
                      <>
                        <button
                          onClick={() => handleDeleteDoc(doc.id)}
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
                            accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) handleUploadDoc(doc.id, f);
                              e.target.value = "";
                            }}
                          />
                        </label>
                      </>
                    ) : isUploading ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        {tc("uploading")}
                      </span>
                    ) : (
                      <label className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer bg-ptba-navy text-white hover:bg-ptba-navy/90">
                        <Upload className="h-3.5 w-3.5" />
                        {tc("upload")}
                        <input
                          type="file"
                          className="hidden"
                          accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handleUploadDoc(doc.id, f);
                            e.target.value = "";
                          }}
                        />
                      </label>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Submit Section */}
      {!submitted && canUpload && phase2DocTypes.length > 0 && <div className="rounded-xl bg-white p-6 shadow-sm">
        {/* Validation warnings */}
        {!allRequiredUploaded && (
          <div className="mb-4 rounded-lg border border-ptba-gold/30 bg-ptba-gold-light/30 p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 shrink-0 text-ptba-gold mt-0.5" />
              <div className="text-sm text-ptba-charcoal">
                <p className="font-medium">
                  {t("submit.requirementsNotMet")}
                </p>
                <ul className="mt-1.5 list-disc pl-4 space-y-0.5 text-ptba-gray">
                  {!allRequiredUploaded && (
                    <li>
                      {t("submit.docsNotUploaded", { count: requiredPhase2Count - uploadedRequiredCount })}
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3">
          <button
            onClick={() => router.push(`/mitra/projects/${projectId}`)}
            className="rounded-lg border border-ptba-navy px-4 py-2 text-sm font-medium text-ptba-navy hover:bg-ptba-navy/5 transition-colors"
          >
            {tc("cancel")}
          </button>
          <button
            onClick={() => setShowSubmitConfirm(true)}
            disabled={!canSubmit}
            className={cn(
              "rounded-lg px-6 py-2 text-sm font-bold transition-colors inline-flex items-center gap-2",
              canSubmit
                ? "bg-ptba-gold text-ptba-charcoal hover:bg-ptba-gold-light"
                : "bg-ptba-light-gray text-ptba-gray cursor-not-allowed"
            )}
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {submitting ? tc("sending") : t("submit.submitDocs")}
          </button>
        </div>
      </div>}

      {/* Submit Confirmation Modal */}
      {!submitted && canUpload && showSubmitConfirm && (
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
                  ? "Once submitted, your Phase 2 documents cannot be edited. Please make sure all documents are correct."
                  : "Setelah dikirim, dokumen Fase 2 Anda tidak dapat diubah lagi. Pastikan semua dokumen sudah benar."}
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
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {submitting ? (locale === "en" ? "Submitting..." : "Mengirim...") : (locale === "en" ? "Submit" : "Kirim Dokumen")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
