import { describe, expect, it } from "vitest";
import { COMPLETE_BUNDLE, INCOMPLETE_BUNDLE } from "../model/verification";
import { dsaCalculation, computeFit } from "../model/fit";
import { reduceWorkspace } from "../model/state";
import type { EvidenceItem, FitStatus, WorkspaceState } from "../model/types";
import {
  TODAY,
  actionsFor,
  clone,
  coverageForOpportunity,
  customOpportunity,
  fitFor,
  isolatedState,
  northstar,
  opportunityById,
  projectById,
  seedState,
} from "./helpers";

const RUN_AT = "2026-10-26T09:00:00.000Z";

function submitted(state: WorkspaceState, bundle = COMPLETE_BUNDLE): WorkspaceState {
  return reduceWorkspace(state, {
    type: "SUBMIT_ARTIFACT",
    bundle,
    submittedAt: "2026-10-26T08:30:00.000Z",
  });
}

function passed(state: WorkspaceState): WorkspaceState {
  return reduceWorkspace(submitted(state), { type: "RUN_VERIFICATION", runAt: RUN_AT });
}

function rowFor(state: WorkspaceState, capability: string, opportunityId = "northstar_backend_intern") {
  const row = fitFor(state, opportunityById(state, opportunityId)).find(
    (item) => item.capability === capability,
  );
  if (!row) throw new Error(`Missing fit row for ${capability}`);
  return row;
}

function withCapabilities(projectId: string, capabilities: WorkspaceState["projects"][number]["capabilities"]) {
  const state = isolatedState(projectId);
  const project = state.projects[0];
  state.projects[0] = { ...project, capabilities };
  return state;
}

function withEvidence(projectId: string, evidence: EvidenceItem[]) {
  const state = clone(seedState());
  const project = projectById(state, projectId);
  project.evidence = evidence;
  return state;
}

