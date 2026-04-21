"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Download } from "lucide-react";
import { SearchInput } from "@/components/ui/search-input";
import { FilterDropdown } from "@/components/ui/filter-dropdown";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth/auth-context";
import { api } from "@/lib/api/client";

interface PartnerRow {
  id: string;
  name: string;
  code: string;
  industry: string;
  status: string;
  registration_date: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  website: string | null;
  npwp: string | null;
  siup: string | null;
  nib: string | null;
  contact_person: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  business_overview: string | null;
  indonesia_office_address: string | null;
  created_at: string | null;
  logo_url: string | null;
  documents: { id: string; status: string }[];
}

function getStatusVariant(status: string): "success" | "warning" | "error" {
  switch (status) {
    case "Aktif":
      return "success";
    case "Dalam Review":
      return "warning";
    default:
      return "error";
  }
}

const statusOptions = [
  { value: "", label: "Semua" },
  { value: "Aktif", label: "Aktif" },
  { value: "Dalam Review", label: "Dalam Review" },
  { value: "Tidak Aktif", label: "Tidak Aktif" },
];

function exportPartnersCSV(data: PartnerRow[]) {
  const headers = [
    "Kode", "Nama Mitra", "Industri / Business Overview", "Status",
    "Tanggal Registrasi", "Email", "Telepon", "Alamat",
    "Alamat Kantor Indonesia", "Website", "NPWP", "SIUP", "NIB",
    "Contact Person", "Telepon CP", "Email CP", "Tanggal Dibuat",
  ];
  const escape = (v: string | null | undefined) => {
    if (v == null) return "";
    const s = String(v).replace(/"/g, '""');
    return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s}"` : s;
  };
  const rows = data.map((p) => [
    escape(p.code),
    escape(p.name),
    escape(p.industry),
    escape(p.status),
    escape(p.registration_date ? new Date(p.registration_date).toLocaleDateString("id-ID") : null),
    escape(p.email),
    escape(p.phone),
    escape(p.address),
    escape(p.indonesia_office_address),
    escape(p.website),
    escape(p.npwp),
    escape(p.siup),
    escape(p.nib),
    escape(p.contact_person),
    escape(p.contact_phone),
    escape(p.contact_email),
    escape(p.created_at ? new Date(p.created_at).toLocaleDateString("id-ID") : null),
  ]);
  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `mitra-prima-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function PartnersPage() {
  const router = useRouter();
  const { accessToken } = useAuth();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [partners, setPartners] = useState<PartnerRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!accessToken) return;
    setLoading(true);
    api<PartnerRow[]>("/partners", { token: accessToken })
      .then((data) => setPartners(Array.isArray(data) ? data : []))
      .catch(() => setPartners([]))
      .finally(() => setLoading(false));
  }, [accessToken]);

  const filteredPartners = useMemo(() => {
    return partners.filter((partner) => {
      const matchesSearch =
        partner.name.toLowerCase().includes(search.toLowerCase()) ||
        (partner.code || "").toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter ? partner.status === statusFilter : true;
      return matchesSearch && matchesStatus;
    });
  }, [partners, search, statusFilter]);

  const tableData = filteredPartners.map((p) => ({
    ...p,
    _name: p.name,
    _code: p.code || "-",
    _industry: p.industry || "-",
    _status: p.status,
    _registrationDate: p.registration_date,
  }));

  const columns = [
    {
      key: "_name",
      label: "Nama Mitra",
      sortable: true,
      render: (item: (typeof tableData)[0]) => (
        <div className="flex items-center gap-3">
          {item.logo_url ? (
            <img src={item.logo_url} alt="" className="h-8 w-8 rounded-full object-cover shrink-0 border border-ptba-light-gray" />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-ptba-navy/10 text-xs font-bold text-ptba-navy shrink-0">
              {item.name.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="font-medium text-ptba-navy">{item.name}</span>
        </div>
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
        <Badge variant={getStatusVariant(item.status)}>
          {item.status}
        </Badge>
      ),
    },
    {
      key: "_registrationDate",
      label: "Tanggal Registrasi",
      sortable: true,
      render: (item: (typeof tableData)[0]) => (
        <span>
          {item._registrationDate
            ? new Date(item._registrationDate).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })
            : "-"}
        </span>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-ptba-navy mb-4" />
        <p className="text-sm text-ptba-gray">Memuat data mitra...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-ptba-charcoal">Daftar Mitra</h1>
        {partners.length > 0 && (
          <button
            onClick={() => exportPartnersCSV(partners)}
            className="inline-flex items-center gap-2 rounded-lg border border-ptba-light-gray bg-white px-4 py-2 text-sm font-medium text-ptba-charcoal shadow-sm hover:bg-ptba-section-bg transition-colors"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        )}
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
      {tableData.length === 0 ? (
        <div className="rounded-xl bg-white p-10 text-center shadow-sm">
          <p className="text-sm text-ptba-gray">Belum ada mitra terdaftar.</p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={tableData}
          onRowClick={(item) => {
            router.push(`/partners/${item.id}`);
          }}
        />
      )}
    </div>
  );
}
