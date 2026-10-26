---
doc: prd
status: approved
---

# Student Career OS — Product Requirements

A connected student career workspace that links practice, projects, evidence, sample opportunities, and deadlines into one explainable next-action loop.

Source: `scope.md > The Unique Kernel`, `scope.md > The End-to-End Journey`, `scope.md > The Connected Spine`, `scope.md > Verification Model`, `scope.md > The POC Boundary`.

## Prototype Boundary

The **prototype** is a single-user, local, synthetic demonstration. It does not discover live opportunities, verify external sources, integrate coding platforms, or prove hiring outcomes.

The **full vision** includes verified opportunity sources, platform integrations, accounts, a complete practice tracker, and a cumulative evidence graph across many roles.

Every surface must show the difference. All six opportunities are labelled **Sample — not live**. No sample opportunity carries a verified badge. The prototype demonstrates the connected loop and the verification gate; it does not claim the full product's data coverage.

## The Core Journey

1. The app opens on **Today** for a synthetic student, **Aarav Mehta**, a final-year B.Tech CSE student targeting **Backend Engineering Intern** roles.
2. Today shows the profile summary, a practice snapshot, three active opportunities, the nearest deadline, and one recommended next action. A persistent banner says the workspace is synthetic.
3. The student opens **Opportunities** and browses six source-labelled records across internship, apprenticeship, fellowship, job, and hackathon categories.
4. They open **Backend Engineering Intern — Northstar Labs**, labelled **Sample — not live**, with a deadline in 7 days.
5. They choose **Assess my fit**. Five requirements appear with **Supported**, **Partial**, or **Missing** states, a plain-language reason, and a link to the evidence or gap. The initial coverage is **2 of 5 supported**.
6. They open the action plan. The top action is **Containerize CampusCart**, ranked by a visible formula because it is high impact, low effort, and due soon. The action explains that CampusCart has no containerization evidence.
7. They open the verification workspace. The project milestone **Containerize API** is not started. They click **Mark milestone done**. The verification state remains **Unsupported**, the fit remains **Missing**, and the coverage does not change. The app says: “Milestone completion is not evidence.”
8. They load an incomplete sample artifact bundle and submit it. The verification state moves to **Pending verification**; the fit shows **Partial**. They click **Run verification**.
9. Two checks fail: the Dockerfile has no `CMD` or `ENTRYPOINT`, and the published port does not match `EXPOSE`. The verification state returns to **Unsupported**, the fit returns to **Missing**, coverage stays at **2 of 5**, and the verification history records the attempt.
10. They load the complete sample bundle, submit it, and run verification. Every check passes. The verification state becomes **Supported**; CampusCart gains a verified containerization evidence record; the fit becomes **Supported**, and coverage becomes **3 of 5**.
11. The Northstar fit and Today update without a refresh. The next action becomes **Log deployment evidence**, with a clear note that the prototype can record deployment evidence but cannot verify live reachability.
12. The student can manually move the Northstar application from **Preparing** to **Applied**. Verification never changes the application status automatically. The deadline and status remain visible on Today.
13. Refresh preserves the workspace. **Reset sample** asks for confirmation, restores the synthetic seed, and recomputes the initial **2 of 5**.

Success is one connected story: **opportunity → evidence gap → prioritized action → failed artifact → passing artifact → updated fit → updated Today.**

## Screens and Layout

One application shell, not a suite of disconnected dashboards.

- **Top bar:** Student Career OS wordmark, synthetic-sample badge, student name, target role, **Reset sample**.
- **Left navigation:** Today, Profile & Practice, Projects, Opportunities.
- **Main area:** The selected surface. Opportunity detail and the verification workspace open within the shell, not in a separate product.
- **Persistent footer or banner:** “Synthetic sample. Evidence coverage is not a competence score.”
- **No dead controls:** Every button changes persisted state or opens a real surface. There is no alert-only button, no “coming soon” control, and no fake apply action.

### Today

A career snapshot, not a chart wall:

- Greeting and editable target-role summary.
- **Practice snapshot:** total solved, core-topic coverage, contests, activity in the last 14 days. Labelled sample data.
- **Application pipeline:** counts for Saved, Preparing, Applied, and Interviewing, plus the nearest deadline.
- **Next best action:** one primary recommendation with the requirement, evidence gap, expected artifact, reason for its rank, and a single button that opens the right surface.
- **Evidence fit snapshot:** for the active opportunity, supported requirements out of total, with a link to the fit.
- **Sample notice:** “This workspace uses synthetic student, project, and opportunity data.”

### Profile & Practice

