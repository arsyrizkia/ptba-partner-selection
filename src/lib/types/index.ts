export type UserRole =
  | 'super_admin'
  | 'ebd'
  | 'keuangan'
  | 'hukum'
  | 'risiko'
  | 'direksi'
  | 'mitra'
  | 'viewer';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  department: string;
  partnerId?: string;
}

export interface Project {
  id: string;
  name: string;
  type: 'CAPEX' | 'OPEX' | 'Strategis';
  status: 'Draft' | 'Evaluasi' | 'Persetujuan' | 'Selesai' | 'Dibatalkan';
  capexValue: number;
  description: string;
  startDate: string;
  endDate: string;
  currentStep: number;
  totalSteps: number;
  partners: string[];
  createdBy: string;
  createdAt: string;
  applicationDeadline?: string;
  prdDocument?: string;
  requirements?: string[];
  requiredDocuments?: string[];
  isOpenForApplication?: boolean;
  winnerId?: string;
  winnerAnnouncedAt?: string;
}

export interface Partner {
  id: string;
  name: string;
  code: string;
  industry: string;
  status: 'Aktif' | 'Dalam Review' | 'Tidak Aktif';
  registrationDate: string;
  address: string;
  phone: string;
  email: string;
  website?: string;
  npwp: string;
  siup: string;
  documents: DocumentItem[];
  financialData: FinancialYear[];
  contactPerson: string;
  contactPhone: string;
}

export interface DocumentItem {
  id: string;
  name: string;
  type: string;
  status: 'Lengkap' | 'Pending' | 'Ditolak' | 'Belum Upload';
  uploadDate?: string;
  expiryDate?: string;
  version: number;
  fileUrl?: string;
}

export interface FinancialYear {
  year: number;
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
  revenue: number;
  netIncome: number;
  operatingCashFlow: number;
  currentAssets: number;
  currentLiabilities: number;
}

export interface Evaluation {
  id: string;
  projectId: string;
  partnerId: string;
  partnerName: string;
  market?: EvalScore;
  technical?: EvalScore;
  esg?: EvalScore;
  financial?: FinancialEval;
  legal?: LegalEval;
  risk?: RiskEval;
  totalScore?: number;
  grade?: string;
  status: 'Draft' | 'Selesai' | 'Disetujui';
  evaluatedBy: string;
  evaluatedAt: string;
}

export interface EvalScore {
  subScores: {
    name: string;
    score: number;
    weight: number;
    notes?: string;
  }[];
  total: number;
  weight: number;
  weightedScore: number;
}

export interface FinancialEval {
  indicators: KEP100Indicator[];
  totalScore: number;
  grade: string;
}

export interface KEP100Indicator {
  name: string;
  formula: string;
  values: {
    year: number;
    value: number;
    score: number;
  }[];
  weight: number;
  averageScore: number;
}

export interface LegalEval {
  aspects: LegalAspect[];
  overallStatus: 'Lulus' | 'Bersyarat' | 'Tidak Lulus';
  notaDinas?: string;
}

export interface LegalAspect {
  name: string;
  status: 'Lulus' | 'Bersyarat' | 'Tidak Lulus';
  notes: string;
}

export interface RiskEval {
  risks: RiskItem[];
  overallLevel: string;
  conclusion?: 'Memenuhi' | 'Tidak Memenuhi' | 'Catatan';
  notaDinasNumber?: string;
}

export interface RiskItem {
  id: string;
  riskCategory: 'mitra' | 'proyek';
  category: string;
  description: string;
  causes: string[];
  impactDescription: string;
  inherentProbability: number;
  inherentImpact: number;
  inherentLevel: string;
  justifikasiInheren: string;
  mitigations: string[];
  residualProbability: number;
  residualImpact: number;
  residualLevel: string;
  justifikasiResidual: string;
}

export interface Approval {
  id: string;
  projectId: string;
  projectName: string;
  type: string;
  status: 'Menunggu' | 'Disetujui' | 'Ditolak' | 'Dikembalikan';
  requestedBy: string;
  requestedAt: string;
  approver: string;
  approvedAt?: string;
  notes?: string;
  priority: 'Tinggi' | 'Sedang' | 'Rendah';
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  read: boolean;
  createdAt: string;
  link?: string;
}

export interface DashboardStats {
  totalProjects: number;
  projectsTrend: number;
  activeEvaluations: number;
  evaluationsTrend: number;
  slaCompliance: number;
  slaTrend: number;
  pendingApprovals: number;
  approvalsTrend: number;
}

export interface SLAItem {
  id: string;
  processName: string;
  targetDays: number;
  actualDays: number;
  status: 'Tepat Waktu' | 'Terlambat' | 'Dalam Proses';
  projectName: string;
  startDate: string;
  dueDate: string;
}

export type ApplicationStatus = 'Dikirim' | 'Dalam Review' | 'Diterima' | 'Ditolak' | 'Terpilih';

export interface ApplicationDocument {
  id: string;
  documentTypeId: string;
  name: string;
  status: 'Diunggah';
  uploadDate: string;
  fileUrl?: string;
}

export interface PartnerApplication {
  id: string;
  partnerId: string;
  partnerName: string;
  projectId: string;
  projectName: string;
  status: ApplicationStatus;
  appliedAt: string;
  documents: ApplicationDocument[];
  currentEvalStep?: number;
  totalEvalSteps?: number;
}
