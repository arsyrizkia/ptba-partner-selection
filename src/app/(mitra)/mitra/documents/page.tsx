"use client";

import { useState } from "react";
import { Upload, Download, CheckCircle2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface DocItem {
  id: string;
  name: string;
  category: string;
  status: "Terunggah" | "Belum Upload";
  uploadDate?: string;
  expiryDate?: string;
}

const documentChecklist: DocItem[] = [
  // Legalitas Perusahaan
  { id: "D01", name: "Akta Pendirian Perusahaan", category: "Legalitas Perusahaan", status: "Terunggah", uploadDate: "15 Jan 2026", expiryDate: "-" },
  { id: "D02", name: "Akta Perubahan Terakhir", category: "Legalitas Perusahaan", status: "Terunggah", uploadDate: "15 Jan 2026", expiryDate: "-" },
  { id: "D03", name: "NPWP Perusahaan", category: "Legalitas Perusahaan", status: "Terunggah", uploadDate: "15 Jan 2026", expiryDate: "-" },
  { id: "D04", name: "SIUP / NIB", category: "Legalitas Perusahaan", status: "Terunggah", uploadDate: "20 Feb 2026", expiryDate: "20 Feb 2027" },
  { id: "D05", name: "TDP / SKT", category: "Legalitas Perusahaan", status: "Terunggah", uploadDate: "15 Jan 2026", expiryDate: "15 Jan 2027" },
  // Keuangan
  { id: "D06", name: "Laporan Keuangan Audited (3 tahun)", category: "Keuangan", status: "Terunggah", uploadDate: "18 Jan 2026", expiryDate: "-" },
  { id: "D07", name: "SPT Tahunan (3 tahun)", category: "Keuangan", status: "Terunggah", uploadDate: "18 Jan 2026", expiryDate: "-" },
  { id: "D08", name: "Referensi Bank", category: "Keuangan", status: "Terunggah", uploadDate: "22 Feb 2026", expiryDate: "-" },
  // Teknis
  { id: "D09", name: "Profil Perusahaan", category: "Teknis", status: "Terunggah", uploadDate: "15 Jan 2026", expiryDate: "-" },
  { id: "D10", name: "Daftar Pengalaman Kerja", category: "Teknis", status: "Terunggah", uploadDate: "15 Jan 2026", expiryDate: "-" },
  { id: "D11", name: "Sertifikat ISO / SMK3", category: "Teknis", status: "Belum Upload" },
  { id: "D12", name: "Daftar Peralatan", category: "Teknis", status: "Terunggah", uploadDate: "15 Jan 2026", expiryDate: "-" },
  { id: "D13", name: "Daftar Tenaga Ahli", category: "Teknis", status: "Terunggah", uploadDate: "15 Jan 2026", expiryDate: "-" },
  // Kepatuhan
  { id: "D14", name: "Surat Pernyataan Tidak Dalam Sanksi", category: "Kepatuhan", status: "Terunggah", uploadDate: "15 Jan 2026", expiryDate: "-" },
  { id: "D15", name: "Surat Pernyataan Anti Korupsi", category: "Kepatuhan", status: "Terunggah", uploadDate: "15 Jan 2026", expiryDate: "-" },
  { id: "D16", name: "LHKPN / LHKASN (jika berlaku)", category: "Kepatuhan", status: "Belum Upload" },
  { id: "D17", name: "Surat Keterangan Domisili", category: "Kepatuhan", status: "Belum Upload" },
];

function statusIcon(status: DocItem["status"]) {
  switch (status) {
    case "Terunggah": return <CheckCircle2 className="h-4 w-4 text-ptba-green" />;
    case "Belum Upload": return <AlertTriangle className="h-4 w-4 text-ptba-gray" />;
  }
}

function statusColor(status: DocItem["status"]) {
  switch (status) {
    case "Terunggah": return "bg-ptba-green/10 text-ptba-green border-ptba-green/20";
    case "Belum Upload": return "bg-ptba-gray/10 text-ptba-gray border-ptba-gray/20";
  }
}

export default function MitraDocumentsPage() {
  const [filter, setFilter] = useState<string>("Semua");
  const categories = ["Semua", ...Array.from(new Set(documentChecklist.map((d) => d.category)))];

  const filtered = filter === "Semua" ? documentChecklist : documentChecklist.filter((d) => d.category === filter);
  const uploaded = documentChecklist.filter((d) => d.status === "Terunggah").length;
  const total = documentChecklist.length;
  const pct = Math.round((uploaded / total) * 100);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-ptba-charcoal">Dokumen Saya</h1>

      {/* Progress Overview */}
      <div className="rounded-xl bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm text-ptba-gray">Kelengkapan Dokumen</p>
            <p className="text-2xl font-bold text-ptba-charcoal">{uploaded}/{total} dokumen terunggah</p>
          </div>
          <span className="text-3xl font-bold text-ptba-steel-blue">{pct}%</span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-ptba-light-gray">
          <div className="h-full rounded-full bg-ptba-steel-blue transition-all" style={{ width: `${pct}%` }} />
        </div>
        <div className="mt-3 flex gap-4 text-xs text-ptba-gray">
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-ptba-green" /> Terunggah: {uploaded}</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-ptba-gray" /> Belum Upload: {documentChecklist.filter(d => d.status === "Belum Upload").length}</span>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={cn(
              "rounded-full px-4 py-1.5 text-xs font-medium transition-colors border",
              filter === cat ? "bg-ptba-navy text-white border-ptba-navy" : "bg-white text-ptba-gray border-ptba-light-gray hover:border-ptba-navy hover:text-ptba-navy"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Document Table */}
      <div className="rounded-xl bg-white shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-ptba-section-bg border-b border-ptba-light-gray">
              <th className="px-5 py-3 text-left font-semibold text-ptba-gray">No</th>
              <th className="px-5 py-3 text-left font-semibold text-ptba-gray">Dokumen</th>
              <th className="px-5 py-3 text-left font-semibold text-ptba-gray">Kategori</th>
              <th className="px-5 py-3 text-left font-semibold text-ptba-gray">Status</th>
              <th className="px-5 py-3 text-left font-semibold text-ptba-gray">Tanggal Upload</th>
              <th className="px-5 py-3 text-left font-semibold text-ptba-gray">Expired</th>
              <th className="px-5 py-3 text-center font-semibold text-ptba-gray">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((doc, idx) => (
              <tr key={doc.id} className="border-b border-ptba-light-gray/50 last:border-b-0 hover:bg-ptba-off-white transition-colors">
                <td className="px-5 py-3 text-ptba-gray">{idx + 1}</td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    {statusIcon(doc.status)}
                    <span className="font-medium text-ptba-charcoal">{doc.name}</span>
                  </div>
                </td>
                <td className="px-5 py-3 text-ptba-gray">{doc.category}</td>
                <td className="px-5 py-3">
                  <span className={cn("inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium", statusColor(doc.status))}>
                    {doc.status}
                  </span>
                </td>
                <td className="px-5 py-3 text-ptba-gray">{doc.uploadDate ?? "-"}</td>
                <td className="px-5 py-3 text-ptba-gray">{doc.expiryDate ?? "-"}</td>
                <td className="px-5 py-3 text-center">
                  <div className="flex items-center justify-center gap-2">
                    {doc.status === "Belum Upload" && (
                      <button className="flex items-center gap-1 rounded-lg bg-ptba-steel-blue px-3 py-1.5 text-xs font-medium text-white hover:bg-ptba-steel-light transition-colors">
                        <Upload className="h-3 w-3" /> Upload
                      </button>
                    )}
                    {doc.status === "Terunggah" && (
                      <button className="flex items-center gap-1 rounded-lg border border-ptba-light-gray px-3 py-1.5 text-xs font-medium text-ptba-gray hover:bg-ptba-section-bg transition-colors">
                        <Download className="h-3 w-3" /> Unduh
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
