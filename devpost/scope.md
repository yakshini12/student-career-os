---
doc: scope
status: approved
---

# Student Career OS

A connected student career workspace that links practice, projects, evidence, sample opportunities, and deadlines into one explainable next-action loop.

## The Problem

Students preparing for internships manage practice, projects, and opportunities across disconnected tools, so they cannot tell which opportunity is worth pursuing or which concrete action will make their existing work credible for it.

## Feasibility Assessment

About **25 hours remain** at the time of this revision (01:22 IST, Oct 26; deadline 02:30 IST, Oct 27).

- The **full long-term vision is not feasible** in this window: live opportunity aggregation, platform integrations, accounts, a complete DSA tracker, and a full application CRM are multi-week work.
- The **proposed eight-boundary MVP is feasible only as one connected spine** with synthetic data, deterministic logic, and no live integrations. It is not feasible if every module receives equal depth.
- The existing ProofGraph verification contract, CampusCart sample project, and deterministic check design are reusable. The project does not need to restart.
- The scope therefore prioritizes **one end-to-end journey** over breadth. Modules exist to support that journey, not as separate dashboard pages.
- The current `prd.md` is stale after this direction change. It remains on disk as reference, but it is not approved and will be rewritten only after this scope is approved.

## Prototype vs. Full Vision

The **prototype** is a single-user, local, synthetic demonstration. It does not discover live opportunities, verify external sources, integrate coding platforms, or prove hiring outcomes.

The **full vision** includes verified opportunity sources, platform integrations, accounts, a complete practice tracker, and a cumulative evidence graph across many roles.

Every surface must make the distinction visible. Synthetic opportunities are labelled **Sample — not live** and must never display a verified badge. The prototype demonstrates the connected loop and the verification gate; it does not claim the full product's data coverage.

## The Unique Kernel

**The connected evidence loop:** an opportunity requirement leads to the student's actual evidence, then to a prioritized next action, then through a verification gate, and back to an updated opportunity fit.

The verification-gated evidence mechanism remains the differentiating feature, but it now operates inside a broader career workspace. A task checkbox never changes evidence; a submitted artifact must pass explicit checks.

The product is the loop, not the dashboard.

## Differentiation and Unverified Claims

**Verified existing landscape:**
- **Opportunities and applications:** LinkedIn, Handshake, Unstop, campus placement portals.
- **Coding practice:** LeetCode, CodeChef, Codeforces.
- **Projects and portfolios:** GitHub, personal portfolio sites.
- **Résumé matching:** Jobscan, Teal, Careerflow.
- **Evidence/skill graphs:** ArcProof, Hirevoo, Regain, Job Resiliens.
- **Manual tracking:** Notion, spreadsheets.
- **AI career guidance:** generic roadmaps and career chatbots.

Each category covers a slice. The hypothesis is that a single product connecting **opportunity requirement → project evidence → prioritized action → verification → updated fit** is not a mainstream experience.

**Verified:** the component features are common. **Unverified:** whether the connected loop with a verification gate is a meaningful differentiator in practice, and whether any competitor already closes the same loop.

## Who It's For

A final-year B.Tech CSE student preparing for internships or campus placements. They are solving DSA problems, maintaining a few projects, saving opportunities, and tracking deadlines in separate places. They have a target role and limited time, and they need to know which opportunity is worth pursuing and what to do next.

## The End-to-End Journey

