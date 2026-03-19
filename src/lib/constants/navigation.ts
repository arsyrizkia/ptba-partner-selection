import type { UserRole } from '@/lib/types';

export interface NavigationItem {
  icon: string;
  label: string;
  labelKey?: string;
  href: string;
  allowedRoles: UserRole[];
}

const ALL_INTERNAL: UserRole[] = [
  'super_admin', 'ebd', 'keuangan', 'hukum', 'risiko', 'direksi', 'viewer',
];

export const NAVIGATION: NavigationItem[] = [
  {
    icon: 'LayoutDashboard',
    label: 'Dashboard',
    href: '/dashboard',
    allowedRoles: ALL_INTERNAL,
  },
  {
    icon: 'FolderKanban',
    label: 'Proyek',
    href: '/projects',
    allowedRoles: ['super_admin', 'ebd', 'direksi', 'keuangan', 'hukum', 'risiko'],
  },
  {
    icon: 'Users',
    label: 'Mitra',
    href: '/partners',
    allowedRoles: ['super_admin', 'ebd'],
  },
  {
    icon: 'CheckSquare',
    label: 'Persetujuan',
    href: '/approvals',
    allowedRoles: ['direksi', 'super_admin'],
  },
  {
    icon: 'Bell',
    label: 'Notifikasi',
    href: '/notifications',
    allowedRoles: ALL_INTERNAL,
  },
  {
    icon: 'Settings',
    label: 'Manajemen Pengguna',
    href: '/users',
    allowedRoles: ['super_admin'],
  },
];

export const MITRA_NAVIGATION: NavigationItem[] = [
  {
    icon: 'LayoutDashboard',
    label: 'Dashboard',
    labelKey: 'dashboard',
    href: '/mitra/dashboard',
    allowedRoles: ['mitra'],
  },
  {
    icon: 'FolderKanban',
    label: 'Proyek Tersedia',
    labelKey: 'projects',
    href: '/mitra/projects',
    allowedRoles: ['mitra'],
  },
  {
    icon: 'FileText',
    label: 'Dokumen Saya',
    labelKey: 'documents',
    href: '/mitra/documents',
    allowedRoles: ['mitra'],
  },
  {
    icon: 'Building2',
    label: 'Profil',
    labelKey: 'profile',
    href: '/mitra/profile',
    allowedRoles: ['mitra'],
  },
  {
    icon: 'GitBranch',
    label: 'Status',
    labelKey: 'status',
    href: '/mitra/status',
    allowedRoles: ['mitra'],
  },
];
