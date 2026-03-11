"use client";

import { useParams, useRouter } from "next/navigation";
import { useMemo, useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DisposisiForm } from "@/components/features/approval/disposisi-form";
import { mockApprovals } from "@/lib/mock-data";
import { mockEvaluations } from "@/lib/mock-data/evaluations";
import { mockPartners } from "@/lib/mock-data/partners";
import { formatDate } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import {
  ArrowLeft,
  FileText,
  User,
  Clock,
  Shield,
  Building2,
} from "lucide-react";
import Link from "next/link";

function getPriorityVariant(priority: string) {
  switch (priority) {
    case "Tinggi":
      return "error" as const;
    case "Sedang":
      return "warning" as const;
    case "Rendah":
      return "neutral" as const;
    default:
      return "neutral" as const;
  }
}

function getStatusVariant(status: string) {
  switch (status) {
    case "Menunggu":
      return "warning" as const;
    case "Disetujui":
      return "success" as const;
    case "Ditolak":
      return "error" as const;
    case "Dikembalikan":
      return "info" as const;
    default:
      return "neutral" as const;
  }
}

export default function ApprovalDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const approval = useMemo(
    () => mockApprovals.find((a) => a.id === id),
    [id]
  );

  // Redirect Phase 1 shortlist approvals to the dedicated page
  useEffect(() => {
    if (approval?.approvalCategory === "phase1_shortlist") {
      router.replace(`/projects/${approval.projectId}/approval/phase1`);
    }
  }, [approval, router]);

  const [submitted, setSubmitted] = useState(false);

  // Get evaluations for this project's mitra, sorted by score
  const projectEvals = useMemo(() => {
    if (!approval) return [];
    return mockEvaluations
      .filter((e) => e.projectId === approval.projectId)
      .sort((a, b) => (b.totalScore ?? 0) - (a.totalScore ?? 0));
  }, [approval]);

  // Show loading state while redirecting
  if (approval?.approvalCategory === "phase1_shortlist") {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-ptba-gray">Mengalihkan ke halaman persetujuan Phase 1...</p>
      </div>
    );
  }

  if (!approval) {
    return (
      <div className="space-y-6">
        <Link
          href="/approvals"
          className="inline-flex items-center gap-1 text-sm text-ptba-steel-blue hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Antrian Persetujuan
        </Link>
        <Card padding="lg">
          <p className="text-center text-ptba-gray">
            Persetujuan dengan ID &quot;{id}&quot; tidak ditemukan.
          </p>
        </Card>
      </div>
    );
  }

  const handleDisposisi = (decision: string, notes: string) => {
    setSubmitted(true);
    // In production, this would submit to an API
    console.log("Disposisi:", { id, decision, notes });
  };

  const isPhase2 = approval.phase === "phase2";

  return (
    <div className="space-y-6">
      <Link
        href="/approvals"
        className="inline-flex items-center gap-1 text-sm text-ptba-steel-blue hover:underline"
      >
        <ArrowLeft className="h-4 w-4" />
        Kembali ke Antrian Persetujuan
      </Link>

      <h1 className="text-2xl font-bold text-ptba-charcoal">
        Detail Persetujuan
      </h1>

      {/* Full Context Card */}
      <Card accent="gold" padding="lg">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-semibold text-ptba-charcoal">
              {approval.projectName}
            </h2>
            <p className="text-sm text-ptba-gray mt-1">{approval.type}</p>
          </div>
          <div className="flex gap-2">
            {approval.phase && (
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold text-white ${
                  approval.phase === "phase1" ? "bg-ptba-navy" : "bg-ptba-steel-blue"
                }`}
              >
                {approval.phase === "phase1" ? "Fase 1" : "Fase 2"}
              </span>
            )}
            <Badge variant={getPriorityVariant(approval.priority)}>
              {approval.priority}
            </Badge>
            <Badge variant={getStatusVariant(approval.status)}>
              {approval.status}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex items-start gap-3">
            <FileText className="h-5 w-5 text-ptba-steel-blue mt-0.5" />
            <div>
              <p className="text-xs text-ptba-gray">ID Persetujuan</p>
              <p className="text-sm font-medium text-ptba-charcoal">
                {approval.id}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <User className="h-5 w-5 text-ptba-steel-blue mt-0.5" />
            <div>
              <p className="text-xs text-ptba-gray">Diminta Oleh</p>
              <p className="text-sm font-medium text-ptba-charcoal">
                {approval.requestedBy}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 text-ptba-steel-blue mt-0.5" />
            <div>
              <p className="text-xs text-ptba-gray">Tanggal Permintaan</p>
              <p className="text-sm font-medium text-ptba-charcoal">
                {formatDate(approval.requestedAt)}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-ptba-steel-blue mt-0.5" />
            <div>
              <p className="text-xs text-ptba-gray">Approver</p>
              <p className="text-sm font-medium text-ptba-charcoal">
                {approval.approver}
              </p>
            </div>
          </div>
        </div>

        {approval.approvedAt && (
          <div className="mt-4 pt-4 border-t border-ptba-light-gray">
            <p className="text-sm text-ptba-gray">
              Diproses pada:{" "}
              <span className="font-medium text-ptba-charcoal">
                {formatDate(approval.approvedAt)}
              </span>
            </p>
          </div>
        )}

        {approval.notes && (
          <div className="mt-4 pt-4 border-t border-ptba-light-gray">
            <p className="text-xs text-ptba-gray mb-1">Catatan</p>
            <p className="text-sm text-ptba-charcoal">{approval.notes}</p>
          </div>
        )}
      </Card>

      {/* Mitra Direkomendasikan — only show for Phase 2 approvals */}
      {isPhase2 && (
        <Card padding="lg">
          <h3 className="text-lg font-semibold text-ptba-charcoal mb-4 flex items-center gap-2">
            <Building2 className="h-5 w-5 text-ptba-steel-blue" />
            Mitra Direkomendasikan
          </h3>
          {projectEvals.length > 0 ? (
            <div className="space-y-3">
              {projectEvals.map((ev, index) => {
                const partner = mockPartners.find((p) => p.id === ev.partnerId);
                return (
                  <div key={ev.id} className="rounded-xl border border-ptba-light-gray p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <span className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold",
                          index === 0 ? "bg-ptba-gold/20 text-ptba-gold" :
                          index === 1 ? "bg-gray-200 text-gray-600" :
                          "bg-amber-100 text-amber-700"
                        )}>
                          {index + 1}
                        </span>
                        <div>
                          <p className="font-semibold text-ptba-charcoal">{ev.partnerName}</p>
                          <p className="text-xs text-ptba-gray">{partner?.code ?? ev.partnerId}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-ptba-navy">{(ev.totalScore ?? 0).toFixed(1)}</p>
                        <span className={cn(
                          "inline-block rounded-full px-2 py-0.5 text-[10px] font-bold",
                          ev.grade === "A" ? "bg-green-100 text-green-700" :
                          ev.grade === "B" ? "bg-blue-100 text-blue-700" :
                          "bg-amber-100 text-amber-700"
                        )}>
                          Grade {ev.grade ?? "-"}
                        </span>
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                      <div className="rounded-lg bg-ptba-section-bg p-2.5 text-center">
                        <p className="text-[10px] text-ptba-gray">Teknis</p>
                        <p className="text-sm font-bold text-ptba-charcoal">{(ev.technical?.total ?? 0).toFixed(2)} / 5</p>
                      </div>
                      <div className="rounded-lg bg-ptba-section-bg p-2.5 text-center">
                        <p className="text-[10px] text-ptba-gray">Keuangan (KEP-100)</p>
                        <p className="text-sm font-bold text-ptba-charcoal">{(ev.financial?.totalScore ?? 0).toFixed(1)}</p>
                        <p className="text-[10px] text-ptba-gray">Grade {ev.financial?.grade ?? "-"}</p>
                      </div>
                      <div className="rounded-lg bg-ptba-section-bg p-2.5 text-center">
                        <p className="text-[10px] text-ptba-gray">Hukum</p>
                        <p className={cn("text-sm font-bold",
                          ev.legal?.overallStatus === "Lulus" ? "text-green-600" :
                          ev.legal?.overallStatus === "Bersyarat" ? "text-amber-600" : "text-red-600"
                        )}>{ev.legal?.overallStatus ?? "-"}</p>
                      </div>
                      <div className="rounded-lg bg-ptba-section-bg p-2.5 text-center">
                        <p className="text-[10px] text-ptba-gray">Risiko</p>
                        <p className={cn("text-sm font-bold",
                          ev.risk?.overallLevel === "Rendah" ? "text-green-600" :
                          ev.risk?.overallLevel === "Sedang" ? "text-amber-600" : "text-red-600"
                        )}>{ev.risk?.overallLevel ?? "-"}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-ptba-gray text-center py-4">
              Belum ada data evaluasi mitra untuk proyek ini.
            </p>
          )}
        </Card>
      )}

      {/* Disposisi Form */}
      {approval.status === "Menunggu" && !submitted && (
        <Card padding="lg">
          <DisposisiForm onSubmit={handleDisposisi} />
        </Card>
      )}

      {submitted && (
        <Card accent="gold" padding="lg">
          <div className="text-center py-4">
            <Badge variant="success" className="text-sm px-4 py-1.5">
              Disposisi Berhasil Dikirim
            </Badge>
            <p className="text-sm text-ptba-gray mt-3">
              Disposisi Anda telah tercatat dan akan diproses oleh sistem.
            </p>
            <Link href="/approvals">
              <Button variant="navy" className="mt-4">
                Kembali ke Antrian
              </Button>
            </Link>
          </div>
        </Card>
      )}
    </div>
  );
}