- Editable name, target role, and target timeline.
- Seeded practice snapshot by topic, recent activity, and contests.
- Clear label: “Practice data is seeded for this demo. Platform sync is not connected.”
- A save action with inline validation and a saved confirmation.
- The target role and timeline appear on Today and in the top bar after saving.

### Projects & Evidence

- Three project cards: **CampusCart**, **StudySync**, and **RouteWise**.
- Each card shows technologies, capability tags, milestone status, and evidence items.
- Milestones use **Not started**, **In progress**, and **Done**.
- Evidence items show a type, label, location or note, and source state: **Linked** or **Verified**. Only the containerization gate can create a **Verified** record.
- The student can edit milestone status and add, edit, or remove evidence links. Adding evidence updates the fit deterministically.
- No project creation, deletion, or file upload in the prototype.
- CampusCart is the project used by the verification upgrade.

### Opportunities & Applications

- Six sample opportunities across five categories.
- Category filter: All, Internship, Apprenticeship, Fellowship, Job, Hackathon.
- Each card shows title, organisation, category, location or format, deadline, application status, and **Sample — not live**.
- Save or unsave an opportunity. Changing status from the detail view saves it automatically.
- Statuses: **Saved**, **Preparing**, **Applied**, **Interviewing**, **Closed**.
- No external “Apply” button, because the opportunities are not live. The product tracks the student's own application state.
- A selected opportunity shows its source label, deadline, status, requirements, and an **Assess my fit** action.

### Opportunity Fit & Action Plan

- Requirement rows with **Supported**, **Partial**, or **Missing**, a reason, and a link to the supporting project, practice area, or gap.
- A coverage line: supported requirements out of total. Partial and missing are never counted.
- The line is labelled **Evidence fit**, never “readiness,” “match score,” or “hire probability.”
- A note: “Fit is based on the evidence recorded here. It is not an employer assessment.”
- **Action plan:** up to three actions, each showing the requirement, target project, expected artifact, impact, effort, urgency, rank formula, and limitation.
- Every action opens a real surface: the verification workspace for containerization, the project evidence editor for project evidence, or Profile & Practice for DSA.

### Verification Workspace

- A focused panel or page for **Containerize CampusCart**.
- Shows the requirement, the current state, the exact artifact fields, the checks that will run, and what the checks cannot establish.
- Shows the project milestone with **Mark milestone done**.
- Artifact form with **Dockerfile** and **README build/run commands**.
- **Load incomplete sample**, **Load complete sample**, **Submit artifact**, and **Run verification**.
- Pending bundles lock the form. **Edit submission** discards the pending bundle, returns the verification state to **Unsupported**, and returns the fit to **Missing**; it does not silently keep pending status.
- Results show every check as pass or fail, the inspected value, and a plain-language reason.
- A minimal history list: timestamp, previous state, new state, and check summary. It does not store a second copy of the artifact.

### Responsive Behavior

- Desktop: left navigation, two-column opportunity detail, and a wide fit table.
- Tablet: navigation becomes a compact rail and columns narrow.
- Mobile: navigation becomes a top menu; cards and tables stack. Status labels remain text, not colour alone.
- The demo is recorded at desktop width. Text remains readable at 125% zoom.
- Keyboard focus is visible; controls have accessible names; contrast meets a practical demo standard.

## Look and Feel

**Proposed direction — approval requested.**

A **career field notebook**, not a corporate dashboard:

- Warm off-white paper, ink-dark text, and one restrained accent.
- Status colours: slate for missing, amber for partial or pending, green for supported, rust for failed checks.
- A serif or humanist display face for headings, a clean sans for body text, and a monospace face for evidence IDs, check names, file names, and timestamps.
- Ruled lines, aligned columns, numbered checks, and receipt-like evidence cards.
- Generous spacing, but dense enough that the connected state is visible on one screen.
- No purple gradients, floating blobs, mascots, or “AI magic” imagery.
- Copy is factual: “No acceptable evidence yet,” “Submitted; not yet verified,” “Supported by a recorded artifact.”
- References: a field notebook for the overall surface, a receipt for evidence cards, and GitHub’s checks UI for check rows.

The career field notebook visual direction is approved for the prototype.

## Sample Content

### Student and practice

- **Student:** Aarav Mehta, final-year B.Tech CSE (AI & ML).
- **Target role:** Backend Engineering Intern.
- **Target timeline:** Next 6 months.
- **Practice:** 145 problems solved, including 124 across six core DSA topics and 21 SQL problems; 6 contests; best rank 812; current rating 1543; 12 submissions in the last 14 days.
- **Core topic counts:** Arrays 48, Strings 31, Trees 22, Linked lists 9, Graphs 8, DP 6.
- **Purpose of the practice seed:** it shows a real pattern — strong volume, uneven topic depth — rather than a perfect profile.

