"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { FolderKanban, Plus, Search, TrendingUp, Clock, CheckSquare, FileText } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { mockProjects, mockUsers } from "@/lib/mock-data";
import { useAuth } from "@/lib/auth/auth-context";
import { canAccessProject } from "@/lib/utils/pic-access";

const EVALUATOR_ROLES = ["keuangan", "hukum", "risiko"] as const;

function formatCapex(value: number): string {
  if (value >= 1_000_000_000_000) return `Rp ${(value / 1_000_000_000_000).toFixed(1)} T`;
  if (value >= 1_000_000_000) return `Rp ${(value / 1_000_000_000).toFixed(0)} M`;
  return `Rp ${value.toLocaleString("id-ID")}`;
}

function statusStyle(status: string) {
  switch (status) {
    case "Evaluasi":   return "bg-ptba-steel-blue/10 text-ptba-steel-blue border border-ptba-steel-blue/20";
    case "Persetujuan": return "bg-ptba-gold/10 text-ptba-gold border border-ptba-gold/20";
    case "Draft":      return "bg-ptba-gray/10 text-ptba-gray border border-ptba-gray/20";
    case "Selesai":    return "bg-ptba-green/10 text-ptba-green border border-ptba-green/20";
    case "Dibatalkan": return "bg-ptba-red/10 text-ptba-red border border-ptba-red/20";
    default:           return "bg-ptba-gray/10 text-ptba-gray border border-ptba-gray/20";
  }
}

function typeStyle(type: string) {
  switch (type) {
    case "CAPEX":     return "bg-ptba-navy/10 text-ptba-navy";
    case "OPEX":      return "bg-ptba-steel-blue/10 text-ptba-steel-blue";
    case "Strategis": return "bg-ptba-gold/10 text-ptba-gold";
    default:          return "bg-ptba-gray/10 text-ptba-gray";
  }
}

function phaseInfo(phase?: string): { label: string; color: string } | null {
  if (!phase) return null;
  if (phase === "completed") return { label: "Selesai", color: "bg-ptba-green/10 text-ptba-green border-ptba-green/20" };
  if (phase === "cancelled") return { label: "Dibatalkan", color: "bg-ptba-red/10 text-ptba-red border-ptba-red/20" };
  if (phase.startsWith("phase1")) {
    const sub: Record<string, string> = {
      phase1_registration: "Phase 1 · Pendaftaran",
      phase1_closed: "Phase 1 · Ditutup",
      phase1_evaluation: "Phase 1 · Evaluasi",
      phase1_approval: "Phase 1 · Persetujuan",
      phase1_announcement: "Phase 1 · Pengumuman",
    };
    return { label: sub[phase] ?? "Phase 1", color: "bg-ptba-navy/10 text-ptba-navy border-ptba-navy/20" };
  }
  const sub2: Record<string, string> = {
    phase2_registration: "Phase 2 · Pendaftaran",
    phase2_evaluation: "Phase 2 · Evaluasi",
    phase2_ranking: "Phase 2 · Peringkat",
    phase2_negotiation: "Phase 2 · Negosiasi",
    phase2_approval: "Phase 2 · Persetujuan",
    phase2_announcement: "Phase 2 · Pengumuman",
  };
  return { label: sub2[phase] ?? "Phase 2", color: "bg-ptba-steel-blue/10 text-ptba-steel-blue border-ptba-steel-blue/20" };
}

const STATUS_TABS = ["Semua", "Draft", "Evaluasi", "Persetujuan", "Selesai"];

