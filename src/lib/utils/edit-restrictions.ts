export type EditSection =
  | "general"
  | "phase1Deadline"
  | "phase2Deadline"
  | "requirements"
  | "phase1Docs"
  | "phase2Docs"
  | "customDocs"
  | "pics";

export function getLockedSections(
  phase: string | undefined,
  applicationCount: number
): Set<EditSection> {
  const locked = new Set<EditSection>();

  if (!applicationCount || applicationCount === 0) return locked;

  const isPhase2 = phase?.startsWith("phase2");

  if (isPhase2) {
    // Phase 2: lock everything except PICs
    locked.add("general");
    locked.add("phase1Deadline");
    locked.add("phase2Deadline");
    locked.add("requirements");
    locked.add("phase1Docs");
    locked.add("phase2Docs");
    locked.add("customDocs");
  } else {
    // Phase 1 active: lock phase 1 specific sections
    locked.add("phase1Deadline");
    locked.add("requirements");
    locked.add("phase1Docs");
  }

  return locked;
}
