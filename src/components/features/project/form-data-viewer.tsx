"use client";

import { cn } from "@/lib/utils/cn";

// Human-readable labels for known form fields
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
  requirementNotes: "Catatan Persyaratan",
  agreedFinal: "Persetujuan Akhir",
};

// Fields to group into sections
const SECTION_MAP: { key: string; title: string; fields: string[] }[] = [
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
    fields: ["signerName", "signerPosition", "signerDate", "eoiAgreed"],
  },
  {
    key: "financial",
    title: "Data Keuangan",
    fields: ["financialYears", "creditRatingAgency", "creditRatingValue"],
  },
  {
    key: "requirements",
    title: "Pemenuhan Persyaratan",
    fields: ["requirementAnswers", "requirementNotes", "agreedFinal"],
  },
];

function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "boolean") return value ? "Ya" : "Tidak";
  if (typeof value === "number") return String(value);
  if (typeof value === "string") return value;
  return JSON.stringify(value);
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] text-ptba-gray">{label}</dt>
      <dd className="text-xs text-ptba-charcoal whitespace-pre-wrap">{value}</dd>
    </div>
  );
}

function renderExperiences(experiences: any[]) {
  if (!experiences || experiences.length === 0) return <p className="text-xs text-ptba-gray">Tidak ada data pengalaman.</p>;
  return (
    <div className="space-y-2">
      {experiences.map((exp: any, i: number) => (
        <div key={i} className="rounded-lg border border-ptba-light-gray/50 p-2.5">
          <p className="text-[10px] font-semibold text-ptba-charcoal mb-1">Pengalaman #{i + 1}</p>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-1">
            {Object.entries(exp).map(([k, v]) => (
              <Field key={k} label={FIELD_LABELS[k] || k.replace(/([A-Z])/g, " $1").replace(/^./, s => s.toUpperCase())} value={formatValue(v)} />
            ))}
          </dl>
        </div>
      ))}
    </div>
  );
}

function renderFinancialYears(years: any[]) {
  if (!years || years.length === 0) return <p className="text-xs text-ptba-gray">Tidak ada data keuangan.</p>;
  return (
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
        {years.map((fy: any, i: number) => (
          <tr key={i} className="border-b border-ptba-light-gray/30">
            <td className="py-1 text-ptba-charcoal">{fy.year}</td>
            <td className="py-1 text-ptba-charcoal">{fy.totalAsset || "-"}</td>
            <td className="py-1 text-ptba-charcoal">{fy.ebitda || "-"}</td>
            <td className="py-1 text-ptba-charcoal">{fy.dscr || "-"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function renderRequirementAnswers(answers: Record<string, boolean>) {
  if (!answers || Object.keys(answers).length === 0) return <p className="text-xs text-ptba-gray">Tidak ada data persyaratan.</p>;
  const total = Object.keys(answers).length;
  const met = Object.values(answers).filter(Boolean).length;
  return (
    <p className={cn("text-xs", met === total ? "text-green-700" : "text-amber-700")}>
      {met}/{total} persyaratan terpenuhi
    </p>
  );
}

interface FormDataViewerProps {
  formData: Record<string, any>;
  className?: string;
}

export default function FormDataViewer({ formData, className }: FormDataViewerProps) {
  if (!formData || Object.keys(formData).length === 0) {
    return <p className="text-xs text-ptba-gray italic">Belum ada data formulir.</p>;
  }

  const renderedKeys = new Set<string>();

  return (
    <div className={cn("space-y-4", className)}>
      {/* Render known sections */}
      {SECTION_MAP.map((section) => {
        const hasAnyField = section.fields.some((f) => formData[f] !== undefined && formData[f] !== "" && formData[f] !== null);
        if (!hasAnyField && section.key !== "company") return null;

        return (
          <div key={section.key} className="rounded-lg border border-ptba-light-gray/50 overflow-hidden">
            <div className="bg-ptba-section-bg px-3 py-2">
              <p className="text-xs font-semibold text-ptba-charcoal">{section.title}</p>
            </div>
            <div className="px-3 py-2.5 space-y-2">
              {section.key === "financial" && formData.financialYears && (
                <>
                  {renderFinancialYears(formData.financialYears)}
                  {renderedKeys.add("financialYears")}
                </>
              )}
              {section.key === "requirements" && formData.requirementAnswers && (
                <>
                  {renderRequirementAnswers(formData.requirementAnswers)}
                  {renderedKeys.add("requirementAnswers")}
                </>
              )}
              <dl className="grid grid-cols-2 gap-x-6 gap-y-2">
                {section.fields
                  .filter((f) => formData[f] !== undefined && formData[f] !== "" && formData[f] !== null && !renderedKeys.has(f))
                  .filter((f) => typeof formData[f] !== "object")
                  .map((f) => {
                    renderedKeys.add(f);
                    const label = FIELD_LABELS[f] || f.replace(/([A-Z])/g, " $1").replace(/^./, s => s.toUpperCase());
                    return <Field key={f} label={label} value={formatValue(formData[f])} />;
                  })}
              </dl>
            </div>
          </div>
        );
      })}

      {/* Pengalaman Proyek */}
      {formData.experiences && formData.experiences.length > 0 && (
        <div className="rounded-lg border border-ptba-light-gray/50 overflow-hidden">
          <div className="bg-ptba-section-bg px-3 py-2">
            <p className="text-xs font-semibold text-ptba-charcoal">Pengalaman Proyek</p>
          </div>
          <div className="px-3 py-2.5">
            {renderExperiences(formData.experiences)}
            {renderedKeys.add("experiences")}
          </div>
        </div>
      )}

      {/* Any remaining fields not in known sections */}
      {(() => {
        const remaining = Object.entries(formData).filter(
          ([k, v]) => !renderedKeys.has(k) && v !== undefined && v !== "" && v !== null && typeof v !== "object"
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
                  <Field key={k} label={FIELD_LABELS[k] || k.replace(/([A-Z])/g, " $1").replace(/^./, s => s.toUpperCase())} value={formatValue(v)} />
                ))}
              </dl>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
