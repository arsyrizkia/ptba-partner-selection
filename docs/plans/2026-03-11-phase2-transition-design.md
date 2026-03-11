# Phase 2 Transition Flow — Design

## Context
After Direksi approves Phase 1 shortlist, EBD needs to start Phase 2. Shortlisted mitra upload additional documents, then parallel multi-division evaluation begins (Keuangan, Hukum, Risiko, EBD).

## Flow
1. Direksi approves Phase 1 → banner on project page + dashboard notification card
2. EBD clicks "Mulai Fase 2" → configuration modal (deadline, fee, required divisions)
3. Confirm → project status → `phase2_registration`, notification to mitra
4. Mitra upload Phase 2 documents
5. Parallel multi-division evaluation via evaluation hub (matrix view)
6. All divisions complete → EBD clicks "Finalisasi Evaluasi Fase 2"
7. Project advances to `phase2_ranking`

## Components

### 1. Dashboard Notification Card
- On `/dashboard`, new card for projects where Phase 1 just approved
- Shows: project name, "Fase 1 disetujui Direksi", date, "Mulai Fase 2 →" CTA
- Disappears once Phase 2 started

### 2. Project Detail Page Banner
- Gold/green banner at top of `/projects/[id]`
- Text: "Direksi telah menyetujui shortlist Fase 1"
- "Mulai Fase 2" button opens configuration modal

### 3. Configuration Modal
- Fields:
  - Phase 2 deadline (date picker)
  - Registration fee (currency input, pre-filled from project data)
  - Required divisions (checkboxes: Keuangan, Hukum, Risiko, EBD — all checked default)
- Confirm → updates project status, mock sends notification to shortlisted mitra

### 4. Phase 2 Evaluation Hub (`/projects/[id]/evaluation/phase2`)
- Matrix: rows = shortlisted mitra, columns = required divisions
- Cell: status badge (Belum Mulai / Sedang Berjalan / Selesai)
- Click cell → navigate to division evaluation page with `?partnerId=`
- Bottom: "Finalisasi Evaluasi Fase 2" button (enabled when all = Selesai)
- Finalize → project moves to `phase2_ranking`

### 5. Project Detail Updates
- When `phase2_evaluation`: compact division progress summary
- Step indicator reflects Phase 2 progression

## Data Changes

### Project mock data
- P002 (currently `phase1_shortlist`): add a variant state `phase1_approved_ready` to demonstrate the transition banner
- P001 (currently `phase2_evaluation`): already in Phase 2, use as reference

### New project state
- `phase1_approved` — Direksi approved, EBD hasn't started Phase 2 yet
- Triggers banner + dashboard notification

### Phase 2 evaluation status tracking
- New field on Project: `phase2EvalStatus?: Record<string, 'belum' | 'sedang' | 'selesai'>` keyed by division
- Or derive from existing evaluation data completeness
