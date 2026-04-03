"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { FolderKanban, Plus, Search, TrendingUp, Clock, CheckSquare, FileText, Loader2, Trash2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useAuth } from "@/lib/auth/auth-context";
import { projectApi } from "@/lib/api/client";
import { Modal } from "@/components/ui/modal";

interface ProjectItem {
  id: string;
  name: string;
  type: string;
  status: string;
  description: string;
  startDate: string;
  currentStep: number;
  totalSteps: number;
  phase: string;
  applicationCount: number;
  createdBy: string;
}

const EVALUATOR_ROLES = ["keuangan", "hukum", "risiko"] as const;

function statusStyle(status: string) {
  switch (status) {
    case "Berjalan":   return "bg-ptba-steel-blue/10 text-ptba-steel-blue border border-ptba-steel-blue/20";
    case "Menunggu Persetujuan": return "bg-ptba-gold/10 text-ptba-gold border border-ptba-gold/20";
    case "Draft":      return "bg-ptba-gray/10 text-ptba-gray border border-ptba-gray/20";
    case "Dipublikasikan":  return "bg-teal-100 text-teal-700 border border-teal-200";
    case "Selesai":    return "bg-ptba-green/10 text-ptba-green border border-ptba-green/20";
    case "Dibatalkan": return "bg-ptba-red/10 text-ptba-red border border-ptba-red/20";
    default:           return "bg-ptba-gray/10 text-ptba-gray border border-ptba-gray/20";
  }
}

const TYPE_LABELS: Record<string, string> = {
  mining: "Pertambangan", power_generation: "Pembangkit Listrik", coal_processing: "Pengolahan Batubara",
  infrastructure: "Infrastruktur", environmental: "Lingkungan", corporate: "Korporat", others: "Lainnya",
};

function typeStyle(type: string) {
  const map: Record<string, string> = {
    mining: "bg-amber-100 text-amber-700", power_generation: "bg-ptba-navy/10 text-ptba-navy",
    coal_processing: "bg-ptba-gold/10 text-ptba-gold", infrastructure: "bg-ptba-steel-blue/10 text-ptba-steel-blue",
    environmental: "bg-green-100 text-green-700", corporate: "bg-gray-100 text-gray-600",
  };
  return map[type] ?? "bg-ptba-gray/10 text-ptba-gray";
}

function phaseInfo(phase?: string): { label: string; color: string } | null {
  if (!phase) return null;
  if (phase === "published") return null;
  if (phase === "completed") return { label: "Selesai", color: "bg-ptba-green/10 text-ptba-green border-ptba-green/20" };
  if (phase === "cancelled") return { label: "Dibatalkan", color: "bg-ptba-red/10 text-ptba-red border-ptba-red/20" };
  if (phase.startsWith("phase1")) {
    const sub: Record<string, string> = {
      phase1_registration: "PQ · Pendaftaran",
      phase1_closed: "PQ · Ditutup",
      phase1_evaluation: "PQ · Penilaian",
      phase1_approval: "PQ · Persetujuan",
      phase1_approved: "Berjalan",
      phase1_announcement: "PQ · Pengumuman",
    };
    return { label: sub[phase] ?? "Berjalan", color: "bg-ptba-navy/10 text-ptba-navy border-ptba-navy/20" };
  }
  if (phase.startsWith("phase2")) {
    const sub2: Record<string, string> = {
      phase2_registration: "FRP · Pendaftaran",
      phase2_evaluation: "FRP · Evaluasi",
      phase2_approval: "FRP · Persetujuan",
      phase2_announcement: "FRP · Pengumuman",
      phase2_approved: "FRP",
    };
    return { label: sub2[phase] ?? "PQ", color: "bg-ptba-steel-blue/10 text-ptba-steel-blue border-ptba-steel-blue/20" };
  }
  const sub3: Record<string, string> = {
    phase3_registration: "Proposal & FRP · Pendaftaran",
    phase3_evaluation: "Proposal & FRP · Evaluasi",
    phase3_ranking: "Proposal & FRP · Peringkat",
    phase3_negotiation: "Proposal & FRP · Negosiasi",
    phase3_approval: "Proposal & FRP · Persetujuan",
    phase3_announcement: "Proposal & FRP · Pengumuman",
  };
  return { label: sub3[phase] ?? "Proposal & FRP", color: "bg-ptba-gold/10 text-ptba-gold border-ptba-gold/20" };
}

