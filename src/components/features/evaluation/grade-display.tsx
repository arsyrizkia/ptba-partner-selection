"use client";

import { getGradeColor } from "@/lib/utils/scoring";

interface GradeDisplayProps {
  grade: string;
  score: number;
  description: string;
}

export function GradeDisplay({ grade, score, description }: GradeDisplayProps) {
  const color = getGradeColor(grade);

  return (
    <div
      className="rounded-xl p-6 flex flex-col items-center gap-3"
      style={{ backgroundColor: `${color}18` }}
    >
      <div
        className="w-24 h-24 rounded-full flex items-center justify-center"
        style={{ backgroundColor: color }}
      >
        <span className="text-3xl font-extrabold text-white">
          {grade}
        </span>
      </div>
      <div className="text-center">
        <p className="text-2xl font-bold text-ptba-charcoal">
          {score.toFixed(2)}
        </p>
        <p className="text-sm font-medium mt-1" style={{ color }}>
          {description}
        </p>
      </div>
    </div>
  );
}
