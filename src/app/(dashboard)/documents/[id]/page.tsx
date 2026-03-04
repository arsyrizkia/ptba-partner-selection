"use client";

import { useParams } from "next/navigation";
import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { mockDocuments } from "@/lib/mock-data";
import { formatDate } from "@/lib/utils/format";
import {
  ArrowLeft,
  FileText,
  Download,
  Eye,
  Building2,
  FolderKanban,
  User,
  HardDrive,
  Calendar,
  Tag,
} from "lucide-react";
import Link from "next/link";

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

type VersionRow = {
  version: number;
  uploadDate: string;
  uploadedBy: string;
  notes: string;
  fileUrl: string;
} & Record<string, unknown>;

export default function DocumentDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const document = useMemo(
    () => mockDocuments.find((d) => d.id === id),
    [id]
  );

  if (!document) {
    return (
      <div className="space-y-6">
        <Link
          href="/documents"
          className="inline-flex items-center gap-1 text-sm text-ptba-steel-blue hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Manajemen Dokumen
        </Link>
        <Card padding="lg">
          <p className="text-center text-ptba-gray">
            Dokumen dengan ID &quot;{id}&quot; tidak ditemukan.
          </p>
        </Card>
      </div>
    );
  }

  const versionColumns = [
    {
      key: "version",
      label: "Versi",
      render: (item: VersionRow) => (
        <span className="font-medium">v{item.version}</span>
      ),
    },
    {
      key: "uploadDate",
      label: "Tanggal",
      render: (item: VersionRow) => <span>{formatDate(item.uploadDate)}</span>,
    },
    {
      key: "uploadedBy",
      label: "Diunggah Oleh",
    },
    {
      key: "notes",
      label: "Catatan",
      render: (item: VersionRow) => (
        <span className="text-ptba-gray text-xs">{item.notes}</span>
      ),
    },
    {
      key: "fileUrl",
      label: "Ukuran",
      render: () => (
        <span className="text-ptba-gray">{document.fileSize ?? "-"}</span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <Link
        href="/documents"
        className="inline-flex items-center gap-1 text-sm text-ptba-steel-blue hover:underline"
      >
        <ArrowLeft className="h-4 w-4" />
        Kembali ke Manajemen Dokumen
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <h1 className="text-2xl font-bold text-ptba-charcoal">
          Detail Dokumen
        </h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Eye className="h-4 w-4 mr-1.5" />
            Preview
          </Button>
          <Button variant="navy" size="sm">
            <Download className="h-4 w-4 mr-1.5" />
            Download
          </Button>
        </div>
      </div>

      {/* Document Metadata */}
      <Card accent="gold" padding="lg">
        <div className="flex items-start gap-4 mb-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-ptba-section-bg">
            <FileText className="h-6 w-6 text-ptba-steel-blue" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-ptba-charcoal">
              {document.name}
            </h2>
            <Badge variant={getStatusVariant(document.status)} className="mt-1">
              {document.status}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="flex items-start gap-3">
            <Tag className="h-5 w-5 text-ptba-steel-blue mt-0.5" />
            <div>
              <p className="text-xs text-ptba-gray">Tipe Dokumen</p>
              <p className="text-sm font-medium text-ptba-charcoal">
                {document.type}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Building2 className="h-5 w-5 text-ptba-steel-blue mt-0.5" />
            <div>
              <p className="text-xs text-ptba-gray">Mitra</p>
              <p className="text-sm font-medium text-ptba-charcoal">
                {document.partnerName}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <FolderKanban className="h-5 w-5 text-ptba-steel-blue mt-0.5" />
            <div>
              <p className="text-xs text-ptba-gray">Proyek</p>
              <p className="text-sm font-medium text-ptba-charcoal">
                {document.projectName ?? "-"}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <FileText className="h-5 w-5 text-ptba-steel-blue mt-0.5" />
            <div>
              <p className="text-xs text-ptba-gray">Versi Saat Ini</p>
              <p className="text-sm font-medium text-ptba-charcoal">
                v{document.version}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <User className="h-5 w-5 text-ptba-steel-blue mt-0.5" />
            <div>
              <p className="text-xs text-ptba-gray">Diunggah Oleh</p>
              <p className="text-sm font-medium text-ptba-charcoal">
                {document.uploadedBy ?? "-"}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <HardDrive className="h-5 w-5 text-ptba-steel-blue mt-0.5" />
            <div>
              <p className="text-xs text-ptba-gray">Ukuran File</p>
              <p className="text-sm font-medium text-ptba-charcoal">
                {document.fileSize ?? "-"}
              </p>
            </div>
          </div>
          {document.uploadDate && (
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-ptba-steel-blue mt-0.5" />
              <div>
                <p className="text-xs text-ptba-gray">Tanggal Upload</p>
                <p className="text-sm font-medium text-ptba-charcoal">
                  {formatDate(document.uploadDate)}
                </p>
              </div>
            </div>
          )}
          {document.expiryDate && (
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-ptba-red mt-0.5" />
              <div>
                <p className="text-xs text-ptba-gray">Tanggal Kedaluwarsa</p>
                <p className="text-sm font-medium text-ptba-charcoal">
                  {formatDate(document.expiryDate)}
                </p>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Version History */}
      {document.versionHistory.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-ptba-charcoal mb-4">
            Riwayat Versi
          </h3>
          <DataTable
            columns={versionColumns}
            data={document.versionHistory as VersionRow[]}
          />
        </div>
      )}

      {/* Nota Dinas Template Preview */}
      <Card padding="lg">
        <h3 className="text-lg font-semibold text-ptba-charcoal mb-4">
          Preview Template Nota Dinas
        </h3>
        <div className="rounded-lg border border-ptba-light-gray bg-ptba-off-white p-6">
          <div className="max-w-2xl mx-auto space-y-4 text-sm text-ptba-charcoal">
            <div className="text-center border-b-2 border-ptba-navy pb-4 mb-4">
              <p className="text-xs text-ptba-gray tracking-widest">
                PT BUKIT ASAM Tbk
              </p>
              <p className="text-lg font-bold text-ptba-navy mt-1">
                NOTA DINAS
              </p>
            </div>

            <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
              <span className="text-ptba-gray">Nomor</span>
              <span>: ND/xxx/PTBA/2026</span>
              <span className="text-ptba-gray">Tanggal</span>
              <span>: 4 Maret 2026</span>
              <span className="text-ptba-gray">Kepada</span>
              <span>: Direktur Utama PT Bukit Asam Tbk</span>
              <span className="text-ptba-gray">Dari</span>
              <span>: VP Pengembangan Usaha</span>
              <span className="text-ptba-gray">Perihal</span>
              <span>: Hasil Evaluasi Pemilihan Mitra Kerja</span>
            </div>

            <div className="border-t border-ptba-light-gray pt-4 mt-4">
              <p className="text-ptba-gray italic">
                Dengan hormat,
              </p>
              <p className="mt-2 text-ptba-gray italic">
                Bersama ini kami sampaikan hasil evaluasi pemilihan mitra kerja
                untuk proyek {document.projectName ?? "[Nama Proyek]"} sebagai berikut:
              </p>
              <p className="mt-2 text-ptba-gray italic">
                1. Evaluasi teknis telah dilaksanakan sesuai ketentuan...<br />
                2. Evaluasi keuangan berdasarkan KEP-100/MBU/2002...<br />
                3. Evaluasi legal dan compliance...<br />
                4. Evaluasi risiko...
              </p>
              <p className="mt-4 text-ptba-gray italic">
                Demikian nota dinas ini disampaikan untuk mendapat arahan dan
                persetujuan Bapak.
              </p>
            </div>

            <div className="pt-6 text-right">
              <p className="text-ptba-gray italic">Hormat kami,</p>
              <p className="mt-8 text-ptba-gray italic">[Nama & Jabatan]</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
