---
doc: spec
status: approved
---

# Student Career OS — Technical Specification

A local, single-user React application that demonstrates one connected career loop: an opportunity requirement exposes an evidence gap, a prioritized action leads to a deterministic verification gate, and a passing artifact updates the fit and Today.

Source: `prd.md > The Core Journey`, `prd.md > Features and Behavior`, `prd.md > Verification Gate`, `prd.md > Scope Freeze and Cut Order`.

## How This Works, In Plain Language

This is one browser app with one saved workspace. There is no server, no account, and no database service.

The app holds all of its data in one object: the student profile, practice snapshot, three projects, six sample opportunities, saved applications, the containerization audit, and the verification history. Every screen reads from that same object.

When the student changes something — saves a profile, marks a milestone, adds evidence, saves an opportunity, changes an application status, or runs verification — the app updates that one object. It then saves the object in the browser's local storage, which is a sticky note the browser keeps for this site. On refresh, the app reads the sticky note and rebuilds the same workspace. **Reset sample** replaces the sticky note with the synthetic seed.

The fit map and action plan are **calculated**, not stored. Every time the workspace changes, pure functions read the current projects, evidence, practice, verification result, and deadline, then produce the requirement states and ranked actions. That is why a passed verification changes the fit and Today without anything being manually updated: they are different views of the same state.

The verification gate is deliberately narrow. The student submits Dockerfile text and README commands. Eight checks inspect those strings. A bundle that is well formed becomes **Pending verification**, but nothing counts until **Run verification**. If every check passes, the app records a verified evidence item on CampusCart, marks the containerization milestone done, and recomputes the fit. If any check fails, the app records the failure and the fit returns to **Missing**.

The app never contacts the internet to check a URL, run Docker, import GitHub, or call an LLM. Synthetic data and self-reported evidence are labelled. Passing checks prove that the submitted bundle meets the published rules, not that the image builds or the student is competent.

This shape is intentionally small: one state object, pure calculation functions, a thin React interface, and local persistence. It proves the connected loop without adding a backend or live integrations.

## The Core Journey Through the System

PRD ref: `prd.md > The Core Journey`.

1. **Open the app.** The persistence loader looks for `student-career-os:v1` in local storage. If it is missing, corrupt, or from a different schema version, the seed builder creates the synthetic workspace and writes it back.
2. **Today renders.** The Today selector reads the profile, practice, active applications, nearest deadline, selected opportunity, computed fit, and ranked actions. On first load: Aarav, three active applications, Northstar in 7 days, **2 of 5**, and **Containerize CampusCart** first.
3. **Browse opportunities.** The Opportunities view reads the catalog from the workspace. The filter is a local view value, not saved state. Every record renders its source label from `opportunity.source`.
4. **Open Northstar.** The selected opportunity ID is saved. The detail view calls `computeFit(opportunity, state, today)` and `generateActions(opportunity, fit, state, today)`.
5. **Assess my fit.** The fit panel shows five requirement rows. The DSA row shows the exact threshold table. The action plan shows impact, effort, urgency, and arithmetic.
6. **Mark the milestone done.** The Projects reducer changes only `milestone.status`. The verification state stays `unsupported`, the containerization fit stays `missing`, and coverage stays `2 of 5`.
7. **Open the verification workspace.** The action destination is `verification`. The form is prefilled only when the student presses **Load incomplete sample** or **Load complete sample**.
8. **Submit the incomplete bundle.** Form validation passes because both fields are non-empty. The reducer sets verification to `pending`, stores the bundle, and adds a history entry. The fit becomes `partial`; coverage remains `2 of 5`.
9. **Run verification.** A pure function inspects the bundle and returns eight check results. Checks 6 and 8 fail. The reducer sets verification to `unsupported`, stores the results, and adds history. The fit returns to `missing`; coverage stays `2 of 5`.
10. **Submit the complete bundle.** The reducer sets verification to `pending` again.
11. **Run verification again.** All eight checks pass. The reducer sets verification to `supported`, creates a verified evidence item on CampusCart, marks the containerization milestone done, and adds history.
12. **Fit and Today recompute.** `computeFit` sees the verified containerization record and returns `supported`. Coverage becomes `3 of 5`. `generateActions` removes the containerization action and promotes **Log deployment evidence**. Today reads the same updated state without a reload.
13. **Change the application status.** The student chooses **Applied** from the opportunity detail. A separate application action updates only `applications[northstar].status`. Verification never touches that field.
14. **Refresh.** The provider reloads the saved workspace, including the verified evidence, history, application status, and generated deadlines.
15. **Reset sample.** Confirmation clears the workspace, seeds it again with fresh relative deadlines, and recomputes **2 of 5**.

## Stack

Proposed stack — approval requested at review.

| Layer | Choice | Reason and tradeoff |
|---|---|---|
| UI | **React 19** with **TypeScript** | Component structure fits six surfaces and keeps derived UI predictable. Tradeoff: a build step and React concepts for a one-page app. |
| Build/dev server | **Vite** current stable | Fast local start, static build, no backend. Tradeoff: one dev dependency and a local server instead of opening a raw HTML file. |
| Language | **TypeScript**, strict mode | Makes the evidence, fit, verification, and application-state shapes explicit. Tradeoff: more type work than plain JavaScript. |
| Styling | Hand-written CSS with design tokens | Keeps the career-field-notebook look specific rather than generic. Tradeoff: no component library shortcuts. |
| State | React `useReducer` + context provider | One state object and explicit actions; no global-state dependency. Tradeoff: reducer and selectors must be kept disciplined. |
| Persistence | Browser `localStorage` | Fits the single-user offline demo; no backend. Tradeoff: browser/profile-specific, not shareable. |
| Tests | **Vitest** | Fast unit tests for fit, ranking, verification, and reducer transitions. Tradeoff: no full browser automation in the MVP. |
| Routing | Local view state, no router | Only six surfaces and no deep links required. Tradeoff: browser back does not move between app views. |

No UI framework, charting library, state library, backend, database, auth, analytics, remote fonts, or paid service.

### Version and documentation checks

- Local environment verified: **Node 24.22.1**, **npm 11.19.1**.
- Use the current stable Vite React + TypeScript template at scaffold time and record the exact resolved versions in `package-lock.json` and the README.
- Do not guess a version in the spec and then force it. The build step should verify the scaffold works before adding logic.

Documentation:

- React: https://react.dev/
- TypeScript: https://www.typescriptlang.org/docs/
- Vite: https://vite.dev/guide/
- Vitest: https://vitest.dev/guide/
- `localStorage`: https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage
- `Intl.DateTimeFormat`: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat

### Module boundaries

| Layer | Modules | Owns | May import |
|---|---|---|---|
| Domain model | `model/types.ts`, `dates.ts`, `evidence.ts`, `fit.ts`, `actions.ts`, `verification.ts` | Types, validation, calculations, parsing, reducer, persistence validation | Nothing from React, views, or components |
| Store | `store/WorkspaceProvider.tsx`, `store/selectors.ts` | Hydration, persistence side effects, dispatch context, read-only selectors | Domain model, React |
| Components | `components/*` | Small shared presentational pieces and the evidence form | Types, domain helpers, React |
| Views | `views/*` | Surface composition and local view state | Store, components, domain types |
| Shell | `App.tsx`, `AppShell.tsx` | Surface selection and global disclaimers | Store, views, components |

Dependency direction points inward: views and components never implement fit, ranking, or verification rules. The model layer has no browser API except the `localStorage` adapter passed into `state.ts`. Fit, coverage, and actions are computed on read; views never cache a second copy of the truth.

## Where It Runs and How Someone Tries It

### Runtime

- Desktop browser: current Chrome or Edge.
- Local Vite development server.
- No API keys, environment variables, accounts, or external services.
- The core demo must work with the network disconnected after dependencies are installed.

### Start

```text
npm install
npm run dev
```

Open the URL Vite prints, normally `http://localhost:5173`.

### Verify

```text
npm test
npm run typecheck
npm run build
npm run preview
```

`package.json` must define these scripts:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "typecheck": "tsc -b",
    "test": "vitest run",
    "test:watch": "vitest",
    "preview": "vite preview"
  }
}
```

`npm test` uses `vitest run` so it exits instead of starting a watcher. `vite.config.ts` imports `defineConfig` from `vitest/config`, enables the React plugin, and sets `test.environment` to `node` because the tests cover pure model code. `npm run preview` serves the production build locally.

Every browser origin keeps its own local storage. `http://localhost:5173`, `http://127.0.0.1:5173`, and a preview port are three separate workspaces. Use one origin for the whole demo and document this in the README.

### Demo recording

- Use a fresh workspace or press **Reset sample**.
- Record at 1280 × 800. Record at 100% zoom for legibility, and separately confirm the path works at 125% zoom.
- Follow the path: Today → Opportunities → Northstar → Assess my fit → Containerize CampusCart → mark milestone → incomplete bundle → fail → complete bundle → pass → updated fit and Today → manual Applied status.
- Keep the sample labels and the verification-limits callout visible on screen.

### Sharing

Submission requires a public Git repository and a demo video. **Deployment is not required** and is not part of this spec. The app is recorded locally. A public repository README must explain `npm install` and `npm run dev`.

## Look and Feel

Implements `prd.md > Look and Feel`.

### Palette

