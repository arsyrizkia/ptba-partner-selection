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
  type: 'mining' | 'power_generation' | 'coal_processing' | 'infrastructure' | 'environmental' | 'corporate';
  status: 'Draft' | 'Evaluasi' | 'Persetujuan' | 'Selesai' | 'Dibatalkan';
  capexValue?: number;
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
  phase?: ProjectPhase;
  picAssignments?: PICAssignment[];
  shortlistedPartners?: string[];
  phase1Deadline?: string;
  phase2Deadline?: string;
  phase3Deadline?: string;
  phase1Documents?: string[];
  phase2Documents?: string[];
  phase3Documents?: string[];
  ptbaDocuments?: PTBADocument[];
  registrationFee?: number;
}

export interface Partner {
  id: string;
  name: string;
  code: string;
  industry: string;
  businessOverview?: string;
  status: 'Aktif' | 'Dalam Review' | 'Tidak Aktif';
  registrationDate: string;
  address: string;
  indonesiaOfficeAddress?: string;
  phone: string;
  email: string;
  website?: string;
  npwp?: string;
  siup?: string;
  nib?: string;
  documents: DocumentItem[];
  financialData: FinancialYear[];
  contactPerson: string;
  contactPhone: string;
  contactEmail?: string;
  logoFileKey?: string;
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
  phase?: 'phase1' | 'phase2';
  phase1Eval?: Phase1Evaluation;
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
  phase?: 'phase1' | 'phase2';
  approvalCategory?: 'phase1_shortlist' | 'phase2_final' | 'evaluasi' | 'inisiasi' | 'dokumen' | 'penutupan';
  evaluationSummary?: {
    totalMitra: number;
    lolos: number;
    tidakLolos: number;
  };
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

export type ApplicationStatus = 'Dikirim' | 'Dalam Review' | 'Diterima' | 'Ditolak' | 'Terpilih' | 'Shortlisted';

export type ProjectPhase =
  | 'phase1_registration'
  | 'phase1_closed'
  | 'phase1_evaluation'
  | 'phase1_approval'
  | 'phase1_announcement'
  | 'phase1_approved'
  | 'phase2_registration'
  | 'phase2_evaluation'
  | 'phase2_approval'
  | 'phase2_announcement'
  | 'phase2_approved'
  | 'phase3_registration'
  | 'phase3_evaluation'
  | 'phase3_ranking'
  | 'phase3_negotiation'
  | 'phase3_approval'
  | 'phase3_announcement'
  | 'completed'
  | 'cancelled';

export interface PICAssignment {
  role: UserRole;
  userId: string;
  userName: string;
}

export interface Phase1Criterion {
  name: string;
  score: number;
  maxScore: number;
  notes?: string;
}

export interface Phase1Evaluation {
  partnerId: string;
  partnerName: string;
  criteria: Phase1Criterion[];
  overallResult: 'Lolos' | 'Tidak Lolos';
  evaluatedBy: string;
  evaluatedAt: string;
  notes?: string;
}

export interface PTBADocument {
  id: string;
  name: string;
  type: string;
  fileUrl?: string;
}

export interface ApplicationDocument {
  id: string;
  documentTypeId: string;
  name: string;
  status: 'Diunggah';
  uploadDate: string;
  fileUrl?: string;
}

// ─── Negotiation Types ───

export interface Negotiation {
  id: string;
  projectId: string;
  applicationId: string;
  partnerId: string;
  partnerName?: string;
  projectName?: string;
  initialValue: number;
  agreedValue?: number;
  status: 'pending' | 'waiting_mitra_proposal' | 'waiting_ptba_review' | 'countered' | 'agreed' | 'failed';
  currentRound: number;
  conclusionNotes?: string;
  deadline?: string;
  agreedAt?: string;
  rounds: NegotiationRound[];
  documents: NegotiationDocument[];
}

export interface NegotiationRound {
  id: string;
  roundNumber: number;
  party: 'mitra' | 'ptba';
  proposedValue: number;
  justification?: string;
  costBreakdown?: CostBreakdownItem[];
  status: 'submitted' | 'accepted' | 'countered' | 'rejected';
  responseNotes?: string;
  submittedBy?: string;
  submittedAt: string;
  respondedAt?: string;
}

export interface CostBreakdownItem {
  item: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  subtotal: number;
}

export interface NegotiationDocument {
  id: string;
  name: string;
  type: 'boq' | 'supplier_quote' | 'berita_acara' | 'supporting';
  fileKey?: string;
  uploadedByRole: 'mitra' | 'ptba';
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
  phase?: 'phase1' | 'phase2';
  phase1Documents?: ApplicationDocument[];
  phase2Documents?: ApplicationDocument[];
  phase1Result?: 'Lolos' | 'Tidak Lolos';
  feePaymentStatus?: 'Belum Bayar' | 'Menunggu Verifikasi' | 'Sudah Bayar' | 'Ditolak';
  feePaymentProof?: string;
  feePaymentDate?: string;
  feePaymentNotes?: string;
  downloadedPTBADocs?: string[];
}
