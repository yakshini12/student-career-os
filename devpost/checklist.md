---
doc: checklist
status: approved
---

# Build Checklist

Build mode: learn

## Slices

- [x] **1. The seeded workspace opens as a usable Today dashboard**
  Becomes usable: A runnable React app that shows Aarav's profile, practice snapshot, active applications, nearest deadline, Northstar 2/5 evidence fit, and the top-ranked containerization action. The workspace loads from and saves to local storage.
  Why now: Proves the shared state, seed, selectors, fit/action logic, shell, and persistence on the first slice, so every later surface has one real source of truth.
  PRD ref: `prd.md > The Core Journey` (steps 1-2), `prd.md > Sample Content`
  Spec ref: `spec.md > Stack`, `spec.md > Data Model`, `spec.md > Fit Engine`, `spec.md > Action Engine`, `spec.md > Persistence`
  Build: Scaffold React + TypeScript + Vite with Vitest, create the domain types and seed, add the reducer/provider and persistence adapter, compute Today from fit/actions, and render the app shell and Today view.
  Verify (mechanical): `npm test`, `npm run typecheck`, and `npm run build` pass; the dev server renders Today with seeded data.
  Learner check: Open Today and confirm it shows Aarav, three active applications, Northstar 2/5, and Containerize CampusCart as the next action.
  Commit: `Add seeded workspace and Today dashboard`

- [x] **2. Every opportunity can be assessed, saved, and tracked**
  Becomes usable: The catalog filter, all six source-labelled opportunities, save/unsave, manual application statuses, opportunity detail, requirement-level fit explanations, and the ranked action plan.
  Why now: The connected journey needs a real opportunity surface and a visible fit map before the verification gate can update them.
  PRD ref: `prd.md > The Core Journey` (steps 3-7), `prd.md > Opportunities & Applications`
  Spec ref: `spec.md > Components > Opportunities & Applications`, `spec.md > Components > Opportunity Detail, Fit, and Action Plan`
  Build: Add Opportunities and Opportunity Detail views, category filtering, application controls, fit rows with evidence and gaps, action cards with arithmetic and destinations, and working navigation.
  Verify (mechanical): Fit and action tests pass; manually select Northstar and confirm 2/5, five explained requirements, and the 7.5 containerization action.
  Learner check: Open Opportunities, select Northstar, and confirm each requirement links to real evidence or a real gap.
  Commit: `Add opportunity catalog, fit map, and action plan`

- [x] **3. Projects and profile data are inspectable and editable**
  Becomes usable: Profile editing with validation, three project portfolios, milestone updates, typed evidence add/edit/remove, visible DSA calculation, and local persistence of those changes.
  Why now: Evidence editing is how the fit stays honest when linked evidence changes, and it supplies the deployment/API/database paths outside the gate.
  PRD ref: `prd.md > The Core Journey` (step 7), `prd.md > Projects & Evidence`, `prd.md > Profile & Practice`
  Spec ref: `spec.md > Components > Profile & Practice`, `spec.md > Components > Projects & Evidence`, `spec.md > Data Model > Projects and evidence`
  Build: Add Profile and Projects views, profile validation, milestone controls, typed evidence forms, evidence validation, DSA table, and tests for evidence rules.
  Learner check: Edit the profile, add a deployment record, and confirm fit changes only from the saved evidence.
  Commit: `Add profile editing and project evidence workspace`

- [x] **4. The verification gate fails, passes, and updates the connected state**
  Becomes usable: The CampusCart verification workspace with sample bundles, pending/withdrawn states, eight deterministic checks, detailed results, atomic pass state, verified evidence, milestone completion, fit recalculation, history, and Today/action updates.
  Why now: This is the unique kernel and the differentiating demo path; it must sit on the real fit/evidence model, not a mock.
  PRD ref: `prd.md > The Core Journey` (steps 7-11), `prd.md > Verification Gate`, `prd.md > Verification Contract`
  Spec ref: `spec.md > Verification Engine`, `spec.md > Data Model > Applications, verification, and history`
  Build: Implement the Dockerfile parser, eight checks, verification form and workspace, reducer transitions, verification tests, and the atomic pass reference.
  Verify (mechanical): Incomplete bundle fails checks 6 and 8; complete bundle passes 8/8; fit becomes 3/5; verification tests pass.
  Learner check: Run the incomplete bundle, inspect both failures, then run the complete bundle and confirm the verified evidence and 3/5 fit.
  Commit: `Add deterministic verification gate and connected update`

- [x] **5. Refresh, reset, full journey, and presentation are verified**
  Becomes usable: Save/reload validation for the passed state, reset confirmation, overdue and storage-failure handling, responsive/accessibility polish, README, and the complete end-to-end journey test.
  Why now: Persistence and reset are the last state risks, and the demo must be trustworthy after a refresh and at recording size.
  PRD ref: `prd.md > The Core Journey` (steps 12-13), `prd.md > Acceptance Criteria`
  Spec ref: `spec.md > Persistence`, `spec.md > Build and Test Plan`, `spec.md > Look and Feel`
  Build: Add journey/persistence regression tests, reset dialog, error/notice surfaces, responsive and focus styling, README setup and limitations, and run the full command set.
  Verify (mechanical): All tests, typecheck, build, and preview pass; manual journey works after refresh and reset.
  Learner check: Refresh after the pass and confirm 3/5 survives, then reset and confirm 2/5 returns.
  Commit: `Verify persistence, reset, and full demo journey`

## Build Verification

