import { describe, expect, it } from "vitest";
import {
  blankDraft,
  validateEvidenceDraft,
  type EvidenceDraft,
} from "../model/evidence";
import { reduceWorkspace } from "../model/state";
import type { EvidenceKind } from "../model/types";
import { TODAY, clone, projectById, seedState } from "./helpers";

function draftFor(kind: EvidenceKind): EvidenceDraft {
  return {
    ...blankDraft("campus_cart", kind),
    label: "Synthetic evidence",
    location: "notes/evidence.md",
    summary: "A synthetic record used by the validation tests.",
  };
}

function deploymentDraft(): EvidenceDraft {
  return {
    ...draftFor("deployment"),
    location: "https://campuscart.example.invalid",
    healthPath: "/health",
    healthResponse: "status: ok",
    platform: "Render",
    deployLog: "Build completed and service started on port 5000.",
    capturedDate: TODAY,
  };
}

function testReportDraft(passed: string, failed: string, errors: string): EvidenceDraft {
  return {
    ...draftFor("test_report"),
    testPassed: passed,
    testFailed: failed,
    testErrors: errors,
  };
}

function datasetDraft(input: string, transformation: string, output: string): EvidenceDraft {
  return {
    ...draftFor("dataset"),
    pipelineInput: input,
    pipelineTransformation: transformation,
    pipelineOutput: output,
  };
}

const kinds: EvidenceKind[] = [
  "repository",
  "readme",
  "schema",
  "test_report",
  "deployment",
  "dataset",
  "contribution",
  "other",
];

describe("evidence form validation", () => {
  it("rejects the missing label and location for every evidence kind", () => {
    for (const kind of kinds) {
      const { errors } = validateEvidenceDraft(blankDraft("campus_cart", kind), TODAY);
      expect(errors.label, kind).toBeDefined();
      expect(errors.location, kind).toBeDefined();
    }
  });

  it("rejects a schema without a table count", () => {
    const { errors, evidence } = validateEvidenceDraft(draftFor("schema"), TODAY);
    expect(errors.tableCount).toBeDefined();
    expect(evidence).toBeUndefined();
  });

  it("rejects containerization evidence from the manual form", () => {
    const { errors } = validateEvidenceDraft(draftFor("containerization"), TODAY);
    expect(errors.kind).toContain("verification gate");
  });

  it("rejects an HTTP deployment URL and accepts HTTPS", () => {
    const http = { ...deploymentDraft(), location: "http://campuscart.example.invalid" };
    expect(validateEvidenceDraft(http, TODAY).errors.location).toContain("https://");
    expect(validateEvidenceDraft(deploymentDraft(), TODAY).errors).toEqual({});
  });

  it("requires a health path that starts with a slash", () => {
    const invalid = { ...deploymentDraft(), healthPath: "health" };
    expect(validateEvidenceDraft(invalid, TODAY).errors.healthPath).toBeDefined();
    const spaced = { ...deploymentDraft(), healthPath: "/health check" };
    expect(validateEvidenceDraft(spaced, TODAY).errors.healthPath).toBeDefined();
    expect(validateEvidenceDraft(deploymentDraft(), TODAY).errors.healthPath).toBeUndefined();
  });

  it("requires an accepted health token in the observed response", () => {
    const invalid = { ...deploymentDraft(), healthResponse: "something happened" };
    expect(validateEvidenceDraft(invalid, TODAY).errors.healthResponse).toBeDefined();
    for (const response of ["ok", "healthy", "UP", "status: ok"]) {
      expect(
        validateEvidenceDraft({ ...deploymentDraft(), healthResponse: response }, TODAY).errors,
      ).toEqual({});
    }
  });

  it("rejects a future captured date and accepts today", () => {
    const future = { ...deploymentDraft(), capturedDate: "2026-10-27" };
    expect(validateEvidenceDraft(future, TODAY).errors.capturedDate).toBeDefined();
    const today = { ...deploymentDraft(), capturedDate: TODAY };
    expect(validateEvidenceDraft(today, TODAY).errors).toEqual({});
  });

  it("validates optional test counts as a group", () => {
    expect(validateEvidenceDraft(testReportDraft("5", "", ""), TODAY).errors.testCounts).toBeDefined();
    expect(validateEvidenceDraft(testReportDraft("0", "0", "0"), TODAY).errors.testCounts).toBeDefined();
    expect(validateEvidenceDraft(testReportDraft("-1", "0", "0"), TODAY).errors.testCounts).toBeDefined();
    expect(validateEvidenceDraft(testReportDraft("5", "0", "0"), TODAY).errors).toEqual({});
  });

  it("saves a test report without counts as a partial record", () => {
    const result = validateEvidenceDraft(draftFor("test_report"), TODAY);
    expect(result.errors).toEqual({});
    expect(result.evidence?.metrics).toBeUndefined();
  });

  it("requires all dataset pipeline fields once any is provided", () => {
    expect(
      validateEvidenceDraft(datasetDraft("Raw CSV", "", ""), TODAY).errors.pipelineFields,
    ).toBeDefined();
    expect(
      validateEvidenceDraft(
        datasetDraft("Raw CSV", "Clean and aggregate", "Route summary"),
        TODAY,
      ).errors,
    ).toEqual({});
  });

  it("saves a dataset without pipeline fields as a partial record", () => {
    const result = validateEvidenceDraft(draftFor("dataset"), TODAY);
    expect(result.errors).toEqual({});
    expect(result.evidence?.metrics).toBeUndefined();
  });

  it("dispatches one add and leaves the unrelated project untouched", () => {
    const state = clone(seedState());
    const studyBefore = projectById(state, "study_sync").evidence.length;
    const campusBefore = projectById(state, "campus_cart").evidence.length;

    const draft: EvidenceDraft = {
      ...draftFor("readme"),
      routeCount: "8",
      hasSetup: true,
      hasUsage: true,
    };
    const result = validateEvidenceDraft(draft, TODAY);
    expect(result.errors).toEqual({});
    if (!result.evidence) throw new Error("Expected valid evidence");

    const next = reduceWorkspace(state, {
      type: "ADD_EVIDENCE",
      evidence: {
        ...result.evidence,
        id: "ev_new_readme",
        addedAt: "2026-10-26T09:00:00.000Z",
      },
    });

    expect(projectById(next, "campus_cart").evidence).toHaveLength(campusBefore + 1);
    expect(projectById(next, "study_sync").evidence).toHaveLength(studyBefore);
    expect(projectById(next, "campus_cart").evidence.map((item) => item.id)).toContain(
      "ev_new_readme",
    );
  });
});
