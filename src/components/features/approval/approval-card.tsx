"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils/format";
import type { Approval } from "@/lib/types";
import { Clock, User, FileText, ChevronRight } from "lucide-react";
import Link from "next/link";

interface ApprovalCardProps {
  approval: Approval;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  onReturn?: (id: string) => void;
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

function getStatusVariant(status: Approval["status"]) {
  switch (status) {
    case "Menunggu":
      return "warning";
    case "Disetujui":
      return "success";
    case "Ditolak":
      return "error";
    case "Dikembalikan":
      return "info";
  }
}

export function ApprovalCard({
  approval,
  onApprove,
  onReject,
  onReturn,
}: ApprovalCardProps) {
  return (
    <Card accent="gold" padding="md" className="flex flex-col justify-between">
      <div>
        <Link href={`/approvals/${approval.id}`} className="group block mb-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-semibold text-ptba-charcoal leading-tight group-hover:text-ptba-steel-blue transition-colors">
              {approval.projectName}
            </h3>
            <div className="flex items-center gap-2 shrink-0">
              <Badge variant={getPriorityVariant(approval.priority)}>
                {approval.priority}
              </Badge>
              <ChevronRight className="h-4 w-4 text-ptba-gray group-hover:text-ptba-steel-blue transition-colors" />
            </div>
          </div>
        </Link>

        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-ptba-gray">
            <FileText className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">{approval.type}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-ptba-gray">
            <User className="h-4 w-4 flex-shrink-0" />
            <span>Diminta oleh: {approval.requestedBy}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-ptba-gray">
            <Clock className="h-4 w-4 flex-shrink-0" />
            <span>{formatDate(approval.requestedAt)}</span>
          </div>
        </div>

        <div className="mb-4">
          <Badge variant={getStatusVariant(approval.status)}>
            {approval.status}
          </Badge>
        </div>

        {approval.notes && (
          <p className="text-xs text-ptba-gray mb-4 line-clamp-2">
            {approval.notes}
          </p>
        )}
      </div>

      {approval.status === "Menunggu" && (
        <div className="flex gap-2 pt-3 border-t border-ptba-light-gray">
          <Button
            size="sm"
            variant="ghost"
            className="flex-1 !bg-ptba-green !text-white hover:!opacity-90"
            onClick={() => onApprove?.(approval.id)}
          >
            Setuju
          </Button>
          <Button
            size="sm"
            variant="red"
            className="flex-1"
            onClick={() => onReject?.(approval.id)}
          >
            Tolak
          </Button>
          <Button
            size="sm"
            variant="gold"
            className="flex-1"
            onClick={() => onReturn?.(approval.id)}
          >
            Kembalikan
          </Button>
        </div>
      )}
    </Card>
  );
}
