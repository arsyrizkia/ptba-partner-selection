"use client";

import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import RadarChartComponent, { type RadarDataItem } from "@/components/charts/radar-chart";
import { mockEvaluations } from "@/lib/mock-data";
import { getGrade, getGradeColor } from "@/lib/utils/scoring";
import { cn } from "@/lib/utils/cn";
import { formatPercent } from "@/lib/utils/format";

interface WeightConfig {
  market: number;
  technical: number;
  esg: number;
  financial: number;
  legal: number;
  risk: number;
}

const DEFAULT_WEIGHTS: WeightConfig = {
  market: 15,
  technical: 20,
  esg: 10,
  financial: 30,
  legal: 12.5,
  risk: 12.5,
};

const WEIGHT_LABELS: Record<keyof WeightConfig, string> = {
  market: "Pasar",
  technical: "Teknis",
  esg: "ESG",
  financial: "Keuangan",
  legal: "Legal",
  risk: "Risiko",
};

const PARTNER_COLORS = ["#1B3A5C", "#D4A843", "#C8102E", "#2E75B6"];

function normalizeFinancialScore(totalScore: number): number {
  return (totalScore / 100) * 5;
}

function normalizeLegalScore(overallStatus: string): number {
  if (overallStatus === "Lulus") return 5;
  if (overallStatus === "Bersyarat") return 3.5;
  return 1.5;
}

function normalizeRiskScore(overallLevel: string): number {
  const map: Record<string, number> = {
    Rendah: 5,
    Sedang: 3.5,
    Tinggi: 2,
    "Sangat Tinggi": 1,
    Kritis: 0.5,
  };
  return map[overallLevel] ?? 3;
}

interface RankedPartner {
  partnerId: string;
  partnerName: string;
  shortName: string;
  market: number;
  technical: number;
  esg: number;
  financial: number;
  legal: number;
  risk: number;
  totalScore: number;
  grade: string;
}

