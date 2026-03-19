"use client";

import {
  FolderKanban,
  Users,
  Clock,
  CheckSquare,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  FileCheck,
  UserPlus,
  FileWarning,
  ClipboardCheck,
  BarChart3,
  ListChecks,
  ArrowRight,
  CheckCircle2,
  Rocket,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useAuth } from "@/lib/auth/auth-context";
import { mockProjects } from "@/lib/mock-data/projects";
import { mockPartners } from "@/lib/mock-data/partners";
import { mockEvaluations } from "@/lib/mock-data/evaluations";

// ── Shared Types ──────────────────────────────────────────────────────

interface KpiCard {
  title: string;
  value: string;
  trend: string;
  trendUp: boolean;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

// ── Project Dashboard Data (EBD, Super Admin) ─────────────────────────

const projectKpis: KpiCard[] = [
  { title: "Total Proyek", value: "5", trend: "+12%", trendUp: true, icon: FolderKanban, color: "bg-ptba-steel-blue" },
  { title: "Mitra Dalam Evaluasi", value: "8", trend: "-5%", trendUp: false, icon: Users, color: "bg-ptba-gold" },
  { title: "Persetujuan Tertunda", value: "4", trend: "-15%", trendUp: false, icon: CheckSquare, color: "bg-ptba-orange" },
];

const activeProjects = [
  { nama: "Pengadaan Belt Conveyor", tipe: "Barang", status: "Evaluasi", langkah: "Evaluasi Teknis", progres: 65 },
  { nama: "Jasa Konsultan Tambang", tipe: "Jasa", status: "Persetujuan", langkah: "Review Legal", progres: 80 },
  { nama: "Pengadaan Alat Berat", tipe: "Barang", status: "Draft", langkah: "Penyusunan HPS", progres: 20 },
  { nama: "Rehabilitasi Jalan Hauling", tipe: "Konstruksi", status: "Evaluasi", langkah: "Evaluasi Keuangan", progres: 55 },
  { nama: "Sistem Monitoring Lingkungan", tipe: "Jasa", status: "Selesai", langkah: "Penandatanganan", progres: 100 },
];

const pieData = [
  { name: "Evaluasi", value: 2 },
  { name: "Persetujuan", value: 1 },
  { name: "Draft", value: 1 },
  { name: "Selesai", value: 1 },
];
const PIE_COLORS = ["#2E75B6", "#F2A900", "#666666", "#28A745"];

const barData = [
  { bulan: "Okt", evaluasi: 4 },
  { bulan: "Nov", evaluasi: 6 },
  { bulan: "Des", evaluasi: 3 },
  { bulan: "Jan", evaluasi: 7 },
  { bulan: "Feb", evaluasi: 5 },
  { bulan: "Mar", evaluasi: 8 },
];

const notifications = [
  { icon: FileCheck, title: "Dokumen HPS disetujui - Alat Berat", time: "1 jam lalu", color: "text-ptba-green" },
  { icon: UserPlus, title: "Mitra baru terdaftar: PT Sinar Jaya", time: "2 jam lalu", color: "text-ptba-steel-blue" },
  { icon: FileWarning, title: "Dokumen kualifikasi belum lengkap - Jalan Hauling", time: "3 jam lalu", color: "text-ptba-orange" },
  { icon: ClipboardCheck, title: "Evaluasi keuangan selesai - Konsultan Tambang", time: "5 jam lalu", color: "text-ptba-green" },
];

// ── Executive Dashboard Data (Direksi) ─────────────────────────────

const executiveKpis: KpiCard[] = [
  { title: "Total Proyek Aktif", value: "4", trend: "+8%", trendUp: true, icon: FolderKanban, color: "bg-ptba-steel-blue" },
  { title: "Evaluasi Berjalan", value: "3", trend: "+20%", trendUp: true, icon: BarChart3, color: "bg-ptba-gold" },
  { title: "Proyek Selesai Bulan Ini", value: "1", trend: "0%", trendUp: true, icon: CheckSquare, color: "bg-ptba-orange" },
];

const recentApprovals = [
  { proyek: "Jasa Konsultan Tambang", tipe: "Evaluasi Akhir", status: "Menunggu", tanggal: "28 Feb 2026" },
  { proyek: "Pengadaan Belt Conveyor", tipe: "Persetujuan Teknis", status: "Menunggu", tanggal: "25 Feb 2026" },
  { proyek: "Pengadaan Alat Berat", tipe: "Persetujuan HPS", status: "Disetujui", tanggal: "20 Feb 2026" },
];

// ── Evaluator Dashboard Data (Keuangan, Hukum, Risiko) ────────────

const evaluatorKpis: KpiCard[] = [
  { title: "Evaluasi Ditugaskan", value: "6", trend: "+2", trendUp: true, icon: ListChecks, color: "bg-ptba-steel-blue" },
  { title: "Evaluasi Selesai", value: "4", trend: "+1", trendUp: true, icon: ClipboardCheck, color: "bg-ptba-green" },
  { title: "Rata-rata Waktu Evaluasi", value: "3,2 hari", trend: "-0.5", trendUp: true, icon: Clock, color: "bg-ptba-gold" },
];

const myTasks = [
  { proyek: "Pengadaan Belt Conveyor", mitra: "PT Sinar Jaya", status: "Dalam Proses", deadline: "05 Mar 2026", progres: 60 },
  { proyek: "Pengadaan Belt Conveyor", mitra: "PT Bara Energi", status: "Dalam Proses", deadline: "05 Mar 2026", progres: 40 },
  { proyek: "Jasa Konsultan Tambang", mitra: "PT Konsulindo", status: "Belum Dimulai", deadline: "10 Mar 2026", progres: 0 },
  { proyek: "Rehabilitasi Jalan Hauling", mitra: "PT Maju Bersama", status: "Selesai", deadline: "28 Feb 2026", progres: 100 },
  { proyek: "Rehabilitasi Jalan Hauling", mitra: "PT Jalan Mandiri", status: "Selesai", deadline: "28 Feb 2026", progres: 100 },
  { proyek: "Pengadaan Alat Berat", mitra: "PT Heavy Equipment", status: "Belum Dimulai", deadline: "15 Mar 2026", progres: 0 },
];

// ── Helpers ─────────────────────────────────────────────────────────

function statusBadge(status: string) {
  const styles: Record<string, string> = {
    Evaluasi: "bg-ptba-steel-blue/10 text-ptba-steel-blue border border-ptba-steel-blue/20",
    Persetujuan: "bg-ptba-gold/10 text-ptba-gold border border-ptba-gold/20",
    Draft: "bg-ptba-gray/10 text-ptba-gray border border-ptba-gray/20",
    Selesai: "bg-ptba-green/10 text-ptba-green border border-ptba-green/20",
    Menunggu: "bg-ptba-gold/10 text-ptba-gold border border-ptba-gold/20",
    Disetujui: "bg-ptba-green/10 text-ptba-green border border-ptba-green/20",
    "Dalam Proses": "bg-ptba-steel-blue/10 text-ptba-steel-blue border border-ptba-steel-blue/20",
    "Belum Dimulai": "bg-ptba-gray/10 text-ptba-gray border border-ptba-gray/20",
  };
  return styles[status] ?? "bg-ptba-gray/10 text-ptba-gray";
}

function getDivisionLabel(role: string) {
  switch (role) {
    case "keuangan": return "Keuangan (KEP-100)";
    case "hukum": return "Hukum & Regulasi";
    case "risiko": return "Manajemen Risiko";
    default: return "Evaluasi";
  }
}

// ── KPI Grid Component ──────────────────────────────────────────────

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
            <div className="mt-3 flex items-center gap-1">
              {kpi.trendUp ? (
                <TrendingUp className="h-4 w-4 text-ptba-green" />
              ) : (
                <TrendingDown className="h-4 w-4 text-ptba-red" />
              )}
              <span className={cn("text-sm font-medium", kpi.trendUp ? "text-ptba-green" : "text-ptba-red")}>{kpi.trend}</span>
              <span className="text-xs text-ptba-gray">dari bulan lalu</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Notification List Component ─────────────────────────────────────

function NotificationList() {
  return (
    <div className="col-span-1 rounded-xl bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-ptba-charcoal">Notifikasi Terbaru</h2>
      <div className="space-y-4">
        {notifications.map((notif, idx) => {
          const Icon = notif.icon;
          return (
            <div key={idx} className="flex items-start gap-3 rounded-lg p-2 transition-colors hover:bg-ptba-section-bg">
              <div className={cn("mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ptba-section-bg", notif.color)}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm leading-snug text-ptba-charcoal">{notif.title}</p>
                <p className="mt-0.5 text-xs text-ptba-gray">{notif.time}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── EXECUTIVE DASHBOARD ─────────────────────────────────────────────

function ExecutivePhase1InfoBanner() {
  const approvedProjects = mockProjects.filter((p) => p.phase === "phase1_approved");
  if (approvedProjects.length === 0) return null;

  return (
    <div className="space-y-3">
      {approvedProjects.map((project) => (
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

function ExecutiveDashboard() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-ptba-charcoal">Dashboard Eksekutif</h1>
      <ExecutivePhase1InfoBanner />
      <KpiGrid kpis={executiveKpis} />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Project Status Pie */}
        <div className="col-span-1 rounded-xl bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-ptba-charcoal">Status Proyek</h2>
          <div className="flex h-64 items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={3} dataKey="value" stroke="none">
                  {pieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #E8E8E8", fontSize: "13px" }} />
                <Legend verticalAlign="bottom" iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "12px" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Approvals */}
      <div className="rounded-xl bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-ptba-charcoal">Persetujuan Terbaru</h2>
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
              {recentApprovals.map((item, idx) => (
                <tr key={idx} className="border-b border-ptba-light-gray/50 last:border-b-0">
                  <td className="py-3 pr-4 font-medium text-ptba-charcoal">{item.proyek}</td>
                  <td className="py-3 pr-4 text-ptba-gray">{item.tipe}</td>
                  <td className="py-3 pr-4">
                    <span className={cn("inline-block rounded-full px-2.5 py-0.5 text-xs font-medium", statusBadge(item.status))}>
                      {item.status}
                    </span>
                  </td>
                  <td className="py-3 text-ptba-gray">{item.tanggal}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── PROJECT DASHBOARD ───────────────────────────────────────────────

function Phase1ApprovedBanner() {
  const approvedProjects = mockProjects.filter((p) => p.phase === "phase1_approved");
  if (approvedProjects.length === 0) return null;

  return (
    <div className="space-y-3">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-ptba-charcoal">
        <AlertCircle className="h-4 w-4 text-ptba-gold" />
        Tindakan Diperlukan
      </h2>
      {approvedProjects.map((project) => (
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
                Fase 1 disetujui Direksi — {project.shortlistedPartners?.length ?? 0} mitra lolos, siap memulai Fase 2
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

function ProjectDashboard() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-ptba-charcoal">Dashboard</h1>
      <Phase1ApprovedBanner />
      <KpiGrid kpis={projectKpis} />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Active Projects Table */}
        <div className="col-span-1 rounded-xl bg-white p-5 shadow-sm xl:col-span-2">
          <h2 className="mb-4 text-lg font-semibold text-ptba-charcoal">Proyek Aktif</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ptba-light-gray text-left">
                  <th className="pb-3 pr-4 font-semibold text-ptba-gray">Nama Proyek</th>
                  <th className="pb-3 pr-4 font-semibold text-ptba-gray">Tipe</th>
                  <th className="pb-3 pr-4 font-semibold text-ptba-gray">Status</th>
                  <th className="pb-3 pr-4 font-semibold text-ptba-gray">Langkah</th>
                  <th className="pb-3 font-semibold text-ptba-gray">Progres</th>
                </tr>
              </thead>
              <tbody>
                {activeProjects.map((project, idx) => (
                  <tr key={idx} className="border-b border-ptba-light-gray/50 last:border-b-0">
                    <td className="py-3 pr-4 font-medium text-ptba-charcoal">{project.nama}</td>
                    <td className="py-3 pr-4 text-ptba-gray">{project.tipe}</td>
                    <td className="py-3 pr-4">
                      <span className={cn("inline-block rounded-full px-2.5 py-0.5 text-xs font-medium", statusBadge(project.status))}>
                        {project.status}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-ptba-gray">{project.langkah}</td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-20 overflow-hidden rounded-full bg-ptba-light-gray">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all",
                              project.progres === 100 ? "bg-ptba-green" : project.progres >= 60 ? "bg-ptba-steel-blue" : "bg-ptba-gold"
                            )}
                            style={{ width: `${project.progres}%` }}
                          />
                        </div>
                        <span className="text-xs text-ptba-gray">{project.progres}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Status Pie Chart */}
        <div className="col-span-1 rounded-xl bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-ptba-charcoal">Status Proyek</h2>
          <div className="flex h-64 items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={3} dataKey="value" stroke="none">
                  {pieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #E8E8E8", fontSize: "13px" }} />
                <Legend verticalAlign="bottom" iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "12px" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Monthly Bar Chart */}
        <div className="col-span-1 rounded-xl bg-white p-5 shadow-sm xl:col-span-2">
          <h2 className="mb-4 text-lg font-semibold text-ptba-charcoal">Evaluasi Bulanan</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E8E8E8" />
                <XAxis dataKey="bulan" tick={{ fill: "#666666", fontSize: 12 }} axisLine={{ stroke: "#E8E8E8" }} />
                <YAxis tick={{ fill: "#666666", fontSize: 12 }} axisLine={{ stroke: "#E8E8E8" }} />
                <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #E8E8E8", fontSize: "13px" }} />
                <Legend wrapperStyle={{ fontSize: "12px" }} iconType="square" iconSize={10} />
                <Bar dataKey="evaluasi" name="Evaluasi" fill="#2E75B6" radius={[4, 4, 0, 0]} barSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <NotificationList />
      </div>
    </div>
  );
}

// ── EVALUATOR DASHBOARD ─────────────────────────────────────────────

function buildEvaluatorTasks(roleValue: string) {
  // Gather all projects that have partners needing eval for this role
  const tasks: {
    projectId: string;
    projectName: string;
    partnerId: string;
    partnerName: string;
    status: string;
    deadline: string;
    evalLink: string;
  }[] = [];

  for (const project of mockProjects) {
    if (project.status === "Draft" || project.status === "Selesai") continue;
    for (const partnerId of project.partners) {
      const partner = mockPartners.find((p) => p.id === partnerId);
      const eval0 = mockEvaluations.find(
        (e) => e.projectId === project.id && e.partnerId === partnerId
      );

      const base = `/projects/${project.id}/evaluation`;
      let evalLink = base;
      let evalDone = false;

      if (roleValue === "keuangan") {
        evalLink = `${base}/financial?partnerId=${partnerId}`;
        evalDone = !!eval0?.financial;
      } else if (roleValue === "hukum") {
        evalLink = `${base}/legal?partnerId=${partnerId}`;
        evalDone = !!eval0?.legal;
      } else if (roleValue === "risiko") {
        evalLink = `${base}/risk?partnerId=${partnerId}`;
        evalDone = !!eval0?.risk;
      }

      const status = evalDone ? "Selesai" : eval0 ? "Dalam Proses" : "Belum Dimulai";

      // Deadline: use project endDate formatted nicely
      const deadline = new Date(project.endDate).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });

      tasks.push({
        projectId: project.id,
        projectName: project.name,
        partnerId,
        partnerName: partner?.name ?? partnerId,
        status,
        deadline,
        evalLink,
      });
    }
  }

  return tasks;
}

function EvaluatorDashboard({ roleValue }: { roleValue: string }) {
  const tasks = buildEvaluatorTasks(roleValue);
  const totalTasks = tasks.length;
  const doneTasks = tasks.filter((t) => t.status === "Selesai").length;

  const dynamicKpis: KpiCard[] = [
    { title: "Total Tugas", value: String(totalTasks), trend: `${totalTasks} mitra`, trendUp: true, icon: ListChecks, color: "bg-ptba-steel-blue" },
    { title: "Evaluasi Selesai", value: String(doneTasks), trend: `${doneTasks}/${totalTasks}`, trendUp: true, icon: ClipboardCheck, color: "bg-ptba-green" },
    { title: "Belum Dimulai", value: String(tasks.filter((t) => t.status === "Belum Dimulai").length), trend: "tertunda", trendUp: false, icon: Clock, color: "bg-ptba-gold" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ptba-charcoal">Dashboard Evaluator</h1>
        <p className="mt-1 text-sm text-ptba-gray">Divisi {getDivisionLabel(roleValue)}</p>
      </div>

      <KpiGrid kpis={dynamicKpis} />

      {/* My Tasks Table */}
      <div className="rounded-xl bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-ptba-charcoal">Tugas Saya</h2>
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
              {tasks.map((task, idx) => (
                <tr key={idx} className="border-b border-ptba-light-gray/50 last:border-b-0">
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
                  <td className="py-3 pr-4 text-ptba-gray text-xs">{task.deadline}</td>
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
                      {task.status === "Selesai" ? "Lihat Hasil" : "Evaluasi"}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {tasks.length === 0 && (
          <p className="py-8 text-center text-sm text-ptba-gray">
            Tidak ada tugas evaluasi yang ditemukan.
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Bar Chart */}
        <div className="col-span-1 rounded-xl bg-white p-5 shadow-sm xl:col-span-2">
          <h2 className="mb-4 text-lg font-semibold text-ptba-charcoal">Evaluasi Selesai per Bulan</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E8E8E8" />
                <XAxis dataKey="bulan" tick={{ fill: "#666666", fontSize: 12 }} axisLine={{ stroke: "#E8E8E8" }} />
                <YAxis tick={{ fill: "#666666", fontSize: 12 }} axisLine={{ stroke: "#E8E8E8" }} />
                <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #E8E8E8", fontSize: "13px" }} />
                <Bar dataKey="evaluasi" name="Evaluasi Selesai" fill="#28A745" radius={[4, 4, 0, 0]} barSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <NotificationList />
      </div>
    </div>
  );
}

// ── VIEWER DASHBOARD ────────────────────────────────────────────────

function ViewerDashboard() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-ptba-charcoal">Dashboard (Viewer)</h1>
      <KpiGrid kpis={projectKpis} />

      <div className="rounded-xl bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-ptba-charcoal">Ringkasan Proyek</h2>
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
              {activeProjects.map((project, idx) => (
                <tr key={idx} className="border-b border-ptba-light-gray/50 last:border-b-0">
                  <td className="py-3 pr-4 font-medium text-ptba-charcoal">{project.nama}</td>
                  <td className="py-3 pr-4 text-ptba-gray">{project.tipe}</td>
                  <td className="py-3 pr-4">
                    <span className={cn("inline-block rounded-full px-2.5 py-0.5 text-xs font-medium", statusBadge(project.status))}>
                      {project.status}
                    </span>
                  </td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-20 overflow-hidden rounded-full bg-ptba-light-gray">
                        <div
                          className={cn("h-full rounded-full", project.progres === 100 ? "bg-ptba-green" : "bg-ptba-steel-blue")}
                          style={{ width: `${project.progres}%` }}
                        />
                      </div>
                      <span className="text-xs text-ptba-gray">{project.progres}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── MAIN PAGE ───────────────────────────────────────────────────────

export default function DashboardPage() {
  const { role } = useAuth();

  if (role === "direksi") return <ExecutiveDashboard />;
  if (role === "keuangan" || role === "hukum" || role === "risiko") return <EvaluatorDashboard roleValue={role} />;
  if (role === "viewer") return <ViewerDashboard />;
  // super_admin, ebd — Project Dashboard
  return <ProjectDashboard />;
}
