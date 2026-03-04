export interface GradeDefinition {
  grade: string;
  minScore: number;
  color: string;
  description: string;
}

/**
 * Skala penilaian grade untuk evaluasi mitra PTBA.
 * Urut dari grade tertinggi ke terendah.
 */
export const GRADE_SCALE: GradeDefinition[] = [
  {
    grade: 'AAA',
    minScore: 90,
    color: '#28A745',
    description: 'Sangat Baik',
  },
  {
    grade: 'AA',
    minScore: 80,
    color: '#2E75B6',
    description: 'Baik',
  },
  {
    grade: 'A',
    minScore: 70,
    color: '#F2A900',
    description: 'Cukup Baik',
  },
  {
    grade: 'BBB',
    minScore: 60,
    color: '#F7941D',
    description: 'Cukup',
  },
  {
    grade: 'BB',
    minScore: 50,
    color: '#C8102E',
    description: 'Kurang',
  },
  {
    grade: 'B',
    minScore: 40,
    color: '#8B5E3C',
    description: 'Sangat Kurang',
  },
  {
    grade: 'C',
    minScore: 0,
    color: '#666666',
    description: 'Buruk',
  },
];

/**
 * Mendapatkan definisi grade berdasarkan skor.
 */
export function getGradeDefinition(score: number): GradeDefinition {
  for (const grade of GRADE_SCALE) {
    if (score >= grade.minScore) {
      return grade;
    }
  }
  return GRADE_SCALE[GRADE_SCALE.length - 1];
}
