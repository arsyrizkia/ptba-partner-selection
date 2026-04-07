"use client";

import { useEffect, useState } from "react";
import {
  FolderKanban,
  Users,
  CheckSquare,
  AlertCircle,
  ClipboardCheck,
  ListChecks,
  Clock,
  ArrowRight,
  CheckCircle2,
  Rocket,
  Bell,
  Info,
  AlertTriangle,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useAuth } from "@/lib/auth/auth-context";
import { api } from "@/lib/api/client";

// ── Types ────────────────────────────────────────────────────────────

interface DashboardProject {
  id: string;
  name: string;
  type: string;
  status: string;
  phase: string;
  currentStep: number;
  totalSteps: number;
  applicationCount: number;
  startDate: string;
  endDate: string;
  createdAt: string;
}

interface DashboardApproval {
  id: string;
  projectId: string;
  projectName: string;
  type: string;
  status: string;
  phase: string;
  requestedAt: string;
  approvedAt: string | null;
  notes: string | null;
}

interface EvalTask {
  applicationId: string;
  projectId: string;
  projectName: string;
  partnerId: string;
  partnerName: string;
  status: string;
  deadline: string;
  evalLink: string;
}

interface NotificationRow {
  id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "success" | "error";
  read: boolean;
  link: string | null;
  createdAt: string;
}

interface DashboardStats {
  totalProjects: number;
  activeEvaluations: number;
  pendingApprovals: number;
  completedThisMonth: number;
  projects: DashboardProject[];
  statusDistribution: { name: string; value: number }[];
  approvals: DashboardApproval[];
  evaluatorTasks: EvalTask[];
  recentNotifications: NotificationRow[];
}

interface KpiCard {
  title: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

// ── Constants ────────────────────────────────────────────────────────

const PHASE_LABELS: Record<string, string> = {
  published: "Dipublikasikan",
  phase1_registration: "Pendaftaran",
  phase1_closed: "Pendaftaran Ditutup",
  phase1_evaluation: "Evaluasi Fase 1",
  phase1_approval: "Persetujuan Fase 1",
  phase1_approved: "Fase 1 Disetujui",
  phase1_announcement: "Pengumuman Fase 1",
  phase2_registration: "Pendaftaran Fase 2",
  phase2_evaluation: "Evaluasi Fase 2",
  phase2_approval: "Persetujuan Fase 2",
  phase2_announcement: "Pengumuman",
  completed: "Selesai",
};

const TYPE_LABELS: Record<string, string> = {
  mining: "Pertambangan",
  power_generation: "Pembangkit Listrik",
  coal_processing: "Pengolahan Batubara",
  infrastructure: "Infrastruktur",
  environmental: "Lingkungan",
  corporate: "Korporat",
  others: "Lainnya",
};

const PIE_COLORS = ["#2E75B6", "#F2A900", "#666666", "#28A745", "#C8102E", "#1B3A5C"];

const NOTIF_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  info: Info,
  warning: AlertTriangle,
  success: CheckCircle2,
  error: XCircle,
};

const NOTIF_COLORS: Record<string, string> = {
  info: "text-ptba-steel-blue",
  warning: "text-ptba-orange",
  success: "text-ptba-green",
  error: "text-ptba-red",
};

// ── Helpers ──────────────────────────────────────────────────────────

function phaseLabel(phase: string) {
  return PHASE_LABELS[phase] ?? phase;
}

function typeLabel(type: string) {
  return TYPE_LABELS[type] ?? type;
}

function progress(project: DashboardProject) {
  if (!project.totalSteps) return 0;
  return Math.round((project.currentStep / project.totalSteps) * 100);
}

function statusBadge(status: string) {
  const styles: Record<string, string> = {
    Evaluasi: "bg-ptba-steel-blue/10 text-ptba-steel-blue border border-ptba-steel-blue/20",
    Persetujuan: "bg-ptba-gold/10 text-ptba-gold border border-ptba-gold/20",
    Dipublikasikan: "bg-ptba-steel-blue/10 text-ptba-steel-blue border border-ptba-steel-blue/20",
    Draft: "bg-ptba-gray/10 text-ptba-gray border border-ptba-gray/20",
    Selesai: "bg-ptba-green/10 text-ptba-green border border-ptba-green/20",
    Menunggu: "bg-ptba-gold/10 text-ptba-gold border border-ptba-gold/20",
    Disetujui: "bg-ptba-green/10 text-ptba-green border border-ptba-green/20",
    Ditolak: "bg-ptba-red/10 text-ptba-red border border-ptba-red/20",
    Dikembalikan: "bg-ptba-orange/10 text-ptba-orange border border-ptba-orange/20",
    "Dalam Proses": "bg-ptba-steel-blue/10 text-ptba-steel-blue border border-ptba-steel-blue/20",
    "Belum Dimulai": "bg-ptba-gray/10 text-ptba-gray border border-ptba-gray/20",
  };
  return styles[status] ?? "bg-ptba-gray/10 text-ptba-gray";
}

