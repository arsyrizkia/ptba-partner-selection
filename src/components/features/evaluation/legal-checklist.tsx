"use client";

import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { LegalAspect } from "@/lib/types";

interface LegalChecklistProps {
  aspects: LegalAspect[];
  weights?: Record<string, number>;
  statusScores?: Record<string, number>;
  onStatusChange?: (index: number, status: LegalAspect["status"]) => void;
  onNotesChange?: (index: number, notes: string) => void;
}

const STATUS_OPTIONS: { value: LegalAspect["status"]; label: string }[] = [
  { value: "Lulus", label: "Lulus" },
  { value: "Bersyarat", label: "Bersyarat" },
  { value: "Tidak Lulus", label: "Tidak Lulus" },
];

function getStatusBadge(status: LegalAspect["status"]) {
  const styles: Record<LegalAspect["status"], string> = {
    Lulus: "bg-green-100 text-green-800",
    Bersyarat: "bg-amber-100 text-amber-800",
    "Tidak Lulus": "bg-red-100 text-red-800",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        styles[status]
      )}
    >
      {status}
    </span>
  );
}

const LEGAL_ASPECT_DESCRIPTIONS: Record<string, string> = {
  "Legalitas Badan Usaha":
    "Pemeriksaan keabsahan badan hukum perusahaan, akta pendirian, dan perubahannya",
  "Perizinan Usaha":
    "Pemeriksaan kelengkapan dan keabsahan izin usaha yang dimiliki",
  "Kepatuhan Perpajakan":
    "Pemeriksaan kepatuhan kewajiban perpajakan dan status NPWP",
  "Kepatuhan Pajak":
    "Pemeriksaan kepatuhan kewajiban perpajakan dan status NPWP",
  "Riwayat Hukum":
    "Pemeriksaan riwayat sengketa hukum, perkara pidana, dan daftar hitam",
  "Kontrak & Perjanjian":
    "Pemeriksaan kemampuan dan kesiapan dalam penyusunan kontrak kerjasama",
  "Kepatuhan Regulasi Sektoral":
    "Pemeriksaan kepatuhan terhadap regulasi sektoral terkait",
  "AMDAL/Lingkungan":
    "Pemeriksaan dokumen lingkungan hidup dan kepatuhan terhadap regulasi lingkungan",
  "Kepatuhan K3":
    "Pemeriksaan kepatuhan terhadap standar Keselamatan dan Kesehatan Kerja",
  "Sanksi & Blacklist":
    "Pemeriksaan daftar hitam dan sanksi dari instansi pemerintah",
  "Kepemilikan & Afiliasi":
    "Pemeriksaan struktur kepemilikan dan potensi konflik kepentingan",
};

export function LegalChecklist({
  aspects,
  weights,
  statusScores,
  onStatusChange,
  onNotesChange,
}: LegalChecklistProps) {
  const showScoring = !!weights && !!statusScores;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-ptba-navy text-white">
            <th className="px-4 py-3 text-left font-medium w-12">No</th>
            <th className="px-4 py-3 text-left font-medium w-48">Aspek Hukum</th>
            <th className="px-4 py-3 text-left font-medium">Deskripsi</th>
            <th className="px-4 py-3 text-left font-medium w-40">Status</th>
            {showScoring && <th className="px-4 py-3 text-center font-medium w-20">Bobot</th>}
            {showScoring && <th className="px-4 py-3 text-center font-medium w-20">Skor</th>}
            <th className="px-4 py-3 text-left font-medium w-64">Catatan</th>
          </tr>
        </thead>
        <tbody>
          {aspects.map((aspect, index) => (
            <tr
              key={index}
              className={cn(
                "border-b border-gray-100",
                index % 2 === 0 ? "bg-white" : "bg-gray-50"
              )}
            >
              <td className="px-4 py-3 text-ptba-charcoal font-medium">
                {index + 1}
              </td>
              <td className="px-4 py-3 text-ptba-charcoal font-medium">
                {aspect.name}
              </td>
              <td className="px-4 py-3 text-gray-600 text-xs">
                {LEGAL_ASPECT_DESCRIPTIONS[aspect.name] || "-"}
              </td>
              <td className="px-4 py-3">
                {onStatusChange ? (
                  <div className="relative inline-flex">
                    <select
                      value={aspect.status}
                      onChange={(e) =>
                        onStatusChange(index, e.target.value as LegalAspect["status"])
                      }
                      className={cn(
                        "appearance-none rounded-lg border pl-2.5 pr-6 py-1 text-xs font-medium cursor-pointer",
                        "focus:outline-none focus:ring-2 focus:ring-ptba-steel-blue",
                        aspect.status === "Lulus" && "bg-green-100 text-green-800 border-green-200",
                        aspect.status === "Bersyarat" && "bg-amber-100 text-amber-800 border-amber-200",
                        aspect.status === "Tidak Lulus" && "bg-red-100 text-red-800 border-red-200"
                      )}
                    >
                      {STATUS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 h-3 w-3 opacity-50" />
                  </div>
                ) : (
                  getStatusBadge(aspect.status)
                )}
              </td>
              {showScoring && (
                <td className="px-4 py-3 text-center text-sm text-gray-500">
                  {weights[aspect.name] ?? 0}%
                </td>
              )}
              {showScoring && (() => {
                const weight = weights[aspect.name] ?? 0;
                const score = (statusScores[aspect.status] ?? 0) * weight / 100;
                return (
                  <td className={cn(
                    "px-4 py-3 text-center text-sm font-semibold",
                    aspect.status === "Lulus" && "text-green-700",
                    aspect.status === "Bersyarat" && "text-amber-700",
                    aspect.status === "Tidak Lulus" && "text-red-700"
                  )}>
                    {score.toFixed(1)}
                  </td>
                );
              })()}
              <td className="px-4 py-3">
                {onNotesChange ? (
                  <textarea
                    value={aspect.notes}
                    onChange={(e) => onNotesChange(index, e.target.value)}
                    className="w-full rounded border border-gray-200 px-2 py-1 text-xs text-ptba-charcoal resize-y min-h-[32px] focus:outline-none focus:ring-1 focus:ring-ptba-steel-blue"
                    rows={1}
                  />
                ) : (
                  <span className="text-xs text-gray-600">{aspect.notes}</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
        {showScoring && (
          <tfoot>
            <tr className="bg-ptba-navy/5 border-t-2 border-ptba-navy">
              <td colSpan={4} className="px-4 py-3 text-right font-bold text-ptba-navy text-sm">
                Total
              </td>
              <td className="px-4 py-3 text-center font-bold text-gray-500 text-sm">
                {Object.values(weights).reduce((s, w) => s + w, 0)}%
              </td>
              <td className="px-4 py-3 text-center font-extrabold text-ptba-navy text-sm">
                {aspects.reduce((sum, a) => sum + (statusScores[a.status] ?? 0) * (weights[a.name] ?? 0) / 100, 0).toFixed(1)}
              </td>
              <td className="px-4 py-3" />
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}
