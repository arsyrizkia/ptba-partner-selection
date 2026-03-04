"use client";

import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs } from "@/components/ui/tabs";
import { DocumentChecklist } from "@/components/features/partner/document-checklist";
import { mockPartners } from "@/lib/mock-data";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import type { Partner } from "@/lib/types";

function getPartnerStatusVariant(
  status: Partner["status"]
): "success" | "warning" | "error" {
  switch (status) {
    case "Aktif":
      return "success";
    case "Dalam Review":
      return "warning";
    case "Tidak Aktif":
    default:
      return "error";
  }
}

const tabs = [
  { key: "profil", label: "Profil" },
  { key: "dokumen", label: "Dokumen" },
  { key: "keuangan", label: "Data Keuangan" },
];

export default function PartnerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const partnerId = params.id as string;
  const [activeTab, setActiveTab] = useState("profil");

  const partner = useMemo(() => {
    return mockPartners.find((p) => p.id === partnerId);
  }, [partnerId]);

  if (!partner) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-ptba-charcoal mb-2">
            Mitra Tidak Ditemukan
          </h2>
          <p className="text-ptba-gray mb-4">
            Mitra dengan ID &quot;{partnerId}&quot; tidak ditemukan.
          </p>
          <button
            onClick={() => router.push("/partners")}
            className="text-ptba-navy underline hover:text-ptba-steel-blue"
          >
            Kembali ke Daftar Mitra
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card accent="navy" padding="lg">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-ptba-charcoal">
                {partner.name}
              </h1>
              <Badge variant={getPartnerStatusVariant(partner.status)}>
                {partner.status}
              </Badge>
            </div>
            <div className="flex items-center gap-4 text-sm text-ptba-gray">
              <span>
                <span className="font-medium text-ptba-charcoal">Kode:</span>{" "}
                {partner.code}
              </span>
              <span>
                <span className="font-medium text-ptba-charcoal">
                  Industri:
                </span>{" "}
                {partner.industry}
              </span>
            </div>
            <div className="flex items-center gap-4 text-sm text-ptba-gray">
              <span>
                <span className="font-medium text-ptba-charcoal">
                  Kontak:
                </span>{" "}
                {partner.contactPerson}
              </span>
              <span>
                <span className="font-medium text-ptba-charcoal">Tel:</span>{" "}
                {partner.contactPhone}
              </span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-xs text-ptba-gray">Terdaftar sejak</p>
            <p className="text-sm font-semibold text-ptba-navy">
              {formatDate(partner.registrationDate)}
            </p>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Tab Content */}
      <div className="mt-4">
        {activeTab === "profil" && <ProfilTab partner={partner} />}
        {activeTab === "dokumen" && (
          <DocumentChecklist documents={partner.documents} />
        )}
        {activeTab === "keuangan" && <KeuanganTab partner={partner} />}
      </div>
    </div>
  );
}

/* ── Profil Tab ───────────────────────────────────────────────────── */

function ProfilTab({ partner }: { partner: Partner }) {
  const profileItems = [
    { label: "Nama Perusahaan", value: partner.name },
    { label: "Kode", value: partner.code },
    { label: "Industri", value: partner.industry },
    { label: "Alamat", value: partner.address },
    { label: "Telepon", value: partner.phone },
    { label: "Email", value: partner.email },
    { label: "Website", value: partner.website || "-" },
    { label: "NPWP", value: partner.npwp },
    { label: "SIUP", value: partner.siup },
    { label: "Kontak Person", value: partner.contactPerson },
    { label: "Telepon Kontak", value: partner.contactPhone },
    {
      label: "Tanggal Registrasi",
      value: formatDate(partner.registrationDate),
    },
  ];

  return (
    <Card padding="lg">
      <h2 className="text-lg font-semibold text-ptba-charcoal mb-4">
        Detail Perusahaan
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
        {profileItems.map((item) => (
          <div key={item.label}>
            <p className="text-xs text-ptba-gray uppercase tracking-wider mb-0.5">
              {item.label}
            </p>
            <p className="text-sm font-medium text-ptba-charcoal">
              {item.value}
            </p>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ── Keuangan Tab ─────────────────────────────────────────────────── */

function KeuanganTab({ partner }: { partner: Partner }) {
  const financialData = partner.financialData;

  if (!financialData || financialData.length === 0) {
    return (
      <Card padding="lg">
        <p className="text-center text-ptba-gray py-8">
          Data keuangan belum tersedia.
        </p>
      </Card>
    );
  }

  // Sort by year
  const sortedData = [...financialData].sort((a, b) => a.year - b.year);
  const years = sortedData.map((d) => d.year);

  const indicators = [
    {
      label: "Total Aset",
      key: "totalAssets" as const,
    },
    {
      label: "Total Liabilitas",
      key: "totalLiabilities" as const,
    },
    {
      label: "Total Ekuitas",
      key: "totalEquity" as const,
    },
    {
      label: "Pendapatan",
      key: "revenue" as const,
    },
    {
      label: "Laba Bersih",
      key: "netIncome" as const,
    },
    {
      label: "Arus Kas Operasi",
      key: "operatingCashFlow" as const,
    },
    {
      label: "Aset Lancar",
      key: "currentAssets" as const,
    },
    {
      label: "Liabilitas Lancar",
      key: "currentLiabilities" as const,
    },
  ];

  return (
    <Card padding="lg">
      <h2 className="text-lg font-semibold text-ptba-charcoal mb-4">
        Data Keuangan (3 Tahun Terakhir)
      </h2>

      <div className="overflow-x-auto rounded-xl border border-ptba-light-gray">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-ptba-navy text-white">
              <th className="px-4 py-3 text-left font-medium">Indikator</th>
              {years.map((year) => (
                <th key={year} className="px-4 py-3 text-right font-medium">
                  {year}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {indicators.map((indicator, index) => (
              <tr
                key={indicator.key}
                className={
                  index % 2 === 0 ? "bg-white" : "bg-ptba-off-white"
                }
              >
                <td className="px-4 py-3 font-medium text-ptba-charcoal">
                  {indicator.label}
                </td>
                {sortedData.map((yearData) => (
                  <td
                    key={yearData.year}
                    className="px-4 py-3 text-right text-ptba-charcoal"
                  >
                    {formatCurrency(yearData[indicator.key])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
