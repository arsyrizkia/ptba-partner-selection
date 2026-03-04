"use client";

import { use, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, ChevronRight,
  TrendingUp, TrendingDown, Minus, Upload, FileText,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { GradeDisplay } from "@/components/features/evaluation/grade-display";
import { mockEvaluations } from "@/lib/mock-data";
import { mockProjects } from "@/lib/mock-data/projects";
import { mockPartners } from "@/lib/mock-data/partners";
import { getGrade, getGradeColor } from "@/lib/utils/scoring";
import { cn } from "@/lib/utils/cn";
import { PartnerInfoPanel } from "@/components/features/evaluation/partner-info-panel";

const GRADE_DESCRIPTIONS: Record<string, string> = {
  AAA: "Sangat Baik", AA: "Baik", A: "Cukup Baik",
  BBB: "Cukup", BB: "Kurang", B: "Sangat Kurang", C: "Buruk",
};

// FR-EV-011: Predikat labels per KEP-100/MBU/2002
const PREDIKAT_MAP: Record<string, string> = {
  AAA: "Sangat Sehat", AA: "Sehat", A: "Sehat",
  BBB: "Kurang Sehat", BB: "Kurang Sehat",
  B: "Tidak Sehat", C: "Tidak Sehat",
};

const CURRENT_YEARS = [2021, 2022, 2023];

const DEFAULT_INDICATORS = [
  { name: "Return on Equity (ROE)",        formula: "Net Income / Total Equity × 100%",               weight: 15 },
  { name: "Return on Investment (ROI)",     formula: "EBIT / Total Assets × 100%",                     weight: 10 },
  { name: "Current Ratio",                  formula: "Current Assets / Current Liabilities",            weight: 10 },
  { name: "Cash Ratio",                     formula: "Cash & Cash Equivalents / Current Liabilities",   weight: 5  },
  { name: "Collection Period (Hari)",       formula: "Receivables / Revenue × 365",                    weight: 5  },
  { name: "Perputaran Persediaan (Hari)",   formula: "Inventory / Revenue × 365",                      weight: 5  },
  { name: "Total Asset Turnover (TATO)",    formula: "Revenue / Total Assets",                         weight: 5  },
  { name: "Debt to Equity Ratio (DER)",     formula: "Total Liabilities / Total Equity",               weight: 20 },
];

type YearValue = { year: number; score: number };
type IndicatorRow = {
  name: string;
  formula: string;
  weight: number;
  values: YearValue[];
  averageScore: number;
};
type NotaDinas = { nomor: string; tanggal: string; fileName: string | null };

function buildDefaultIndicators(): IndicatorRow[] {
  return DEFAULT_INDICATORS.map((ind) => ({
    ...ind,
    values: CURRENT_YEARS.map((year) => ({ year, score: 0 })),
    averageScore: 0,
  }));
}

function buildFromEval(eval0: (typeof mockEvaluations)[0]): IndicatorRow[] {
  return (eval0.financial?.indicators ?? []).map((ind) => ({
    name: ind.name,
    formula: ind.formula,
    weight: ind.weight,
    values: ind.values.map((v) => ({ year: v.year, score: v.score })),
    averageScore: ind.averageScore,
  }));
}

function getPredikat(grade: string): string {
  return PREDIKAT_MAP[grade] ?? "—";
}

// FR-EV-013: 3-year trend
function getTrend(values: YearValue[]): "up" | "down" | "flat" {
  if (values.length < 2) return "flat";
  const first = values[0].score;
  const last = values[values.length - 1].score;
  if (last - first > 0.5) return "up";
  if (first - last > 0.5) return "down";
  return "flat";
}

function TrendIcon({ trend }: { trend: "up" | "down" | "flat" }) {
  if (trend === "up")   return <TrendingUp   className="inline-block ml-1 h-3.5 w-3.5 text-green-500" />;
  if (trend === "down") return <TrendingDown  className="inline-block ml-1 h-3.5 w-3.5 text-red-500" />;
  return                       <Minus         className="inline-block ml-1 h-3.5 w-3.5 text-gray-400" />;
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function FinancialEvaluationPage({
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

  const [indicators, setIndicators] = useState<IndicatorRow[]>(() =>
    evalData ? buildFromEval(evalData) : buildDefaultIndicators()
  );
  const [catatan, setCatatan] = useState("");
  const [notaDinas, setNotaDinas] = useState<NotaDinas>({ nomor: "", tanggal: "", fileName: null });

  const years = indicators[0]?.values.map((v) => v.year) ?? CURRENT_YEARS;

  const updateScore = (indIdx: number, yearIdx: number, score: number) => {
    setIndicators((prev) =>
      prev.map((ind, i) => {
        if (i !== indIdx) return ind;
        const newValues = ind.values.map((v, j) =>
          j === yearIdx ? { ...v, score } : v
        );
        const avgScore = newValues.reduce((s, v) => s + v.score, 0) / newValues.length;
        return { ...ind, values: newValues, averageScore: avgScore };
      })
    );
  };

  const totalWeight = useMemo(
    () => indicators.reduce((s, ind) => s + ind.weight, 0),
    [indicators]
  );

  const totalScore = useMemo(
    () =>
      totalWeight > 0
        ? (indicators.reduce((sum, ind) => sum + ind.averageScore, 0) / totalWeight) * 100
        : 0,
    [indicators, totalWeight]
  );

  const grade = useMemo(() => getGrade(totalScore), [totalScore]);
  const predikat = useMemo(() => getPredikat(grade), [grade]);
  const partnerName = evalData?.partnerName ?? partner?.name ?? partnerId ?? "—";

  return (
    <div className="space-y-4">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-ptba-gray">
        <Link href="/projects" className="hover:text-ptba-navy">Proyek</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href={`/projects/${id}`} className="hover:text-ptba-navy">{project?.name ?? id}</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-ptba-charcoal font-medium">Evaluasi Keuangan</span>
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
              <h1 className="text-2xl font-bold text-ptba-navy">Evaluasi Keuangan (KEP-100)</h1>
              {isNew && (
                <span className="rounded-full bg-ptba-gold/15 px-2.5 py-0.5 text-xs font-semibold text-ptba-gold">
                  Formulir Baru
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Penilaian tingkat kesehatan keuangan berdasarkan KEP-100/MBU/2002 —
              skor diisi manual oleh evaluator berdasarkan dokumen keuangan yang diunggah mitra.
            </p>
            <p className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-ptba-section-bg px-3 py-1.5 text-sm font-medium text-ptba-navy">
              Mitra: {partnerName}
            </p>
          </div>

          {/* KEP-100 Indicators Table */}
          <Card padding="sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-ptba-navy text-white">
                    <th className="px-3 py-3 text-left font-medium w-8">No</th>
                    <th className="px-3 py-3 text-left font-medium w-44">Indikator</th>
                    <th className="px-3 py-3 text-left font-medium w-48">Formula</th>
                    {years.map((year) => (
                      <th key={year} className="px-3 py-3 text-center font-medium w-20">
                        <div>{year}</div>
                        <div className="text-[10px] font-normal opacity-70">Skor</div>
                      </th>
                    ))}
                    <th className="px-3 py-3 text-center font-medium w-28">Skor Rata-rata</th>
                    <th className="px-3 py-3 text-center font-medium w-16">Bobot</th>
                    <th className="px-3 py-3 text-center font-medium w-24">Tertimbang</th>
                  </tr>
                </thead>
                <tbody>
                  {indicators.map((ind, indIdx) => (
                    <tr
                      key={ind.name}
                      className={cn("border-b border-gray-100", indIdx % 2 === 0 ? "bg-white" : "bg-gray-50")}
                    >
                      <td className="px-3 py-3 text-ptba-charcoal font-medium">{indIdx + 1}</td>
                      <td className="px-3 py-3 text-ptba-charcoal font-medium text-xs">{ind.name}</td>
                      <td className="px-3 py-3 text-gray-400 text-xs italic">{ind.formula}</td>
                      {ind.values.map((v, yearIdx) => (
                        <td key={v.year} className="px-3 py-2 text-center">
                          {isNew ? (
                            <input
                              type="number"
                              min={0}
                              max={ind.weight}
                              step={0.5}
                              value={v.score}
                              onChange={(e) => updateScore(indIdx, yearIdx, Number(e.target.value))}
                              className="w-14 rounded border border-ptba-light-gray px-1 py-0.5 text-center text-xs text-ptba-charcoal focus:border-ptba-steel-blue focus:outline-none"
                            />
                          ) : (
                            <div className="text-ptba-charcoal font-medium">{v.score}</div>
                          )}
                        </td>
                      ))}
                      {/* FR-EV-013: trend arrow on average score */}
                      <td className="px-3 py-3 text-center font-bold text-ptba-navy">
                        {ind.averageScore.toFixed(2)}
                        <TrendIcon trend={getTrend(ind.values)} />
                      </td>
                      <td className="px-3 py-3 text-center text-gray-500">{ind.weight}</td>
                      <td className="px-3 py-3 text-center font-bold text-ptba-gold">
                        {totalWeight > 0 ? (ind.averageScore / totalWeight * 100).toFixed(2) : "0.00"}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-ptba-navy/5 border-t-2 border-ptba-navy">
                    <td colSpan={3 + years.length + 1} className="px-3 py-4 text-right font-bold text-ptba-navy text-sm">
                      Total Skor
                    </td>
                    <td className="px-3 py-4 text-center font-bold text-gray-500">
                      {totalWeight}
                    </td>
                    <td className="px-3 py-4 text-center font-extrabold text-ptba-navy text-lg">
                      {totalScore.toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </Card>

          {/* Grade Display + Predikat (FR-EV-011) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col items-center gap-2">
              <GradeDisplay
                grade={grade}
                score={totalScore}
                description={GRADE_DESCRIPTIONS[grade] || "N/A"}
              />
              {/* FR-EV-011: Predikat */}
              <div
                className="w-full text-center rounded-lg px-4 py-2.5"
                style={{ backgroundColor: `${getGradeColor(grade)}18` }}
              >
                <p className="text-xs text-gray-500 uppercase tracking-wide">Predikat KEP-100</p>
                <p className="text-base font-bold" style={{ color: getGradeColor(grade) }}>{predikat}</p>
              </div>
            </div>

            <Card padding="lg">
              <h3 className="text-lg font-semibold text-ptba-navy mb-4">Skala Grade KEP-100</h3>
              <div className="space-y-2">
                {[
                  { grade: "AAA", min: 95, desc: "Sangat Baik" },
                  { grade: "AA",  min: 80, desc: "Baik" },
                  { grade: "A",   min: 65, desc: "Cukup Baik" },
                  { grade: "BBB", min: 50, desc: "Cukup" },
                  { grade: "BB",  min: 40, desc: "Kurang" },
                  { grade: "B",   min: 30, desc: "Sangat Kurang" },
                  { grade: "C",   min: 0,  desc: "Buruk" },
                ].map((g) => (
                  <div
                    key={g.grade}
                    className={cn(
                      "flex items-center justify-between px-3 py-2 rounded-lg text-sm",
                      grade === g.grade ? "bg-ptba-navy/10 ring-2 ring-ptba-navy" : "bg-gray-50"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="inline-flex items-center justify-center w-10 h-7 rounded text-xs font-bold text-white"
                        style={{ backgroundColor: getGradeColor(g.grade) }}
                      >
                        {g.grade}
                      </span>
                      <span className="text-ptba-charcoal">{g.desc}</span>
                    </div>
                    <span className="text-gray-400 text-xs">{g.min > 0 ? `>= ${g.min}` : "< 30"}</span>
                  </div>
                ))}
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

          {/* Nota Dinas (FR-AD-003) */}
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

          {/* Save button */}
          {isNew && (
            <div className="flex justify-end">
              <button className="rounded-lg bg-ptba-navy px-6 py-2.5 text-sm font-semibold text-white hover:bg-ptba-navy/90 transition-colors">
                Simpan Evaluasi
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
