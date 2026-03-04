export interface RiskMatrixLabel {
  value: number;
  label: string;
}

export interface RiskMatrixCell {
  probability: number;
  impact: number;
  level: string;
}

/**
 * Label probabilitas risiko (1-5)
 */
export const PROBABILITY_LABELS: RiskMatrixLabel[] = [
  { value: 1, label: 'Sangat Rendah' },
  { value: 2, label: 'Rendah' },
  { value: 3, label: 'Sedang' },
  { value: 4, label: 'Tinggi' },
  { value: 5, label: 'Sangat Tinggi' },
];

/**
 * Label dampak risiko (1-5)
 */
export const IMPACT_LABELS: RiskMatrixLabel[] = [
  { value: 1, label: 'Sangat Rendah' },
  { value: 2, label: 'Rendah' },
  { value: 3, label: 'Sedang' },
  { value: 4, label: 'Tinggi' },
  { value: 5, label: 'Sangat Tinggi' },
];

/**
 * Level risiko yang dihasilkan dari matriks 5x5
 */
export const RISK_LEVELS = [
  'Rendah',
  'Sedang',
  'Tinggi',
  'Sangat Tinggi',
  'Kritis',
] as const;

export type RiskLevelType = (typeof RISK_LEVELS)[number];

/**
 * Definisi matriks risiko 5x5
 * Baris = Probabilitas (1-5), Kolom = Dampak (1-5)
 */
export const RISK_MATRIX: RiskMatrixCell[] = [
  // Probabilitas 1 (Sangat Rendah)
  { probability: 1, impact: 1, level: 'Rendah' },
  { probability: 1, impact: 2, level: 'Rendah' },
  { probability: 1, impact: 3, level: 'Rendah' },
  { probability: 1, impact: 4, level: 'Sedang' },
  { probability: 1, impact: 5, level: 'Sedang' },

  // Probabilitas 2 (Rendah)
  { probability: 2, impact: 1, level: 'Rendah' },
  { probability: 2, impact: 2, level: 'Rendah' },
  { probability: 2, impact: 3, level: 'Sedang' },
  { probability: 2, impact: 4, level: 'Sedang' },
  { probability: 2, impact: 5, level: 'Tinggi' },

  // Probabilitas 3 (Sedang)
  { probability: 3, impact: 1, level: 'Rendah' },
  { probability: 3, impact: 2, level: 'Sedang' },
  { probability: 3, impact: 3, level: 'Sedang' },
  { probability: 3, impact: 4, level: 'Tinggi' },
  { probability: 3, impact: 5, level: 'Tinggi' },

  // Probabilitas 4 (Tinggi)
  { probability: 4, impact: 1, level: 'Sedang' },
  { probability: 4, impact: 2, level: 'Sedang' },
  { probability: 4, impact: 3, level: 'Tinggi' },
  { probability: 4, impact: 4, level: 'Tinggi' },
  { probability: 4, impact: 5, level: 'Sangat Tinggi' },

  // Probabilitas 5 (Sangat Tinggi)
  { probability: 5, impact: 1, level: 'Sedang' },
  { probability: 5, impact: 2, level: 'Tinggi' },
  { probability: 5, impact: 3, level: 'Tinggi' },
  { probability: 5, impact: 4, level: 'Sangat Tinggi' },
  { probability: 5, impact: 5, level: 'Kritis' },
];

/**
 * Warna untuk setiap level risiko
 */
export const RISK_LEVEL_COLORS: Record<RiskLevelType, string> = {
  'Rendah': '#28A745',
  'Sedang': '#F2A900',
  'Tinggi': '#F7941D',
  'Sangat Tinggi': '#C8102E',
  'Kritis': '#8B0000',
};
