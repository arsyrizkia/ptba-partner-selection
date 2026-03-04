"use client";

import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { KpiCard } from "@/components/ui/kpi-card";
import { mockSLAItems, dashboardStats } from "@/lib/mock-data";
import { formatDate } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import type { SLAItem } from "@/lib/types";
import {
  Clock,
  CheckCircle,
  Activity,
  AlertTriangle,
  Settings,
  ChevronDown,
  ChevronUp,
  Save,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const STEP_NAMES = [
  "Pembuatan Proyek",
  "Pendaftaran Mitra",
  "Upload Dokumen",
  "Penutupan Pendaftaran",
  "Evaluasi Mitra",
  "Persetujuan Penunjukan",
  "Penunjukan Mitra",
  "Kontrak",
];

const DEFAULT_SLA_TARGETS: Record<string, number> = {
  "Pembuatan Proyek": 7,
  "Pendaftaran Mitra": 21,
  "Upload Dokumen": 14,
  "Penutupan Pendaftaran": 3,
  "Evaluasi Mitra": 21,
  "Persetujuan Penunjukan": 7,
  "Penunjukan Mitra": 7,
  Kontrak: 14,
};

type StatusFilter = "Semua" | "Tepat Waktu" | "Dalam Proses" | "Terlambat";

function getStatusBadgeVariant(status: SLAItem["status"]) {
  switch (status) {
    case "Tepat Waktu":
      return "success" as const;
    case "Terlambat":
      return "error" as const;
    case "Dalam Proses":
      return "warning" as const;
  }
}

function mapProcessToStage(processName: string): string | null {
  const lower = processName.toLowerCase();
  if (lower.includes("upload") || lower.includes("dokumen mitra"))
    return "Upload Dokumen";
  if (lower.includes("pendaftaran"))
    return "Pendaftaran Mitra";
  if (lower.includes("penutupan"))
    return "Penutupan Pendaftaran";
  if (lower.includes("evaluasi"))
    return "Evaluasi Mitra";
  if (lower.includes("persetujuan"))
    return "Persetujuan Penunjukan";
  if (lower.includes("penunjukan"))
    return "Penunjukan Mitra";
  if (lower.includes("kontrak"))
    return "Kontrak";
  if (lower.includes("pembuatan") || lower.includes("inisiasi"))
    return "Pembuatan Proyek";
  return null;
}

type SLARow = SLAItem & Record<string, unknown>;

export default function SLAPage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("Semua");
  const [projectFilter, setProjectFilter] = useState<string>("Semua");
  const [stageFilter, setStageFilter] = useState<string>("Semua");
  const [showConfig, setShowConfig] = useState(false);
  const [slaTargets, setSlaTargets] = useState<Record<string, number>>(
    () => ({ ...DEFAULT_SLA_TARGETS })
  );

  const uniqueProjects = useMemo(
    () => [...new Set(mockSLAItems.map((s) => s.projectName))],
    []
  );

  const filteredItems = useMemo(() => {
    return mockSLAItems.filter((item) => {
      if (statusFilter !== "Semua" && item.status !== statusFilter) return false;
      if (projectFilter !== "Semua" && item.projectName !== projectFilter)
        return false;
      if (stageFilter !== "Semua") {
        const stage = mapProcessToStage(item.processName);
        if (stage !== stageFilter) return false;
      }
      return true;
    });
  }, [statusFilter, projectFilter, stageFilter]);

  // KPI calculations based on filtered data
  const onTimeRate = useMemo(() => {
    const completed = filteredItems.filter(
      (s) => s.status === "Tepat Waktu" || s.status === "Terlambat"
    );
    if (completed.length === 0) return dashboardStats.slaCompliance;
    const onTime = completed.filter((s) => s.status === "Tepat Waktu").length;
    return Math.round((onTime / completed.length) * 1000) / 10;
  }, [filteredItems]);

  const avgProcessDays = useMemo(() => {
    const completed = filteredItems.filter(
      (s) => s.status === "Tepat Waktu" || s.status === "Terlambat"
    );
    if (completed.length === 0) return 0;
    const total = completed.reduce((sum, s) => sum + s.actualDays, 0);
    return Math.round((total / completed.length) * 10) / 10;
  }, [filteredItems]);

  const lateCount = useMemo(
    () => filteredItems.filter((s) => s.status === "Terlambat").length,
    [filteredItems]
  );

  const inProgressCount = useMemo(
    () => filteredItems.filter((s) => s.status === "Dalam Proses").length,
    [filteredItems]
  );

  const onTimeCount = useMemo(
    () => mockSLAItems.filter((s) => s.status === "Tepat Waktu").length,
    []
  );

  const totalLateCount = useMemo(
    () => mockSLAItems.filter((s) => s.status === "Terlambat").length,
    []
  );

  // Stage pipeline data
  const stageCounts = useMemo(() => {
    const counts: Record<string, { total: number; onTime: number; late: number; inProgress: number }> = {};
    STEP_NAMES.forEach((name) => {
      counts[name] = { total: 0, onTime: 0, late: 0, inProgress: 0 };
    });
    mockSLAItems.forEach((item) => {
      const stage = mapProcessToStage(item.processName);
      if (stage && counts[stage]) {
        counts[stage].total++;
        if (item.status === "Tepat Waktu") counts[stage].onTime++;
        else if (item.status === "Terlambat") counts[stage].late++;
        else counts[stage].inProgress++;
      }
    });
    return counts;
  }, []);

  const slaComplianceData = [
    { name: "Okt", tepatWaktu: 3, terlambat: 0 },
    { name: "Nov", tepatWaktu: 2, terlambat: 1 },
    { name: "Des", tepatWaktu: 4, terlambat: 0 },
    { name: "Jan", tepatWaktu: 2, terlambat: 2 },
    { name: "Feb", tepatWaktu: 3, terlambat: 1 },
    { name: "Mar", tepatWaktu: onTimeCount, terlambat: totalLateCount },
  ];

  const handleSaveConfig = () => {
    alert("Konfigurasi SLA berhasil disimpan!");
  };

  const handleStageClick = (stageName: string) => {
    if (stageFilter === stageName) {
      setStageFilter("Semua");
    } else {
      setStageFilter(stageName);
    }
  };

  const columns = [
    {
      key: "processName",
      label: "Proses",
      sortable: true,
      render: (item: SLARow) => (
        <span className="font-medium text-ptba-charcoal">
          {item.processName}
        </span>
      ),
    },
    {
      key: "projectName",
      label: "Proyek",
      sortable: true,
    },
    {
      key: "targetDays",
      label: "Target (hari)",
      sortable: true,
      render: (item: SLARow) => (
        <span className="text-ptba-charcoal">{item.targetDays}</span>
      ),
    },
    {
      key: "actualDays",
      label: "Aktual (hari)",
      sortable: true,
      render: (item: SLARow) => (
        <span className="text-ptba-charcoal">{item.actualDays}</span>
      ),
    },
    {
      key: "progress",
      label: "Progress",
      render: (item: SLARow) => {
        const pct = Math.min(
          ((item.actualDays as number) / (item.targetDays as number)) * 100,
          150
        );
        const isOver = (item.actualDays as number) > (item.targetDays as number);
        return (
          <div className="flex items-center gap-2 min-w-[120px]">
            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  isOver
                    ? "bg-red-500"
                    : pct > 80
                      ? "bg-amber-500"
                      : "bg-green-500"
                )}
                style={{ width: `${Math.min(pct, 100)}%` }}
              />
            </div>
            <span
              className={cn(
                "text-xs font-medium whitespace-nowrap",
                isOver ? "text-red-600" : "text-ptba-gray"
              )}
            >
              {Math.round(pct)}%
            </span>
          </div>
        );
      },
    },
    {
      key: "status",
      label: "Status",
      render: (item: SLARow) => (
        <Badge variant={getStatusBadgeVariant(item.status as SLAItem["status"])}>
          {item.status as string}
        </Badge>
      ),
    },
    {
      key: "startDate",
      label: "Tanggal Mulai",
      render: (item: SLARow) => (
        <span>{formatDate(item.startDate as string)}</span>
      ),
    },
    {
      key: "dueDate",
      label: "Batas Waktu",
      render: (item: SLARow) => (
        <span>{formatDate(item.dueDate as string)}</span>
      ),
    },
  ];

  const statusTabs: StatusFilter[] = [
    "Semua",
    "Tepat Waktu",
    "Dalam Proses",
    "Terlambat",
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-ptba-charcoal">SLA Monitoring</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Tingkat Tepat Waktu"
          value={`${onTimeRate}%`}
          trend={dashboardStats.slaTrend}
          icon={CheckCircle}
          trendLabel="dari bulan lalu"
        />
        <KpiCard
          title="Rata-rata Waktu Proses"
          value={`${avgProcessDays} hari`}
          trend={-8}
          icon={Clock}
          trendLabel="dari bulan lalu"
        />
        <KpiCard
          title="Proses Terlambat"
          value={`${lateCount}`}
          trend={lateCount > 0 ? 5 : -10}
          icon={AlertTriangle}
          trendLabel="dari bulan lalu"
        />
        <KpiCard
          title="Proses Dalam Proses"
          value={`${inProgressCount}`}
          trend={12}
          icon={Activity}
          trendLabel="dari bulan lalu"
        />
      </div>

      {/* Filter Bar */}
      <Card padding="md">
        <div className="space-y-4">
          {/* Status Tabs */}
          <div className="flex flex-wrap gap-2">
            {statusTabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                  statusFilter === tab
                    ? "bg-ptba-navy text-white"
                    : "bg-ptba-section-bg text-ptba-charcoal hover:bg-ptba-light-gray"
                )}
              >
                {tab}
                {tab === "Terlambat" && totalLateCount > 0 && (
                  <span className="ml-1.5 inline-flex items-center justify-center h-5 w-5 rounded-full bg-red-500 text-white text-xs">
                    {totalLateCount}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Dropdowns */}
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-ptba-gray">
                Proyek:
              </label>
              <select
                value={projectFilter}
                onChange={(e) => setProjectFilter(e.target.value)}
                className="rounded-lg border border-ptba-light-gray bg-white px-3 py-2 text-sm text-ptba-charcoal focus:outline-none focus:ring-2 focus:ring-ptba-steel-blue"
              >
                <option value="Semua">Semua Proyek</option>
                {uniqueProjects.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-ptba-gray">
                Proses:
              </label>
              <select
                value={stageFilter}
                onChange={(e) => setStageFilter(e.target.value)}
                className="rounded-lg border border-ptba-light-gray bg-white px-3 py-2 text-sm text-ptba-charcoal focus:outline-none focus:ring-2 focus:ring-ptba-steel-blue"
              >
                <option value="Semua">Semua Tahap</option>
                {STEP_NAMES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => setShowConfig(!showConfig)}
              className={cn(
                "ml-auto flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                showConfig
                  ? "bg-ptba-navy text-white"
                  : "bg-ptba-section-bg text-ptba-charcoal hover:bg-ptba-light-gray"
              )}
            >
              <Settings className="h-4 w-4" />
              Konfigurasi SLA
              {showConfig ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </Card>

      {/* SLA Configuration Panel */}
      {showConfig && (
        <Card padding="md">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-ptba-charcoal">
              Konfigurasi Target SLA per Tahap
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {STEP_NAMES.map((step, idx) => (
                <div
                  key={step}
                  className="flex items-center gap-3 rounded-lg border border-ptba-light-gray bg-ptba-off-white px-3 py-2"
                >
                  <span className="flex-shrink-0 flex items-center justify-center h-6 w-6 rounded-full bg-ptba-navy text-white text-xs font-bold">
                    {idx + 1}
                  </span>
                  <span className="flex-1 text-sm text-ptba-charcoal truncate" title={step}>
                    {step}
                  </span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={1}
                      max={90}
                      value={slaTargets[step]}
                      onChange={(e) =>
                        setSlaTargets((prev) => ({
                          ...prev,
                          [step]: parseInt(e.target.value) || 1,
                        }))
                      }
                      className="w-14 rounded border border-ptba-light-gray px-2 py-1 text-sm text-center text-ptba-charcoal focus:outline-none focus:ring-2 focus:ring-ptba-steel-blue"
                    />
                    <span className="text-xs text-ptba-gray">hari</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-end">
              <button
                onClick={handleSaveConfig}
                className="flex items-center gap-2 px-5 py-2 bg-ptba-navy text-white rounded-lg text-sm font-medium hover:bg-ptba-navy/90 transition-colors"
              >
                <Save className="h-4 w-4" />
                Simpan Konfigurasi
              </button>
            </div>
          </div>
        </Card>
      )}

      {/* Stage Pipeline Visual */}
      <Card padding="md">
        <h3 className="text-lg font-semibold text-ptba-charcoal mb-4">
          Pipeline Tahapan Proyek
        </h3>
        <div className="overflow-x-auto pb-2">
          <div className="flex items-stretch gap-1 min-w-[640px]">
            {STEP_NAMES.map((step, idx) => {
              const data = stageCounts[step];
              const isActive = stageFilter === step;
              let bgColor = "bg-gray-100 border-gray-300";
              let textColor = "text-ptba-gray";

              if (data.total > 0) {
                if (data.late > 0) {
                  bgColor = "bg-red-50 border-red-400";
                  textColor = "text-red-700";
                } else if (data.inProgress > 0) {
                  bgColor = "bg-amber-50 border-amber-400";
                  textColor = "text-amber-700";
                } else {
                  bgColor = "bg-green-50 border-green-400";
                  textColor = "text-green-700";
                }
              }

              return (
                <button
                  key={step}
                  onClick={() => handleStageClick(step)}
                  className={cn(
                    "flex-1 relative flex flex-col items-center justify-center px-2 py-3 rounded-lg border-2 transition-all text-center min-w-[70px]",
                    bgColor,
                    isActive && "ring-2 ring-ptba-navy ring-offset-1 scale-105",
                    "hover:scale-105 hover:shadow-md"
                  )}
                >
                  <span className="text-[10px] font-bold text-ptba-navy mb-0.5">
                    {idx + 1}
                  </span>
                  <span
                    className={cn("text-[10px] leading-tight font-medium", textColor)}
                    title={step}
                  >
                    {step.length > 14 ? step.slice(0, 12) + "..." : step}
                  </span>
                  <span
                    className={cn("text-lg font-bold mt-1", textColor)}
                  >
                    {data.total}
                  </span>
                  {/* Connector arrow */}
                  {idx < STEP_NAMES.length - 1 && (
                    <div className="absolute -right-2 top-1/2 -translate-y-1/2 text-ptba-gray z-10">
                      <svg width="10" height="14" viewBox="0 0 10 14">
                        <path
                          d="M1 1 L8 7 L1 13"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                        />
                      </svg>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
        {stageFilter !== "Semua" && (
          <div className="mt-3 flex items-center gap-2">
            <Badge variant="info">{stageFilter}</Badge>
            <button
              onClick={() => setStageFilter("Semua")}
              className="text-xs text-ptba-steel-blue hover:underline"
            >
              Hapus filter tahap
            </button>
          </div>
        )}
      </Card>

      {/* SLA Table */}
      <Card padding="md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-ptba-charcoal">
            Detail SLA per Proses
          </h3>
          <span className="text-sm text-ptba-gray">
            {filteredItems.length} dari {mockSLAItems.length} proses
          </span>
        </div>
        <DataTable
          columns={columns}
          data={
            filteredItems.map((item) => ({
              ...item,
              _isLate: item.status === "Terlambat",
            })) as SLARow[]
          }
        />
      </Card>

      {/* SLA Compliance Bar Chart */}
      <Card padding="md">
        <h3 className="text-lg font-semibold text-ptba-charcoal mb-4">
          Kepatuhan SLA Bulanan
        </h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={slaComplianceData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="name"
                tick={{ fill: "#1A1A1A", fontSize: 12 }}
                axisLine={{ stroke: "#d1d5db" }}
              />
              <YAxis
                tick={{ fill: "#1A1A1A", fontSize: 12 }}
                axisLine={{ stroke: "#d1d5db" }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                }}
                labelStyle={{ color: "#1B3A5C", fontWeight: 600 }}
              />
              <Legend
                wrapperStyle={{ fontSize: 12 }}
                iconType="circle"
              />
              <Bar
                dataKey="tepatWaktu"
                name="Tepat Waktu"
                fill="#28A745"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="terlambat"
                name="Terlambat"
                fill="#DC3545"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