| Token | Value | Use |
|---|---|---|
| `--paper` | `#F4EFE4` | Page background |
| `--surface` | `#FBF8F1` | Cards and panels |
| `--ink` | `#1F1D19` | Primary text |
| `--muted` | `#6F6A60` | Secondary text |
| `--rule` | `#D8CEBC` | Borders and dividers |
| `--accent` | `#1F5C55` | Primary action, links, focus |
| `--slate` | `#5B6670` | Missing status |
| `--amber` | `#8A5414` | Partial and pending |
| `--green` | `#2F6B45` | Supported |
| `--rust` | `#A34A2A` | Failed check, overdue, destructive |

Status is always shown with text plus colour, never colour alone. Every text token above has at least 4.5:1 contrast against both `--paper` and `--surface`; the darker amber replaces an earlier value that failed normal-text contrast. The build checks the pairings with a contrast script or an equivalent manual check before the demo.

### Typography

- Display: `"Iowan Old Style", "Palatino Linotype", "Book Antiqua", Georgia, serif`.
- Body: `"Aptos", "Segoe UI", system-ui, sans-serif`.
- Metadata, IDs, check names, file names, timestamps: `"Cascadia Code", "SFMono-Regular", Consolas, monospace`.
- No remote font loading. System stacks keep the demo offline.

### Density and layout

- Calm, field-notebook density: ruled sections, compact tables, generous outer margins.
- Max content width: 1240px.
- Desktop left rail: 220px, sticky.
- Cards have a 1px `--rule` border, minimal radius (4–6px), and a subtle paper shadow rather than floating glass.
- Evidence cards look like receipts: label, source state, date, and a monospace identifier.
- Check rows look like CI checks: number, name, inspected value, pass/fail.
- Buttons are rectangular with a clear primary/secondary distinction.
- Motion is limited to 120–160ms opacity/transform transitions. Respect `prefers-reduced-motion`.

### Copy tone

Factual and non-judgmental:

- “No acceptable evidence yet.”
- “Submitted; not yet verified.”
- “Supported by a recorded artifact.”
- “Linked evidence has not been independently verified.”
- “Deployment evidence recorded. Live reachability is not verified.”

### References

- A field notebook for the overall surface.
- A receipt for evidence cards.
- GitHub checks for the verification rows.
- An audit ledger for the history.

### Responsive behaviour

- Above 900px: full 220px sticky left rail; two-column fit/detail layouts.
- 641–900px: left rail becomes a compact 64px icon rail with visible accessible labels or tooltips and a text alternative; two-column fit/detail layouts collapse to one column.
- At 640px and below: navigation becomes a compact top bar; cards stack; tables become labelled rows; action buttons become full width; the top bar wraps.
- Desktop is the recording target. Mobile must be usable, not a separate design.
- The demo path must remain readable and operable at **125% browser zoom** at 1280 × 800.

### Accessibility

- Every control has an accessible name; icon-only rail buttons keep text labels for assistive technology.
- Focus rings use `--accent`, remain visible on paper surfaces, and are never removed without a replacement.
- Fit, verification, and check status always combine text with colour.
- Forms use real `<label>` elements, inline error text tied to the field, and an error summary after a failed save or submission.
- Dialogs move focus inside, close on Escape, and return focus to the triggering control.
- The sample labels, heuristic explanations, and disclaimers are real text, not background images.
- No motion is required to understand a state change; `prefers-reduced-motion` removes the short transitions.
- Manual check: tab through the full Northstar demo path, then repeat at 125% zoom.

## Components

### App Shell and Navigation

Renders the top bar, synthetic-sample badge, student identity, target role, target timeline, reset action, left navigation, current surface, and persistent footer disclaimer.

- Navigation surfaces: Today, Profile & Practice, Projects, Opportunities.
- Opportunity detail and verification are views within the shell.
- `activeView` is UI state and is not persisted.
- The top bar shows the saved `profile.targetRole` and the human-readable `profile.targetTimeline`; both update after a successful profile save.
- Reset opens a confirmation dialog before dispatching `RESET`.
- If persistence is unavailable, a persistent warning appears in the shell.

PRD refs: `prd.md > Screens and Layout`, `prd.md > Persistence, reset, and storage failure`.

### Today

Shows the profile summary, practice snapshot, application pipeline, nearest deadline, selected-opportunity evidence fit, and the primary recommended action.

- Reads `activeApplications`, `nearestDeadline`, `selectedOpportunity`, `computeFit`, and `generateActions`.
- The next-action button navigates to verification, the relevant project evidence editor, or Profile & Practice.
- If there is no action, shows “No further verifiable action in this prototype.”
- Shows the synthetic-data notice and an evidence-not-competence disclaimer.

PRD ref: `prd.md > Today`.

### Profile & Practice

Displays editable name, target role, and timeline, plus the seeded practice snapshot.

- Local form state; **Save profile** dispatches one `SAVE_PROFILE` action.
- Validation: name 2–60 characters, role 2–80, timeline from the fixed set.
- A successful save shows “Profile saved.” and updates the top bar and Today. A failed save shows inline messages and an error summary.
- Cancel restores the last saved values.
- Practice is read-only and labelled “Practice data is seeded for this demo. Platform sync is not connected.” It shows total solved, per-topic counts, contests, best rank, rating, and submissions in the last 14 days.
- The DSA calculation table is available here and in the fit panel.
- The target role is a workspace preference. It does not alter opportunity requirements or fit.

PRD ref: `prd.md > Profile & Practice`.

### Projects & Evidence

Shows three project cards with technologies, capabilities, milestones, and evidence items.

- Milestone select dispatches `SET_MILESTONE`. It never changes verification or fit directly.
- **Add evidence**, **Edit**, and **Remove** open a typed evidence form.
- The add form starts with a type selector and only enables the fields for that type. **Edit** opens the same type with current values.
- Evidence forms vary by kind:
  - Repository: label, location or note, summary.
  - README/docs: label, location or note, summary, routes documented, setup-content checkbox, usage-content checkbox.
  - Schema: label, location or note, summary, table count, primary-key checkbox, foreign-key checkbox.
  - Test report: label, location or note, summary, passed count, failed count, error count.
  - Deployment: HTTPS URL, health path, observed response, platform, deploy-log excerpt, captured date.
  - Dataset: label, location or note, summary, pipeline input, transformation, output.
  - Contribution: label, location or note, self-reported summary.
  - Other: label, location or note, summary.
- A saved evidence item is `linked` unless it is the verified containerization record. The verified record has `kind: "containerization"`, `source: "verified"`, and cannot be edited or removed until reset.
- `containerization` is not offered in the add/edit type selector; only the gate can create it.
- Removing linked evidence can change fit because fit is recomputed. Removing a verified record is blocked in the reducer and hidden in the UI.
- CampusCart is the only project with a verification action in this prototype.

#### Evidence validation

The form uses one `validateEvidenceDraft` function. A failed form shows inline errors and an error summary, dispatches nothing, and writes nothing to local storage.

| Field | Rule |
|---|---|
| Label | Trimmed, 2–80 characters. |
| Summary | Optional for most types, at most 500 characters. |
| Location / note | Trimmed, 2–500 characters. A URL is recorded as text, never opened. |
| Route count | Whole number 0–999 when present. |
| Table count | Whole number 1–99. |
| Test counts | Optional as a group. If any is provided, all three are required whole numbers 0–99,999 and `testPassed` must be greater than 0. |
| Live URL (stored in `location`) | Must start with `https://`, parse as a URL, and contain a host. `http://` is rejected. |
| Health path | Must start with `/`, 1–100 characters, no whitespace. Stored in `metrics.healthPath`. |
| Observed response | 1–200 characters and must match `\b(status:\s*ok|ok|healthy|up)\b`, case-insensitive. Stored in `metrics.healthResponse`. |
| Platform | One of Render, Railway, Fly.io, Vercel, Other. |
| Deploy log excerpt | 10–1,000 characters. |
| Captured date | Valid `YYYY-MM-DD`, not after today. |
| Pipeline fields | Optional as a group. If any is provided, input, transformation, and output are each required, 2–200 characters. |

#### Per-kind required fields

| Kind | Required | Optional |
|---|---|---|
| `repository` | label, location | summary |
| `readme` | label, location | summary, routeCount, hasSetup, hasUsage |
| `schema` | label, location, tableCount | summary, hasPrimaryKey, hasForeignKey |
| `test_report` | label, location | summary, testPassed, testFailed, testErrors |
| `deployment` | label, location, healthPath, healthResponse, platform, deployLog, capturedDate | summary |
| `dataset` | label, location | summary, pipelineInput, pipelineTransformation, pipelineOutput |
| `contribution` | label, location, summary | — |
| `other` | label, location | summary |

A saved `deployment` item is therefore always complete enough for **Partial** when its requirement is evaluated. A saved `test_report` with no counts remains **Partial**, matching the seeded CampusCart note. `containerization` is not in the add/edit selector.

The app never fetches a link. The form states: “The link is recorded, not opened or verified.”

PRD refs: `prd.md > Projects & Evidence`, `prd.md > Deployment evidence the student can record`.

### Opportunities & Applications

Renders the source-labelled catalog and application tracking.

- Category filter is local UI state. A filter with no matches shows an empty state and a **Clear filter** button that restores **All**.
- Saving dispatches `SAVE_OPPORTUNITY`; unsaving dispatches `UNSAVE_OPPORTUNITY`.
- Unsaving a record whose status is beyond `saved` opens a confirmation dialog. Confirming removes the application and clears its status.
- Status select dispatches `SET_APPLICATION_STATUS`; changing status on an untracked record first creates a saved record with that status.
- The detail view shows the current status and “Last updated {date, time}” from `application.updatedAt`.
- Status is manual and has no connection to verification.
- Cards and detail show `opportunity.source.label`; there is no external apply button.
- An overdue record shows **Deadline passed** and keeps its current status until the student changes it.

