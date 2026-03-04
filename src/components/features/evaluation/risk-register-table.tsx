"use client";

import { cn } from "@/lib/utils/cn";
import { getRiskColor } from "@/lib/utils/risk-level";
import type { RiskItem } from "@/lib/types";

interface RiskRegisterTableProps {
  risks: RiskItem[];
}

const RISK_CATEGORY_LABELS: Record<string, string> = {
  mitra: "A — Mitra",
  proyek: "B — Proyek",
};

function RiskLevelBadge({ level }: { level: string }) {
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium text-white whitespace-nowrap"
      style={{ backgroundColor: getRiskColor(level) }}
    >
      {level}
    </span>
  );
}

export function RiskRegisterTable({ risks }: RiskRegisterTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-ptba-navy text-white">
            <th className="px-3 py-3 text-left font-medium w-12">ID</th>
            <th className="px-3 py-3 text-center font-medium w-24">Tipe</th>
            <th className="px-3 py-3 text-left font-medium w-28">Kategori</th>
            <th className="px-3 py-3 text-left font-medium min-w-[180px]">Deskripsi Risiko</th>
            <th className="px-3 py-3 text-left font-medium min-w-[160px]">Penyebab</th>
            <th className="px-3 py-3 text-left font-medium min-w-[140px]">Dampak</th>
            {/* Inherent block */}
            <th className="px-3 py-3 text-center font-medium w-14 bg-orange-700/80">
              <span className="block text-[10px] leading-tight">P</span>
              <span className="block text-[10px] leading-tight">(I)</span>
            </th>
            <th className="px-3 py-3 text-center font-medium w-14 bg-orange-700/80">
              <span className="block text-[10px] leading-tight">D</span>
              <span className="block text-[10px] leading-tight">(I)</span>
            </th>
            <th className="px-3 py-3 text-center font-medium w-16 bg-orange-700/80">
              <span className="block text-[10px] leading-tight">Skor</span>
              <span className="block text-[10px] leading-tight">P×D (I)</span>
            </th>
            <th className="px-3 py-3 text-center font-medium w-24 bg-orange-700/80">
              <span className="block text-[10px] leading-tight">Level</span>
              <span className="block text-[10px] leading-tight">(Inheren)</span>
            </th>
            {/* Mitigations */}
            <th className="px-3 py-3 text-left font-medium min-w-[180px]">Mitigasi</th>
            {/* Residual block */}
            <th className="px-3 py-3 text-center font-medium w-14 bg-green-700/80">
              <span className="block text-[10px] leading-tight">P</span>
              <span className="block text-[10px] leading-tight">(R)</span>
            </th>
            <th className="px-3 py-3 text-center font-medium w-14 bg-green-700/80">
              <span className="block text-[10px] leading-tight">D</span>
              <span className="block text-[10px] leading-tight">(R)</span>
            </th>
            <th className="px-3 py-3 text-center font-medium w-16 bg-green-700/80">
              <span className="block text-[10px] leading-tight">Skor</span>
              <span className="block text-[10px] leading-tight">P×D (R)</span>
            </th>
            <th className="px-3 py-3 text-center font-medium w-24 bg-green-700/80">
              <span className="block text-[10px] leading-tight">Level</span>
              <span className="block text-[10px] leading-tight">(Residual)</span>
            </th>
            <th className="px-3 py-3 text-center font-medium w-20">
              <span className="block text-[10px] leading-tight">Penurunan</span>
              <span className="block text-[10px] leading-tight">Risiko</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {risks.map((risk, index) => {
            const inherentScore = risk.inherentProbability * risk.inherentImpact;
            const residualScore = risk.residualProbability * risk.residualImpact;
            const penurunan =
              inherentScore > 0
                ? ((inherentScore - residualScore) / inherentScore) * 100
                : 0;

            return (
              <tr
                key={risk.id}
                className={cn(
                  "border-b border-gray-100",
                  index % 2 === 0 ? "bg-white" : "bg-gray-50"
                )}
              >
                <td className="px-3 py-3 text-ptba-charcoal font-mono font-bold align-top">
                  {risk.id}
                </td>
                <td className="px-3 py-3 text-center align-top">
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                      risk.riskCategory === "mitra"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-purple-100 text-purple-700"
                    )}
                  >
                    {RISK_CATEGORY_LABELS[risk.riskCategory] ?? risk.riskCategory}
                  </span>
                </td>
                <td className="px-3 py-3 text-ptba-charcoal font-medium text-xs align-top">
                  {risk.category}
                </td>
                <td className="px-3 py-3 text-gray-700 text-xs align-top">
                  {risk.description}
                </td>
                <td className="px-3 py-3 text-xs align-top">
                  {risk.causes && risk.causes.length > 0 ? (
                    <ul className="list-disc list-inside text-gray-600 space-y-0.5">
                      {risk.causes.map((c, i) => (
                        <li key={i}>{c}</li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>
                <td className="px-3 py-3 text-gray-600 text-xs align-top">
                  {risk.impactDescription || <span className="text-gray-400">—</span>}
                </td>
                {/* Inherent */}
                <td className="px-3 py-3 text-center font-medium text-ptba-charcoal bg-orange-50/50 align-top">
                  {risk.inherentProbability}
                </td>
                <td className="px-3 py-3 text-center font-medium text-ptba-charcoal bg-orange-50/50 align-top">
                  {risk.inherentImpact}
                </td>
                <td className="px-3 py-3 text-center font-bold text-orange-700 bg-orange-50/50 align-top">
                  {inherentScore}
                </td>
                <td className="px-3 py-3 text-center bg-orange-50/50 align-top">
                  <RiskLevelBadge level={risk.inherentLevel} />
                </td>
                {/* Mitigations */}
                <td className="px-3 py-3 align-top">
                  <ul className="list-disc list-inside text-xs text-gray-600 space-y-0.5">
                    {risk.mitigations.map((m, i) => (
                      <li key={i}>{m}</li>
                    ))}
                  </ul>
                </td>
                {/* Residual */}
                <td className="px-3 py-3 text-center font-medium text-ptba-charcoal bg-green-50/50 align-top">
                  {risk.residualProbability}
                </td>
                <td className="px-3 py-3 text-center font-medium text-ptba-charcoal bg-green-50/50 align-top">
                  {risk.residualImpact}
                </td>
                <td className="px-3 py-3 text-center font-bold text-green-700 bg-green-50/50 align-top">
                  {residualScore}
                </td>
                <td className="px-3 py-3 text-center bg-green-50/50 align-top">
                  <RiskLevelBadge level={risk.residualLevel} />
                </td>
                {/* Penurunan */}
                <td className="px-3 py-3 text-center align-top">
                  {penurunan > 0 ? (
                    <span className="text-green-600 font-semibold text-xs">
                      ↓ {penurunan.toFixed(0)}%
                    </span>
                  ) : penurunan < 0 ? (
                    <span className="text-red-600 font-semibold text-xs">
                      ↑ {Math.abs(penurunan).toFixed(0)}%
                    </span>
                  ) : (
                    <span className="text-gray-400 text-xs">—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
        {risks.length > 0 && (
          <tfoot>
            <tr className="bg-ptba-navy/5 border-t-2 border-ptba-navy text-xs">
              <td colSpan={6} className="px-3 py-3 text-right font-bold text-ptba-navy">
                Rata-rata Penurunan Risiko
              </td>
              <td colSpan={4} className="px-3 py-3 bg-orange-50/50" />
              <td className="px-3 py-3" />
              <td colSpan={4} className="px-3 py-3 bg-green-50/50" />
              <td className="px-3 py-3 text-center font-extrabold text-green-700">
                {(
                  risks.reduce((sum, r) => {
                    const iScore = r.inherentProbability * r.inherentImpact;
                    const rScore = r.residualProbability * r.residualImpact;
                    return sum + (iScore > 0 ? ((iScore - rScore) / iScore) * 100 : 0);
                  }, 0) / risks.length
                ).toFixed(0)}
                %
              </td>
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}
