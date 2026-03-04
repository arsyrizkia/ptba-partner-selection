export interface LegalAspectDef {
  id: string;
  name: string;
  description: string;
  requiredDocuments: string[];
}

/**
 * 7 aspek hukum yang dievaluasi dalam proses pemilihan mitra.
 */
export const LEGAL_ASPECTS: LegalAspectDef[] = [
  {
    id: 'legalitas_badan_usaha',
    name: 'Legalitas Badan Usaha',
    description: 'Pemeriksaan keabsahan badan hukum perusahaan, akta pendirian, dan perubahannya',
    requiredDocuments: ['Akta Pendirian', 'Akta Perubahan Terakhir', 'SK Kemenkumham'],
  },
  {
    id: 'perizinan_usaha',
    name: 'Perizinan Usaha',
    description: 'Pemeriksaan kelengkapan dan keabsahan izin usaha yang dimiliki',
    requiredDocuments: ['SIUP', 'TDP/NIB', 'Izin Usaha Sektoral'],
  },
  {
    id: 'kepatuhan_pajak',
    name: 'Kepatuhan Pajak',
    description: 'Pemeriksaan kepatuhan kewajiban perpajakan dan status NPWP',
    requiredDocuments: ['NPWP', 'SPT Tahunan', 'Surat Keterangan Fiskal'],
  },
  {
    id: 'riwayat_hukum',
    name: 'Riwayat Hukum',
    description: 'Pemeriksaan riwayat sengketa hukum, perkara pidana, dan daftar hitam',
    requiredDocuments: ['Surat Pernyataan Tidak Dalam Sengketa', 'Surat Keterangan Tidak Masuk Daftar Hitam'],
  },
  {
    id: 'kontrak_perjanjian',
    name: 'Kontrak & Perjanjian',
    description: 'Pemeriksaan kemampuan dan kesiapan dalam penyusunan kontrak kerjasama',
    requiredDocuments: ['Draft Kontrak', 'Surat Kuasa'],
  },
  {
    id: 'amdal_lingkungan',
    name: 'AMDAL/Lingkungan',
    description: 'Pemeriksaan dokumen lingkungan hidup dan kepatuhan terhadap regulasi lingkungan',
    requiredDocuments: ['AMDAL/UKL-UPL', 'Izin Lingkungan'],
  },
  {
    id: 'kepatuhan_k3',
    name: 'Kepatuhan K3',
    description: 'Pemeriksaan kepatuhan terhadap standar Keselamatan dan Kesehatan Kerja',
    requiredDocuments: ['Sertifikat SMK3', 'Kebijakan K3', 'Laporan Kecelakaan Kerja'],
  },
];
