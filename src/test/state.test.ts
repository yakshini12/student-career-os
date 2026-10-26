import { describe, expect, it } from "vitest";
import { buildSeed } from "../data/seed";
import { coverageFor } from "../model/fit";
import {
  STORAGE_KEY,
  VERIFIED_EVIDENCE_ID,
  loadWorkspace,
  reduceWorkspace,
  saveWorkspace,
  validateWorkspace,
  type WorkspaceAction,
} from "../model/state";
import { COMPLETE_BUNDLE, INCOMPLETE_BUNDLE } from "../model/verification";
import type { EvidenceItem, WorkspaceState } from "../model/types";
import {
  SEEDED_AT,
  TODAY,
  clone,
  coverageForOpportunity,
  fitFor,
  memoryStorage,
  projectById,
  seedState,
} from "./helpers";

const SUBMITTED_AT = "2026-10-26T08:30:00.000Z";
const RUN_AT = "2026-10-26T09:00:00.000Z";
const NOW = new Date("2026-10-26T08:00:00.000Z");

function submitted(bundle = COMPLETE_BUNDLE, base = seedState()): WorkspaceState {
  return reduceWorkspace(base, {
    type: "SUBMIT_ARTIFACT",
    bundle,
    submittedAt: SUBMITTED_AT,
  });
}

function failed(base = seedState()): WorkspaceState {
  return reduceWorkspace(submitted(INCOMPLETE_BUNDLE, base), {
    type: "RUN_VERIFICATION",
    runAt: RUN_AT,
  });
}

function passed(base = seedState()): WorkspaceState {
  return reduceWorkspace(submitted(COMPLETE_BUNDLE, base), {
    type: "RUN_VERIFICATION",
    runAt: RUN_AT,
  });
}

function evidenceById(state: WorkspaceState, evidenceId: string): EvidenceItem | undefined {
  return state.projects.flatMap((project) => project.evidence).find((item) => item.id === evidenceId);
}

function roundTrip(state: WorkspaceState) {
  const storage = memoryStorage();
  expect(saveWorkspace(storage, state)).toBe(true);
  const parsed: unknown = JSON.parse(storage.dump()[STORAGE_KEY]);
  expect(validateWorkspace(parsed)).toBe(true);
  return { storage, parsed, loaded: loadWorkspace(storage, TODAY, NOW) };
}

