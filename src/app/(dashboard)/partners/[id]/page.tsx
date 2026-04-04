"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Building2, Loader2, Mail, Phone, Globe, MapPin, Calendar, FileText, Download } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useAuth } from "@/lib/auth/auth-context";
import { api, downloadDocument } from "@/lib/api/client";
import { formatDate } from "@/lib/utils/format";

export default function PartnerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { accessToken } = useAuth();
  const [partner, setPartner] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<any[]>([]);

  useEffect(() => {
    if (!accessToken) return;
    (async () => {
      try {
        const res = await api<{ data: any }>(`/partners/${id}`, { token: accessToken });
        setPartner(res.data);

        // Fetch applications for this partner
        try {
          const appsRes = await api<{ applications: any[] }>(`/partners/${id}/applications`, { token: accessToken });
          setApplications(appsRes.applications || []);
        } catch { /* may not have applications endpoint */ }
      } catch {
        setPartner(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [id, accessToken]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-ptba-steel-blue" />
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="space-y-6">
        <button onClick={() => router.back()} className="inline-flex items-center gap-1.5 text-sm text-ptba-gray hover:text-ptba-navy transition-colors">
          <ArrowLeft className="h-4 w-4" /> Kembali
        </button>
        <div className="rounded-xl bg-white p-12 shadow-sm text-center">
          <Building2 className="h-12 w-12 text-ptba-light-gray mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-ptba-charcoal">Mitra Tidak Ditemukan</h2>
          <p className="text-sm text-ptba-gray mt-1">Mitra dengan ID ini tidak ditemukan.</p>
        </div>
      </div>
    );
  }

  const profileFields = [
    { label: "Nama Perusahaan", value: partner.name, icon: Building2 },
    { label: "Kode", value: partner.code },
    { label: "NIB", value: partner.nib },
    { label: "Overview Bisnis", value: partner.business_overview || partner.businessOverview, full: true },
    { label: "Alamat Kantor Pusat", value: partner.address },
    { label: "Alamat Rep. Indonesia", value: partner.indonesia_office_address || partner.indonesiaOfficeAddress },
    { label: "Telepon", value: partner.phone, icon: Phone },
    { label: "Email", value: partner.company_domain ? `info@${partner.company_domain}` : partner.email, icon: Mail },
    { label: "Website", value: partner.website, icon: Globe },
    { label: "Negara", value: partner.country || "Indonesia", icon: MapPin },
    { label: "Tahun Berdiri", value: partner.year_established || partner.yearEstablished, icon: Calendar },
    { label: "Status", value: partner.status },
  ];

  const contactFields = [
    { label: "Contact Person", value: partner.contact_person || partner.contactPerson },
    { label: "Telepon CP", value: partner.contact_phone || partner.contactPhone },
    { label: "Email CP", value: partner.contact_email || partner.contactEmail },
  ];

  return (
    <div className="space-y-6">
      <button onClick={() => router.back()} className="inline-flex items-center gap-1.5 text-sm text-ptba-gray hover:text-ptba-navy transition-colors">
        <ArrowLeft className="h-4 w-4" /> Kembali
      </button>

      {/* Header */}
      <div className="rounded-xl bg-gradient-to-r from-ptba-navy to-ptba-steel-blue p-6 text-white">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 text-lg font-bold">
                {(partner.name || "?")[0]}
              </div>
              <div>
                <h1 className="text-xl font-bold">{partner.name}</h1>
                <p className="text-sm text-white/70">{partner.code || partner.nib || ""}</p>
              </div>
            </div>
            {partner.business_overview && (
              <p className="text-sm text-white/80 mt-2 max-w-2xl">{partner.business_overview}</p>
            )}
          </div>
          <div className="text-right shrink-0">
            <span className={cn(
              "rounded-full px-3 py-1 text-xs font-semibold",
              partner.status === "active" || partner.status === "Aktif" ? "bg-green-500/20 text-green-200" : "bg-white/20 text-white/70"
            )}>
              {partner.status === "active" ? "Aktif" : partner.status}
            </span>
          </div>
        </div>
      </div>

      {/* Profile */}
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-ptba-charcoal mb-4">Profil Perusahaan</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
          {profileFields.filter(f => f.value).map((field) => (
            <div key={field.label} className={field.full ? "md:col-span-2" : ""}>
              <p className="text-[10px] text-ptba-gray uppercase tracking-wider mb-0.5">{field.label}</p>
              <p className="text-sm font-medium text-ptba-charcoal">{field.value}</p>
            </div>
          ))}
        </div>

        {/* Contact Person */}
        <div className="border-t border-ptba-light-gray mt-4 pt-4">
          <p className="text-xs font-semibold text-ptba-charcoal mb-2">Contact Person</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {contactFields.filter(f => f.value).map((field) => (
              <div key={field.label}>
                <p className="text-[10px] text-ptba-gray uppercase tracking-wider mb-0.5">{field.label}</p>
                <p className="text-sm font-medium text-ptba-charcoal">{field.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Documents */}
      {partner.documents && partner.documents.length > 0 && (
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-ptba-charcoal mb-4">Dokumen Perusahaan</h2>
          <div className="space-y-2">
            {partner.documents.map((doc: any) => (
              <div key={doc.id} className="flex items-center gap-3 rounded-lg border border-ptba-light-gray p-3">
                <FileText className="h-5 w-5 text-ptba-steel-blue shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ptba-charcoal truncate">{doc.name || doc.document_type}</p>
                  {doc.uploaded_at && <p className="text-xs text-ptba-gray">{formatDate(doc.uploaded_at)}</p>}
                </div>
                {doc.file_key && accessToken && (
                  <button
                    onClick={() => downloadDocument(doc.file_key, accessToken)}
                    className="inline-flex items-center gap-1 rounded-lg border border-ptba-light-gray px-2.5 py-1.5 text-xs font-medium text-ptba-gray hover:bg-ptba-section-bg transition-colors shrink-0"
                  >
                    <Download className="h-3 w-3" /> Unduh
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Applications */}
      {applications.length > 0 && (
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-ptba-charcoal mb-4">Riwayat Pendaftaran</h2>
          <div className="space-y-2">
            {applications.map((app: any) => (
              <div key={app.id} className="flex items-center justify-between rounded-lg border border-ptba-light-gray p-3">
                <div>
                  <p className="text-sm font-medium text-ptba-charcoal">{app.project_name || app.projectName || "Proyek"}</p>
                  <p className="text-xs text-ptba-gray">
                    {app.applied_at ? formatDate(app.applied_at) : ""} · Status: {app.status}
                  </p>
                </div>
                <span className={cn(
                  "rounded-full px-2.5 py-0.5 text-xs font-medium",
                  app.status === "Shortlisted" ? "bg-green-100 text-green-700" :
                  app.status === "Ditolak" ? "bg-red-100 text-red-700" :
                  "bg-ptba-steel-blue/10 text-ptba-steel-blue"
                )}>
                  {app.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
