"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Calendar, FileText, CheckCircle2, ArrowRight, ShieldCheck, Loader2, Download } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useAuth } from "@/lib/auth/auth-context";
import { api, projectApi } from "@/lib/api/client";
import { DOCUMENT_TYPES } from "@/lib/constants/document-types";
import { formatDate } from "@/lib/utils/format";
import { useTranslations } from "next-intl";
import { useLocale } from "@/lib/i18n/locale-context";

function typeBadge(type: string) {
  const map: Record<string, string> = {
    mining: "bg-amber-100 text-amber-700 border border-amber-200",
    power_generation: "bg-ptba-steel-blue/10 text-ptba-steel-blue border border-ptba-steel-blue/20",
    coal_processing: "bg-ptba-gold/10 text-ptba-gold border border-ptba-gold/20",
    infrastructure: "bg-blue-100 text-blue-700 border border-blue-200",
    environmental: "bg-green-100 text-green-700 border border-green-200",
    corporate: "bg-gray-100 text-gray-600 border border-gray-200",
    others: "bg-purple-100 text-purple-700 border border-purple-200",
  };
  return map[type] ?? "bg-ptba-gray/10 text-ptba-gray border border-ptba-gray/20";
}

function phaseLabel(phase: string | undefined, tc: (key: string) => string): string {
  if (!phase) return "";
  return tc(`phaseLabels.${phase}`) || "";
}

