"use client";

import { useState, useEffect } from "react";
import { FileText, FolderKanban, Loader2, CheckCircle2, Eye, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useAuth } from "@/lib/auth/auth-context";
import { api } from "@/lib/api/client";
import { formatDate } from "@/lib/utils/format";
import { DOCUMENT_TYPES } from "@/lib/constants/document-types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002/api";

// Map document type to which form_data fields to show
const FORM_DATA_MAP: Record<string, { title: string; render: (fd: any) => React.ReactNode }> = {
  compro: {
    title: "Informasi Perusahaan",
    render: (fd) => (
      <dl className="grid grid-cols-2 gap-x-6 gap-y-2">
        <Field label="Nama Perusahaan" value={fd.companyName} />
        <Field label="Alamat" value={fd.companyAddress} />
        <Field label="Website" value={fd.companyWebsite} />
        <Field label="Tahun Berdiri" value={fd.yearEstablished} />
        <Field label="Negara" value={fd.countryEstablished} />
      </dl>
    ),
  },
  statement_eoi: {
    title: "Surat Pernyataan EoI",
    render: (fd) => (
      <dl className="grid grid-cols-2 gap-x-6 gap-y-2">
        <Field label="Nama Penandatangan" value={fd.signerName} />
        <Field label="Jabatan" value={fd.signerPosition} />
        <Field label="Tanggal" value={fd.signerDate} />
        <Field label="Menyetujui EoI" value={fd.eoiAgreed ? "Ya" : "Tidak"} />
      </dl>
    ),
  },
  portfolio: {
    title: "Pengalaman Proyek",
    render: (fd) => {
      const exps = fd.experiences || [];
      if (exps.length === 0) return <p className="text-xs text-ptba-gray">Tidak ada data pengalaman.</p>;
      return (
        <div className="space-y-3">
          {exps.map((exp: any, i: number) => (
            <div key={i} className="rounded-lg border border-ptba-light-gray/50 p-3">
              <p className="text-xs font-semibold text-ptba-charcoal mb-1.5">Pengalaman #{i + 1}</p>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-1.5">
                <Field label="Nama Proyek" value={exp.projectName} />
                <Field label="Lokasi" value={exp.location} />
                <Field label="Tipe" value={exp.type} />
                <Field label="Peran" value={exp.role} />
                <Field label="Tahun" value={exp.year} />
                <Field label="Nilai Proyek" value={exp.projectCost} />
              </dl>
              {exp.description && (
                <div className="mt-1.5">
                  <span className="text-[10px] text-ptba-gray">Deskripsi:</span>
                  <p className="text-xs text-ptba-charcoal">{exp.description}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      );
    },
  },
  financial_overview: {
    title: "Data Keuangan",
    render: (fd) => {
      const years = fd.financialYears || [];
      return (
        <div className="space-y-3">
          {years.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-ptba-light-gray">
                    <th className="py-1.5 text-left text-ptba-gray font-medium">Tahun</th>
                    <th className="py-1.5 text-left text-ptba-gray font-medium">Total Asset</th>
                    <th className="py-1.5 text-left text-ptba-gray font-medium">EBITDA</th>
                    <th className="py-1.5 text-left text-ptba-gray font-medium">DSCR</th>
                  </tr>
                </thead>
                <tbody>
                  {years.map((fy: any, i: number) => (
                    <tr key={i} className="border-b border-ptba-light-gray/30">
                      <td className="py-1.5 text-ptba-charcoal">{fy.year}</td>
                      <td className="py-1.5 text-ptba-charcoal">{fy.totalAsset || "-"}</td>
                      <td className="py-1.5 text-ptba-charcoal">{fy.ebitda || "-"}</td>
                      <td className="py-1.5 text-ptba-charcoal">{fy.dscr || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {(fd.creditRatingAgency || fd.creditRatingValue) && (
            <dl className="grid grid-cols-2 gap-x-6 gap-y-2">
              <Field label="Lembaga Rating" value={fd.creditRatingAgency} />
              <Field label="Nilai Rating" value={fd.creditRatingValue} />
            </dl>
          )}
        </div>
      );
    },
  },
  requirements_fulfillment: {
    title: "Pemenuhan Persyaratan",
    render: (fd) => (
      <div className="space-y-2">
        {fd.requirementAnswers && Object.keys(fd.requirementAnswers).length > 0 ? (
          <p className="text-xs text-green-700">Semua persyaratan telah dikonfirmasi.</p>
        ) : (
          <p className="text-xs text-ptba-gray">Tidak ada data persyaratan.</p>
        )}
        {fd.requirementNotes && (
          <div>
            <span className="text-[10px] text-ptba-gray">Catatan:</span>
            <p className="text-xs text-ptba-charcoal">{fd.requirementNotes}</p>
          </div>
        )}
      </div>
    ),
  },
};

function Field({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <dt className="text-[10px] text-ptba-gray">{label}</dt>
      <dd className="text-xs text-ptba-charcoal">{value || "-"}</dd>
    </div>
  );
}

export default function MitraDocumentsPage() {
  const { accessToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [application, setApplication] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [formData, setFormData] = useState<any>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!accessToken) return;
    (async () => {
      try {
        const res = await api<{ applications: any[] }>("/applications", { token: accessToken });
        const apps = (res.applications || []).filter((a: any) => a.status !== "Draft");
        if (apps.length === 0) {
          setLoading(false);
          return;
        }
        const latest = apps[0];
        setApplication(latest);

        const detail = await api<{ application: any }>(`/applications/${latest.id}`, { token: accessToken });
        const allDocs = [
          ...(detail.application.phase1Documents || []),
          ...(detail.application.phase2Documents || []),
          ...(detail.application.generalDocuments || []),
        ];
        setDocuments(allDocs);

        // Parse form data
        const fd = detail.application.form_data;
        if (fd) {
          setFormData(typeof fd === "string" ? JSON.parse(fd) : fd);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    })();
  }, [accessToken]);

  const toggle = (docId: string) => {
    setExpanded((prev) => ({ ...prev, [docId]: !prev[docId] }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-ptba-steel-blue" />
        <span className="ml-3 text-ptba-gray">Memuat...</span>
      </div>
    );
  }

  if (!application || documents.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-ptba-charcoal">Dokumen Saya</h1>
        <div className="rounded-xl bg-white p-12 text-center shadow-sm">
          <FolderKanban className="mx-auto h-12 w-12 text-ptba-light-gray" />
          <p className="mt-3 text-lg font-semibold text-ptba-charcoal">Belum ada dokumen</p>
          <p className="mt-1 text-sm text-ptba-gray">Anda belum mengunggah dokumen pada pendaftaran manapun.</p>
        </div>
      </div>
    );
  }

  const handleView = async (doc: any) => {
    if (!accessToken || !doc.file_key) return;
    try {
      const key = encodeURIComponent(doc.file_key);
      const res = await fetch(`/api/documents/download?key=${key}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) return;
      const blob = await res.blob();
      window.open(URL.createObjectURL(blob), "_blank");
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-ptba-charcoal">Dokumen Saya</h1>
        <span className="text-sm text-ptba-gray">{documents.length} dokumen</span>
      </div>

      {/* Project context */}
      <div className="rounded-xl bg-gradient-to-r from-ptba-navy to-ptba-steel-blue p-4 text-white">
        <p className="text-xs text-white/60">Proyek</p>
        <p className="font-semibold">{application.project_name}</p>
        <p className="text-xs text-white/60 mt-1">Diajukan {formatDate(application.applied_at)} · Status: {application.status}</p>
      </div>

      {/* Documents list */}
      <div className="space-y-3">
        {documents.map((doc) => {
          const meta = DOCUMENT_TYPES.find((dt) => dt.id === doc.document_type_id);
          const docName = meta?.name || doc.name;
          const phaseLabel = doc.phase === "phase1" ? "Fase 1" : doc.phase === "phase2" ? "Fase 2" : "Umum";
          const formSection = formData ? FORM_DATA_MAP[doc.document_type_id] : null;
          const hasForm = !!formSection;
          const isOpen = expanded[doc.id] ?? false;

          return (
            <div key={doc.id} className="rounded-xl bg-white shadow-sm overflow-hidden">
              {/* Row */}
              <div className="flex items-center gap-4 px-5 py-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-ptba-steel-blue/10">
                  <FileText className="h-5 w-5 text-ptba-steel-blue" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ptba-charcoal truncate">{docName}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-xs text-ptba-gray">{phaseLabel}</span>
                    {doc.upload_date && (
                      <span className="text-xs text-ptba-gray">Diunggah: {formatDate(doc.upload_date)}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="inline-flex items-center gap-1 rounded-full bg-green-50 border border-green-200 px-2.5 py-0.5 text-[11px] font-medium text-green-700">
                    <CheckCircle2 className="h-3 w-3" />
                    {doc.status}
                  </span>
                  {doc.file_key && (
                    <button
                      onClick={() => handleView(doc)}
                      className="inline-flex items-center gap-1 rounded-lg border border-ptba-light-gray px-2.5 py-1.5 text-xs font-medium text-ptba-gray hover:bg-ptba-section-bg transition-colors"
                    >
                      <Eye className="h-3 w-3" /> Lihat
                    </button>
                  )}
                  {hasForm && (
                    <button
                      onClick={() => toggle(doc.id)}
                      className="inline-flex items-center gap-1 rounded-lg border border-ptba-light-gray px-2.5 py-1.5 text-xs font-medium text-ptba-gray hover:bg-ptba-section-bg transition-colors"
                    >
                      {isOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                      Data
                    </button>
                  )}
                </div>
              </div>

              {/* Accordion: form data */}
              {hasForm && isOpen && (
                <div className="border-t border-ptba-light-gray/50 bg-ptba-section-bg/30 px-5 py-4">
                  <p className="text-xs font-semibold text-ptba-charcoal mb-3">{formSection!.title}</p>
                  {formSection!.render(formData)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