export default function RankingPage() {
  const evaluations = mockEvaluations;
  const [weights, setWeights] = useState<WeightConfig>({ ...DEFAULT_WEIGHTS });

  const updateWeight = (key: keyof WeightConfig, value: number) => {
    setWeights((prev) => ({ ...prev, [key]: value }));
  };

  const totalWeight = useMemo(() => {
    return Object.values(weights).reduce((sum, w) => sum + w, 0);
  }, [weights]);

  const rankedPartners = useMemo(() => {
    const partners: RankedPartner[] = evaluations.map((ev) => {
      const marketScore = ev.market?.total ?? 0;
      const technicalScore = ev.technical?.total ?? 0;
      const esgScore = ev.esg?.total ?? 0;
      const financialScore = normalizeFinancialScore(ev.financial?.totalScore ?? 0);
      const legalScore = normalizeLegalScore(ev.legal?.overallStatus ?? 'Tidak Lulus');
      const riskScore = normalizeRiskScore(ev.risk?.overallLevel ?? 'Kritis');

      // Calculate weighted total (normalize weights to sum to 100 if they don't)
      const wSum = Object.values(weights).reduce((s, w) => s + w, 0);
      const norm = wSum > 0 ? 100 / wSum : 1;

      const totalScore =
        (marketScore * weights.market * norm +
          technicalScore * weights.technical * norm +
          esgScore * weights.esg * norm +
          financialScore * weights.financial * norm +
          legalScore * weights.legal * norm +
          riskScore * weights.risk * norm) /
        100;

      // Scale to 0-100 for grading (score is 0-5, so multiply by 20)
      const scaledScore = totalScore * 20;

      return {
        partnerId: ev.partnerId,
        partnerName: ev.partnerName,
        shortName: ev.partnerName.replace(/^PT\s+/, "").split(" ")[0],
        market: marketScore,
        technical: technicalScore,
        esg: esgScore,
        financial: financialScore,
        legal: legalScore,
        risk: riskScore,
        totalScore: scaledScore,
        grade: getGrade(scaledScore),
      };
    });

    // Sort by total score descending
    return partners.sort((a, b) => b.totalScore - a.totalScore);
  }, [evaluations, weights]);

  // Radar chart data
  const radarData = useMemo(() => {
    const aspects = ["Pasar", "Teknis", "ESG", "Keuangan", "Legal", "Risiko"];
    return aspects.map((aspect) => {
      const item: RadarDataItem = { subject: aspect };

      // Show top 3 partners
      rankedPartners.slice(0, 3).forEach((partner) => {
        switch (aspect) {
          case "Pasar":
            item[partner.shortName] = partner.market;
            break;
          case "Teknis":
            item[partner.shortName] = partner.technical;
            break;
          case "ESG":
            item[partner.shortName] = partner.esg;
            break;
          case "Keuangan":
            item[partner.shortName] = partner.financial;
            break;
          case "Legal":
            item[partner.shortName] = partner.legal;
            break;
          case "Risiko":
            item[partner.shortName] = partner.risk;
            break;
        }
      });

      return item;
    });
  }, [rankedPartners]);

  const radarDataKeys = useMemo(() => {
    return rankedPartners.slice(0, 3).map((partner, i) => ({
      key: partner.shortName,
      color: PARTNER_COLORS[i % PARTNER_COLORS.length],
      name: partner.shortName,
    }));
  }, [rankedPartners]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ptba-navy">
            Peringkat Mitra
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Peringkat mitra berdasarkan evaluasi seluruh aspek dengan bobot
            yang dapat dikonfigurasi
          </p>
        </div>
        <Button variant="gold" size="md">
          Ekspor
        </Button>
      </div>

      {/* Weight Sliders */}
      <Card padding="lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-ptba-navy">
            Konfigurasi Bobot
          </h2>
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "text-sm font-medium",
                Math.abs(totalWeight - 100) < 0.1
                  ? "text-green-600"
                  : "text-red-600"
              )}
            >
              Total: {totalWeight.toFixed(1)}%
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setWeights({ ...DEFAULT_WEIGHTS })}
            >
              Reset
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-5">
          {(Object.keys(weights) as (keyof WeightConfig)[]).map((key) => (
            <div key={key}>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-ptba-charcoal">
                  {WEIGHT_LABELS[key]}
                </label>
                <span className="text-sm font-bold text-ptba-navy">
                  {weights[key].toFixed(1)}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={50}
                step={0.5}
                value={weights[key]}
                onChange={(e) =>
                  updateWeight(key, parseFloat(e.target.value))
                }
                className="w-full h-2 rounded-full appearance-none cursor-pointer
                  [&::-webkit-slider-thumb]:appearance-none
                  [&::-webkit-slider-thumb]:w-4
                  [&::-webkit-slider-thumb]:h-4
                  [&::-webkit-slider-thumb]:rounded-full
                  [&::-webkit-slider-thumb]:bg-ptba-navy
                  [&::-webkit-slider-thumb]:cursor-pointer
                  [&::-webkit-slider-thumb]:border-2
                  [&::-webkit-slider-thumb]:border-white
                  [&::-webkit-slider-thumb]:shadow-md
                  [&::-moz-range-thumb]:w-4
                  [&::-moz-range-thumb]:h-4
                  [&::-moz-range-thumb]:rounded-full
                  [&::-moz-range-thumb]:bg-ptba-navy
                  [&::-moz-range-thumb]:cursor-pointer
                  [&::-moz-range-thumb]:border-2
                  [&::-moz-range-thumb]:border-white
                  [&::-moz-range-thumb]:shadow-md
                  bg-gray-200
                "
                style={{
                  background: `linear-gradient(to right, #1B3A5C ${
                    (weights[key] / 50) * 100
                  }%, #e5e7eb ${(weights[key] / 50) * 100}%)`,
                }}
              />
              <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
                <span>0%</span>
                <span>50%</span>
              </div>
            </div>
          ))}
        </div>

        {Math.abs(totalWeight - 100) >= 0.1 && (
          <div className="mt-4 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-xs text-amber-700">
              Perhatian: Total bobot saat ini {totalWeight.toFixed(1)}%.
              Disarankan agar total bobot = 100%. Skor akan dinormalisasi
              secara proporsional.
            </p>
          </div>
        )}
      </Card>

      {/* Ranking Table */}
      <Card padding="sm">
        <div className="px-4 pt-4 pb-2">
          <h2 className="text-lg font-semibold text-ptba-navy">
            Tabel Peringkat
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-ptba-navy text-white">
                <th className="px-3 py-3 text-center font-medium w-20">
                  Peringkat
                </th>
                <th className="px-3 py-3 text-left font-medium">Nama Mitra</th>
                <th className="px-3 py-3 text-center font-medium w-16">
                  Pasar
                </th>
                <th className="px-3 py-3 text-center font-medium w-16">
                  Teknis
                </th>
                <th className="px-3 py-3 text-center font-medium w-16">
                  ESG
                </th>
                <th className="px-3 py-3 text-center font-medium w-20">
                  Keuangan
                </th>
                <th className="px-3 py-3 text-center font-medium w-16">
                  Legal
                </th>
                <th className="px-3 py-3 text-center font-medium w-16">
                  Risiko
                </th>
                <th className="px-3 py-3 text-center font-medium w-20">
                  Total
                </th>
                <th className="px-3 py-3 text-center font-medium w-20">
                  Grade
                </th>
              </tr>
            </thead>
            <tbody>
              {rankedPartners.map((partner, index) => {
                const gradeColor = getGradeColor(partner.grade);
                return (
                  <tr
                    key={partner.partnerId}
                    className={cn(
                      "border-b border-gray-100 transition-colors",
                      index === 0 && "bg-ptba-gold/5",
                      index > 0 && index % 2 === 0
                        ? "bg-white"
                        : index > 0
                        ? "bg-gray-50"
                        : ""
                    )}
                  >
                    <td className="px-3 py-4 text-center">
                      <div
                        className={cn(
                          "inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm",
                          index === 0 &&
                            "bg-ptba-gold text-ptba-charcoal",
                          index === 1 &&
                            "bg-gray-300 text-gray-700",
                          index === 2 &&
                            "bg-amber-600 text-white",
                          index > 2 &&
                            "bg-gray-100 text-gray-500"
                        )}
                      >
                        {index + 1}
                      </div>
                    </td>
                    <td className="px-3 py-4 text-ptba-charcoal font-medium text-xs">
                      {partner.partnerName}
                    </td>
                    <td className="px-3 py-4 text-center text-ptba-charcoal font-medium">
                      {partner.market.toFixed(2)}
                    </td>
                    <td className="px-3 py-4 text-center text-ptba-charcoal font-medium">
                      {partner.technical.toFixed(2)}
                    </td>
                    <td className="px-3 py-4 text-center text-ptba-charcoal font-medium">
                      {partner.esg.toFixed(2)}
                    </td>
                    <td className="px-3 py-4 text-center text-ptba-charcoal font-medium">
                      {partner.financial.toFixed(2)}
                    </td>
                    <td className="px-3 py-4 text-center text-ptba-charcoal font-medium">
                      {partner.legal.toFixed(2)}
                    </td>
                    <td className="px-3 py-4 text-center text-ptba-charcoal font-medium">
                      {partner.risk.toFixed(2)}
                    </td>
                    <td className="px-3 py-4 text-center font-extrabold text-ptba-navy text-base">
                      {partner.totalScore.toFixed(1)}
                    </td>
                    <td className="px-3 py-4 text-center">
                      <span
                        className="inline-flex items-center justify-center w-12 h-7 rounded text-xs font-bold text-white"
                        style={{ backgroundColor: gradeColor }}
                      >
                        {partner.grade}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Radar Chart Comparison */}
      <Card padding="lg">
        <h2 className="text-lg font-semibold text-ptba-navy mb-2">
          Perbandingan Top Mitra
        </h2>
        <p className="text-xs text-gray-400 mb-4">
          Radar chart membandingkan 3 mitra teratas berdasarkan peringkat
          saat ini
        </p>
        <RadarChartComponent data={radarData} dataKeys={radarDataKeys} />
      </Card>

      {/* Weight Breakdown for Top Partner */}
      {rankedPartners[0] && (
        <Card accent="gold" padding="lg">
          <h2 className="text-lg font-semibold text-ptba-navy mb-4">
            Detail Peringkat 1: {rankedPartners[0].partnerName}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {(Object.keys(weights) as (keyof WeightConfig)[]).map((key) => {
              const scoreMap: Record<keyof WeightConfig, number> = {
                market: rankedPartners[0].market,
                technical: rankedPartners[0].technical,
                esg: rankedPartners[0].esg,
                financial: rankedPartners[0].financial,
                legal: rankedPartners[0].legal,
                risk: rankedPartners[0].risk,
              };
              const score = scoreMap[key];
              const weighted = (score * weights[key]) / 100;
              return (
                <div
                  key={key}
                  className="bg-white rounded-lg p-3 border border-gray-100 text-center"
                >
                  <p className="text-xs text-gray-500 mb-1">
                    {WEIGHT_LABELS[key]}
                  </p>
                  <p className="text-lg font-bold text-ptba-navy">
                    {score.toFixed(2)}
                  </p>
                  <p className="text-[10px] text-gray-400">
                    x {weights[key]}% = {(weighted * 20).toFixed(2)}
                  </p>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