### Projects

| Project | Technologies | Capabilities | Seeded evidence | Gap |
|---|---|---|---|---|
| **CampusCart** | Python, Flask, SQLite, REST | API, database, documentation, testing in progress | Repository link, README endpoint table with 6 routes, schema file with 4 tables and a foreign key, test note without a captured report | No containerization evidence, no deployment evidence |
| **StudySync** | JavaScript, React, Firebase | Documentation, collaboration | Repository link, README, contribution note | No backend API, database, container, or deployment evidence |
| **RouteWise** | Python, pandas, CSV | Data pipeline, testing, documentation | Repository link, README, passing test report, sample dataset description | No API, container, or deployment evidence |

Projects are seeded and editable only at milestone and evidence level.

### Sample opportunity catalog

All six records are synthetic. Deadlines are seeded as offsets from first load so the sample stays realistic; they persist after creation and are regenerated by **Reset sample**.

| # | Opportunity | Organisation | Category | Deadline | Requirements |
|---|---|---|---|---|---|
| 1 | **Backend Engineering Intern** | Northstar Labs | Internship | 7 days | API, database, DSA, containerization, deployment |
| 2 | **Data Engineering Apprentice** | Meridian Data | Apprenticeship | 12 days | Data pipeline, database, testing, documentation |
| 3 | **Open Source Backend Fellow** | Commons Labs | Fellowship | 21 days | API, documentation, testing, collaboration |
| 4 | **Junior Software Engineer** | Blue Harbor Systems | Job | 30 days | API, database, containerization, deployment, testing |
| 5 | **CampusBuild Hackathon** | Orbit Collective | Hackathon | 35 days | API, documentation, collaboration, deployment |
| 6 | **Platform Engineering Intern** | Hearthstone Cloud | Internship | 28 days | API, containerization, testing, documentation |

### Seeded application state

- **Northstar Labs** — Preparing.
- **CampusBuild Hackathon** — Saved.
- **Blue Harbor Systems** — Saved.
- Meridian Data, Commons Labs, and Hearthstone Cloud are untracked until saved.

“Active applications” on Today means Saved, Preparing, Applied, or Interviewing. On first load, that is three.

### Northstar fit on first load

The fit is computed from the seed data by the rules below, not hard-coded.

| Requirement | Capability | Initial state | Reason |
|---|---|---|---|
| REST API implementation | API | **Supported** | CampusCart has a README route table with 6 endpoints. Linked evidence, not independently verified. |
| Relational database modeling | Database | **Supported** | CampusCart has a schema with 4 tables, primary keys, and a foreign key. Linked evidence, not independently verified. |
| DSA fundamentals | DSA | **Partial** | 145 solved and 6 contests, but only 3 of 6 core topics have 10+ solves. The role's sample threshold is 4. |
| Containerization | Containerization | **Missing** | No submitted containerization artifact has passed the verification gate. |
| Deployment evidence | Deployment | **Missing** | No deployment evidence is recorded. |

**Coverage: 2 of 5 supported. One partial. Two missing.**

#### DSA threshold calculation, visible in the interface

The fit displays the same arithmetic a judge can check by hand:

| Threshold | Required | Recorded | Result |
|---|---:|---:|---|
| Total problems solved | 120+ | 145 | **Pass** |
| Core topics with 10+ solves | 4 of 6 | 3 of 6 | **Fail** |
| Contest participation | 3+ | 6 | **Pass** |

- **Core-topic evidence:** Arrays 48, Strings 31, Trees 22, Linked lists 9, Graphs 8, DP 6.
- **Topics at 10+:** Arrays, Strings, and Trees only. Linked lists (9), Graphs (8), and DP (6) are below the threshold.
- **Total solved:** 124 core DSA problems plus 21 SQL problems = **145**. SQL counts toward total volume but not toward the six core DSA topics.
- **Rule outcome:** two of three thresholds pass. Because at least one threshold passes but not all three, the DSA requirement is **Partial**.
- **Would become Supported if:** Linked lists, Graphs, or DP reached 10 solves, giving 4 of 6 topics. No prototype action edits practice data; the calculation is shown to explain the seed, not to offer a fake practice editor.

This is a sample heuristic, not an employer requirement.

Containerization's separate verification state is **Unsupported** on first load. After a passing verification it becomes **Supported**, and the fit row becomes **Supported**.

After the containerization artifact passes, coverage becomes **3 of 5**. DSA remains partial and deployment remains missing.

## Features and Behavior

### Catalog source model

Every opportunity carries a source type and a visible source label. In this prototype, every record has the type **Sample** and the label **Sample — not live**.