describe("verification state", () => {
  it("moves unsupported to pending, then back to unsupported on failure", () => {
    const pending = submitted();
    expect(pending.verification.status).toBe("pending");
    expect(pending.verification.bundle).toEqual(COMPLETE_BUNDLE);
    expect(pending.verification.submittedAt).toBe(SUBMITTED_AT);
    expect(pending.history).toHaveLength(1);
    expect(pending.history[0].next).toBe("pending");

    const afterFail = failed();
    expect(afterFail.verification.status).toBe("unsupported");
    expect(afterFail.verification.lastResult?.passed).toBe(false);
    expect(afterFail.history).toHaveLength(2);
    expect(afterFail.history[1].checkSummary).toBe(
      "6/8 checks passed; failed: Command, Port mapping.",
    );
  });

  it("moves pending to supported on a passing run", () => {
    const state = passed();
    expect(state.verification.status).toBe("supported");
    expect(state.verification.lastResult?.passed).toBe(true);
    expect(state.history.at(-1)?.checkSummary).toBe("8/8 checks passed.");
  });

  it("atomically writes the verified evidence, coverage, milestone, and history", () => {
    const state = passed();
    expect(state.verification.verifiedEvidenceId).toBe(VERIFIED_EVIDENCE_ID);
    expect(state.verification.verifiedAt).toBe(RUN_AT);

    const evidence = evidenceById(state, VERIFIED_EVIDENCE_ID);
    expect(evidence).toMatchObject({
      id: VERIFIED_EVIDENCE_ID,
      projectId: "campus_cart",
      kind: "containerization",
      source: "verified",
      addedAt: RUN_AT,
      verifiedAt: RUN_AT,
    });

    const milestone = projectById(state, "campus_cart").milestones.find(
      (item) => item.id === "campus_cart_containerize",
    );
    expect(milestone?.status).toBe("done");
    expect(coverageForOpportunity(state).supported).toBe(3);
    expect(state.history.at(-1)).toMatchObject({
      requirement: "containerization",
      previous: "pending",
      next: "supported",
    });
  });

  it("adds no evidence and clears refs when verification fails", () => {
    const state = failed();
    expect(evidenceById(state, VERIFIED_EVIDENCE_ID)).toBeUndefined();
    expect(state.verification.verifiedAt).toBeNull();
    expect(state.verification.verifiedEvidenceId).toBeNull();
    expect(coverageForOpportunity(state).supported).toBe(2);
    expect(fitFor(state).find((row) => row.capability === "containerization")?.status).toBe(
      "missing",
    );
  });

  it("withdraws a pending submission and clears its stored fields", () => {
    const state = reduceWorkspace(submitted(), {
      type: "EDIT_SUBMISSION",
      timestamp: "2026-10-26T08:45:00.000Z",
    });
    expect(state.verification).toEqual({
      status: "unsupported",
      bundle: null,
      submittedAt: null,
      lastResult: null,
      verifiedAt: null,
      verifiedEvidenceId: null,
    });
    expect(state.history.at(-1)?.checkSummary).toBe("Submission withdrawn.");
  });

  it("ignores withdrawal when nothing is pending", () => {
    const state = seedState();
    expect(
      reduceWorkspace(state, { type: "EDIT_SUBMISSION", timestamp: RUN_AT }).verification,
    ).toEqual(state.verification);
  });

  it("clears every verification reference and reseeds coverage on reset", () => {
    const reset = reduceWorkspace(passed(), {
      type: "RESET",
      state: buildSeed(TODAY, SEEDED_AT),
    });
    expect(reset.verification).toEqual({
      status: "unsupported",
      bundle: null,
      submittedAt: null,
      lastResult: null,
      verifiedAt: null,
      verifiedEvidenceId: null,
    });
    expect(reset.history).toEqual([]);
    expect(coverageForOpportunity(reset).supported).toBe(2);
    expect(projectById(reset, "campus_cart").milestones.find(
      (item) => item.id === "campus_cart_containerize",
    )?.status).toBe("not_started");
    expect(reset.applications).toEqual(seedState().applications);
  });

  it("does not change application status during verification actions", () => {
    const applied = reduceWorkspace(seedState(), {
      type: "SET_APPLICATION_STATUS",
      opportunityId: "northstar_backend_intern",
      status: "applied",
      updatedAt: "2026-10-26T07:30:00.000Z",
    });
    const application = applied.applications.northstar_backend_intern;

    for (const state of [submitted(COMPLETE_BUNDLE, applied), failed(applied), passed(applied)]) {
      expect(state.applications.northstar_backend_intern).toEqual(application);
    }
  });

  it("refuses to remove or update the verified evidence record", () => {
    const state = passed();
    const removed = reduceWorkspace(state, {
      type: "REMOVE_EVIDENCE",
      evidenceId: VERIFIED_EVIDENCE_ID,
    });
    expect(evidenceById(removed, VERIFIED_EVIDENCE_ID)).toBeDefined();
    expect(removed.verification.status).toBe("supported");

    const verified = evidenceById(state, VERIFIED_EVIDENCE_ID);
    if (!verified) throw new Error("Missing verified evidence");
    const updated = reduceWorkspace(state, {
      type: "UPDATE_EVIDENCE",
      evidence: { ...verified, summary: "Edited." },
    });
    expect(evidenceById(updated, VERIFIED_EVIDENCE_ID)?.summary).not.toBe("Edited.");
  });
});

