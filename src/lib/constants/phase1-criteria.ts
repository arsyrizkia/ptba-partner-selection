export interface Phase1CriteriaDef {
  id: string;
  name: string;
  weight: number;
  maxScore: number;
  description: string;
}

/**
 * 5 evaluation criteria for EBD Phase 1 evaluation
 * Total weight = 100%
 */
export const PHASE1_CRITERIA: Phase1CriteriaDef[] = [
  {
    id: 'profil_perusahaan',
    name: 'Kualitas Profil Perusahaan',
    weight: 20,
    maxScore: 5,
    description: 'Penilaian kelengkapan dan kualitas profil perusahaan, visi misi, dan struktur organisasi',
  },
  {
    id: 'pengalaman_proyek',
    name: 'Pengalaman Proyek Relevan',
    weight: 25,
    maxScore: 5,
    description: 'Penilaian pengalaman dan track record proyek sejenis dalam 5 tahun terakhir',
  },
  {
    id: 'kemampuan_pembiayaan',
    name: 'Kemampuan Pembiayaan',
    weight: 25,
    maxScore: 5,
    description: 'Penilaian kapasitas pembiayaan dan kemampuan pendanaan proyek',
  },
  {
    id: 'gambaran_keuangan',
    name: 'Gambaran Umum Keuangan',
    weight: 15,
    maxScore: 5,
    description: 'Penilaian kondisi keuangan umum berdasarkan laporan ringkas',
  },
  {
    id: 'pemenuhan_persyaratan',
    name: 'Pemenuhan Persyaratan',
    weight: 15,
    maxScore: 5,
    description: 'Penilaian kelengkapan pemenuhan persyaratan dasar yang ditetapkan',
  },
];

export const PHASE1_PASSING_SCORE = 3.0; // minimum weighted average to pass