The catalog is a list of source-tagged records, not a set of hard-wired cards. A future verified external source can be added as another source type without changing saving, tracking, fit, or action-plan behavior. The prototype does not implement scraping, live feeds, external APIs, or source verification.

Rules:

- No sample record may display “verified,” “live,” “open,” or an employer badge.
- The source label appears on the card, the detail view, and any action-plan reference.
- A future source type may change the label and source metadata, but it may not bypass the verification gate for gated evidence.
- No “Apply now” button is shown for sample records.

### Today

- Shows the student's name, target role, and timeline from the saved profile.
- Shows practice totals and activity with a sample-data label.
- Shows active applications and the nearest deadline, including an overdue warning when applicable.
- Shows the current opportunity fit for the most recently selected opportunity. On first load, that is Northstar.
- Shows one primary next action. The action is the top-ranked unresolved action for the selected opportunity.
- The primary action button opens the verification workspace, the project evidence editor, or Profile & Practice, depending on the action.
- If there is no unresolved action, Today says so plainly instead of inventing one.

### Profile & Practice

- Name is required, 2–60 characters.
- Target role is required, 2–80 characters.
- Target timeline is required and selected from **Next 3 months**, **Next 6 months**, or **Next 12 months**.
- **Save profile** validates inline, persists the values, and shows a saved confirmation.
- Cancelling an edit restores the last saved values.
- Practice data is read-only and labelled seeded.
- The practice snapshot shows total solved, per-topic counts, contests, rating, best rank, and recent activity.
- It does not claim to be synced from LeetCode, CodeChef, or Codeforces.
- The target role is a workspace preference and header value. It does not rewrite an opportunity's requirements or change its fit; fit always uses that opportunity's own requirement set.

### Projects & Evidence

- Each project shows its name, summary, technologies, capability tags, milestones, and evidence items.
- Milestone status is editable between Not started, In progress, and Done.
- Evidence items are editable. Each item has a type, label, location or note, and optional summary. Types: repository, README, schema, test report, deployment, dataset, contribution, other. The containerization record is a separate verified type created only by the verification gate.
- An evidence item is **Linked**, not verified, unless it is a containerization record created by the verification gate.
- Projects, milestones, evidence, opportunities, requirements, and applications use stable IDs. Requirements and projects share one capability vocabulary, so the same tag drives the requirement, the evidence rule, and the action.
- Adding a deployment evidence item with an HTTPS URL and a health note moves a deployment requirement from Missing to Partial. It never becomes Supported in this prototype.
- Adding a passing test report can move a testing requirement to Supported, but the app labels it linked evidence and says it has not independently run the tests.
- Milestone completion does not affect fit. Only evidence rules do.
- Editing a milestone or evidence item persists immediately.
- Removing evidence can move a requirement from Supported or Partial back to Missing. The change is recomputed, not manually set.
- No add/delete project, file upload, or repository import.

#### Deployment evidence the student can record

A deployment evidence item is a **self-reported record**, not a live check. It can include:

- **Live URL** — an HTTPS address the student says is deployed.
- **Health path** — for example, `/health`.
- **Observed health response** — the status text or short response the student says they saw, including `status: ok`, `healthy`, or `up`.
- **Platform** — a short selected value such as Render, Railway, Fly.io, Vercel, or other.
- **Deploy log excerpt** — a short pasted excerpt showing a successful deployment.
- **Captured date** — when the student says they observed it.

Recording a complete deployment item moves a deployment requirement from **Missing** to **Partial**. It never becomes **Supported** in this prototype.

The app does **not** open the URL, make a network request, check TLS or DNS, test uptime, verify that the health response is genuine, confirm which commit is deployed, or prove that the service is live. The interface says: “Deployment evidence recorded. Live reachability is not verified.”

### Opportunities & Applications

- Category filter with All and the five categories.
- Filtering is local and immediate. If a filter has no matches, show a plain empty state and a clear filter action.
- Save/unsave changes persisted state. Unsaving an opportunity with a status beyond Saved asks for confirmation, then removes it from active applications and clears its status.
- Status changes are manual and persisted. Changing status on an unsaved opportunity saves it first.
- Statuses are Saved, Preparing, Applied, Interviewing, and Closed.
- The detail view shows the source label, category, organisation, deadline, status, requirements, and fit action.
- An overdue deadline is shown as **Deadline passed**, but it does not silently change the application status. The student can set Closed.
- Verification never changes application status automatically. The student may move to Applied after reviewing the evidence.
- No application status history in the prototype; only the current status and last-updated timestamp.

### Fit mapping