PRD refs: `prd.md > Opportunities & Applications`, `prd.md > Catalog source model`.

### Opportunity Detail, Fit, and Action Plan

Shows the selected opportunity, requirements, fit rows, DSA calculation, ranking table, and actions.

- `computeFit` returns one `FitRow` per requirement. A missing or partial row carries a gap target: the relevant project and evidence kind, the verification workspace, or Profile & Practice.
- `generateActions` returns up to three rows.
- Each action shows the requirement and current state, the target project or practice area, the expected artifact, the exact score arithmetic, the limitation, and the opportunity source label.
- Each action opens a real destination.
- A disclosure explains the rules in plain language.
- The fit is labelled **Evidence fit**, never readiness or hire probability.

PRD refs: `prd.md > Opportunity Fit & Action Plan`, `prd.md > Fit mapping`, `prd.md > Deterministic fit rules`, `prd.md > Action plan and ranking`.

### Verification Workspace

Shows the containerization requirement, milestone, artifact form, checks, pending state, results, and history.

- **Mark milestone done** dispatches `SET_MILESTONE`; it does not touch verification.
- On open, the form loads `verification.bundle` when one exists; otherwise it is empty.
- **Load incomplete sample** and **Load complete sample** fill the form only.
- **Submit artifact** runs form validation, then dispatches `SUBMIT_ARTIFACT`.
- **Run verification** is enabled only when pending and dispatches `RUN_VERIFICATION`.
- **Edit submission** is enabled only when pending and dispatches `EDIT_SUBMISSION`. It withdraws the stored pending bundle, returns verification to **Unsupported**, and returns the fit to **Missing**. The form keeps its current text only in local view state so the student can correct it; that text is not a pending bundle and is lost on reload.
- While pending, both text areas and the sample-load buttons are disabled; only **Run verification** and **Edit submission** are active.
- Results render all eight checks, inspected values, and reasons.
- When supported, the form is locked and the verified evidence summary remains visible.
- History lists timestamp, previous state, new state, and check summary. It never stores a full second bundle.

PRD refs: `prd.md > Verification Workspace`, `prd.md > Verification Gate`.

### Shared Components

- `SampleBadge` — “Sample — not live” on catalog records and detail.
- `StatusChip` — text plus colour for fit and verification states.
- `EvidenceCard` — linked/verified label, summary, date, source.
- `CheckRow` — pass/fail, inspected value, reason.
- `ScoreBreakdown` — impact, effort, urgency, arithmetic.
- `DsaCalculation` — the visible threshold table.
- `ConfirmDialog` — reset and destructive unsave.
- `EmptyState` — no filter matches, no active applications, no actions.
- `Callout` — limits, disclaimers, and heuristic notes.
- `FieldError` — inline validation.

## Data Model

### Core types

```ts
type Capability =
  | "api"
  | "database"
  | "dsa"
  | "containerization"
  | "deployment"
  | "testing"
  | "documentation"
  | "collaboration"
  | "data_pipeline";

type FitStatus = "supported" | "partial" | "missing";
type VerificationStatus = "unsupported" | "pending" | "supported";
type EvidenceSource = "linked" | "verified";
type EvidenceKind =
  | "repository"
  | "readme"
  | "schema"
  | "test_report"
  | "deployment"
  | "dataset"
  | "contribution"
  | "containerization"
  | "other";
type ApplicationStatus =
  | "saved"
  | "preparing"
  | "applied"
  | "interviewing"
  | "closed";
type MilestoneStatus = "not_started" | "in_progress" | "done";
type OpportunityCategory =
  | "internship"
  | "apprenticeship"
  | "fellowship"
  | "job"
  | "hackathon";
```

### Profile and practice

```ts
interface Profile {
  name: string;
  targetRole: string;
  targetTimeline: "3_months" | "6_months" | "12_months";
}

interface Practice {
  totalSolved: number;
  sqlSolved: number;
  topics: {
    arrays: number;
    strings: number;
    trees: number;
    linkedLists: number;
    graphs: number;
    dp: number;
  };
  contests: number;
  bestRank: number;
  rating: number;
  recentSubmissions: number;
}
```

The seed uses **Aarav Mehta**, target role **Backend Engineering Intern**, timeline **Next 6 months**, 145 total, 21 SQL, topics `48 / 31 / 22 / 9 / 8 / 6`, 6 contests, best rank 812, rating 1543, 12 recent submissions. “Recent activity” means 12 submissions in the last 14 days.

### Projects and evidence

```ts
interface Milestone {
  id: string;
  label: string;
  status: MilestoneStatus;
  teamContributed?: boolean;
}

interface EvidenceMetrics {
  routeCount?: number;
  hasSetup?: boolean;
  hasUsage?: boolean;
  tableCount?: number;
  hasPrimaryKey?: boolean;
  hasForeignKey?: boolean;
  testPassed?: number;
  testFailed?: number;
  testErrors?: number;
  pipelineInput?: string;
  pipelineTransformation?: string;
  pipelineOutput?: string;
  healthPath?: string;
  healthResponse?: string;
  platform?: "Render" | "Railway" | "Fly.io" | "Vercel" | "Other";
  deployLog?: string;
  capturedDate?: string;
}

interface EvidenceItem {
  id: string;
  projectId: string;
  kind: EvidenceKind;
  label: string;
  location: string;
  summary: string;
  source: EvidenceSource;
  addedAt: string;
  verifiedAt?: string;
  metrics?: EvidenceMetrics;
}

interface Project {
  id: string;
  name: string;
  summary: string;
  technologies: string[];
  capabilities: Capability[];
  milestones: Milestone[];
  evidence: EvidenceItem[];
}
```

#### Project seed

| Project ID | Name | Technologies | Capabilities | Summary |
|---|---|---|---|---|
| `campus_cart` | CampusCart | Python, Flask, SQLite, REST | `api`, `database`, `documentation`, `testing` | A Flask and SQLite shopping-cart API used for the containerization upgrade. |
| `study_sync` | StudySync | JavaScript, React, Firebase | `documentation`, `collaboration` | A React and Firebase study-group planner built with a partner. |
| `route_wise` | RouteWise | Python, pandas, CSV | `data_pipeline`, `testing`, `documentation` | A pandas pipeline that cleans and summarises travel-survey data. |

#### Milestone seed

| Milestone ID | Project | Label | Seed status | Team contributed |
|---|---|---|---|---|
| `campus_cart_api` | CampusCart | Ship REST API | `done` | — |
| `campus_cart_db` | CampusCart | Model database schema | `done` | — |
| `campus_cart_tests` | CampusCart | Add automated tests | `in_progress` | — |
| `campus_cart_containerize` | CampusCart | Containerize API | `not_started` | — |
| `campus_cart_deploy` | CampusCart | Deploy service | `not_started` | — |
| `study_sync_auth` | StudySync | Ship authentication | `done` | — |
| `study_sync_collab` | StudySync | Partner contribution | `done` | `true` |
| `route_wise_pipeline` | RouteWise | Build data pipeline | `done` | — |
| `route_wise_tests` | RouteWise | Add test suite | `done` | — |

`campus_cart_containerize` is the stable ID the verification pass completes. “Containerize CampusCart” in the action plan refers to this milestone and to `campus_cart`.

#### Evidence seed

Locations use the reserved `example.invalid` domain or repository-relative paths so no sample link implies a live external page. The app never opens them.

| Evidence ID | Project | Kind | Label | Location | Summary | Metrics | Source | Added |
|---|---|---|---|---|---|---|---|---|
| `ev_campus_repo` | CampusCart | `repository` | CampusCart repository | `https://example.invalid/aarav/campuscart` | Flask API source and setup notes. | — | linked | `seededAt − 40d` |
| `ev_campus_readme` | CampusCart | `readme` | API route table | `README.md` | Six REST routes with setup and usage instructions. | `routeCount: 6`, `hasSetup: true`, `hasUsage: true` | linked | `seededAt − 38d` |
| `ev_campus_schema` | CampusCart | `schema` | SQLite schema | `schema.sql` | Four tables with primary keys and one foreign key. | `tableCount: 4`, `hasPrimaryKey: true`, `hasForeignKey: true` | linked | `seededAt − 36d` |
| `ev_campus_test_note` | CampusCart | `test_report` | Testing plan note | `notes/testing.md` | Tests are planned but no captured result exists yet. | — | linked | `seededAt − 20d` |
| `ev_study_repo` | StudySync | `repository` | StudySync repository | `https://example.invalid/aarav/studysync` | React source and setup notes. | — | linked | `seededAt − 60d` |
| `ev_study_readme` | StudySync | `readme` | Setup and usage guide | `README.md` | Setup and usage instructions for the study-group planner. | `hasSetup: true`, `hasUsage: true` | linked | `seededAt − 58d` |
| `ev_study_contribution` | StudySync | `contribution` | Partner contribution note | `notes/team.md` | Self-reported split of work with a project partner. | — | linked | `seededAt − 55d` |
| `ev_route_repo` | RouteWise | `repository` | RouteWise repository | `https://example.invalid/aarav/routewise` | pandas pipeline source and setup notes. | — | linked | `seededAt − 50d` |
| `ev_route_readme` | RouteWise | `readme` | Setup and usage guide | `README.md` | Setup and usage instructions for the pipeline. | `hasSetup: true`, `hasUsage: true` | linked | `seededAt − 48d` |
| `ev_route_tests` | RouteWise | `test_report` | Pipeline test report | `reports/tests.txt` | Twelve passing checks, no failures or errors. | `testPassed: 12`, `testFailed: 0`, `testErrors: 0` | linked | `seededAt − 30d` |
| `ev_route_dataset` | RouteWise | `dataset` | Travel survey sample | `data/sample.csv` | Cleaned sample used by the pipeline. | `pipelineInput: "Raw travel survey CSV"`, `pipelineTransformation: "Clean missing trips and aggregate by route"`, `pipelineOutput: "Route summary CSV"` | linked | `seededAt − 29d` |

