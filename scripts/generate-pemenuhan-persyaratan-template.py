#!/usr/bin/env python3
"""
Generate PDF template for "Pemenuhan Persyaratan" document.
Mitra can download, fill out, sign, and upload this document.

Usage:
  python3 scripts/generate-pemenuhan-persyaratan-template.py [--requirements "req1" "req2" ...] [--project "Project Name"]

If no arguments provided, generates a generic template with placeholder requirements.
"""

import sys
import os
import argparse
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm, cm
from reportlab.lib.colors import HexColor, black, white
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY, TA_RIGHT
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, HRFlowable, KeepTogether,
)
from reportlab.pdfgen import canvas

# ─── PTBA Brand Colors ───
NAVY = HexColor("#1B3A5C")
RED = HexColor("#C8102E")
GOLD = HexColor("#F2A900")
STEEL_BLUE = HexColor("#2E75B6")
CHARCOAL = HexColor("#1A1A1A")
GRAY = HexColor("#666666")
LIGHT_GRAY = HexColor("#E5E5E5")
SECTION_BG = HexColor("#EDF2F9")
OFF_WHITE = HexColor("#F5F5F5")

WIDTH, HEIGHT = A4  # 210mm x 297mm


def draw_header_footer(canvas_obj, doc):
    """Draw PTBA branded header and footer on each page."""
    canvas_obj.saveState()
    w, h = A4

    # ── Header bar ──
    canvas_obj.setFillColor(NAVY)
    canvas_obj.rect(0, h - 28 * mm, w, 28 * mm, fill=1, stroke=0)

    # Gold accent line
    canvas_obj.setFillColor(GOLD)
    canvas_obj.rect(0, h - 29 * mm, w, 1 * mm, fill=1, stroke=0)

    # Header text
    canvas_obj.setFillColor(white)
    canvas_obj.setFont("Helvetica-Bold", 14)
    canvas_obj.drawString(20 * mm, h - 18 * mm, "PT BUKIT ASAM Tbk")

    canvas_obj.setFont("Helvetica", 8)
    canvas_obj.drawString(20 * mm, h - 23 * mm, "Sistem Pemilihan Mitra Strategis")

    # Document label on right
    canvas_obj.setFont("Helvetica-Bold", 9)
    canvas_obj.drawRightString(w - 20 * mm, h - 15 * mm, "DOKUMEN PEMENUHAN PERSYARATAN")
    canvas_obj.setFont("Helvetica", 7)
    canvas_obj.drawRightString(w - 20 * mm, h - 20 * mm, "Fase 1 — Expression of Interest (EoI)")

    # ── Footer ──
    canvas_obj.setFillColor(LIGHT_GRAY)
    canvas_obj.rect(0, 0, w, 14 * mm, fill=1, stroke=0)

    canvas_obj.setFillColor(RED)
    canvas_obj.rect(0, 14 * mm, w, 0.5 * mm, fill=1, stroke=0)

    canvas_obj.setFillColor(GRAY)
    canvas_obj.setFont("Helvetica", 7)
    canvas_obj.drawString(20 * mm, 6 * mm, "Dokumen Rahasia — Hanya untuk keperluan proses seleksi mitra PT Bukit Asam Tbk")
    canvas_obj.drawRightString(w - 20 * mm, 6 * mm, f"Halaman {doc.page}")

    canvas_obj.restoreState()


