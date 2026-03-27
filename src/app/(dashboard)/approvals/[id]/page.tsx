"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DisposisiForm } from "@/components/features/approval/disposisi-form";
import { useAuth } from "@/lib/auth/auth-context";
import { api } from "@/lib/api/client";
import { formatDate } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import {
  ArrowLeft,
  FileText,
  User,
  Clock,
  Shield,
  Building2,
  Loader2,
  CheckCircle2,
  XCircle,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";

function getPriorityVariant(priority: string) {
  switch (priority) {
    case "Tinggi": return "error" as const;
    case "Sedang": return "warning" as const;
    case "Rendah": return "neutral" as const;
    default: return "neutral" as const;
  }
}

function getStatusVariant(status: string) {
  switch (status) {
    case "Menunggu": return "warning" as const;
    case "Disetujui": return "success" as const;
    case "Ditolak": return "error" as const;
    case "Dikembalikan": return "info" as const;
    default: return "neutral" as const;
  }
}

export default function ApprovalDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { accessToken, role } = useAuth();

  const [approval, setApproval] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!accessToken) return;
    api<{ approval: any }>(`/approvals/${id}`, { token: accessToken })
      .then((res) => setApproval(res.approval))
      .catch(() => setApproval(null))
      .finally(() => setLoading(false));
  }, [id, accessToken]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-ptba-steel-blue" />
        <span className="ml-3 text-ptba-gray">Memuat...</span>
      </div>
    );
  }

  if (!approval) {
    return (
      <div className="space-y-6">
        <Link href="/approvals" className="inline-flex items-center gap-1 text-sm text-ptba-steel-blue hover:underline">
          <ArrowLeft className="h-4 w-4" /> Kembali ke Antrian Persetujuan
        </Link>
        <Card padding="lg">
          <p className="text-center text-ptba-gray">Persetujuan dengan ID &quot;{id}&quot; tidak ditemukan.</p>
        </Card>
      </div>
    );
  }

  // Parse evaluation summary
  const evalSummary: any[] = approval.evaluation_summary
    ? (typeof approval.evaluation_summary === "string" ? JSON.parse(approval.evaluation_summary) : approval.evaluation_summary)
    : [];

  const lolosCount = evalSummary.filter((e) => e.result === "Lolos").length;
  const tidakLolosCount = evalSummary.filter((e) => e.result === "Tidak Lolos").length;

  const handleDisposisi = async (decision: string, notes: string) => {
    if (!accessToken) return;
    setSubmitting(true);
    try {
      await api(`/approvals/${id}/decide`, {
        method: "PUT",
        token: accessToken,
        body: { status: decision, notes },
      });
      setSubmitted(true);
      // Refresh approval data
      const res = await api<{ approval: any }>(`/approvals/${id}`, { token: accessToken });
      setApproval(res.approval);
    } catch {
      alert("Gagal mengirim disposisi. Silakan coba lagi.");
    } finally {
      setSubmitting(false);
    }
  };

  const phase = approval.phase;
  const typeLabel = approval.type === "phase1_evaluation"
    ? "Persetujuan Hasil Evaluasi Tahap 1"
    : approval.approval_category || approval.type;

  return (
    <div className="space-y-6">
      <Link href="/approvals" className="inline-flex items-center gap-1 text-sm text-ptba-steel-blue hover:underline">
        <ArrowLeft className="h-4 w-4" /> Kembali ke Antrian Persetujuan
      </Link>

      <h1 className="text-2xl font-bold text-ptba-charcoal">Detail Persetujuan</h1>

      {/* Context Card */}
      <Card accent="gold" padding="lg">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-semibold text-ptba-charcoal">{approval.project_name}</h2>
            <p className="text-sm text-ptba-gray mt-1">{typeLabel}</p>
          </div>
          <div className="flex gap-2">
            {phase && (
              <span className={cn(
                "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold text-white",
                phase === "phase1" ? "bg-ptba-navy" : "bg-ptba-steel-blue"
              )}>
                {phase === "phase1" ? "Evaluasi" : phase === "phase2" ? "PQ" : "Proposal & FRP"}
              </span>
            )}
            <Badge variant={getPriorityVariant(approval.priority)}>{approval.priority}</Badge>
            <Badge variant={getStatusVariant(approval.status)}>{approval.status}</Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex items-start gap-3">
            <FileText className="h-5 w-5 text-ptba-steel-blue mt-0.5" />
            <div>
              <p className="text-xs text-ptba-gray">ID Persetujuan</p>
              <p className="text-sm font-medium text-ptba-charcoal truncate max-w-[180px]">{approval.id.substring(0, 8)}...</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <User className="h-5 w-5 text-ptba-steel-blue mt-0.5" />
            <div>
              <p className="text-xs text-ptba-gray">Diminta Oleh</p>
              <p className="text-sm font-medium text-ptba-charcoal">{approval.requested_by || "-"}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 text-ptba-steel-blue mt-0.5" />
            <div>
              <p className="text-xs text-ptba-gray">Tanggal Permintaan</p>
              <p className="text-sm font-medium text-ptba-charcoal">{formatDate(approval.requested_at)}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-ptba-steel-blue mt-0.5" />
            <div>
              <p className="text-xs text-ptba-gray">Approver</p>
              <p className="text-sm font-medium text-ptba-charcoal">{approval.approver || "Ketua Tim"}</p>
            </div>
          </div>
        </div>

        {approval.approved_at && (
          <div className="mt-4 pt-4 border-t border-ptba-light-gray">
            <p className="text-sm text-ptba-gray">
              Diproses pada: <span className="font-medium text-ptba-charcoal">{formatDate(approval.approved_at)}</span>
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

      {/* Evaluation Summary — show mitra scores */}
      {evalSummary.length > 0 && (
        <Card padding="lg">
          <h3 className="text-lg font-semibold text-ptba-charcoal mb-4 flex items-center gap-2">
            <Building2 className="h-5 w-5 text-ptba-steel-blue" />
            Hasil Evaluasi Mitra
          </h3>

          {/* Summary counts */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="rounded-lg bg-ptba-section-bg p-3 text-center">
              <p className="text-2xl font-bold text-ptba-navy">{evalSummary.length}</p>
              <p className="text-xs text-ptba-gray">Total Mitra</p>
            </div>
            <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-center">
              <p className="text-2xl font-bold text-green-600">{lolosCount}</p>
              <p className="text-xs text-green-700">Lolos</p>
            </div>
            <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-center">
              <p className="text-2xl font-bold text-ptba-red">{tidakLolosCount}</p>
              <p className="text-xs text-ptba-red">Tidak Lolos</p>
            </div>
          </div>

          {/* Mitra list */}
          <div className="space-y-3">
            {evalSummary
              .sort((a, b) => (b.weightedScore || 0) - (a.weightedScore || 0))
              .map((ev, index) => (
                <div key={ev.applicationId} className="rounded-xl border border-ptba-light-gray p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold",
                        index === 0 ? "bg-ptba-gold/20 text-ptba-gold" : "bg-gray-200 text-gray-600"
                      )}>
                        {index + 1}
                      </span>
                      <div>
                        <p className="font-semibold text-ptba-charcoal">{ev.partnerName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-xl font-bold text-ptba-navy">
                          {typeof ev.weightedScore === "number" ? ev.weightedScore.toFixed(2) : ev.weightedScore}
                        </p>
                        <p className="text-[10px] text-ptba-gray">/ 5.00</p>
                      </div>
                      <span className={cn(
                        "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold",
                        ev.result === "Lolos"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-600"
                      )}>
                        {ev.result === "Lolos" ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                        {ev.result}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </Card>
      )}

      {/* Phase 1: link to detailed approval page instead of inline form */}
      {approval.status === "Menunggu" && !submitted && (role === "ketua_tim" || role === "super_admin") && approval.phase === "phase1" && (
        <Card padding="lg">
          <div className="text-center py-4">
            <ShieldCheck className="h-10 w-10 text-ptba-navy mx-auto mb-3" />
            <p className="text-sm font-semibold text-ptba-charcoal">Review dan berikan keputusan untuk setiap mitra</p>
            <p className="text-xs text-ptba-gray mt-1 mb-4">Buka halaman persetujuan detail untuk mereview hasil filtrasi per mitra.</p>
            <Link
              href={`/projects/${approval.project_id}/approval/phase1`}
              className="inline-flex items-center gap-2 rounded-lg bg-ptba-navy px-5 py-2.5 text-sm font-medium text-white hover:bg-ptba-navy/90 transition-colors"
            >
              <ShieldCheck className="h-4 w-4" />
              Buka Persetujuan Detail
            </Link>
          </div>
        </Card>
      )}

      {/* Non-phase1 disposisi form */}
      {approval.status === "Menunggu" && !submitted && (role === "ketua_tim" || role === "super_admin") && approval.phase !== "phase1" && (
        <Card padding="lg">
          <DisposisiForm onSubmit={handleDisposisi} />
        </Card>
      )}

      {/* Non-ketua_tim viewing pending */}
      {approval.status === "Menunggu" && role !== "ketua_tim" && role !== "super_admin" && (
        <Card padding="lg">
          <div className="text-center py-4">
            <Clock className="h-10 w-10 text-amber-500 mx-auto mb-3" />
            <p className="text-sm font-medium text-ptba-charcoal">Menunggu Keputusan Ketua Tim</p>
            <p className="text-xs text-ptba-gray mt-1">Persetujuan ini sedang menunggu disposisi dari Ketua Tim.</p>
          </div>
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

      {/* Already decided */}
      {approval.status !== "Menunggu" && !submitted && (
        <Card padding="lg">
          <div className="text-center py-4">
            <Badge variant={getStatusVariant(approval.status)} className="text-sm px-4 py-1.5">
              {approval.status}
            </Badge>
            {approval.approved_at && (
              <p className="text-sm text-ptba-gray mt-3">
                Diproses pada {formatDate(approval.approved_at)}
              </p>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