`addedAt` is built by `seedTimestamp(seededAt, daysAgo)` and stored as an ISO timestamp. The order above is also the seed project/evidence order used by the tie-break.

No project starts with deployment evidence. No project starts with a verified record. `ev_campus_container_verified` is created only by a passing verification run, with exactly these values:

| Field | Value |
|---|---|
| `id` | `ev_campus_container_verified` |
| `projectId` | `campus_cart` |
| `kind` | `containerization` |
| `label` | Verified containerization bundle |
| `location` | `Dockerfile + README commands` |
| `summary` | 8/8 checks passed on the submitted bundle. |
| `source` | `verified` |
| `addedAt` | the run's ISO timestamp |
| `verifiedAt` | the same ISO timestamp |
| `metrics` | omitted |

It is read-only and is removed only by `RESET`.

`ev_campus_test_note` is deliberately an incomplete seed record: it is a test note with no captured counts, so it produces **Partial** testing evidence. Form validation applies to new or edited evidence, not to this intentional seed. Loading a saved workspace does not re-run per-kind completeness validation.

### Opportunities and requirements

```ts
type OpportunitySourceType = "sample" | "verified_external";

interface OpportunitySource {
  type: OpportunitySourceType;
  label: string;
  provider?: string;
}

interface Requirement {
  id: string;
  label: string;
  capability: Capability;
  description: string;
}

interface Opportunity {
  id: string;
  title: string;
  organisation: string;
  category: OpportunityCategory;
  location: string;
  format: string;
  deadline: string | null; // YYYY-MM-DD; null means no deadline
  summary: string;
  source: OpportunitySource;
  requirements: Requirement[];
}
```

The prototype seeds only `source.type: "sample"` with `label: "Sample — not live"`. Adding a verified external source later means adding a source value and records; saving, tracking, fit, and action code read `source` and do not branch on hard-wired cards. A future source may not bypass the verification gate for gated evidence.

#### Standard requirement templates

Every requirement uses one capability tag from the shared union. Requirement IDs are `${opportunityId}_${capability}` and are unique across the catalog.

| Capability | Visible label | Description |
|---|---|---|
| `api` | REST API implementation | Build and document a working API. |
| `database` | Relational database modeling | Model related data with keys and relationships. |
| `dsa` | DSA fundamentals | Show consistent practice across core topics. |
| `containerization` | Containerization | Package the service with a reproducible image definition. |
| `deployment` | Deployment evidence | Record where the service runs and how it was observed. |
| `testing` | Automated testing | Capture a test result with passing checks. |
| `documentation` | Documentation | Explain setup and usage. |
| `collaboration` | Collaboration evidence | Record team contribution. |
| `data_pipeline` | Data pipeline | Describe input, transformation, and output. |

#### Opportunity seed

Deadlines are built from day offsets at seed time and persist. **Reset sample** rebuilds them from the reset date. All records use the standard requirement templates above.

| Opportunity ID | Title | Organisation | Category | Offset | Location · format | Summary | Requirement capabilities |
|---|---|---|---|---:|---|---|---|
| `northstar_backend_intern` | Backend Engineering Intern | Northstar Labs | `internship` | 7 | Bengaluru, India · Hybrid | Build and document REST endpoints for a logistics platform. | `api`, `database`, `dsa`, `containerization`, `deployment` |
| `meridian_data_apprentice` | Data Engineering Apprentice | Meridian Data | `apprenticeship` | 12 | Remote · Remote | Maintain batch pipelines and document data contracts. | `data_pipeline`, `database`, `testing`, `documentation` |
| `commons_backend_fellow` | Open Source Backend Fellow | Commons Labs | `fellowship` | 21 | Remote · Remote | Contribute to an open-source backend with tests and docs. | `api`, `documentation`, `testing`, `collaboration` |
| `blue_harbor_junior_swe` | Junior Software Engineer | Blue Harbor Systems | `job` | 30 | Pune, India · On-site | Ship and operate services with databases and containers. | `api`, `database`, `containerization`, `deployment`, `testing` |
| `orbit_campusbuild` | CampusBuild Hackathon | Orbit Collective | `hackathon` | 35 | Online · Online | Build a small API-backed project in a team and present it. | `api`, `documentation`, `collaboration`, `deployment` |
| `hearthstone_platform_intern` | Platform Engineering Intern | Hearthstone Cloud | `internship` | 28 | Hyderabad, India · Hybrid | Package and test internal platform services. | `api`, `containerization`, `testing`, `documentation` |

All six are assessable by the same fit engine. Northstar is the scripted demo path, not the only working record. The model permits `deadline: null` for a future record; urgency is then `1`, and the deadline sorts last.

### Applications, verification, and history

```ts
interface Application {
  status: ApplicationStatus;
  updatedAt: string;
}

interface VerificationCheck {
  id: string;
  label: string;
  passed: boolean;
  inspected: string;
  reason: string;
}

interface VerificationResult {
  checks: VerificationCheck[];
  passed: boolean;
  runAt: string;
}

interface VerificationState {
  status: VerificationStatus;
  bundle: { dockerfile: string; readmeCommands: string } | null;
  submittedAt: string | null;
  lastResult: VerificationResult | null;
  verifiedAt: string | null;
  verifiedEvidenceId: string | null;
}

interface HistoryEntry {
  id: string;
  timestamp: string;
  requirement: "containerization";
  previous: VerificationStatus;
  next: VerificationStatus;
  checkSummary: string;
}
```

### Seeded applications and selectors

| Opportunity ID | Seed status | Seed `updatedAt` |
|---|---|---|
| `northstar_backend_intern` | `preparing` | `seededAt` |
| `orbit_campusbuild` | `saved` | `seededAt` |
| `blue_harbor_junior_swe` | `saved` | `seededAt` |

The other three opportunities are untracked. `applications` is keyed by opportunity ID, so every key must reference a seeded opportunity.

Selector definitions:

- `activeApplications(state)`: entries whose status is `saved`, `preparing`, `applied`, or `interviewing`. On first load there are three. `closed` is excluded.
- `nearestDeadline(state, today)`: the earliest non-null deadline among `activeApplications`. It returns the opportunity ID, date, days left, and overdue flag, or `null` with the copy “No upcoming deadline.”
- `selectedOpportunity`: the record matching `selectedOpportunityId`, falling back to the catalog if it is missing.
- `pipelineCounts`: counts for Saved, Preparing, Applied, and Interviewing. Closed is shown separately as “Closed”.

### Workspace state

```ts
interface WorkspaceState {
  schemaVersion: 1;
  seedVersion: 1;
  seededAt: string;
  profile: Profile;
  practice: Practice;
  projects: Project[];
  opportunities: Opportunity[];
  applications: Record<string, Application>;
  verification: VerificationState;
  history: HistoryEntry[];
  selectedOpportunityId: string;
}
```

Derived, never stored:

- Requirement fit rows.
- Coverage counts.
- Action plans.
- Today's primary action.
- Days remaining and overdue state.

### State transitions

| Action | Changes | Does not change |
|---|---|---|
| `SAVE_PROFILE` | profile fields | fit, verification, applications |
| `SET_MILESTONE` | one milestone status | verification, fit |
| `ADD_EVIDENCE` / `UPDATE_EVIDENCE` / `REMOVE_EVIDENCE` | linked project evidence; verified containerization evidence is read-only | verification status; fit is recomputed |
| `SAVE_OPPORTUNITY` | creates application with `saved` | fit |
| `UNSAVE_OPPORTUNITY` | removes application | fit |
| `SET_APPLICATION_STATUS` | application status and `updatedAt` | verification, fit |
| `SELECT_OPPORTUNITY` | selected opportunity ID | fit calculations, applications |
| `SUBMIT_ARTIFACT` | verification `pending`, bundle, submittedAt, history; clears `lastResult`, `verifiedAt`, and `verifiedEvidenceId` | no evidence created; fit is recomputed to `partial` |
| `EDIT_SUBMISSION` | verification `unsupported`, bundle null, submittedAt null, lastResult null, verifiedAt null, verifiedEvidenceId null, history | no evidence; fit is recomputed to `missing` |
| `RUN_VERIFICATION` | result, verification state, history; on pass, verified evidence + milestone + `verifiedAt` + `verifiedEvidenceId`; on fail, clears `verifiedAt` and `verifiedEvidenceId` | application status |
| `RESET` | full seeded workspace; verification is `unsupported` with null bundle, submittedAt, lastResult, verifiedAt, and verifiedEvidenceId; history is empty | nothing outside local storage |

