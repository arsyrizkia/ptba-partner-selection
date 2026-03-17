export interface DocumentTypeDef {
  id: string;
  name: string;
  description: string;
  required: boolean;
  category: 'legal' | 'keuangan' | 'teknis' | 'administrasi';
  phase?: 'phase1' | 'phase2' | 'phase3' | 'both';
}

/**
 * Document types per phase:
 * - Phase 1: EoI / Pre-qualification
 * - Phase 2: Detailed Assessment (sistem gugur)
 * - Phase 3: Final Proposal & Ranking
 * - Both: General qualification docs
 */
export const DOCUMENT_TYPES: DocumentTypeDef[] = [
  // === General documents (all phases / legacy) ===
  {
    id: 'akta_pendirian',
    name: 'Akta Pendirian',
    description: 'Akta pendirian perusahaan beserta perubahannya yang telah disahkan',
    required: true,
    category: 'legal',
    phase: 'both',
  },
  {
    id: 'siup',
    name: 'SIUP',
    description: 'Surat Izin Usaha Perdagangan yang masih berlaku',
    required: true,
    category: 'legal',
    phase: 'both',
  },
  {
    id: 'tdp_nib',
    name: 'TDP/NIB',
    description: 'Tanda Daftar Perusahaan atau Nomor Induk Berusaha',
    required: true,
    category: 'legal',
    phase: 'both',
  },
  {
    id: 'npwp',
    name: 'NPWP',
    description: 'Nomor Pokok Wajib Pajak perusahaan',
    required: true,
    category: 'legal',
    phase: 'both',
  },
  {
    id: 'laporan_keuangan',
    name: 'Laporan Keuangan (3 tahun)',
    description: 'Laporan keuangan audited 3 tahun terakhir',
    required: true,
    category: 'keuangan',
    phase: 'both',
  },
  {
    id: 'referensi_bank',
    name: 'Surat Referensi Bank',
    description: 'Surat referensi dari bank yang menyatakan bonafiditas perusahaan',
    required: true,
    category: 'keuangan',
    phase: 'both',
  },
  {
    id: 'pengalaman_kerja',
    name: 'Daftar Pengalaman Kerja',
    description: 'Daftar pengalaman pekerjaan sejenis dalam 5 tahun terakhir',
    required: true,
    category: 'teknis',
    phase: 'both',
  },
  {
    id: 'sertifikat_iso',
    name: 'Sertifikat ISO',
    description: 'Sertifikat sistem manajemen mutu (ISO 9001, ISO 14001, dll)',
    required: false,
    category: 'teknis',
    phase: 'both',
  },
  {
    id: 'amdal_ukl_upl',
    name: 'AMDAL/UKL-UPL',
    description: 'Dokumen Analisis Mengenai Dampak Lingkungan atau UKL-UPL',
    required: true,
    category: 'legal',
    phase: 'both',
  },
  {
    id: 'surat_domisili',
    name: 'Surat Keterangan Domisili',
    description: 'Surat keterangan domisili perusahaan yang masih berlaku',
    required: true,
    category: 'administrasi',
    phase: 'both',
  },
  {
    id: 'profil_perusahaan',
    name: 'Profil Perusahaan',
    description: 'Company profile yang mencakup visi, misi, dan sejarah perusahaan',
    required: true,
    category: 'administrasi',
    phase: 'both',
  },
  {
    id: 'struktur_organisasi',
    name: 'Struktur Organisasi',
    description: 'Bagan struktur organisasi perusahaan beserta uraian tugas',
    required: true,
    category: 'administrasi',
    phase: 'both',
  },
  {
    id: 'daftar_peralatan',
    name: 'Daftar Peralatan',
    description: 'Daftar peralatan utama yang dimiliki atau disewa',
    required: true,
    category: 'teknis',
    phase: 'both',
  },
  {
    id: 'daftar_tenaga_ahli',
    name: 'Daftar Tenaga Ahli',
    description: 'Daftar tenaga ahli beserta kualifikasi dan sertifikat kompetensi',
    required: true,
    category: 'teknis',
    phase: 'both',
  },
  {
    id: 'surat_pernyataan',
    name: 'Surat Pernyataan',
    description: 'Surat pernyataan kesanggupan dan tidak dalam daftar hitam',
    required: true,
    category: 'administrasi',
    phase: 'both',
  },
  {
    id: 'jaminan_penawaran',
    name: 'Jaminan Penawaran',
    description: 'Jaminan penawaran dari bank atau lembaga keuangan',
    required: true,
    category: 'keuangan',
    phase: 'both',
  },
  {
    id: 'surat_kuasa',
    name: 'Surat Kuasa',
    description: 'Surat kuasa dari direktur utama kepada perwakilan yang berwenang',
    required: false,
    category: 'administrasi',
    phase: 'both',
  },

  // === Fase 1: EoI Document Types ===
  {
    id: 'statement_eoi',
    name: 'Statement of Expression of Interest',
    description: 'Surat pernyataan minat untuk mengikuti proses seleksi mitra',
    required: true,
    category: 'administrasi',
    phase: 'phase1',
  },
  {
    id: 'compro',
    name: 'Company Profile (Ringkas)',
    description: 'Profil perusahaan ringkas mencakup sejarah, visi misi, dan kapabilitas utama',
    required: true,
    category: 'administrasi',
    phase: 'phase1',
  },
  {
    id: 'portfolio',
    name: 'Portfolio Proyek',
    description: 'Daftar dan ringkasan proyek-proyek relevan yang telah dikerjakan',
    required: true,
    category: 'teknis',
    phase: 'phase1',
  },
  {
    id: 'financial_overview',
    name: 'Gambaran Umum Keuangan',
    description: 'Ringkasan kondisi keuangan perusahaan (revenue, aset, ekuitas)',
    required: true,
    category: 'keuangan',
    phase: 'phase1',
  },
  {
    id: 'requirements_fulfillment',
    name: 'Pemenuhan Persyaratan',
    description: 'Dokumen yang menunjukkan pemenuhan persyaratan dasar proyek',
    required: true,
    category: 'administrasi',
    phase: 'phase1',
  },

  // === Fase 2: Detailed Assessment Document Types (sistem gugur) ===
  {
    id: 'confidential_guarantee_signed',
    name: 'Confidential Guarantee (Signed)',
    description: 'Jaminan kerahasiaan yang telah ditandatangani',
    required: true,
    category: 'legal',
    phase: 'phase2',
  },
  {
    id: 'loi_signed',
    name: 'Letter of Intent (Signed)',
    description: 'Surat pernyataan niat kerjasama yang telah ditandatangani',
    required: true,
    category: 'legal',
    phase: 'phase2',
  },
  {
    id: 'financial_detail',
    name: 'Laporan Keuangan Detail',
    description: 'Laporan keuangan audited lengkap 3 tahun terakhir dengan catatan',
    required: true,
    category: 'keuangan',
    phase: 'phase2',
  },
  {
    id: 'info_detail',
    name: 'Informasi Detail Perusahaan',
    description: 'Informasi lengkap perusahaan termasuk struktur kepemilikan, manajemen, dan operasi',
    required: true,
    category: 'administrasi',
    phase: 'phase2',
  },

  // === Fase 3: Final Proposal & Ranking Document Types ===
  {
    id: 'proposal_detail',
    name: 'Proposal Teknis & Komersial',
    description: 'Proposal teknis dan komersial secara detail termasuk nilai penawaran',
    required: true,
    category: 'teknis',
    phase: 'phase3',
  },
  {
    id: 'rencana_kerja',
    name: 'Rencana Kerja & Jadwal',
    description: 'Rencana kerja detail dan jadwal pelaksanaan proyek',
    required: true,
    category: 'teknis',
    phase: 'phase3',
  },
  {
    id: 'rab',
    name: 'Rencana Anggaran Biaya (RAB)',
    description: 'Rincian anggaran biaya proyek secara detail',
    required: true,
    category: 'keuangan',
    phase: 'phase3',
  },
  {
    id: 'jaminan_pelaksanaan',
    name: 'Jaminan Pelaksanaan',
    description: 'Jaminan pelaksanaan dari bank atau lembaga keuangan',
    required: true,
    category: 'keuangan',
    phase: 'phase3',
  },
];

export const PHASE1_DOCUMENT_TYPES = DOCUMENT_TYPES.filter((d) => d.phase === 'phase1');
export const PHASE2_DOCUMENT_TYPES = DOCUMENT_TYPES.filter((d) => d.phase === 'phase2');
export const PHASE3_DOCUMENT_TYPES = DOCUMENT_TYPES.filter((d) => d.phase === 'phase3');
export const LEGACY_DOCUMENT_TYPES = DOCUMENT_TYPES.filter((d) => d.phase === 'both');