1. **Today:** The student opens a synthetic workspace for **Aarav Mehta**, targeting a **Backend Engineering Intern** role. They see a practice snapshot, three active opportunities, upcoming deadlines, and one recommended next action.
2. **Profile & Practice:** They review seeded coding progress by topic and contest, and edit their name, target role, and target timeline.
3. **Projects & Evidence:** They review three projects. Each shows technologies, milestones, evidence links, and which capabilities it currently supports.
4. **Opportunities:** They browse a clearly labelled **sample catalog** covering five categories: internship, apprenticeship, fellowship, job, and hackathon. They save **Backend Engineering Intern — Northstar Labs**.
5. **Opportunity detail:** They see the role requirements, deadline, application status, and a **Sample opportunity — not live** label. They choose **Assess my fit**.
6. **Fit map:** Five requirements are mapped to their evidence as **supported**, **partial**, or **missing**, each with a plain-language reason and links to the supporting project or the gap.
7. **Action plan:** Three actions are ranked deterministically by impact, effort, and deadline urgency. The primary action is **Containerize CampusCart** because the role requires deployment evidence and the project has none.
8. **Project upgrade:** The student opens the upgrade, checks the task off — the requirement remains **unsupported**. They submit an incomplete artifact bundle, run verification, and see a specific failure. They submit a complete bundle, run verification, and the requirement becomes **supported**.
9. **Return to the opportunity:** The fit map now shows the containerization requirement as supported; coverage increases; the application status can move from **Preparing** to **Applied**; the deadline remains visible on Today. The next action updates.
10. **Persistence:** Refresh preserves the workspace. **Reset sample** restores the synthetic seed and recomputes the initial state.

## Modules

The product has one shared data model, five workspace surfaces, and one verification surface.

### 1. Today

A career snapshot, not a chart wall: profile summary, target role, practice snapshot, active applications, nearest deadline, and the single highest-priority next action. This is the entry point to the spine.

### 2. Profile & Practice

Editable name, target role, and target timeline. Seeded coding progress shows solved counts by topic, recent activity, and contest participation. The MVP does not edit individual problems or sync platforms.

### 3. Projects & Evidence

A small portfolio of three seeded projects. Each project shows technologies, milestones, evidence links, and capability tags. The student can edit milestone status and evidence links. One project, **CampusCart**, supports the verification upgrade.

### 4. Opportunities & Applications

A sample catalog of six opportunities across five categories, clearly labelled as synthetic. The student can filter by category, save or unsave an opportunity, set an application status, and see deadlines. Statuses are: **Saved**, **Preparing**, **Applied**, **Interviewing**, **Closed**.

Every catalog record carries a source type and a source label. In this prototype, every record is **Sample — not live**. The catalog is structured so a future verified external source can be added as another source type without changing the saving, tracking, or fit flows. No scraping, live feed, or external integration is implemented now, and the prototype never displays a verified badge.

### 5. Opportunity Fit & Action Plan

Selecting an opportunity produces a deterministic fit map: each requirement is supported, partial, or missing, with evidence links and a reason. The action plan ranks up to three next actions by impact, effort, and urgency. Every recommendation is traceable to a requirement and an evidence gap.

### 6. Verification

One working verification-gated upgrade: containerizing CampusCart. It is reachable from the fit map and from the project. It has artifact submission, pending verification, deterministic checks, pass/fail results, and a minimal history.

## The Connected Spine

All surfaces read and write one local workspace state:

- The **opportunity fit** reads project evidence and the student's practice profile.
- The **action plan** reads fit gaps and opportunity deadlines.
- The **verification** writes a new evidence record to the selected project.
- The **updated project evidence** changes the opportunity fit.
- The **fit change** updates the next action and the Today snapshot.
- The **application status** and deadline appear on Today.

No module is a dead end. Every visible button either changes persisted state or opens a real surface. There are no alert-only buttons, placeholder links, or mock controls that pretend to work.

## What "Working" Looks Like

A judge can follow one continuous story in about two minutes:

**Today → Northstar opportunity → fit map → “Containerize CampusCart” → incomplete artifact fails → complete artifact passes → fit updates → application status changes → Today reflects the new evidence.**

The “oh, that’s cool” beat: verification changes the **opportunity fit**, not just a project badge. The student can see why the next action matters and what evidence will prove it.

## Verification Model (one upgrade)

**Upgrade:** containerize the existing CampusCart API.

**Artifact fields:** Dockerfile text and README build/run commands.

**Checks:**
- `FROM` with a non-empty image tag; `latest` fails.
- `WORKDIR`, `COPY`, `RUN`, `EXPOSE`, and `CMD` or `ENTRYPOINT` present.
- `EXPOSE` port is valid.
- README contains `docker build` and `docker run`.
- The published container port in the run command matches the exposed port.

