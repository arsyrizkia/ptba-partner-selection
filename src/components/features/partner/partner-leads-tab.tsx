"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { Loader2, Download, Plus, Pencil, Trash2 } from "lucide-react";
import { SearchInput } from "@/components/ui/search-input";
import { FilterDropdown } from "@/components/ui/filter-dropdown";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { useAuth } from "@/lib/auth/auth-context";
import { api } from "@/lib/api/client";

export interface PartnerLead {
  id: string;
  companyName: string;
  industry: string | null;
  country: string | null;
  website: string | null;
  contactPerson: string | null;
  contactTitle: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  source: string | null;
  status: string;
  notes: string | null;
  createdByName: string | null;
  createdAt: string;
}

type LeadForm = Omit<PartnerLead, "id" | "createdByName" | "createdAt">;

const LEAD_STATUSES = ["Baru", "Dihubungi", "Tertarik", "Diundang", "Terdaftar", "Tidak Tertarik"];

const emptyForm: LeadForm = {
  companyName: "",
  industry: "",
  country: "",
  website: "",
  contactPerson: "",
  contactTitle: "",
  contactEmail: "",
  contactPhone: "",
  source: "",
  status: "Baru",
  notes: "",
};

function getStatusVariant(status: string): "success" | "warning" | "error" | "info" | "neutral" {
  switch (status) {
    case "Terdaftar":
      return "success";
    case "Tertarik":
      return "warning";
    case "Dihubungi":
    case "Diundang":
      return "info";
    case "Tidak Tertarik":
      return "error";
    default:
      return "neutral";
  }
}

const statusOptions = [{ value: "", label: "Semua" }, ...LEAD_STATUSES.map((s) => ({ value: s, label: s }))];

const inputClass =
  "w-full rounded-lg border border-ptba-light-gray bg-ptba-off-white px-3 py-2 text-sm outline-none focus:border-ptba-steel-blue focus:ring-2 focus:ring-ptba-steel-blue/20";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

