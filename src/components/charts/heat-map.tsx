"use client";

import { useState } from "react";

interface RiskItem {
  id: string;
  label: string;
  probability: number;
  impact: number;
  level: string;
}

interface HeatMapProps {
  risks: RiskItem[];
  title?: string;
  showLabels?: boolean;
}

const PROBABILITY_LABELS = [
  "Sangat Tinggi",
  "Tinggi",
  "Sedang",
  "Rendah",
  "Sangat Rendah",
];

const IMPACT_LABELS = [
  "Sangat Rendah",
  "Rendah",
  "Sedang",
  "Tinggi",
  "Sangat Tinggi",
];

function getCellColor(probability: number, impact: number): string {
  const value = probability * impact;
  if (value >= 20) return "#8B0000";
  if (value >= 15) return "#C8102E";
  if (value >= 10) return "#F7941D";
  if (value >= 5) return "#F2A900";
  return "#28A745";
}

function getCellTextColor(probability: number, impact: number): string {
  const value = probability * impact;
  if (value >= 10) return "#ffffff";
  return "#1A1A1A";
}

const LEGEND_ITEMS = [
  { label: "Low (1-4)", color: "#28A745" },
  { label: "Medium (5-9)", color: "#F2A900" },
  { label: "High (10-14)", color: "#F7941D" },
  { label: "Very High (15-19)", color: "#C8102E" },
  { label: "Critical (20-25)", color: "#8B0000" },
];

export default function HeatMap({
  risks,
  title,
  showLabels = true,
}: HeatMapProps) {
  const [hoveredRisk, setHoveredRisk] = useState<RiskItem | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  function getRisksInCell(prob: number, imp: number): RiskItem[] {
    return risks.filter((r) => r.probability === prob && r.impact === imp);
  }

  return (
    <div className="w-full">
      {title && (
        <h3 className="text-lg font-semibold text-[#1A1A1A] mb-4">{title}</h3>
      )}
      <div className="flex">
        {/* Y-axis label */}
        <div className="flex items-center mr-2">
          <span
            className="text-xs font-semibold text-[#1B3A5C] whitespace-nowrap"
            style={{
              writingMode: "vertical-rl",
              transform: "rotate(180deg)",
            }}
          >
            Probability
          </span>
        </div>

        {/* Y-axis tick labels */}
        <div className="flex flex-col">
          <div className="h-8" /> {/* Spacer for top alignment */}
          {PROBABILITY_LABELS.map((label, idx) => (
            <div
              key={idx}
              className="flex items-center justify-end pr-2"
              style={{ height: 64 }}
            >
              <span className="text-[11px] text-[#1A1A1A] text-right leading-tight w-16">
                {label}
              </span>
            </div>
          ))}
        </div>

        {/* Grid area */}
        <div className="flex-1">
          {/* Grid */}
          <div className="h-8" /> {/* Spacer */}
          <div
            className="grid relative"
            style={{
              gridTemplateColumns: "repeat(5, 1fr)",
              gridTemplateRows: "repeat(5, 64px)",
              gap: 2,
            }}
          >
            {/* Rows: probability 5 (top) to 1 (bottom) */}
            {[5, 4, 3, 2, 1].map((prob) =>
              [1, 2, 3, 4, 5].map((imp) => {
                const cellRisks = getRisksInCell(prob, imp);
                const bgColor = getCellColor(prob, imp);
                const textColor = getCellTextColor(prob, imp);
                return (
                  <div
                    key={`${prob}-${imp}`}
                    className="relative flex flex-wrap items-center justify-center rounded-sm"
                    style={{ backgroundColor: bgColor, minHeight: 64 }}
                  >
                    {cellRisks.map((risk) => (
                      <div
                        key={risk.id}
                        className="relative flex items-center justify-center w-7 h-7 rounded-full border-2 border-white/60 m-0.5 cursor-pointer transition-transform hover:scale-110"
                        style={{
                          backgroundColor: "rgba(255,255,255,0.25)",
                        }}
                        onMouseEnter={(e) => {
                          setHoveredRisk(risk);
                          const rect = e.currentTarget.getBoundingClientRect();
                          setTooltipPos({
                            x: rect.left + rect.width / 2,
                            y: rect.top,
                          });
                        }}
                        onMouseLeave={() => setHoveredRisk(null)}
                      >
                        <span
                          className="text-[10px] font-bold"
                          style={{ color: textColor }}
                        >
                          {risk.id}
                        </span>
                      </div>
                    ))}
                  </div>
                );
              })
            )}
          </div>

          {/* X-axis tick labels */}
          <div
            className="grid mt-1"
            style={{
              gridTemplateColumns: "repeat(5, 1fr)",
              gap: 2,
            }}
          >
            {IMPACT_LABELS.map((label, idx) => (
              <div key={idx} className="text-center">
                <span className="text-[11px] text-[#1A1A1A] leading-tight">
                  {label}
                </span>
              </div>
            ))}
          </div>

          {/* X-axis label */}
          <div className="text-center mt-2">
            <span className="text-xs font-semibold text-[#1B3A5C]">
              Impact
            </span>
          </div>
        </div>
      </div>

      {/* Tooltip */}
      {hoveredRisk && (
        <div
          className="fixed z-50 px-3 py-2 rounded-lg shadow-lg border border-gray-200 pointer-events-none"
          style={{
            backgroundColor: "#ffffff",
            left: tooltipPos.x,
            top: tooltipPos.y - 8,
            transform: "translate(-50%, -100%)",
          }}
        >
          <p className="text-xs font-bold text-[#1B3A5C]">
            {hoveredRisk.id}: {hoveredRisk.label}
          </p>
          <p className="text-[11px] text-[#1A1A1A]">
            Probability: {hoveredRisk.probability} | Impact:{" "}
            {hoveredRisk.impact}
          </p>
          <p className="text-[11px] text-[#1A1A1A]">
            Level: {hoveredRisk.level} (Score:{" "}
            {hoveredRisk.probability * hoveredRisk.impact})
          </p>
        </div>
      )}

      {/* Legend */}
      {showLabels && (
        <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
          {LEGEND_ITEMS.map((item) => (
            <div key={item.label} className="flex items-center gap-1.5">
              <div
                className="w-3.5 h-3.5 rounded-sm"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-[11px] text-[#1A1A1A]">{item.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