- Every requirement has a capability and a visible evidence rule.
- Every one of the six sample opportunities has four or five requirements and can be assessed with the same engine. Northstar is the fully scripted demo path, not the only working fit.
- The engine scans all three projects and the practice profile for the strongest matching evidence.
- One evidence item can support more than one requirement, but coverage counts requirements, not evidence items.
- Ties between projects prefer the project with a verified record, then the most recent evidence, then the project order shown in the portfolio.
- **Supported** means the recorded evidence meets the published rule. It does not mean an employer verified it, the code runs, or the student is competent.
- **Partial** means related evidence exists but is incomplete or cannot be fully verified in the prototype.
- **Missing** means no acceptable evidence is recorded.
- The fit is recomputed from current state whenever evidence, practice, or verification changes. It is not stored as a fixed label.
- **Two status vocabularies, kept separate:** only the containerization requirement has a verification state of **Unsupported**, **Pending verification**, or **Supported**. Every fit row has **Supported**, **Partial**, or **Missing**. A pending verification shows as **Partial** in the fit; an unsupported requirement shows as **Missing**.
- The fit does not use an LLM, a network call, or a paid service.

### Deterministic fit rules

| Capability | Supported when | Partial when | Missing when |
|---|---|---|---|
| **API** | A project has API capability and a linked README or spec evidence item listing at least 3 routes. | API capability exists, but the evidence lists fewer than 3 routes or only mentions an API. | No project API evidence. |
| **Database** | A project has database capability and a schema evidence item with at least 2 tables, a primary key, and at least one foreign key. | A schema exists with at least 2 tables but lacks a primary key, foreign key, or equivalent declared relationship. | No database evidence. |
| **DSA** | Practice has 120+ solved, at least 4 of 6 core topics at 10+ solves, and at least 3 contests. | Practice meets at least one of those thresholds but not all three. | No practice data. |
| **Containerization** | A containerization artifact has passed the verification gate. | A submitted containerization artifact is pending verification. | No passed artifact and nothing pending. Task or milestone completion never changes this. |
| **Deployment** | Not reachable in this prototype. | A self-reported deployment item has an HTTPS URL, health path, observed health response, platform, deploy-log excerpt, and captured date. | No deployment evidence, or the item is incomplete. |
| **Testing** | A project has a test-report evidence item that reports passing tests and no failed or error count. | A project mentions tests or has a repository link but no captured result. | No testing evidence. |
| **Documentation** | A project has README or documentation evidence with setup and usage content. | A project has a repository link or partial documentation only. | No documentation evidence. |
| **Collaboration** | Not reachable in this prototype. | A project has a contribution note or a milestone marked as team-contributed. | No collaboration evidence. |
| **Data pipeline** | A project has data-pipeline capability and evidence describing input, transformation, and output. | Data-pipeline capability exists without that evidence. | No data-pipeline evidence. |

The thresholds and the deployment/collaboration limits are sample heuristics, not employer requirements. They are visible in the interface and in the README.

### Action plan and ranking

Only partial and missing requirements generate actions. The engine produces up to three actions per opportunity.

**Rank score = impact × urgency ÷ effort.**

- **Impact:** 1–5, seeded per capability. Containerization 5, API 4, database 4, deployment 4, DSA 3, testing 3, data pipeline 3, documentation 2, collaboration 2.
- **Effort:** 1–5, seeded per capability. Documentation 1, containerization 2, testing 2, collaboration 2, API 3, database 3, DSA 3, data pipeline 3, deployment 4.
- **Urgency:** 3 when 7 days or fewer remain, 2 when 8–21 days remain, 1 when more than 21 days remain or there is no deadline. A passed deadline keeps urgency 3 and shows an overdue warning.
- **Tie-breakers:** higher score, then higher impact, then lower effort, then earlier deadline, then the order of requirements in the opportunity.

For Northstar initially:

| Action | Impact | Effort | Urgency | Score |
|---|---|---|---|---|
| Containerize CampusCart | 5 | 2 | 3 | **7.5** |
| Log deployment evidence | 4 | 4 | 3 | **3.0** |
| Strengthen DSA topic coverage | 3 | 3 | 3 | **3.0** |

Deployment ranks above DSA on the higher-impact tie-breaker. After containerization passes, the plan recomputes: deployment is first, DSA second.

Each action card shows:

- the requirement and current state;
- the target project or practice area;
- the artifact or evidence it will produce;
- impact, effort, urgency, and the arithmetic;
- the destination surface;
- what the action cannot prove.

The ranking is a sample prioritization heuristic, not a prediction that the student will get the role.

### Verification gate

Only the containerization requirement is verification-gated.

**Artifact fields:**