**States:** unsupported, pending verification, supported.

**Rules:**
- A task checkbox never changes the requirement state.
- A well-formed bundle moves the requirement to **pending**; only a verification run can move it to **supported** or back to **unsupported**.
- The verification engine reads the submitted contents. There is no direct status setter and no hard-coded demo outcome.
- Seed evidence is evaluated by the same engine on first load.
- **Cannot establish:** that the image builds, the container runs, the API responds, or the image is secure or reproducible elsewhere.

**History:** timestamp, requirement, previous state, new state, and check results. No second copy of the full artifact.

## Acceptance Criteria

- [ ] **Profile:** the student can edit name, target role, and target timeline; changes persist after refresh; seeded practice data remains visible and is labelled synthetic.
- [ ] **Projects:** three projects are visible with technologies, milestones, and evidence links; milestone status and evidence links can be edited and persist.
- [ ] **Catalog:** six sample opportunities cover internship, apprenticeship, fellowship, job, and hackathon; every card and detail carries a **Sample — not live** label.
- [ ] **Tracking:** saving/unsaving and changing application status persist; a deadline is visible on the opportunity and on Today.
- [ ] **Fit:** selecting an opportunity shows five requirements with supported/partial/missing states, a plain-language reason, and a link to the supporting project or gap.
- [ ] **Recommendation:** up to three actions are ranked deterministically; the primary action names the requirement, the evidence gap, the artifact it will produce, and why it is prioritized.
- [ ] **Verification gate:** checking the task off does not change the requirement; an incomplete bundle fails with specific reasons; a complete bundle passes; coverage changes only after a pass.
- [ ] **Connected update:** after verification, the opportunity fit and Today next action update without a manual refresh.
- [ ] **No fake state:** no button changes state without persisted data behind it; no sample opportunity is described as live or verified.
- [ ] **Persistence:** refresh preserves the workspace; Reset sample restores the seed and recomputes initial states.
- [ ] **Clarity:** every success state states that artifact completeness is not competence.
- [ ] **Responsive:** the workspace is usable at desktop width and stacks cleanly at mobile width; keyboard focus and contrast are adequate for the demo.

## The POC Boundary

**In:**
- One synthetic student, one target role, three projects, six sample opportunities across five categories.
- A source-tagged catalog where every current record is labelled sample, with a forward-compatible place for future verified sources.
- Editable profile fields and editable project milestone/evidence links.
- Save/unsave and five application statuses.
- Deterministic fit mapping for a selected opportunity.
- A ranked action plan with one primary action.
- One verification-gated upgrade: containerization.
- One local workspace store, minimal verification history, reset.
- A coherent single-shell interface with responsive stacking.
- Visible sample labels and competence disclaimers.

**Not in the claim:** evidence coverage, sample opportunities, and passing checks do not establish competence, hiring likelihood, or real opportunity availability.

## Later

- Live opportunity aggregation and verified sources.
- LeetCode/CodeChef/Codeforces and GitHub integrations.
- Full DSA topic and contest tracking.
- Multiple opportunity fits and a cumulative evidence graph.
- AI-assisted planning, with deterministic verification unchanged.
- Résumé and proof-dossier export.
- Notifications, calendar sync, and deadline reminders.
- Accounts, backend, multi-device sync, and sharing.
- Additional verification upgrades beyond containerization.

## Explicitly Cut

- Live job scraping, aggregation, or external opportunity APIs.
- Claiming sample opportunities are live, verified, or currently open.
- Platform integrations and automatic profile imports.
- Accounts, authentication, multi-user support, backend database, cloud sync.
- Full DSA tracker, problem-level editing, contest sync, or rating prediction.
- Full project CRUD: add/delete projects and file uploads are out; seeded projects are editable only at milestone and evidence-link level.
- Résumé builder, cover-letter generator, employer view, hiring prediction, or candidate ranking.
- LLM-based matching, LLM verification, or paid APIs.
- Chat assistant, notifications, calendar sync, email, mobile app, analytics, or deployment.
- Multiple verification upgrades; only containerization is gated.
- Advanced charts, animations, or decorative graph visualisations that do not communicate evidence.

