"use client";

import { use, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronRight, Upload, FileText, ExternalLink, Download } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { RatingInput } from "@/components/features/evaluation/rating-input";
import { PartnerInfoPanel } from "@/components/features/evaluation/partner-info-panel";
import { mockEvaluations } from "@/lib/mock-data";
import { mockProjects } from "@/lib/mock-data/projects";
import { mockPartners } from "@/lib/mock-data/partners";
import { getGrade, getGradeColor } from "@/lib/utils/scoring";
import { getRiskColor } from "@/lib/utils/risk-level";
import { formatPercent } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

type Conclusion = "Memenuhi" | "Tidak Memenuhi" | "Catatan";
type NotaDinas = { nomor: string; tanggal: string; fileName: string | null };

interface SubScore {
  name: string;
  score: number;
  weight: number;
  notes: string;
}

interface SectionData {
  key: string;
  title: string;
  weight: number;
  subScores: SubScore[];
}

const DEFAULT_SECTIONS: SectionData[] = [
  {
    key: "market",
    title: "Pasar",
    weight: 15,
    subScores: [
      { name: "Pangsa Pasar & Posisi Kompetitif",  score: 0, weight: 0.30, notes: "" },
      { name: "Pertumbuhan Industri & Tren Pasar",  score: 0, weight: 0.25, notes: "" },
      { name: "Reputasi & Brand Value",             score: 0, weight: 0.25, notes: "" },
      { name: "Jaringan Distribusi & Pemasaran",    score: 0, weight: 0.20, notes: "" },
    ],
  },
  {
    key: "technical",
    title: "Teknis",
    weight: 20,
    subScores: [
      { name: "Kapabilitas Teknis & Teknologi",    score: 0, weight: 0.30, notes: "" },
      { name: "Pengalaman Proyek Sejenis",          score: 0, weight: 0.25, notes: "" },
      { name: "Sumber Daya Manusia Teknis",         score: 0, weight: 0.25, notes: "" },
      { name: "Fasilitas & Peralatan",              score: 0, weight: 0.20, notes: "" },
    ],
  },
  {
    key: "esg",
    title: "ESG",
    weight: 10,
    subScores: [
      { name: "Environmental (Lingkungan)", score: 0, weight: 0.40, notes: "" },
      { name: "Social (Sosial)",            score: 0, weight: 0.30, notes: "" },
      { name: "Governance (Tata Kelola)",   score: 0, weight: 0.30, notes: "" },
    ],
  },
];

function buildFormData(ev: (typeof mockEvaluations)[0] | undefined): Record<string, SectionData> {
  if (!ev) {
    const result: Record<string, SectionData> = {};
    DEFAULT_SECTIONS.forEach((s) => {
      result[s.key] = { ...s, subScores: s.subScores.map((ss) => ({ ...ss })) };
    });
    return result;
  }
  return {
    market: {
      key: "market", title: "Pasar", weight: 15,
      subScores: ev.market?.subScores.map((s) => ({ name: s.name, score: Math.round(s.score), weight: s.weight, notes: s.notes || "" })) ?? [],
    },
    technical: {
      key: "technical", title: "Teknis", weight: 20,
      subScores: ev.technical?.subScores.map((s) => ({ name: s.name, score: Math.round(s.score), weight: s.weight, notes: s.notes || "" })) ?? [],
    },
    esg: {
      key: "esg", title: "ESG", weight: 10,
      subScores: ev.esg?.subScores.map((s) => ({ name: s.name, score: Math.round(s.score), weight: s.weight, notes: s.notes || "" })) ?? [],
    },
  };
}

const DEFAULT_WEIGHTS = { market: 15, technical: 20, esg: 10, financial: 30, legal: 12.5, risk: 12.5 };

const RISK_SCORE_MAP: Record<string, number> = {
  Rendah: 5, Sedang: 3.5, Tinggi: 2, "Sangat Tinggi": 1, Kritis: 0.5,
};

function getConclusionVariant(c: Conclusion): "success" | "warning" | "error" {
  if (c === "Memenuhi") return "success";
  if (c === "Catatan") return "warning";
  return "error";
}

