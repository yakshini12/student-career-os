# Student Career OS

A local, evidence-led career workspace for a student preparing for backend internships. It connects one sample opportunity to the student's real project evidence, a deterministic fit map, a ranked next action, a verification gate, and an updated fit after the gate passes.

This is a proof of concept with **synthetic sample data**. It is not a job board, an application submitter, or a readiness score.

## Run it

Requirements: Node.js 20+ and npm.

```bash
npm install
npm run dev
```

Open the local URL Vite prints (usually `http://localhost:5173`).

Production check:

```bash
npm run build
npm run preview
```

Other checks:

```bash
npm test
npm run typecheck
npm run lint
```

## Demo path

1. **Today** opens with Aarav Mehta, three active applications, Northstar Labs due in 7 days, a **2 of 5** evidence fit, and **Containerize CampusCart** as the top action at 7.5.
2. Open **Northstar Labs > Backend Engineering Intern** to see all five requirements, the DSA calculation, and the ranked actions.
3. In **Projects**, set CampusCart's **Containerize API** milestone to **Done**. Fit stays **2 of 5** and containerization stays **Missing**: a milestone is not evidence.
4. Open the **verification workspace**. Load the **incomplete** sample, submit it, and run verification. It passes 6 of 8 checks and fails **Command** and **Port mapping**. The verification state returns to **Unsupported**.
5. Load the **complete** sample, submit it, and run verification. It passes **8 of 8**. The requirement becomes **Supported**, fit becomes **3 of 5**, verified evidence `ev_campus_container_verified` appears in Projects, and the milestone is marked done.
6. Return to the opportunity. **Deployment evidence** is now the first action at 3.0; DSA is second. Change the manual application status to **Applied**.
7. Refresh the page. The Applied status, verified evidence, 3 of 5 fit, and verification history remain.
8. Use **Reset sample** and confirm the seed returns to **2 of 5**, three seed applications, an empty history, and no verified evidence.

The workspace is stored under `student-career-os:v1` in `localStorage`. State is scoped to the exact origin, so `localhost`, `127.0.0.1`, and a preview host do not share data. Clearing site data also resets the workspace.

## What the verification gate actually checks

The gate parses the submitted Dockerfile text and README commands with deterministic rules. It checks:

1. A pinned base image tag (not `latest` or untagged).
2. A `WORKDIR`.
3. A `COPY` with source and destination.
4. A `RUN` instruction.
5. A valid exposed TCP port.
6. A final `CMD` or `ENTRYPOINT`.
7. README commands that include both `docker build` and `docker run`.
8. A published container port that matches an exposed TCP port.

It does **not** build an image, run a container, reach the network, verify a deployed service, or prove that the code works. A passing bundle creates a verified evidence record for this prototype only.

## Scope and limitations

- **Synthetic data only.** Every opportunity is labelled **Sample — not live**. There are no live listings, employer badges, or hiring predictions.
- **No backend or accounts.** All state is local and single-user.
- **No live integrations.** Practice data is seeded and read-only; there is no LeetCode, GitHub, or calendar sync.
- **No LLM matching.** Fit, coverage, urgency, and action ranking are deterministic rules.
- **Applications are manual.** The app never submits an application and never contacts anyone.
- **Deployment evidence is self-reported.** A deployment record can at best make the requirement Partial; live reachability is not verified.
- **Containerization is the only gated requirement.** API, database, testing, documentation, DSA, deployment, data pipeline, and collaboration use their own evidence rules.
- **No migration.** A schema-version mismatch or unreadable saved state reseeds the sample and shows a notice.
- **Not production hardened.** This is a hackathon proof of concept, not a multi-user or accessible-compliance-audited product.

## Project structure

```text
src/model/      types, seed-independent rules, fit, actions, verification, reducer, persistence
src/data/       synthetic seed and UI copy
src/store/      workspace provider, context, selectors, injected clock
src/components/ shared UI, dialogs, evidence form, status pieces
src/views/      Today, Profile, Projects, Opportunities, Opportunity detail, Verification
src/test/       model, reducer, persistence, and end-to-end journey tests
devpost/        approved scope, PRD, spec, checklist, app map
```

Fit, coverage, and action rankings are computed on read. They are never stored as a second source of truth.

## Tests

The test suite covers the seeded fit, DSA thresholds, evidence validation, deterministic action ranking, verification parsing and failure/pass transitions, persistence validation, reset, and the full Northstar journey. `npm test` currently runs 74 tests across 6 files.

## License

MIT. See [LICENSE](LICENSE).
