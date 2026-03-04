"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { SearchInput } from "@/components/ui/search-input";
import { Select } from "@/components/ui/select";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { mockDocuments } from "@/lib/mock-data";
import type { DocumentWithMeta } from "@/lib/mock-data";
import { formatDate } from "@/lib/utils/format";

const documentTypeOptions = [
  { value: "all", label: "Semua Tipe" },
  { value: "Laporan Keuangan", label: "Laporan Keuangan" },
  { value: "Sertifikat ISO", label: "Sertifikat ISO" },
  { value: "Profil Perusahaan", label: "Profil Perusahaan" },
  { value: "Daftar Pengalaman Kerja", label: "Daftar Pengalaman Kerja" },
  { value: "Daftar Tenaga Ahli", label: "Daftar Tenaga Ahli" },
  { value: "AMDAL/UKL-UPL", label: "AMDAL/UKL-UPL" },
  { value: "Daftar Peralatan", label: "Daftar Peralatan" },
];

function getStatusVariant(status: string) {
  switch (status) {
    case "Lengkap":
      return "success" as const;
    case "Pending":
      return "warning" as const;
    case "Ditolak":
      return "error" as const;
    case "Belum Upload":
      return "neutral" as const;
    default:
      return "neutral" as const;
  }
}

type DocRow = DocumentWithMeta & Record<string, unknown>;

export default function DocumentsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const filteredDocuments = useMemo(() => {
    return mockDocuments.filter((doc) => {
      const matchesSearch =
        !search ||
        doc.name.toLowerCase().includes(search.toLowerCase()) ||
        doc.partnerName.toLowerCase().includes(search.toLowerCase()) ||
        (doc.projectName ?? "").toLowerCase().includes(search.toLowerCase());

      const matchesType = typeFilter === "all" || doc.type === typeFilter;

      return matchesSearch && matchesType;
    });
  }, [search, typeFilter]);

  const columns = [
    {
      key: "name",
      label: "Nama Dokumen",
      sortable: true,
      render: (item: DocRow) => (
        <span className="font-medium text-ptba-charcoal">{item.name}</span>
      ),
    },
    {
      key: "partnerName",
      label: "Mitra",
      sortable: true,
    },
    {
      key: "projectName",
      label: "Proyek",
      render: (item: DocRow) => (
        <span className="text-ptba-gray">{item.projectName ?? "-"}</span>
      ),
    },
    {
      key: "type",
      label: "Tipe",
      sortable: true,
    },
    {
      key: "status",
      label: "Status",
      render: (item: DocRow) => (
        <Badge variant={getStatusVariant(item.status as string)}>
          {item.status as string}
        </Badge>
      ),
    },
    {
      key: "version",
      label: "Versi",
      render: (item: DocRow) => (
        <span>v{item.version as number}</span>
      ),
    },
    {
      key: "uploadDate",
      label: "Tanggal Upload",
      sortable: true,
      render: (item: DocRow) => (
        <span>{item.uploadDate ? formatDate(item.uploadDate as string) : "-"}</span>
      ),
    },
    {
      key: "fileSize",
      label: "Ukuran File",
      render: (item: DocRow) => (
        <span className="text-ptba-gray">{(item.fileSize as string) ?? "-"}</span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-ptba-charcoal">
        Manajemen Dokumen
      </h1>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Cari dokumen, mitra, atau proyek..."
          className="sm:w-80"
        />
        <Select
          options={documentTypeOptions}
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="sm:w-56"
        />
      </div>

      <DataTable
        columns={columns}
        data={filteredDocuments as DocRow[]}
        onRowClick={(item) => router.push(`/documents/${item.id}`)}
      />
    </div>
  );
}