export default function EBDEvaluationPage({
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

  const [formData, setFormData] = useState<Record<string, SectionData>>(
    () => buildFormData(evalData)
  );
  const [conclusion, setConclusion] = useState<Conclusion>(
    (evalData?.risk?.conclusion as Conclusion) ?? "Memenuhi"
  );
  const [notaDinas, setNotaDinas] = useState<NotaDinas>({
    nomor: "",
    tanggal: "",
    fileName: null,
  });
  const [catatan, setCatatan] = useState("");

  const updateScore = (sectionKey: string, subIndex: number, score: number) => {
    setFormData((prev) => {
      const section = { ...prev[sectionKey] };
      const newSubScores = [...section.subScores];
      newSubScores[subIndex] = { ...newSubScores[subIndex], score };
      section.subScores = newSubScores;
      return { ...prev, [sectionKey]: section };
    });
  };

  const updateNotes = (sectionKey: string, subIndex: number, notes: string) => {
    setFormData((prev) => {
      const section = { ...prev[sectionKey] };
      const newSubScores = [...section.subScores];
      newSubScores[subIndex] = { ...newSubScores[subIndex], notes };
      section.subScores = newSubScores;
      return { ...prev, [sectionKey]: section };
    });
  };

  const calculateSectionTotal = (section: SectionData): number => {
    if (!section.subScores.length) return 0;
    const weightedSum = section.subScores.reduce((sum, s) => sum + s.score * s.weight, 0);
    const totalWeight = section.subScores.reduce((sum, s) => sum + s.weight, 0);
    return totalWeight > 0 ? weightedSum / totalWeight : 0;
  };

  const sectionTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    Object.entries(formData).forEach(([key, section]) => {
      totals[key] = calculateSectionTotal(section);
    });
    return totals;
  }, [formData]);

  const overallTotal = useMemo(() => {
    let sum = 0;
    Object.entries(formData).forEach(([key, section]) => {
      sum += sectionTotals[key] * (section.weight / 100);
    });
    return sum;
  }, [formData, sectionTotals]);

  const rankingData = useMemo(() => {
    // From live form state — updates as EBD fills in scores
    const marketScore    = sectionTotals["market"]    > 0 ? sectionTotals["market"]    : null;
    const technicalScore = sectionTotals["technical"] > 0 ? sectionTotals["technical"] : null;
    const esgScore       = sectionTotals["esg"]       > 0 ? sectionTotals["esg"]       : null;

    // From stored evalData (other evaluators)
    const financialScore = evalData?.financial
      ? (evalData.financial.totalScore / 100) * 5
      : null;

    const legalScore = evalData?.legal
      ? evalData.legal.overallStatus === "Lulus" ? 5
        : evalData.legal.overallStatus === "Bersyarat" ? 3.5
        : 1.5
      : null;

    const riskScore = evalData?.risk
      ? RISK_SCORE_MAP[evalData.risk.overallLevel] ?? 2.5
      : null;

    const dimensions = [
      { key: "market",    label: "Pasar",     score: marketScore,    weight: DEFAULT_WEIGHTS.market },
      { key: "technical", label: "Teknis",    score: technicalScore, weight: DEFAULT_WEIGHTS.technical },
      { key: "esg",       label: "ESG",       score: esgScore,       weight: DEFAULT_WEIGHTS.esg },
      { key: "financial", label: "Keuangan",  score: financialScore, weight: DEFAULT_WEIGHTS.financial },
      { key: "legal",     label: "Hukum",     score: legalScore,     weight: DEFAULT_WEIGHTS.legal },
      { key: "risk",      label: "Risiko",    score: riskScore,      weight: DEFAULT_WEIGHTS.risk },
    ];

    const available = dimensions.filter((d) => d.score !== null) as {
      key: string; label: string; score: number; weight: number;
    }[];

    const wSum = available.reduce((s, d) => s + d.weight, 0);
    const norm = wSum > 0 ? 100 / wSum : 1;
    const totalRaw = wSum > 0
      ? available.reduce((s, d) => s + d.score * d.weight * norm, 0) / 100
      : 0;
    const rankingScore = totalRaw * 20;
    const rankingGrade = getGrade(rankingScore);

    return { dimensions, available, rankingScore, rankingGrade, wSum, norm };
  }, [sectionTotals, evalData]);

  const sections = Object.values(formData);
  const partnerName = evalData?.partnerName ?? partner?.name ?? partnerId ?? "—";

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-ptba-gray">
        <Link href="/projects" className="hover:text-ptba-navy">Proyek</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href={`/projects/${id}`} className="hover:text-ptba-navy">{project?.name ?? id}</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-ptba-charcoal font-medium">Evaluasi EBD</span>
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
              <h1 className="text-2xl font-bold text-ptba-navy">Evaluasi EBD</h1>
              {isNew && (
                <span className="rounded-full bg-ptba-gold/15 px-2.5 py-0.5 text-xs font-semibold text-ptba-gold">
                  Formulir Baru
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Divisi Pengembangan Energi — Penilaian Pasar, Teknis, ESG &amp; Koordinasi Evaluator
            </p>
            <p className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-ptba-section-bg px-3 py-1.5 text-sm font-medium text-ptba-navy">
              Mitra: {partnerName}
            </p>
          </div>

          {/* Cross-Evaluator Results Panel */}
          <Card padding="lg">
            <h2 className="text-lg font-semibold text-ptba-navy mb-4">Hasil Evaluator Lain</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Keuangan */}
              {evalData?.financial ? (
                <Link
                  href={`/projects/${id}/evaluation/financial?partnerId=${partnerId}`}
                  className="group rounded-lg border border-gray-200 p-4 hover:border-ptba-steel-blue hover:bg-ptba-section-bg/50 transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Keuangan</p>
                    <ExternalLink className="h-3.5 w-3.5 text-gray-300 group-hover:text-ptba-steel-blue transition-colors" />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold text-white"
                        style={{ backgroundColor: getGradeColor(evalData.financial.grade) }}
                      >
                        {evalData.financial.grade}
                      </span>
                      <span className="text-sm font-bold text-ptba-charcoal">
                        {evalData.financial.totalScore.toFixed(1)}
                      </span>
                      <span className="text-xs text-gray-400">/ 100</span>
                    </div>
                    <p className="text-xs text-gray-500">Skor KEP-100</p>
                  </div>
                  <p className="text-[11px] text-ptba-steel-blue mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    Lihat detail evaluasi keuangan →
                  </p>
                </Link>
              ) : (
                <div className="rounded-lg border border-gray-200 p-4">
                  <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wide">Keuangan</p>
                  <p className="text-sm text-gray-400 italic">Belum tersedia</p>
                </div>
              )}

              {/* Hukum */}
              {evalData?.legal ? (
                <Link
                  href={`/projects/${id}/evaluation/legal?partnerId=${partnerId}`}
                  className="group rounded-lg border border-gray-200 p-4 hover:border-ptba-steel-blue hover:bg-ptba-section-bg/50 transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Hukum</p>
                    <ExternalLink className="h-3.5 w-3.5 text-gray-300 group-hover:text-ptba-steel-blue transition-colors" />
                  </div>
                  <div className="space-y-1.5">
                    <Badge
                      variant={
                        evalData.legal.overallStatus === "Lulus"
                          ? "success"
                          : evalData.legal.overallStatus === "Bersyarat"
                          ? "warning"
                          : "error"
                      }
                    >
                      {evalData.legal.overallStatus}
                    </Badge>
                    <p className="text-xs text-gray-500">Status Keseluruhan</p>
                  </div>
                  {evalData.legal.notaDinas && (
                    <p className="text-[11px] text-gray-400 mt-2 truncate">{evalData.legal.notaDinas}</p>
                  )}
                  <p className="text-[11px] text-ptba-steel-blue mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    Lihat detail evaluasi hukum →
                  </p>
                </Link>
              ) : (
                <div className="rounded-lg border border-gray-200 p-4">
                  <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wide">Hukum</p>
                  <p className="text-sm text-gray-400 italic">Belum tersedia</p>
                </div>
              )}

              {/* Risiko */}
              {evalData?.risk ? (
                <Link
                  href={`/projects/${id}/evaluation/risk?partnerId=${partnerId}`}
                  className="group rounded-lg border border-gray-200 p-4 hover:border-ptba-steel-blue hover:bg-ptba-section-bg/50 transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Risiko</p>
                    <ExternalLink className="h-3.5 w-3.5 text-gray-300 group-hover:text-ptba-steel-blue transition-colors" />
                  </div>
                  <div className="space-y-1.5">
                    <Badge
                      variant={
                        evalData.risk.overallLevel === "Rendah"
                          ? "success"
                          : evalData.risk.overallLevel === "Sedang"
                          ? "warning"
                          : "error"
                      }
                    >
                      {evalData.risk.overallLevel}
                    </Badge>
                    <p className="text-xs text-gray-500">{evalData.risk.conclusion}</p>
                  </div>
                  {evalData.risk.notaDinasNumber && (
                    <p className="text-[11px] text-gray-400 mt-2">{evalData.risk.notaDinasNumber}</p>
                  )}
                  <p className="text-[11px] text-ptba-steel-blue mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    Lihat detail evaluasi risiko →
                  </p>
                </Link>
              ) : (
                <div className="rounded-lg border border-gray-200 p-4">
                  <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wide">Risiko</p>
                  <p className="text-sm text-gray-400 italic">Belum tersedia</p>
                </div>
              )}
            </div>
          </Card>

          {/* Ranking Score Panel */}
          <Card accent="navy" padding="lg">
            <h2 className="text-lg font-semibold text-ptba-navy mb-4">Skor Ranking Mitra</h2>
            {rankingData.available.length === 0 ? (
              <p className="text-sm text-gray-400 italic py-2">
                Skor belum dapat dihitung — evaluasi lain belum tersedia.
              </p>
            ) : (
              <div className="space-y-4">
                {/* Score + grade */}
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="text-4xl font-extrabold text-ptba-navy">
                      {rankingData.rankingScore.toFixed(1)}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">/ 100</p>
                  </div>
                  <span
                    className="inline-flex items-center rounded-full px-3 py-1 text-base font-bold text-white"
                    style={{ backgroundColor: getGradeColor(rankingData.rankingGrade) }}
                  >
                    {rankingData.rankingGrade}
                  </span>
                </div>

                {/* Breakdown table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="pb-2 text-left text-xs font-medium text-gray-500">Dimensi</th>
                        <th className="pb-2 text-center text-xs font-medium text-gray-500">Skor / 5</th>
                        <th className="pb-2 text-center text-xs font-medium text-gray-500">Bobot</th>
                        <th className="pb-2 text-right text-xs font-medium text-gray-500">Kontribusi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rankingData.dimensions.map((dim) => {
                        const isAvail = dim.score !== null;
                        const contribution = isAvail
                          ? ((dim.score as number) * dim.weight * rankingData.norm) / 100 * 20
                          : null;
                        return (
                          <tr
                            key={dim.key}
                            className={cn("border-b border-gray-100", !isAvail && "opacity-40")}
                          >
                            <td className="py-2 text-ptba-charcoal font-medium">{dim.label}</td>
                            <td className="py-2 text-center text-ptba-charcoal">
                              {isAvail ? `${(dim.score as number).toFixed(2)}` : "—"}
                            </td>
                            <td className="py-2 text-center text-gray-500">
                              {formatPercent(dim.weight)}
                            </td>
                            <td className="py-2 text-right font-medium text-ptba-navy">
                              {contribution !== null ? contribution.toFixed(2) : "—"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </Card>

          {/* EBD Evaluation Form Sections */}
          {sections.map((section) => (
            <Card key={section.key} padding="lg">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-ptba-navy">{section.title}</h2>
                <span className="text-sm font-medium text-gray-500">Bobot: {section.weight}%</span>
              </div>

              <div className="space-y-6">
                {section.subScores.map((sub, subIdx) => (
                  <div key={sub.name} className="border border-gray-100 rounded-lg p-4 bg-gray-50/50">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                      <div>
                        <p className="text-sm font-semibold text-ptba-charcoal">{sub.name}</p>
                        <p className="text-xs text-gray-400">Bobot: {formatPercent(sub.weight * 100)}</p>
                      </div>
                    </div>
                    {isNew ? (
                      <>
                        <div className="mb-3">
                          <label className="block text-xs text-gray-500 mb-1.5">Skor</label>
                          <RatingInput
                            value={sub.score}
                            onChange={(val) => updateScore(section.key, subIdx, val)}
                          />
                        </div>
                        <div>
                          <Textarea
                            label="Catatan"
                            value={sub.notes}
                            onChange={(e) => updateNotes(section.key, subIdx, e.target.value)}
                            rows={2}
                            className="text-xs"
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="mb-2">
                          <label className="block text-xs text-gray-500 mb-1.5">Skor</label>
                          <div className="flex items-center gap-2">
                            <div className="flex gap-1">
                              {[1, 2, 3, 4, 5].map((dot) => (
                                <div
                                  key={dot}
                                  className={cn(
                                    "w-3 h-3 rounded-full",
                                    dot <= sub.score ? "bg-ptba-gold" : "bg-gray-200"
                                  )}
                                />
                              ))}
                            </div>
                            <span className="text-sm font-semibold text-ptba-charcoal">
                              {sub.score} / 5
                            </span>
                          </div>
                        </div>
                        {sub.notes && (
                          <p className="text-xs text-gray-500 italic">{sub.notes}</p>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-4 border-t border-gray-200 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500">Total Skor {section.title}</span>
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-extrabold text-ptba-navy">
                    {sectionTotals[section.key]?.toFixed(2) || "0.00"}
                  </span>
                  <span className="text-sm text-gray-400">/ 5.00</span>
                </div>
              </div>
            </Card>
          ))}

          {/* Overall Summary */}
          <Card accent="navy" padding="lg">
            <h2 className="text-lg font-semibold text-ptba-navy mb-4">Ringkasan Skor</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              {sections.map((section) => (
                <div key={section.key} className="bg-ptba-section-bg rounded-lg p-4 text-center">
                  <p className="text-sm text-gray-500">{section.title}</p>
                  <p className="text-2xl font-extrabold text-ptba-navy mt-1">
                    {sectionTotals[section.key]?.toFixed(2) || "0.00"}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Bobot: {section.weight}% | Tertimbang:{" "}
                    {((sectionTotals[section.key] || 0) * (section.weight / 100)).toFixed(3)}
                  </p>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <span className="text-sm font-medium text-gray-600">Total Nilai Tertimbang (Pasar + Teknis + ESG)</span>
              <span className="text-3xl font-extrabold text-ptba-gold">{overallTotal.toFixed(3)}</span>
            </div>
          </Card>

          {/* Kesimpulan Evaluasi */}
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
                      {opt === "Memenuhi" && "Mitra memenuhi kriteria evaluasi EBD"}
                      {opt === "Tidak Memenuhi" && "Mitra tidak memenuhi kriteria evaluasi EBD"}
                      {opt === "Catatan" && "Dapat dilanjutkan dengan catatan/syarat tertentu"}
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
                    {conclusion === "Memenuhi" && "Mitra memenuhi kriteria evaluasi EBD."}
                    {conclusion === "Catatan" && "Dapat dilanjutkan dengan catatan tertentu."}
                    {conclusion === "Tidak Memenuhi" && "Mitra tidak memenuhi kriteria evaluasi EBD."}
                  </p>
                </div>
              </div>
            )}
          </Card>

          {/* Nota Dinas Evaluator Lain */}
          {evalData && (evalData.legal?.notaDinas || evalData.risk?.notaDinasNumber) && (
            <Card padding="md">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="h-4 w-4 text-ptba-navy" />
                <h3 className="text-sm font-semibold text-ptba-navy">Nota Dinas Evaluator Lain</h3>
              </div>
              <div className="space-y-2">
                {evalData.legal?.notaDinas && (
                  <Link
                    href={`/projects/${id}/evaluation/legal?partnerId=${partnerId}`}
                    className="group flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 hover:border-ptba-steel-blue hover:bg-ptba-section-bg/50 transition-all"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-50 flex-shrink-0">
                      <FileText className="h-4 w-4 text-amber-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-500">Hukum</p>
                      <p className="text-sm text-ptba-charcoal truncate">{evalData.legal.notaDinas}</p>
                    </div>
                    <ExternalLink className="h-3.5 w-3.5 text-gray-300 group-hover:text-ptba-steel-blue transition-colors flex-shrink-0" />
                  </Link>
                )}
                {evalData.risk?.notaDinasNumber && (
                  <Link
                    href={`/projects/${id}/evaluation/risk?partnerId=${partnerId}`}
                    className="group flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 hover:border-ptba-steel-blue hover:bg-ptba-section-bg/50 transition-all"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-50 flex-shrink-0">
                      <FileText className="h-4 w-4 text-orange-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-500">Risiko</p>
                      <p className="text-sm text-ptba-charcoal truncate">{evalData.risk.notaDinasNumber}</p>
                    </div>
                    <ExternalLink className="h-3.5 w-3.5 text-gray-300 group-hover:text-ptba-steel-blue transition-colors flex-shrink-0" />
                  </Link>
                )}
              </div>
            </Card>
          )}

          {/* Nota Dinas EBD */}
          <Card padding="md" accent="navy">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="h-4 w-4 text-ptba-navy" />
              <h3 className="text-sm font-semibold text-ptba-navy">Nota Dinas EBD</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Nomor Nota Dinas</label>
                {isNew ? (
                  <input
                    type="text"
                    placeholder="Contoh: ND-PTBA/EBD/2024/001"
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
                <>
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
                  {notaDinas.fileName && (
                    <div className="mt-2 flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2">
                      <FileText className="h-4 w-4 text-ptba-navy flex-shrink-0" />
                      <span className="text-sm text-ptba-charcoal truncate flex-1">{notaDinas.fileName}</span>
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 text-xs text-ptba-steel-blue hover:text-ptba-navy transition-colors"
                        onClick={() => alert(`Pratinjau file: ${notaDinas.fileName}\n\n(Fitur pratinjau tersedia setelah integrasi backend)`)}
                      >
                        <ExternalLink className="h-3 w-3" />
                        Lihat
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="bg-ptba-section-bg rounded px-3 py-1.5 text-sm">
                  {notaDinas.fileName ? (
                    <div className="flex items-center gap-2">
                      <FileText className="h-3.5 w-3.5 text-ptba-navy flex-shrink-0" />
                      <span className="truncate flex-1">{notaDinas.fileName}</span>
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 text-xs text-ptba-steel-blue hover:text-ptba-navy transition-colors"
                        onClick={() => alert(`Pratinjau file: ${notaDinas.fileName}\n\n(Fitur pratinjau tersedia setelah integrasi backend)`)}
                      >
                        <ExternalLink className="h-3 w-3" />
                        Lihat
                      </button>
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 text-xs text-ptba-steel-blue hover:text-ptba-navy transition-colors"
                        onClick={() => alert(`Mengunduh file: ${notaDinas.fileName}\n\n(Fitur unduh tersedia setelah integrasi backend)`)}
                      >
                        <Download className="h-3 w-3" />
                        Unduh
                      </button>
                    </div>
                  ) : (
                    <i className="text-gray-400">Tidak ada file.</i>
                  )}
                </div>
              )}
            </div>
          </Card>

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

          {/* Save Button */}
          {isNew && (
            <div className="flex justify-end">
              <button className="rounded-lg bg-ptba-navy px-6 py-2.5 text-sm font-semibold text-white hover:bg-ptba-navy/90 transition-colors">
                Simpan Evaluasi EBD
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
