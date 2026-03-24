export interface ProjectStep {
  step: number;
  name: string;
  description: string;
  phase: 'phase1' | 'phase2' | 'phase3';
}

export const PROJECT_STEPS: ProjectStep[] = [
  // Fase 1: EoI / Pre-qualification (Sistem Gugur - EBD only)
  { step: 1, name: 'Inisiasi', description: 'Pembentukan tim dan penetapan ruang lingkup proyek', phase: 'phase1' },
  { step: 2, name: 'Pendaftaran Mitra', description: 'Pembukaan pendaftaran Expression of Interest (EoI)', phase: 'phase1' },
  { step: 3, name: 'Penutupan Pendaftaran', description: 'Penutupan periode pendaftaran EoI', phase: 'phase1' },
  { step: 4, name: 'Filtrasi Fase 1', description: 'Filtrasi EBD terhadap dokumen dan data EoI mitra (sistem gugur)', phase: 'phase1' },
  { step: 5, name: 'Persetujuan Direksi', description: 'Persetujuan shortlist oleh Direksi', phase: 'phase1' },
  { step: 6, name: 'Pengumuman Shortlist', description: 'Pengumuman mitra yang lolos ke Fase 2', phase: 'phase1' },
  // Fase 2: Detailed Assessment (Sistem Gugur - 6 evaluators: 3 EBD + Legal, Finance, Risk)
  { step: 7, name: 'Pendaftaran Fase 2', description: 'Registrasi dan upload dokumen Fase 2', phase: 'phase2' },
  { step: 8, name: 'Penutupan Fase 2', description: 'Penutupan periode upload dokumen Fase 2', phase: 'phase2' },
  { step: 9, name: 'Evaluasi Fase 2', description: 'Evaluasi 6 aspek (3 EBD + Hukum, Keuangan, Risiko) — semua harus Lulus', phase: 'phase2' },
  { step: 10, name: 'Persetujuan Fase 2', description: 'Persetujuan hasil evaluasi Fase 2', phase: 'phase2' },
  { step: 11, name: 'Pengumuman Fase 2', description: 'Pengumuman mitra yang lolos ke Fase 3', phase: 'phase2' },
  // Fase 3: Final Proposal & Ranking
  { step: 12, name: 'Pendaftaran Fase 3', description: 'Upload dokumen proposal final dan penawaran', phase: 'phase3' },
  { step: 13, name: 'Evaluasi & Peringkat', description: 'Evaluasi proposal dan pemeringkatan mitra', phase: 'phase3' },
  { step: 14, name: 'Negosiasi', description: 'Negosiasi syarat dan ketentuan kerjasama', phase: 'phase3' },
  { step: 15, name: 'Persetujuan BoD', description: 'Persetujuan akhir oleh Board of Directors', phase: 'phase3' },
  { step: 16, name: 'Pengumuman Pemenang', description: 'Penetapan dan pengumuman mitra terpilih', phase: 'phase3' },
];

export const PHASE1_STEPS = PROJECT_STEPS.filter((s) => s.phase === 'phase1');
export const PHASE2_STEPS = PROJECT_STEPS.filter((s) => s.phase === 'phase2');
export const PHASE3_STEPS = PROJECT_STEPS.filter((s) => s.phase === 'phase3');
