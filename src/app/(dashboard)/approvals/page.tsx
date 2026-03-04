"use client";

import { useState, useMemo } from "react";
import { Tabs } from "@/components/ui/tabs";
import { ApprovalCard } from "@/components/features/approval/approval-card";
import { mockApprovals } from "@/lib/mock-data";
import type { Approval } from "@/lib/types";

const filterTabs = [
  { key: "all", label: "Semua" },
  { key: "Menunggu", label: "Menunggu" },
  { key: "Disetujui", label: "Disetujui" },
  { key: "Ditolak", label: "Ditolak" },
  { key: "Dikembalikan", label: "Dikembalikan" },
];

export default function ApprovalsPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [approvals, setApprovals] = useState<Approval[]>(mockApprovals);

  const filteredApprovals = useMemo(() => {
    if (activeTab === "all") return approvals;
    return approvals.filter((a) => a.status === activeTab);
  }, [activeTab, approvals]);

  const handleApprove = (id: string) => {
    setApprovals((prev) =>
      prev.map((a) =>
        a.id === id
          ? { ...a, status: "Disetujui" as const, approvedAt: new Date().toISOString() }
          : a
      )
    );
  };

  const handleReject = (id: string) => {
    setApprovals((prev) =>
      prev.map((a) =>
        a.id === id
          ? { ...a, status: "Ditolak" as const, approvedAt: new Date().toISOString() }
          : a
      )
    );
  };

  const handleReturn = (id: string) => {
    setApprovals((prev) =>
      prev.map((a) =>
        a.id === id ? { ...a, status: "Dikembalikan" as const } : a
      )
    );
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-ptba-charcoal">
        Antrian Persetujuan
      </h1>

      <Tabs tabs={filterTabs} activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredApprovals.map((approval) => (
          <ApprovalCard
            key={approval.id}
            approval={approval}
            onApprove={handleApprove}
            onReject={handleReject}
            onReturn={handleReturn}
          />
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
