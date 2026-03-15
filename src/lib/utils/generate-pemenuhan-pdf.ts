import jsPDF from "jspdf";

// ─── PTBA Brand Colors ───
const NAVY: [number, number, number] = [27, 58, 92];
const RED: [number, number, number] = [200, 16, 46];
const GOLD: [number, number, number] = [242, 169, 0];
const CHARCOAL: [number, number, number] = [26, 26, 26];
const GRAY: [number, number, number] = [102, 102, 102];
const LIGHT_GRAY: [number, number, number] = [229, 229, 229];
const SECTION_BG: [number, number, number] = [237, 242, 249];
const WHITE: [number, number, number] = [255, 255, 255];

type RGB = [number, number, number];

function setFill(doc: jsPDF, c: RGB) { doc.setFillColor(c[0], c[1], c[2]); }
function setDraw(doc: jsPDF, c: RGB) { doc.setDrawColor(c[0], c[1], c[2]); }
function setText(doc: jsPDF, c: RGB) { doc.setTextColor(c[0], c[1], c[2]); }

/** Draw a small checkbox square (empty) */
function drawCheckbox(doc: jsPDF, cx: number, cy: number, size = 3.5) {
  setDraw(doc, NAVY);
  doc.setLineWidth(0.4);
  doc.rect(cx - size / 2, cy - size / 2, size, size, "S");
}

function drawHeaderFooter(doc: jsPDF, pageNum: number) {
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();

  // Header bar
  setFill(doc, NAVY);
  doc.rect(0, 0, w, 28, "F");
  setFill(doc, GOLD);
  doc.rect(0, 28, w, 1, "F");

  setText(doc, WHITE);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("PT BUKIT ASAM Tbk", 20, 14);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("Sistem Pemilihan Mitra Strategis", 20, 21);

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("DOKUMEN PEMENUHAN PERSYARATAN", w - 20, 12, { align: "right" });
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text("Fase 1 - Expression of Interest (EoI)", w - 20, 19, { align: "right" });

  // Footer
  setFill(doc, LIGHT_GRAY);
  doc.rect(0, h - 14, w, 14, "F");
  setFill(doc, RED);
  doc.rect(0, h - 14.5, w, 0.5, "F");

  setText(doc, GRAY);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text("Dokumen Rahasia - Hanya untuk keperluan proses seleksi mitra PT Bukit Asam Tbk", 20, h - 6);
  doc.text(`Halaman ${pageNum}`, w - 20, h - 6, { align: "right" });
}

