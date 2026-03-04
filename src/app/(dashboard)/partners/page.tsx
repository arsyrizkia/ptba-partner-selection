"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { SearchInput } from "@/components/ui/search-input";
import { FilterDropdown } from "@/components/ui/filter-dropdown";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Button } from "@/components/ui/button";
import { mockPartners } from "@/lib/mock-data";
import { formatDate } from "@/lib/utils/format";
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

function calcDocCompleteness(partner: Partner): number {
  if (partner.documents.length === 0) return 0;
  const completed = partner.documents.filter(
    (doc) => doc.status === "Lengkap"
  ).length;
  return Math.round((completed / partner.documents.length) * 100);
}

const statusOptions = [
  { value: "", label: "Semua" },
  { value: "Aktif", label: "Aktif" },
  { value: "Dalam Review", label: "Dalam Review" },
  { value: "Tidak Aktif", label: "Tidak Aktif" },
];

export default function PartnersPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const filteredPartners = useMemo(() => {
    return mockPartners.filter((partner) => {
      const matchesSearch =
        partner.name.toLowerCase().includes(search.toLowerCase()) ||
        partner.code.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter
        ? partner.status === statusFilter
        : true;
      return matchesSearch && matchesStatus;
    });
  }, [search, statusFilter]);

  const tableData = filteredPartners.map((p) => ({
    ...p,
    _name: p.name,
    _code: p.code,
    _industry: p.industry,
    _status: p.status,
    _docCompleteness: calcDocCompleteness(p),
    _registrationDate: p.registrationDate,
  }));

  const columns = [
    {
      key: "_name",
      label: "Nama Mitra",
      sortable: true,
      render: (item: (typeof tableData)[0]) => (
        <span className="font-medium text-ptba-navy">{item.name}</span>
      ),
    },
    {
      key: "_code",
      label: "Kode",
      sortable: true,
    },
    {
      key: "_industry",
      label: "Industri",
      sortable: true,
    },
    {
      key: "_status",
      label: "Status",
      sortable: true,
      render: (item: (typeof tableData)[0]) => (
        <Badge variant={getPartnerStatusVariant(item.status)}>
          {item.status}
        </Badge>
      ),
    },
    {
      key: "_docCompleteness",
      label: "Kelengkapan Dokumen",
      sortable: true,
      render: (item: (typeof tableData)[0]) => (
        <div className="w-32">
          <ProgressBar
            value={item._docCompleteness}
            color={
              item._docCompleteness === 100
                ? "green"
                : item._docCompleteness >= 70
                  ? "navy"
                  : item._docCompleteness >= 40
                    ? "gold"
                    : "red"
            }
            showPercent
          />
        </div>
      ),
    },
    {
      key: "_registrationDate",
      label: "Tanggal Registrasi",
      sortable: true,
      render: (item: (typeof tableData)[0]) => (
        <span>{formatDate(item.registrationDate)}</span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-ptba-charcoal">Daftar Mitra</h1>
        <Button
          variant="gold"
          onClick={() => router.push("/partners/register")}
        >
          + Registrasi Mitra Baru
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Cari mitra..."
          className="w-72"
        />
        <FilterDropdown
          label="Status"
          options={statusOptions}
          value={statusFilter}
          onChange={setStatusFilter}
        />
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={tableData}
        onRowClick={(item) => {
          router.push(`/partners/${item.id}`);
        }}
      />
    </div>
  );
}
