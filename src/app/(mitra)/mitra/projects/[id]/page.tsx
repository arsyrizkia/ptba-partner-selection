"use client";

import { useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Calendar, Download, FileText, CheckCircle2, Clock, XCircle } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useAuth } from "@/lib/auth/auth-context";
import { mockProjects } from "@/lib/mock-data/projects";
import { mockApplications } from "@/lib/mock-data/applications";
import { DOCUMENT_TYPES } from "@/lib/constants/document-types";
import { formatCurrency, formatDate } from "@/lib/utils/format";

function typeBadge(type: string) {
  switch (type) {
    case "CAPEX": return "bg-ptba-steel-blue/10 text-ptba-steel-blue border border-ptba-steel-blue/20";
    case "OPEX": return "bg-ptba-gold/10 text-ptba-gold border border-ptba-gold/20";
    case "Strategis": return "bg-purple-100 text-purple-700 border border-purple-200";
    default: return "bg-ptba-gray/10 text-ptba-gray border border-ptba-gray/20";
  }
}

function statusBadge(status: string) {
  switch (status) {
    case "Evaluasi": return "bg-ptba-steel-blue/10 text-ptba-steel-blue";
    case "Persetujuan": return "bg-ptba-gold/10 text-ptba-gold";
    case "Selesai": return "bg-green-100 text-green-700";
    case "Draft": return "bg-ptba-gray/10 text-ptba-gray";
    default: return "bg-ptba-gray/10 text-ptba-gray";
  }
}

