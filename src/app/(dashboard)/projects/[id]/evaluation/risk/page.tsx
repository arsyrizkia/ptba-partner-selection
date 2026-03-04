"use client";

import { use, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronRight, ChevronDown, Plus, Trash2, Upload, FileText } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import HeatMap from "@/components/charts/heat-map";
import { RiskRegisterTable } from "@/components/features/evaluation/risk-register-table";
import { mockEvaluations } from "@/lib/mock-data";
import { mockProjects } from "@/lib/mock-data/projects";
import { mockPartners } from "@/lib/mock-data/partners";
import { getRiskColor, getRiskLevel } from "@/lib/utils/risk-level";
import type { RiskItem } from "@/lib/types";
import { cn } from "@/lib/utils/cn";
import { PartnerInfoPanel } from "@/components/features/evaluation/partner-info-panel";

type HeatMapView = "inherent" | "residual";
type CategoryFilter = "all" | "mitra" | "proyek";
type Conclusion = "Memenuhi" | "Tidak Memenuhi" | "Catatan";
type NotaDinas = { nomor: string; tanggal: string; fileName: string | null };

const RISK_CATEGORIES = [
  "Operasional", "Keuangan", "Strategis", "Lingkungan",
  "Hukum", "Reputasi", "Teknis", "Regulasi", "Lainnya",
];

const DEFAULT_RISKS: RiskItem[] = [
  {
    id: "R1",
    riskCategory: "proyek",
    category: "Operasional",
    description: "",
    causes: [""],
    impactDescription: "",
    inherentProbability: 3,
    inherentImpact: 3,
    inherentLevel: "Sedang",
    justifikasiInheren: "",
    mitigations: [""],
    residualProbability: 2,
    residualImpact: 2,
    residualLevel: "Rendah",
    justifikasiResidual: "",
  },
];

function getOverallRiskVariant(level: string): "success" | "warning" | "error" {
  if (level === "Rendah") return "success";
  if (level === "Sedang") return "warning";
  return "error";
}

function getConclusionVariant(c: Conclusion): "success" | "warning" | "error" {
  if (c === "Memenuhi") return "success";
  if (c === "Catatan") return "warning";
  return "error";
}

function deriveOverallLevel(risks: RiskItem[]): string {
  if (!risks.length) return "Rendah";
  const levels = ["Kritis", "Sangat Tinggi", "Tinggi", "Sedang", "Rendah"];
  return risks.reduce((best, r) => {
    const bi = levels.indexOf(best);
    const ri = levels.indexOf(r.residualLevel);
    return ri < bi ? r.residualLevel : best;
  }, "Rendah");
}

function ScoreButton({
  value,
  selected,
  color,
  onClick,
}: {
  value: number;
  selected: boolean;
  color: "orange" | "green";
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-8 h-8 rounded text-sm font-semibold transition-colors",
        selected
          ? color === "orange"
            ? "bg-orange-500 text-white"
            : "bg-green-600 text-white"
          : "bg-white border border-gray-200 text-gray-500 hover:border-gray-400"
      )}
    >
      {value}
    </button>
  );
}

