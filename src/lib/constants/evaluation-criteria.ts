export interface SubCriterion {
  name: string;
  weight: number;
  description: string;
}

export interface EvaluationCriterion {
  id: string;
  name: string;
  nameEN: string;
  subCriteria: SubCriterion[];
}

export const EVALUATION_CRITERIA: EvaluationCriterion[] = [
  {
    id: 'market',
    name: 'Pasar',
    nameEN: 'Market',
    subCriteria: [
      {
        name: 'Ukuran Pasar',
        weight: 25,
        description: 'Penilaian potensi dan ukuran pasar yang dilayani mitra',
      },
      {
        name: 'Pertumbuhan Pasar',
        weight: 25,
        description: 'Penilaian tren pertumbuhan pasar dan prospek ke depan',
      },
      {
        name: 'Pangsa Pasar',
        weight: 25,
        description: 'Penilaian posisi dan pangsa pasar mitra di industrinya',
      },
      {
        name: 'Daya Saing',
        weight: 25,
        description: 'Penilaian keunggulan kompetitif dan daya saing mitra',
      },
    ],
  },
  {
    id: 'technical',
    name: 'Teknis',
    nameEN: 'Technical',
    subCriteria: [
      {
        name: 'Kapasitas Produksi',
        weight: 25,
        description: 'Penilaian kapasitas dan kemampuan produksi mitra',
      },
      {
        name: 'Teknologi',
        weight: 25,
        description: 'Penilaian tingkat teknologi dan inovasi yang dimiliki',
      },
      {
        name: 'Pengalaman',
        weight: 25,
        description: 'Penilaian rekam jejak dan pengalaman di bidang terkait',
      },
      {
        name: 'Sertifikasi',
        weight: 25,
        description: 'Penilaian sertifikasi dan standar mutu yang dimiliki',
      },
    ],
  },
  {
    id: 'esg',
    name: 'ESG',
    nameEN: 'ESG',
    subCriteria: [
      {
        name: 'Lingkungan',
        weight: 40,
        description: 'Penilaian aspek pengelolaan lingkungan dan dampak ekologis',
      },
      {
        name: 'Sosial',
        weight: 30,
        description: 'Penilaian aspek tanggung jawab sosial dan hubungan masyarakat',
      },
      {
        name: 'Tata Kelola',
        weight: 30,
        description: 'Penilaian aspek tata kelola perusahaan (governance)',
      },
    ],
  },
];
