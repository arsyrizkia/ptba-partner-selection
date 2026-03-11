"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils/format";
import type { Approval } from "@/lib/types";
import {
  Clock,
  User,
  ChevronRight,
  ListChecks,
  Trophy,
  ClipboardCheck,
  FolderOpen,
  Rocket,
  XCircle,
  Users,
  ArrowRight,
  CheckCircle2,
  RotateCcw,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";

interface ApprovalCardProps {
  approval: Approval;
}

function getPriorityVariant(priority: Approval["priority"]) {
  switch (priority) {
    case "Tinggi":
      return "error";
    case "Sedang":
      return "warning";
    case "Rendah":
      return "neutral";
  }
}

function getStatusConfig(status: Approval["status"]) {
  switch (status) {
    case "Menunggu":
      return { variant: "warning" as const, label: "Menunggu Keputusan" };
    case "Disetujui":
      return { variant: "success" as const, label: "Disetujui" };
    case "Ditolak":
      return { variant: "error" as const, label: "Ditolak" };
    case "Dikembalikan":
      return { variant: "info" as const, label: "Perlu Revisi" };
  }
}

function getCategoryIcon(category?: Approval["approvalCategory"]) {
  switch (category) {
    case "phase1_shortlist":
      return <ListChecks className="h-4 w-4" />;
    case "phase2_final":
      return <Trophy className="h-4 w-4" />;
    case "evaluasi":
      return <ClipboardCheck className="h-4 w-4" />;
    case "inisiasi":
      return <Rocket className="h-4 w-4" />;
    case "dokumen":
      return <FolderOpen className="h-4 w-4" />;
    case "penutupan":
      return <XCircle className="h-4 w-4" />;
    default:
      return <ClipboardCheck className="h-4 w-4" />;
  }
}

function getCardHref(approval: Approval): string {
  if (approval.approvalCategory === "phase1_shortlist") {
    return `/projects/${approval.projectId}/approval/phase1`;
  }
  return `/approvals/${approval.id}`;
}

export function ApprovalCard({ approval }: ApprovalCardProps) {
  const href = getCardHref(approval);
  const isPending = approval.status === "Menunggu";
  const statusConfig = getStatusConfig(approval.status);

  return (
    <Link href={href} className="group block">
      <Card
        accent={isPending ? "gold" : undefined}
        padding="md"
        className={cn(
          "flex flex-col justify-between transition-shadow hover:shadow-md",
          isPending && "ring-1 ring-ptba-gold/30"
        )}
      >
        <div>
          {/* Top row: phase badge + priority + status */}
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              {approval.phase && (
                <span
                  className={cn(
                    "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold text-white",
                    approval.phase === "phase1" ? "bg-ptba-navy" : "bg-ptba-steel-blue"
                  )}
                >
                  {approval.phase === "phase1" ? "Fase 1" : "Fase 2"}
                </span>
              )}
              <Badge variant={getPriorityVariant(approval.priority)}>
                {approval.priority}
              </Badge>
            </div>
            <Badge variant={statusConfig.variant}>
              {statusConfig.label}
            </Badge>
          </div>

          {/* Project name */}
          <h3 className="text-sm font-semibold text-ptba-charcoal leading-tight mb-1 group-hover:text-ptba-navy transition-colors">
            {approval.projectName}
          </h3>

          {/* Type with icon */}
          <div className="flex items-center gap-2 text-xs text-ptba-gray mb-3">
            {getCategoryIcon(approval.approvalCategory)}
            <span className="truncate">{approval.type}</span>
          </div>

          {/* Meta row */}
          <div className="flex items-center gap-4 text-xs text-ptba-gray mb-3">
            <span className="inline-flex items-center gap-1">
              <User className="h-3.5 w-3.5" />
              {approval.requestedBy}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {formatDate(approval.requestedAt)}
            </span>
          </div>

          {/* Evaluation summary */}
          {approval.evaluationSummary && (
            <div className="flex items-center gap-2 text-xs mb-3 rounded-lg bg-ptba-section-bg px-3 py-2">
              <Users className="h-3.5 w-3.5 text-ptba-gray flex-shrink-0" />
              <span className="text-ptba-gray">
                {approval.evaluationSummary.totalMitra} mitra:{" "}
                <span className="font-semibold text-green-600">
                  {approval.evaluationSummary.lolos} Lolos
                </span>
                {approval.evaluationSummary.tidakLolos > 0 && (
                  <>
                    ,{" "}
                    <span className="font-semibold text-ptba-red">
                      {approval.evaluationSummary.tidakLolos} Tidak Lolos
                    </span>
                  </>
                )}
              </span>
            </div>
          )}

          {/* Result banner for resolved items */}
          {approval.status === "Disetujui" && approval.approvalCategory === "phase1_shortlist" && (
            <div className="flex items-center gap-2 text-xs mb-3 rounded-lg bg-green-50 border border-green-200 px-3 py-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-green-600 flex-shrink-0" />
              <span className="text-green-700 font-medium">
                Disetujui — Mitra lolos lanjut ke Fase 2
              </span>
            </div>
          )}
          {approval.status === "Disetujui" && approval.approvalCategory === "phase2_final" && (
            <div className="flex items-center gap-2 text-xs mb-3 rounded-lg bg-green-50 border border-green-200 px-3 py-2">
              <Trophy className="h-3.5 w-3.5 text-green-600 flex-shrink-0" />
              <span className="text-green-700 font-medium">
                Disetujui — Mitra terpilih ditetapkan
              </span>
            </div>
          )}
          {approval.status === "Dikembalikan" && (
            <div className="flex items-center gap-2 text-xs mb-3 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2">
              <RotateCcw className="h-3.5 w-3.5 text-amber-600 flex-shrink-0" />
              <span className="text-amber-700 font-medium">
                Dikembalikan untuk revisi oleh tim evaluasi
              </span>
            </div>
          )}
          {approval.status === "Ditolak" && (
            <div className="flex items-center gap-2 text-xs mb-3 rounded-lg bg-red-50 border border-red-200 px-3 py-2">
              <XCircle className="h-3.5 w-3.5 text-red-600 flex-shrink-0" />
              <span className="text-red-700 font-medium">
                Ditolak oleh Direksi
              </span>
            </div>
          )}

          {/* Notes */}
          {approval.notes && (
            <p className="text-xs text-ptba-gray mb-4 line-clamp-2">
              {approval.notes}
            </p>
          )}
        </div>

        {/* CTA footer */}
        <div className={cn(
          "flex items-center justify-between pt-3 border-t",
          isPending ? "border-ptba-gold/20" : "border-ptba-light-gray"
        )}>
          {isPending ? (
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-ptba-navy group-hover:text-ptba-steel-blue transition-colors">
              Review & Putuskan
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </span>
          ) : (
            <span className="inline-flex items-center gap-2 text-sm font-medium text-ptba-gray group-hover:text-ptba-navy transition-colors">
              Lihat Detail
              <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </span>
          )}
          {approval.approvedAt && (
            <span className="inline-flex items-center gap-1 text-[10px] text-ptba-gray">
              <CheckCircle2 className="h-3 w-3" />
              {formatDate(approval.approvedAt)}
            </span>
          )}
        </div>
      </Card>
    </Link>
  );
}