Agent-led verification of the merged implementation. This is not a substitute for the learner checks below.

- **Commands:** `npm test` passed 74 tests across 6 files. `npm run typecheck` and `npm run lint` passed. `npm run build` passed: 54 modules, `dist/index.html` 0.67 kB, CSS 35.20 kB, JS 333.48 kB (gzip 96.94 kB). `npm run preview` served the built app at `http://127.0.0.1:4173/`.
- **Today on first load:** Aarav Mehta, 145 problems solved, 3/6 core topics at 10+, 6 contests, three active applications, Northstar due in 7 days, **2 of 5**, containerization **Missing**, top action **7.5 Containerize CampusCart**.
- **Northstar detail:** five requirement rows, DSA table showing 145 solved / 3 of 6 topics / 6 contests, deployment action 3.0 before DSA 3.0 (impact tie).
- **Milestone honesty:** setting **Containerize API** to Done left fit at 2/5 and containerization Missing.
- **Validation:** submitting an empty bundle showed both inline field errors and the message **Artifact was not submitted.**
- **Failure path:** the incomplete sample submitted to pending, then failed with **6/8 checks passed; failed: Command, Port mapping.** Verification returned to Unsupported and history recorded both transitions.
- **Pass path:** the complete sample passed **8/8 checks**, set verification to Supported, created `ev_campus_container_verified` (`source: "verified"`, `containerization`, `campus_cart`, matching `addedAt`/`verifiedAt`), marked the milestone done, appended history, and raised fit to **3 of 5**. Deployment became the first action at 3.0, DSA second.
- **Manual status and persistence:** setting Northstar to **Applied** and reloading kept 3/5, Applied, the verified evidence card, and history. Today's pipeline moved from 1 Applied / 0 Preparing to 2 Applied / 0 Preparing.
- **Reset:** **Reset sample** restored 2/5, three seed applications, milestone `not_started`, cleared verification refs, and emptied history.
- **Responsive:** no horizontal overflow and no clipped primary buttons at 637px and 729px on Today, Profile, Projects, Opportunities, opportunity detail, and verification.
- **Empty filter state:** with a temporary five-record catalog, the Hackathon filter showed **No sample opportunities in this category** and a visible **Clear filter** action at 637px. Seed restored afterward.
- **Keyboard:** Tab order began at the skip link, then Reset, the four nav items, and page controls. Visible focus rings were confirmed.
- **Lighthouse:** Accessibility 100, Best Practices 100, SEO 100 after the final fixes. The first audit scored SEO 80 for a missing `robots.txt`; a later rerun found the synthetic badge at 4.25:1 contrast, below the 4.5:1 threshold. The badge was darkened to 5.42:1 and the audit was rerun clean.

## Hands-on Checkpoints

- [ ] Early usable behavior explored — after Slice 2 (Today, catalog, fit, actions)
- [ ] Final kick-the-tires exploration and feedback completed

## Final Review

- [ ] Final review complete — feedback resolved and learner confirms ready to ship

## Code Tour and App Map

- [ ] Learning activity complete — guided route, focused alternative, prior practice connected, or brief recap
- [ ] Optional edit and transfer reflection addressed — offered/declined/already covered/not applicable as appropriate
- [x] `devpost/app-map.html` generated from finished code, checked, and shown, including a project-grounded practice to reuse

Activity and evidence: Generated `devpost/app-map.html` from the finished tree at `0c00d08`, then committed it in `3e6bd46`. Served it over a local static server and confirmed in the browser: title “Student Career OS — App Map”, the expected heading, the SVG flow, one expandable details block, no links, no external dependencies, and no horizontal overflow. The map records one reference route (dispatch → reducer/check engine → verified evidence → recomputed fit) and a concrete practice: write the exact before/after contract as tests before wiring the UI. Not yet walked through live with the learner, so the two learner-facing items above stay unchecked.
Route and stops: `devpost/app-map.html` → **Three-stop reference route**: `src/views/VerificationView.tsx` (`submit()` / `run()`), `src/model/state.ts` (`case "RUN_VERIFICATION"`, verified evidence write), `src/model/fit.ts` (`containerizationRow()`, `computeFit()`) plus `src/store/selectors.ts`. Static reference only; no guided tour completed.
Edit outcome: Not offered yet — the map uses a short recap and a reference route rather than an interactive edit exercise.
Reflection: Not offered yet; any personal answer belongs in the ignored `devpost/learner-profile.md`.
Activity mode: Static app map checked in a real browser at `http://127.0.0.1:8099/app-map.html`; live walkthrough pending.

## Revisions

- Consolidated the five planned slices into one verified app commit — the build produced the full tree in one pass rather than five incremental commits, so slice commits were not fabricated retroactively. The final tree is verified by the full command set and the browser journey, and recorded as `0c00d08`.
- Added a timestamp guard to `validVerification` — the plan did not say how to reject a stale verified evidence item that still claimed `source: "verified"`. Validation now requires the Supported state and matching `addedAt` / `verifiedAt` timestamps on `ev_campus_container_verified`.
- Tested the empty-filter state with a temporary five-record catalog — the shipped seed has at least one record in every category, so the planned empty state was unreachable as written. The temporary catalog exercised the message and Clear filter action, then the seed was restored.
- Darkened the synthetic badge label — the post-`robots.txt` Lighthouse rerun found 4.25:1 contrast on `SYNTHETIC SAMPLE WORKSPACE`, below the 4.5:1 threshold. The badge color is now `#5f5a51` at 5.42:1, and the audit is clean.