- **Dockerfile** — full text.
- **README build/run commands** — the commands that build the image and run the container.

**Checks, in order:**

1. `FROM` exists with a non-empty image tag. `latest` fails.
2. `WORKDIR` is present.
3. `COPY` is present.
4. `RUN` is present.
5. `EXPOSE` is present with a port from 1 to 65535.
6. `CMD` or `ENTRYPOINT` is present.
7. README contains a `docker build` command and a `docker run` command.
8. The `docker run` command publishes a port, and the published container port matches the `EXPOSE` port.

**Form validation before submission:**

- Both fields are required and non-empty.
- Each artifact field is limited to 20,000 characters and rejects empty or whitespace-only content.
- Form validation only establishes that a bundle is well formed. It never marks a requirement supported.
- A well-formed bundle moves the verification state to **Pending verification** and the fit to **Partial**.
- A malformed bundle stays **Unsupported** with a **Missing** fit and shows inline errors.

**Pending behavior:**

- The submitted bundle is locked while pending.
- **Run verification** is the only action that evaluates it.
- **Edit submission** discards the pending bundle, returns the verification state to **Unsupported**, and returns the fit to **Missing**. The student must submit again.
- Pending never counts toward coverage.

**Failure behavior:**

- Every failed check is shown with the inspected value and a plain-language reason.
- The verification state returns to **Unsupported**; the fit returns to **Missing**.
- Coverage does not increase.
- The verification history records the attempt.
- The bundle remains editable for correction.

**Success behavior:**

- Every check passes.
- The verification state becomes **Supported**; the fit becomes **Supported**.
- A verified containerization evidence record is added to CampusCart.
- If the containerization milestone is not done, it is marked Done. The artifact is the reason, not the milestone.
- Coverage increases from **2 of 5** to **3 of 5**.
- The Northstar fit and Today next action update without a manual refresh.
- The verified artifact is locked. A new attempt requires Reset sample.

**The gate cannot establish:** that the image builds, the container starts, the API responds, the image is secure or small, or the build is reproducible on another machine. The interface says this beside the passing result.

**No direct setter:** There is no control that writes Supported, Unsupported, Partial, or Missing directly. The verification state is derived from the check result, and the fit is derived from the recorded evidence. There is no hard-coded pass or fail in the demo; the sample bundles are data and the same checks produce both outcomes.

### Connected update

After a verification result:

1. The verification record changes first.
2. CampusCart evidence and milestone state update.
3. Northstar fit recomputes.
4. The action plan recomputes.
5. Today's evidence snapshot, active application, deadline, and next action update.

No manual refresh is required. The application status is not changed automatically.

### Persistence, reset, and storage failure

- Profile, milestones, evidence items, saved opportunities, application statuses, verification state, and verification history persist on this device.
- **Reset sample** asks for confirmation, clears the workspace state, restores the seed, and recomputes the initial fit. It does not affect any file outside the app.
- If local persistence is unavailable, the app remains usable in memory and shows a persistent warning: “Changes will be lost when this page closes.”
- There are no accounts, cloud sync, or multi-device state.

### Labels and disclaimers

Always visible or available on the relevant surface:

- “Synthetic sample — not live.”
- “Evidence fit is not a competence score or a hiring prediction.”
- “Linked evidence has not been independently verified.”
- “Passing checks means the submitted artifact meets the published criteria. It does not prove that the code runs, the deployment is live, or the student is ready for hire.”
- On deployment: “This records deployment evidence. It does not verify live reachability or uptime.”
- On collaboration: “Collaboration cannot be verified in this prototype.”
- On the verification result: “This gate checks artifact completeness and internal consistency, not engineering quality.”

## Verification Contract

### Sample incomplete bundle

Dockerfile:

```dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY . .
RUN pip install -r requirements.txt
EXPOSE 5000
```

README commands:

```text
docker build -t campuscart .
docker run -p 8000:8000 campuscart
```

Expected failure:

- Check 6 fails: no `CMD` or `ENTRYPOINT`.
- Check 8 fails: published container port 8000 does not match `EXPOSE 5000`.
- All other checks pass.
- The verification state returns to Unsupported; the fit returns to Missing; coverage remains 2 of 5.

### Sample complete bundle

Dockerfile:

```dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY . .
RUN pip install -r requirements.txt
EXPOSE 5000
CMD ["python", "app.py"]
```

README commands:

```text
docker build -t campuscart .
docker run -p 5000:5000 campuscart
```

Expected result: all eight checks pass; the verification state becomes Supported; the fit becomes Supported; coverage becomes 3 of 5.

The bundles are demonstration data. The checks run against whatever the student submits, including edited text.