describe("workspace persistence", () => {
  it("round-trips a passed workspace without reseeding", () => {
    const state = passed();
    const { loaded } = roundTrip(state);
    expect(loaded.notice).toBeNull();
    expect(loaded.persistenceAvailable).toBe(true);
    expect(loaded.state.verification.status).toBe("supported");
    expect(loaded.state.verification.verifiedEvidenceId).toBe(VERIFIED_EVIDENCE_ID);
    expect(evidenceById(loaded.state, VERIFIED_EVIDENCE_ID)).toMatchObject({
      kind: "containerization",
      source: "verified",
    });
    expect(coverageForOpportunity(loaded.state).supported).toBe(3);
  });

  it("rejects a supported state when the verified reference is missing or wrong", () => {
    const base = passed();
    const cases: WorkspaceState[] = [];

    const nullRef = clone(base);
    nullRef.verification.verifiedEvidenceId = null;
    cases.push(nullRef);

    const missing = clone(base);
    missing.verification.verifiedEvidenceId = "ev_missing";
    cases.push(missing);

    const mismatched = clone(base);
    const mismatchedEvidence = evidenceById(mismatched, VERIFIED_EVIDENCE_ID);
    if (!mismatchedEvidence) throw new Error("Missing verified evidence");
    mismatchedEvidence.verifiedAt = "2026-10-26T09:30:00.000Z";
    cases.push(mismatched);

    const wrongKind = clone(base);
    const wrongKindEvidence = evidenceById(wrongKind, VERIFIED_EVIDENCE_ID);
    if (!wrongKindEvidence) throw new Error("Missing verified evidence");
    wrongKindEvidence.kind = "other";
    cases.push(wrongKind);

    const wrongSource = clone(base);
    const wrongSourceEvidence = evidenceById(wrongSource, VERIFIED_EVIDENCE_ID);
    if (!wrongSourceEvidence) throw new Error("Missing verified evidence");
    wrongSourceEvidence.source = "linked";
    cases.push(wrongSource);

    const wrongProject = clone(base);
    const wrongProjectEvidence = evidenceById(wrongProject, VERIFIED_EVIDENCE_ID);
    if (!wrongProjectEvidence) throw new Error("Missing verified evidence");
    wrongProjectEvidence.projectId = "study_sync";
    cases.push(wrongProject);

    for (const state of cases) {
      expect(validateWorkspace(state)).toBe(false);
    }
  });

  it("rejects a non-supported state that keeps verification references", () => {
    const ref = clone(failed());
    ref.verification.verifiedEvidenceId = VERIFIED_EVIDENCE_ID;
    expect(validateWorkspace(ref)).toBe(false);

    const timestamp = clone(failed());
    timestamp.verification.verifiedAt = RUN_AT;
    expect(validateWorkspace(timestamp)).toBe(false);
  });

  it("reseeds corrupt JSON, a dangling evidence project, and a wrong schema version", () => {
    const corrupt = memoryStorage({ [STORAGE_KEY]: "{not json" });
    const corruptLoad = loadWorkspace(corrupt, TODAY, NOW);
    expect(corruptLoad.notice).toBe(
      "Saved sample data was reset because it could not be read.",
    );
    expect(corruptLoad.state.verification.status).toBe("unsupported");

    const dangling = clone(seedState());
    const evidence = projectById(dangling, "campus_cart").evidence[0];
    evidence.projectId = "ghost_project";
    const danglingLoad = loadWorkspace(
      memoryStorage({ [STORAGE_KEY]: JSON.stringify(dangling) }),
      TODAY,
      NOW,
    );
    expect(danglingLoad.notice).toBe(
      "Saved sample data was reset because it could not be read.",
    );

    const wrongVersion = { ...clone(seedState()), schemaVersion: 2 };
    const versionLoad = loadWorkspace(
      memoryStorage({ [STORAGE_KEY]: JSON.stringify(wrongVersion) }),
      TODAY,
      NOW,
    );
    expect(versionLoad.notice).toBe(
      "Saved sample data was reset because it could not be read.",
    );
  });

  it("saves a fresh seed when storage is empty", () => {
    const storage = memoryStorage();
    const loaded = loadWorkspace(storage, TODAY, NOW);
    expect(loaded.notice).toBeNull();
    expect(loaded.persistenceAvailable).toBe(true);
    expect(storage.dump()[STORAGE_KEY]).toBeDefined();
    expect(coverageForOpportunity(loaded.state).supported).toBe(2);
  });
});

describe("single source of truth", () => {
  it("never stores fit status inside the workspace", () => {
    const actions: WorkspaceAction[] = [
      {
        type: "SET_APPLICATION_STATUS",
        opportunityId: "northstar_backend_intern",
        status: "applied",
        updatedAt: RUN_AT,
      },
      {
        type: "SET_MILESTONE",
        projectId: "campus_cart",
        milestoneId: "campus_cart_containerize",
        status: "done",
      },
      {
        type: "SUBMIT_ARTIFACT",
        bundle: COMPLETE_BUNDLE,
        submittedAt: SUBMITTED_AT,
      },
      { type: "RUN_VERIFICATION", runAt: RUN_AT },
    ];
    let state = seedState();
    for (const action of actions) {
      state = reduceWorkspace(state, action);
      expect("fit" in state).toBe(false);
      expect("coverage" in state).toBe(false);
    }
    expect(coverageForOpportunity(state).supported).toBe(3);
    expect(coverageFor(fitFor(state))).toEqual(coverageForOpportunity(state));
  });
});
