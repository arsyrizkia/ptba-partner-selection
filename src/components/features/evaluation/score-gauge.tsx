"use client";

import { getGradeColor } from "@/lib/utils/scoring";

interface ScoreGaugeProps {
  score: number;
  grade: string;
}

export function ScoreGauge({ score, grade }: ScoreGaugeProps) {
  const color = getGradeColor(grade);

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center border-4"
        style={{ borderColor: color }}
      >
        <span
          className="text-2xl font-extrabold"
          style={{ color }}
        >
          {grade}
        </span>
      </div>
      <span className="text-lg font-semibold text-ptba-charcoal">
        {score.toFixed(1)}
      </span>
    </div>
  );
}
