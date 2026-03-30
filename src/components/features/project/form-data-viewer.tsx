"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils/cn";

const FIELD_LABELS: Record<string, string> = {
  companyName: "Nama Perusahaan",
  companyCode: "Kode Perusahaan",
  companyAddress: "Alamat Kantor Pusat",
  companyIndonesiaAddress: "Alamat Kantor Rep. Indonesia",
  companyPhone: "Nomor Telp Perusahaan",
  companyEmail: "Email Perusahaan",
  companyWebsite: "Website",
  companyStatus: "Status",
  yearEstablished: "Tahun Berdiri",
  countryEstablished: "Negara",
  businessOverview: "Overview Bidang Usaha",
  orgStructure: "Struktur Organisasi",
  subsidiaries: "Anak / Afiliasi Perusahaan",
  shareholderType: "Tipe Pemegang Saham",
  minorityEquityPercent: "Persentase Ekuitas Joint Venture (%)",
  equityNegotiable: "Dapat Dinegosiasikan",
  equityMinPercent: "Ekuitas Minimum yang Diterima (%)",
  canBecomeMinority: "Dapat Menjadi Minoritas",
  nib: "NIB",
  contactPerson: "Nama CP",
  contactPhone: "Nomor Telp CP",
  contactEmail: "Email CP",
  signerName: "Nama Penandatangan",
  signerPosition: "Jabatan",
  signerDate: "Tanggal Penandatangan",
  eoiAgreed: "Menyetujui EoI",
  creditRatingAgency: "Lembaga Rating",
  creditRatingValue: "Nilai Rating",
  cashOnHand: "Cash on Hand (Mill USD)",
  requirementNotes: "Catatan Persyaratan",
  agreedFinal: "Persetujuan Akhir",
  // Categorized experience fields
  plantName: "Nama Pembangkit Listrik",
  totalCapacityMW: "Kapasitas Total (MW)",
  equityPercent: "Ekuitas (%)",
  ippOrCaptive: "IPP / Captive",
  codYear: "COD Year",
  contractValueUSD: "Nilai Kontrak (USD)",
  workPortionPercent: "Porsi Pekerjaan (%)",
  financingType: "Jenis Pembiayaan",
  amountUSD: "Jumlah (USD)",
  projectName: "Nama Proyek",
  projectCost: "Nilai Proyek",
  location: "Lokasi",
  role: "Peran",
  description: "Deskripsi",
};

const EXPERIENCE_CATEGORY_LABELS: Record<string, { label: string; labelEn: string }> = {
  developer: { label: "Sebagai Developer", labelEn: "As a Successful Developer" },
  om_contractor: { label: "Sebagai Kontraktor O&M", labelEn: "As a Successful O&M Contractor" },
  financing: { label: "Sebagai Kontributor Pembiayaan Proyek", labelEn: "As a Successful Project Financing Contributor" },
};

const EXPERIENCE_SKIP_KEYS = new Set(["uid", "category"]);

const SECTIONS: { key: string; title: string; fields: string[] }[] = [
  {
    key: "company",
    title: "Informasi Perusahaan",
    fields: [
      "companyName", "companyCode", "businessOverview",
      "companyAddress", "companyIndonesiaAddress",
      "companyPhone", "companyEmail", "companyWebsite",
      "nib", "yearEstablished", "countryEstablished", "companyStatus",
      "orgStructure", "subsidiaries",
      "contactPerson", "contactPhone", "contactEmail",
    ],
  },
  {
    key: "eoi",
    title: "Surat Pernyataan EoI",
    fields: ["signerName", "signerPosition", "signerDate", "shareholderType", "minorityEquityPercent", "equityNegotiable", "equityMinPercent", "canBecomeMinority", "cashOnHand", "eoiAgreed"],
  },
  {
    key: "financial",
    title: "Data Keuangan",
    fields: ["creditRatingAgency", "creditRatingValue"],
  },
  {
    key: "requirements",
    title: "Pemenuhan Persyaratan",
    fields: ["requirementNotes", "agreedFinal"],
  },
];

