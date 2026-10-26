import { describe, expect, it } from "vitest";
import { buildSeed } from "../data/seed";
import { daysLeft } from "../model/dates";
import { coverageFor } from "../model/fit";
import {
  STORAGE_KEY,
  VERIFIED_EVIDENCE_ID,
  loadWorkspace,
  reduceWorkspace,
  saveWorkspace,
  validateWorkspace,
} from "../model/state";
import { COMPLETE_BUNDLE, INCOMPLETE_BUNDLE } from "../model/verification";
import type { WorkspaceState } from "../model/types";
import {
  SEEDED_AT,
  TODAY,
  actionsFor,
  clone,
  coverageForOpportunity,
  fitFor,
  memoryStorage,
  northstar,
  projectById,
} from "./helpers";

const NOW = new Date("2026-10-26T08:00:00.000Z");
const SUBMITTED_AT = "2026-10-26T08:30:00.000Z";
const RUN_AT = "2026-10-26T09:00:00.000Z";

function submit(state: WorkspaceState, bundle = COMPLETE_BUNDLE): WorkspaceState {
  return reduceWorkspace(state, { type: "SUBMIT_ARTIFACT", bundle, submittedAt: SUBMITTED_AT });
}

function run(state: WorkspaceState): WorkspaceState {
  return reduceWorkspace(state, { type: "RUN_VERIFICATION", runAt: RUN_AT });
}

function resolve(state: WorkspaceState): WorkspaceState {
  return run(submit(state));
}

function rowStatus(state: WorkspaceState, capability: string) {
  return fitFor(state).find((row) => row.capability === capability)?.status;
}

function saveLoad(state: WorkspaceState) {
  const storage = memoryStorage();
  expect(saveWorkspace(storage, state)).toBe(true);
  expect(validateWorkspace(JSON.parse(storage.dump()[STORAGE_KEY]))).toBe(true);
  return loadWorkspace(storage, TODAY, NOW);
}

