/**
 * Matriks risiko 5x5 untuk menentukan level risiko berdasarkan
 * probabilitas (1-5) dan dampak (1-5).
 *
 * Probabilitas (baris): 1=Sangat Rendah, 2=Rendah, 3=Sedang, 4=Tinggi, 5=Sangat Tinggi
 * Dampak (kolom):       1=Sangat Rendah, 2=Rendah, 3=Sedang, 4=Tinggi, 5=Sangat Tinggi
 */
const RISK_MATRIX: string[][] = [
  // Dampak:  1 (SR)       2 (R)        3 (S)        4 (T)          5 (ST)
  /* P=1 */ ['Rendah',     'Rendah',    'Rendah',    'Sedang',      'Sedang'],
  /* P=2 */ ['Rendah',     'Rendah',    'Sedang',    'Sedang',      'Tinggi'],
  /* P=3 */ ['Rendah',     'Sedang',    'Sedang',    'Tinggi',      'Tinggi'],
  /* P=4 */ ['Sedang',     'Sedang',    'Tinggi',    'Tinggi',      'Sangat Tinggi'],
  /* P=5 */ ['Sedang',     'Tinggi',    'Tinggi',    'Sangat Tinggi', 'Kritis'],
];

/**
 * Menentukan level risiko berdasarkan nilai probabilitas dan dampak.
 *
 * @param probability - Nilai probabilitas (1-5)
 * @param impact - Nilai dampak (1-5)
 * @returns Level risiko: 'Rendah' | 'Sedang' | 'Tinggi' | 'Sangat Tinggi' | 'Kritis'
 */
export function getRiskLevel(probability: number, impact: number): string {
  const pIndex = Math.max(0, Math.min(4, Math.round(probability) - 1));
  const iIndex = Math.max(0, Math.min(4, Math.round(impact) - 1));

  return RISK_MATRIX[pIndex][iIndex];
}

/**
 * Mengembalikan warna untuk setiap level risiko.
 *
 * @param level - Level risiko dalam Bahasa Indonesia
 * @returns Kode warna hex
 */
export function getRiskColor(level: string): string {
  const colors: Record<string, string> = {
    'Rendah': '#28A745',
    'Sedang': '#F2A900',
    'Tinggi': '#F7941D',
    'Sangat Tinggi': '#C8102E',
    'Kritis': '#8B0000',
  };

  return colors[level] || '#666666';
}
