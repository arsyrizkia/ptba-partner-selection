"use client";

import { useMemo, useState, useEffect } from "react";
import { Tabs } from "@/components/ui/tabs";
import { ApprovalCard } from "@/components/features/approval/approval-card";
import { useAuth } from "@/lib/auth/auth-context";
import { api } from "@/lib/api/client";
import type { Approval } from "@/lib/types";
import { Clock, CheckCircle2, ListChecks, Shield, Loader2 } from "lucide-react";

const PRIORITY_ORDER: Record<string, number> = {
  Tinggi: 0,
  Sedang: 1,
  Rendah: 2,
};

function mapApiApproval(a: any): Approval {
  const evalSummary = a.evaluation_summary
    ? (typeof a.evaluation_summary === "string" ? JSON.parse(a.evaluation_summary) : a.evaluation_summary)
    : null;

  const lolos = evalSummary ? evalSummary.filter((e: any) => e.result === "Lolos").length : 0;
  const tidakLolos = evalSummary ? evalSummary.filter((e: any) => e.result === "Tidak Lolos").length : 0;

  return {
    id: a.id,
    projectId: a.project_id,
    projectName: a.project_name,
    type: a.type === "phase1_evaluation" ? "Persetujuan Hasil Evaluasi Fase 1" : a.type,
    status: a.status,
    requestedBy: a.requested_by || "-",
    requestedAt: a.requested_at,
    approver: a.approver || "Direksi",
    approvedAt: a.approved_at,
    notes: a.notes,
    priority: a.priority,
    phase: a.phase,
    approvalCategory: a.approval_category === "Evaluasi Fase 1" ? "phase1_shortlist" : a.approval_category,
    evaluationSummary: evalSummary ? { totalMitra: evalSummary.length, lolos, tidakLolos } : undefined,
  };
}

function sortApprovals(approvals: Approval[]): Approval[] {
  return [...approvals].sort((a, b) => {
    const aIsPending = a.status === "Menunggu" ? 0 : 1;
    const bIsPending = b.status === "Menunggu" ? 0 : 1;
    if (aIsPending !== bIsPending) return aIsPending - bIsPending;
    const aPriority = PRIORITY_ORDER[a.priority] ?? 9;
    const bPriority = PRIORITY_ORDER[b.priority] ?? 9;
    if (aPriority !== bPriority) return aPriority - bPriority;
    return new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime();
  });
}

export default function ApprovalsPage() {
  const { accessToken } = useAuth();
  const [activeTab, setActiveTab] = useState("all");
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!accessToken) return;
    api<{ approvals: any[] }>("/approvals", { token: accessToken })
      .then((res) => {
        const mapped = (res.approvals || []).map(mapApiApproval);
        setApprovals(mapped);
      })
      .catch(() => setApprovals([]))
      .finally(() => setLoading(false));
  }, [accessToken]);

  const counts = useMemo(() => {
    const menunggu = approvals.filter((a) => a.status === "Menunggu").length;
    const phase1Pending = approvals.filter(
      (a) => a.status === "Menunggu" && a.phase === "phase1"
    ).length;
    const phase2Pending = approvals.filter(
      (a) => a.status === "Menunggu" && a.phase === "phase2"
    ).length;
    const selesai = approvals.filter(
      (a) => a.status === "Disetujui" || a.status === "Ditolak"
    ).length;
    const disetujui = approvals.filter((a) => a.status === "Disetujui").length;
    const ditolak = approvals.filter((a) => a.status === "Ditolak").length;
    const dikembalikan = approvals.filter((a) => a.status === "Dikembalikan").length;
    return { menunggu, phase1Pending, phase2Pending, selesai, disetujui, ditolak, dikembalikan };
  }, [approvals]);

  const filterTabs = useMemo(
    () => [
      { key: "all", label: `Semua (${approvals.length})` },
      { key: "Menunggu", label: `Menunggu (${counts.menunggu})` },
      { key: "Disetujui", label: `Disetujui (${counts.disetujui})` },
      { key: "Ditolak", label: `Ditolak (${counts.ditolak})` },
      { key: "Dikembalikan", label: `Perlu Revisi (${counts.dikembalikan})` },
    ],
    [approvals.length, counts]
  );

  const filteredApprovals = useMemo(() => {
    const filtered =
      activeTab === "all"
        ? approvals
        : approvals.filter((a) => a.status === activeTab);
    return sortApprovals(filtered);
  }, [activeTab, approvals]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-ptba-steel-blue" />
        <span className="ml-3 text-ptba-gray">Memuat...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ptba-charcoal">Persetujuan</h1>
        <p className="text-sm text-ptba-gray mt-1">
          Kelola persetujuan proyek, evaluasi, dan shortlist mitra.
        </p>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl bg-white p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100">
              <Clock className="h-4.5 w-4.5 text-amber-600" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-ptba-gray">Menunggu</p>
              <p className="text-xl font-bold text-amber-600">{counts.menunggu}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-ptba-navy/10">
              <ListChecks className="h-4.5 w-4.5 text-ptba-navy" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-ptba-gray">Fase 1 Pending</p>
              <p className="text-xl font-bold text-ptba-navy">{counts.phase1Pending}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-ptba-steel-blue/10">
              <Shield className="h-4.5 w-4.5 text-ptba-steel-blue" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-ptba-gray">Fase 2 Pending</p>
              <p className="text-xl font-bold text-ptba-steel-blue">{counts.phase2Pending}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-100">
              <CheckCircle2 className="h-4.5 w-4.5 text-green-600" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-ptba-gray">Selesai</p>
              <p className="text-xl font-bold text-green-600">{counts.selesai}</p>
            </div>
          </div>
        </div>
      </div>

      <Tabs tabs={filterTabs} activeTab={activeTab} onTabChange={setActiveTab} />

      {filteredApprovals.length === 0 ? (
        <div className="rounded-xl bg-white p-12 shadow-sm text-center">
          <Clock className="h-10 w-10 text-ptba-light-gray mx-auto mb-3" />
          <p className="text-ptba-gray">Tidak ada persetujuan untuk ditampilkan.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredApprovals.map((approval) => (
            <ApprovalCard key={approval.id} approval={approval} />
          ))}
        </div>
      )}
    </div>
  );
}
