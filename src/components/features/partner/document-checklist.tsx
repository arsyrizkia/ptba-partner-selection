"use client";

import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress-bar";
import { formatDate } from "@/lib/utils/format";
import type { DocumentItem } from "@/lib/types";

interface DocumentChecklistProps {
  documents: DocumentItem[];
}

function getDocStatusVariant(
  status: DocumentItem["status"]
): "success" | "warning" | "error" | "neutral" {
  switch (status) {
    case "Lengkap":
      return "success";
    case "Pending":
      return "warning";
    case "Ditolak":
      return "error";
    case "Belum Upload":
    default:
      return "neutral";
  }
}

export function DocumentChecklist({ documents }: DocumentChecklistProps) {
  const completedCount = documents.filter(
    (doc) => doc.status === "Lengkap"
  ).length;
  const totalCount = documents.length;
  const completionPercent =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Overall Progress */}
      <div className="rounded-xl bg-ptba-section-bg p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-ptba-charcoal">
            Kelengkapan Dokumen
          </span>
          <span className="text-sm font-bold text-ptba-navy">
            {completedCount}/{totalCount} dokumen
          </span>
        </div>
        <ProgressBar
          value={completionPercent}
          color={
            completionPercent === 100
              ? "green"
              : completionPercent >= 70
                ? "navy"
                : completionPercent >= 40
                  ? "gold"
                  : "red"
          }
          showPercent
        />
      </div>

      {/* Document Table */}
      <div className="overflow-x-auto rounded-xl border border-ptba-light-gray">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-ptba-navy text-white">
              <th className="px-4 py-3 text-left font-medium">No</th>
              <th className="px-4 py-3 text-left font-medium">
                Jenis Dokumen
              </th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-left font-medium">
                Tanggal Upload
              </th>
              <th className="px-4 py-3 text-left font-medium">Versi</th>
              <th className="px-4 py-3 text-left font-medium">
                Tanggal Kadaluarsa
              </th>
            </tr>
          </thead>
          <tbody>
            {documents.map((doc, index) => (
              <tr
                key={doc.id}
                className={
                  index % 2 === 0
                    ? "bg-white"
                    : "bg-ptba-off-white"
                }
              >
                <td className="px-4 py-3 text-ptba-charcoal">{index + 1}</td>
                <td className="px-4 py-3 text-ptba-charcoal font-medium">
                  {doc.type}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={getDocStatusVariant(doc.status)}>
                    {doc.status}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-ptba-charcoal">
                  {doc.uploadDate ? formatDate(doc.uploadDate) : "-"}
                </td>
                <td className="px-4 py-3 text-ptba-charcoal">
                  {doc.version > 0 ? `v${doc.version}` : "-"}
                </td>
                <td className="px-4 py-3 text-ptba-charcoal">
                  {doc.expiryDate ? formatDate(doc.expiryDate) : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