describe("Northstar seed fit", () => {
  it("reports 2 of 5 supported from the seed", () => {
    const state = seedState();
    expect(coverageForOpportunity(state)).toEqual({
      supported: 2,
      total: 5,
      partial: 1,
      missing: 2,
    });
    const rows = fitFor(state);
    expect(rows.map((row) => [row.capability, row.status])).toEqual([
      ["api", "supported"],
      ["database", "supported"],
      ["dsa", "partial"],
      ["containerization", "missing"],
      ["deployment", "missing"],
    ]);
  });

  it("keeps the DSA calculation visible and partial", () => {
    const calculation = dsaCalculation(seedState());
    expect(calculation.totalSolved).toBe(145);
    expect(calculation.totalSolvedPass).toBe(true);
    expect(calculation.coreTopicCount).toBe(3);
    expect(calculation.coreTopicsRequired).toBe(4);
    expect(calculation.coreTopicsPass).toBe(false);
    expect(calculation.contests).toBe(6);
    expect(calculation.contestsPass).toBe(true);
    expect(rowFor(seedState(), "dsa").status).toBe("partial");
    expect(rowFor(seedState(), "dsa").calculation).toEqual(calculation);
  });

  it("moves containerization from missing to partial to supported only through the gate", () => {
    expect(rowFor(seedState(), "containerization").status).toBe("missing");

    const pending = submitted(seedState(), INCOMPLETE_BUNDLE);
    expect(pending.verification.status).toBe("pending");
    expect(rowFor(pending, "containerization").status).toBe("partial");

    const supported = passed(seedState());
    expect(supported.verification.status).toBe("supported");
    expect(rowFor(supported, "containerization").status).toBe("supported");
    expect(coverageForOpportunity(supported).supported).toBe(3);
  });

  it("never lets the containerization milestone change fit", () => {
    const state = reduceWorkspace(seedState(), {
      type: "SET_MILESTONE",
      projectId: "campus_cart",
      milestoneId: "campus_cart_containerize",
      status: "done",
    });
    expect(rowFor(state, "containerization").status).toBe("missing");
    expect(coverageForOpportunity(state).supported).toBe(2);
  });

  it("keeps deployment partial at best even with complete evidence", () => {
    const state = clone(seedState());
    projectById(state, "campus_cart").evidence.push({
      id: "ev_test_deployment",
      projectId: "campus_cart",
      kind: "deployment",
      label: "Recorded deployment",
      location: "https://campuscart.example.invalid",
      summary: "Deployment observed.",
      source: "linked",
      addedAt: RUN_AT,
      metrics: {
        healthPath: "/health",
        healthResponse: '{"status":"ok"}',
        platform: "Render",
        deployLog: "Build completed and service started on port 5000.",
        capturedDate: TODAY,
      },
    });
    const row = rowFor(state, "deployment");
    expect(row.status).toBe("partial");
    expect(row.limitation).toContain("does not open the URL");
    expect(row.evidenceRefs).toContain("ev_test_deployment");
  });

  it("moves API from supported to partial to missing as linked docs disappear", () => {
    const state = clone(seedState());
    const campus = projectById(state, "campus_cart");
    campus.evidence = campus.evidence.filter((item) => item.id !== "ev_campus_readme");
    expect(rowFor(state, "api").status).toBe("partial");
    expect(rowFor(state, "api").evidenceRefs).toEqual(["ev_campus_repo"]);

    const bare = clone(state);
    const project = projectById(bare, "campus_cart");
    project.evidence = project.evidence.filter(
      (item) => item.id !== "ev_campus_readme" && item.id !== "ev_campus_repo",
    );
    expect(rowFor(bare, "api").status).toBe("missing");
  });

  it("does not treat an API capability alone as evidence", () => {
    const state = withCapabilities("campus_cart", ["api"]);
    state.projects[0].evidence = [];
    expect(rowFor(state, "api").status).toBe("missing");
  });

  it("moves database to missing when schema evidence disappears", () => {
    const state = clone(seedState());
    const campus = projectById(state, "campus_cart");
    campus.evidence = campus.evidence.filter((item) => item.id !== "ev_campus_schema");
    const row = rowFor(state, "database");
    expect(row.status).toBe("missing");
    expect(row.evidenceRefs).toEqual([]);
    expect(projectById(state, "campus_cart").capabilities).toContain("database");
  });

  it("requires the database capability and a complete schema for Supported", () => {
    const state = withCapabilities("campus_cart", ["api"]);
    expect(rowFor(state, "database").status).toBe("partial");
  });

  it("derives Database Partial from an incomplete schema without the capability", () => {
    const state = withCapabilities("campus_cart", ["api"]);
    const schema = projectById(state, "campus_cart").evidence.find(
      (item) => item.id === "ev_campus_schema",
    );
    if (!schema) throw new Error("Missing schema fixture");
    schema.metrics = { tableCount: 2, hasPrimaryKey: true, hasForeignKey: false };
    const row = rowFor(state, "database");
    expect(row.status).toBe("partial");
    expect(row.reason).toContain("2 table");
  });

  it("treats failing and uncounted test reports as Partial", () => {
    const hearthstone = "hearthstone_platform_intern";
    const failing = isolatedState("campus_cart");
    const failingReport = projectById(failing, "campus_cart").evidence.find(
      (item) => item.id === "ev_campus_test_note",
    );
    if (!failingReport) throw new Error("Missing test fixture");
    failingReport.metrics = { testPassed: 5, testFailed: 1, testErrors: 0 };
    expect(rowFor(failing, "testing", hearthstone).status).toBe("partial");
    expect(rowFor(isolatedState("campus_cart"), "testing", hearthstone).status).toBe("partial");
  });

  it("requires setup and usage documentation for Supported", () => {
    const hearthstone = "hearthstone_platform_intern";
    const state = withCapabilities("campus_cart", ["documentation", "testing", "api", "containerization"]);
    expect(rowFor(state, "documentation", hearthstone).status).toBe("supported");
    const readme = projectById(state, "campus_cart").evidence.find(
      (item) => item.id === "ev_campus_readme",
    );
    if (!readme) throw new Error("Missing readme fixture");
    readme.metrics = { routeCount: 6, hasSetup: true, hasUsage: false };
    expect(rowFor(state, "documentation", hearthstone).status).toBe("partial");
  });

  it("requires the full input, transformation, and output pipeline description", () => {
    const meridian = "meridian_data_apprentice";
    const state = isolatedState("route_wise");
    expect(rowFor(state, "data_pipeline", meridian).status).toBe("supported");
    const dataset = projectById(state, "route_wise").evidence.find(
      (item) => item.id === "ev_route_dataset",
    );
    if (!dataset) throw new Error("Missing dataset fixture");
    delete dataset.metrics?.pipelineOutput;
    expect(rowFor(state, "data_pipeline", meridian).status).toBe("partial");
  });

  it("covers every opportunity deterministically", () => {
    const state = seedState();
    const statuses: FitStatus[] = ["supported", "partial", "missing"];
    for (const opportunity of state.opportunities) {
      const rows = computeFit(opportunity, state, TODAY);
      expect(rows).toHaveLength(opportunity.requirements.length);
      for (const row of rows) {
        expect(statuses).toContain(row.status);
        if (row.status !== "supported") {
          expect(row.gap).not.toBeNull();
          expect(["verification", "project", "profile"]).toContain(row.gap?.destination);
        } else {
          expect(row.gap).toBeNull();
        }
      }
    }

    const meridian = opportunityById(state, "meridian_data_apprentice");
    expect(computeFit(meridian, state, TODAY).every((row) => row.status === "supported")).toBe(true);

    const blueHarbor = opportunityById(state, "blue_harbor_junior_swe");
    const missingRows = computeFit(blueHarbor, state, TODAY).filter(
      (row) => row.status === "missing",
    );
    expect(missingRows.length).toBeGreaterThanOrEqual(2);
  });

  it("prefers verified evidence, then newer evidence, then portfolio order", () => {
    const state = isolatedState();
    const opportunity = customOpportunity(["api"]);
    const baseProject = projectById(state, "campus_cart");
    const makeProject = (id: string, name: string, evidence: EvidenceItem[]) => ({
      ...clone(baseProject),
      id,
      name,
      capabilities: ["api" as const],
      evidence,
    });
    const readme = (id: string, projectId: string, addedAt: string, source: "linked" | "verified") => ({
      id,
      projectId,
      kind: "readme" as const,
      label: "Route table",
      location: "README.md",
      summary: "Routes.",
      source,
      addedAt,
      metrics: { routeCount: 4, hasSetup: true, hasUsage: true },
    });

    const verified = {
      ...state,
      projects: [
        makeProject("project_a", "Alpha", [readme("ev_a", "project_a", "2026-10-20T00:00:00.000Z", "linked")]),
        makeProject("project_b", "Beta", [readme("ev_b", "project_b", "2026-10-19T00:00:00.000Z", "verified")]),
      ],
    };
    expect(computeFit(opportunity, verified, TODAY)[0].evidenceRefs).toEqual(["ev_b"]);

    const newer = {
      ...state,
      projects: [
        makeProject("project_a", "Alpha", [readme("ev_a", "project_a", "2026-10-18T00:00:00.000Z", "linked")]),
        makeProject("project_b", "Beta", [readme("ev_b", "project_b", "2026-10-20T00:00:00.000Z", "linked")]),
      ],
    };
    expect(computeFit(opportunity, newer, TODAY)[0].evidenceRefs).toEqual(["ev_b"]);

    const sameTime = {
      ...state,
      projects: [
        makeProject("project_a", "Alpha", [readme("ev_a", "project_a", "2026-10-20T00:00:00.000Z", "linked")]),
        makeProject("project_b", "Beta", [readme("ev_b", "project_b", "2026-10-20T00:00:00.000Z", "linked")]),
      ],
    };
    expect(computeFit(opportunity, sameTime, TODAY)[0].evidenceRefs).toEqual(["ev_a"]);
  });

  it("keeps generated actions grounded in the fit rows", () => {
    const state = seedState();
    const actions = actionsFor(state);
    expect(actions).toHaveLength(3);
    expect(actions[0].requirementId).toBe(
      northstar(state).requirements.find((item) => item.capability === "containerization")?.id,
    );
    expect(actions.every((action) => action.sourceLabel === northstar(state).source.label)).toBe(true);
  });

  it("counts evidence coverage by requirement, not evidence items", () => {
    const state = clone(seedState());
    const campus = projectById(state, "campus_cart");
    campus.evidence.push({
      ...campus.evidence[0],
      id: "ev_duplicate_repository",
      label: "Another repository",
    });
    expect(coverageForOpportunity(state).supported).toBe(2);
    expect(
      coverageForOpportunity(withEvidence("campus_cart", campus.evidence)).supported,
    ).toBe(2);
  });
});