## States and Boundaries

- **First load:** synthetic workspace; Northstar fit computed at 2 of 5; three active applications; nearest deadline 7 days; containerization action first.
- **No saved opportunities:** Opportunities still lists the sample catalog; Today shows no active applications and a clear prompt to browse.
- **No filter matches:** plain empty state with a reset-filter action.
- **Invalid profile:** inline field errors; prior saved values remain.
- **Invalid evidence link:** inline error; nothing is saved; fit is unchanged.
- **Milestone done, verification unsupported:** explicitly allowed and explained; the fit stays Missing. This is the main anti-fake-state demonstration.
- **Pending:** bundle locked; verification Pending; fit Partial; not counted; Run verification available; Edit submission returns the verification state to Unsupported and the fit to Missing.
- **Failed verification:** verification Unsupported; fit Missing; all failed checks visible; coverage unchanged; history updated; bundle editable.
- **Supported:** verification Supported; fit Supported; coverage updated; verified evidence visible; artifact locked; limits visible.
- **Deployment evidence logged:** Partial at best; “Not verified in this prototype.”
- **Collaboration evidence:** Partial at best; “Not verified in this prototype.”
- **No unresolved actions:** show “No further verifiable action in this prototype” rather than inventing one.
- **Overdue opportunity:** Deadline passed warning; status does not change automatically; recommendations keep maximum urgency.
- **Closed application:** status remains Closed; fit remains viewable; no automatic reopening.
- **Storage unavailable:** in-memory mode with a persistent warning.
- **Reset:** confirmation, seed restoration, recomputation, and a fresh 2 of 5.

## Acceptance Criteria

- [ ] On first load, the workspace shows Aarav Mehta, three projects, six sample opportunities across five categories, seeded practice, and a Northstar fit of **2 of 5 supported**.
- [ ] Every sample opportunity is labelled **Sample — not live** on its card and detail view, and no sample opportunity shows a verified badge or an external Apply button.
- [ ] The profile can be edited with validation, persists after refresh, and updates the top bar and Today.
- [ ] CampusCart, StudySync, and RouteWise show technologies, milestones, and evidence; milestone status and evidence items can be edited and persist.
- [ ] Marking the containerization milestone Done leaves the verification state **Unsupported**, the fit **Missing**, and the coverage at **2 of 5**.
- [ ] The opportunity filter, save/unsave, and application status changes are functional and persist.
- [ ] Any catalog opportunity can be selected and assessed; the Northstar fit shows five requirements with Supported, Partial, or Missing, a plain-language reason, and a link to the evidence or gap.
- [ ] The DSA fit shows the visible calculation: 145 total (pass), 3 of 6 core topics at 10+ (fail), 6 contests (pass), resulting in **Partial**.
- [ ] A complete self-reported deployment evidence record moves deployment to **Partial** at best and states that live reachability is not verified.
- [ ] The action plan shows the ranking arithmetic and ranks **Containerize CampusCart** first with a score of 7.5.
- [ ] Submitting the incomplete bundle moves the verification state to Pending, not Supported; running verification fails checks 6 and 8, returns the verification state to Unsupported and the fit to Missing, leaves coverage unchanged, and records history.
- [ ] Submitting the complete bundle and running verification passes all eight checks, marks the requirement Supported, records verified evidence on CampusCart, and updates coverage to **3 of 5**.
- [ ] The Northstar fit and Today next action update without a manual refresh; the next action becomes deployment evidence.
- [ ] Application status is manual; verification never changes it automatically; the status and deadline persist and appear on Today.
- [ ] Reset sample asks for confirmation, restores the seed, and recomputes the initial 2 of 5.
- [ ] No button or control changes a requirement state without persisted evidence behind it; no demo result is hard-coded.
- [ ] The app works offline for the core demo, makes no network calls, and uses no LLM or paid service.
- [ ] Disclaimers distinguish linked evidence, verified evidence, artifact completeness, and engineering competence.
- [ ] The workspace is usable at desktop width and stacks cleanly on mobile; status is not conveyed by colour alone.

## Product Decisions

| Decision | Status |
|---|---|
| Broad connected Student Career OS instead of a standalone auditor | Learner approved |
| Six synthetic opportunities across five categories | Learner approved |
| Source-tagged catalog that can accept future verified sources without redesign | Learner approved |
| Connected end-to-end journey and verification gate over dashboard breadth or decoration | Learner approved |
| Lightweight profile, practice snapshot, portfolio, catalog, and tracker | Learner approved |
| Verification-gated evidence retained as the differentiating feature | Learner approved |
| No live scraping, external integrations, accounts, or paid APIs in the prototype | Learner approved |
| Synthetic opportunities are never described as live or verified | Learner approved |
| CampusCart, StudySync, and RouteWise as the sample projects | Learner approved |
| Northstar Labs and the six-opportunity catalog | Learner approved |
| Fit rules, visible DSA threshold calculation, and ranking formula | Learner approved |
| Deployment and collaboration are Partial at best in the prototype | Learner approved |
| Application status changes are manual and independent of verification | Learner approved |
| No application status history in the prototype | Learner approved |
| Career field notebook visual direction | Learner approved |
| Product scope freezes when the technical specification is approved | Learner approved |

