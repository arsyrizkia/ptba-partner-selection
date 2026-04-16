const SHAREHOLDER_LABELS: Record<string, string> = {
  majority: "Pemegang Saham Mayoritas (>50% - 51%)",
  minority: "Pemegang Saham Minoritas (&lt;50%)",
};

function esc(s: string | undefined | null): string {
  if (!s) return "-";
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function generateApplicationPdf(
  partnerName: string,
  formData: Record<string, any>,
) {
  const fd = formData;
  const experiences = fd.experiences || [];
  const financialYears = fd.financialYears || [];
  const catLabels: Record<string, string> = { developer: "Developer", om_contractor: "O&M Contractor", financing: "Project Financing", general: "General Project" };
  const today = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

  const html = `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8">
<title>Formulir Pendaftaran Fase 1 — ${esc(partnerName)}</title>
<style>
@page { size: A4; margin: 18mm 15mm 18mm 15mm; }
@media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } .no-break { break-inside: avoid; } }
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: 'Segoe UI', -apple-system, sans-serif; font-size: 9.5pt; color: #1e293b; line-height: 1.5; }

/* Header */
.header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 14px; border-bottom: 3px solid #1B3A5C; margin-bottom: 16px; }
.header-left h1 { font-size: 15pt; font-weight: 800; color: #1B3A5C; margin-bottom: 2px; }
.header-left p { font-size: 8pt; color: #64748b; }
.header-right { text-align: right; }
.header-right .brand { font-size: 10pt; font-weight: 700; color: #1B3A5C; }
.header-right .brand span { color: #F2A900; }
.header-right .date { font-size: 7.5pt; color: #94a3b8; margin-top: 2px; }

/* Sections */
.section { margin-bottom: 14px; }
.section-title { font-size: 10.5pt; font-weight: 700; color: #fff; background: linear-gradient(135deg, #1B3A5C, #2E75B6); padding: 6px 12px; border-radius: 4px; margin-bottom: 8px; }
.section-num { display: inline-block; background: #F2A900; color: #1B3A5C; font-weight: 800; width: 20px; height: 20px; text-align: center; line-height: 20px; border-radius: 3px; margin-right: 6px; font-size: 9pt; }

/* Field grid */
.fields { display: grid; grid-template-columns: 1fr 1fr; gap: 2px 16px; }
.fields.full { grid-template-columns: 1fr; }
.field { padding: 4px 0; border-bottom: 1px solid #f1f5f9; }
.field-label { font-size: 7.5pt; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; }
.field-value { font-size: 9pt; color: #1e293b; font-weight: 500; }
.field-value.highlight { color: #1B3A5C; font-weight: 700; }

/* Tables */
table { width: 100%; border-collapse: collapse; font-size: 8.5pt; margin: 4px 0; }
th { background: #f8fafc; color: #64748b; font-weight: 600; text-align: left; padding: 5px 8px; border: 1px solid #e2e8f0; font-size: 7.5pt; text-transform: uppercase; letter-spacing: 0.3px; }
td { padding: 4px 8px; border: 1px solid #e2e8f0; color: #1e293b; }
tr:nth-child(even) td { background: #fafbfc; }

/* Experience cards */
.exp-card { border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px 10px; margin-bottom: 6px; background: #fafbfc; }
.exp-header { font-size: 9pt; font-weight: 700; color: #2E75B6; margin-bottom: 4px; }

/* Badge */
.badge { display: inline-block; font-size: 7.5pt; font-weight: 600; padding: 2px 8px; border-radius: 3px; }
.badge-green { background: #dcfce7; color: #166534; }
.badge-blue { background: #dbeafe; color: #1e40af; }

/* Footer */
.footer { margin-top: 20px; padding-top: 10px; border-top: 1px solid #e2e8f0; font-size: 7pt; color: #94a3b8; text-align: center; }
</style>
</head>
<body>

<!-- Header -->
<div class="header">
  <div class="header-left">
    <h1>Formulir Pendaftaran Fase 1</h1>
    <p>${esc(partnerName)}</p>
  </div>
  <div class="header-right">
    <div class="brand"><span>PRIMA</span> PTBA</div>
    <div style="font-size:6pt;color:#94a3b8;margin-top:1px;">Platform Registrasi, Informasi &amp; Manajemen Mitra</div>
    <div class="date">Digenerate: ${today}</div>
  </div>
</div>

<!-- 1. Informasi Perusahaan -->
<div class="section no-break">
  <div class="section-title"><span class="section-num">1</span>Informasi Perusahaan</div>
  <div class="fields">
    <div class="field"><div class="field-label">Nama Perusahaan</div><div class="field-value highlight">${esc(fd.companyName)}</div></div>
    <div class="field"><div class="field-label">Kode Perusahaan</div><div class="field-value">${esc(fd.companyCode)}</div></div>
    <div class="field"><div class="field-label">Overview Bidang Usaha</div><div class="field-value">${esc(fd.businessOverview)}</div></div>
    ${fd.valueProposition ? `<div class="field"><div class="field-label">Value Proposition</div><div class="field-value">${esc(fd.valueProposition)}</div></div>` : ""}
    ${fd.developmentPlan ? `<div class="field"><div class="field-label">Rencana Pengembangan / Proyek</div><div class="field-value">${esc(fd.developmentPlan)}</div></div>` : ""}
    ${fd.companyVision ? `<div class="field"><div class="field-label">Visi</div><div class="field-value">${esc(fd.companyVision)}</div></div>` : ""}
    ${fd.companyMission ? `<div class="field"><div class="field-label">Misi</div><div class="field-value">${esc(fd.companyMission)}</div></div>` : ""}
    ${fd.companyHistory ? `<div class="field"><div class="field-label">Sejarah Perusahaan</div><div class="field-value">${esc(fd.companyHistory)}</div></div>` : ""}
    <div class="field"><div class="field-label">NIB</div><div class="field-value">${esc(fd.nib)}</div></div>
    <div class="field"><div class="field-label">Alamat Kantor Pusat</div><div class="field-value">${esc(fd.companyAddress)}</div></div>
    <div class="field"><div class="field-label">Alamat Rep. Indonesia</div><div class="field-value">${esc(fd.companyIndonesiaAddress)}</div></div>
    <div class="field"><div class="field-label">Telepon</div><div class="field-value">${esc(fd.companyPhone)}</div></div>
    <div class="field"><div class="field-label">Email</div><div class="field-value">${esc(fd.companyEmail)}</div></div>
    <div class="field"><div class="field-label">Website</div><div class="field-value">${esc(fd.companyWebsite)}</div></div>
    <div class="field"><div class="field-label">Tahun Berdiri</div><div class="field-value">${esc(fd.yearEstablished)}</div></div>
    <div class="field"><div class="field-label">Negara</div><div class="field-value">${esc(fd.countryEstablished)}</div></div>
    <div class="field"><div class="field-label">Status</div><div class="field-value">${esc(fd.companyStatus)}</div></div>
  </div>
  <div class="fields" style="margin-top:4px;">
    <div class="field"><div class="field-label">Contact Person</div><div class="field-value">${esc(fd.contactPerson)}</div></div>
    <div class="field"><div class="field-label">Telepon CP</div><div class="field-value">${esc(fd.contactPhone)}</div></div>
    <div class="field"><div class="field-label">Email CP</div><div class="field-value">${esc(fd.contactEmail)}</div></div>
  </div>
  ${fd.shareholderComposition ? `<div class="fields" style="margin-top:4px;">
    <div class="field"><div class="field-label">Komposisi Pemegang Saham</div><div class="field-value">${esc(fd.shareholderComposition)}</div></div>
  </div>` : ""}
</div>

<!-- 2. Surat Pernyataan EoI -->
<div class="section no-break">
  <div class="section-title"><span class="section-num">2</span>Surat Pernyataan Expression of Interest</div>
  <div class="fields">
    <div class="field"><div class="field-label">Nama Penandatangan</div><div class="field-value highlight">${esc(fd.signerName)}</div></div>
    <div class="field"><div class="field-label">Jabatan</div><div class="field-value">${esc(fd.signerPosition)}</div></div>
    <div class="field"><div class="field-label">Tanggal</div><div class="field-value">${esc(fd.signerDate)}</div></div>
    <div class="field"><div class="field-label">Tipe Pemegang Saham</div><div class="field-value highlight">${esc(SHAREHOLDER_LABELS[fd.shareholderType] || fd.shareholderType)}</div></div>
    <div class="field"><div class="field-label">Ekuitas Joint Venture</div><div class="field-value highlight">${fd.minorityEquityPercent ? `${esc(fd.minorityEquityPercent)}%` : "-"}</div></div>
    <div class="field"><div class="field-label">Dapat Dinegosiasikan</div><div class="field-value">${fd.equityNegotiable === "yes" ? '<span class="badge badge-green">Ya</span>' : fd.equityNegotiable === "no" ? "Tidak" : "-"}</div></div>
    ${fd.equityNegotiable === "yes" && fd.shareholderType === "majority" ? `<div class="field"><div class="field-label">Dapat Menjadi Minoritas</div><div class="field-value">${fd.canBecomeMinority === "yes" ? "Ya" : "Tidak"}</div></div>` : ""}
    ${fd.equityNegotiable === "yes" ? `<div class="field"><div class="field-label">Ekuitas Minimum</div><div class="field-value">${fd.equityMinPercent ? `${esc(fd.equityMinPercent)}%` : "-"}</div></div>` : ""}
    <div class="field"><div class="field-label">Cash on Hand</div><div class="field-value highlight">${fd.cashOnHand ? `$ ${esc(fd.cashOnHand)} Mn` : "-"}</div></div>
    <div class="field"><div class="field-label">Menyetujui EoI</div><div class="field-value">${fd.eoiAgreed ? '<span class="badge badge-green">Ya</span>' : "Tidak"}</div></div>
  </div>
</div>

<!-- 3. Pengalaman Proyek -->
<div class="section">
  <div class="section-title"><span class="section-num">3</span>Pengalaman Proyek</div>
  ${fd.noExperience ? '<p style="font-size:9pt;color:#92400e;background:#fffbeb;padding:10px;border-radius:6px;">Ditandai tidak memiliki pengalaman</p>' : experiences.length === 0 ? '<p style="font-size:8.5pt;color:#94a3b8;padding:8px 0;">Tidak ada data pengalaman</p>' : experiences.map((exp: any, i: number) => `
  <div class="exp-card no-break">
    <div class="exp-header">Pengalaman #${i + 1} — ${esc(catLabels[exp.category] || exp.category)}</div>
    <div class="fields">
      <div class="field"><div class="field-label">Nama Pembangkit</div><div class="field-value">${esc(exp.plantName)}</div></div>
      <div class="field"><div class="field-label">Lokasi</div><div class="field-value">${esc(exp.location)}</div></div>
      <div class="field"><div class="field-label">Kapasitas (MW)</div><div class="field-value">${esc(exp.totalCapacityMW)}</div></div>
      ${exp.category === "developer" ? `
        <div class="field"><div class="field-label">Ekuitas (%)</div><div class="field-value">${esc(exp.equityPercent)}</div></div>
        <div class="field"><div class="field-label">IPP / Captive</div><div class="field-value">${esc(exp.ippOrCaptive)}</div></div>
        <div class="field"><div class="field-label">Tahun COD</div><div class="field-value">${esc(exp.codYear)}</div></div>
      ` : exp.category === "om_contractor" ? `
        <div class="field"><div class="field-label">Nilai Kontrak (USD)</div><div class="field-value">${esc(exp.contractValueUSD)}</div></div>
        <div class="field"><div class="field-label">Porsi Kerja (%)</div><div class="field-value">${esc(exp.workPortionPercent)}</div></div>
        <div class="field"><div class="field-label">IPP / Captive</div><div class="field-value">${esc(exp.ippOrCaptive)}</div></div>
        <div class="field"><div class="field-label">Tahun COD</div><div class="field-value">${esc(exp.codYear)}</div></div>
      ` : exp.category === "financing" ? `
        <div class="field"><div class="field-label">Tipe Pembiayaan</div><div class="field-value">${esc(exp.financingType)}</div></div>
        <div class="field"><div class="field-label">Jumlah (USD)</div><div class="field-value">${esc(exp.amountUSD)}</div></div>
        <div class="field"><div class="field-label">Tahun COD</div><div class="field-value">${esc(exp.codYear || exp.year)}</div></div>
      ` : exp.category === "general" ? `
        <div class="field"><div class="field-label">Jenis Proyek</div><div class="field-value">${esc(exp.projectType)}</div></div>
        <div class="field"><div class="field-label">Peran</div><div class="field-value">${esc(exp.role)}</div></div>
        ${exp.contractValueUSD ? `<div class="field"><div class="field-label">Nilai Kontrak (USD)</div><div class="field-value">${esc(exp.contractValueUSD)}</div></div>` : ""}
        <div class="field"><div class="field-label">Tahun COD</div><div class="field-value">${esc(exp.codYear || exp.year)}</div></div>
        ${exp.description ? `<div class="field"><div class="field-label">Deskripsi</div><div class="field-value">${esc(exp.description)}</div></div>` : ""}
      ` : ""}
    </div>
  </div>`).join("")}
</div>

<!-- 4. Data Keuangan -->
<div class="section no-break">
  <div class="section-title"><span class="section-num">4</span>Data Keuangan</div>
  ${financialYears.length > 0 ? `
  <table>
    <thead>
      <tr><th>Tahun</th><th>Mata Uang</th><th>Total Liability</th><th>Total Equity</th><th>Total Asset</th><th>Cash &amp; Equivalents</th><th>Total IBD</th><th>EBITDA</th><th>DSCR</th></tr>
    </thead>
    <tbody>
      ${financialYears.map((fy: any) => `<tr><td>${esc(fy.year)}</td><td><strong>${esc(fy.currency)}</strong></td><td>${esc(fy.totalDebt)}</td><td>${esc(fy.totalEquity)}</td><td><strong>${esc(fy.totalAsset)}</strong></td><td>${esc(fy.cashOnHand)}</td><td>${esc(fy.totalIBD)}</td><td>${esc(fy.ebitda)}</td><td>${esc(fy.dscr)}</td></tr>`).join("")}
    </tbody>
  </table>` : ""}
  <div class="fields" style="margin-top:6px;">
    ${fd.creditRatingAgency ? `<div class="field"><div class="field-label">Lembaga Rating</div><div class="field-value highlight">${esc(fd.creditRatingAgency)}</div></div>` : ""}
    ${fd.creditRatingValue ? `<div class="field"><div class="field-label">Nilai Rating</div><div class="field-value highlight">${esc(fd.creditRatingValue)}</div></div>` : ""}
  </div>
</div>

<!-- 5. Pemenuhan Persyaratan -->
<div class="section no-break">
  <div class="section-title"><span class="section-num">5</span>Pemenuhan Persyaratan</div>
  <div class="fields">
    <div class="field"><div class="field-label">Status Persyaratan</div><div class="field-value">${fd.requirementAnswers && Object.keys(fd.requirementAnswers).length > 0 ? '<span class="badge badge-green">Semua Terpenuhi</span>' : "-"}</div></div>
    ${fd.requirementNotes ? `<div class="field"><div class="field-label">Catatan</div><div class="field-value">${esc(fd.requirementNotes)}</div></div>` : ""}
    <div class="field"><div class="field-label">Pernyataan Akhir</div><div class="field-value">${fd.agreedFinal ? '<span class="badge badge-green">Disetujui</span>' : "Belum"}</div></div>
  </div>
</div>

<div class="footer">
  PT Bukit Asam (Persero) Tbk — PRIMA (Platform Registrasi, Informasi &amp; Manajemen Mitra) PTBA<br>
  Dokumen ini digenerate secara otomatis dan bersifat rahasia.
</div>

</body>
</html>`;

  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(html);
  win.document.close();
  // Auto-trigger print dialog after render
  win.onload = () => setTimeout(() => win.print(), 300);
}