function getDivisionLabel(role: string) {
  switch (role) {
    case "keuangan": return "Corporate Finance";
    case "hukum": return "Legal & Regulatory Affairs";
    case "risiko": return "Risk Management";
    default: return "Berjalan";
  }
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Baru saja";
  if (mins < 60) return `${mins} menit lalu`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  return `${days} hari lalu`;
}

// ── Loading Skeleton ─────────────────────────────────────────────────

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-48 rounded bg-ptba-light-gray" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-28 rounded-xl bg-white shadow-sm">
            <div className="p-5 space-y-3">
              <div className="h-4 w-24 rounded bg-ptba-light-gray" />
              <div className="h-8 w-16 rounded bg-ptba-light-gray" />
            </div>
          </div>
        ))}
      </div>
      <div className="h-64 rounded-xl bg-white shadow-sm" />
    </div>
  );
}

// ── Empty State ──────────────────────────────────────────────────────

function EmptyState({ message }: { message: string }) {
  return (
    <p className="py-8 text-center text-sm text-ptba-gray">{message}</p>
  );
}

// ── KPI Grid ─────────────────────────────────────────────────────────

function KpiGrid({ kpis }: { kpis: KpiCard[] }) {
  return (
    <div className={cn("grid gap-4", kpis.length === 3 ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4")}>
      {kpis.map((kpi) => {
        const Icon = kpi.icon;
        return (
          <div key={kpi.title} className="rounded-xl bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-ptba-gray">{kpi.title}</p>
                <p className="mt-1 text-3xl font-bold text-ptba-charcoal">{kpi.value}</p>
              </div>
              <div className={cn("flex h-11 w-11 items-center justify-center rounded-lg", kpi.color)}>
                <Icon className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Notification List ────────────────────────────────────────────────

function NotificationList({ notifications }: { notifications: NotificationRow[] }) {
  if (notifications.length === 0) {
    return (
      <div className="col-span-1 rounded-xl bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-ptba-charcoal">Notifikasi Terbaru</h2>
        <EmptyState message="Belum ada notifikasi." />
      </div>
    );
  }

  return (
    <div className="col-span-1 rounded-xl bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-ptba-charcoal">Notifikasi Terbaru</h2>
      <div className="space-y-4">
        {notifications.map((notif) => {
          const Icon = NOTIF_ICONS[notif.type] ?? Bell;
          const color = NOTIF_COLORS[notif.type] ?? "text-ptba-gray";
          return (
            <div key={notif.id} className="flex items-start gap-3 rounded-lg p-2 transition-colors hover:bg-ptba-section-bg">
              <div className={cn("mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ptba-section-bg", color)}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm leading-snug text-ptba-charcoal">{notif.title}</p>
                <p className="mt-0.5 text-xs text-ptba-gray">{timeAgo(notif.createdAt)}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Status Pie Chart ─────────────────────────────────────────────────

function StatusPieChart({ data }: { data: { name: string; value: number }[] }) {
  if (data.length === 0) {
    return (
      <div className="col-span-1 rounded-xl bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-ptba-charcoal">Status Proyek</h2>
        <EmptyState message="Belum ada data status." />
      </div>
    );
  }

  return (
    <div className="col-span-1 rounded-xl bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-ptba-charcoal">Status Proyek</h2>
      <div className="flex h-64 items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={3} dataKey="value" stroke="none">
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #E8E8E8", fontSize: "13px" }} />
            <Legend verticalAlign="bottom" iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "12px" }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ── Phase1 Approved Banner (EBD / super_admin) ──────────────────────

function Phase1ApprovedBanner({ projects }: { projects: DashboardProject[] }) {
  const approved = projects.filter((p) => p.phase === "phase1_approved");
  if (approved.length === 0) return null;

  return (
    <div className="space-y-3">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-ptba-charcoal">
        <AlertCircle className="h-4 w-4 text-ptba-gold" />
        Tindakan Diperlukan
      </h2>
      {approved.map((project) => (
        <Link
          key={project.id}
          href={`/projects/${project.id}`}
          className="group flex items-center justify-between rounded-xl border border-green-200 bg-green-50 p-4 transition-shadow hover:shadow-md"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-ptba-charcoal">{project.name}</p>
              <p className="text-xs text-green-700">
                Fase 1 disetujui Ketua Tim — siap memulai Fase 2
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-ptba-navy px-3 py-1.5 text-xs font-semibold text-white transition-colors group-hover:bg-ptba-steel-blue">
            <Rocket className="h-3.5 w-3.5" />
            Mulai Fase 2
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </span>
        </Link>
      ))}
    </div>
  );
}

// ── Executive Phase1 Info Banner ────────────────────────────────────

function ExecutivePhase1InfoBanner({ projects }: { projects: DashboardProject[] }) {
  const approved = projects.filter((p) => p.phase === "phase1_approved");
  if (approved.length === 0) return null;

  return (
    <div className="space-y-3">
      {approved.map((project) => (
        <div
          key={project.id}
          className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 p-4"
        >
          <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-ptba-charcoal">{project.name}</p>
            <p className="text-xs text-green-700">
              Persetujuan Fase 1 telah diberikan — menunggu EBD memulai Fase 2
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── EXECUTIVE DASHBOARD ─────────────────────────────────────────────

function ExecutiveDashboard({ stats }: { stats: DashboardStats }) {
  const activeCount = stats.projects.filter((p) => p.status !== "Selesai" && p.status !== "Draft").length;

  const kpis: KpiCard[] = [
    { title: "Total Proyek Aktif", value: String(activeCount), icon: FolderKanban, color: "bg-ptba-steel-blue" },
    { title: "Evaluasi Berjalan", value: String(stats.activeEvaluations), icon: Users, color: "bg-ptba-gold" },
    { title: "Proyek Selesai Bulan Ini", value: String(stats.completedThisMonth), icon: CheckSquare, color: "bg-ptba-orange" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-ptba-charcoal">Dashboard Eksekutif</h1>
      <ExecutivePhase1InfoBanner projects={stats.projects} />
      <KpiGrid kpis={kpis} />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <StatusPieChart data={stats.statusDistribution} />
      </div>

      {/* Recent Approvals */}
      <div className="rounded-xl bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-ptba-charcoal">Persetujuan Terbaru</h2>
        {stats.approvals.length === 0 ? (
          <EmptyState message="Belum ada persetujuan." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ptba-light-gray text-left">
                  <th className="pb-3 pr-4 font-semibold text-ptba-gray">Proyek</th>
                  <th className="pb-3 pr-4 font-semibold text-ptba-gray">Tipe Persetujuan</th>
                  <th className="pb-3 pr-4 font-semibold text-ptba-gray">Status</th>
                  <th className="pb-3 font-semibold text-ptba-gray">Tanggal</th>
                </tr>
              </thead>
              <tbody>
                {stats.approvals.map((item) => (
                  <tr key={item.id} className="border-b border-ptba-light-gray/50 last:border-b-0">
                    <td className="py-3 pr-4 font-medium text-ptba-charcoal">{item.projectName}</td>
                    <td className="py-3 pr-4 text-ptba-gray">{item.type}</td>
                    <td className="py-3 pr-4">
                      <span className={cn("inline-block rounded-full px-2.5 py-0.5 text-xs font-medium", statusBadge(item.status))}>
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3 text-ptba-gray">
                      {new Date(item.requestedAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ── PROJECT DASHBOARD ───────────────────────────────────────────────

function ProjectDashboard({ stats }: { stats: DashboardStats }) {
  const kpis: KpiCard[] = [
    { title: "Total Proyek", value: String(stats.totalProjects), icon: FolderKanban, color: "bg-ptba-steel-blue" },
    { title: "Mitra Dalam Evaluasi", value: String(stats.activeEvaluations), icon: Users, color: "bg-ptba-gold" },
    { title: "Persetujuan Tertunda", value: String(stats.pendingApprovals), icon: CheckSquare, color: "bg-ptba-orange" },
  ];

  const activeProjects = stats.projects.filter((p) => p.status !== "Selesai");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-ptba-charcoal">Dashboard</h1>
      <Phase1ApprovedBanner projects={stats.projects} />
      <KpiGrid kpis={kpis} />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Active Projects Table */}
        <div className="col-span-1 rounded-xl bg-white p-5 shadow-sm xl:col-span-2">
          <h2 className="mb-4 text-lg font-semibold text-ptba-charcoal">Proyek Aktif</h2>
          {activeProjects.length === 0 ? (
            <EmptyState message="Belum ada proyek aktif." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-ptba-light-gray text-left">
                    <th className="pb-3 pr-4 font-semibold text-ptba-gray">Nama Proyek</th>
                    <th className="pb-3 pr-4 font-semibold text-ptba-gray">Tipe</th>
                    <th className="pb-3 pr-4 font-semibold text-ptba-gray">Fase</th>
                    <th className="pb-3 font-semibold text-ptba-gray">Progres</th>
                  </tr>
                </thead>
                <tbody>
                  {activeProjects.map((project) => {
                    const prog = progress(project);
                    return (
                      <tr key={project.id} className="border-b border-ptba-light-gray/50 last:border-b-0">
                        <td className="py-3 pr-4">
                          <Link href={`/projects/${project.id}`} className="font-medium text-ptba-charcoal hover:text-ptba-navy hover:underline">
                            {project.name}
                          </Link>
                        </td>
                        <td className="py-3 pr-4 text-ptba-gray">{typeLabel(project.type)}</td>
                        <td className="py-3 pr-4">
                          <span className={cn("inline-block rounded-full px-2.5 py-0.5 text-xs font-medium", statusBadge(project.status))}>
                            {phaseLabel(project.phase)}
                          </span>
                        </td>
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-20 overflow-hidden rounded-full bg-ptba-light-gray">
                              <div
                                className={cn(
                                  "h-full rounded-full transition-all",
                                  prog === 100 ? "bg-ptba-green" : prog >= 60 ? "bg-ptba-steel-blue" : "bg-ptba-gold"
                                )}
                                style={{ width: `${prog}%` }}
                              />
                            </div>
                            <span className="text-xs text-ptba-gray">{prog}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <StatusPieChart data={stats.statusDistribution} />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2" />
        <NotificationList notifications={stats.recentNotifications} />
      </div>
    </div>
  );
}

// ── EVALUATOR DASHBOARD ─────────────────────────────────────────────

function EvaluatorDashboard({ stats, roleValue }: { stats: DashboardStats; roleValue: string }) {
  const tasks = stats.evaluatorTasks;
  const totalTasks = tasks.length;
  const doneTasks = tasks.filter((t) => t.status === "Selesai").length;
  const notStarted = tasks.filter((t) => t.status === "Belum Dimulai").length;

  const kpis: KpiCard[] = [
    { title: "Total Tugas", value: String(totalTasks), icon: ListChecks, color: "bg-ptba-steel-blue" },
    { title: "Evaluasi Selesai", value: String(doneTasks), icon: ClipboardCheck, color: "bg-ptba-green" },
    { title: "Belum Dimulai", value: String(notStarted), icon: Clock, color: "bg-ptba-gold" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ptba-charcoal">Dashboard Evaluator</h1>
        <p className="mt-1 text-sm text-ptba-gray">Divisi {getDivisionLabel(roleValue)}</p>
      </div>

      <KpiGrid kpis={kpis} />

      {/* My Tasks Table */}
      <div className="rounded-xl bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-ptba-charcoal">Tugas Saya</h2>
        {tasks.length === 0 ? (
          <EmptyState message="Tidak ada tugas evaluasi yang ditemukan." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ptba-light-gray text-left">
                  <th className="pb-3 pr-4 font-semibold text-ptba-gray">Proyek</th>
                  <th className="pb-3 pr-4 font-semibold text-ptba-gray">Mitra</th>
                  <th className="pb-3 pr-4 font-semibold text-ptba-gray">Status</th>
                  <th className="pb-3 pr-4 font-semibold text-ptba-gray">Deadline</th>
                  <th className="pb-3 font-semibold text-ptba-gray">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => (
                  <tr key={`${task.applicationId}`} className="border-b border-ptba-light-gray/50 last:border-b-0">
                    <td className="py-3 pr-4">
                      <Link
                        href={`/projects/${task.projectId}`}
                        className="font-medium text-ptba-charcoal hover:text-ptba-navy hover:underline"
                      >
                        {task.projectName}
                      </Link>
                    </td>
                    <td className="py-3 pr-4 text-ptba-gray text-xs">{task.partnerName}</td>
                    <td className="py-3 pr-4">
                      <span className={cn("inline-block rounded-full px-2.5 py-0.5 text-xs font-medium", statusBadge(task.status))}>
                        {task.status}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-ptba-gray text-xs">
                      {task.deadline ? new Date(task.deadline).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "-"}
                    </td>
                    <td className="py-3">
                      <Link
                        href={task.evalLink}
                        className={cn(
                          "inline-flex items-center rounded px-2.5 py-1 text-xs font-medium transition-colors",
                          task.status === "Selesai"
                            ? "bg-ptba-section-bg text-ptba-navy hover:bg-ptba-navy/10"
                            : "bg-ptba-navy text-white hover:bg-ptba-navy/90"
                        )}
                      >
                        {task.status === "Selesai" ? "Lihat Hasil" : "Berjalan"}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <NotificationList notifications={stats.recentNotifications} />
    </div>
  );
}

// ── VIEWER DASHBOARD ────────────────────────────────────────────────

function ViewerDashboard({ stats }: { stats: DashboardStats }) {
  const kpis: KpiCard[] = [
    { title: "Total Proyek", value: String(stats.totalProjects), icon: FolderKanban, color: "bg-ptba-steel-blue" },
    { title: "Mitra Dalam Evaluasi", value: String(stats.activeEvaluations), icon: Users, color: "bg-ptba-gold" },
    { title: "Persetujuan Tertunda", value: String(stats.pendingApprovals), icon: CheckSquare, color: "bg-ptba-orange" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-ptba-charcoal">Dashboard (Viewer)</h1>
      <KpiGrid kpis={kpis} />

      <div className="rounded-xl bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-ptba-charcoal">Ringkasan Proyek</h2>
        {stats.projects.length === 0 ? (
          <EmptyState message="Belum ada proyek." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ptba-light-gray text-left">
                  <th className="pb-3 pr-4 font-semibold text-ptba-gray">Nama Proyek</th>
                  <th className="pb-3 pr-4 font-semibold text-ptba-gray">Tipe</th>
                  <th className="pb-3 pr-4 font-semibold text-ptba-gray">Status</th>
                  <th className="pb-3 font-semibold text-ptba-gray">Progres</th>
                </tr>
              </thead>
              <tbody>
                {stats.projects.map((project) => {
                  const prog = progress(project);
                  return (
                    <tr key={project.id} className="border-b border-ptba-light-gray/50 last:border-b-0">
                      <td className="py-3 pr-4 font-medium text-ptba-charcoal">{project.name}</td>
                      <td className="py-3 pr-4 text-ptba-gray">{typeLabel(project.type)}</td>
                      <td className="py-3 pr-4">
                        <span className={cn("inline-block rounded-full px-2.5 py-0.5 text-xs font-medium", statusBadge(project.status))}>
                          {phaseLabel(project.phase)}
                        </span>
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-20 overflow-hidden rounded-full bg-ptba-light-gray">
                            <div
                              className={cn("h-full rounded-full", prog === 100 ? "bg-ptba-green" : "bg-ptba-steel-blue")}
                              style={{ width: `${prog}%` }}
                            />
                          </div>
                          <span className="text-xs text-ptba-gray">{prog}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ── MAIN PAGE ───────────────────────────────────────────────────────

export default function DashboardPage() {
  const { role, accessToken } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchStats() {
      try {
        setLoading(true);
        setError(null);
        const data = await api<{ stats: DashboardStats }>("/dashboard/stats", { token: accessToken ?? undefined });
        if (!cancelled) {
          setStats(data.stats);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message || "Gagal memuat data dashboard");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    if (accessToken) {
      fetchStats();
    }

    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  if (loading || !stats) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-sm text-ptba-red">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 rounded-lg bg-ptba-navy px-4 py-2 text-sm text-white hover:bg-ptba-steel-blue"
        >
          Coba Lagi
        </button>
      </div>
    );
  }

  if (role === "ketua_tim") return <ExecutiveDashboard stats={stats} />;
  if (role === "keuangan" || role === "hukum" || role === "risiko") return <EvaluatorDashboard stats={stats} roleValue={role} />;
  if (role === "viewer") return <ViewerDashboard stats={stats} />;
  return <ProjectDashboard stats={stats} />;
}
