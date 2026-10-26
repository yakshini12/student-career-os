import { urgencyFor } from "./dates";
import type {
  Capability,
  EvidenceKind,
  FitRow,
  FitStatus,
  Opportunity,
  RankedAction,
  WorkspaceState,
} from "./types";

const impact: Record<Capability, number> = {
  containerization: 5,
  api: 4,
  database: 4,
  deployment: 4,
  dsa: 3,
  testing: 3,
  data_pipeline: 3,
  documentation: 2,
  collaboration: 2,
};

const effort: Record<Capability, number> = {
  documentation: 1,
  containerization: 2,
  testing: 2,
  collaboration: 2,
  api: 3,
  database: 3,
  dsa: 3,
  data_pipeline: 3,
  deployment: 4,
};

function projectName(state: WorkspaceState, projectId?: string): string {
  return state.projects.find((project) => project.id === projectId)?.name ?? "CampusCart";
}

function firstProjectId(state: WorkspaceState, capability: Capability, fallback?: string): string {
  return (
    fallback ??
    state.projects.find((project) => project.capabilities.includes(capability))?.id ??
    state.projects[0].id
  );
}

function titleFor(row: FitRow, state: WorkspaceState): string {
  const target = projectName(state, row.gap?.projectId);
  switch (row.capability) {
    case "containerization":
      return row.status === "partial"
        ? "Run pending container verification."
        : "Containerize CampusCart";
    case "deployment":
      return "Log deployment evidence";
    case "dsa":
      return "Strengthen DSA topic coverage";
    case "api":
      return `Document ${target} API`;
    case "database":
      return `Document ${target} schema`;
    case "testing":
      return `Capture a ${target} test report`;
    case "documentation":
      return `Complete ${target} documentation`;
    case "data_pipeline":
      return `Describe the ${target} pipeline`;
    case "collaboration":
      return `Record ${target} collaboration evidence`;
  }
}

function artifactFor(capability: Capability): string {
  switch (capability) {
    case "containerization":
      return "A Dockerfile and README commands submitted to the verification gate.";
    case "deployment":
      return "A deployment record with URL, health path, observed response, platform, log excerpt, and captured date.";
    case "dsa":
      return "A visible DSA calculation and guidance; seeded practice data is read-only in this prototype.";
    case "api":
      return "A README route table with at least 3 endpoints.";
    case "database":
      return "A schema with at least 2 tables, a primary key, and a foreign key.";
    case "testing":
      return "A captured test report with passing checks and no failures or errors.";
    case "documentation":
      return "A README with both setup and usage content.";
    case "data_pipeline":
      return "A dataset or README describing the pipeline input, transformation, and output.";
    case "collaboration":
      return "A contribution note recording team work.";
  }
}

function destinationFor(capability: Capability): "verification" | "project" | "profile" {
  if (capability === "containerization") return "verification";
  if (capability === "dsa") return "profile";
  return "project";
}

function evidenceKindFor(capability: Capability): EvidenceKind | undefined {
  switch (capability) {
    case "api":
    case "documentation":
      return "readme";
    case "database":
      return "schema";
    case "testing":
      return "test_report";
    case "deployment":
      return "deployment";
    case "data_pipeline":
      return "dataset";
    case "collaboration":
      return "contribution";
    default:
      return undefined;
  }
}

function descriptionFor(row: FitRow): string {
  if (row.status === "partial") {
    return `The requirement is partially evidenced. ${row.reason}`;
  }
  return `The requirement has no acceptable evidence yet. ${row.reason}`;
}

function limitationFor(row: FitRow): string {
  return row.limitation;
}

function actionForRow(
  opportunity: Opportunity,
  row: FitRow,
  state: WorkspaceState,
  today: string,
): RankedAction | null {
  if (row.status === "supported") return null;
  if (row.capability === "deployment" && row.status === "partial") return null;
  if (row.capability === "collaboration" && row.status === "partial") return null;

  const targetProjectId =
    row.capability === "containerization" || row.capability === "dsa"
      ? undefined
      : firstProjectId(state, row.capability, row.gap?.projectId);
  const urgency = urgencyFor(opportunity.deadline, today);
  const score = Math.round(((impact[row.capability] * urgency) / effort[row.capability]) * 10) / 10;

  return {
    id: `action_${row.requirementId}`,
    requirementId: row.requirementId,
    requirementLabel: row.requirementLabel,
    requirementStatus: row.status,
    capability: row.capability,
    title: titleFor(row, state),
    description: descriptionFor(row),
    artifact: artifactFor(row.capability),
    sourceLabel: opportunity.source.label,
    targetProjectId,
    evidenceKind: evidenceKindFor(row.capability),
    destination: destinationFor(row.capability),
    impact: impact[row.capability],
    effort: effort[row.capability],
    urgency,
    score,
    limitation: limitationFor(row),
  };
}

function compareActions(a: RankedAction, b: RankedAction, order: Map<string, number>): number {
  if (b.score !== a.score) return b.score - a.score;
  if (b.impact !== a.impact) return b.impact - a.impact;
  if (a.effort !== b.effort) return a.effort - b.effort;
  return (order.get(a.requirementId) ?? 0) - (order.get(b.requirementId) ?? 0);
}

export function generateActions(
  opportunity: Opportunity,
  fit: FitRow[],
  state: WorkspaceState,
  today: string,
): RankedAction[] {
  const order = new Map(opportunity.requirements.map((requirement, index) => [requirement.id, index]));
  return fit
    .map((row) => actionForRow(opportunity, row, state, today))
    .filter((action): action is RankedAction => action !== null)
    .sort((a, b) => compareActions(a, b, order))
    .slice(0, 3);
}

export function isRecordedOnly(row: FitRow): boolean {
  return (
    (row.capability === "deployment" && row.status === "partial") ||
    (row.capability === "collaboration" && row.status === "partial")
  );
}

export function impactFor(capability: Capability): number {
  return impact[capability];
}

export function effortFor(capability: Capability): number {
  return effort[capability];
}

export function fitRowsForStatus(rows: FitRow[], status: FitStatus): FitRow[] {
  return rows.filter((row) => row.status === status);
}
