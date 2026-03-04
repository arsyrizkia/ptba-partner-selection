"use client";

import { useState } from "react";
import {
  Building2,
  Phone,
  Mail,
  MapPin,
  Globe,
  User,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Clock,
  XCircle,
  FileX,
  FileText,
  Download,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { Partner } from "@/lib/types";

function docStatusIcon(status: string) {
  if (status === "Lengkap")
    return <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-green-500" />;
  if (status === "Pending")
    return <Clock className="h-3.5 w-3.5 shrink-0 text-amber-500" />;
  if (status === "Ditolak")
    return <XCircle className="h-3.5 w-3.5 shrink-0 text-red-500" />;
  return <FileX className="h-3.5 w-3.5 shrink-0 text-gray-400" />;
}

function docStatusClass(status: string) {
  if (status === "Lengkap") return "text-green-700 bg-green-50";
  if (status === "Pending") return "text-amber-700 bg-amber-50";
  if (status === "Ditolak") return "text-red-700 bg-red-50";
  return "text-gray-500 bg-gray-50";
}

export function PartnerInfoPanel({ partner }: { partner: Partner }) {
  const [docsOpen, setDocsOpen] = useState(true);

  const docComplete = partner.documents.filter((d) => d.status === "Lengkap").length;
  const docTotal = partner.documents.length;
  const pct = docTotal > 0 ? Math.round((docComplete / docTotal) * 100) : 0;

  return (
    <div className="space-y-3">
      {/* Profile Card */}
      <div className="rounded-xl bg-white p-4 shadow-sm">
        <div className="flex items-start gap-3 mb-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-ptba-navy/10">
            <Building2 className="h-5 w-5 text-ptba-navy" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-ptba-charcoal leading-snug text-sm">
              {partner.name}
            </p>
            <p className="text-xs text-ptba-gray mt-0.5">{partner.code} · {partner.industry}</p>
          </div>
        </div>

        <dl className="space-y-2 text-xs">
          <div className="flex items-start gap-2">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-ptba-gray mt-0.5" />
            <span className="text-ptba-gray leading-relaxed">{partner.address}</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="h-3.5 w-3.5 shrink-0 text-ptba-gray" />
            <span className="text-ptba-charcoal">{partner.phone}</span>
          </div>
          <div className="flex items-center gap-2">
            <Mail className="h-3.5 w-3.5 shrink-0 text-ptba-gray" />
            <span className="text-ptba-charcoal truncate">{partner.email}</span>
          </div>
          {partner.website && (
            <div className="flex items-center gap-2">
              <Globe className="h-3.5 w-3.5 shrink-0 text-ptba-gray" />
              <a
                href={partner.website}
                target="_blank"
                rel="noreferrer"
                className="text-ptba-steel-blue truncate hover:underline"
              >
                {partner.website.replace(/^https?:\/\//, "")}
              </a>
            </div>
          )}
          <div className="flex items-center gap-2">
            <User className="h-3.5 w-3.5 shrink-0 text-ptba-gray" />
            <span className="text-ptba-charcoal">
              {partner.contactPerson} · {partner.contactPhone}
            </span>
          </div>
        </dl>

        <div className="mt-3 pt-3 border-t border-ptba-light-gray space-y-1.5 text-xs">
          <div className="flex justify-between">
            <span className="text-ptba-gray">NPWP</span>
            <span className="font-mono text-ptba-charcoal">{partner.npwp}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-ptba-gray">SIUP</span>
            <span className="font-mono text-ptba-charcoal text-right">{partner.siup}</span>
          </div>
        </div>
      </div>

      {/* Document Checklist */}
      <div className="rounded-xl bg-white shadow-sm overflow-hidden">
        <button
          onClick={() => setDocsOpen((v) => !v)}
          className="flex w-full items-center justify-between px-4 py-3 text-sm font-semibold text-ptba-charcoal hover:bg-ptba-section-bg transition-colors"
        >
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-ptba-navy" />
            Dokumen
            <span
              className={cn(
                "rounded-full px-1.5 py-0.5 text-xs font-medium",
                pct === 100 ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
              )}
            >
              {docComplete}/{docTotal}
            </span>
          </div>
          {docsOpen ? (
            <ChevronUp className="h-4 w-4 text-ptba-gray" />
          ) : (
            <ChevronDown className="h-4 w-4 text-ptba-gray" />
          )}
        </button>

        {/* Progress bar */}
        <div className="h-1 w-full bg-ptba-light-gray">
          <div
            className={cn(
              "h-full transition-all",
              pct === 100 ? "bg-green-500" : pct >= 70 ? "bg-ptba-steel-blue" : "bg-ptba-gold"
            )}
            style={{ width: `${pct}%` }}
          />
        </div>

        {docsOpen && (
          <div className="divide-y divide-ptba-light-gray/60 max-h-[400px] overflow-y-auto">
            {partner.documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-start gap-2 px-4 py-2.5"
              >
                {docStatusIcon(doc.status)}
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-ptba-charcoal leading-snug truncate">
                    {doc.name}
                  </p>
                  <p className="text-[10px] text-ptba-gray">{doc.type}</p>
                </div>
                {doc.status === "Lengkap" && doc.fileUrl && (
                  <a
                    href={doc.fileUrl}
                    download
                    className="flex items-center justify-center h-6 w-6 shrink-0 rounded-md text-ptba-gray hover:bg-ptba-navy/10 hover:text-ptba-navy transition-colors"
                    title={`Unduh ${doc.name}`}
                  >
                    <Download className="h-3 w-3" />
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
