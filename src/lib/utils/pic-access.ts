import type { Project, User, UserRole } from '@/lib/types';

const ALWAYS_ACCESS_ROLES: UserRole[] = ['super_admin', 'direksi', 'viewer'];
const EVALUATOR_ROLES: UserRole[] = ['ebd', 'keuangan', 'hukum', 'risiko'];

/**
 * Check if a user can access (view) a project based on PIC assignments.
 * super_admin, direksi, and viewer always have access.
 * Evaluator roles must be assigned as PIC.
 */
export function canAccessProject(project: Project, user: User | null): boolean {
  if (!user) return false;
  if (ALWAYS_ACCESS_ROLES.includes(user.role)) return true;
  if (!EVALUATOR_ROLES.includes(user.role)) return true; // mitra etc.

  // If no PIC assignments defined, allow access (backward compat)
  if (!project.picAssignments || project.picAssignments.length === 0) return true;

  return project.picAssignments.some(
    (pic) => pic.role === user.role && pic.userId === user.id
  );
}

/**
 * Check if a user can evaluate a project (stricter: must be PIC for their role).
 */
export function canEvaluateProject(project: Project, user: User | null): boolean {
  if (!user) return false;
  if (user.role === 'super_admin') return true;

  if (!EVALUATOR_ROLES.includes(user.role)) return false;

  // If no PIC assignments, fallback to role-based access
  if (!project.picAssignments || project.picAssignments.length === 0) return true;

  return project.picAssignments.some(
    (pic) => pic.role === user.role && pic.userId === user.id
  );
}
