import type { UserRole } from '@/lib/types';

export interface RoleDefinition {
  value: UserRole;
  label: string;
  description: string;
}

export const ROLES: RoleDefinition[] = [
  { value: 'super_admin', label: 'Super Admin', description: 'Akses penuh ke semua modul (IT/EBD)' },
  { value: 'ebd', label: 'Energy Business Development Division', description: 'Pengelolaan proyek dan evaluasi mitra' },
  { value: 'keuangan', label: 'Corporate Finance Division', description: 'Evaluasi keuangan' },
  { value: 'hukum', label: 'Legal & Regulatory Affairs Division', description: 'Evaluasi aspek hukum dan regulasi' },
  { value: 'risiko', label: 'Risk Management Division', description: 'Evaluasi risiko' },
  { value: 'direksi', label: 'Direksi', description: 'Persetujuan dan disposisi direktur pembina' },
  { value: 'mitra', label: 'Mitra', description: 'Akses portal mitra eksternal' },
  { value: 'viewer', label: 'Viewer / Auditor', description: 'Akses baca saja' },
];

export const INTERNAL_ROLES: UserRole[] = ['super_admin', 'ebd', 'keuangan', 'hukum', 'risiko', 'direksi', 'viewer'];
export const ALL_INTERNAL_ROLES: UserRole[] = ['super_admin', 'ebd', 'keuangan', 'hukum', 'risiko', 'direksi', 'viewer'];