export default function MitraProjectDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user, accessToken } = useAuth();
  const projectId = params.id as string;
  const t = useTranslations("projectDetail");
  const tc = useTranslations("common");
  const { locale } = useLocale();

  const [project, setProject] = useState<any>(null);
  const [application, setApplication] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const dateLocale = locale === "en" ? "en-US" : "id-ID";

  useEffect(() => {
    if (!accessToken) return;
    setLoading(true);
    Promise.all([
      projectApi(accessToken).getById(projectId),
      api<{ applications: any[] }>("/applications", { token: accessToken }),
    ]).then(([projRes, appRes]) => {
      setProject(projRes.data);
      const apps = appRes.applications || [];
      setApplication(apps.find((a: any) => a.project_id === projectId) || null);
    }).catch(() => {
      setProject(null);
    }).finally(() => setLoading(false));
  }, [projectId, accessToken]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-ptba-steel-blue" />
        <span className="ml-3 text-ptba-gray">{tc("loadingProject")}</span>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="space-y-6">
        <button onClick={() => router.back()} className="inline-flex items-center gap-1.5 text-sm text-ptba-steel-blue hover:text-ptba-navy">
          <ArrowLeft className="h-4 w-4" /> {tc("back")}
        </button>
        <div className="rounded-xl bg-white p-12 text-center shadow-sm">
          <p className="text-ptba-gray">{tc("projectNotFound")}</p>
        </div>
      </div>
    );
  }

  const phase1DeadlinePassed = project.phase1Deadline && new Date(project.phase1Deadline) < new Date();
  const hasPendingApplication = application && application.status !== "Draft";
  const canApply = project.isOpenForApplication && !phase1DeadlinePassed && !hasPendingApplication;
  const isPhase2 = project.phase?.startsWith("phase2");
  const isPhase3 = project.phase?.startsWith("phase3");
  const isShortlisted = application?.status === "Shortlisted";
  const isPassedPhase2 = application?.status === "Diterima" || application?.status === "Terpilih";
  const canAccessPhase2 = isShortlisted && isPhase2;

  // Required documents from project - grouped by phase
  const requiredDocs = project.requiredDocuments || [];
  const getDocName = (docTypeId: string) => {
    try { return tc(`docTypes.${docTypeId}`); } catch { return docTypeId.replace(/_/g, " "); }
  };
  const phase1RequiredDocs = requiredDocs
    .filter((d: any) => d.phase === "phase1" || d.phase === "both")
    .map((d: any) => {
      const meta = DOCUMENT_TYPES.find((dt) => dt.id === d.documentTypeId);
      return { id: d.documentTypeId, name: getDocName(d.documentTypeId), required: meta?.required ?? false, phase: d.phase };
    });
  const phase2RequiredDocs = requiredDocs
    .filter((d: any) => d.phase === "phase2" || d.phase === "both")
    .map((d: any) => {
      const meta = DOCUMENT_TYPES.find((dt) => dt.id === d.documentTypeId);
      return { id: d.documentTypeId, name: getDocName(d.documentTypeId), required: meta?.required ?? false, phase: d.phase };
    });
  const phase3RequiredDocs = requiredDocs
    .filter((d: any) => d.phase === "phase3")
    .map((d: any) => {
      const meta = DOCUMENT_TYPES.find((dt) => dt.id === d.documentTypeId);
      return { id: d.documentTypeId, name: getDocName(d.documentTypeId), required: meta?.required ?? false, phase: d.phase };
    });

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002/api";

  return (
    <div className="space-y-6">
      <button onClick={() => router.push("/mitra/projects")} className="inline-flex items-center gap-1.5 text-sm text-ptba-steel-blue hover:text-ptba-navy">
        <ArrowLeft className="h-4 w-4" /> {tc("backToProjects")}
      </button>

      {/* Project Header */}
      <div className="rounded-xl bg-gradient-to-r from-ptba-navy to-ptba-steel-blue text-white overflow-hidden">
        <div className={cn("flex flex-col", project.coverImageUrl ? "lg:flex-row" : "")}>
        {project.coverImageUrl && (
          <div className="lg:w-[400px] shrink-0">
            <img src={project.coverImageUrl} alt="" className="w-full h-48 lg:h-full object-cover" />
          </div>
        )}
        <div className="flex-1 p-6">
        <div className="flex flex-wrap gap-2 mb-3">
          <span className="inline-flex rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-medium">{tc(`typeLabels.${project.type}`)}</span>
          <span className="inline-flex rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-medium">{project.status}</span>
          {project.phase && project.phase !== "published" && (
            <span className="inline-flex rounded-full bg-white/30 px-2.5 py-0.5 text-xs font-semibold">
              {phaseLabel(project.phase, tc)}
            </span>
          )}
        </div>
        <h1 className="text-2xl font-bold">{project.name}</h1>
        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm text-white/80">
          {project.startDate && (
            <span>
              {locale === "en" ? "Period" : "Periode"}: {new Date(project.startDate).toLocaleDateString(dateLocale)} - {new Date(project.endDate).toLocaleDateString(dateLocale)}
            </span>
          )}
          {project.phase1Deadline && (
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {locale === "en" ? "Phase 1 Deadline" : "Deadline Fase 1"}: {new Date(project.phase1Deadline).toLocaleDateString(dateLocale)}
            </span>
          )}
        </div>

        {/* Phase Progress */}
        {project.phase && project.phase !== "published" && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-white/70 mb-1.5">
              <span>{t("step", { current: project.currentStep, total: project.totalSteps || 16 })}</span>
              <span className="font-semibold text-white">{Math.round((project.currentStep / (project.totalSteps || 16)) * 100)}%</span>
            </div>
            <div className="h-2 rounded-full bg-white/20 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-white/90 via-ptba-gold to-ptba-gold transition-all duration-500"
                style={{ width: `${Math.round((project.currentStep / (project.totalSteps || 16)) * 100)}%` }}
              />
            </div>
            <div className="mt-1.5 flex text-[10px] text-white/50">
              <span style={{ width: "37.5%" }}>{tc("phase1")}</span>
              <span style={{ width: "31.25%" }}>{tc("phase2")}</span>
              <span style={{ width: "31.25%" }} className="text-right">{tc("phase3")}</span>
            </div>
          </div>
        )}
        </div>
        </div>
      </div>

      {/* Shortlist Announcement */}
      {isShortlisted && (
        <div className="rounded-xl bg-green-50 border border-green-200 p-5">
          <div className="flex items-start gap-3">
            <ShieldCheck className="h-6 w-6 shrink-0 text-green-600 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-green-800">{t("shortlistCongrats")}</p>
              <p className="mt-1 text-xs text-green-700">
                {canAccessPhase2 ? t("shortlistPhase2Ready") : t("shortlistPhase2Email")}
              </p>
              {canAccessPhase2 && (
                <button
                  onClick={() => router.push(`/mitra/projects/${projectId}/phase2`)}
                  className="mt-3 inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition-colors"
                >
                  {t("continueToPhase2")} <ArrowRight className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-ptba-charcoal mb-3">{t("projectDescription")}</h2>
            {project.description ? (
              <div className="text-sm text-ptba-gray leading-relaxed prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: project.description }} />
            ) : (
              <p className="text-sm text-ptba-gray leading-relaxed">{t("noDescription")}</p>
            )}
            {project.projectImages && project.projectImages.length > 0 && (
              <div className="mt-4 grid grid-cols-2 gap-3">
                {project.projectImages.map((img: any) => (
                  <img
                    key={img.id}
                    src={img.url}
                    alt={img.caption || ""}
                    className="w-full rounded-lg object-cover cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => window.open(img.url, "_blank")}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Requirements */}
          {project.requirements && project.requirements.length > 0 && (
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-ptba-charcoal mb-3">{t("partnerRequirements")}</h2>
              <ol className="space-y-2">
                {project.requirements.map((req: any, idx: number) => (
                  <li key={idx} className="flex gap-3 text-sm text-ptba-gray">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ptba-steel-blue/10 text-xs font-semibold text-ptba-steel-blue">
                      {idx + 1}
                    </span>
                    <span className="pt-0.5">{req.requirement || req}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* PTBA Documents - downloadable by mitra (phase 1 only) */}
          {(() => {
            const phase1Docs = (project.ptbaDocuments || []).filter((d: any) => !d.phase || d.phase === "phase1");
            return phase1Docs.length > 0 ? (
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-ptba-charcoal mb-3">{t("supportDocuments")}</h2>
              <p className="text-xs text-ptba-gray mb-3">{t("supportDocumentsDesc")}</p>
              <div className="space-y-2">
                {phase1Docs.map((doc: any) => (
                  <div key={doc.id} className="flex items-center gap-3 rounded-lg border border-ptba-light-gray p-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-ptba-steel-blue/10">
                      <FileText className="h-4 w-4 text-ptba-steel-blue" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-ptba-charcoal truncate">{doc.name}</p>
                      <p className="text-xs text-ptba-gray">{doc.type}</p>
                    </div>
                    {doc.fileKey && accessToken && (
                      <button
                        onClick={async () => {
                          try {
                            const res = await fetch(`/api/projects/${projectId}/documents/${doc.id}`, {
                              headers: { Authorization: `Bearer ${accessToken}` },
                            });
                            if (!res.ok) return;
                            const blob = await res.blob();
                            const url = URL.createObjectURL(blob);
                            window.open(url, "_blank");
                          } catch { /* ignore */ }
                        }}
                        className="inline-flex items-center gap-1 rounded-lg bg-ptba-steel-blue px-3 py-1.5 text-xs font-medium text-white hover:bg-ptba-steel-blue/90 transition-colors shrink-0"
                      >
                        <Download className="h-3 w-3" />
                        {tc("download")}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : null;
          })()}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Application Status or CTA */}
          {application && application.status !== "Draft" ? (
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-ptba-charcoal mb-3">{t("yourApplicationStatus")}</h3>
              <div className={cn(
                "rounded-lg p-4 text-center",
                application.status === "Shortlisted" ? "bg-green-50 border border-green-200" :
                application.status === "Ditolak" ? "bg-red-50 border border-red-200" :
                "bg-ptba-steel-blue/5 border border-ptba-steel-blue/20"
              )}>
                <p className={cn(
                  "text-lg font-bold",
                  application.status === "Shortlisted" ? "text-green-700" :
                  application.status === "Ditolak" ? "text-ptba-red" : "text-ptba-steel-blue"
                )}>
                  {application.status}
                </p>
                <p className="mt-1 text-xs text-ptba-gray">
                  {tc("submitted")}: {new Date(application.applied_at).toLocaleDateString(dateLocale)}
                </p>
              </div>

              <div className="mt-3 space-y-2">
                <button
                  onClick={() => router.push("/mitra/status")}
                  className="w-full rounded-lg border border-ptba-navy px-4 py-2 text-sm font-medium text-ptba-navy hover:bg-ptba-navy/5 transition-colors"
                >
                  {t("viewStatusDetail")}
                </button>
                {canAccessPhase2 && (
                  <button
                    onClick={() => router.push(`/mitra/projects/${projectId}/phase2`)}
                    className="w-full rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition-colors"
                  >
                    {t("continueToPhase2")}
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-ptba-charcoal mb-3">{t("submitEoi")}</h3>
              {canApply ? (
                <>
                  <p className="text-sm text-ptba-gray mb-4">
                    {t("submitEoiDesc")}
                  </p>
                  <button
                    onClick={() => router.push(`/mitra/projects/${project.id}/apply`)}
                    className="w-full rounded-lg bg-ptba-gold px-4 py-2.5 text-sm font-bold text-ptba-charcoal hover:bg-ptba-gold-light transition-colors"
                  >
                    {t("applyEoi")}
                  </button>
                </>
              ) : (
                <div className="rounded-lg bg-ptba-gray/5 p-4 text-center">
                  <p className="text-sm text-ptba-gray">
                    {phase1DeadlinePassed ? t("deadlinePassed") :
                     !project.isOpenForApplication ? t("notOpenForRegistration") :
                     t("notAcceptingRegistration")}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Required Documents - show docs for current phase */}
          {(() => {
            let currentDocs: typeof phase1RequiredDocs;
            let phaseLabel: string;
            if (isPassedPhase2) {
              currentDocs = phase3RequiredDocs;
              phaseLabel = tc("phase3");
            } else if (isShortlisted) {
              currentDocs = phase2RequiredDocs;
              phaseLabel = tc("phase2");
            } else {
              currentDocs = phase1RequiredDocs;
              phaseLabel = tc("phase1");
            }
            return currentDocs.length > 0 ? (
              <div className="rounded-xl bg-white p-6 shadow-sm">
                <h3 className="text-sm font-semibold text-ptba-charcoal mb-1">
                  {t("requiredDocuments")} — {phaseLabel}
                </h3>
                <p className="text-xs text-ptba-gray mb-3">{t("requiredDocumentsDesc")}</p>
                <ul className="space-y-2">
                  {currentDocs.map((doc: any) => (
                    <li key={doc.id} className="flex items-start gap-2 text-sm">
                      <div className="h-4 w-4 mt-0.5 shrink-0 rounded-full border-2 border-ptba-steel-blue" />
                      <div>
                        <p className="text-ptba-charcoal">{doc.name}</p>
                        {doc.required && <span className="text-[10px] text-ptba-red font-medium">{tc("required")}</span>}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null;
          })()}
        </div>
      </div>
    </div>
  );
}