describe("the scripted Northstar journey", () => {
  it("starts at 2 of 5 with containerization first and seven days left", () => {
    const state = buildSeed(TODAY, SEEDED_AT);
    expect(coverageForOpportunity(state)).toEqual({
      supported: 2,
      total: 5,
      partial: 1,
      missing: 2,
    });
    expect(rowStatus(state, "containerization")).toBe("missing");
    expect(actionsFor(state)[0].capability).toBe("containerization");
    expect(daysLeft(northstar(state).deadline as string, TODAY)).toBe(7);
  });

  it("does not let a completed milestone change fit", () => {
    const state = reduceWorkspace(buildSeed(TODAY, SEEDED_AT), {
      type: "SET_MILESTONE",
      projectId: "campus_cart",
      milestoneId: "campus_cart_containerize",
      status: "done",
    });
    expect(coverageForOpportunity(state).supported).toBe(2);
    expect(rowStatus(state, "containerization")).toBe("missing");
    expect(state.verification.status).toBe("unsupported");
  });

  it("fails the incomplete bundle at checks 6 and 8 without changing coverage", () => {
    const pending = submit(buildSeed(TODAY, SEEDED_AT), INCOMPLETE_BUNDLE);
    expect(pending.verification.status).toBe("pending");
    expect(rowStatus(pending, "containerization")).toBe("partial");
    expect(coverageForOpportunity(pending).supported).toBe(2);

    const failed = run(pending);
    expect(failed.verification.status).toBe("unsupported");
    expect(failed.verification.lastResult?.checks.filter((item) => item.passed)).toHaveLength(6);
    expect(failed.verification.lastResult?.checks.filter((item) => !item.passed).map((item) => item.label)).toEqual(
      ["Command", "Port mapping"],
    );
    expect(rowStatus(failed, "containerization")).toBe("missing");
    expect(coverageForOpportunity(failed).supported).toBe(2);
    expect(failed.history.at(-1)?.checkSummary).toBe(
      "6/8 checks passed; failed: Command, Port mapping.",
    );
  });

  it("passes the complete bundle, writes verified evidence, and reaches 3 of 5", () => {
    const state = resolve(buildSeed(TODAY, SEEDED_AT));
    expect(state.verification.status).toBe("supported");
    expect(state.verification.lastResult?.checks.every((item) => item.passed)).toBe(true);
    expect(state.verification.verifiedEvidenceId).toBe(VERIFIED_EVIDENCE_ID);
    expect(coverageForOpportunity(state).supported).toBe(3);
    expect(rowStatus(state, "containerization")).toBe("supported");

    const evidence = projectById(state, "campus_cart").evidence.find(
      (item) => item.id === VERIFIED_EVIDENCE_ID,
    );
    expect(evidence).toMatchObject({
      kind: "containerization",
      source: "verified",
      projectId: "campus_cart",
      addedAt: RUN_AT,
      verifiedAt: RUN_AT,
    });
    expect(
      projectById(state, "campus_cart").milestones.find(
        (item) => item.id === "campus_cart_containerize",
      )?.status,
    ).toBe("done");
    expect(state.history.at(-1)?.checkSummary).toBe("8/8 checks passed.");
  });

  it("keeps the passed state, verified evidence, and 3 of 5 across a reload", () => {
    const state = resolve(buildSeed(TODAY, SEEDED_AT));
    const loaded = saveLoad(state);
    expect(loaded.notice).toBeNull();
    expect(loaded.state.verification.status).toBe("supported");
    expect(loaded.state.verification.verifiedEvidenceId).toBe(VERIFIED_EVIDENCE_ID);
    expect(
      projectById(loaded.state, "campus_cart").evidence.some(
        (item) => item.id === VERIFIED_EVIDENCE_ID,
      ),
    ).toBe(true);
    expect(coverageForOpportunity(loaded.state).supported).toBe(3);
    expect(loaded.state.history).toHaveLength(2);
  });

  it("puts deployment first and DSA second after the pass", () => {
    const state = resolve(buildSeed(TODAY, SEEDED_AT));
    const actions = actionsFor(state);
    expect(actions.map((action) => action.capability)).toEqual(["deployment", "dsa"]);
    expect(actions.some((action) => action.capability === "containerization")).toBe(false);
  });

  it("persists a manual Applied status without touching verification or fit", () => {
    const passed = resolve(buildSeed(TODAY, SEEDED_AT));
    const applied = reduceWorkspace(passed, {
      type: "SET_APPLICATION_STATUS",
      opportunityId: "northstar_backend_intern",
      status: "applied",
      updatedAt: "2026-10-26T09:30:00.000Z",
    });
    expect(applied.applications.northstar_backend_intern.status).toBe("applied");
    expect(applied.verification).toEqual(passed.verification);
    expect(coverageForOpportunity(applied)).toEqual(coverageForOpportunity(passed));

    const loaded = saveLoad(applied);
    expect(loaded.state.applications.northstar_backend_intern).toEqual({
      status: "applied",
      updatedAt: "2026-10-26T09:30:00.000Z",
    });
    expect(loaded.state.verification.status).toBe("supported");
    expect(coverageForOpportunity(loaded.state).supported).toBe(3);
  });

  it("returns to the exact seed after reset", () => {
    const passed = resolve(buildSeed(TODAY, SEEDED_AT));
    const reset = reduceWorkspace(passed, {
      type: "RESET",
      state: buildSeed(TODAY, SEEDED_AT),
    });
    expect(coverageForOpportunity(reset)).toEqual({
      supported: 2,
      total: 5,
      partial: 1,
      missing: 2,
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
    expect(reset.applications).toEqual(clone(buildSeed(TODAY, SEEDED_AT).applications));
    expect(reset.selectedOpportunityId).toBe("northstar_backend_intern");
    expect(coverageFor(fitFor(reset)).supported).toBe(2);
  });
});