## Novelty Hypothesis and Limitations

**Hypothesis:** a single workspace that connects an opportunity requirement to existing project evidence, a prioritized next action, and a verification gate is meaningfully different from a job board, a coding tracker, a portfolio, or a résumé matcher used separately.

**Limitations:**
- The catalog is synthetic and small; opportunity discovery is not validated.
- Fit mapping uses explicit heuristics, not employer judgment.
- Verification checks artifact contents, not runtime truth or code quality.
- A student could assemble a passing bundle without deep work.
- The category is crowded; the connected loop is unverified as a differentiator.
- The MVP does not prove retention, learning outcomes, or hiring impact.

**What would falsify the hypothesis:** users ignore the fit map and only use the catalog; the verification gate feels like box-ticking; competitors already close the same loop; or the connected state is too fragile to trust.

## Implementation Risks

1. **Scope creep across eight boundaries.** Mitigation: build the connected spine first; use the priority tiers below; no module gets equal depth.
2. **Disconnected dashboard pages.** Mitigation: one shared state, one end-to-end acceptance test, and a visible data-flow path.
3. **Fake buttons or mock state.** Mitigation: every control changes persisted state or opens a real surface; remove anything else.
4. **Weak or fake verification.** Mitigation: checks inspect submitted contents; include a real failure case; no direct status setter.
5. **Data-model coupling.** Mitigation: define the shared types and state transitions before UI work; keep one store.
6. **Time.** Mitigation: synthetic data, no integrations, no backend, no LLM; freeze features after P1.
7. **UI polish versus feature count.** Mitigation: one shell, one component vocabulary, one accent system; polish the demo path before secondary screens.
8. **Local-storage state bugs.** Mitigation: versioned seed, reset path, and a small state test suite.
9. **Demo complexity.** Mitigation: one rehearsed path; no live network; sample bundles preloaded.
10. **Overclaiming.** Mitigation: persistent sample labels, evidence-coverage language, and explicit limitations.

## Prioritization If Time Runs Short

**P0 — the connected MVP (must ship):**
- Single shell and shared local state.
- Seeded student, practice snapshot, three projects, six opportunities across five categories.
- Today, Opportunities, Opportunity Fit, and one verification upgrade.
- Save/application status and deadline display.
- Deterministic fit map and one primary recommendation.
- Verification gate with fail and pass, plus connected fit update.
- Sample labels, competence disclaimers, persistence, reset.

**P1 — complete the requested experience:**
- Editable profile.
- Editable project milestones/evidence links.
- Minimal verification history.
- Responsive polish and accessibility pass.
- Category filter.

**P2 — only if P0 and P1 are stable:**
- Additional opportunity fits.
- Extra verification checks.
- Richer practice visuals.
- Animations and transitions.
- Multiple action-plan views.

**Cut first if time is short:** profile editing, project editing, history, filters, practice charts, animations. Keep the verification gate, the connected update, sample labels, persistence, and one end-to-end path.

## Why This Matters to the Learner

This is a real plan-first exercise in scope control: the long-term vision is broad, and the MVP must still demonstrate one connected loop. The learner will practice reviewing deterministic state logic, verifying that the interface is not faking progress, and explaining what the product does and does not prove.

## Inspiration and Identity

The prior evidence-ledger direction remains useful for the verification surface: calm, precise, receipt-like. The broader workspace should feel like a **career field notebook**, not a corporate dashboard: paper-like surfaces, clear typography, restrained status colors, and evidence cards that look inspectable. The visual direction is approved in `prd.md`.

## Resolved by the PRD

1. The five opportunity categories and six sample opportunities are approved.
2. The profile fields and seeded practice data are approved.
3. CampusCart, StudySync, and RouteWise are approved; CampusCart supports verification.
4. The fit-mapping rules, visible DSA calculation, and impact × urgency ÷ effort ranking are approved.
5. The five manual application statuses are approved; only current status and last-updated time are shown.
6. The career field notebook direction and desktop-first responsive polish are approved.
7. The stale `prd.md` was rewritten from scratch for Student Career OS.
