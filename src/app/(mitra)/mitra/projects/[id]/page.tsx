"use client";

import { useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Calendar, Download, FileText, CheckCircle2, ArrowRight, ShieldCheck } from "lucide-react";
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

function phaseLabel(phase?: string): string {
  if (!phase) return "";
  const map: Record<string, string> = {
    phase1_registration: "Phase 1 - Pendaftaran EoI",
    phase1_closed: "Phase 1 - Pendaftaran Ditutup",
    phase1_evaluation: "Phase 1 - Evaluasi",
    phase1_approval: "Phase 1 - Persetujuan",
    phase1_announcement: "Phase 1 - Pengumuman",
    phase2_registration: "Phase 2 - Pendaftaran",
    phase2_evaluation: "Phase 2 - Evaluasi",
    phase2_ranking: "Phase 2 - Peringkat",
    phase2_negotiation: "Phase 2 - Negosiasi",
    phase2_approval: "Phase 2 - Persetujuan",
    phase2_announcement: "Phase 2 - Pengumuman",
    completed: "Selesai",
    cancelled: "Dibatalkan",
  };
  return map[phase] ?? "";
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
  const phase1DeadlinePassed = project.phase1Deadline && new Date(project.phase1Deadline) < new Date();
  const canApply = project.isOpenForApplication && !phase1DeadlinePassed && !isDeadlinePassed && !application;
  const isShortlisted = application?.phase1Result === "Lolos";
  const isPhase2 = project.phase?.startsWith("phase2");
  const canAccessPhase2 = isShortlisted && isPhase2;

  const requiredDocTypes = (project.requiredDocuments ?? [])
    .map((id) => DOCUMENT_TYPES.find((d) => d.id === id))
    .filter(Boolean);

  return (
    <div className="space-y-6">
      <button onClick={() => router.push("/mitra/projects")} className="inline-flex items-center gap-1.5 text-sm text-ptba-steel-blue hover:text-ptba-navy">
        <ArrowLeft className="h-4 w-4" /> Kembali ke Proyek
      </button>

      {/* Project Header */}
      <div className="rounded-xl bg-gradient-to-r from-ptba-navy to-ptba-steel-blue p-6 text-white">
        <div className="flex flex-wrap gap-2 mb-3">
          <span className="inline-flex rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-medium">{project.type}</span>
          <span className="inline-flex rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-medium">{project.status}</span>
          {project.phase && (
            <span className="inline-flex rounded-full bg-white/30 px-2.5 py-0.5 text-xs font-semibold">
              {phaseLabel(project.phase)}
            </span>
          )}
        </div>
        <h1 className="text-2xl font-bold">{project.name}</h1>
        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm text-white/80">
          <span>Nilai: {formatCurrency(project.capexValue)}</span>
          <span>Periode: {formatDate(project.startDate)} - {formatDate(project.endDate)}</span>
          {project.phase1Deadline && (
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              Deadline Phase 1: {formatDate(project.phase1Deadline)}
            </span>
          )}
        </div>

        {/* Phase Progress */}
        {project.phase && (
          <div className="mt-4">
            <div className="flex items-center gap-2 text-xs text-white/70 mb-1.5">
              <span>Langkah {project.currentStep}/{project.totalSteps}</span>
            </div>
            <div className="flex items-center gap-0">
              <div className="flex-1">
                <div className="flex gap-0.5 overflow-hidden rounded-l-full">
                  {Array.from({ length: 7 }).map((_, i) => (
                    <div
                      key={i}
                      className={cn(
                        "h-2 flex-1",
                        i + 1 < project.currentStep ? "bg-white/80" :
                        i + 1 === project.currentStep ? "bg-ptba-gold" : "bg-white/20"
                      )}
                    />
                  ))}
                </div>
              </div>
              <div className="w-0.5 h-3 bg-white/30 mx-0.5" />
              <div className="flex-1">
                <div className="flex gap-0.5 overflow-hidden rounded-r-full">
                  {Array.from({ length: 6 }).map((_, i) => {
                    const step = i + 8;
                    return (
                      <div
                        key={i}
                        className={cn(
                          "h-2 flex-1",
                          step < project.currentStep ? "bg-white/80" :
                          step === project.currentStep ? "bg-ptba-gold" : "bg-white/20"
                        )}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="mt-1 flex justify-between text-[10px] text-white/50">
              <span>Phase 1</span>
              <span>Phase 2</span>
            </div>
          </div>
        )}
      </div>

      {/* Shortlist Announcement */}
      {isShortlisted && (
        <div className="rounded-xl bg-green-50 border border-green-200 p-5">
          <div className="flex items-start gap-3">
            <ShieldCheck className="h-6 w-6 shrink-0 text-green-600 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-green-800">Selamat! Perusahaan Anda Lolos Phase 1</p>
              <p className="mt-1 text-xs text-green-700">
                Anda telah lolos tahap evaluasi Phase 1 (Expression of Interest) dan diundang untuk melanjutkan ke Phase 2 (Detailed Assessment).
              </p>
              {canAccessPhase2 && (
                <button
                  onClick={() => router.push(`/mitra/projects/${projectId}/phase2`)}
                  className="mt-3 inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition-colors"
                >
                  Lanjut ke Phase 2 <ArrowRight className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {application?.phase1Result === "Tidak Lolos" && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-red-100">
              <span className="text-xs font-bold text-red-600">!</span>
            </div>
            <div>
              <p className="text-sm font-bold text-red-800">Tidak Lolos Phase 1</p>
              <p className="mt-1 text-xs text-red-700">
                Maaf, perusahaan Anda belum memenuhi kriteria evaluasi Phase 1 untuk proyek ini. Terima kasih atas partisipasi Anda.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-ptba-charcoal mb-3">Deskripsi Proyek</h2>
            <p className="text-sm text-ptba-gray leading-relaxed">{project.description}</p>
          </div>

          {project.prdDocument && (
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-ptba-charcoal mb-3">Dokumen Pendukung</h2>
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
                  <Download className="h-3.5 w-3.5" /> Unduh
                </button>
              </div>
            </div>
          )}

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
                  application.status === "Ditolak" ? "text-ptba-red" : "text-ptba-steel-blue"
                )}>
                  {application.status}
                </p>
                <p className="mt-1 text-xs text-ptba-gray">Diajukan: {formatDate(application.appliedAt)}</p>

                {/* Phase info */}
                {application.phase && (
                  <p className="mt-1 text-xs font-medium text-ptba-steel-blue">
                    {application.phase === "phase1" ? "Phase 1 (EoI)" : "Phase 2 (Assessment)"}
                  </p>
                )}

                {/* Phase 1 Result */}
                {application.phase1Result && (
                  <div className="mt-2">
                    <span className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
                      application.phase1Result === "Lolos" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
                    )}>
                      {application.phase1Result === "Lolos" && <CheckCircle2 className="h-3 w-3" />}
                      Phase 1: {application.phase1Result}
                    </span>
                  </div>
                )}

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

              <div className="mt-3 space-y-2">
                <button
                  onClick={() => router.push("/mitra/status")}
                  className="w-full rounded-lg border border-ptba-navy px-4 py-2 text-sm font-medium text-ptba-navy hover:bg-ptba-navy/5 transition-colors"
                >
                  Lihat Detail Status
                </button>
                {canAccessPhase2 && (
                  <button
                    onClick={() => router.push(`/mitra/projects/${projectId}/phase2`)}
                    className="w-full rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition-colors"
                  >
                    Lanjut ke Phase 2
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-ptba-charcoal mb-3">Ajukan Expression of Interest</h3>
              {canApply ? (
                <>
                  <p className="text-sm text-ptba-gray mb-4">
                    Siapkan dokumen EoI yang diperlukan dan ajukan lamaran Phase 1 untuk proyek ini.
                  </p>
                  <button
                    onClick={() => router.push(`/mitra/projects/${project.id}/apply`)}
                    className="w-full rounded-lg bg-ptba-gold px-4 py-2.5 text-sm font-bold text-ptba-charcoal hover:bg-ptba-gold-light transition-colors"
                  >
                    Ajukan EoI
                  </button>
                </>
              ) : (
                <div className="rounded-lg bg-ptba-gray/5 p-4 text-center">
                  <p className="text-sm text-ptba-gray">
                    {phase1DeadlinePassed || isDeadlinePassed ? "Deadline lamaran telah lewat." : "Proyek ini tidak menerima lamaran saat ini."}
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
                        <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-green-500" />
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
