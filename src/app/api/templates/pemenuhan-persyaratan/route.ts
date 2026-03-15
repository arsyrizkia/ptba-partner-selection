import { NextRequest, NextResponse } from "next/server";
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

function drawCheckbox(doc: jsPDF, cx: number, cy: number, size = 3.5) {
  setDraw(doc, NAVY);
  doc.setLineWidth(0.4);
  doc.rect(cx - size / 2, cy - size / 2, size, size, "S");
}

function drawHeaderFooter(doc: jsPDF, pageNum: number) {
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();

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

function buildPDF(projectName: string, requirements: string[]): ArrayBuffer {
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

  // Section A
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

  // Section B
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

  const col = {
    no: { x: margin, w: 10 },
    req: { x: margin + 10, w: 62 },
    ya: { x: margin + 72, w: 14 },
    tidak: { x: margin + 86, w: 14 },
    ket: { x: margin + 100, w: contentW - 100 },
  };

  // Header row
  newPageIfNeeded(14);
  const hdrH = 10;
  setFill(doc, NAVY);
  doc.rect(margin, y, contentW, hdrH, "F");
  setDraw(doc, NAVY);
  doc.setLineWidth(0.3);
  doc.rect(margin, y, contentW, hdrH, "S");
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

  for (let i = 0; i < requirements.length; i++) {
    doc.setFontSize(9);
    const lines = doc.splitTextToSize(requirements[i], col.req.w - 6);
    const rowH = Math.max(14, lines.length * 4 + 8);

    newPageIfNeeded(rowH);
    setFill(doc, i % 2 === 1 ? SECTION_BG : WHITE);
    doc.rect(margin, y, contentW, rowH, "F");
    setDraw(doc, NAVY);
    doc.setLineWidth(0.3);
    doc.rect(margin, y, contentW, rowH, "S");
    doc.line(col.req.x, y, col.req.x, y + rowH);
    doc.line(col.ya.x, y, col.ya.x, y + rowH);
    doc.line(col.tidak.x, y, col.tidak.x, y + rowH);
    doc.line(col.ket.x, y, col.ket.x, y + rowH);

    setText(doc, CHARCOAL);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`${i + 1}.`, col.no.x + col.no.w / 2, y + 7, { align: "center" });
    doc.text(lines, col.req.x + 3, y + 7);
    drawCheckbox(doc, col.ya.x + col.ya.w / 2, y + rowH / 2);
    drawCheckbox(doc, col.tidak.x + col.tidak.w / 2, y + rowH / 2);
    y += rowH;
  }
  y += 8;

  // Section C
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

  // Section D
  newPageIfNeeded(80);
  setText(doc, NAVY);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("D. DAFTAR DOKUMEN PENDUKUNG YANG DILAMPIRKAN", margin, y);
  y += 6;
  setText(doc, CHARCOAL);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Sebutkan dokumen pendukung yang dilampirkan bersama formulir ini sebagai bukti pemenuhan persyaratan:", margin, y);
  y += 6;

  const dcol = {
    no: { x: margin, w: 12 },
    nama: { x: margin + 12, w: contentW - 37 },
    hal: { x: margin + contentW - 25, w: 25 },
  };

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

  // Section E
  newPageIfNeeded(100);
  setText(doc, NAVY);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("E. PERNYATAAN DAN PENGESAHAN", margin, y);
  y += 6;
  setText(doc, CHARCOAL);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  const declLines = doc.splitTextToSize(
    "Dengan ini kami menyatakan bahwa seluruh informasi yang diberikan dalam formulir ini " +
    "adalah benar, akurat, dan dapat dipertanggungjawabkan. Dokumen pendukung yang " +
    "dilampirkan merupakan dokumen asli atau salinan yang telah dilegalisir. Kami bersedia " +
    "menerima konsekuensi apabila di kemudian hari ditemukan ketidaksesuaian informasi.",
    contentW,
  );
  doc.text(declLines, margin, y);
  y += declLines.length * 4 + 12;

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

  setDraw(doc, LIGHT_GRAY);
  doc.setLineWidth(0.3);
  doc.line(margin, y, w - margin, y);
  y += 4;
  setText(doc, GRAY);
  doc.setFontSize(7);
  doc.setFont("helvetica", "italic");
  const noteLines = doc.splitTextToSize(
    "Catatan: Formulir ini harus ditandatangani oleh pejabat yang berwenang (Direktur Utama / " +
    "perwakilan yang memiliki surat kuasa) dan diberi materai Rp 10.000. Dokumen ini merupakan " +
    "bagian dari proses Expression of Interest (EoI) Fase 1 dan harus diunggah melalui Portal Mitra PT Bukit Asam Tbk.",
    contentW,
  );
  doc.text(noteLines, margin, y);

  return doc.output("arraybuffer");
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const projectName = searchParams.get("project") || "Proyek";
  const reqParam = searchParams.get("requirements") || "";
  const requirements = reqParam
    ? reqParam.split("||").filter(Boolean)
    : ["(Tidak ada persyaratan khusus)"];

  const pdfBuffer = buildPDF(projectName, requirements);

  const fileName = "Pemenuhan_Persyaratan_" + projectName.replace(/[^a-zA-Z0-9]/g, "_") + ".pdf";

  return new NextResponse(pdfBuffer, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Cache-Control": "no-cache",
    },
  });
}