There is intentionally **no** `SET_REQUIREMENT_STATUS` or `SET_FIT_STATUS` action, and no stored fit field. No reducer path writes a fit status. Verification status changes only through `SUBMIT_ARTIFACT`, `EDIT_SUBMISSION`, `RUN_VERIFICATION`, and `RESET`; only a passing `RUN_VERIFICATION` produces `supported`. `state.test.ts` and the absence of a setter assert this, not the type system alone.

### Persistence

- Key: `student-career-os:v1`.
- On load: parse JSON and run `validateWorkspace(data)`. It checks `schemaVersion === 1`, `seedVersion === 1`, required objects and arrays, unique IDs, valid enum values, `selectedOpportunityId` referencing a catalog record, application keys that reference opportunities, evidence `projectId` values that reference projects, and milestone IDs unique per project.
- Verification reference validation:
  - When `verification.status === "supported"`, `verifiedEvidenceId` must equal `ev_campus_container_verified`. That exact evidence record must exist, have `kind: "containerization"`, `source: "verified"`, and `projectId: "campus_cart"`. `verifiedAt` must be a valid ISO timestamp.
  - When `verification.status` is `"unsupported"` or `"pending"`, both `verifiedEvidenceId` and `verifiedAt` must be `null`.
  - A supported state with a null, missing, mismatched, non-containerization, non-verified, or wrong-project reference is invalid and reseeds. A non-supported state that retains either reference is also invalid and reseeds.
- If parsing or validation fails, discard the saved object, seed in memory, write the seed, and show a dismissible notice: “Saved sample data was reset because it could not be read.”
- On every state change after hydration: write the serialized state.
- If `localStorage` throws (private mode, quota, disabled), keep the app usable in memory and set `persistenceAvailable = false`; show the warning “Changes will be lost when this page closes.”
- `RESET` writes a fresh seed with a new `seededAt` and new deadlines.
- `selectedOpportunityId` is persisted so Today's fit snapshot survives refresh.
- `activeView`, filter, form drafts, modal state, notices, and `persistenceAvailable` are not persisted.
- No schema migration exists in the prototype. A version mismatch reseeds rather than partially upgrading old data.

### ID and reference rules

- Student: one seeded profile, no separate student ID in the workspace.
- Projects: `campus_cart`, `study_sync`, `route_wise`.
- Milestones: `campus_cart_api`, `campus_cart_db`, `campus_cart_tests`, `campus_cart_containerize`, `campus_cart_deploy`, `study_sync_auth`, `study_sync_collab`, `route_wise_pipeline`, `route_wise_tests`.
- Evidence: the IDs in the evidence table, plus `ev_campus_container_verified` created on pass. User-added evidence uses `ev_${crypto.randomUUID()}`; tests may inject a deterministic ID factory.
- Opportunities: the six IDs in the catalog table.
- Requirements: `${opportunityId}_${capability}`.
- Applications: keyed by opportunity ID.
- Capability tags come only from the `Capability` union; no ad-hoc strings in seed data or rules.

A single capability tag is used by the requirement, the project capability list, the action, and the fit rule. One evidence item may support multiple requirements, but coverage always counts requirements.

## Dates and Deadlines

PRD refs: `prd.md > Today`, `prd.md > Action plan and ranking`.

- Deadlines are date-only strings in `YYYY-MM-DD`. They are never stored as UTC timestamps.
- `parseDateOnly("2026-10-26")` returns a local `Date` at local midnight using `new Date(year, month - 1, day)`. Do not use `new Date("YYYY-MM-DD")`, which parses as UTC and can shift a day.
- `dayNumber(date)` uses `Date.UTC(year, month - 1, day) / 86_400_000` so daylight-saving changes cannot make a calendar-day difference 23 or 25 hours.
- `daysLeft(deadline, today)` subtracts day numbers and returns a whole number. The seed uses `addDays(seedDate, offset)` and formats back to `YYYY-MM-DD`.
- `today` is a local calendar day supplied by `useToday()`. It is set on load, refreshed on window focus and `visibilitychange`, and scheduled to change at the next local midnight. A mutation also reads the current value. An idle foreground tab therefore does not stay on yesterday after midnight.
- Display uses `Intl.DateTimeFormat` with the user's locale and `{ year: "numeric", month: "short", day: "numeric" }`.
- `seedTimestamp(seededAtIso, daysAgo)` returns `new Date(Date.parse(seededAtIso) - daysAgo * 86_400_000).toISOString()`. Seed evidence uses the distinct day offsets in its table.
- Overdue means `daysLeft < 0`. The UI shows **Deadline passed** and does not change application status.
- Urgency boundaries are tested at 7, 8, 21, and 22 days, exactly at local midnight. A null deadline is urgency 1.
- `capturedDate` uses the same date-only parser and rejects a date after today.

## Fit Engine

PRD ref: `prd.md > Deterministic fit rules`.

### `computeFit(opportunity, state, today): FitRow[]`

```ts
interface FitRow {
  requirementId: string;
  requirementLabel: string;
  capability: Capability;
  status: FitStatus;
  reason: string;
  evidenceRefs: string[];
  gap: {
    text: string;
    destination: "verification" | "project" | "profile";
    projectId?: string;
    evidenceKind?: EvidenceKind;
  } | null;
  calculation?: DsaCalculation;
  limitation: string;
}

interface DsaCalculation {
  totalSolved: number;
  totalSolvedPass: boolean;
  coreTopicCount: number;
  coreTopicsRequired: number;
  coreTopicsPass: boolean;
  contests: number;
  contestsPass: boolean;
  topics: Record<"arrays" | "strings" | "trees" | "linkedLists" | "graphs" | "dp", number>;
}
```

For each requirement:

1. Evaluate the capability against every project (and, for DSA, against `practice`), considering both the capability tag and the matching evidence. The capability-specific rule states whether the tag, the evidence, or both are required.
2. Choose the strongest project result. Strength is `supported` > `partial` > `missing`; ties prefer a verified source, then newer `addedAt`, then seed project order. This is how “strongest matching evidence” and the PRD tie-break apply together.
3. Build `reason`, `evidenceRefs`, `gap`, `limitation`, and `calculation` when relevant.
4. A row with no acceptable evidence returns `missing` and a gap target that opens the matching evidence form, the verification workspace, or Profile & Practice.

`today` is the local calendar day from `useToday()`, used for the deployment captured-date rule and passed through from the same source as the action plan's urgency calculation.

### Capability rules

#### API

- **Supported:** a project has `api` capability and `readme` evidence with `routeCount >= 3`.
- **Partial:** a project has `api` capability and linked API evidence, but no `readme` evidence with `routeCount >= 3`. API evidence means a linked `readme`, `repository`, or `other` item on that project. The route count may be 0–2 or missing.
- **Missing:** no project has both `api` capability and linked API evidence. A capability tag alone does not count.
- **Reason example:** “CampusCart documents 6 endpoints in its README.”
- **Limitation:** “Linked evidence is recorded, not independently verified.”

#### Database

- **Supported:** a project has `database` capability and linked `schema` evidence with `tableCount >= 2`, `hasPrimaryKey === true`, and `hasForeignKey === true`.
- **Partial:** a linked `schema` evidence item exists, but any supported condition fails. This includes a table count of 1 and a missing primary key, foreign key, or relationship. The schema item is the evidence; the `database` capability is not required for Partial, but it is required for Supported.
- **Missing:** no project has linked `schema` evidence. A `database` capability tag alone does not count.
- **Reason example:** “CampusCart has 4 tables, primary keys, and a foreign key.”

API and Database results are recomputed from the remaining linked evidence on every add, update, or removal. Removing the last API evidence returns API to **Missing**; removing the last `schema` evidence returns Database to **Missing**, even when the capability tag remains. When other evidence remains, the normal capability rule is applied to it.

#### DSA

Calculate three thresholds:

```ts
const totalSolvedPass = practice.totalSolved >= 120;
const coreTopicCount = count(Object.values(practice.topics), (n) => n >= 10);
const coreTopicsPass = coreTopicCount >= 4;
const contestsPass = practice.contests >= 3;
```

- All three pass → **Supported**.
- At least one passes → **Partial**.
- None pass → **Missing**.
- Return the `DsaCalculation` above; the UI renders the visible table with required, recorded, and pass/fail per threshold. SQL counts toward `totalSolved` only, not core topics.
- **Limitation:** “Practice data is seeded and not synced from a coding platform.”
- **Seed outcome:** 145 total pass, 3 of 6 core topics fail, 6 contests pass → **Partial**.

#### Containerization

- `verification.status === "supported"` and a `containerization` evidence item with `source: "verified"` exists → **Supported**.
- `verification.status === "pending"` → **Partial**.
- Otherwise → **Missing**.
- Milestone state is ignored.
- Evidence refs include the verified evidence ID and the verification record.
- **Limitation:** “Checks validate the submitted bundle’s completeness and internal consistency, not that the image builds.”

#### Deployment

- A complete deployment evidence item → **Partial**.
- Incomplete or absent → **Missing**.
- **Supported is unreachable.**
- Completeness requires `location` to be an HTTPS URL, a `/`-prefixed health path, an observed response matching `\b(status:\s*ok|ok|healthy|up)\b`, a platform, a deploy-log excerpt, and a captured date not in the future.
- The reason always includes “Live reachability is not verified.”
- **Limitation:** “The app does not open the URL, check DNS/TLS, test uptime, or confirm the deployed commit.”

#### Testing

