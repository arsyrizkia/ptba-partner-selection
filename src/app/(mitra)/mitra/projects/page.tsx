"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Search, Calendar, FileText, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useAuth } from "@/lib/auth/auth-context";
import { mockProjects } from "@/lib/mock-data/projects";
import { mockApplications } from "@/lib/mock-data/applications";
import { formatCurrency, formatDate } from "@/lib/utils/format";

const TYPE_FILTERS = ["Semua", "CAPEX", "OPEX", "Strategis"] as const;

function typeBadge(type: string) {
  switch (type) {
    case "CAPEX": return "bg-ptba-steel-blue/10 text-ptba-steel-blue border border-ptba-steel-blue/20";
    case "OPEX": return "bg-ptba-gold/10 text-ptba-gold border border-ptba-gold/20";
    case "Strategis": return "bg-purple-100 text-purple-700 border border-purple-200";
    default: return "bg-ptba-gray/10 text-ptba-gray border border-ptba-gray/20";
  }
}

export default function MitraProjectsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("Semua");

  const userApplications = useMemo(
    () => mockApplications.filter((a) => a.partnerId === user?.partnerId),
    [user?.partnerId]
  );

  const appliedProjectIds = useMemo(
    () => new Set(userApplications.map((a) => a.projectId)),
    [userApplications]
  );

  const projects = useMemo(() => {
    return mockProjects
      .filter((p) => p.isOpenForApplication || appliedProjectIds.has(p.id))
      .filter((p) => typeFilter === "Semua" || p.type === typeFilter)
      .filter((p) => !search || p.name.toLowerCase().includes(search.toLowerCase()));
  }, [typeFilter, search, appliedProjectIds]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-ptba-charcoal">Proyek Tersedia</h1>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ptba-gray" />
          <input
            type="text"
            placeholder="Cari proyek..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-ptba-light-gray bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-ptba-steel-blue focus:ring-2 focus:ring-ptba-steel-blue/20"
          />
        </div>
        <div className="flex gap-1.5">
          {TYPE_FILTERS.map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                typeFilter === t
                  ? "bg-ptba-navy text-white"
                  : "bg-white border border-ptba-light-gray text-ptba-charcoal hover:bg-ptba-section-bg"
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Project Cards */}
      {projects.length === 0 ? (
        <div className="rounded-xl bg-white p-12 text-center shadow-sm">
          <FileText className="mx-auto h-12 w-12 text-ptba-light-gray" />
          <p className="mt-3 text-ptba-gray">Tidak ada proyek yang ditemukan.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {projects.map((project) => {
            const hasApplied = appliedProjectIds.has(project.id);
            const isDeadlinePassed = project.applicationDeadline && new Date(project.applicationDeadline) < new Date();
            const requiredDocsCount = project.requiredDocuments?.length ?? 0;

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
                        {project.type}
                      </span>
                      {hasApplied && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700 border border-green-200">
                          <CheckCircle2 className="h-3 w-3" />
                          Sudah Melamar
                        </span>
                      )}
                      {!hasApplied && isDeadlinePassed && (
                        <span className="inline-flex rounded-full bg-ptba-red/10 px-2.5 py-0.5 text-xs font-medium text-ptba-red border border-ptba-red/20">
                          Deadline Lewat
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <p className="mt-3 text-sm font-semibold text-ptba-charcoal">
                  {formatCurrency(project.capexValue)}
                </p>

                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ptba-gray">
                  {project.applicationDeadline && (
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      Deadline: {formatDate(project.applicationDeadline)}
                    </span>
                  )}
                  {requiredDocsCount > 0 && (
                    <span className="inline-flex items-center gap-1">
                      <FileText className="h-3.5 w-3.5" />
                      {requiredDocsCount} dokumen
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
