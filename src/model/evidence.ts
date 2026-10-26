import { isValidDateOnly, parseDateOnly } from "./dates";
import type { EvidenceItem, EvidenceKind, EvidenceMetrics } from "./types";

export interface EvidenceDraft {
  id?: string;
  projectId: string;
  kind: EvidenceKind;
  label: string;
  location: string;
  summary: string;
  routeCount: string;
  hasSetup: boolean;
  hasUsage: boolean;
  tableCount: string;
  hasPrimaryKey: boolean;
  hasForeignKey: boolean;
  testPassed: string;
  testFailed: string;
  testErrors: string;
  pipelineInput: string;
  pipelineTransformation: string;
  pipelineOutput: string;
  healthPath: string;
  healthResponse: string;
  platform: string;
  deployLog: string;
  capturedDate: string;
  source?: "linked" | "verified";
  addedAt?: string;
  verifiedAt?: string;
}

export function newEvidenceId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `ev_${crypto.randomUUID()}`;
  }
  return `ev_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function blankDraft(projectId: string, kind: EvidenceKind = "repository"): EvidenceDraft {
  return {
    projectId,
    kind,
    label: "",
    location: "",
    summary: "",
    routeCount: "",
    hasSetup: false,
    hasUsage: false,
    tableCount: "",
    hasPrimaryKey: false,
    hasForeignKey: false,
    testPassed: "",
    testFailed: "",
    testErrors: "",
    pipelineInput: "",
    pipelineTransformation: "",
    pipelineOutput: "",
    healthPath: "",
    healthResponse: "",
    platform: "Render",
    deployLog: "",
    capturedDate: "",
  };
}

export function draftFromEvidence(evidence: EvidenceItem): EvidenceDraft {
  const metrics = evidence.metrics ?? {};
  return {
    ...blankDraft(evidence.projectId, evidence.kind),
    id: evidence.id,
    label: evidence.label,
    location: evidence.location,
    summary: evidence.summary,
    routeCount: metrics.routeCount === undefined ? "" : String(metrics.routeCount),
    hasSetup: metrics.hasSetup ?? false,
    hasUsage: metrics.hasUsage ?? false,
    tableCount: metrics.tableCount === undefined ? "" : String(metrics.tableCount),
    hasPrimaryKey: metrics.hasPrimaryKey ?? false,
    hasForeignKey: metrics.hasForeignKey ?? false,
    testPassed: metrics.testPassed === undefined ? "" : String(metrics.testPassed),
    testFailed: metrics.testFailed === undefined ? "" : String(metrics.testFailed),
    testErrors: metrics.testErrors === undefined ? "" : String(metrics.testErrors),
    pipelineInput: metrics.pipelineInput ?? "",
    pipelineTransformation: metrics.pipelineTransformation ?? "",
    pipelineOutput: metrics.pipelineOutput ?? "",
    healthPath: metrics.healthPath ?? "",
    healthResponse: metrics.healthResponse ?? "",
    platform: metrics.platform ?? "Render",
    deployLog: metrics.deployLog ?? "",
    capturedDate: metrics.capturedDate ?? "",
    source: evidence.source,
    addedAt: evidence.addedAt,
    verifiedAt: evidence.verifiedAt,
  };
}

export interface EvidenceValidationResult {
  errors: Record<string, string>;
  evidence?: EvidenceItem;
}

function trimmed(value: string): string {
  return value.trim();
}

function integer(value: string): number | null {
  if (!/^\d+$/.test(value.trim())) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

function countText(errors: Record<string, string>, key: string, message: string): void {
  if (!errors[key]) errors[key] = message;
}

export function validateEvidenceDraft(
  draft: EvidenceDraft,
  today: string,
): EvidenceValidationResult {
  const errors: Record<string, string> = {};
  if (draft.kind === "containerization") {
    errors.kind = "Containerization evidence can only be created by the verification gate.";
  }

  const label = trimmed(draft.label);
  const location = trimmed(draft.location);
  const summary = trimmed(draft.summary);

  if (label.length < 2 || label.length > 80) {
    errors.label = "Label must be 2–80 characters.";
  }
  if (location.length < 2 || location.length > 500) {
    errors.location = "Location or note must be 2–500 characters.";
  }
  if (summary.length > 500) {
    errors.summary = "Summary must be 500 characters or fewer.";
  }
  if (draft.kind === "contribution" && (summary.length < 2 || summary.length > 500)) {
    errors.summary = "Contribution summary must be 2–500 characters.";
  }

  const metrics: EvidenceMetrics = {};

  if (draft.kind === "readme") {
    if (draft.routeCount.trim()) {
      const routeCount = integer(draft.routeCount);
      if (routeCount === null || routeCount < 0 || routeCount > 999) {
        countText(errors, "routeCount", "Route count must be a whole number from 0 to 999.");
      } else {
        metrics.routeCount = routeCount;
      }
    }
    metrics.hasSetup = draft.hasSetup;
    metrics.hasUsage = draft.hasUsage;
  }

  if (draft.kind === "schema") {
    const tableCount = integer(draft.tableCount);
    if (tableCount === null || tableCount < 1 || tableCount > 99) {
      countText(errors, "tableCount", "Table count must be a whole number from 1 to 99.");
    } else {
      metrics.tableCount = tableCount;
    }
    metrics.hasPrimaryKey = draft.hasPrimaryKey;
    metrics.hasForeignKey = draft.hasForeignKey;
  }

  if (draft.kind === "test_report") {
    const hasAny = Boolean(
      draft.testPassed.trim() || draft.testFailed.trim() || draft.testErrors.trim(),
    );
    if (hasAny) {
      const passed = integer(draft.testPassed);
      const failed = integer(draft.testFailed);
      const errorsCount = integer(draft.testErrors);
      if (
        passed === null ||
        failed === null ||
        errorsCount === null ||
        passed < 0 ||
        failed < 0 ||
        errorsCount < 0 ||
        passed > 99_999 ||
        failed > 99_999 ||
        errorsCount > 99_999
      ) {
        countText(errors, "testCounts", "All three test counts must be whole numbers from 0 to 99,999.");
      } else if (passed === 0) {
        countText(errors, "testCounts", "Passed count must be greater than zero when counts are provided.");
      } else {
        metrics.testPassed = passed;
        metrics.testFailed = failed;
        metrics.testErrors = errorsCount;
      }
    }
  }

  if (draft.kind === "deployment") {
    if (!/^https:\/\//i.test(location)) {
      errors.location = "Live URL must start with https://.";
    } else {
      try {
        const url = new URL(location);
        if (!url.hostname) errors.location = "Live URL must contain a host.";
      } catch {
        errors.location = "Live URL must be a valid HTTPS URL.";
      }
    }
    if (!/^\/\S{0,99}$/.test(draft.healthPath) || draft.healthPath.length > 100) {
      errors.healthPath = "Health path must start with / and contain no whitespace.";
    } else {
      metrics.healthPath = draft.healthPath;
    }
    const response = trimmed(draft.healthResponse);
    if (
      response.length < 1 ||
      response.length > 200 ||
      !/\b(status:\s*ok|ok|healthy|up)\b/i.test(response)
    ) {
      errors.healthResponse = "Observed response must contain ok, healthy, or up.";
    } else {
      metrics.healthResponse = response;
    }
    if (!["Render", "Railway", "Fly.io", "Vercel", "Other"].includes(draft.platform)) {
      errors.platform = "Choose a supported platform.";
    } else {
      metrics.platform = draft.platform as EvidenceMetrics["platform"];
    }
    if (draft.deployLog.length < 10 || draft.deployLog.length > 1_000) {
      errors.deployLog = "Deploy log excerpt must be 10–1,000 characters.";
    } else {
      metrics.deployLog = draft.deployLog;
    }
    if (!isValidDateOnly(draft.capturedDate)) {
      errors.capturedDate = "Captured date must be a valid date.";
    } else if (parseDateOnly(draft.capturedDate).getTime() > parseDateOnly(today).getTime()) {
      errors.capturedDate = "Captured date cannot be in the future.";
    } else {
      metrics.capturedDate = draft.capturedDate;
    }
  }

  if (draft.kind === "dataset") {
    const hasAny = Boolean(
      draft.pipelineInput.trim() ||
        draft.pipelineTransformation.trim() ||
        draft.pipelineOutput.trim(),
    );
    if (hasAny) {
      const values = [
        ["pipelineInput", trimmed(draft.pipelineInput)],
        ["pipelineTransformation", trimmed(draft.pipelineTransformation)],
        ["pipelineOutput", trimmed(draft.pipelineOutput)],
      ] as const;
      for (const [, value] of values) {
        if (value.length < 2 || value.length > 200) {
          countText(errors, "pipelineFields", "All pipeline fields are required, 2–200 characters.");
        }
      }
      if (!errors.pipelineFields) {
        metrics.pipelineInput = trimmed(draft.pipelineInput);
        metrics.pipelineTransformation = trimmed(draft.pipelineTransformation);
        metrics.pipelineOutput = trimmed(draft.pipelineOutput);
      }
    }
  }

  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  return {
    errors,
    evidence: {
      id: draft.id ?? "",
      projectId: draft.projectId,
      kind: draft.kind,
      label,
      location,
      summary,
      source: draft.source ?? "linked",
      addedAt: draft.addedAt ?? "",
      ...(draft.verifiedAt ? { verifiedAt: draft.verifiedAt } : {}),
      ...(Object.keys(metrics).length > 0 ? { metrics } : {}),
    },
  };
}