- `test_report` evidence with `testPassed > 0`, `testFailed === 0`, and `testErrors === 0` → **Supported**.
- A test report with failures, errors, or no captured counts, or a project with a repository link that mentions tests, → **Partial**.
- No testing evidence → **Missing**.
- **Limitation:** “The app does not run the tests.”
- Seed: CampusCart has a plan note → **Partial**; RouteWise has a passing report → **Supported**.

#### Documentation

- `readme` evidence with `hasSetup === true` and `hasUsage === true` → **Supported**.
- A repository link, or a README missing setup or usage content → **Partial**.
- No documentation evidence → **Missing**.
- **Limitation:** “Documentation is reviewed for presence, not accuracy.”

#### Collaboration

- `contribution` evidence, or a milestone with `teamContributed === true` → **Partial**.
- Absent → **Missing**.
- **Supported is unreachable.**
- **Reason:** “Collaboration is self-reported and cannot be verified in this prototype.”

#### Data pipeline

- A project has `data_pipeline` capability and `dataset` or `readme` evidence with non-empty `pipelineInput`, `pipelineTransformation`, and `pipelineOutput` → **Supported**.
- The capability exists without that evidence → **Partial**.
- No capability or evidence → **Missing**.
- **Limitation:** “The pipeline is described, not executed.”
- Seed: RouteWise has all three fields → **Supported**.

### Coverage

`coverage = supported rows / total rows`. Partial and missing are not counted.

Northstar initial: API supported, database supported, DSA partial, containerization missing, deployment missing → **2 of 5**.

## Action Engine

PRD ref: `prd.md > Action plan and ranking`.

### `generateActions(opportunity, fit, state, today): RankedAction[]`

For each partial or missing fit row, create at most one action. The only rows that produce a recorded note instead of a button are the two that are fully recorded but cannot be advanced in this prototype:

- Deployment complete but partial → no action; show “Recorded; live reachability is not verified.”
- Collaboration partial → no action; show “Recorded; collaboration is not verifiable in this prototype.”

All other partial or missing rows produce a working action:

- Containerization `pending` → “Run pending container verification.”
- Containerization `missing` → “Containerize CampusCart” to the verification workspace.
- Deployment missing or incomplete → “Log deployment evidence” to the CampusCart evidence form.
- DSA partial/missing → “Strengthen DSA topic coverage” to Profile & Practice. This is a guidance-only action: it opens the visible DSA calculation and does not edit seeded practice.
- API → “Document {project} API”; database → “Document {project} schema”; testing → “Capture a {project} test report”; documentation → “Complete {project} documentation”; data pipeline → “Describe the {project} pipeline”. Each opens the project evidence form with the matching evidence kind.

The target project is the project that produced the strongest fit result. If the row is missing, it is the first project with the matching capability, otherwise the first project in portfolio order. Every action card also shows `opportunity.source.label`.

The suppression of a recorded deployment or collaboration row is intentional: the PRD allows only partial and missing rows to generate actions, not every such row.

#### Impact and effort

| Capability | Impact | Effort |
|---|---:|---:|
| Containerization | 5 | 2 |
| API | 4 | 3 |
| Database | 4 | 3 |
| Deployment | 4 | 4 |
| DSA | 3 | 3 |
| Testing | 3 | 2 |
| Data pipeline | 3 | 3 |
| Documentation | 2 | 1 |
| Collaboration | 2 | 2 |

Each action carries:

```ts
interface RankedAction {
  id: string;
  requirementId: string;
  requirementLabel: string;
  requirementStatus: FitStatus;
  capability: Capability;
  title: string;
  description: string;
  artifact: string;
  sourceLabel: string;
  targetProjectId?: string;
  evidenceKind?: EvidenceKind;
  destination: "verification" | "project" | "profile";
  impact: number;
  effort: number;
  urgency: number;
  score: number;
  limitation: string;
}
```

### Scoring

```text
if deadline is null: urgency = 1
else if daysLeft <= 7: urgency = 3
else if daysLeft <= 21: urgency = 2
else: urgency = 1
score = round((impact * urgency / effort) * 10) / 10
```

Days are whole local calendar days from today to the deadline. A passed deadline keeps urgency 3 and shows an overdue warning.

Sort:

1. Score descending.
2. Impact descending.
3. Effort ascending.
4. Earlier deadline; a null deadline sorts last.
5. Requirement order.

Return the first three.

### Initial Northstar actions

| Action | Impact | Effort | Urgency | Score |
|---|---:|---:|---:|---:|
| Containerize CampusCart | 5 | 2 | 3 | 7.5 |
| Log deployment evidence | 4 | 4 | 3 | 3.0 |
| Strengthen DSA topic coverage | 3 | 3 | 3 | 3.0 |

Deployment wins the tie on impact. After containerization passes, deployment is first and DSA second. If deployment is completed, it leaves the action list and DSA becomes first.

### Destination behaviour

- `verification` → open Verification Workspace.
- `project` → open Projects, focus the target project, open the evidence form with the matching kind.
- `profile` → open Profile & Practice and highlight the DSA calculation.

No action button is inert.

## Verification Engine

PRD refs: `prd.md > Verification Gate`, `prd.md > Verification Contract`.

### Input

```ts
interface ArtifactBundle {
  dockerfile: string;
  readmeCommands: string;
}
```

### Form validation

- Both fields required, trimmed non-empty.
- Each field at most 20,000 characters.
- Errors are shown inline and in an error summary.
- A valid bundle becomes pending; a malformed bundle stays unsupported with a missing fit and writes no history.

### Dockerfile normalization

`parseDockerfile(text)` is deterministic and shared by all Docker checks:

1. Split on `\n`; strip `\r`.
2. Remove full-line comments whose trimmed text starts with `#`. Do not treat text after an instruction as an inline comment.
3. Join continuation lines ending with `\`: remove the backslash, append a space, and continue.
4. Trim blank lines.
5. Split each line into an uppercase instruction and trimmed arguments. Preserve the first instruction and the last `CMD`/`ENTRYPOINT`.

The parser is intentionally a small instruction reader, not a Docker engine. A malformed instruction simply fails its matching check.

### Check implementation

`runContainerizationChecks(bundle): VerificationResult`

1. **Base image tag**
   - Inspect the first `FROM` instruction. Remove leading `--platform=...` and other `--flag=value` flags, then take the image token before any `AS alias`.
   - Pass when the image is pinned by a digest (`@sha256:...`) or has a tag after the last slash that is non-empty and not `latest`.
   - `python:3.12-slim` and `python@sha256:...` pass; `python`, `python:latest`, and `registry:5000/app` fail. A registry port is not a tag.
2. **Workdir**
   - Pass when a `WORKDIR` instruction exists with a non-empty path.
3. **Copy**
   - Pass when a `COPY` instruction exists with at least a source and destination after removing flags such as `--from=builder`. JSON-array form with at least two strings also passes.
4. **Run**
   - Pass when `RUN` exists with non-empty arguments.
5. **Expose**
   - Pass when any `EXPOSE` token is a port from 1 to 65535, optionally followed by `/tcp` or `/udp`. Collect all exposed TCP ports; an unspecified protocol means TCP.
6. **Command**
   - Pass when the last `CMD` or `ENTRYPOINT` has non-empty arguments, in shell or JSON form.
7. **README commands**
   - Normalize the README to lowercase and collapse whitespace.
   - Pass when it contains `docker build` and `docker run`.
8. **Port mapping**
   - Find `docker run` publish flags in the normalized README: `-p 5000:5000`, `-p=5000:5000`, `-p5000:5000`, `--publish 5000:5000`, and `--publish=5000:5000`.
   - Accept `5000:5000`, `127.0.0.1:5000:5000`, and an optional `/tcp` or `/udp` suffix. Only TCP mappings count.
   - Pass when a published container port equals any exposed TCP port.
   - Port ranges, IPv6 brackets, and other unpublished forms fail closed.
   - If `EXPOSE` is absent or invalid, this check fails.

Each result includes a short `inspected` value (for example `FROM python:3.12-slim`, `EXPOSE 5000`, `-p 8000:8000`), not the full artifact.

### Reducer transitions

- `SUBMIT_ARTIFACT` only from `unsupported`; sets `pending`, stores the bundle, sets `submittedAt`, clears `lastResult`, `verifiedAt`, and `verifiedEvidenceId`, appends history. If the form is invalid, the view does not dispatch.
- `RUN_VERIFICATION` only from `pending` with a stored bundle; runs checks.
  - Fail: status `unsupported`, stores `lastResult`, clears `verifiedAt` and `verifiedEvidenceId`, appends history, creates no evidence. The failed bundle remains in state and visible for correction; it is not a pending bundle.
  - Pass: in one reducer transition, status `supported`, stores the result as `lastResult`, sets `verifiedAt` to the run’s ISO timestamp, creates `ev_campus_container_verified` on `campus_cart` with `source: "verified"` and the same timestamp, sets `verification.verifiedEvidenceId` to exactly `ev_campus_container_verified`, marks `campus_cart_containerize` done if needed, and appends history. The evidence is created only if absent; the fixed-ID record is never duplicated. It never changes `applications`.
- `EDIT_SUBMISSION` only from `pending`; status `unsupported`, clears the stored bundle, `submittedAt`, `lastResult`, `verifiedAt`, and `verifiedEvidenceId`, appends history.
- `SUBMIT_ARTIFACT` from `unsupported` after a failed run replaces the stored bundle and clears `lastResult`, `verifiedAt`, and `verifiedEvidenceId`.
- `RESET` discards all of it, reseeds with `verification.status: "unsupported"` and null `bundle`, `submittedAt`, `lastResult`, `verifiedAt`, and `verifiedEvidenceId`, clears history, and selects `northstar_backend_intern` again.

There is no action that directly sets a verification or fit state. `supported` is reachable only through a passing `RUN_VERIFICATION`; `REMOVE_EVIDENCE` refuses the verified containerization record.

### Sample bundles

**Incomplete:** base image, workdir, copy, run, expose 5000; no CMD/ENTRYPOINT; run command publishes `8000:8000`.

Expected: checks 6 and 8 fail; status unsupported; fit missing; coverage 2/5.

**Complete:** same Dockerfile plus `CMD ["python", "app.py"]`; run command publishes `5000:5000`.

Expected: all 8 pass; status supported; fit supported; coverage 3/5; `ev_campus_container_verified` created and referenced by `verification.verifiedEvidenceId`.

### History summary

- Submit: “Submitted for verification; not run.”
- Fail: “6/8 checks passed; failed: Command, Port mapping.”
- Pass: “8/8 checks passed.”
- Withdraw: “Submission withdrawn.”

History stores no full artifact copy.

## Data Flow

```text
Seed / saved localStorage
        │
        ▼
