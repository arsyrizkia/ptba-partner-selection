export interface DocumentTypeDef {
  id: string;
  name: string;
  description: string;
  required: boolean;
  category: 'legal' | 'keuangan' | 'teknis' | 'administrasi';
}

/**
 * 17 jenis dokumen kualifikasi mitra sesuai TCK 5.1.3
 */
export const DOCUMENT_TYPES: DocumentTypeDef[] = [
  {
    id: 'akta_pendirian',
    name: 'Akta Pendirian',
    description: 'Akta pendirian perusahaan beserta perubahannya yang telah disahkan',
    required: true,
    category: 'legal',
  },
  {
    id: 'siup',
    name: 'SIUP',
    description: 'Surat Izin Usaha Perdagangan yang masih berlaku',
    required: true,
    category: 'legal',
  },
  {
    id: 'tdp_nib',
    name: 'TDP/NIB',
    description: 'Tanda Daftar Perusahaan atau Nomor Induk Berusaha',
    required: true,
    category: 'legal',
  },
  {
    id: 'npwp',
    name: 'NPWP',
    description: 'Nomor Pokok Wajib Pajak perusahaan',
    required: true,
    category: 'legal',
  },
  {
    id: 'laporan_keuangan',
    name: 'Laporan Keuangan (3 tahun)',
    description: 'Laporan keuangan audited 3 tahun terakhir',
    required: true,
    category: 'keuangan',
  },
  {
    id: 'referensi_bank',
    name: 'Surat Referensi Bank',
    description: 'Surat referensi dari bank yang menyatakan bonafiditas perusahaan',
    required: true,
    category: 'keuangan',
  },
  {
    id: 'pengalaman_kerja',
    name: 'Daftar Pengalaman Kerja',
    description: 'Daftar pengalaman pekerjaan sejenis dalam 5 tahun terakhir',
    required: true,
    category: 'teknis',
  },
  {
    id: 'sertifikat_iso',
    name: 'Sertifikat ISO',
    description: 'Sertifikat sistem manajemen mutu (ISO 9001, ISO 14001, dll)',
    required: false,
    category: 'teknis',
  },
  {
    id: 'amdal_ukl_upl',
    name: 'AMDAL/UKL-UPL',
    description: 'Dokumen Analisis Mengenai Dampak Lingkungan atau UKL-UPL',
    required: true,
    category: 'legal',
  },
  {
    id: 'surat_domisili',
    name: 'Surat Keterangan Domisili',
    description: 'Surat keterangan domisili perusahaan yang masih berlaku',
    required: true,
    category: 'administrasi',
  },
  {
    id: 'profil_perusahaan',
    name: 'Profil Perusahaan',
    description: 'Company profile yang mencakup visi, misi, dan sejarah perusahaan',
    required: true,
    category: 'administrasi',
  },
  {
    id: 'struktur_organisasi',
    name: 'Struktur Organisasi',
    description: 'Bagan struktur organisasi perusahaan beserta uraian tugas',
    required: true,
    category: 'administrasi',
  },
  {
    id: 'daftar_peralatan',
    name: 'Daftar Peralatan',
    description: 'Daftar peralatan utama yang dimiliki atau disewa',
    required: true,
    category: 'teknis',
  },
  {
    id: 'daftar_tenaga_ahli',
    name: 'Daftar Tenaga Ahli',
    description: 'Daftar tenaga ahli beserta kualifikasi dan sertifikat kompetensi',
    required: true,
    category: 'teknis',
  },
  {
    id: 'surat_pernyataan',
    name: 'Surat Pernyataan',
    description: 'Surat pernyataan kesanggupan dan tidak dalam daftar hitam',
    required: true,
    category: 'administrasi',
  },
  {
    id: 'jaminan_penawaran',
    name: 'Jaminan Penawaran',
    description: 'Jaminan penawaran dari bank atau lembaga keuangan',
    required: true,
    category: 'keuangan',
  },
  {
    id: 'surat_kuasa',
    name: 'Surat Kuasa',
    description: 'Surat kuasa dari direktur utama kepada perwakilan yang berwenang',
    required: false,
    category: 'administrasi',
  },
];