function RiskCard({
  risk,
  index,
  isExpanded,
  onToggle,
  onChange,
  onDelete,
}: {
  risk: RiskItem;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
  onChange: (field: string, value: unknown) => void;
  onDelete: () => void;
}) {
  const inherentScore = risk.inherentProbability * risk.inherentImpact;
  const residualScore = risk.residualProbability * risk.residualImpact;
  const penurunan =
    inherentScore > 0 ? ((inherentScore - residualScore) / inherentScore) * 100 : 0;

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
      {/* Header */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3 bg-white hover:bg-gray-50 text-left transition-colors"
      >
        <span className="font-mono text-sm font-bold text-ptba-navy w-8">{risk.id}</span>
        <span
          className={cn(
            "text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap",
            risk.riskCategory === "mitra"
              ? "bg-blue-100 text-blue-700"
              : "bg-purple-100 text-purple-700"
          )}
        >
          {risk.riskCategory === "mitra" ? "A — Mitra" : "B — Proyek"}
        </span>
        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
          {risk.category}
        </span>
        <span className="flex-1 text-sm text-gray-700 truncate min-w-0">
          {risk.description || (
            <span className="italic text-gray-400">Deskripsi belum diisi…</span>
          )}
        </span>
        <div className="flex items-center gap-1.5 shrink-0">
          <span
            className="text-xs px-1.5 py-0.5 rounded text-white font-medium"
            style={{ backgroundColor: getRiskColor(risk.inherentLevel) }}
          >
            {risk.inherentLevel}
          </span>
          <span className="text-gray-400 text-xs">→</span>
          <span
            className="text-xs px-1.5 py-0.5 rounded text-white font-medium"
            style={{ backgroundColor: getRiskColor(risk.residualLevel) }}
          >
            {risk.residualLevel}
          </span>
          {penurunan > 0 && (
            <span className="text-xs text-green-600 font-semibold">
              ↓{penurunan.toFixed(0)}%
            </span>
          )}
        </div>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-gray-400 transition-transform shrink-0",
            isExpanded && "rotate-180"
          )}
        />
      </button>

      {/* Body */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-3 border-t border-gray-100 bg-gray-50/50 space-y-4">
          {/* Row 1: ID / Type / Category */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Risk ID</label>
              <input
                value={risk.id}
                onChange={(e) => onChange("id", e.target.value)}
                className="w-full rounded border border-gray-200 px-2.5 py-1.5 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-ptba-steel-blue"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Tipe Risiko</label>
              <select
                value={risk.riskCategory}
                onChange={(e) => onChange("riskCategory", e.target.value)}
                className="w-full rounded border border-gray-200 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ptba-steel-blue bg-white"
              >
                <option value="mitra">A — Pemilihan Mitra</option>
                <option value="proyek">B — Pengembangan Proyek</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Kategori</label>
              <select
                value={risk.category}
                onChange={(e) => onChange("category", e.target.value)}
                className="w-full rounded border border-gray-200 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ptba-steel-blue bg-white"
              >
                {RISK_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Deskripsi */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Deskripsi Risiko</label>
            <textarea
              value={risk.description}
              onChange={(e) => onChange("description", e.target.value)}
              rows={2}
              placeholder="Jelaskan risiko yang teridentifikasi…"
              className="w-full rounded border border-gray-200 px-2.5 py-1.5 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ptba-steel-blue"
            />
          </div>

          {/* Penyebab */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Penyebab Risiko
            </label>
            <div className="space-y-1.5">
              {risk.causes.map((cause, ci) => (
                <div key={ci} className="flex gap-2">
                  <input
                    value={cause}
                    onChange={(e) => {
                      const next = [...risk.causes];
                      next[ci] = e.target.value;
                      onChange("causes", next);
                    }}
                    placeholder={`Penyebab ${ci + 1}`}
                    className="flex-1 rounded border border-gray-200 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ptba-steel-blue"
                  />
                  {risk.causes.length > 1 && (
                    <button
                      type="button"
                      onClick={() => onChange("causes", risk.causes.filter((_, i) => i !== ci))}
                      className="text-red-400 hover:text-red-600 p-1"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => onChange("causes", [...risk.causes, ""])}
              className="mt-1.5 flex items-center gap-1 text-xs text-ptba-steel-blue hover:text-ptba-navy"
            >
              <Plus className="h-3 w-3" /> Tambah Penyebab
            </button>
          </div>

          {/* Dampak */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Dampak Risiko</label>
            <textarea
              value={risk.impactDescription}
              onChange={(e) => onChange("impactDescription", e.target.value)}
              rows={2}
              placeholder="Jelaskan dampak jika risiko terjadi…"
              className="w-full rounded border border-gray-200 px-2.5 py-1.5 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ptba-steel-blue"
            />
          </div>

          {/* Inherent Risk */}
          <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 space-y-3">
            <h4 className="text-sm font-semibold text-orange-700">
              Risiko Inheren (Sebelum Mitigasi)
            </h4>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">
                  Probabilitas (1–5)
                </label>
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4, 5].map((v) => (
                    <ScoreButton
                      key={v}
                      value={v}
                      selected={risk.inherentProbability === v}
                      color="orange"
                      onClick={() => onChange("inherentProbability", v)}
                    />
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">
                  Dampak (1–5)
                </label>
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4, 5].map((v) => (
                    <ScoreButton
                      key={v}
                      value={v}
                      selected={risk.inherentImpact === v}
                      color="orange"
                      onClick={() => onChange("inherentImpact", v)}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-6 text-xs">
              <span className="text-gray-600">
                Skor P×D:{" "}
                <strong className="text-orange-700 text-sm">{inherentScore}</strong>
              </span>
              <span className="text-gray-600">
                Level:{" "}
                <strong style={{ color: getRiskColor(risk.inherentLevel) }}>
                  {risk.inherentLevel}
                </strong>
              </span>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Justifikasi Penilaian Inheren
              </label>
              <textarea
                value={risk.justifikasiInheren}
                onChange={(e) => onChange("justifikasiInheren", e.target.value)}
                rows={2}
                placeholder="Jelaskan alasan penilaian probabilitas dan dampak inheren…"
                className="w-full rounded border border-orange-200 px-2.5 py-1.5 text-xs resize-none focus:outline-none focus:ring-1 focus:ring-orange-400 bg-white"
              />
            </div>
          </div>

          {/* Mitigations */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Langkah Mitigasi
            </label>
            <div className="space-y-1.5">
              {risk.mitigations.map((m, mi) => (
                <div key={mi} className="flex gap-2">
                  <input
                    value={m}
                    onChange={(e) => {
                      const next = [...risk.mitigations];
                      next[mi] = e.target.value;
                      onChange("mitigations", next);
                    }}
                    placeholder={`Mitigasi ${mi + 1}`}
                    className="flex-1 rounded border border-gray-200 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ptba-steel-blue"
                  />
                  {risk.mitigations.length > 1 && (
                    <button
                      type="button"
                      onClick={() =>
                        onChange("mitigations", risk.mitigations.filter((_, i) => i !== mi))
                      }
                      className="text-red-400 hover:text-red-600 p-1"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => onChange("mitigations", [...risk.mitigations, ""])}
              className="mt-1.5 flex items-center gap-1 text-xs text-ptba-steel-blue hover:text-ptba-navy"
            >
              <Plus className="h-3 w-3" /> Tambah Mitigasi
            </button>
          </div>

          {/* Residual Risk */}
          <div className="rounded-lg border border-green-200 bg-green-50 p-4 space-y-3">
            <h4 className="text-sm font-semibold text-green-700">
              Risiko Residual (Setelah Mitigasi)
            </h4>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">
                  Probabilitas (1–5)
                </label>
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4, 5].map((v) => (
                    <ScoreButton
                      key={v}
                      value={v}
                      selected={risk.residualProbability === v}
                      color="green"
                      onClick={() => onChange("residualProbability", v)}
                    />
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">
                  Dampak (1–5)
                </label>
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4, 5].map((v) => (
                    <ScoreButton
                      key={v}
                      value={v}
                      selected={risk.residualImpact === v}
                      color="green"
                      onClick={() => onChange("residualImpact", v)}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-6 text-xs">
              <span className="text-gray-600">
                Skor P×D:{" "}
                <strong className="text-green-700 text-sm">{residualScore}</strong>
              </span>
              <span className="text-gray-600">
                Level:{" "}
                <strong style={{ color: getRiskColor(risk.residualLevel) }}>
                  {risk.residualLevel}
                </strong>
              </span>
              {penurunan > 0 && (
                <span className="text-green-600 font-semibold">
                  ↓ Penurunan: {penurunan.toFixed(1)}%
                </span>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Justifikasi Penilaian Residual
              </label>
              <textarea
                value={risk.justifikasiResidual}
                onChange={(e) => onChange("justifikasiResidual", e.target.value)}
                rows={2}
                placeholder="Jelaskan alasan penilaian probabilitas dan dampak setelah mitigasi…"
                className="w-full rounded border border-green-200 px-2.5 py-1.5 text-xs resize-none focus:outline-none focus:ring-1 focus:ring-green-400 bg-white"
              />
            </div>
          </div>

          {/* Delete */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onDelete}
              className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 border border-red-200 hover:border-red-400 rounded px-3 py-1.5 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" /> Hapus Risiko Ini
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function RiskEvaluationPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ partnerId?: string }>;
}) {
  const { id } = use(params);
  const { partnerId } = use(searchParams);
  const router = useRouter();

  const project = mockProjects.find((p) => p.id === id);
  const partner = mockPartners.find((p) => p.id === partnerId);
  const evalData = mockEvaluations.find(
    (e) => e.projectId === id && e.partnerId === partnerId
  );
  const isNew = !evalData;

  const [heatMapView, setHeatMapView] = useState<HeatMapView>("inherent");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [expandedRisks, setExpandedRisks] = useState<Set<string>>(new Set(["R1"]));
  const [conclusion, setConclusion] = useState<Conclusion>(
    (evalData?.risk?.conclusion as Conclusion) ?? "Memenuhi"
  );
  const [notaDinas, setNotaDinas] = useState<NotaDinas>({
    nomor: evalData?.risk?.notaDinasNumber ?? "",
    tanggal: "",
    fileName: null,
  });
  const [catatan, setCatatan] = useState("");

  const [risks, setRisks] = useState<RiskItem[]>(
    evalData?.risk?.risks ?? DEFAULT_RISKS.map((r) => ({ ...r }))
  );

  const updateRisk = (riskIdx: number, field: string, value: unknown) => {
    setRisks((prev) => {
      const updated = [...prev];
      const risk = { ...updated[riskIdx], [field]: value } as RiskItem;
      // Auto-recalculate risk levels when P or D changes
      if (field === "inherentProbability" || field === "inherentImpact") {
        risk.inherentLevel = getRiskLevel(
          field === "inherentProbability" ? (value as number) : risk.inherentProbability,
          field === "inherentImpact" ? (value as number) : risk.inherentImpact
        );
      }
      if (field === "residualProbability" || field === "residualImpact") {
        risk.residualLevel = getRiskLevel(
          field === "residualProbability" ? (value as number) : risk.residualProbability,
          field === "residualImpact" ? (value as number) : risk.residualImpact
        );
      }
      updated[riskIdx] = risk;
      return updated;
    });
  };

  const addRisk = () => {
    const newId = `R${risks.length + 1}`;
    const newRisk: RiskItem = {
      id: newId,
      riskCategory: "proyek",
      category: "Operasional",
      description: "",
      causes: [""],
      impactDescription: "",
      inherentProbability: 3,
      inherentImpact: 3,
      inherentLevel: "Sedang",
      justifikasiInheren: "",
      mitigations: [""],
      residualProbability: 2,
      residualImpact: 2,
      residualLevel: "Rendah",
      justifikasiResidual: "",
    };
    setRisks((prev) => [...prev, newRisk]);
    setExpandedRisks((prev) => new Set([...prev, newId]));
  };

  const removeRisk = (riskIdx: number) => {
    setRisks((prev) => prev.filter((_, i) => i !== riskIdx));
  };

  const toggleExpanded = (id: string) => {
    setExpandedRisks((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const overallLevel = useMemo(
    () => evalData?.risk?.overallLevel ?? deriveOverallLevel(risks),
    [evalData, risks]
  );

  const filteredRisks = useMemo(() => {
    if (categoryFilter === "all") return risks;
    return risks.filter((r) => r.riskCategory === categoryFilter);
  }, [risks, categoryFilter]);

  const mitraCount = useMemo(() => risks.filter((r) => r.riskCategory === "mitra").length, [risks]);
  const proyekCount = useMemo(() => risks.filter((r) => r.riskCategory === "proyek").length, [risks]);

  const avgPenurunan = useMemo(() => {
    if (!risks.length) return 0;
    const total = risks.reduce((sum, r) => {
      const iScore = r.inherentProbability * r.inherentImpact;
      const rScore = r.residualProbability * r.residualImpact;
      return sum + (iScore > 0 ? ((iScore - rScore) / iScore) * 100 : 0);
    }, 0);
    return total / risks.length;
  }, [risks]);

  const heatMapRisks = useMemo(
    () =>
      filteredRisks.map((risk) => ({
        id: risk.id,
        label: risk.description || risk.id,
        probability:
          heatMapView === "inherent" ? risk.inherentProbability : risk.residualProbability,
        impact: heatMapView === "inherent" ? risk.inherentImpact : risk.residualImpact,
        level: heatMapView === "inherent" ? risk.inherentLevel : risk.residualLevel,
      })),
    [filteredRisks, heatMapView]
  );

  const partnerName = evalData?.partnerName ?? partner?.name ?? partnerId ?? "—";

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-ptba-gray">
        <Link href="/projects" className="hover:text-ptba-navy">Proyek</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href={`/projects/${id}`} className="hover:text-ptba-navy">{project?.name ?? id}</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-ptba-charcoal font-medium">Evaluasi Risiko</span>
      </nav>

      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-1.5 text-sm text-ptba-gray hover:text-ptba-navy transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Kembali ke Proyek
      </button>

      {/* Two-column layout: form left, partner info right */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-6 items-start">
        <div className="space-y-6">

          {/* Header */}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-ptba-navy">Evaluasi Risiko</h1>
              {isNew && (
                <span className="rounded-full bg-ptba-gold/15 px-2.5 py-0.5 text-xs font-semibold text-ptba-gold">
                  Formulir Baru
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Kajian Risk Register — Probabilitas × Dampak, Inheren & Residual
            </p>
            <p className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-ptba-section-bg px-3 py-1.5 text-sm font-medium text-ptba-navy">
              Mitra: {partnerName}
            </p>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card accent="navy" padding="md">
              <p className="text-xs text-gray-500">Level Risiko Keseluruhan</p>
              <div className="flex items-center gap-2 mt-2">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                  style={{ backgroundColor: getRiskColor(overallLevel) }}
                >
                  <span className="text-xs font-bold text-white">{overallLevel.charAt(0)}</span>
                </div>
                <Badge variant={getOverallRiskVariant(overallLevel)}>{overallLevel}</Badge>
              </div>
            </Card>
            <Card padding="md">
              <p className="text-xs text-gray-500">Risiko Pemilihan Mitra</p>
              <div className="flex items-baseline gap-1 mt-1">
                <p className="text-2xl font-extrabold text-blue-700">{mitraCount}</p>
                <span className="text-xs text-gray-400">risiko (A)</span>
              </div>
            </Card>
            <Card padding="md">
              <p className="text-xs text-gray-500">Risiko Pengembangan Proyek</p>
              <div className="flex items-baseline gap-1 mt-1">
                <p className="text-2xl font-extrabold text-purple-700">{proyekCount}</p>
                <span className="text-xs text-gray-400">risiko (B)</span>
              </div>
            </Card>
            <Card padding="md">
              <p className="text-xs text-gray-500">Rata-rata Penurunan Risiko</p>
              <div className="flex items-baseline gap-1 mt-1">
                <p className="text-2xl font-extrabold text-green-600">
                  {avgPenurunan.toFixed(0)}%
                </p>
                <span className="text-xs text-gray-400">inheren→residual</span>
              </div>
            </Card>
          </div>

          {/* Category Filter Tabs */}
          <div className="flex gap-2 border-b border-gray-200 pb-0">
            {(
              [
                { key: "all", label: `Semua (${risks.length})` },
                { key: "mitra", label: `A — Pemilihan Mitra (${mitraCount})` },
                { key: "proyek", label: `B — Pengembangan Proyek (${proyekCount})` },
              ] as { key: CategoryFilter; label: string }[]
            ).map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setCategoryFilter(key)}
                className={cn(
                  "px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px",
                  categoryFilter === key
                    ? "border-ptba-navy text-ptba-navy"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Risk Register — Edit Mode (accordion cards) */}
          {isNew ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-ptba-navy">
                  Register Risiko
                </h2>
                <button
                  type="button"
                  onClick={addRisk}
                  className="flex items-center gap-1.5 text-sm text-ptba-navy border border-ptba-navy rounded-lg px-3 py-1.5 hover:bg-ptba-navy hover:text-white transition-colors"
                >
                  <Plus className="h-4 w-4" /> Tambah Risiko
                </button>
              </div>
              {filteredRisks.length === 0 ? (
                <Card padding="lg">
                  <p className="text-center text-gray-400 text-sm py-6">
                    Belum ada risiko untuk kategori ini. Klik "Tambah Risiko" untuk memulai.
                  </p>
                </Card>
              ) : (
                filteredRisks.map((risk, idx) => {
                  const actualIdx = risks.indexOf(risk);
                  return (
                    <RiskCard
                      key={risk.id}
                      risk={risk}
                      index={idx}
                      isExpanded={expandedRisks.has(risk.id)}
                      onToggle={() => toggleExpanded(risk.id)}
                      onChange={(field, value) => updateRisk(actualIdx, field, value)}
                      onDelete={() => removeRisk(actualIdx)}
                    />
                  );
                })
              )}
            </div>
          ) : (
            /* Risk Register — Read-only Table */
            <Card padding="sm">
              <div className="px-4 pt-4 pb-2">
                <h2 className="text-lg font-semibold text-ptba-navy">Register Risiko</h2>
                <p className="text-xs text-gray-400 mt-1">
                  Daftar risiko — Probabilitas × Dampak (Inheren & Residual)
                </p>
              </div>
              <RiskRegisterTable risks={filteredRisks} />
            </Card>
          )}

          {/* Heat Map */}
          <Card padding="lg">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <h2 className="text-lg font-semibold text-ptba-navy">
                  Peta Risiko (Heat Map 5×5)
                </h2>
                <p className="text-xs text-gray-400 mt-1">
                  Visualisasi matriks probabilitas vs dampak
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={heatMapView === "inherent" ? "navy" : "outline"}
                  size="sm"
                  onClick={() => setHeatMapView("inherent")}
                >
                  Risiko Inheren
                </Button>
                <Button
                  variant={heatMapView === "residual" ? "navy" : "outline"}
                  size="sm"
                  onClick={() => setHeatMapView("residual")}
                >
                  Risiko Residual
                </Button>
              </div>
            </div>
            <div className="max-w-xl mx-auto">
              <HeatMap
                risks={heatMapRisks}
                title={
                  heatMapView === "inherent"
                    ? "Peta Risiko Inheren"
                    : "Peta Risiko Residual"
                }
              />
            </div>
          </Card>

          {/* Risk Level Summary */}
          <Card padding="lg">
            <h2 className="text-lg font-semibold text-ptba-navy mb-4">
              Ringkasan Level Risiko
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-ptba-navy text-white">
                    <th className="px-4 py-3 text-left font-medium">Level</th>
                    <th className="px-4 py-3 text-center font-medium">Skor P×D</th>
                    <th className="px-4 py-3 text-center font-medium">Jumlah (Inheren)</th>
                    <th className="px-4 py-3 text-center font-medium">Jumlah (Residual)</th>
                    <th className="px-4 py-3 text-center font-medium">Perubahan</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { level: "Kritis", scoreRange: "20–25" },
                    { level: "Sangat Tinggi", scoreRange: "12–19" },
                    { level: "Tinggi", scoreRange: "8–11" },
                    { level: "Sedang", scoreRange: "4–7" },
                    { level: "Rendah", scoreRange: "1–3" },
                  ].map(({ level, scoreRange }, index) => {
                    const inherentCount = filteredRisks.filter(
                      (r) => r.inherentLevel === level
                    ).length;
                    const residualCount = filteredRisks.filter(
                      (r) => r.residualLevel === level
                    ).length;
                    const diff = residualCount - inherentCount;
                    return (
                      <tr
                        key={level}
                        className={cn(
                          "border-b border-gray-100",
                          index % 2 === 0 ? "bg-white" : "bg-gray-50"
                        )}
                      >
                        <td className="px-4 py-3">
                          <span
                            className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
                            style={{ backgroundColor: getRiskColor(level) }}
                          >
                            {level}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center text-xs text-gray-400">
                          {scoreRange}
                        </td>
                        <td className="px-4 py-3 text-center font-medium text-ptba-charcoal">
                          {inherentCount}
                        </td>
                        <td className="px-4 py-3 text-center font-medium text-ptba-charcoal">
                          {residualCount}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {diff === 0 && <span className="text-gray-400 text-xs">—</span>}
                          {diff < 0 && (
                            <span className="text-green-600 text-xs font-medium">{diff}</span>
                          )}
                          {diff > 0 && (
                            <span className="text-red-600 text-xs font-medium">+{diff}</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Conclusion & Nota Dinas */}
          <div className="flex flex-col gap-6">
            <Card accent="navy" padding="lg">
              <h3 className="text-lg font-semibold text-ptba-navy mb-4">Kesimpulan Evaluasi</h3>
              {isNew ? (
                <div className="space-y-3">
                  {(["Memenuhi", "Tidak Memenuhi", "Catatan"] as Conclusion[]).map((opt) => (
                    <label
                      key={opt}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors",
                        conclusion === opt
                          ? opt === "Memenuhi"
                            ? "border-green-500 bg-green-50"
                            : opt === "Catatan"
                            ? "border-amber-400 bg-amber-50"
                            : "border-red-500 bg-red-50"
                          : "border-gray-200 hover:border-gray-300"
                      )}
                    >
                      <input
                        type="radio"
                        name="conclusion"
                        value={opt}
                        checked={conclusion === opt}
                        onChange={() => setConclusion(opt)}
                        className="sr-only"
                      />
                      <Badge variant={getConclusionVariant(opt)}>{opt}</Badge>
                      <span className="text-sm text-gray-600">
                        {opt === "Memenuhi" && "Profil risiko dapat diterima"}
                        {opt === "Tidak Memenuhi" && "Profil risiko tidak dapat diterima"}
                        {opt === "Catatan" && "Dapat diterima dengan catatan/syarat"}
                      </span>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <div
                    className={cn(
                      "w-16 h-16 rounded-full flex items-center justify-center text-2xl font-extrabold",
                      conclusion === "Memenuhi" && "bg-green-100 text-green-700",
                      conclusion === "Catatan" && "bg-amber-100 text-amber-700",
                      conclusion === "Tidak Memenuhi" && "bg-red-100 text-red-700"
                    )}
                  >
                    {conclusion === "Memenuhi" ? "✓" : conclusion === "Catatan" ? "!" : "✗"}
                  </div>
                  <div>
                    <Badge variant={getConclusionVariant(conclusion)}>{conclusion}</Badge>
                    <p className="text-sm text-gray-500 mt-2">
                      {conclusion === "Memenuhi" && "Profil risiko dapat diterima."}
                      {conclusion === "Catatan" && "Dapat diterima dengan catatan mitigasi."}
                      {conclusion === "Tidak Memenuhi" && "Profil risiko tidak dapat diterima."}
                    </p>
                  </div>
                </div>
              )}
            </Card>

            <Card padding="md" accent="navy">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="h-4 w-4 text-ptba-navy" />
                <h3 className="text-sm font-semibold text-ptba-navy">Nota Dinas</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Nomor Nota Dinas</label>
                  {isNew ? (
                    <input
                      type="text"
                      placeholder="Contoh: ND-PTBA/2024/001"
                      value={notaDinas.nomor}
                      onChange={(e) => setNotaDinas((prev) => ({ ...prev, nomor: e.target.value }))}
                      className="w-full rounded border border-ptba-light-gray px-3 py-1.5 text-sm text-ptba-charcoal focus:border-ptba-steel-blue focus:outline-none"
                    />
                  ) : (
                    <div className="bg-ptba-section-bg rounded px-3 py-1.5 text-sm">
                      {notaDinas.nomor || <i className="text-gray-400">—</i>}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Tanggal</label>
                  {isNew ? (
                    <input
                      type="date"
                      value={notaDinas.tanggal}
                      onChange={(e) => setNotaDinas((prev) => ({ ...prev, tanggal: e.target.value }))}
                      className="w-full rounded border border-ptba-light-gray px-3 py-1.5 text-sm text-ptba-charcoal focus:border-ptba-steel-blue focus:outline-none"
                    />
                  ) : (
                    <div className="bg-ptba-section-bg rounded px-3 py-1.5 text-sm">
                      {notaDinas.tanggal || <i className="text-gray-400">—</i>}
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-xs text-gray-500 mb-1">File Nota Dinas</label>
                {isNew ? (
                  <label className="flex items-center gap-2 cursor-pointer w-fit rounded-lg border border-dashed border-ptba-steel-blue/50 bg-ptba-section-bg px-4 py-2.5 text-sm text-ptba-steel-blue hover:bg-ptba-steel-blue/5 transition-colors">
                    <Upload className="h-4 w-4" />
                    <span>{notaDinas.fileName ?? "Unggah PDF / DOCX"}</span>
                    <input
                      type="file"
                      accept=".pdf,.docx"
                      className="sr-only"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) setNotaDinas((prev) => ({ ...prev, fileName: file.name }));
                      }}
                    />
                  </label>
                ) : (
                  <div className="bg-ptba-section-bg rounded px-3 py-1.5 text-sm">
                    {notaDinas.fileName ? (
                      <span className="flex items-center gap-1.5">
                        <FileText className="h-3.5 w-3.5 text-ptba-navy" />
                        {notaDinas.fileName}
                      </span>
                    ) : (
                      <i className="text-gray-400">Tidak ada file.</i>
                    )}
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Catatan & Rekomendasi */}
          <Card padding="md" accent="navy">
            <h3 className="text-sm font-semibold text-ptba-navy mb-3">Catatan &amp; Rekomendasi Evaluator</h3>
            {isNew ? (
              <Textarea
                placeholder="Tulis catatan dan rekomendasi..."
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                className="min-h-[100px]"
              />
            ) : (
              <div className="bg-ptba-section-bg rounded px-3 py-2 text-sm">
                {catatan || <i className="text-gray-400">Tidak ada catatan.</i>}
              </div>
            )}
          </Card>

          {/* Save button */}
          {isNew && (
            <div className="flex justify-end">
              <button className="rounded-lg bg-ptba-navy px-6 py-2.5 text-sm font-semibold text-white hover:bg-ptba-navy/90 transition-colors">
                Simpan Evaluasi Risiko
              </button>
            </div>
          )}
        </div>

        {/* Sidebar: Partner Info */}
        <div className="xl:sticky xl:top-6">
          {partner && <PartnerInfoPanel partner={partner} />}
        </div>
      </div>
    </div>
  );
}