WorkspaceState (single object)
        │
        ├── computeFit ───────────────► Fit rows ─────► Opportunity fit UI
        ├── generateActions ──────────► Ranked actions ─► Action plan / Today
        ├── activeApplications ───────► Pipeline / deadline / Today
        └── verification status ──────► Containerization fit / evidence
        │
        ▼
React views dispatch actions
        │
        ▼
Reducer updates WorkspaceState
        │
        ├── Render updated views
        └── Save to localStorage
```

### Where each piece lives

| Data | Origin | Stored | Updated by | On return |
|---|---|---|---|---|
| Profile | Seed, then form | Workspace state | `SAVE_PROFILE` | Reloaded from local storage |
| Practice | Seed | Workspace state | Never edited | Reloaded |
| Projects/milestones | Seed, then selects | Workspace state | `SET_MILESTONE` | Reloaded |
| Evidence | Seed, then form | Workspace state | Evidence actions | Reloaded |
| Opportunities | Seed | Workspace state | Never edited | Reloaded |
| Applications | Seed, then controls | Workspace state | Save/unsave/status actions | Reloaded |
| Verification | User input | Workspace state | Submit/edit/run | Reloaded; pending survives refresh |
| History | Generated | Workspace state | Verification transitions | Reloaded |
| Fit/coverage/actions | Calculated | Not stored | Recomputed from state | Recomputed |
| Active view/filter/modal | UI | Memory only | UI events | Resets to Today |

## File Structure

```text
BuildWithAI/
├── devpost/
│   ├── learner-profile.md      # Private learning profile; gitignored
│   ├── scope.md                # Approved scope
│   ├── prd.md                  # Approved PRD
│   └── spec.md                 # This technical spec
├── src/
│   ├── main.tsx                # React entry point
│   ├── App.tsx                 # Workspace provider + shell
│   ├── styles/
│   │   ├── tokens.css          # Palette, type stacks, spacing, motion
│   │   ├── base.css            # Reset, typography, layout primitives
│   │   └── components.css      # Cards, chips, tables, forms, dialogs
│   ├── data/
│   │   ├── seed.ts             # Seed student, practice, projects, opportunities, applications
│   │   └── copy.ts             # Disclaimer, rule, and empty-state copy
│   ├── model/
│   │   ├── types.ts            # Domain and workspace types
│   │   ├── dates.ts            # Date-only helpers and deadline urgency
│   │   ├── evidence.ts         # Evidence draft validation and completeness rules
│   │   ├── fit.ts              # computeFit + capability rules + DSA calculation
│   │   ├── actions.ts          # generateActions + ranking
│   │   ├── verification.ts     # Form validation + Dockerfile parser + 8 checks + summaries
│   │   └── state.ts            # Initial state, reducer, persistence validation
│   ├── store/
│   │   ├── WorkspaceProvider.tsx  # Context, reducer, load/save, reset
│   │   └── selectors.ts           # Today, coverage, active applications, selected opportunity
│   ├── components/
│   │   ├── AppShell.tsx
│   │   ├── TopBar.tsx
│   │   ├── SideNav.tsx
│   │   ├── SampleBadge.tsx
│   │   ├── StatusChip.tsx
│   │   ├── CoverageLine.tsx
│   │   ├── EvidenceCard.tsx
│   │   ├── EvidenceForm.tsx
│   │   ├── CheckRow.tsx
│   │   ├── ScoreBreakdown.tsx
│   │   ├── DsaCalculation.tsx
│   │   ├── ConfirmDialog.tsx
│   │   ├── EmptyState.tsx
│   │   ├── Callout.tsx
│   │   └── FieldError.tsx
│   ├── views/
│   │   ├── TodayView.tsx
│   │   ├── ProfileView.tsx
│   │   ├── ProjectsView.tsx
│   │   ├── OpportunitiesView.tsx
│   │   ├── OpportunityDetailView.tsx
│   │   └── VerificationView.tsx
│   ├── test/
│   │   ├── fit.test.ts
│   │   ├── actions.test.ts
│   │   ├── evidence.test.ts
│   │   ├── verification.test.ts
│   │   ├── state.test.ts
│   │   └── journey.test.ts
│   └── vite-env.d.ts
├── index.html
├── package.json
├── package-lock.json
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── vite.config.ts
├── README.md                   # Setup, demo path, fit/verification contract, limitations
├── LICENSE                     # Open-source license
├── .gitignore                  # node_modules, dist, learner-profile, .env*
└── .env.example                # Optional; no required variables
```

No generated files are committed except `package-lock.json`. `devpost/learner-profile.md` remains gitignored.

## External Services and Dependencies

**None at runtime.** No APIs, database service, analytics, remote fonts, images, or hosting requirement.

| Dependency | Role | Documentation | Cost/keys |
|---|---|---|---|
| React / React DOM | UI runtime | https://react.dev/ | Free, no key |
| `@vitejs/plugin-react` | Vite React transform | https://www.npmjs.com/package/@vitejs/plugin-react | Free |
| `@types/react`, `@types/react-dom` | TypeScript React types | https://www.npmjs.com/package/@types/react | Free |
| TypeScript | Types and `tsc -b` | https://www.typescriptlang.org/docs/ | Free |
| Vite | Dev server/build | https://vite.dev/guide/ | Free |
| Vitest | Unit tests | https://vitest.dev/guide/ | Free |

The Vite React-TS scaffold supplies the plugin, type packages, and matching `tsconfig` files. The build records the exact resolved versions in `package-lock.json`; the spec does not pin a version that might not match the scaffold. All dependencies are installed locally. The app makes no `fetch` calls and has no server-side component.

## Important Failure Modes

- **`localStorage` unavailable or corrupt** → seed the workspace in memory, keep the demo usable, show “Changes will be lost when this page closes.” Corrupt or structurally invalid data is replaced by the seed with a dismissible notice.
- **Malformed artifact** → inline field errors and an error summary; verification stays unsupported; fit stays missing; no history entry.
- **Malformed evidence form** → inline errors and an error summary; no dispatch, no persistence, no fit change.
- **Verified evidence removal attempted** → reducer ignores it; UI hides edit and remove for `source: "verified"`.
- **Verification requested with no pending bundle** → button disabled; no state change.
- **Opportunity missing from state** → fall back to the catalog and show “That sample opportunity is unavailable. Select another.”
- **No remaining actions** → Today and the action plan show “No further verifiable action in this prototype,” never a fake action.
- **Deadline passed** → show “Deadline passed”; keep urgency at 3; do not auto-close the application.
- **Browser origins** → `localhost`, `127.0.0.1`, and preview ports keep separate saved workspaces; document this in the README.
- **Refresh while pending** → pending state persists; **Run verification** still works. Refresh while editing a withdrawn bundle loses the local draft, as documented.
- **Clock changes between sessions** → deadlines are date-only; a changed system date can change days left but never rewrites the stored deadline.

## What Was Simplified and Why

- **Single-user local workspace** instead of accounts and a shared database — proves the connected loop without auth or backend work.
- **Six seeded opportunities** instead of live aggregation — satisfies the catalog and tracking behaviours without scraping or unstable sources.
- **Seeded practice data** instead of LeetCode/CodeChef integration — keeps the demo offline and deterministic.
- **Self-reported deployment evidence** instead of live reachability checks — honest limitation and reliable offline demo.
- **Deterministic heuristics** instead of LLM matching — explainable, testable, and free.
- **One verification gate**, containerization — demonstrates failure and pass without building five parsers.
- **Local view state** instead of routing — six surfaces do not need deep links for the demo.
- **No application status history** — current status plus last-updated time is enough for the POC.
- **No project create/delete or file upload** — seeded projects with editable evidence keep the scope bounded.

## Build and Test Plan

### Test files

`fit.test.ts`

- Northstar initial fit is 2/5.
- DSA calculation: 145 total pass, 3/6 topics fail, 6 contests pass → partial.
- API and database are supported from seed.
- Containerization is missing while unsupported and partial while pending.
- Deployment can only reach partial.
- Removing CampusCart README evidence while `ev_campus_repo` remains makes API Partial; removing both readme and repository makes API Missing.
- API capability with no linked API evidence is Missing, not Partial.
- Removing `ev_campus_schema` makes Database Missing even though CampusCart retains the database capability.
- Database capability with no schema evidence is Missing, not Partial.
- Database Partial is evidence-driven: an incomplete schema without the database capability is Partial, not Supported.
- Containerization does not change when the milestone is done.
- Table-driven: all six opportunities return one row per requirement, valid statuses, and a gap target for every non-supported row; at least one non-Northstar opportunity is supported-only and one is missing-heavy.
- Database Supported requires the capability as well as a complete schema.
- Testing treats a failing report and a missing-count report as partial.
- Documentation requires both setup and usage.
- Data pipeline requires input, transformation, and output.
- Tie-break: verified evidence wins; equal status prefers newer evidence, then project order.

`actions.test.ts`

- Initial Northstar order: containerization 7.5, deployment 3.0, DSA 3.0.
- Deployment wins the impact tie.
- After verification, deployment is first.
- Pending containerization produces “Run pending verification.”
- Complete deployment evidence removes the deployment action.
- Complete collaboration removes the collaboration action.
- Urgency boundaries at 7, 8, 21, and 22 days, including exact local midnight.
- Null deadline produces urgency 1, sorts last, and renders “No deadline.”
- Empty plan returns no actions.
- Every generated action has a real destination and the opportunity's source label is available to the card.

`evidence.test.ts`

- Each evidence kind rejects its missing required fields.
- HTTP deployment URL is rejected; HTTPS is accepted.
- Health path must start with `/`.
- Observed response must contain an accepted health token.
- Future captured date is rejected; today is accepted.
- If test counts are provided, all three are non-negative and passed is greater than zero; no counts saves a partial report.
- Dataset requires input, transformation, and output.
- A valid form dispatches exactly one action and preserves an unrelated project's evidence.

`verification.test.ts`

- Incomplete sample fails checks 6 and 8 only.
- Complete sample passes all eight.
- `latest` base image fails; digest passes.
- Missing WORKDIR/COPY/RUN/EXPOSE fails the matching check.
- Invalid and out-of-range ports fail.
- Missing README build/run fails check 7.
- Port mapping accepts `-p 5000:5000`, `-p=5000:5000`, `-p5000:5000`, `127.0.0.1:5000:5000`, and `--publish=5000:5000`; a port range fails closed.
- Commented-out instructions do not satisfy checks; continuation lines do.
- Oversized or empty fields fail form validation.

`state.test.ts`

- Submit → pending; run fail → unsupported; run pass → supported.
- Pass sets `verification.verifiedEvidenceId` to exactly `ev_campus_container_verified`, sets `verification.verifiedAt` to the run’s ISO timestamp, creates the evidence with `kind: "containerization"`, `source: "verified"`, `projectId: "campus_cart"`, and the same timestamp, marks milestone done, and appends history.
- Fail adds no evidence, does not change coverage, and clears `verifiedAt` and `verifiedEvidenceId`.
- `EDIT_SUBMISSION` returns to unsupported and clears the stored bundle, `submittedAt`, `lastResult`, `verifiedAt`, and `verifiedEvidenceId`.
- Reset clears the verification bundle, `submittedAt`, `lastResult`, `verifiedAt`, and `verifiedEvidenceId`, and returns the exact seeded 2/5.
- Application status is unchanged by any verification action.
- Removing verified evidence is refused.
- Load/save round-trip with a mock `localStorage`, including a passed state: serialize the passed workspace, run `validateWorkspace` on the parsed object without reseeding, load it through the persistence adapter, and assert `status: "supported"`, the exact verified evidence reference, the evidence record, and 3/5 survive.
- A supported state with a null, missing, mismatched, non-containerization, non-verified, or wrong-project `verifiedEvidenceId` is rejected and reseeds. A non-supported state that retains `verifiedEvidenceId` or `verifiedAt` is also rejected.
- Corrupt JSON, a dangling evidence project reference, and a wrong schema version all reseed.
- No reducer action writes a fit status directly.

`journey.test.ts`

- Use a fixed `today` of `2026-10-26`; call `buildSeed(today)` and pass the same date to every fit and action call. Do not read the system clock.
- Seed → Northstar 2/5, containerization first, exactly 7 days left.
- Mark milestone done → still 2/5 and containerization still missing.
- Submit incomplete → pending and partial; run → 6/8, unsupported, missing, still 2/5.
- Submit complete → run → 8/8, supported, 3/5, verified evidence present, `verifiedEvidenceId` set to exactly `ev_campus_container_verified`, milestone done.
- After the pass, serialize and reload the workspace through the persistence adapter; the supported state, verified evidence reference, 3/5 fit, and no-reseed outcome survive.
- Actions after pass → deployment first, DSA second; no containerization action.
- Set Northstar Applied → status persists after a state round-trip; verification and fit unchanged.
- Reset → 2/5 and the original seed statuses.

`buildSeed(today)` accepts an injected local date; production calls it with `useToday()`, tests call it with the fixed date. `seedTimestamp` derives evidence timestamps from that same `seededAt`.

### Manual acceptance walkthrough

1. Reset sample; confirm **2 of 5**, three active applications, Northstar 7 days, containerization first.
2. Open DSA calculation; confirm 145 / 3 of 6 / 6 and the visible rule outcome.
3. Mark containerization milestone done; confirm fit still missing and coverage 2/5.
4. Submit an invalid artifact with an empty README field; confirm inline errors and no pending state.
5. Submit incomplete bundle; confirm Pending and Partial, coverage still 2/5.
6. Run; confirm checks 6 and 8 fail and history records it.
7. Submit complete bundle; run; confirm 8/8, Supported, 3 of 5.
8. Confirm CampusCart has a Verified evidence card, it cannot be edited or removed, and the milestone is done.
9. Confirm Today next action is “Log deployment evidence” and fit is 3/5.
10. Change Northstar to Applied; confirm the status and last-updated time stay after refresh and no verification action changed them.
11. Add complete deployment evidence; confirm Partial at best and the live-check disclaimer. Add an `http://` URL first and confirm it is rejected.
12. Refresh; confirm persisted state, including the passed state’s verified evidence reference and 3/5 fit, plus pending/edit withdrawal behavior.
13. Reset; confirm seed, fresh deadlines, cleared verification references, and 2/5.
14. Repeat steps 1–9 at 125% zoom and keyboard only; confirm focus order, visible focus, text-plus-colour status, and no clipped primary controls.
15. Repeat the catalog filter and today layout at 640px width; confirm the empty-state **Clear filter** action works.

