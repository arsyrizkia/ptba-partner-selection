"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress-bar";
import { formatCurrency } from "@/lib/utils/format";
import type { Project } from "@/lib/types";

interface ProjectCardProps {
  project: Project;
  onClick?: () => void;
}

function getStatusVariant(
  status: Project["status"]
): "success" | "warning" | "error" | "info" | "neutral" {
  switch (status) {
    case "Evaluasi":
      return "info";
    case "Persetujuan":
      return "warning";
    case "Selesai":
      return "success";
    case "Dibatalkan":
      return "error";
    case "Draft":
    default:
      return "neutral";
  }
}

const TYPE_LABELS: Record<string, string> = {
  mining: "Pertambangan",
  power_generation: "Pembangkit Listrik",
  coal_processing: "Pengolahan Batubara",
  infrastructure: "Infrastruktur",
  environmental: "Lingkungan",
  corporate: "Korporat",
  others: "Lainnya",
};

function getTypeVariant(
  type: Project["type"]
): "info" | "warning" | "neutral" {
  switch (type) {
    case "power_generation":
    case "infrastructure":
      return "info";
    case "mining":
    case "coal_processing":
      return "warning";
    default:
      return "neutral";
  }
}

export function ProjectCard({ project, onClick }: ProjectCardProps) {
  const progress = Math.round(
    (project.currentStep / project.totalSteps) * 100
  );

  return (
    <Card
      className="cursor-pointer transition-shadow hover:shadow-md"
      accent="gold"
      padding="md"
    >
      <div onClick={onClick}>
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-sm font-semibold text-ptba-charcoal line-clamp-2">
            {project.name}
          </h3>
          <Badge variant={getTypeVariant(project.type)}>{TYPE_LABELS[project.type] || project.type}</Badge>
        </div>

        <p className="text-lg font-bold text-ptba-navy mb-2">
          {formatCurrency(project.capexValue)}
        </p>

        <div className="flex items-center justify-between mb-3">
          <Badge variant={getStatusVariant(project.status)}>
            {project.status}
          </Badge>
          <span className="text-xs text-ptba-gray">
            {project.currentStep}/{project.totalSteps} langkah
          </span>
        </div>

        <ProgressBar
          value={progress}
          color={progress === 100 ? "green" : progress >= 50 ? "navy" : "gold"}
          showPercent
        />
      </div>
    </Card>
  );
}
