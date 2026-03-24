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
    doc.setTextColor(30, 58, 92); // navy
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
    const lines = doc.splitTextToSize(value || "-", contentWidth - 40);
    doc.text(lines, margin + 40, y);
    y += Math.max(5, lines.length * 4.5);
  };

  const addSeparator = () => {
    y += 2;
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, y, pageWidth - margin, y);
    y += 4;
  };

  // Header
  addTitle(`Formulir Aplikasi — ${partnerName}`);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(120, 120, 120);
  doc.text(`Digenerate: ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}`, margin, y);
  y += 8;
  doc.setTextColor(0, 0, 0);

  // 1. Informasi Perusahaan
  addSectionHeader("1. Informasi Perusahaan");
  addField("Nama Perusahaan", formData.companyName);
  addField("Alamat", formData.companyAddress);
  addField("Website", formData.companyWebsite);
  addField("Tahun Berdiri", formData.yearEstablished);
  addField("Negara", formData.countryEstablished);
  addSeparator();

  // 2. Surat Pernyataan EoI
  addSectionHeader("2. Surat Pernyataan EoI");
  addField("Penandatangan", formData.signerName);
  addField("Jabatan", formData.signerPosition);
  addField("Tanggal", formData.signerDate);
  addField("Menyetujui EoI", formData.eoiAgreed ? "Ya" : "Tidak");
  addSeparator();

  // 3. Pengalaman Proyek
  addSectionHeader("3. Pengalaman Proyek");
  const experiences = formData.experiences || [];
  if (experiences.length === 0) {
    addField("Data", "Tidak ada data pengalaman");
  } else {
    experiences.forEach((exp: any, i: number) => {
      addPageIfNeeded(25);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text(`Pengalaman #${i + 1} (${exp.category || "-"})`, margin, y);
      y += 5;
      addField("Nama Pembangkit", exp.plantName);
      addField("Lokasi", exp.location);
      addField("Kapasitas Total", exp.totalCapacityMW ? `${exp.totalCapacityMW} MW` : "-");
      if (exp.category === "developer") {
        addField("Ekuitas", exp.equityPercent ? `${exp.equityPercent}%` : "-");
        addField("IPP/Captive", exp.ippOrCaptive);
        addField("Tahun COD", exp.codYear);
      } else if (exp.category === "om_contractor") {
        addField("Nilai Kontrak", exp.contractValueUSD ? `USD ${exp.contractValueUSD}` : "-");
        addField("Porsi Pekerjaan", exp.workPortionPercent ? `${exp.workPortionPercent}%` : "-");
        addField("IPP/Captive", exp.ippOrCaptive);
        addField("Tahun COD", exp.codYear);
      } else if (exp.category === "financing") {
        addField("Tipe Pembiayaan", exp.financingType);
        addField("Jumlah", exp.amountUSD ? `USD ${exp.amountUSD}` : "-");
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
    financialYears.forEach((fy: any) => {
      addField(`Tahun ${fy.year}`, `Total Asset: ${fy.totalAsset || "-"} | EBITDA: ${fy.ebitda || "-"} | DSCR: ${fy.dscr || "-"}`);
    });
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

  doc.save(`Formulir_${partnerName.replace(/\s+/g, "_")}.pdf`);
}