## Scope Freeze

Product scope freezes when this spec is approved. Build work after that is limited to making the approved behaviours correct, reliable, accessible, and demonstrable. New surfaces, data sources, verification gates, or integrations require reopening the spec.

Cut order if time is short:

1. Profile editing — keep the seeded profile read-only.
2. Secondary project editing — keep StudySync/RouteWise evidence read-only.
3. Category filter and secondary action destinations.
4. Visual polish outside the demo path.

Never cut: the connected Northstar path, deterministic failure/pass checks, persistence, reset, synthetic labels, visible heuristic calculations, manual application status, and competence disclaimers.

## Decisions and Open Issues

### Learner-approved product decisions

- Student Career OS title, sample content, six opportunities, career-field-notebook direction.
- Manual application status independent of verification.
- Deployment and collaboration Partial at best.
- Scope freeze after spec approval and the cut order above.
- Visible DSA calculation, action arithmetic, labels, and disclaimers.

### Proposed technical decisions — approval requested

- **React + TypeScript + Vite.** Reason: component structure and typed state for six surfaces; tradeoff: a build step and React concepts for a small app.
- **One reducer + context + pure selectors.** Reason: one source of truth and deterministic derived data; tradeoff: more discipline than scattered local state.
- **Hand-written CSS tokens, no UI library.** Reason: the field-notebook identity and no generic dashboard look; tradeoff: more styling work.
- **`localStorage` only.** Reason: single-user offline demo; tradeoff: no accounts or sync.
- **Vitest unit tests plus a manual walkthrough.** Reason: fast feedback on the kernel; tradeoff: no automated browser test in the MVP.
- **No router.** Reason: no deep links needed; tradeoff: browser back does not switch views.

### One useful unknown

The learner wants to understand how one workspace can drive the fit, action plan, Today, and verification without contradictory copies of the truth. This spec resolves it with one reducer state plus pure selectors; during the build, the evidence will be a failing-then-passing verification test that changes coverage and the action plan from the same run.

### Resolved from the PRD

- Title, sample data, visual direction, fit thresholds, ranking formula, deployment/collaboration limits, application-status independence, and scope freeze are settled.
- **Fit-rule reconciliation:** API and Database now return **Missing** when no matching evidence exists; a capability tag alone never produces Partial. Database Partial is evidence-driven, and the existing incomplete-schema (including table count 1) behavior is retained. No other thresholds, impacts, efforts, or ranking values change.
- No blocking product questions remain.

### Open technical items to verify early in the build

- Confirm the current Vite React-TS scaffold, Node compatibility, and exact dependency versions before adding application code.
- Confirm the `package.json` scripts above run in this environment, especially `vitest run` exiting cleanly.
- Confirm `localStorage` works in the demo browser profile and document `localhost`, `127.0.0.1`, and preview origins.
- Verify the palette pairings, 125% zoom path, keyboard path, and a narrow-width filter reset before recording.
- Verify the Dockerfile parser against the incomplete and complete samples before wiring the reducer.