function exportLeadsCSV(data: PartnerLead[]) {
  const headers = [
    "Nama Perusahaan", "Bidang Usaha", "Negara", "Website", "Nama Kontak", "Jabatan",
    "Email", "Telepon", "Sumber", "Status", "Catatan", "Ditambahkan Oleh", "Tanggal Ditambahkan",
  ];
  const escape = (v: string | null | undefined) => {
    if (v == null) return "";
    const s = String(v).replace(/"/g, '""');
    return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s}"` : s;
  };
  const rows = data.map((l) => [
    escape(l.companyName),
    escape(l.industry),
    escape(l.country),
    escape(l.website),
    escape(l.contactPerson),
    escape(l.contactTitle),
    escape(l.contactEmail),
    escape(l.contactPhone),
    escape(l.source),
    escape(l.status),
    escape(l.notes),
    escape(l.createdByName),
    escape(new Date(l.createdAt).toLocaleDateString("id-ID")),
  ]);
  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `penjajakan-mitra-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// Penjajakan Mitra: prospect list of companies to invite, not registered users
export function PartnerLeadsTab() {
  const { accessToken } = useAuth();
  const [leads, setLeads] = useState<PartnerLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // null = closed, "new" = create, otherwise the lead being edited
  const [editing, setEditing] = useState<PartnerLead | "new" | null>(null);
  const [form, setForm] = useState<LeadForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [deleteTarget, setDeleteTarget] = useState<PartnerLead | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    if (!accessToken) return;
    setLoading(true);
    api<{ leads: PartnerLead[] }>("/partner-leads", { token: accessToken })
      .then((res) => setLeads(res.leads || []))
      .catch((err) => setLoadError(err instanceof Error ? err.message : "Gagal memuat data"))
      .finally(() => setLoading(false));
  }, [accessToken]);

  const filteredLeads = useMemo(() => {
    const q = search.toLowerCase();
    return leads.filter((lead) => {
      const matchesSearch = [lead.companyName, lead.industry, lead.contactPerson, lead.contactEmail, lead.country]
        .some((v) => (v || "").toLowerCase().includes(q));
      const matchesStatus = statusFilter ? lead.status === statusFilter : true;
      return matchesSearch && matchesStatus;
    });
  }, [leads, search, statusFilter]);

  const openCreate = () => {
    setForm(emptyForm);
    setFormError("");
    setEditing("new");
  };

  const openEdit = (lead: PartnerLead) => {
    setForm({
      companyName: lead.companyName,
      industry: lead.industry || "",
      country: lead.country || "",
      website: lead.website || "",
      contactPerson: lead.contactPerson || "",
      contactTitle: lead.contactTitle || "",
      contactEmail: lead.contactEmail || "",
      contactPhone: lead.contactPhone || "",
      source: lead.source || "",
      status: lead.status,
      notes: lead.notes || "",
    });
    setFormError("");
    setEditing(lead);
  };

  const closeForm = useCallback(() => {
    if (!saving) setEditing(null);
  }, [saving]);

  const closeDelete = useCallback(() => {
    if (!deleting) setDeleteTarget(null);
  }, [deleting]);

  const setField = (key: keyof LeadForm, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken || !editing) return;
    if (!form.companyName.trim()) {
      setFormError("Nama perusahaan wajib diisi.");
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      if (editing === "new") {
        const res = await api<{ lead: PartnerLead }>("/partner-leads", { method: "POST", body: form, token: accessToken });
        setLeads((prev) => [res.lead, ...prev]);
      } else {
        const res = await api<{ lead: PartnerLead }>(`/partner-leads/${editing.id}`, { method: "PUT", body: form, token: accessToken });
        setLeads((prev) => prev.map((l) => (l.id === res.lead.id ? res.lead : l)));
      }
      setEditing(null);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Gagal menyimpan data.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!accessToken || !deleteTarget) return;
    setDeleting(true);
    setDeleteError("");
    try {
      await api(`/partner-leads/${deleteTarget.id}`, { method: "DELETE", token: accessToken });
      setLeads((prev) => prev.filter((l) => l.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Gagal menghapus data.");
    } finally {
      setDeleting(false);
    }
  };

  const tableData = filteredLeads.map((l) => ({
    ...l,
    _company: l.companyName,
    _contact: l.contactPerson || "",
    _country: l.country || "-",
    _status: l.status,
    _createdAt: l.createdAt,
  }));

  const columns = [
    {
      key: "_company",
      label: "Nama Perusahaan",
      sortable: true,
      render: (item: (typeof tableData)[0]) => (
        <div className="min-w-0">
          <p className="font-medium text-ptba-navy">{item.companyName}</p>
          {item.industry && <p className="text-xs text-ptba-gray line-clamp-1">{item.industry}</p>}
        </div>
      ),
    },
    {
      key: "_contact",
      label: "Kontak",
      sortable: true,
      render: (item: (typeof tableData)[0]) =>
        item.contactPerson || item.contactEmail || item.contactPhone ? (
          <div className="min-w-0 text-xs">
            {item.contactPerson && (
              <p className="text-sm text-ptba-charcoal">
                {item.contactPerson}
                {item.contactTitle && <span className="text-ptba-gray"> · {item.contactTitle}</span>}
              </p>
            )}
            {item.contactEmail && <p className="text-ptba-gray">{item.contactEmail}</p>}
            {item.contactPhone && <p className="text-ptba-gray">{item.contactPhone}</p>}
          </div>
        ) : (
          <span className="text-ptba-gray">-</span>
        ),
    },
    { key: "_country", label: "Negara", sortable: true },
    {
      key: "_status",
      label: "Status",
      sortable: true,
      render: (item: (typeof tableData)[0]) => <Badge variant={getStatusVariant(item.status)}>{item.status}</Badge>,
    },
    {
      key: "_createdAt",
      label: "Ditambahkan",
      sortable: true,
      render: (item: (typeof tableData)[0]) => (
        <div className="text-xs">
          <p className="text-ptba-charcoal">{formatDate(item.createdAt)}</p>
          {item.createdByName && <p className="text-ptba-gray">{item.createdByName}</p>}
        </div>
      ),
    },
    {
      key: "_actions",
      label: "",
      render: (item: (typeof tableData)[0]) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => openEdit(item)}
            title="Ubah"
            className="rounded-lg p-1.5 text-ptba-steel-blue hover:bg-ptba-steel-blue/10 transition-colors"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => { setDeleteError(""); setDeleteTarget(item); }}
            title="Hapus"
            className="rounded-lg p-1.5 text-ptba-red hover:bg-ptba-red/10 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-ptba-navy mb-4" />
        <p className="text-sm text-ptba-gray">Memuat data penjajakan mitra...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <SearchInput value={search} onChange={setSearch} placeholder="Cari calon mitra..." className="w-72" />
        <FilterDropdown label="Status" options={statusOptions} value={statusFilter} onChange={setStatusFilter} />
        <div className="ml-auto flex items-center gap-2">
          {leads.length > 0 && (
            <button
              onClick={() => exportLeadsCSV(leads)}
              className="inline-flex items-center gap-2 rounded-lg border border-ptba-light-gray bg-white px-4 py-2 text-sm font-medium text-ptba-charcoal shadow-sm hover:bg-ptba-section-bg transition-colors"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>
          )}
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-lg bg-ptba-navy px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-ptba-navy/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Tambah Calon Mitra
          </button>
        </div>
      </div>

      {loadError ? (
        <div className="rounded-xl bg-white p-10 text-center shadow-sm">
          <p className="text-sm text-ptba-red">{loadError}</p>
        </div>
      ) : tableData.length === 0 ? (
        <div className="rounded-xl bg-white p-10 text-center shadow-sm">
          <p className="text-sm text-ptba-gray">
            {leads.length === 0
              ? "Belum ada calon mitra. Klik \"Tambah Calon Mitra\" untuk mencatat perusahaan yang akan diundang."
              : "Tidak ada calon mitra yang cocok dengan pencarian."}
          </p>
        </div>
      ) : (
        <DataTable columns={columns} data={tableData} onRowClick={(item) => openEdit(item)} />
      )}

      {/* Create / edit form */}
      <Modal isOpen={editing !== null} onClose={closeForm} title={editing === "new" ? "Tambah Calon Mitra" : "Ubah Calon Mitra"} size="lg">
        <form onSubmit={handleSave}>
          <div className="max-h-[65vh] space-y-4 overflow-y-auto pr-1">
            <div>
              <label className="mb-1 block text-sm font-medium text-ptba-charcoal">
                Nama Perusahaan<span className="ml-0.5 text-ptba-red">*</span>
              </label>
              <input
                type="text"
                value={form.companyName}
                onChange={(e) => setField("companyName", e.target.value)}
                placeholder="Contoh: PT Energi Nusantara"
                className={inputClass}
                autoFocus
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-ptba-charcoal">Bidang Usaha</label>
                <input type="text" value={form.industry || ""} onChange={(e) => setField("industry", e.target.value)} placeholder="Contoh: EPC Pembangkit" className={inputClass} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-ptba-charcoal">Negara</label>
                <input type="text" value={form.country || ""} onChange={(e) => setField("country", e.target.value)} placeholder="Contoh: Indonesia" className={inputClass} />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-ptba-charcoal">Website</label>
              <input type="text" value={form.website || ""} onChange={(e) => setField("website", e.target.value)} placeholder="https://" className={inputClass} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-ptba-charcoal">Nama Kontak</label>
                <input type="text" value={form.contactPerson || ""} onChange={(e) => setField("contactPerson", e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-ptba-charcoal">Jabatan</label>
                <input type="text" value={form.contactTitle || ""} onChange={(e) => setField("contactTitle", e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-ptba-charcoal">Email</label>
                <input type="email" value={form.contactEmail || ""} onChange={(e) => setField("contactEmail", e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-ptba-charcoal">Telepon</label>
                <input type="text" value={form.contactPhone || ""} onChange={(e) => setField("contactPhone", e.target.value)} className={inputClass} />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-ptba-charcoal">Sumber Informasi</label>
                <input type="text" value={form.source || ""} onChange={(e) => setField("source", e.target.value)} placeholder="Contoh: Referensi, pameran" className={inputClass} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-ptba-charcoal">Status</label>
                <select value={form.status} onChange={(e) => setField("status", e.target.value)} className={inputClass}>
                  {LEAD_STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-ptba-charcoal">Catatan</label>
              <textarea value={form.notes || ""} onChange={(e) => setField("notes", e.target.value)} rows={3} className={inputClass} />
            </div>
          </div>

          {formError && <p className="mt-3 text-sm text-ptba-red">{formError}</p>}

          <div className="mt-5 flex justify-end gap-2 border-t border-ptba-light-gray pt-4">
            <button
              type="button"
              onClick={closeForm}
              disabled={saving}
              className="rounded-lg border border-ptba-light-gray px-4 py-2 text-sm font-medium text-ptba-charcoal hover:bg-ptba-off-white disabled:opacity-50 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-ptba-navy px-4 py-2 text-sm font-medium text-white hover:bg-ptba-navy/90 disabled:opacity-50 transition-colors"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Simpan
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete confirmation */}
      <Modal isOpen={deleteTarget !== null} onClose={closeDelete} title="Hapus Calon Mitra?" size="sm">
        <p className="text-sm text-ptba-gray">
          <span className="font-medium text-ptba-charcoal">{deleteTarget?.companyName}</span> akan dihapus dari daftar penjajakan mitra.
        </p>
        {deleteError && <p className="mt-3 text-sm text-ptba-red">{deleteError}</p>}
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={closeDelete}
            disabled={deleting}
            className="rounded-lg border border-ptba-light-gray px-4 py-2 text-sm font-medium text-ptba-charcoal hover:bg-ptba-off-white disabled:opacity-50 transition-colors"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="inline-flex items-center gap-2 rounded-lg bg-ptba-red px-4 py-2 text-sm font-medium text-white hover:bg-ptba-red/90 disabled:opacity-50 transition-colors"
          >
            {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
            Hapus
          </button>
        </div>
      </Modal>
    </div>
  );
}
