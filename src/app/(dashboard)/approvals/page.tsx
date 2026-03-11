"use client";

import { useMemo, useState } from "react";
import { Tabs } from "@/components/ui/tabs";
import { ApprovalCard } from "@/components/features/approval/approval-card";
import { mockApprovals } from "@/lib/mock-data";
import type { Approval } from "@/lib/types";
import { Clock, CheckCircle2, ListChecks, Shield } from "lucide-react";

const PRIORITY_ORDER: Record<string, number> = {
  Tinggi: 0,
  Sedang: 1,
  Rendah: 2,
};

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
  const [activeTab, setActiveTab] = useState("all");
  const approvals = mockApprovals;

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
              <p className="text-[10px] uppercase tracking-wider text-ptba-gray">
                Menunggu
              </p>
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
              <p className="text-[10px] uppercase tracking-wider text-ptba-gray">
                Fase 1 Pending
              </p>
              <p className="text-xl font-bold text-ptba-navy">
                {counts.phase1Pending}
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-ptba-steel-blue/10">
              <Shield className="h-4.5 w-4.5 text-ptba-steel-blue" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-ptba-gray">
                Fase 2 Pending
              </p>
              <p className="text-xl font-bold text-ptba-steel-blue">
                {counts.phase2Pending}
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-100">
              <CheckCircle2 className="h-4.5 w-4.5 text-green-600" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-ptba-gray">
                Selesai
              </p>
              <p className="text-xl font-bold text-green-600">{counts.selesai}</p>
            </div>
          </div>
        </div>
      </div>

      <Tabs tabs={filterTabs} activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredApprovals.map((approval) => (
          <ApprovalCard key={approval.id} approval={approval} />
        ))}
      </div>

      {filteredApprovals.length === 0 && (
        <div className="rounded-xl bg-white p-12 text-center shadow-sm">
          <p className="text-ptba-gray">
            Tidak ada persetujuan dengan status ini.
          </p>
        </div>
      )}
    </div>
  );
}