export default function ProjectsPage() {
  const { role, user } = useAuth();
  const isEvaluator = EVALUATOR_ROLES.includes(role as typeof EVALUATOR_ROLES[number]);

  // Filter by PIC access and evaluator status
  const accessibleProjects = useMemo(() => {
    const currentUser = user ? mockUsers.find((u) => u.id === user.id) ?? user : null;
    return mockProjects.filter((p) => canAccessProject(p, currentUser));
  }, [user]);

  const baseProjects = isEvaluator
    ? accessibleProjects.filter((p) => p.status === "Evaluasi")
    : accessibleProjects;

  const [activeTab, setActiveTab] = useState("Semua");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return baseProjects.filter((p) => {
      const matchTab = activeTab === "Semua" || p.status === activeTab;
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
      return matchTab && matchSearch;
    });
  }, [baseProjects, activeTab, search]);

  // KPIs — scoped to visible projects
  const total = baseProjects.length;
  const evaluasi = baseProjects.filter((p) => p.status === "Evaluasi").length;
  const persetujuan = baseProjects.filter((p) => p.status === "Persetujuan").length;
  const selesai = baseProjects.filter((p) => p.status === "Selesai").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ptba-charcoal">Proyek</h1>
          {isEvaluator && (
            <p className="mt-0.5 text-sm text-ptba-gray">Menampilkan proyek yang memerlukan evaluasi</p>
          )}
        </div>
        {!isEvaluator && (
          <Link
            href="/projects/create"
            className="flex items-center gap-2 rounded-lg bg-ptba-gold px-4 py-2.5 text-sm font-bold text-ptba-charcoal shadow-md hover:bg-ptba-gold-light transition-colors"
          >
            <Plus className="h-4 w-4" />
            Buat Proyek
          </Link>
        )}
      </div>

      {/* KPI Strip */}
      {isEvaluator ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {[
            { label: "Proyek Perlu Dievaluasi", value: total, icon: Clock, color: "bg-ptba-steel-blue" },
            { label: "Sudah Selesai", value: selesai, icon: TrendingUp, color: "bg-ptba-green" },
          ].map((kpi) => {
            const Icon = kpi.icon;
            return (
              <div key={kpi.label} className="flex items-center gap-3 rounded-xl bg-white p-4 shadow-sm">
                <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", kpi.color)}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-ptba-gray">{kpi.label}</p>
                  <p className="text-2xl font-bold text-ptba-charcoal">{kpi.value}</p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: "Total Proyek", value: total, icon: FolderKanban, color: "bg-ptba-navy" },
            { label: "Evaluasi", value: evaluasi, icon: Clock, color: "bg-ptba-steel-blue" },
            { label: "Persetujuan", value: persetujuan, icon: CheckSquare, color: "bg-ptba-gold" },
            { label: "Selesai", value: selesai, icon: TrendingUp, color: "bg-ptba-green" },
          ].map((kpi) => {
            const Icon = kpi.icon;
            return (
              <div key={kpi.label} className="flex items-center gap-3 rounded-xl bg-white p-4 shadow-sm">
                <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", kpi.color)}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-ptba-gray">{kpi.label}</p>
                  <p className="text-2xl font-bold text-ptba-charcoal">{kpi.value}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Filter + Search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Status Tabs — hidden for evaluators (they only see Evaluasi) */}
        {!isEvaluator && (
          <div className="flex gap-1 rounded-lg border border-ptba-light-gray bg-white p-1">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  activeTab === tab
                    ? "bg-ptba-navy text-white shadow-sm"
                    : "text-ptba-gray hover:text-ptba-charcoal"
                )}
              >
                {tab}
              </button>
            ))}
          </div>
        )}

        {/* Search */}
        <div className={cn("relative", isEvaluator ? "w-full" : "w-full sm:w-64")}>
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ptba-gray" />
          <input
            type="text"
            placeholder="Cari proyek..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-ptba-light-gray bg-white py-2 pl-9 pr-4 text-sm text-ptba-charcoal placeholder-ptba-gray/60 outline-none focus:border-ptba-steel-blue focus:ring-2 focus:ring-ptba-steel-blue/20"
          />
        </div>
      </div>

      {/* Project Cards */}
      {filtered.length === 0 ? (
        <div className="rounded-xl bg-white p-12 text-center shadow-sm">
          <FolderKanban className="mx-auto h-10 w-10 text-ptba-light-gray mb-3" />
          <p className="text-ptba-gray">Tidak ada proyek ditemukan.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {filtered.map((project) => {
            const pct = Math.round((project.currentStep / project.totalSteps) * 100);
            const pi = phaseInfo(project.phase);
            const isP1 = project.phase?.startsWith("phase1");
            const isP2 = project.phase?.startsWith("phase2");
            const p1Steps = 7;
            const p2Steps = 6;
            const p1Filled = Math.min(project.currentStep, p1Steps);
            const p2Filled = Math.max(0, project.currentStep - p1Steps);

            return (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className={cn(
                  "group block rounded-xl bg-white p-5 shadow-sm transition-shadow hover:shadow-md border-l-4",
                  isP1 ? "border-l-ptba-navy" :
                  isP2 ? "border-l-ptba-steel-blue" :
                  project.phase === "completed" ? "border-l-ptba-green" :
                  "border-l-ptba-light-gray"
                )}
              >
                {/* Top row */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h3 className="font-semibold text-ptba-charcoal leading-snug group-hover:text-ptba-steel-blue transition-colors line-clamp-2">
                    {project.name}
                  </h3>
                  <span className={cn("shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium border", statusStyle(project.status))}>
                    {project.status}
                  </span>
                </div>

                {/* Type + Value + Phase */}
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", typeStyle(project.type))}>
                    {project.type}
                  </span>
                  <span className="text-sm font-semibold text-ptba-charcoal">
                    {formatCapex(project.capexValue)}
                  </span>
                  {pi && (
                    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold border", pi.color)}>
                      {pi.label}
                    </span>
                  )}
                </div>

                {/* Description */}
                <p className="text-xs text-ptba-gray leading-relaxed line-clamp-2 mb-4">
                  {project.description}
                </p>

                {/* Two-Phase Progress */}
                <div>
                  <div className="flex items-center justify-between text-xs text-ptba-gray mb-1.5">
                    <span className="flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      Langkah {project.currentStep}/{project.totalSteps}
                    </span>
                    <span className="font-medium">{pct}%</span>
                  </div>
                  <div className="flex items-center gap-0">
                    {/* Phase 1 bar */}
                    <div className="flex-1 h-1.5 overflow-hidden rounded-l-full bg-ptba-light-gray">
                      <div
                        className="h-full rounded-l-full bg-ptba-navy transition-all"
                        style={{ width: `${(p1Filled / p1Steps) * 100}%` }}
                      />
                    </div>
                    <div className="w-px h-2.5 bg-ptba-charcoal/20 mx-px" />
                    {/* Phase 2 bar */}
                    <div className="flex-1 h-1.5 overflow-hidden rounded-r-full bg-ptba-light-gray">
                      <div
                        className={cn(
                          "h-full rounded-r-full transition-all",
                          project.phase === "completed" ? "bg-ptba-green" : "bg-ptba-steel-blue"
                        )}
                        style={{ width: `${(p2Filled / p2Steps) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div className="mt-0.5 flex justify-between text-[9px] text-ptba-gray/50">
                    <span>P1</span>
                    <span>P2</span>
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-2 flex items-center justify-between text-xs text-ptba-gray border-t border-ptba-light-gray/50 pt-3">
                  <span>{project.partners.length} mitra terdaftar</span>
                  <span>{new Date(project.startDate).toLocaleDateString("id-ID", { year: "numeric", month: "short" })}</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
