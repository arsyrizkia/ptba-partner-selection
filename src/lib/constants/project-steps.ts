export interface ProjectStep {
  step: number;
  name: string;
  description: string;
}

export const PROJECT_STEPS: ProjectStep[] = [
  { step: 1, name: 'Inisiasi Proyek', description: 'Pembentukan tim dan penetapan ruang lingkup' },
  { step: 2, name: 'Identifikasi Mitra', description: 'Pencarian dan penyaringan calon mitra' },
  { step: 3, name: 'Pengumpulan Dokumen', description: 'Pengumpulan dokumen kualifikasi mitra' },
  { step: 4, name: 'Evaluasi Pasar', description: 'Penilaian aspek pasar dan komersial' },
  { step: 5, name: 'Evaluasi Teknis', description: 'Penilaian kapabilitas teknis' },
  { step: 6, name: 'Evaluasi ESG', description: 'Penilaian Environmental, Social, Governance' },
  { step: 7, name: 'Evaluasi Keuangan', description: 'Analisis KEP-100 dan rasio keuangan' },
  { step: 8, name: 'Evaluasi Legal', description: 'Pemeriksaan aspek hukum dan kepatuhan' },
  { step: 9, name: 'Evaluasi Risiko', description: 'Identifikasi dan analisis risiko' },
  { step: 10, name: 'Konsolidasi Nilai', description: 'Penggabungan seluruh hasil evaluasi' },
  { step: 11, name: 'Peringkat Mitra', description: 'Pemeringkatan berdasarkan skor akhir' },
  { step: 12, name: 'Persetujuan', description: 'Proses persetujuan manajemen' },
  { step: 13, name: 'Penetapan Mitra', description: 'Finalisasi dan penetapan mitra terpilih' },
];