const STATUS_TABS = ["Semua", "Draft", "Dipublikasikan", "Berjalan", "Menunggu Persetujuan", "Selesai"];

export default function ProjectsPage() {
  const { user, role, accessToken } = useAuth();
  const isEvaluator = EVALUATOR_ROLES.includes(role as typeof EVALUATOR_ROLES[number]);

  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!accessToken) return;
    setLoading(true);
    projectApi(accessToken).list().then((res) => {
      setProjects(res.data as unknown as ProjectItem[]);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [accessToken]);

  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const confirmDelete = async () => {
    if (!accessToken || !deleteTarget) return;
    setDeleting(true);
    try {
      await projectApi(accessToken).delete(deleteTarget.id);
      setProjects((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch {
      // keep modal open on error
    } finally {
      setDeleting(false);
    }
  };

  const canDelete = (project: ProjectItem) =>
    role === "super_admin" || project.createdBy === user?.id;

  const baseProjects = isEvaluator
    ? projects.filter((p) => p.status === "Berjalan")
    : projects;

  const [activeTab, setActiveTab] = useState("Semua");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return baseProjects.filter((p) => {
      const matchTab = activeTab === "Semua" || p.status === activeTab;
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
      return matchTab && matchSearch;
    });
  }, [baseProjects, activeTab, search]);

  const total = baseProjects.length;
  const evaluasi = baseProjects.filter((p) => p.status === "Berjalan").length;
  const persetujuan = baseProjects.filter((p) => p.status === "Menunggu Persetujuan").length;
  const selesai = baseProjects.filter((p) => p.status === "Selesai").length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-ptba-steel-blue" />
        <span className="ml-3 text-ptba-gray">Memuat proyek...</span>
      </div>
    );
  }

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
            { label: "Berjalan", value: evaluasi, icon: Clock, color: "bg-ptba-steel-blue" },
            { label: "Menunggu Persetujuan", value: persetujuan, icon: CheckSquare, color: "bg-ptba-gold" },
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
            const isP3 = project.phase?.startsWith("phase3");
            const isCompleted = project.phase === "completed";
            const p1Steps = 7;
            const p2Steps = 3;
            const p3Steps = Math.max(project.totalSteps - p1Steps - p2Steps, 3);
            const p1Filled = Math.min(project.currentStep, p1Steps);
            const p2Filled = Math.min(Math.max(0, project.currentStep - p1Steps), p2Steps);
            const p3Filled = Math.max(0, project.currentStep - p1Steps - p2Steps);

            return (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className={cn(
                  "group block rounded-xl bg-white p-5 shadow-sm transition-shadow hover:shadow-md border-l-4",
                  isCompleted ? "border-l-ptba-green" :
                  isP1 ? "border-l-ptba-navy" :
                  isP2 ? "border-l-ptba-steel-blue" :
                  isP3 ? "border-l-ptba-gold" :
                  "border-l-ptba-light-gray"
                )}
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h3 className="font-semibold text-ptba-charcoal leading-snug group-hover:text-ptba-steel-blue transition-colors line-clamp-2">
                    {project.name}
                  </h3>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium border", statusStyle(project.status))}>
                      {project.status}
                    </span>
                    {canDelete(project) && (
                      <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setDeleteTarget({ id: project.id, name: project.name }); }}
                        className="rounded-lg p-1.5 text-ptba-gray hover:bg-red-50 hover:text-ptba-red transition-colors"
                        title="Hapus proyek"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", typeStyle(project.type))}>
                    {TYPE_LABELS[project.type] || project.type}
                  </span>
                  {pi && (
                    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold border", pi.color)}>
                      {pi.label}
                    </span>
                  )}
                </div>

                {project.description && (
                  <p className="text-xs text-ptba-gray leading-relaxed line-clamp-2 mb-4">
                    {project.description.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ")}
                  </p>
                )}

                <div>
                  <div className="flex items-center justify-between text-xs text-ptba-gray mb-1.5">
                    <span className="flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      Langkah {project.currentStep}/{project.totalSteps}
                    </span>
                    <span className="font-medium">{pct}%</span>
                  </div>
                  <div className="flex items-center gap-0">
                    <div className="flex-1 h-1.5 overflow-hidden rounded-l-full bg-ptba-light-gray">
                      <div
                        className="h-full rounded-l-full bg-ptba-navy transition-all"
                        style={{ width: `${(p1Filled / p1Steps) * 100}%` }}
                      />
                    </div>
                    <div className="w-px h-2.5 bg-ptba-charcoal/20 mx-px" />
                    <div className="flex-1 h-1.5 overflow-hidden bg-ptba-light-gray">
                      <div
                        className="h-full bg-ptba-steel-blue transition-all"
                        style={{ width: `${(p2Filled / p2Steps) * 100}%` }}
                      />
                    </div>
                    <div className="w-px h-2.5 bg-ptba-charcoal/20 mx-px" />
                    <div className="flex-1 h-1.5 overflow-hidden rounded-r-full bg-ptba-light-gray">
                      <div
                        className={cn(
                          "h-full rounded-r-full transition-all",
                          project.phase === "completed" ? "bg-ptba-green" : "bg-ptba-gold"
                        )}
                        style={{ width: `${(p3Filled / p3Steps) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div className="mt-0.5 flex justify-between text-[9px] text-ptba-gray/50">
                    <span>P1</span>
                    <span>P2</span>
                    <span>P3</span>
                  </div>
                </div>

                <div className="mt-2 flex items-center justify-between text-xs text-ptba-gray border-t border-ptba-light-gray/50 pt-3">
                  <span>{project.applicationCount} mitra terdaftar</span>
                  {project.startDate && (
                    <span>{new Date(project.startDate).toLocaleDateString("id-ID", { year: "numeric", month: "short" })}</span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
      {/* Delete Confirmation Modal */}
      <Modal isOpen={!!deleteTarget} onClose={() => !deleting && setDeleteTarget(null)} title="Hapus Proyek" size="sm">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
            <AlertTriangle className="h-7 w-7 text-ptba-red" />
          </div>
          <p className="text-sm text-ptba-charcoal">
            Apakah Anda yakin ingin menghapus proyek
          </p>
          <p className="mt-1 text-sm font-semibold text-ptba-charcoal">
            &ldquo;{deleteTarget?.name}&rdquo;?
          </p>
          <p className="mt-2 text-xs text-ptba-gray">
            Tindakan ini tidak dapat dibatalkan. Semua data terkait proyek ini akan dihapus.
          </p>
          <div className="mt-6 flex gap-3">
            <button
              onClick={() => setDeleteTarget(null)}
              disabled={deleting}
              className="flex-1 rounded-lg border border-ptba-light-gray px-4 py-2.5 text-sm font-medium text-ptba-charcoal hover:bg-ptba-section-bg transition-colors disabled:opacity-50"
            >
              Batal
            </button>
            <button
              onClick={confirmDelete}
              disabled={deleting}
              className="flex-1 rounded-lg bg-ptba-red px-4 py-2.5 text-sm font-bold text-white hover:bg-ptba-red/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              {deleting ? "Menghapus..." : "Hapus Proyek"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
