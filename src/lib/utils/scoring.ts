import type { KEP100Indicator } from '@/lib/types';

/**
 * Menghitung skor total KEP-100 dari 8 indikator keuangan.
 * Setiap indikator memiliki bobot (weight) dan skor rata-rata (averageScore).
 * Skor total = jumlah (averageScore * weight) untuk semua indikator.
 */
export function calculateKEP100Score(indicators: KEP100Indicator[]): number {
  if (!indicators || indicators.length === 0) return 0;

  const totalScore = indicators.reduce((sum, indicator) => {
    return sum + indicator.averageScore * indicator.weight;
  }, 0);

  return Math.round(totalScore * 100) / 100;
}

/**
 * Mengkonversi skor numerik ke grade sesuai skala penilaian PTBA.
 *
 * AAA: >= 90
 * AA:  >= 80
 * A:   >= 70
 * BBB: >= 60
 * BB:  >= 50
 * B:   >= 40
 * C:   < 40
 */
export function getGrade(score: number): string {
  if (score >= 90) return 'AAA';
  if (score >= 80) return 'AA';
  if (score >= 70) return 'A';
  if (score >= 60) return 'BBB';
  if (score >= 50) return 'BB';
  if (score >= 40) return 'B';
  return 'C';
}

/**
 * Mengembalikan warna PTBA untuk setiap grade.
 */
export function getGradeColor(grade: string): string {
  const colors: Record<string, string> = {
    AAA: '#28A745',
    AA: '#2E75B6',
    A: '#F2A900',
    BBB: '#F7941D',
    BB: '#C8102E',
    B: '#8B5E3C',
    C: '#666666',
  };

  return colors[grade] || '#666666';
}
