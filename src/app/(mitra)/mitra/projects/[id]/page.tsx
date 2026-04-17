"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Calendar, FileText, CheckCircle2, ArrowRight, ShieldCheck, Loader2, Download, MapPin, Zap, DollarSign, TrendingUp, ChevronDown, HelpCircle, MessageCircle, Filter, Search, Clock } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useAuth } from "@/lib/auth/auth-context";
import { api, projectApi } from "@/lib/api/client";
import { DOCUMENT_TYPES } from "@/lib/constants/document-types";
import { formatDate } from "@/lib/utils/format";
import { sanitizeHtml } from "@/lib/utils/sanitize";
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
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "faq">("overview");
  const [faqFilter, setFaqFilter] = useState<string>("all");
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const [openMitraFaqIndex, setOpenMitraFaqIndex] = useState<number | null>(null);
  const [faqSearch, setFaqSearch] = useState("");
  const [showAskModal, setShowAskModal] = useState(false);
  const [askSubject, setAskSubject] = useState("");
  const [askMessage, setAskMessage] = useState("");
  const [askCategory, setAskCategory] = useState("umum");
  const [askSubmitting, setAskSubmitting] = useState(false);
  const [askError, setAskError] = useState("");

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
  const isPhase3 = false; // 2-phase system — Phase 3 removed
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
          <span className="inline-flex rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-medium">{project.status === "Berjalan" ? "Ongoing" : project.status}</span>
          {project.phase && project.phase !== "published" && (
            <span className="inline-flex rounded-full bg-white/30 px-2.5 py-0.5 text-xs font-semibold">
              {phaseLabel(project.phase, tc)}
            </span>
          )}
        </div>
        <h1 className="text-2xl font-bold">{project.name}</h1>
        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm text-white/80">
          {(() => {
            const deadline = isPhase3 ? project.phase3Deadline : isPhase2 ? project.phase2Deadline : project.phase1Deadline;
            const label = isPhase3 ? (locale === "en" ? "Phase 3 Registration Deadline" : "Deadline Pendaftaran Fase 3") : isPhase2 ? (locale === "en" ? "Phase 2 Registration Deadline" : "Deadline Pendaftaran Fase 2") : (locale === "en" ? "Phase 1 Registration Deadline" : "Deadline Pendaftaran Fase 1");
            return deadline ? (
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {label}: {new Date(deadline).toLocaleDateString(dateLocale)}
              </span>
            ) : null;
          })()}
        </div>

        {/* Phase Progress */}
        {project.phase && project.phase !== "published" && (
          <div className="mt-4">
            <div className="flex items-center justify-end text-xs text-white/70 mb-1.5">
              <span className="font-semibold text-white">{Math.round((project.currentStep / (project.totalSteps || 11)) * 100)}%</span>
            </div>
            <div className="h-2 rounded-full bg-white/20 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-white/90 to-ptba-gold transition-all duration-500"
                style={{ width: `${Math.round((project.currentStep / (project.totalSteps || 11)) * 100)}%` }}
              />
            </div>
            <div className="mt-1.5 flex justify-between text-[10px] text-white/50">
              <span>{locale === "en" ? "Registration" : "Pendaftaran"}</span>
              <span>{locale === "en" ? "Evaluation Phase 1" : "Evaluasi Tahap 1"}</span>
              <span>{locale === "en" ? "Evaluation Phase 2" : "Evaluasi Tahap 2"}</span>
              <span>{locale === "en" ? "Finish" : "Selesai"}</span>
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

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {(["overview", "faq"] as const).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={cn("px-5 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px",
              activeTab === tab ? "border-ptba-navy text-ptba-navy" : "border-transparent text-ptba-gray hover:text-ptba-charcoal"
            )}>
            {tab === "overview" ? (locale === "en" ? "Overview" : "Ringkasan") : "FAQ"}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl bg-white p-6 shadow-sm overflow-hidden">
            <h2 className="text-lg font-semibold text-ptba-charcoal mb-3">{t("projectDescription")}</h2>
            {project.description ? (
              <div
                className="text-sm text-ptba-gray leading-relaxed prose prose-sm max-w-none overflow-hidden [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-lg [&_img]:cursor-pointer [&_img]:hover:opacity-90 [&_img]:transition-opacity [&_table]:w-full [&_table]:table-fixed"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(project.description.replace(/&nbsp;/g, " ").replace(/\u00A0/g, " ")) }}
                onClick={(e) => { const t = e.target as HTMLElement; if (t.tagName === "IMG") setLightboxSrc((t as HTMLImageElement).src); }}
              />
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
                    onClick={() => setLightboxSrc(img.url)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Project Summary (Indicative) — Financial */}
          {(project.location || project.capacityMw || project.indicativeCapex || project.npv || project.der) && (() => {
            const derParts = project.der ? project.der.split(":").map((s: string) => parseInt(s.trim(), 10)) : null;
            const debtPct = derParts && derParts.length === 2 && !isNaN(derParts[0]) ? derParts[0] : null;
            const equityPct = derParts && derParts.length === 2 && !isNaN(derParts[1]) ? derParts[1] : null;

            const finItems = [
              { label: t("npv"), value: project.npv, unit: "USD Mn" },
              { label: t("projectIrr"), value: project.projectIrr, unit: "%" },
              { label: t("equityIrr"), value: project.equityIrr, unit: "%" },
              { label: t("paybackPeriod"), value: project.paybackPeriod, unit: locale === "en" ? "Years" : "Tahun" },
              { label: t("wacc"), value: project.wacc, unit: "%" },
            ].filter(i => i.value);

            const tariffItems = [
              { label: t("tariffLevelized"), value: project.tariffLevelized, unit: "cUSD/kWh" },
              { label: `${t("bpp")}${project.bppLocation ? ` ${project.bppLocation}` : ""}`, value: project.bppValue, unit: "cUSD/kWh" },
            ].filter(i => i.value);

            // Count hero cards to determine grid columns
            const heroCount = [project.location, project.capacityMw, project.indicativeCapex, project.lifetime].filter(Boolean).length;
            const heroGridCols = heroCount <= 2 ? "sm:grid-cols-2" : heroCount === 3 ? "sm:grid-cols-3" : "sm:grid-cols-4";

            return (
              <div className="rounded-xl bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-ptba-charcoal mb-5 flex items-center gap-2.5">
                  <TrendingUp className="h-5 w-5 text-ptba-steel-blue" />
                  {t("projectSummary")}
                </h2>

                {/* Hero: Location, Capacity, CAPEX, Lifetime */}
                <div className={cn("grid grid-cols-1 gap-3 mb-5", heroGridCols)}>
                  {project.location && (
                    <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-ptba-navy to-ptba-steel-blue p-5 text-white">
                      <div className="absolute -top-5 -right-5 h-20 w-20 rounded-full bg-white/[0.06]" />
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <MapPin className="h-3 w-3 opacity-70" />
                        <span className="text-[10px] font-medium uppercase tracking-wider opacity-70">{t("location")}</span>
                      </div>
                      <p className="text-[15px] font-bold leading-snug">{project.location}</p>
                    </div>
                  )}
                  {project.capacityMw && (
                    <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-ptba-navy to-ptba-steel-blue p-5 text-white">
                      <div className="absolute -top-5 -right-5 h-20 w-20 rounded-full bg-white/[0.06]" />
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <Zap className="h-3 w-3 opacity-70" />
                        <span className="text-[10px] font-medium uppercase tracking-wider opacity-70">{t("powerCapacity")}</span>
                      </div>
                      <p className="text-[22px] font-extrabold">{project.capacityMw} <span className="text-xs font-normal opacity-70">MW</span></p>
                    </div>
                  )}
                  {project.indicativeCapex && (
                    <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-ptba-navy to-ptba-steel-blue p-5 text-white">
                      <div className="absolute -top-5 -right-5 h-20 w-20 rounded-full bg-white/[0.06]" />
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <DollarSign className="h-3 w-3 opacity-70" />
                        <span className="text-[10px] font-medium uppercase tracking-wider opacity-70">{t("indicativeCapex")}</span>
                      </div>
                      <p className="text-[22px] font-extrabold"><span className="text-xs font-normal opacity-70">$ </span>{project.indicativeCapex} <span className="text-xs font-normal opacity-70">Mn</span></p>
                    </div>
                  )}
                  {project.lifetime && (
                    <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-ptba-navy to-ptba-steel-blue p-5 text-white">
                      <div className="absolute -top-5 -right-5 h-20 w-20 rounded-full bg-white/[0.06]" />
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <Calendar className="h-3 w-3 opacity-70" />
                        <span className="text-[10px] font-medium uppercase tracking-wider opacity-70">{t("lifetime")}</span>
                      </div>
                      <p className="text-[22px] font-extrabold">{project.lifetime} <span className="text-xs font-normal opacity-70">{locale === "en" ? "Years" : "Tahun"}</span></p>
                    </div>
                  )}
                </div>

                {/* DER Visual Bar */}
                {project.der && debtPct !== null && equityPct !== null && (
                  <div className="rounded-xl border border-ptba-light-gray bg-[#fafbfc] p-4 mb-5">
                    <div className="flex items-center justify-between mb-2.5">
                      <span className="text-[11px] font-medium uppercase tracking-wider text-ptba-gray">{t("der")}</span>
                      <span className="text-sm font-bold text-ptba-navy">{project.der}</span>
                    </div>
                    <div className="h-3 rounded-full bg-ptba-light-gray overflow-hidden flex">
                      <div className="h-full rounded-l-full bg-gradient-to-r from-ptba-navy to-ptba-steel-blue" style={{ width: `${debtPct}%` }} />
                      <div className="h-full rounded-r-full bg-gradient-to-r from-ptba-gold to-[#f5c242]" style={{ width: `${equityPct}%` }} />
                    </div>
                    <div className="flex justify-between mt-1.5">
                      <span className="text-[11px] font-semibold text-ptba-steel-blue">{t("debt")} {debtPct}%</span>
                      <span className="text-[11px] font-semibold text-ptba-gold">{t("equity")} {equityPct}%</span>
                    </div>
                  </div>
                )}

                {/* Financial Projection Grid — only for shortlisted mitra */}
                {isShortlisted && finItems.length > 0 && (
                  <>
                    <p className="text-xs font-semibold uppercase tracking-wider text-ptba-gray/60 mb-3 pb-2 border-b border-ptba-light-gray/60">{t("financialProjection")}</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {finItems.map((item) => (
                        <div key={item.label} className="rounded-xl border border-ptba-light-gray bg-[#fafbfc] px-4 py-3.5 transition-colors hover:border-ptba-steel-blue hover:bg-ptba-steel-blue/[0.03]">
                          <p className="text-[10px] font-medium uppercase tracking-wider text-ptba-gray mb-1">{item.label}</p>
                          <p className="text-base font-bold text-ptba-navy">{item.value} <span className="text-[11px] font-normal text-ptba-gray">{item.unit}</span></p>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {/* Tariff + BPP — only for shortlisted mitra */}
                {isShortlisted && tariffItems.length > 0 && (
                  <div className={cn("grid gap-3 mt-3", tariffItems.length === 1 ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2")}>
                    {tariffItems.map((item) => (
                      <div key={item.label} className="rounded-xl border border-ptba-light-gray bg-[#fafbfc] px-4 py-3.5 transition-colors hover:border-ptba-steel-blue hover:bg-ptba-steel-blue/[0.03]">
                        <p className="text-[10px] font-medium uppercase tracking-wider text-ptba-gray mb-1">{item.label}</p>
                        <p className="text-base font-bold text-ptba-navy">{item.value} <span className="text-[11px] font-normal text-ptba-gray">{item.unit}</span></p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Indicative Disclaimer */}
                {project.indicativeDisclaimer && (
                  <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
                    <p className="text-[11px] text-amber-800 leading-relaxed">
                      <span className="font-semibold">Catatan:</span> {project.indicativeDisclaimer}
                    </p>
                  </div>
                )}
              </div>
            );
          })()}

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
                  {tc(`status.${application.status}`)}
                </p>
                <p className="mt-1 text-xs text-ptba-gray">
                  {tc("submitted")}: {new Date(application.applied_at).toLocaleDateString(dateLocale)} {new Date(application.applied_at).toLocaleTimeString(dateLocale, { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>

              <div className="mt-3 space-y-2">
                <button
                  onClick={() => router.push(`/mitra/projects/${projectId}/apply`)}
                  className="w-full rounded-lg border border-ptba-navy px-4 py-2 text-sm font-medium text-ptba-navy hover:bg-ptba-navy/5 transition-colors"
                >
                  {locale === "en" ? "View Submission" : "Lihat Pendaftaran"}
                </button>
                {canAccessPhase2 && (
                  <button
                    onClick={() => router.push(`/mitra/projects/${projectId}/phase2`)}
                    className="w-full rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition-colors"
                  >
                    {t("continueToPhase2")}
                  </button>
                )}
                {isPassedPhase2 && (
                  <button
                    onClick={() => router.push(`/mitra/projects/${projectId}/phase2`)}
                    className="w-full rounded-lg border border-ptba-navy px-4 py-2 text-sm font-medium text-ptba-navy hover:bg-ptba-navy/5 transition-colors"
                  >
                    {locale === "en" ? "View Phase 2 Submission" : "Lihat Dokumen Fase 2"}
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
                <div className="rounded-lg bg-ptba-gray/5 p-4 text-center space-y-2">
                  <p className="text-sm text-ptba-gray">
                    {phase1DeadlinePassed ? t("deadlinePassed") :
                     !project.isOpenForApplication ? t("notOpenForRegistration") :
                     t("notAcceptingRegistration")}
                  </p>
                  {project.startDate && (
                    <p className="text-xs text-ptba-steel-blue font-medium">
                      {locale === "en" ? "Registration opens" : "Pendaftaran dibuka"}: {new Date(project.startDate).toLocaleDateString(dateLocale, { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Status Pendaftaran - milestone timeline (hidden for now) */}
          {false && application && application.status !== "Draft" && (() => {
            const MILESTONES = locale === "en" ? [
              { id: 1, label: "Phase 1 Registration", stepRange: [2, 3] },
              { id: 2, label: "Phase 1 Evaluation", stepRange: [4, 5] },
              { id: 3, label: "Shortlist Announcement", stepRange: [6, 6] },
              { id: 4, label: "Phase 2 Registration", stepRange: [7, 8] },
              { id: 5, label: "Phase 2 Evaluation (PQ)", stepRange: [9, 10] },
              { id: 6, label: "Phase 2 Shortlist Announcement", stepRange: [11, 11] },
              { id: 7, label: "Phase 3 Registration", stepRange: [12, 12] },
              { id: 8, label: "Evaluation & Ranking", stepRange: [13, 13] },
              { id: 9, label: "Negotiation", stepRange: [14, 14] },
              { id: 10, label: "Winner Announcement", stepRange: [15, 16] },
            ] : [
              { id: 1, label: "Pendaftaran Fase 1", stepRange: [2, 3] },
              { id: 2, label: "Evaluasi Tahap 1", stepRange: [4, 5] },
              { id: 3, label: "Pengumuman Shortlist", stepRange: [6, 6] },
              { id: 4, label: "Pendaftaran Fase 2", stepRange: [7, 8] },
              { id: 5, label: "Evaluasi Fase 2 (PQ)", stepRange: [9, 10] },
              { id: 6, label: "Pengumuman Shortlist Fase 2", stepRange: [11, 11] },
              { id: 7, label: "Pendaftaran Fase 3", stepRange: [12, 12] },
              { id: 8, label: "Evaluasi & Peringkat", stepRange: [13, 13] },
              { id: 9, label: "Negosiasi", stepRange: [14, 14] },
              { id: 10, label: "Pengumuman Pemenang", stepRange: [15, 16] },
            ];
            const step = project.currentStep || 1;
            return (
              <div className="rounded-xl bg-white p-6 shadow-sm">
                <h3 className="text-sm font-semibold text-ptba-charcoal mb-4">
                  {locale === "en" ? "Registration Status" : "Status Pendaftaran"}
                </h3>
                <div className="space-y-0">
                  {MILESTONES.map((m, i) => {
                    const isCompleted = step > m.stepRange[1];
                    const isCurrent = step >= m.stepRange[0] && step <= m.stepRange[1];
                    return (
                      <div key={m.id} className="flex items-start gap-3">
                        <div className="flex flex-col items-center">
                          <div className={cn(
                            "flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold shrink-0",
                            isCompleted ? "bg-green-500 text-white" :
                            isCurrent ? "bg-ptba-navy text-white ring-2 ring-ptba-navy/30" :
                            "bg-gray-200 text-gray-400"
                          )}>
                            {isCompleted ? "✓" : m.id}
                          </div>
                          {i < MILESTONES.length - 1 && (
                            <div className={cn("w-0.5 h-6", isCompleted ? "bg-green-300" : "bg-gray-200")} />
                          )}
                        </div>
                        <p className={cn(
                          "text-xs pt-1",
                          isCompleted ? "text-green-700 font-medium" :
                          isCurrent ? "text-ptba-navy font-semibold" :
                          "text-ptba-gray"
                        )}>
                          {m.label}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}
        </div>
      </div>
      )}

      {activeTab === "faq" && (() => {
        const projectFaqs = project.faqs || [];
        const projectGeneralFaqs = projectFaqs.filter((f: any) => (f.section || "general") === "general");
        const generalFaqs = projectGeneralFaqs;
        const mitraFaqs = projectFaqs.filter((f: any) => f.section === "mitra");
        const allFaqs = [...generalFaqs, ...mitraFaqs];
        const CAT_COLORS: Record<string, string> = {
          pendaftaran: "bg-blue-50 text-blue-700 border-blue-200",
          evaluasi: "bg-purple-50 text-purple-700 border-purple-200",
          dokumen: "bg-teal-50 text-teal-700 border-teal-200",
          keuangan: "bg-amber-50 text-amber-700 border-amber-200",
          umum: "bg-gray-50 text-gray-600 border-gray-200",
        };
        const CAT_ACTIVE_COLORS: Record<string, string> = {
          pendaftaran: "bg-blue-600 text-white border-blue-600",
          evaluasi: "bg-purple-600 text-white border-purple-600",
          dokumen: "bg-teal-600 text-white border-teal-600",
          keuangan: "bg-amber-500 text-white border-amber-500",
          umum: "bg-gray-600 text-white border-gray-600",
        };
        const CAT_LABELS: Record<string, string> = { pendaftaran: "Pendaftaran", evaluasi: "Evaluasi", dokumen: "Dokumen", keuangan: "Keuangan", umum: "Umum" };

        // Count FAQs per category across all FAQs
        const catCounts: Record<string, number> = {};
        allFaqs.forEach((f: any) => {
          const cat = f.category || "umum";
          catCounts[cat] = (catCounts[cat] || 0) + 1;
        });
        const availableCategories = Object.keys(catCounts).sort();

        // Filter logic
        const filterFaqs = (items: any[]) => {
          let filtered = items;
          if (faqFilter !== "all") {
            filtered = filtered.filter((f: any) => (f.category || "umum") === faqFilter);
          }
          if (faqSearch.trim()) {
            const q = faqSearch.toLowerCase();
            filtered = filtered.filter((f: any) =>
              f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q)
            );
          }
          return filtered;
        };

        const filteredGeneral = filterFaqs(generalFaqs);
        const filteredMitra = filterFaqs(mitraFaqs);
        const totalFiltered = filteredGeneral.length + filteredMitra.length;

        const FaqAccordion = ({ items, section }: { items: any[]; section: "general" | "mitra" }) => {
          const [openIdx, setOpenIdx] = section === "general"
            ? [openFaqIndex, setOpenFaqIndex]
            : [openMitraFaqIndex, setOpenMitraFaqIndex];

          if (items.length === 0) {
            return (
              <div className="flex flex-col items-center justify-center py-10 px-4">
                <div className="rounded-full bg-ptba-section-bg p-3 mb-3">
                  <HelpCircle className="h-6 w-6 text-ptba-gray" />
                </div>
                <p className="text-sm text-ptba-gray text-center">
                  {faqFilter !== "all" || faqSearch.trim()
                    ? (locale === "en" ? "No questions match your filter." : "Tidak ada pertanyaan yang cocok dengan filter.")
                    : (locale === "en" ? "No questions yet." : "Belum ada pertanyaan.")}
                </p>
              </div>
            );
          }

          return (
            <div className="space-y-2 p-4">
              {items.map((faq: any, i: number) => {
                const isOpen = openIdx === i;
                return (
                  <div
                    key={faq.id || i}
                    className={cn(
                      "rounded-xl border transition-all duration-200",
                      isOpen
                        ? "border-ptba-steel-blue/30 bg-white shadow-md ring-1 ring-ptba-steel-blue/10"
                        : "border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm"
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => setOpenIdx(isOpen ? null : i)}
                      className="flex w-full items-start gap-3 px-4 py-3.5 text-left"
                    >
                      <div className={cn(
                        "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold transition-colors duration-200",
                        isOpen ? "bg-ptba-navy text-white" : "bg-ptba-section-bg text-ptba-gray"
                      )}>
                        {String(i + 1).padStart(2, "0")}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className={cn(
                          "text-sm font-medium leading-snug transition-colors",
                          isOpen ? "text-ptba-navy" : "text-ptba-charcoal"
                        )}>
                          {faq.question}
                        </span>
                      </div>
                      <ChevronDown className={cn(
                        "mt-1 h-4 w-4 shrink-0 text-ptba-gray transition-transform duration-200",
                        isOpen && "rotate-180 text-ptba-steel-blue"
                      )} />
                    </button>
                    <div className={cn(
                      "overflow-hidden transition-all duration-200",
                      isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                    )}>
                      <div className="border-t border-dashed border-gray-100 mx-4" />
                      <div className="px-4 py-3 pl-[52px]">
                        <p className="text-sm text-ptba-gray leading-relaxed">{faq.answer}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        };

        return (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Left: FAQ Content */}
            <div className="lg:col-span-2 space-y-5">
              {/* Search + Filter Bar */}
              <div className="rounded-xl bg-white shadow-sm border border-gray-100 overflow-hidden">
                {/* Search */}
                <div className="px-4 py-3 border-b border-gray-50">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ptba-gray" />
                    <input
                      type="text"
                      placeholder={locale === "en" ? "Search questions..." : "Cari pertanyaan..."}
                      value={faqSearch}
                      onChange={(e) => setFaqSearch(e.target.value)}
                      className="w-full rounded-lg border border-gray-200 bg-ptba-section-bg py-2 pl-9 pr-4 text-sm text-ptba-charcoal placeholder:text-ptba-gray/60 focus:border-ptba-steel-blue focus:bg-white focus:outline-none focus:ring-1 focus:ring-ptba-steel-blue/30 transition-all"
                    />
                  </div>
                </div>
                {/* Category Filter Pills */}
                <div className="px-4 py-3 flex items-center gap-2 flex-wrap">
                  <Filter className="h-3.5 w-3.5 text-ptba-gray shrink-0" />
                  <button
                    onClick={() => setFaqFilter("all")}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-all duration-150",
                      faqFilter === "all"
                        ? "bg-ptba-navy text-white border-ptba-navy shadow-sm"
                        : "bg-white text-ptba-gray border-gray-200 hover:border-gray-300 hover:text-ptba-charcoal"
                    )}
                  >
                    {locale === "en" ? "All" : "Semua"}
                    <span className={cn(
                      "inline-flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] font-bold",
                      faqFilter === "all" ? "bg-white/20 text-white" : "bg-gray-100 text-ptba-gray"
                    )}>
                      {allFaqs.length}
                    </span>
                  </button>
                  {availableCategories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setFaqFilter(faqFilter === cat ? "all" : cat)}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-all duration-150",
                        faqFilter === cat
                          ? CAT_ACTIVE_COLORS[cat] || "bg-gray-600 text-white border-gray-600"
                          : cn("bg-white hover:shadow-sm", CAT_COLORS[cat] || "text-ptba-gray border-gray-200")
                      )}
                    >
                      {CAT_LABELS[cat] || cat}
                      <span className={cn(
                        "inline-flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] font-bold",
                        faqFilter === cat ? "bg-white/20 text-white" : "bg-black/5"
                      )}>
                        {catCounts[cat]}
                      </span>
                    </button>
                  ))}
                </div>
                {/* Result count hint */}
                {(faqFilter !== "all" || faqSearch.trim()) && (
                  <div className="px-4 pb-3 -mt-1">
                    <p className="text-[11px] text-ptba-gray">
                      {locale === "en"
                        ? `Showing ${totalFiltered} of ${allFaqs.length} questions`
                        : `Menampilkan ${totalFiltered} dari ${allFaqs.length} pertanyaan`}
                      {(faqFilter !== "all" || faqSearch.trim()) && (
                        <button
                          onClick={() => { setFaqFilter("all"); setFaqSearch(""); }}
                          className="ml-2 text-ptba-steel-blue hover:text-ptba-navy font-medium underline underline-offset-2 transition-colors"
                        >
                          {locale === "en" ? "Clear filters" : "Hapus filter"}
                        </button>
                      )}
                    </p>
                  </div>
                )}
              </div>

              {/* Section 1: FAQ Umum */}
              <div className="rounded-xl bg-white shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-ptba-navy/[0.03] to-transparent">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-ptba-navy/10">
                      <HelpCircle className="h-[18px] w-[18px] text-ptba-navy" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-ptba-navy">
                        {locale === "en" ? "General FAQ" : "FAQ Umum"}
                      </h2>
                      <p className="text-[11px] text-ptba-gray mt-0.5">
                        {locale === "en" ? "Frequently asked questions about this project" : "Pertanyaan yang sering diajukan tentang proyek ini"}
                      </p>
                    </div>
                    <div className="ml-auto">
                      <span className="inline-flex items-center rounded-full bg-ptba-section-bg px-2.5 py-0.5 text-[11px] font-medium text-ptba-gray">
                        {filteredGeneral.length} {locale === "en" ? "questions" : "pertanyaan"}
                      </span>
                    </div>
                  </div>
                </div>
                <FaqAccordion items={filteredGeneral} section="general" />
              </div>

              {/* Section 2: Pertanyaan Mitra */}
              {mitraFaqs.length > 0 && (
                <div className="rounded-xl bg-white shadow-sm border border-gray-100 overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-ptba-steel-blue/[0.04] to-transparent">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-ptba-steel-blue/10">
                        <MessageCircle className="h-[18px] w-[18px] text-ptba-steel-blue" />
                      </div>
                      <div>
                        <h2 className="text-sm font-bold text-ptba-steel-blue">
                          {locale === "en" ? "Questions from Partners" : "Pertanyaan yang Sering Ditanyakan Mitra"}
                        </h2>
                        <p className="text-[11px] text-ptba-gray mt-0.5">
                          {locale === "en" ? "Common questions asked by prospective partners" : "Pertanyaan umum dari calon mitra"}
                        </p>
                      </div>
                      <div className="ml-auto">
                        <span className="inline-flex items-center rounded-full bg-ptba-steel-blue/5 px-2.5 py-0.5 text-[11px] font-medium text-ptba-steel-blue">
                          {filteredMitra.length} {locale === "en" ? "questions" : "pertanyaan"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <FaqAccordion items={filteredMitra} section="mitra" />
                </div>
              )}
            </div>

            {/* Right: Sidebar */}
            <div className="space-y-4">
              {/* Quick Stats */}
              <div className="rounded-xl bg-white shadow-sm border border-gray-100 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-ptba-gold/10">
                    <HelpCircle className="h-3.5 w-3.5 text-ptba-gold" />
                  </div>
                  <h3 className="text-sm font-bold text-ptba-charcoal">
                    {locale === "en" ? "FAQ Summary" : "Ringkasan FAQ"}
                  </h3>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-lg bg-ptba-section-bg p-3 text-center">
                    <p className="text-lg font-bold text-ptba-navy">{generalFaqs.length}</p>
                    <p className="text-[10px] text-ptba-gray mt-0.5">{locale === "en" ? "General" : "Umum"}</p>
                  </div>
                  <div className="rounded-lg bg-ptba-steel-blue/5 p-3 text-center">
                    <p className="text-lg font-bold text-ptba-steel-blue">{mitraFaqs.length}</p>
                    <p className="text-[10px] text-ptba-gray mt-0.5">{locale === "en" ? "Partner" : "Mitra"}</p>
                  </div>
                </div>
                {/* Category breakdown */}
                {availableCategories.length > 0 && (
                  <div className="mt-3 space-y-1.5">
                    {availableCategories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setFaqFilter(faqFilter === cat ? "all" : cat)}
                        className={cn(
                          "flex w-full items-center justify-between rounded-lg px-3 py-1.5 text-xs transition-all",
                          faqFilter === cat
                            ? "bg-ptba-navy/5 text-ptba-navy font-medium"
                            : "hover:bg-ptba-section-bg text-ptba-gray"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "h-2 w-2 rounded-full",
                            cat === "pendaftaran" && "bg-blue-500",
                            cat === "evaluasi" && "bg-purple-500",
                            cat === "dokumen" && "bg-teal-500",
                            cat === "keuangan" && "bg-amber-500",
                            cat === "umum" && "bg-gray-400",
                          )} />
                          {CAT_LABELS[cat] || cat}
                        </div>
                        <span className="font-medium">{catCounts[cat]}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Have a Question? CTA */}
              {(() => {
                const questionsOpen = project.questionsOpen && (!project.questionsCloseAt || new Date(project.questionsCloseAt) > new Date());
                return (
                  <div className="rounded-xl bg-white shadow-sm border border-gray-100 overflow-hidden">
                    <div className="bg-gradient-to-br from-ptba-navy to-ptba-navy/90 px-5 py-4">
                      <h3 className="text-sm font-bold text-white mb-1">
                        {locale === "en" ? "Have a Question?" : "Punya Pertanyaan?"}
                      </h3>
                      <p className="text-[11px] text-white/70 leading-relaxed">
                        {questionsOpen
                          ? (locale === "en" ? "Submit your question and we'll respond soon." : "Ajukan pertanyaan Anda dan akan kami respon segera.")
                          : (locale === "en" ? "Questions are currently closed for this project." : "Pertanyaan saat ini ditutup untuk proyek ini.")}
                      </p>
                      {questionsOpen && project.questionsCloseAt && (
                        <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1">
                          <Clock className="h-3 w-3 text-ptba-gold" />
                          <span className="text-[11px] text-white/90 font-medium">
                            {locale === "en" ? "Closes" : "Ditutup"}{" "}
                            {new Date(project.questionsCloseAt).toLocaleDateString(locale === "en" ? "en-US" : "id-ID", { day: "numeric", month: "short", year: "numeric" })}
                            {" "}
                            {new Date(project.questionsCloseAt).toLocaleTimeString(locale === "en" ? "en-US" : "id-ID", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="p-4 space-y-2">
                      {questionsOpen ? (
                        <button
                          onClick={() => setShowAskModal(true)}
                          className="flex w-full items-center justify-center gap-2 rounded-lg bg-ptba-gold py-2.5 text-sm font-semibold text-ptba-navy hover:bg-ptba-gold/90 active:scale-[0.98] transition-all shadow-sm"
                        >
                          {locale === "en" ? "Ask a Question" : "Ajukan Pertanyaan"}
                          <ArrowRight className="h-4 w-4" />
                        </button>
                      ) : (
                        <div className="rounded-lg bg-ptba-section-bg px-3 py-2.5 text-center">
                          <p className="text-xs font-medium text-ptba-gray">
                            {locale === "en" ? "Questions Closed" : "Pertanyaan Ditutup"}
                          </p>
                        </div>
                      )}
                      <button
                        onClick={() => router.push(`/mitra/questions?project=${projectId}`)}
                        className="flex w-full items-center justify-center gap-2 rounded-lg border border-ptba-light-gray py-2 text-xs font-medium text-ptba-gray hover:bg-ptba-section-bg transition-colors"
                      >
                        {locale === "en" ? "View My Questions" : "Lihat Pertanyaan Saya"}
                      </button>
                    </div>
                  </div>
                );
              })()}

              {/* Important Dates */}
              {project.phase1Deadline && (
                <div className="rounded-xl bg-white shadow-sm border border-gray-100 p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-ptba-red/10">
                      <Calendar className="h-3.5 w-3.5 text-ptba-red" />
                    </div>
                    <h3 className="text-sm font-bold text-ptba-charcoal">
                      {locale === "en" ? "Important Dates" : "Tanggal Penting"}
                    </h3>
                  </div>
                  <div className="space-y-2.5">
                    <div className="flex items-start gap-3 rounded-lg bg-ptba-section-bg p-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm">
                        <span className="text-[10px] font-bold text-ptba-navy">T1</span>
                      </div>
                      <div>
                        <p className="text-[11px] text-ptba-gray">{locale === "en" ? "Phase 1 Deadline" : "Deadline Tahap 1"}</p>
                        <p className="text-xs font-semibold text-ptba-charcoal">
                          {new Date(project.phase1Deadline).toLocaleDateString(dateLocale, { day: "numeric", month: "long", year: "numeric" })}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* Ask Question Modal */}
      {showAskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => !askSubmitting && setShowAskModal(false)}>
          <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
              <h3 className="text-base font-bold text-ptba-navy">{locale === "en" ? "Ask a Question" : "Ajukan Pertanyaan"}</h3>
              <button onClick={() => !askSubmitting && setShowAskModal(false)} className="text-ptba-gray hover:text-ptba-charcoal"><ArrowLeft className="h-4 w-4 rotate-45" /></button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-ptba-charcoal">{locale === "en" ? "Category" : "Kategori"}</label>
                <select value={askCategory} onChange={(e) => setAskCategory(e.target.value)} className="w-full rounded-lg border border-ptba-light-gray bg-white px-3 py-2 text-sm outline-none focus:border-ptba-steel-blue">
                  <option value="umum">Umum</option>
                  <option value="pendaftaran">Pendaftaran</option>
                  <option value="evaluasi">Evaluasi</option>
                  <option value="dokumen">Dokumen</option>
                  <option value="keuangan">Keuangan</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-ptba-charcoal">{locale === "en" ? "Subject" : "Subjek"} *</label>
                <input type="text" value={askSubject} onChange={(e) => setAskSubject(e.target.value)} placeholder={locale === "en" ? "Brief summary of your question" : "Ringkasan singkat pertanyaan Anda"} className="w-full rounded-lg border border-ptba-light-gray bg-white px-3 py-2 text-sm outline-none focus:border-ptba-steel-blue" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-ptba-charcoal">{locale === "en" ? "Message" : "Pesan"} *</label>
                <textarea value={askMessage} onChange={(e) => setAskMessage(e.target.value)} rows={5} placeholder={locale === "en" ? "Describe your question in detail..." : "Jelaskan pertanyaan Anda secara detail..."} className="w-full rounded-lg border border-ptba-light-gray bg-white px-3 py-2 text-sm outline-none focus:border-ptba-steel-blue resize-y" />
              </div>
              {askError && <p className="text-xs text-ptba-red">{askError}</p>}
            </div>
            <div className="flex gap-2 border-t border-gray-100 px-5 py-3">
              <button onClick={() => setShowAskModal(false)} disabled={askSubmitting} className="flex-1 rounded-lg border border-ptba-light-gray px-4 py-2 text-sm text-ptba-gray hover:bg-ptba-section-bg transition-colors">
                {locale === "en" ? "Cancel" : "Batal"}
              </button>
              <button
                disabled={!askSubject.trim() || !askMessage.trim() || askSubmitting}
                onClick={async () => {
                  if (!accessToken) return;
                  setAskSubmitting(true); setAskError("");
                  try {
                    await api(`/projects/${projectId}/questions`, {
                      method: "POST",
                      token: accessToken,
                      body: { subject: askSubject, message: askMessage, category: askCategory },
                    });
                    setShowAskModal(false);
                    setAskSubject(""); setAskMessage(""); setAskCategory("umum");
                    router.push(`/mitra/questions?project=${projectId}`);
                  } catch (err: any) {
                    setAskError(err?.message || "Gagal mengirim pertanyaan");
                  } finally {
                    setAskSubmitting(false);
                  }
                }}
                className="flex-1 rounded-lg bg-ptba-navy px-4 py-2 text-sm font-semibold text-white hover:bg-ptba-navy/90 disabled:opacity-50 transition-colors"
              >
                {askSubmitting ? (locale === "en" ? "Sending..." : "Mengirim...") : (locale === "en" ? "Send" : "Kirim")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Lightbox */}
      {lightboxSrc && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setLightboxSrc(null)}
        >
          <button
            onClick={() => setLightboxSrc(null)}
            className="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            <span className="text-2xl leading-none">&times;</span>
          </button>
          <img
            src={lightboxSrc}
            alt=""
            className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
