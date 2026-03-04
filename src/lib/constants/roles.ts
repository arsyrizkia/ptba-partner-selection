import type { UserRole } from '@/lib/types';

export interface RoleDefinition {
  value: UserRole;
  label: string;
  description: string;
}

export const ROLES: RoleDefinition[] = [
  { value: 'super_admin', label: 'Super Admin', description: 'Akses penuh ke semua modul (IT/EBD)' },
  { value: 'ebd', label: 'Divisi Pengembangan Energi', description: 'Pengelolaan proyek dan evaluasi mitra' },
  { value: 'keuangan', label: 'Divisi Keuangan', description: 'Evaluasi keuangan KEP-100' },
  { value: 'hukum', label: 'Divisi Hukum', description: 'Evaluasi aspek hukum dan regulasi' },
  { value: 'risiko', label: 'Divisi Manajemen Risiko', description: 'Evaluasi risiko' },
  { value: 'direksi', label: 'Direksi', description: 'Persetujuan dan disposisi direktur pembina' },
  { value: 'mitra', label: 'Mitra', description: 'Akses portal mitra eksternal' },
  { value: 'viewer', label: 'Viewer / Auditor', description: 'Akses baca saja' },
];

export const INTERNAL_ROLES: UserRole[] = ['super_admin', 'ebd', 'keuangan', 'hukum', 'risiko', 'direksi', 'viewer'];
export const ALL_INTERNAL_ROLES: UserRole[] = ['super_admin', 'ebd', 'keuangan', 'hukum', 'risiko', 'direksi', 'viewer'];