export default function MitraProjectDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const projectId = params.id as string;

  const project = mockProjects.find((p) => p.id === projectId);
  const application = useMemo(
    () => mockApplications.find((a) => a.projectId === projectId && a.partnerId === user?.partnerId),
    [projectId, user?.partnerId]
  );

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
  const canApply = project.isOpenForApplication && !isDeadlinePassed && !application;
  const requiredDocTypes = (project.requiredDocuments ?? [])
    .map((id) => DOCUMENT_TYPES.find((d) => d.id === id))
    .filter(Boolean);

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button onClick={() => router.push("/mitra/projects")} className="inline-flex items-center gap-1.5 text-sm text-ptba-steel-blue hover:text-ptba-navy">
        <ArrowLeft className="h-4 w-4" /> Kembali ke Proyek
      </button>

      {/* Project Header */}
      <div className="rounded-xl bg-gradient-to-r from-ptba-navy to-ptba-steel-blue p-6 text-white">
        <div className="flex flex-wrap gap-2 mb-3">
          <span className="inline-flex rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-medium">{project.type}</span>
          <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium bg-white/20")}>{project.status}</span>
        </div>
        <h1 className="text-2xl font-bold">{project.name}</h1>
        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm text-white/80">
          <span>Nilai: {formatCurrency(project.capexValue)}</span>
          <span>Periode: {formatDate(project.startDate)} - {formatDate(project.endDate)}</span>
          {project.applicationDeadline && (
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              Deadline Lamaran: {formatDate(project.applicationDeadline)}
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-ptba-charcoal mb-3">Deskripsi Proyek</h2>
            <p className="text-sm text-ptba-gray leading-relaxed">{project.description}</p>
          </div>

          {/* PRD Document */}
          {project.prdDocument && (
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-ptba-charcoal mb-3">Dokumen PRD</h2>
              <div className="flex items-center justify-between rounded-lg border border-ptba-light-gray p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-ptba-red/10">
                    <FileText className="h-5 w-5 text-ptba-red" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-ptba-charcoal">{project.prdDocument}</p>
                    <p className="text-xs text-ptba-gray">PDF Document</p>
                  </div>
                </div>
                <button
                  onClick={() => alert("Download simulasi: " + project.prdDocument)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-ptba-navy px-3 py-2 text-xs font-medium text-white hover:bg-ptba-navy/90 transition-colors"
                >
                  <Download className="h-3.5 w-3.5" />
                  Unduh
                </button>
              </div>
            </div>
          )}

          {/* Requirements */}
          {project.requirements && project.requirements.length > 0 && (
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-ptba-charcoal mb-3">Persyaratan Mitra</h2>
              <ol className="space-y-2">
                {project.requirements.map((req, idx) => (
                  <li key={idx} className="flex gap-3 text-sm text-ptba-gray">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ptba-steel-blue/10 text-xs font-semibold text-ptba-steel-blue">
                      {idx + 1}
                    </span>
                    <span className="pt-0.5">{req}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Application Status or CTA */}
          {application ? (
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-ptba-charcoal mb-3">Status Lamaran Anda</h3>
              <div className={cn(
                "rounded-lg p-4 text-center",
                application.status === "Terpilih" ? "bg-green-50 border border-green-200" :
                application.status === "Ditolak" ? "bg-red-50 border border-red-200" :
                "bg-ptba-steel-blue/5 border border-ptba-steel-blue/20"
              )}>
                <p className={cn(
                  "text-lg font-bold",
                  application.status === "Terpilih" ? "text-green-700" :
                  application.status === "Ditolak" ? "text-ptba-red" :
                  "text-ptba-steel-blue"
                )}>
                  {application.status}
                </p>
                <p className="mt-1 text-xs text-ptba-gray">Diajukan: {formatDate(application.appliedAt)}</p>
                {application.currentEvalStep && application.totalEvalSteps && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs text-ptba-gray mb-1">
                      <span>Progres Evaluasi</span>
                      <span>{application.currentEvalStep}/{application.totalEvalSteps}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-ptba-light-gray">
                      <div className="h-full rounded-full bg-ptba-steel-blue" style={{ width: `${Math.round((application.currentEvalStep / application.totalEvalSteps) * 100)}%` }} />
                    </div>
                  </div>
                )}
              </div>
              <button
                onClick={() => router.push("/mitra/status")}
                className="mt-3 w-full rounded-lg border border-ptba-navy px-4 py-2 text-sm font-medium text-ptba-navy hover:bg-ptba-navy/5 transition-colors"
              >
                Lihat Detail Status
              </button>
            </div>
          ) : (
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-ptba-charcoal mb-3">Ajukan Lamaran</h3>
              {canApply ? (
                <>
                  <p className="text-sm text-ptba-gray mb-4">
                    Siapkan dokumen yang diperlukan dan ajukan lamaran untuk proyek ini.
                  </p>
                  <button
                    onClick={() => router.push(`/mitra/projects/${project.id}/apply`)}
                    className="w-full rounded-lg bg-ptba-gold px-4 py-2.5 text-sm font-bold text-ptba-charcoal hover:bg-ptba-gold-light transition-colors"
                  >
                    Ajukan Lamaran
                  </button>
                </>
              ) : (
                <div className="rounded-lg bg-ptba-gray/5 p-4 text-center">
                  <p className="text-sm text-ptba-gray">
                    {isDeadlinePassed ? "Deadline lamaran telah lewat." : "Proyek ini tidak menerima lamaran saat ini."}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Required Documents */}
          {requiredDocTypes.length > 0 && (
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-ptba-charcoal mb-3">
                Dokumen Diperlukan ({requiredDocTypes.length})
              </h3>
              <ul className="space-y-2">
                {requiredDocTypes.map((doc) => {
                  if (!doc) return null;
                  const appDoc = application?.documents.find((d) => d.documentTypeId === doc.id);
                  return (
                    <li key={doc.id} className="flex items-start gap-2 text-sm">
                      {appDoc ? (
                        appDoc.status === "Diverifikasi" ? (
                          <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-green-500" />
                        ) : appDoc.status === "Ditolak" ? (
                          <XCircle className="h-4 w-4 mt-0.5 shrink-0 text-ptba-red" />
                        ) : (
                          <Clock className="h-4 w-4 mt-0.5 shrink-0 text-ptba-steel-blue" />
                        )
                      ) : (
                        <div className="h-4 w-4 mt-0.5 shrink-0 rounded-full border-2 border-ptba-light-gray" />
                      )}
                      <div>
                        <p className="text-ptba-charcoal">{doc.name}</p>
                        {doc.required && <span className="text-[10px] text-ptba-red font-medium">Wajib</span>}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
