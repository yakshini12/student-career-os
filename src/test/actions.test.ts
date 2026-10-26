import { describe, expect, it } from "vitest";
import { generateActions, isRecordedOnly } from "../model/actions";
import { computeFit } from "../model/fit";
import { daysLeft, localToday, urgencyFor } from "../model/dates";
import { reduceWorkspace } from "../model/state";
import { COMPLETE_BUNDLE, INCOMPLETE_BUNDLE } from "../model/verification";
import type { ArtifactBundle, EvidenceItem, WorkspaceState } from "../model/types";
import {
  TODAY,
  actionsFor,
  clone,
  customOpportunity,
  fitFor,
  isolatedState,
  northstar,
  opportunityById,
  projectById,
  seedState,
} from "./helpers";

const RUN_AT = "2026-10-26T09:00:00.000Z";

function submitted(bundle: ArtifactBundle): WorkspaceState {
  return reduceWorkspace(seedState(), {
    type: "SUBMIT_ARTIFACT",
    bundle,
    submittedAt: "2026-10-26T08:30:00.000Z",
  });
}

function passedSeed(): WorkspaceState {
  return reduceWorkspace(submitted(COMPLETE_BUNDLE), {
    type: "RUN_VERIFICATION",
    runAt: RUN_AT,
  });
}

function deploymentEvidence(): EvidenceItem {
  return {
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
  };
}

function contributionEvidence(): EvidenceItem {
  return {
    id: "ev_test_contribution",
    projectId: "campus_cart",
    kind: "contribution",
    label: "Pairing note",
    location: "notes/pairing.md",
    summary: "Paired with a teammate on the API review.",
    source: "linked",
    addedAt: RUN_AT,
  };
}

describe("action plan", () => {
  it("ranks the initial Northstar actions with the documented arithmetic", () => {
    const actions = actionsFor(seedState());
    expect(actions.map((action) => [action.capability, action.score])).toEqual([
      ["containerization", 7.5],
      ["deployment", 3.0],
      ["dsa", 3.0],
    ]);
    expect(actions[0].urgency).toBe(3);
    expect(actions[1].impact).toBeGreaterThan(actions[2].impact);
  });

  it("lets deployment win the impact tie", () => {
    const actions = actionsFor(seedState());
    expect(actions[1].capability).toBe("deployment");
    expect(actions[2].capability).toBe("dsa");
  });

  it("puts deployment first and drops containerization after a passing run", () => {
    const state = passedSeed();
    const actions = actionsFor(state);
    expect(actions[0].capability).toBe("deployment");
    expect(actions[1].capability).toBe("dsa");
    expect(actions.some((action) => action.capability === "containerization")).toBe(false);
  });

  it("asks the student to run a pending container verification", () => {
    const actions = actionsFor(submitted(INCOMPLETE_BUNDLE));
    expect(actions[0].capability).toBe("containerization");
    expect(actions[0].title).toBe("Run pending container verification.");
    expect(actions[0].destination).toBe("verification");
  });

  it("removes the deployment action once complete deployment evidence exists", () => {
    const state = clone(seedState());
    projectById(state, "campus_cart").evidence.push(deploymentEvidence());
    const actions = actionsFor(state);
    expect(actions.some((action) => action.capability === "deployment")).toBe(false);
    expect(actions[0].capability).toBe("containerization");
    expect(fitFor(state).find((row) => row.capability === "deployment")?.status).toBe("partial");
  });

  it("removes the collaboration action once contribution evidence exists", () => {
    const state = isolatedState("campus_cart");
    const commons = opportunityById(state, "commons_backend_fellow");
    const before = generateActions(commons, computeFit(commons, state, TODAY), state, TODAY);
    expect(before.some((action) => action.capability === "collaboration")).toBe(true);

    state.projects[0].evidence.push(contributionEvidence());
    const after = generateActions(commons, computeFit(commons, state, TODAY), state, TODAY);
    expect(after.some((action) => action.capability === "collaboration")).toBe(false);
    expect(
      after.every((action) => !isRecordedOnly(fitFor(state, commons).find((row) => row.capability === action.capability)!)),
    ).toBe(true);
  });

  it("applies urgency boundaries at 7, 8, 21, and 22 days", () => {
    const midnight = new Date(2026, 9, 26, 0, 0, 0);
    expect(localToday(midnight)).toBe(TODAY);
    expect(daysLeft("2026-11-02", TODAY)).toBe(7);
    expect(urgencyFor("2026-11-02", TODAY)).toBe(3);
    expect(urgencyFor("2026-11-03", TODAY)).toBe(2);
    expect(urgencyFor("2026-11-16", TODAY)).toBe(2);
    expect(urgencyFor("2026-11-17", TODAY)).toBe(1);
    expect(urgencyFor(TODAY, TODAY)).toBe(3);
  });

  it("treats a null deadline as urgency 1 and ranks those actions last", () => {
    expect(urgencyFor(null, TODAY)).toBe(1);
    const state = isolatedState("campus_cart");
    const soon = customOpportunity(["containerization"], { id: "soon", deadline: TODAY });
    const noDeadline = customOpportunity(["containerization"], {
      id: "none",
      deadline: null,
    });
    const soonAction = generateActions(soon, computeFit(soon, state, TODAY), state, TODAY)[0];
    const noneAction = generateActions(
      noDeadline,
      computeFit(noDeadline, state, TODAY),
      state,
      TODAY,
    )[0];
    expect(soonAction.urgency).toBe(3);
    expect(noneAction.urgency).toBe(1);
    expect(noneAction.score).toBeLessThan(soonAction.score);
  });

  it("returns no actions when every requirement is supported", () => {
    const state = seedState();
    const opportunity = customOpportunity(["api"]);
    expect(generateActions(opportunity, computeFit(opportunity, state, TODAY), state, TODAY)).toEqual(
      [],
    );
  });

  it("gives every action a real destination and the opportunity source label", () => {
    const state = seedState();
    for (const opportunity of state.opportunities) {
      const actions = generateActions(
        opportunity,
        computeFit(opportunity, state, TODAY),
        state,
        TODAY,
      );
      for (const action of actions) {
        expect(["verification", "project", "profile"]).toContain(action.destination);
        expect(action.sourceLabel).toBe(opportunity.source.label);
        expect(action.requirementId.startsWith(`${opportunity.id}_`)).toBe(true);
        if (action.destination === "project") {
          expect(action.evidenceKind).toBeDefined();
        }
      }
    }
  });

  it("keeps the seeded Northstar source label untouched", () => {
    expect(actionsFor(seedState()).every((action) => action.sourceLabel === "Sample — not live")).toBe(
      true,
    );
    expect(northstar(seedState()).source.label).toBe("Sample — not live");
  });
});
