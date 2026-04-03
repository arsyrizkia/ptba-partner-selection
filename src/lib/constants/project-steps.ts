export interface ProjectStep {
  step: number;
  name: string;
  description: string;
  phase: 'phase1' | 'phase2';
}

export const PROJECT_STEPS: ProjectStep[] = [
  // Fase 1: Pra-Kualifikasi (6 evaluators + Ketua Tim)
  { step: 1, name: 'Inisiasi', description: 'Pembentukan tim dan penetapan ruang lingkup proyek', phase: 'phase1' },
  { step: 2, name: 'Pendaftaran Mitra', description: 'Pembukaan pendaftaran Fase 1', phase: 'phase1' },
  { step: 3, name: 'Penutupan Pendaftaran', description: 'Penutupan periode pendaftaran Fase 1', phase: 'phase1' },
  { step: 4, name: 'Evaluasi Pra-Kualifikasi', description: 'Evaluasi 6 aspek terhadap dokumen dan data mitra', phase: 'phase1' },
  { step: 5, name: 'Persetujuan Ketua Tim', description: 'Persetujuan shortlist oleh Ketua Tim', phase: 'phase1' },
  { step: 6, name: 'Pengumuman Shortlist', description: 'Pengumuman mitra yang lolos ke Fase 2', phase: 'phase1' },
  // Fase 2: FRP & Proposal (6 evaluators + Ketua Tim)
  { step: 7, name: 'Pendaftaran Fase 2', description: 'Registrasi dan upload dokumen FRP & Proposal', phase: 'phase2' },
  { step: 8, name: 'Penutupan Fase 2', description: 'Penutupan periode upload dokumen Fase 2', phase: 'phase2' },
  { step: 9, name: 'Evaluasi FRP & Proposal', description: 'Evaluasi 6 aspek terhadap proposal dan penawaran', phase: 'phase2' },
  { step: 10, name: 'Persetujuan Fase 2', description: 'Persetujuan hasil evaluasi Fase 2', phase: 'phase2' },
  { step: 11, name: 'Pengumuman Pemenang', description: 'Penetapan dan pengumuman mitra terpilih', phase: 'phase2' },
];

export const PHASE1_STEPS = PROJECT_STEPS.filter((s) => s.phase === 'phase1');
export const PHASE2_STEPS = PROJECT_STEPS.filter((s) => s.phase === 'phase2');
export const PHASE3_STEPS: ProjectStep[] = []; // Removed — 2-phase system
