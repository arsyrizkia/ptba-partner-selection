"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, Calendar, FileText, CheckCircle2, Loader2, FolderKanban } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useAuth } from "@/lib/auth/auth-context";
import { api, projectApi } from "@/lib/api/client";
import { useTranslations } from "next-intl";
import { useLocale } from "@/lib/i18n/locale-context";

interface MitraProject {
  id: string;
  name: string;
  type: string;
  status: string;
  description: string;
  startDate: string;
  phase: string;
  isOpenForApplication: boolean;
  phase1Deadline: string | null;
  applicationCount: number;
}

interface MitraApplication {
  id: string;
  project_id: string;
  project_name: string;
  status: string;
  applied_at: string;
}

const TYPE_FILTERS = ["all", "mining", "power_generation", "coal_processing", "infrastructure", "environmental", "corporate", "others"] as const;

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

export default function MitraProjectsPage() {
  const router = useRouter();
  const { accessToken } = useAuth();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [projects, setProjects] = useState<MitraProject[]>([]);
  const [applications, setApplications] = useState<MitraApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const t = useTranslations("projects");
  const tc = useTranslations("common");
  const { locale } = useLocale();

  useEffect(() => {
    if (!accessToken) return;
    setLoading(true);
    Promise.all([
      projectApi(accessToken).list(),
      api<{ applications: MitraApplication[] }>("/applications", { token: accessToken }),
    ]).then(([projRes, appRes]) => {
      setProjects(projRes.data as unknown as MitraProject[]);
      setApplications(appRes.applications || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [accessToken]);

  const appliedProjectIds = useMemo(
    () => new Set(applications.map((a) => a.project_id)),
    [applications]
  );

  const filtered = useMemo(() => {
    return projects
      .filter((p) => typeFilter === "all" || p.type === typeFilter)
      .filter((p) => !search || p.name.toLowerCase().includes(search.toLowerCase()));
  }, [projects, typeFilter, search]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-ptba-steel-blue" />
        <span className="ml-3 text-ptba-gray">{tc("loadingProject")}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-ptba-charcoal">{t("title")}</h1>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ptba-gray" />
          <input
            type="text"
            placeholder={t("searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-ptba-light-gray bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-ptba-steel-blue focus:ring-2 focus:ring-ptba-steel-blue/20"
          />
        </div>
        <div className="flex gap-1.5">
          {TYPE_FILTERS.map((filterType) => (
            <button
              key={filterType}
              onClick={() => setTypeFilter(filterType)}
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                typeFilter === filterType
                  ? "bg-ptba-navy text-white"
                  : "bg-white border border-ptba-light-gray text-ptba-charcoal hover:bg-ptba-section-bg"
              )}
            >
              {filterType === "all" ? t("all") : tc(`typeLabels.${filterType}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Project Cards */}
      {filtered.length === 0 ? (
        <div className="rounded-xl bg-white p-12 text-center shadow-sm">
          <FolderKanban className="mx-auto h-12 w-12 text-ptba-light-gray" />
          <p className="mt-3 text-ptba-gray">{t("noResults")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {filtered.map((project) => {
            const hasApplied = appliedProjectIds.has(project.id);
            const canApply = project.isOpenForApplication && !hasApplied;

            return (
              <button
                key={project.id}
                onClick={() => router.push(`/mitra/projects/${project.id}`)}
                className="rounded-xl bg-white p-5 shadow-sm border border-ptba-light-gray/50 text-left transition-all hover:shadow-md hover:border-ptba-steel-blue/30"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-ptba-charcoal truncate">{project.name}</h3>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium", typeBadge(project.type))}>
                        {tc(`typeLabels.${project.type}`)}
                      </span>
                      {hasApplied && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700 border border-green-200">
                          <CheckCircle2 className="h-3 w-3" />
                          {t("alreadyRegistered")}
                        </span>
                      )}
                      {canApply && (
                        <span className="inline-flex rounded-full bg-ptba-navy/10 px-2.5 py-0.5 text-xs font-medium text-ptba-navy border border-ptba-navy/20">
                          {t("registrationOpen")}
                        </span>
                      )}
                      {!project.isOpenForApplication && !hasApplied && (
                        <span className="inline-flex rounded-full bg-ptba-gray/10 px-2.5 py-0.5 text-xs font-medium text-ptba-gray border border-ptba-gray/20">
                          {t("notOpenYet")}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {project.description && (
                  <p className="mt-2 text-xs text-ptba-gray line-clamp-2">{project.description}</p>
                )}

                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ptba-gray">
                  {project.phase1Deadline && (
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {t("deadlinePhase1", { date: new Date(project.phase1Deadline).toLocaleDateString(locale === "en" ? "en-US" : "id-ID", { day: "numeric", month: "short", year: "numeric" }) })}
                    </span>
                  )}
                  {project.startDate && (
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {t("startDate", { date: new Date(project.startDate).toLocaleDateString(locale === "en" ? "en-US" : "id-ID", { day: "numeric", month: "short", year: "numeric" }) })}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
