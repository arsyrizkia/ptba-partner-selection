export interface ProjectStep {
  step: number;
  name: string;
  description: string;
  phase: 'phase1' | 'phase2';
}

export const PROJECT_STEPS: ProjectStep[] = [
  // Phase 1: EoI / Pre-qualification
  { step: 1, name: 'Inisiasi', description: 'Pembentukan tim dan penetapan ruang lingkup proyek', phase: 'phase1' },
  { step: 2, name: 'Pendaftaran Mitra', description: 'Pembukaan pendaftaran Expression of Interest (EoI)', phase: 'phase1' },
  { step: 3, name: 'Penutupan Pendaftaran', description: 'Penutupan periode pendaftaran EoI', phase: 'phase1' },
  { step: 4, name: 'Evaluasi 1', description: 'Evaluasi EBD terhadap dokumen EoI mitra', phase: 'phase1' },
  { step: 5, name: 'Persetujuan Tim', description: 'Persetujuan hasil evaluasi oleh tim internal', phase: 'phase1' },
  { step: 6, name: 'Persetujuan Direksi', description: 'Persetujuan shortlist oleh Direksi', phase: 'phase1' },
  { step: 7, name: 'Pengumuman Shortlist', description: 'Pengumuman mitra yang lolos ke Phase 2', phase: 'phase1' },
  // Phase 2: Detailed Assessment
  { step: 8, name: 'Pendaftaran Phase 2', description: 'Registrasi dan pembayaran biaya pendaftaran Phase 2', phase: 'phase2' },
  { step: 9, name: 'Evaluasi 2', description: 'Evaluasi komprehensif multi-divisi (Keuangan, Hukum, Risiko, EBD)', phase: 'phase2' },
  { step: 10, name: 'Peringkat', description: 'Pemeringkatan mitra berdasarkan skor evaluasi akhir', phase: 'phase2' },
  { step: 11, name: 'Negosiasi', description: 'Negosiasi syarat dan ketentuan kerjasama', phase: 'phase2' },
  { step: 12, name: 'Persetujuan BoD', description: 'Persetujuan akhir oleh Board of Directors', phase: 'phase2' },
  { step: 13, name: 'Pengumuman Pemenang', description: 'Penetapan dan pengumuman mitra terpilih', phase: 'phase2' },
];

export const PHASE1_STEPS = PROJECT_STEPS.filter((s) => s.phase === 'phase1');
export const PHASE2_STEPS = PROJECT_STEPS.filter((s) => s.phase === 'phase2');