export function generatePemenuhanPersyaratanPDF(
  projectName: string,
  requirements: string[],
) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const w = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentW = w - 2 * margin;
  let y = 0;
  let pageNum = 1;
  const maxY = doc.internal.pageSize.getHeight() - 20;

  function newPageIfNeeded(needed: number) {
    if (y + needed > maxY) {
      doc.addPage();
      pageNum++;
      drawHeaderFooter(doc, pageNum);
      y = 38;
    }
  }

  // ── Page 1 ──
  drawHeaderFooter(doc, pageNum);
  y = 38;

  // Title
  setText(doc, NAVY);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("FORMULIR PEMENUHAN PERSYARATAN", w / 2, y, { align: "center" });
  y += 8;

  setText(doc, GRAY);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Proyek: " + projectName, w / 2, y, { align: "center" });
  y += 5;
  doc.text("Fase 1 - Expression of Interest (EoI)", w / 2, y, { align: "center" });
  y += 6;

  setDraw(doc, NAVY);
  doc.setLineWidth(0.5);
  doc.line(margin, y, w - margin, y);
  y += 8;

  // ── Section A: Informasi Perusahaan ──
  setText(doc, NAVY);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("A. INFORMASI PERUSAHAAN", margin, y);
  y += 6;

  setText(doc, CHARCOAL);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  const introLines = doc.splitTextToSize(
    "Isilah data perusahaan Anda di bawah ini. Pastikan informasi sesuai dengan dokumen legal yang berlaku.",
    contentW,
  );
  doc.text(introLines, margin, y);
  y += introLines.length * 4 + 4;

  const fields = [
    "Nama Perusahaan", "Alamat", "Kota / Provinsi", "Nomor Telepon",
    "Email", "NPWP", "Bidang Usaha", "Tahun Berdiri",
  ];
  for (const field of fields) {
    newPageIfNeeded(8);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    setText(doc, CHARCOAL);
    doc.text(field, margin, y);
    doc.setFont("helvetica", "normal");
    setDraw(doc, LIGHT_GRAY);
    doc.setLineWidth(0.3);
    doc.line(margin + 40, y + 1, w - margin, y + 1);
    doc.text(":", margin + 37, y);
    y += 8;
  }
  y += 4;

  // ── Section B: Pemenuhan Persyaratan ──
  newPageIfNeeded(35);
  setText(doc, NAVY);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("B. PEMENUHAN PERSYARATAN PROYEK", margin, y);
  y += 6;

  setText(doc, CHARCOAL);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  const instrText =
    "Berikut adalah persyaratan yang ditetapkan oleh PT Bukit Asam Tbk untuk proyek ini. " +
    "Berikan tanda centang pada kolom Ya atau Tidak untuk setiap persyaratan, " +
    "serta berikan penjelasan atau bukti pendukung pada kolom Keterangan.";
  const instrLines = doc.splitTextToSize(instrText, contentW);
  doc.text(instrLines, margin, y);
  y += instrLines.length * 4 + 4;

  // Table layout
  const col = {
    no: { x: margin, w: 10 },
    req: { x: margin + 10, w: 62 },
    ya: { x: margin + 72, w: 14 },
    tidak: { x: margin + 86, w: 14 },
    ket: { x: margin + 100, w: contentW - 100 },
  };
  const totalTableW = contentW;

  // Header row
  newPageIfNeeded(14);
  const hdrH = 10;
  setFill(doc, NAVY);
  doc.rect(margin, y, totalTableW, hdrH, "F");
  setDraw(doc, NAVY);
  doc.setLineWidth(0.3);
  doc.rect(margin, y, totalTableW, hdrH, "S");

  // Header vertical lines
  doc.line(col.req.x, y, col.req.x, y + hdrH);
  doc.line(col.ya.x, y, col.ya.x, y + hdrH);
  doc.line(col.tidak.x, y, col.tidak.x, y + hdrH);
  doc.line(col.ket.x, y, col.ket.x, y + hdrH);

  setText(doc, WHITE);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("No.", col.no.x + col.no.w / 2, y + 6.5, { align: "center" });
  doc.text("Persyaratan", col.req.x + 3, y + 6.5);
  doc.text("Ya", col.ya.x + col.ya.w / 2, y + 6.5, { align: "center" });
  doc.text("Tidak", col.tidak.x + col.tidak.w / 2, y + 6.5, { align: "center" });
  doc.text("Keterangan / Bukti", col.ket.x + 3, y + 6.5);
  y += hdrH;

  // Requirement rows
  for (let i = 0; i < requirements.length; i++) {
    const reqText = requirements[i];
    doc.setFontSize(9);
    const lines = doc.splitTextToSize(reqText, col.req.w - 6);
    const rowH = Math.max(14, lines.length * 4 + 8);

    newPageIfNeeded(rowH);

    // Row background
    setFill(doc, i % 2 === 1 ? SECTION_BG : WHITE);
    doc.rect(margin, y, totalTableW, rowH, "F");

    // Row border + vertical lines
    setDraw(doc, NAVY);
    doc.setLineWidth(0.3);
    doc.rect(margin, y, totalTableW, rowH, "S");
    doc.line(col.req.x, y, col.req.x, y + rowH);
    doc.line(col.ya.x, y, col.ya.x, y + rowH);
    doc.line(col.tidak.x, y, col.tidak.x, y + rowH);
    doc.line(col.ket.x, y, col.ket.x, y + rowH);

    // Text
    setText(doc, CHARCOAL);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`${i + 1}.`, col.no.x + col.no.w / 2, y + 7, { align: "center" });
    doc.text(lines, col.req.x + 3, y + 7);

    // Draw checkbox squares
    drawCheckbox(doc, col.ya.x + col.ya.w / 2, y + rowH / 2);
    drawCheckbox(doc, col.tidak.x + col.tidak.w / 2, y + rowH / 2);

    y += rowH;
  }
  y += 8;

  // ── Section C: Catatan Tambahan ──
  newPageIfNeeded(50);
  setText(doc, NAVY);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("C. CATATAN TAMBAHAN", margin, y);
  y += 6;

  setText(doc, CHARCOAL);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Berikan catatan atau penjelasan tambahan terkait pemenuhan persyaratan di atas (jika ada):", margin, y);
  y += 8;

  for (let i = 0; i < 6; i++) {
    setDraw(doc, LIGHT_GRAY);
    doc.setLineWidth(0.3);
    doc.line(margin, y, w - margin, y);
    y += 8;
  }
  y += 4;

  // ── Section D: Daftar Dokumen Pendukung ──
  newPageIfNeeded(80);
  setText(doc, NAVY);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("D. DAFTAR DOKUMEN PENDUKUNG YANG DILAMPIRKAN", margin, y);
  y += 6;

  setText(doc, CHARCOAL);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  const docInstrLines = doc.splitTextToSize(
    "Sebutkan dokumen pendukung yang dilampirkan bersama formulir ini sebagai bukti pemenuhan persyaratan:",
    contentW,
  );
  doc.text(docInstrLines, margin, y);
  y += docInstrLines.length * 4 + 4;

  const dcol = {
    no: { x: margin, w: 12 },
    nama: { x: margin + 12, w: contentW - 37 },
    hal: { x: margin + contentW - 25, w: 25 },
  };

  // Header
  newPageIfNeeded(12);
  setFill(doc, NAVY);
  doc.rect(margin, y, contentW, 10, "F");
  setDraw(doc, NAVY);
  doc.rect(margin, y, contentW, 10, "S");
  doc.line(dcol.nama.x, y, dcol.nama.x, y + 10);
  doc.line(dcol.hal.x, y, dcol.hal.x, y + 10);

  setText(doc, WHITE);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("No.", dcol.no.x + dcol.no.w / 2, y + 6.5, { align: "center" });
  doc.text("Nama Dokumen", dcol.nama.x + 3, y + 6.5);
  doc.text("Jml Hal.", dcol.hal.x + dcol.hal.w / 2, y + 6.5, { align: "center" });
  y += 10;

  for (let i = 0; i < 6; i++) {
    newPageIfNeeded(10);
    setFill(doc, i % 2 === 1 ? SECTION_BG : WHITE);
    doc.rect(margin, y, contentW, 10, "F");
    setDraw(doc, NAVY);
    doc.rect(margin, y, contentW, 10, "S");
    doc.line(dcol.nama.x, y, dcol.nama.x, y + 10);
    doc.line(dcol.hal.x, y, dcol.hal.x, y + 10);

    setText(doc, CHARCOAL);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`${i + 1}.`, dcol.no.x + dcol.no.w / 2, y + 6.5, { align: "center" });
    y += 10;
  }
  y += 8;

  // ── Section E: Pernyataan & Tanda Tangan ──
  newPageIfNeeded(100);
  setText(doc, NAVY);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("E. PERNYATAAN DAN PENGESAHAN", margin, y);
  y += 6;

  setText(doc, CHARCOAL);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  const declText =
    "Dengan ini kami menyatakan bahwa seluruh informasi yang diberikan dalam formulir ini " +
    "adalah benar, akurat, dan dapat dipertanggungjawabkan. Dokumen pendukung yang " +
    "dilampirkan merupakan dokumen asli atau salinan yang telah dilegalisir. Kami bersedia " +
    "menerima konsekuensi apabila di kemudian hari ditemukan ketidaksesuaian informasi.";
  const declLines = doc.splitTextToSize(declText, contentW);
  doc.text(declLines, margin, y);
  y += declLines.length * 4 + 12;

  // Signature block (right-aligned)
  const sigX = w / 2 + 10;
  setText(doc, CHARCOAL);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");

  setDraw(doc, LIGHT_GRAY);
  doc.setLineWidth(0.3);
  doc.text("Tempat, Tanggal:", sigX, y);
  doc.line(sigX + 30, y + 1, w - margin, y + 1);
  y += 10;

  doc.setFont("helvetica", "bold");
  doc.text("Yang Menyatakan,", sigX, y);
  y += 22;

  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  setText(doc, GRAY);
  doc.text("Materai Rp 10.000", sigX, y);
  y += 22;

  setText(doc, CHARCOAL);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.line(sigX, y, w - margin, y);
  y += 4;
  doc.setFontSize(8);
  setText(doc, GRAY);
  doc.text("Nama Lengkap", sigX, y);
  y += 7;
  setText(doc, CHARCOAL);
  doc.setFontSize(9);
  doc.text("Jabatan:", sigX, y);
  doc.line(sigX + 16, y + 1, w - margin, y + 1);
  y += 14;

  // Footer note
  setDraw(doc, LIGHT_GRAY);
  doc.setLineWidth(0.3);
  doc.line(margin, y, w - margin, y);
  y += 4;
  setText(doc, GRAY);
  doc.setFontSize(7);
  doc.setFont("helvetica", "italic");
  const noteText =
    "Catatan: Formulir ini harus ditandatangani oleh pejabat yang berwenang (Direktur Utama / " +
    "perwakilan yang memiliki surat kuasa) dan diberi materai Rp 10.000. Dokumen ini merupakan " +
    "bagian dari proses Expression of Interest (EoI) Fase 1 dan harus diunggah melalui Portal Mitra PT Bukit Asam Tbk.";
  const noteLines = doc.splitTextToSize(noteText, contentW);
  doc.text(noteLines, margin, y);

  // ── Save as PDF with proper filename ──
  const fileName = "Pemenuhan_Persyaratan_" + projectName.replace(/[^a-zA-Z0-9]/g, "_") + ".pdf";

  // Use data URI approach for reliable cross-browser download with filename
  const pdfDataUri = doc.output("datauristring", { filename: fileName });
  const link = document.createElement("a");
  link.href = pdfDataUri;
  link.download = fileName;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();

  // Cleanup after a short delay
  setTimeout(() => {
    document.body.removeChild(link);
  }, 100);
}