// Special keys handled separately (not as simple fields)
const SPECIAL_KEYS = new Set(["financialYears", "requirementAnswers", "experiences"]);

function getLabel(key: string): string {
  return FIELD_LABELS[key] || key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase());
}

const VALUE_LABELS: Record<string, string> = {
  majority: "Pemegang Saham Mayoritas (>50%)",
  minority: "Pemegang Saham Minoritas (45–50%)",
  yes: "Ya",
  no: "Tidak",
};

function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "boolean") return value ? "Ya" : "Tidak";
  const str = String(value);
  return VALUE_LABELS[str] || str;
}

function Field({ label, value }: { label: string; value: string }) {
  if (value === "-") return null;
  return (
    <div>
      <dt className="text-[10px] text-ptba-gray">{label}</dt>
      <dd className="text-xs text-ptba-charcoal whitespace-pre-wrap">{value}</dd>
    </div>
  );
}

interface FormDataViewerProps {
  formData: Record<string, any>;
  className?: string;
}

export default function FormDataViewer({ formData, className }: FormDataViewerProps) {
  const allSectionKeys = useMemo(() => {
    const keys = new Set<string>();
    for (const s of SECTIONS) s.fields.forEach((f) => keys.add(f));
    SPECIAL_KEYS.forEach((k) => keys.add(k));
    return keys;
  }, []);

  if (!formData || Object.keys(formData).length === 0) {
    return <p className="text-xs text-ptba-gray italic">Belum ada data formulir.</p>;
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Known sections */}
      {SECTIONS.map((section) => {
        const visibleFields = section.fields.filter(
          (f) => formData[f] !== undefined && formData[f] !== "" && formData[f] !== null && typeof formData[f] !== "object"
        );
        const hasSpecial =
          (section.key === "financial" && formData.financialYears?.length > 0) ||
          (section.key === "requirements" && formData.requirementAnswers);

        if (visibleFields.length === 0 && !hasSpecial) return null;

        return (
          <div key={section.key} className="rounded-lg border border-ptba-light-gray/50 overflow-hidden">
            <div className="bg-ptba-section-bg px-3 py-2">
              <p className="text-xs font-semibold text-ptba-charcoal">{section.title}</p>
            </div>
            <div className="px-3 py-2.5 space-y-2">
              {/* Financial years table */}
              {section.key === "financial" && formData.financialYears?.length > 0 && (
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-ptba-light-gray">
                      <th className="py-1 text-left text-ptba-gray font-medium">Tahun</th>
                      <th className="py-1 text-left text-ptba-gray font-medium">Total Asset</th>
                      <th className="py-1 text-left text-ptba-gray font-medium">EBITDA</th>
                      <th className="py-1 text-left text-ptba-gray font-medium">DSCR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.financialYears.map((fy: any, i: number) => (
                      <tr key={i} className="border-b border-ptba-light-gray/30">
                        <td className="py-1 text-ptba-charcoal">{fy.year}</td>
                        <td className="py-1 text-ptba-charcoal">{fy.totalAsset || "-"}</td>
                        <td className="py-1 text-ptba-charcoal">{fy.ebitda || "-"}</td>
                        <td className="py-1 text-ptba-charcoal">{fy.dscr || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* Requirement answers summary */}
              {section.key === "requirements" && formData.requirementAnswers && (() => {
                const answers = formData.requirementAnswers;
                const total = Object.keys(answers).length;
                const met = Object.values(answers).filter(Boolean).length;
                return (
                  <p className={cn("text-xs", met === total ? "text-green-700" : "text-amber-700")}>
                    {met}/{total} persyaratan terpenuhi
                  </p>
                );
              })()}

              {/* Simple fields */}
              {visibleFields.length > 0 && (
                <dl className="grid grid-cols-2 gap-x-6 gap-y-2">
                  {visibleFields.map((f) => (
                    <Field key={f} label={getLabel(f)} value={formatValue(formData[f])} />
                  ))}
                </dl>
              )}
            </div>
          </div>
        );
      })}

      {/* Pengalaman Proyek */}
      {formData.experiences?.length > 0 && (() => {
        const isNewFormat = formData.experiences[0]?.category;
        if (isNewFormat) {
          // New categorized format — group by category
          const grouped: Record<string, any[]> = {};
          for (const exp of formData.experiences) {
            const cat = exp.category || 'unknown';
            if (!grouped[cat]) grouped[cat] = [];
            grouped[cat].push(exp);
          }
          return (
            <div className="rounded-lg border border-ptba-light-gray/50 overflow-hidden">
              <div className="bg-ptba-section-bg px-3 py-2">
                <p className="text-xs font-semibold text-ptba-charcoal">Pengalaman Proyek Relevan</p>
              </div>
              <div className="px-3 py-2.5 space-y-3">
                {Object.entries(grouped).map(([cat, exps]) => {
                  const catLabel = EXPERIENCE_CATEGORY_LABELS[cat];
                  return (
                    <div key={cat} className="space-y-2">
                      <div>
                        <p className="text-[11px] font-semibold text-ptba-charcoal">{catLabel?.label || cat}</p>
                        {catLabel?.labelEn && <p className="text-[10px] text-ptba-gray italic">{catLabel.labelEn}</p>}
                      </div>
                      {exps.map((exp: any, i: number) => (
                        <div key={exp.uid || i} className="rounded-lg border border-ptba-light-gray/50 p-2.5">
                          <p className="text-[10px] font-semibold text-ptba-charcoal mb-1">#{i + 1}</p>
                          <dl className="grid grid-cols-2 gap-x-4 gap-y-1">
                            {Object.entries(exp)
                              .filter(([k, v]) => !EXPERIENCE_SKIP_KEYS.has(k) && v !== undefined && v !== "" && v !== null)
                              .map(([k, v]) => (
                                <Field key={k} label={getLabel(k)} value={formatValue(v)} />
                              ))}
                          </dl>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        }
        // Old flat format — backward compatibility
        return (
          <div className="rounded-lg border border-ptba-light-gray/50 overflow-hidden">
            <div className="bg-ptba-section-bg px-3 py-2">
              <p className="text-xs font-semibold text-ptba-charcoal">Pengalaman Proyek</p>
            </div>
            <div className="px-3 py-2.5 space-y-2">
              {formData.experiences.map((exp: any, i: number) => (
                <div key={i} className="rounded-lg border border-ptba-light-gray/50 p-2.5">
                  <p className="text-[10px] font-semibold text-ptba-charcoal mb-1">Pengalaman #{i + 1}</p>
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-1">
                    {Object.entries(exp)
                      .filter(([, v]) => v !== undefined && v !== "" && v !== null)
                      .map(([k, v]) => (
                        <Field key={k} label={getLabel(k)} value={formatValue(v)} />
                      ))}
                  </dl>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Remaining unknown fields */}
      {(() => {
        const remaining = Object.entries(formData).filter(
          ([k, v]) =>
            !allSectionKeys.has(k) &&
            !SPECIAL_KEYS.has(k) &&
            v !== undefined &&
            v !== "" &&
            v !== null &&
            typeof v !== "object"
        );
        if (remaining.length === 0) return null;
        return (
          <div className="rounded-lg border border-ptba-light-gray/50 overflow-hidden">
            <div className="bg-ptba-section-bg px-3 py-2">
              <p className="text-xs font-semibold text-ptba-charcoal">Informasi Lainnya</p>
            </div>
            <div className="px-3 py-2.5">
              <dl className="grid grid-cols-2 gap-x-6 gap-y-2">
                {remaining.map(([k, v]) => (
                  <Field key={k} label={getLabel(k)} value={formatValue(v)} />
                ))}
              </dl>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