def build_pdf(output_path, project_name=None, requirements=None):
    """Generate the Pemenuhan Persyaratan PDF template."""

    if project_name is None:
        project_name = "[Nama Proyek]"

    if requirements is None or len(requirements) == 0:
        requirements = [
            "Pengalaman minimal 5 tahun di bidang yang relevan",
            "Memiliki sertifikasi ISO 9001 atau setara",
            "Nilai aset minimal Rp 50 Miliar",
            "Tidak dalam status blacklist dari instansi pemerintah atau BUMN",
            "Memiliki tenaga ahli yang kompeten di bidang terkait",
        ]

    doc = SimpleDocTemplate(
        output_path,
        pagesize=A4,
        topMargin=35 * mm,
        bottomMargin=20 * mm,
        leftMargin=20 * mm,
        rightMargin=20 * mm,
        title=f"Pemenuhan Persyaratan - {project_name}",
        author="PT Bukit Asam Tbk",
        subject="Dokumen Pemenuhan Persyaratan Fase 1 EoI",
    )

    styles = getSampleStyleSheet()

    # Custom styles
    style_title = ParagraphStyle(
        "DocTitle", parent=styles["Title"],
        fontName="Helvetica-Bold", fontSize=16, leading=20,
        textColor=NAVY, alignment=TA_CENTER, spaceAfter=4 * mm,
    )
    style_subtitle = ParagraphStyle(
        "DocSubtitle", parent=styles["Normal"],
        fontName="Helvetica", fontSize=10, leading=13,
        textColor=GRAY, alignment=TA_CENTER, spaceAfter=8 * mm,
    )
    style_section = ParagraphStyle(
        "SectionHead", parent=styles["Heading2"],
        fontName="Helvetica-Bold", fontSize=11, leading=14,
        textColor=NAVY, spaceBefore=6 * mm, spaceAfter=3 * mm,
        borderPadding=(2 * mm, 0, 2 * mm, 0),
    )
    style_body = ParagraphStyle(
        "Body", parent=styles["Normal"],
        fontName="Helvetica", fontSize=9, leading=13,
        textColor=CHARCOAL, alignment=TA_JUSTIFY,
    )
    style_label = ParagraphStyle(
        "Label", parent=styles["Normal"],
        fontName="Helvetica-Bold", fontSize=9, leading=12,
        textColor=CHARCOAL,
    )
    style_small = ParagraphStyle(
        "Small", parent=styles["Normal"],
        fontName="Helvetica", fontSize=8, leading=11,
        textColor=GRAY,
    )
    style_note = ParagraphStyle(
        "Note", parent=styles["Normal"],
        fontName="Helvetica-Oblique", fontSize=8, leading=11,
        textColor=GRAY, alignment=TA_LEFT,
    )

    usable_w = A4[0] - 40 * mm  # width minus margins

    story = []

    # ─── Title ───
    story.append(Spacer(1, 4 * mm))
    story.append(Paragraph("FORMULIR PEMENUHAN PERSYARATAN", style_title))
    story.append(Paragraph(
        f"Proyek: <b>{project_name}</b><br/>"
        "Fase 1 — Expression of Interest (EoI)",
        style_subtitle
    ))
    story.append(HRFlowable(width="100%", thickness=0.5, color=NAVY, spaceAfter=5 * mm))

    # ─── Section A: Informasi Perusahaan ───
    story.append(Paragraph("A. INFORMASI PERUSAHAAN", style_section))
    story.append(Paragraph(
        "Isilah data perusahaan Anda di bawah ini. Pastikan informasi sesuai dengan dokumen legal yang berlaku.",
        style_body
    ))
    story.append(Spacer(1, 3 * mm))

    company_fields = [
        ["Nama Perusahaan", ": _______________________________________________________________"],
        ["Alamat", ": _______________________________________________________________"],
        ["Kota / Provinsi", ": _______________________________________________________________"],
        ["Nomor Telepon", ": _________________________________"],
        ["Email", ": _________________________________"],
        ["NPWP", ": _________________________________"],
        ["Bidang Usaha", ": _______________________________________________________________"],
        ["Tahun Berdiri", ": _________________________________"],
    ]

    company_table = Table(company_fields, colWidths=[40 * mm, usable_w - 40 * mm])
    company_table.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("FONTNAME", (1, 0), (1, -1), "Helvetica"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("TEXTCOLOR", (0, 0), (-1, -1), CHARCOAL),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 3 * mm),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 1 * mm),
    ]))
    story.append(company_table)
    story.append(Spacer(1, 5 * mm))

    # ─── Section B: Daftar Persyaratan ───
    story.append(Paragraph("B. PEMENUHAN PERSYARATAN PROYEK", style_section))
    story.append(Paragraph(
        "Berikut adalah persyaratan yang ditetapkan oleh PT Bukit Asam Tbk untuk proyek ini. "
        "Berikan tanda centang (<b>\u2713</b>) pada kolom <b>Ya</b> atau <b>Tidak</b> untuk setiap persyaratan, "
        "serta berikan penjelasan atau bukti pendukung pada kolom <b>Keterangan</b>.",
        style_body
    ))
    story.append(Spacer(1, 3 * mm))

    # Requirements table header
    req_header = [
        Paragraph("<b>No.</b>", style_label),
        Paragraph("<b>Persyaratan</b>", style_label),
        Paragraph("<b>Ya</b>", ParagraphStyle("CenterLabel", parent=style_label, alignment=TA_CENTER)),
        Paragraph("<b>Tidak</b>", ParagraphStyle("CenterLabel", parent=style_label, alignment=TA_CENTER)),
        Paragraph("<b>Keterangan / Bukti Pendukung</b>", style_label),
    ]

    req_data = [req_header]
    for i, req in enumerate(requirements):
        row = [
            Paragraph(f"{i + 1}.", style_body),
            Paragraph(req, style_body),
            Paragraph("\u25a1", ParagraphStyle("CheckCenter", parent=style_body, alignment=TA_CENTER, fontSize=14)),
            Paragraph("\u25a1", ParagraphStyle("CheckCenter", parent=style_body, alignment=TA_CENTER, fontSize=14)),
            Paragraph("", style_body),
        ]
        req_data.append(row)

    col_widths = [10 * mm, usable_w * 0.38, 12 * mm, 12 * mm, usable_w * 0.38 - 34 * mm + 10 * mm]

    req_table = Table(req_data, colWidths=col_widths, repeatRows=1)
    req_table.setStyle(TableStyle([
        # Header
        ("BACKGROUND", (0, 0), (-1, 0), NAVY),
        ("TEXTCOLOR", (0, 0), (-1, 0), white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 9),
        ("ALIGN", (0, 0), (-1, 0), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        # Body
        ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
        ("FONTSIZE", (0, 1), (-1, -1), 9),
        ("ALIGN", (0, 1), (0, -1), "CENTER"),
        ("ALIGN", (2, 1), (3, -1), "CENTER"),
        # Grid
        ("GRID", (0, 0), (-1, -1), 0.5, NAVY),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [white, SECTION_BG]),
        # Padding
        ("TOPPADDING", (0, 0), (-1, -1), 3 * mm),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3 * mm),
        ("LEFTPADDING", (0, 0), (-1, -1), 2 * mm),
        ("RIGHTPADDING", (0, 0), (-1, -1), 2 * mm),
        # Min row height for keterangan
        ("TOPPADDING", (0, 1), (-1, -1), 5 * mm),
        ("BOTTOMPADDING", (0, 1), (-1, -1), 5 * mm),
    ]))
    story.append(req_table)
    story.append(Spacer(1, 5 * mm))

    # ─── Section C: Catatan Tambahan ───
    story.append(Paragraph("C. CATATAN TAMBAHAN", style_section))
    story.append(Paragraph(
        "Berikan catatan atau penjelasan tambahan terkait pemenuhan persyaratan di atas (jika ada):",
        style_body
    ))
    story.append(Spacer(1, 2 * mm))

    # Lined area for notes
    notes_lines = []
    for _ in range(6):
        notes_lines.append(["_______________________________________________________________________________"])

    notes_table = Table(notes_lines, colWidths=[usable_w])
    notes_table.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (-1, -1), "Helvetica"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("TEXTCOLOR", (0, 0), (-1, -1), LIGHT_GRAY),
        ("TOPPADDING", (0, 0), (-1, -1), 4 * mm),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
    ]))
    story.append(notes_table)
    story.append(Spacer(1, 5 * mm))

    # ─── Section D: Daftar Dokumen Pendukung ───
    story.append(Paragraph("D. DAFTAR DOKUMEN PENDUKUNG YANG DILAMPIRKAN", style_section))
    story.append(Paragraph(
        "Sebutkan dokumen pendukung yang dilampirkan bersama formulir ini sebagai bukti pemenuhan persyaratan:",
        style_body
    ))
    story.append(Spacer(1, 2 * mm))

    doc_list_data = [
        [
            Paragraph("<b>No.</b>", ParagraphStyle("CL", parent=style_label, alignment=TA_CENTER)),
            Paragraph("<b>Nama Dokumen</b>", style_label),
            Paragraph("<b>Jumlah Halaman</b>", ParagraphStyle("CL", parent=style_label, alignment=TA_CENTER)),
        ],
    ]
    for i in range(6):
        doc_list_data.append([
            Paragraph(f"{i + 1}.", ParagraphStyle("CBody", parent=style_body, alignment=TA_CENTER)),
            Paragraph("", style_body),
            Paragraph("", ParagraphStyle("CBody", parent=style_body, alignment=TA_CENTER)),
        ])

    doc_table = Table(doc_list_data, colWidths=[12 * mm, usable_w - 37 * mm, 25 * mm], repeatRows=1)
    doc_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), NAVY),
        ("TEXTCOLOR", (0, 0), (-1, 0), white),
        ("GRID", (0, 0), (-1, -1), 0.5, NAVY),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("ALIGN", (0, 0), (0, -1), "CENTER"),
        ("ALIGN", (2, 0), (2, -1), "CENTER"),
        ("TOPPADDING", (0, 0), (-1, -1), 3 * mm),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3 * mm),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [white, SECTION_BG]),
    ]))
    story.append(doc_table)
    story.append(Spacer(1, 8 * mm))

    # ─── Section E: Pernyataan & Tanda Tangan ───
    story.append(Paragraph("E. PERNYATAAN DAN PENGESAHAN", style_section))

    declaration_text = (
        "Dengan ini kami menyatakan bahwa seluruh informasi yang diberikan dalam formulir ini "
        "adalah <b>benar, akurat, dan dapat dipertanggungjawabkan</b>. Dokumen pendukung yang "
        "dilampirkan merupakan dokumen asli atau salinan yang telah dilegalisir. Kami bersedia "
        "menerima konsekuensi apabila di kemudian hari ditemukan ketidaksesuaian informasi."
    )
    story.append(Paragraph(declaration_text, style_body))
    story.append(Spacer(1, 8 * mm))

    # Signature block
    sig_data = [
        [
            "",
            Paragraph("Tempat, Tanggal: ________________________", style_body),
        ],
        ["", ""],
        [
            "",
            Paragraph("Yang Menyatakan,", style_label),
        ],
        ["", ""],
        ["", ""],
        ["", ""],
        ["", Paragraph("<i>Materai Rp 10.000</i>", style_note)],
        ["", ""],
        ["", ""],
        [
            "",
            Paragraph("_________________________________________", style_body),
        ],
        [
            "",
            Paragraph("Nama Lengkap", style_small),
        ],
        [
            "",
            Paragraph("Jabatan: __________________________________", style_body),
        ],
    ]

    sig_table = Table(sig_data, colWidths=[usable_w * 0.45, usable_w * 0.55])
    sig_table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "BOTTOM"),
        ("TOPPADDING", (0, 0), (-1, -1), 1),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 1),
    ]))
    story.append(sig_table)
    story.append(Spacer(1, 10 * mm))

    # ─── Footer note ───
    story.append(HRFlowable(width="100%", thickness=0.3, color=LIGHT_GRAY, spaceAfter=2 * mm))
    story.append(Paragraph(
        "<b>Catatan:</b> Formulir ini harus ditandatangani oleh pejabat yang berwenang (Direktur Utama / "
        "perwakilan yang memiliki surat kuasa) dan diberi materai Rp 10.000. "
        "Dokumen ini merupakan bagian dari proses Expression of Interest (EoI) Fase 1 "
        "dan harus diunggah melalui Portal Mitra PT Bukit Asam Tbk.",
        style_note
    ))

    # Build
    doc.build(story, onFirstPage=draw_header_footer, onLaterPages=draw_header_footer)
    print(f"PDF generated: {output_path}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate Pemenuhan Persyaratan PDF template")
    parser.add_argument("--project", type=str, default=None, help="Project name")
    parser.add_argument("--requirements", nargs="*", default=None, help="List of requirements")
    parser.add_argument("--output", type=str, default=None, help="Output file path")
    args = parser.parse_args()

    output = args.output or os.path.join(
        os.path.dirname(os.path.abspath(__file__)),
        "..",
        "ptba-partner-selection",
        "public",
        "templates",
        "pemenuhan-persyaratan-template.pdf"
    )

    # Ensure output directory exists
    os.makedirs(os.path.dirname(output), exist_ok=True)

    build_pdf(output, project_name=args.project, requirements=args.requirements)
