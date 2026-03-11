# Phase 2 Transition — Implementation Plan

## Step 1: Add `phase1_approved` to ProjectPhase + Project type updates
**File:** `src/lib/types/index.ts`
- Add `'phase1_approved'` to `ProjectPhase` union (between `phase1_announcement` and `phase2_registration`)
- Add optional field to `Project`: `phase2Config?: { deadline: string; registrationFee: number; requiredDivisions: string[] }`

## Step 2: Update mock data — P002 as phase1_approved
**File:** `src/lib/mock-data/projects.ts`
- Change P002 phase from `phase1_evaluation` to `phase1_approved`
- Add `shortlistedPartners: ['M001', 'M005']` (M006 = Tidak Lolos)
- Set `currentStep: 7` (Phase 1 complete, ready for Phase 2)
- Add P002 Phase 1 evaluation data if not present

## Step 3: Dashboard notification card for EBD
**File:** `src/app/(dashboard)/dashboard/page.tsx`
- In `ProjectDashboard`, add a "Tindakan Diperlukan" section above the project table
- Filter projects where `phase === 'phase1_approved'`
- Render notification card: project name, "Fase 1 disetujui Direksi — siap memulai Fase 2", "Mulai Fase 2 →" link to `/projects/[id]`
- Also show on `ExecutiveDashboard` as info card (no CTA)

## Step 4: Project detail page — Phase 1 approved banner + modal
**File:** `src/app/(dashboard)/projects/[id]/page.tsx`
- Add banner when `project.phase === 'phase1_approved'`: green/gold banner with "Direksi telah menyetujui shortlist Fase 1" + "Mulai Fase 2" button
- Add `showPhase2Modal` state
- Add configuration modal with:
  - Deadline date input (default: 30 days from now)
  - Registration fee input (pre-filled from `project.registrationFee`)
  - Division checkboxes (Keuangan, Hukum, Risiko, EBD — all checked)
- On confirm: mock update project phase to `phase2_registration`, show success toast/alert

## Step 5: Phase 2 Evaluation Hub page
**File:** `src/app/(dashboard)/projects/[id]/evaluation/phase2/page.tsx` (NEW)
- Matrix layout: rows = shortlisted mitra, columns = required divisions
- Each cell shows status badge derived from evaluation data:
  - No eval data → "Belum Mulai" (gray)
  - Partial data → "Sedang Berjalan" (amber)
  - Complete data → "Selesai" (green)
- Click cell → navigate to `/projects/[id]/evaluation/{division}?partnerId={id}`
- Progress bar at top showing overall completion (e.g., "6/8 evaluasi selesai")
- "Finalisasi Evaluasi Fase 2" button at bottom (disabled until all cells = Selesai)
- On finalize → mock advance to `phase2_ranking`

## Step 6: Update evaluation hub to link to Phase 2 hub
**File:** `src/app/(dashboard)/projects/[id]/evaluation/page.tsx`
- When project is in `phase2_evaluation`, redirect to `/projects/[id]/evaluation/phase2` or show a link/banner pointing to the new hub
- Keep existing Phase 1 evaluation flow unchanged

## Verification
1. Dashboard shows notification card for P002 (phase1_approved)
2. Click → goes to P002 project page with banner
3. Click "Mulai Fase 2" → modal with config fields
4. Confirm → project shows as phase2_registration
5. Navigate to `/projects/P001/evaluation/phase2` → matrix view with P001's existing Phase 2 data
6. Verify cell clicks navigate to correct evaluation pages
