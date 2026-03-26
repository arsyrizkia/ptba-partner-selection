import { jsPDF } from "jspdf";

export function generateApplicationPdf(
  partnerName: string,
  formData: Record<string, any>,
) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let y = 20;

  const addPageIfNeeded = (needed: number) => {
    if (y + needed > 275) {
      doc.addPage();
      y = 20;
    }
  };

  const addTitle = (text: string) => {
    addPageIfNeeded(12);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(text, margin, y);
    y += 8;
  };

  const addSectionHeader = (text: string) => {
    addPageIfNeeded(10);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 58, 92);
    doc.text(text, margin, y);
    y += 6;
    doc.setTextColor(0, 0, 0);
  };

  const addField = (label: string, value: string) => {
    addPageIfNeeded(8);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(label + ":", margin, y);
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(value || "-", contentWidth - 45);
    doc.text(lines, margin + 45, y);
    y += Math.max(5, lines.length * 4.5);
  };

  const addSeparator = () => {
    y += 2;
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, y, pageWidth - margin, y);
    y += 4;
  };

  // Header
  addTitle(`Formulir Expression of Interest — ${partnerName}`);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(120, 120, 120);
  doc.text(`Digenerate: ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}`, margin, y);
  y += 8;
  doc.setTextColor(0, 0, 0);

  // 1. Informasi Perusahaan
  addSectionHeader("1. Informasi Perusahaan");
  addField("Nama Perusahaan", formData.companyName);
  addField("Kode Perusahaan", formData.companyCode);
  addField("Overview Bidang Usaha", formData.businessOverview);
  addField("Alamat Kantor Pusat", formData.companyAddress);
  addField("Alamat Rep. Indonesia", formData.companyIndonesiaAddress);
  addField("Telepon", formData.companyPhone);
  addField("Email", formData.companyEmail);
  addField("Website", formData.companyWebsite);
  addField("NIB", formData.nib);
  addField("Tahun Berdiri", formData.yearEstablished);
  addField("Negara", formData.countryEstablished);
  addField("Status", formData.companyStatus);
  addField("Struktur Organisasi", formData.orgStructure);
  addField("Anak Perusahaan", formData.subsidiaries);
  addField("Contact Person", formData.contactPerson);
  addField("Telepon CP", formData.contactPhone);
  addField("Email CP", formData.contactEmail);
  addSeparator();

  // 2. Surat Pernyataan EoI
  addSectionHeader("2. Surat Pernyataan Expression of Interest");
  addField("Penandatangan", formData.signerName);
  addField("Jabatan", formData.signerPosition);
  addField("Tanggal", formData.signerDate);
  addField("Ekuitas JV (%)", formData.minorityEquityPercent ? `${formData.minorityEquityPercent}%` : "-");
  addField("Cash on Hand", formData.cashOnHand ? `USD ${formData.cashOnHand}` : "-");
  addField("Menyetujui EoI", formData.eoiAgreed ? "Ya" : "Tidak");
  addSeparator();

  // 3. Pengalaman Proyek
  addSectionHeader("3. Pengalaman Proyek");
  const catLabels: Record<string, string> = { developer: "Developer", om_contractor: "O&M Contractor", financing: "Pembiayaan" };
  const experiences = formData.experiences || [];
  if (experiences.length === 0) {
    addField("Data", "Tidak ada data pengalaman");
  } else {
    experiences.forEach((exp: any, i: number) => {
      addPageIfNeeded(25);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text(`Pengalaman #${i + 1} — ${catLabels[exp.category] || exp.category || "-"}`, margin, y);
      y += 5;
      addField("Nama Pembangkit", exp.plantName);
      addField("Lokasi", exp.location);
      addField("Kapasitas (MW)", exp.totalCapacityMW);
      if (exp.category === "developer") {
        addField("Ekuitas (%)", exp.equityPercent);
        addField("IPP / Captive", exp.ippOrCaptive);
        addField("Tahun COD", exp.codYear);
      } else if (exp.category === "om_contractor") {
        addField("Nilai Kontrak (USD)", exp.contractValueUSD);
        addField("Porsi Kerja (%)", exp.workPortionPercent);
        addField("IPP / Captive", exp.ippOrCaptive);
        addField("Tahun COD", exp.codYear);
      } else if (exp.category === "financing") {
        addField("Tipe Pembiayaan", exp.financingType);
        addField("Jumlah (USD)", exp.amountUSD);
        addField("Tahun", exp.year);
      }
      y += 2;
    });
  }
  addSeparator();

  // 4. Data Keuangan
  addSectionHeader("4. Data Keuangan");
  const financialYears = formData.financialYears || [];
  if (financialYears.length > 0) {
    // Table header
    addPageIfNeeded(15);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    const colX = [margin, margin + 25, margin + 65, margin + 105];
    doc.text("Tahun", colX[0], y);
    doc.text("Total Asset", colX[1], y);
    doc.text("EBITDA", colX[2], y);
    doc.text("DSCR", colX[3], y);
    y += 4;
    doc.setDrawColor(180, 180, 180);
    doc.line(margin, y, pageWidth - margin, y);
    y += 3;
    doc.setFont("helvetica", "normal");
    financialYears.forEach((fy: any) => {
      addPageIfNeeded(6);
      doc.text(String(fy.year), colX[0], y);
      doc.text(fy.totalAsset || "-", colX[1], y);
      doc.text(fy.ebitda || "-", colX[2], y);
      doc.text(fy.dscr || "-", colX[3], y);
      y += 5;
    });
    y += 2;
  }
  if (formData.creditRatingAgency) addField("Lembaga Rating", formData.creditRatingAgency);
  if (formData.creditRatingValue) addField("Nilai Rating", formData.creditRatingValue);
  addSeparator();

  // 5. Pemenuhan Persyaratan
  addSectionHeader("5. Pemenuhan Persyaratan");
  if (formData.requirementAnswers && Object.keys(formData.requirementAnswers).length > 0) {
    addField("Status", "Semua persyaratan dikonfirmasi");
  } else {
    addField("Status", "Tidak ada data");
  }
  if (formData.requirementNotes) addField("Catatan", formData.requirementNotes);
  if (formData.agreedFinal) addField("Pernyataan Akhir", "Disetujui");

  // Save
  const safeName = partnerName.replace(/[^a-zA-Z0-9\s]/g, "").replace(/\s+/g, "_");
  doc.save(`Formulir_EoI_${safeName}.pdf`);
}
