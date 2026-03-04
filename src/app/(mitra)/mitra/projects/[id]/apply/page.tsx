"use client";

import { useState, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Upload, CheckCircle2, FileText, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useAuth } from "@/lib/auth/auth-context";
import { mockProjects } from "@/lib/mock-data/projects";
import { mockApplications } from "@/lib/mock-data/applications";
import { DOCUMENT_TYPES } from "@/lib/constants/document-types";

export default function MitraProjectApplyPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const projectId = params.id as string;

  const project = mockProjects.find((p) => p.id === projectId);
  const existingApplication = useMemo(
    () => mockApplications.find((a) => a.projectId === projectId && a.partnerId === user?.partnerId),
    [projectId, user?.partnerId]
  );

  const requiredDocTypes = useMemo(
    () => (project?.requiredDocuments ?? []).map((id) => DOCUMENT_TYPES.find((d) => d.id === id)).filter(Boolean),
    [project?.requiredDocuments]
  );

  const [uploadedDocs, setUploadedDocs] = useState<Record<string, string>>({});
  const [confirmed, setConfirmed] = useState(false);

  // Redirect if already applied
  if (existingApplication) {
    return (
      <div className="space-y-6">
        <button onClick={() => router.back()} className="inline-flex items-center gap-1.5 text-sm text-ptba-steel-blue hover:text-ptba-navy">
          <ArrowLeft className="h-4 w-4" /> Kembali
        </button>
        <div className="rounded-xl bg-white p-12 text-center shadow-sm">
          <CheckCircle2 className="mx-auto h-12 w-12 text-green-500" />
          <p className="mt-3 text-lg font-semibold text-ptba-charcoal">Anda sudah melamar pada proyek ini</p>
          <p className="mt-1 text-sm text-ptba-gray">Status lamaran: {existingApplication.status}</p>
          <button
            onClick={() => router.push(`/mitra/projects/${projectId}`)}
            className="mt-4 rounded-lg bg-ptba-navy px-4 py-2 text-sm font-medium text-white hover:bg-ptba-navy/90 transition-colors"
          >
            Lihat Detail Proyek
          </button>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="space-y-6">
        <button onClick={() => router.back()} className="inline-flex items-center gap-1.5 text-sm text-ptba-steel-blue hover:text-ptba-navy">
          <ArrowLeft className="h-4 w-4" /> Kembali
        </button>
        <div className="rounded-xl bg-white p-12 text-center shadow-sm">
          <p className="text-ptba-gray">Proyek tidak ditemukan.</p>
        </div>
      </div>
    );
  }

  const isDeadlinePassed = project.applicationDeadline && new Date(project.applicationDeadline) < new Date();
  if (!project.isOpenForApplication || isDeadlinePassed) {
    return (
      <div className="space-y-6">
        <button onClick={() => router.back()} className="inline-flex items-center gap-1.5 text-sm text-ptba-steel-blue hover:text-ptba-navy">
          <ArrowLeft className="h-4 w-4" /> Kembali
        </button>
        <div className="rounded-xl bg-white p-12 text-center shadow-sm">
          <AlertTriangle className="mx-auto h-12 w-12 text-ptba-gold" />
          <p className="mt-3 text-lg font-semibold text-ptba-charcoal">Proyek ini tidak menerima lamaran</p>
          <p className="mt-1 text-sm text-ptba-gray">Deadline lamaran telah lewat atau proyek tidak terbuka.</p>
        </div>
      </div>
    );
  }

  const handleSimulateUpload = (docId: string, docName: string) => {
    setUploadedDocs((prev) => ({ ...prev, [docId]: docName }));
  };

  const handleUseSavedDoc = (docId: string, docName: string) => {
    setUploadedDocs((prev) => ({ ...prev, [docId]: `${docName} (tersimpan)` }));
  };

  const requiredCount = requiredDocTypes.filter((d) => d?.required).length;
  const uploadedRequiredCount = requiredDocTypes.filter((d) => d?.required && uploadedDocs[d.id]).length;
  const allRequiredUploaded = uploadedRequiredCount === requiredCount;
  const canSubmit = allRequiredUploaded && confirmed;

  const handleSubmit = () => {
    alert("Lamaran berhasil diajukan! Tim evaluasi akan meninjau dokumen Anda.");
    router.push(`/mitra/projects/${projectId}`);
  };

  return (
    <div className="space-y-6">
      {/* Back */}
      <button onClick={() => router.push(`/mitra/projects/${projectId}`)} className="inline-flex items-center gap-1.5 text-sm text-ptba-steel-blue hover:text-ptba-navy">
        <ArrowLeft className="h-4 w-4" /> Kembali ke Detail Proyek
      </button>

      <h1 className="text-2xl font-bold text-ptba-charcoal">Ajukan Lamaran</h1>
      <p className="text-sm text-ptba-gray">Proyek: <span className="font-medium text-ptba-charcoal">{project.name}</span></p>

      {/* Profile Completeness Check */}
      <div className="rounded-xl bg-ptba-steel-blue/5 border border-ptba-steel-blue/20 p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 shrink-0 text-ptba-steel-blue mt-0.5" />
          <div>
            <p className="text-sm font-medium text-ptba-charcoal">Pastikan profil perusahaan Anda sudah lengkap</p>
            <p className="mt-0.5 text-xs text-ptba-gray">
              Profil perusahaan yang lengkap akan meningkatkan peluang lamaran Anda diterima.{" "}
              <a href="/mitra/profile" className="text-ptba-steel-blue hover:underline">Cek profil</a>
            </p>
          </div>
        </div>
      </div>

      {/* Document Upload Section */}
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-ptba-charcoal">Dokumen yang Diperlukan</h2>
          <span className="text-sm text-ptba-gray">{uploadedRequiredCount}/{requiredCount} wajib terpenuhi</span>
        </div>

        {/* Progress */}
        <div className="mb-6 h-2 overflow-hidden rounded-full bg-ptba-light-gray">
          <div
            className={cn("h-full rounded-full transition-all", allRequiredUploaded ? "bg-green-500" : "bg-ptba-gold")}
            style={{ width: `${requiredCount > 0 ? (uploadedRequiredCount / requiredCount) * 100 : 0}%` }}
          />
        </div>

        <div className="space-y-3">
          {requiredDocTypes.map((doc) => {
            if (!doc) return null;
            const isUploaded = !!uploadedDocs[doc.id];
            return (
              <div
                key={doc.id}
                className={cn(
                  "rounded-lg border p-4 transition-colors",
                  isUploaded ? "border-green-200 bg-green-50/50" : "border-ptba-light-gray"
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    {isUploaded ? (
                      <CheckCircle2 className="h-5 w-5 mt-0.5 shrink-0 text-green-500" />
                    ) : (
                      <FileText className="h-5 w-5 mt-0.5 shrink-0 text-ptba-gray" />
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-ptba-charcoal">
                        {doc.name}
                        {doc.required && <span className="ml-1 text-[10px] text-ptba-red font-medium">*Wajib</span>}
                      </p>
                      <p className="text-xs text-ptba-gray mt-0.5">{doc.description}</p>
                      {isUploaded && (
                        <p className="text-xs text-green-600 mt-1">{uploadedDocs[doc.id]}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {!isUploaded && (
                      <>
                        <button
                          onClick={() => handleUseSavedDoc(doc.id, doc.name)}
                          className="inline-flex items-center gap-1 rounded-lg border border-ptba-navy px-2.5 py-1.5 text-xs font-medium text-ptba-navy hover:bg-ptba-navy/5 transition-colors"
                        >
                          Gunakan Tersimpan
                        </button>
                        <button
                          onClick={() => handleSimulateUpload(doc.id, `${doc.name}.pdf`)}
                          className="inline-flex items-center gap-1 rounded-lg bg-ptba-navy px-2.5 py-1.5 text-xs font-medium text-white hover:bg-ptba-navy/90 transition-colors"
                        >
                          <Upload className="h-3 w-3" />
                          Unggah
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Confirmation & Submit */}
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-ptba-light-gray text-ptba-navy focus:ring-ptba-steel-blue"
          />
          <span className="text-sm text-ptba-gray">
            Saya menyatakan bahwa seluruh dokumen yang diunggah adalah sah, asli, dan dapat dipertanggungjawabkan. Saya bersedia menerima konsekuensi apabila terdapat ketidaksesuaian data.
          </span>
        </label>

        <div className="mt-4 flex justify-end gap-3">
          <button
            onClick={() => router.push(`/mitra/projects/${projectId}`)}
            className="rounded-lg border border-ptba-navy px-4 py-2 text-sm font-medium text-ptba-navy hover:bg-ptba-navy/5 transition-colors"
          >
            Batal
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={cn(
              "rounded-lg px-6 py-2 text-sm font-bold transition-colors",
              canSubmit
                ? "bg-ptba-gold text-ptba-charcoal hover:bg-ptba-gold-light"
                : "bg-ptba-light-gray text-ptba-gray cursor-not-allowed"
            )}
          >
            Kirim Lamaran
          </button>
        </div>
      </div>
    </div>
  );
}
