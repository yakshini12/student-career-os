---
doc: checklist
status: approved
---

# Build Checklist

Build mode: learn

## Slices

- [ ] **1. The seeded workspace opens as a usable Today dashboard**
  Becomes usable: A runnable React app that shows Aarav's profile, practice snapshot, active applications, nearest deadline, Northstar 2/5 evidence fit, and the top-ranked containerization action. The workspace loads from and saves to local storage.
  Why now: Proves the shared state, seed, selectors, fit/action logic, shell, and persistence on the first slice, so every later surface has one real source of truth.
  PRD ref: `prd.md > The Core Journey` (steps 1-2), `prd.md > Sample Content`
  Spec ref: `spec.md > Stack`, `spec.md > Data Model`, `spec.md > Fit Engine`, `spec.md > Action Engine`, `spec.md > Persistence`
  Build: Scaffold React + TypeScript + Vite with Vitest, create the domain types and seed, add the reducer/provider and persistence adapter, compute Today from fit/actions, and render the app shell and Today view.
  Verify (mechanical): `npm test`, `npm run typecheck`, and `npm run build` pass; the dev server renders Today with seeded data.
  Learner check: Open Today and confirm it shows Aarav, three active applications, Northstar 2/5, and Containerize CampusCart as the next action.
  Commit: `Add seeded workspace and Today dashboard`

- [ ] **2. Every opportunity can be assessed, saved, and tracked**
  Becomes usable: The catalog filter, all six source-labelled opportunities, save/unsave, manual application statuses, opportunity detail, requirement-level fit explanations, and the ranked action plan.
  Why now: The connected journey needs a real opportunity surface and a visible fit map before the verification gate can update them.
  PRD ref: `prd.md > The Core Journey` (steps 3-7), `prd.md > Opportunities & Applications`
  Spec ref: `spec.md > Components > Opportunities & Applications`, `spec.md > Components > Opportunity Detail, Fit, and Action Plan`
  Build: Add Opportunities and Opportunity Detail views, category filtering, application controls, fit rows with evidence and gaps, action cards with arithmetic and destinations, and working navigation.
  Verify (mechanical): Fit and action tests pass; manually select Northstar and confirm 2/5, five explained requirements, and the 7.5 containerization action.
  Learner check: Open Opportunities, select Northstar, and confirm each requirement links to real evidence or a real gap.
  Commit: `Add opportunity catalog, fit map, and action plan`

- [ ] **3. Projects and profile data are inspectable and editable**
  Becomes usable: Profile editing with validation, three project portfolios, milestone updates, typed evidence add/edit/remove, visible DSA calculation, and local persistence of those changes.
  Why now: Evidence editing is how the fit stays honest when linked evidence changes, and it supplies the deployment/API/database paths outside the gate.
  PRD ref: `prd.md > The Core Journey` (step 7), `prd.md > Projects & Evidence`, `prd.md > Profile & Practice`
  Spec ref: `spec.md > Components > Profile & Practice`, `spec.md > Components > Projects & Evidence`, `spec.md > Data Model > Projects and evidence`
  Build: Add Profile and Projects views, profile validation, milestone controls, typed evidence forms, evidence validation, DSA table, and tests for evidence rules.
  Learner check: Edit the profile, add a deployment record, and confirm fit changes only from the saved evidence.
  Commit: `Add profile editing and project evidence workspace`

- [ ] **4. The verification gate fails, passes, and updates the connected state**
  Becomes usable: The CampusCart verification workspace with sample bundles, pending/withdrawn states, eight deterministic checks, detailed results, atomic pass state, verified evidence, milestone completion, fit recalculation, history, and Today/action updates.
  Why now: This is the unique kernel and the differentiating demo path; it must sit on the real fit/evidence model, not a mock.
  PRD ref: `prd.md > The Core Journey` (steps 7-11), `prd.md > Verification Gate`, `prd.md > Verification Contract`
  Spec ref: `spec.md > Verification Engine`, `spec.md > Data Model > Applications, verification, and history`
  Build: Implement the Dockerfile parser, eight checks, verification form and workspace, reducer transitions, verification tests, and the atomic pass reference.
  Verify (mechanical): Incomplete bundle fails checks 6 and 8; complete bundle passes 8/8; fit becomes 3/5; verification tests pass.
  Learner check: Run the incomplete bundle, inspect both failures, then run the complete bundle and confirm the verified evidence and 3/5 fit.
  Commit: `Add deterministic verification gate and connected update`

- [ ] **5. Refresh, reset, full journey, and presentation are verified**
  Becomes usable: Save/reload validation for the passed state, reset confirmation, overdue and storage-failure handling, responsive/accessibility polish, README, and the complete end-to-end journey test.
  Why now: Persistence and reset are the last state risks, and the demo must be trustworthy after a refresh and at recording size.
  PRD ref: `prd.md > The Core Journey` (steps 12-13), `prd.md > Acceptance Criteria`
  Spec ref: `spec.md > Persistence`, `spec.md > Build and Test Plan`, `spec.md > Look and Feel`
  Build: Add journey/persistence regression tests, reset dialog, error/notice surfaces, responsive and focus styling, README setup and limitations, and run the full command set.
  Verify (mechanical): All tests, typecheck, build, and preview pass; manual journey works after refresh and reset.
  Learner check: Refresh after the pass and confirm 3/5 survives, then reset and confirm 2/5 returns.
  Commit: `Verify persistence, reset, and full demo journey`

## Hands-on Checkpoints

- [ ] Early usable behavior explored — after Slice 2 (Today, catalog, fit, actions)
- [ ] Final kick-the-tires exploration and feedback completed

## Final Review

- [ ] Final review complete — feedback resolved and learner confirms ready to ship

## Code Tour and App Map

- [ ] Learning activity complete — guided route, focused alternative, prior practice connected, or brief recap
- [ ] Optional edit and transfer reflection addressed — offered/declined/already covered/not applicable as appropriate
- [ ] `devpost/app-map.html` generated from finished code, checked, and shown, including a project-grounded practice to reuse

Activity and evidence:
Route and stops:
Edit outcome:
Reflection:
Activity mode:

## Revisions