## Scope Freeze and Cut Order

Product scope freezes when `spec.md` is approved. After that, changes are limited to bug fixes, reliability, accessibility, copy, and demo polish. A new surface, data source, verification gate, or integration requires reopening the spec.

The connected path is the build priority:

**Today → Northstar opportunity → fit map → containerization action → verification failure → verification pass → updated fit and Today.**

If time runs short, cut in this order:

1. **Profile editing** — keep the seeded profile visible and read-only.
2. **Secondary project editing** — keep StudySync and RouteWise evidence visible and read-only; preserve CampusCart evidence and the verification path.
3. **Category filter and non-primary action destinations** — keep the six records and the primary Northstar path.
4. **Extra polish and secondary responsive refinements** — keep the demo path readable at desktop width.

Never cut or compromise:

- The connected path above.
- The deterministic verification gate and its failure and pass cases.
- Local persistence and reset.
- Synthetic-data labels.
- Visible heuristic explanations, including the DSA calculation and action ranking arithmetic.
- Competence disclaimers and verification limits.
- Manual, independent application status changes.

## What We're Building

- One application shell with Today, Profile & Practice, Projects, Opportunities, Opportunity Fit & Action Plan, and the verification workspace.
- One shared, persisted workspace state.
- Seeded student, practice, three projects, six source-labelled opportunities, and deadlines.
- Editable profile, milestones, and evidence items.
- Save/unsave and five manual application statuses.
- Deterministic fit mapping across projects and practice.
- A ranked three-action plan with visible arithmetic and real destinations.
- One working verification-gated upgrade for containerization.
- A minimal verification history and a reset path.
- Visible sample labels, limitations, and competence disclaimers.
- A small automated test suite for the fit rules, ranking, verification checks, and state transitions.
- README with setup, run instructions, sample data, and the fit/verification contract.

## Deferred From the POC

- GitHub import, repository inspection, and platform sync.
- Live opportunity aggregation, verified external sources, and source-level freshness.
- Multiple target roles and role-description parsing.
- Full DSA topic and contest tracking with editing.
- Adding or deleting projects and uploading files.
- Multiple verification upgrades beyond containerization.
- Application status history, reminders, calendar sync, and notifications.
- Résumé, cover-letter, or proof-dossier export.
- AI-assisted planning, with deterministic verification unchanged.
- Accounts, backend, cloud sync, sharing, and employer views.

## Possible Later Enhancements

- A verified-source catalog with freshness and source metadata.
- A GitHub import that pre-fills evidence, using the same rules.
- A role-description parser that proposes requirements for review.
- A multi-project evidence graph that shows coverage over time.
- A deployment reachability check, if a reliable offline-safe method is available.
- An application timeline and deadline reminders.
- An evidence dossier export for applications.

## Non-Goals

- Prove that the student is competent, ready for hire, or likely to be selected.
- Predict hiring outcomes or rank students.
- Assess code quality, architecture, security, or performance.
- Verify that a live deployment is reachable.
- Verify collaboration or employer requirements.
- Replace a career advisor, mentor, or hiring manager.
- Scrape job boards, aggregate live opportunities, or integrate LeetCode, GitHub, or coding platforms in the MVP.
- Support multiple users, real personal data, or employer accounts.
- Use paid APIs, LLMs, or unreliable external services in the core workflow.

## Resolved Decisions

1. **Working title:** **Student Career OS**.
2. **Sample content:** Aarav Mehta, CampusCart, StudySync, RouteWise, Northstar Labs, and the other five organisations are approved for the demo.
3. **Fit and ranking:** the thresholds and **impact × urgency ÷ effort** are approved, with the DSA calculation and all heuristics visible and labelled as sample rules.
4. **Honest limits:** deployment and collaboration remain **Partial at best**; deployment evidence is self-reported and live reachability is not verified.
5. **Visual direction:** the **career field notebook** direction is approved.
6. **Application status:** manual and independent of verification results; no application status history in the prototype, only current status and last-updated time.
7. **Scope:** frozen after the technical specification is approved; the cut order above applies if time is short.
