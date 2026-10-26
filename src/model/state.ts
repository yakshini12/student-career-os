import { SAMPLE_SOURCE_LABEL, buildSeed } from "../data/seed";
import { isValidDateOnly, isValidIsoTimestamp } from "./dates";
import { historySummary, runContainerizationChecks } from "./verification";
import type {
  ApplicationStatus,
  ArtifactBundle,
  Capability,
  EvidenceKind,
  EvidenceSource,
  FitStatus,
  HistoryEntry,
  MilestoneStatus,
  OpportunityCategory,
  Project,
  VerificationResult,
  VerificationStatus,
  WorkspaceState,
} from "./types";

export const STORAGE_KEY = "student-career-os:v1";
export const VERIFIED_EVIDENCE_ID = "ev_campus_container_verified";

export type WorkspaceAction =
  | { type: "SAVE_PROFILE"; profile: WorkspaceState["profile"] }
  | { type: "SET_MILESTONE"; projectId: string; milestoneId: string; status: MilestoneStatus }
  | { type: "ADD_EVIDENCE"; evidence: Project["evidence"][number] }
  | { type: "UPDATE_EVIDENCE"; evidence: Project["evidence"][number] }
  | { type: "REMOVE_EVIDENCE"; evidenceId: string }
  | { type: "SAVE_OPPORTUNITY"; opportunityId: string; updatedAt: string }
  | { type: "UNSAVE_OPPORTUNITY"; opportunityId: string }
  | {
      type: "SET_APPLICATION_STATUS";
      opportunityId: string;
      status: ApplicationStatus;
      updatedAt: string;
    }
  | { type: "SELECT_OPPORTUNITY"; opportunityId: string }
  | { type: "SUBMIT_ARTIFACT"; bundle: ArtifactBundle; submittedAt: string }
  | { type: "EDIT_SUBMISSION"; timestamp: string }
  | { type: "RUN_VERIFICATION"; runAt: string }
  | { type: "RESET"; state: WorkspaceState };

const capabilities: Capability[] = [
  "api",
  "database",
  "dsa",
  "containerization",
  "deployment",
  "testing",
  "documentation",
  "collaboration",
  "data_pipeline",
];

const evidenceKinds: EvidenceKind[] = [
  "repository",
  "readme",
  "schema",
  "test_report",
  "deployment",
  "dataset",
  "contribution",
  "containerization",
  "other",
];

const evidenceSources: EvidenceSource[] = ["linked", "verified"];
const applicationStatuses: ApplicationStatus[] = [
  "saved",
  "preparing",
  "applied",
  "interviewing",
  "closed",
];
const verificationStatuses: VerificationStatus[] = ["unsupported", "pending", "supported"];
const milestoneStatuses: MilestoneStatus[] = ["not_started", "in_progress", "done"];
const opportunityCategories: OpportunityCategory[] = [
  "internship",
  "apprenticeship",
  "fellowship",
  "job",
  "hackathon",
];
const fitStatuses: FitStatus[] = ["supported", "partial", "missing"];

function historyEntry(
  state: WorkspaceState,
  timestamp: string,
  previous: VerificationStatus,
  next: VerificationStatus,
  checkSummary: string,
): HistoryEntry {
  return {
    id: `hist_${Date.parse(timestamp) || 0}_${state.history.length + 1}`,
    timestamp,
    requirement: "containerization",
    previous,
    next,
    checkSummary,
  };
}

function withHistory(
  state: WorkspaceState,
  timestamp: string,
  previous: VerificationStatus,
  next: VerificationStatus,
  checkSummary: string,
): HistoryEntry[] {
  return [
    ...state.history,
    historyEntry(state, timestamp, previous, next, checkSummary),
  ];
}

function updateProject(
  state: WorkspaceState,
  projectId: string,
  update: (project: Project) => Project,
): Project[] {
  return state.projects.map((project) => (project.id === projectId ? update(project) : project));
}

export function reduceWorkspace(state: WorkspaceState, action: WorkspaceAction): WorkspaceState {
  switch (action.type) {
    case "SAVE_PROFILE":
      return { ...state, profile: action.profile };

    case "SET_MILESTONE":
      return {
        ...state,
        projects: updateProject(state, action.projectId, (project) => ({
          ...project,
          milestones: project.milestones.map((milestone) =>
            milestone.id === action.milestoneId ? { ...milestone, status: action.status } : milestone,
          ),
        })),
      };

    case "ADD_EVIDENCE": {
      if (action.evidence.kind === "containerization" || action.evidence.source === "verified") {
        return state;
      }
      return {
        ...state,
        projects: updateProject(state, action.evidence.projectId, (project) => ({
          ...project,
          evidence: [...project.evidence, action.evidence],
        })),
      };
    }

    case "UPDATE_EVIDENCE": {
      if (action.evidence.kind === "containerization" || action.evidence.source === "verified") {
        return state;
      }
      const existing = state.projects
        .flatMap((project) => project.evidence)
        .find((item) => item.id === action.evidence.id);
      if (!existing || existing.kind === "containerization" || existing.source === "verified") {
        return state;
      }
      return {
        ...state,
        projects: state.projects.map((project) => ({
          ...project,
          evidence: project.evidence.map((item) =>
            item.id === action.evidence.id ? action.evidence : item,
          ),
        })),
      };
    }

    case "REMOVE_EVIDENCE": {
      const existing = state.projects
        .flatMap((project) => project.evidence)
        .find((item) => item.id === action.evidenceId);
      if (!existing || existing.kind === "containerization" || existing.source === "verified") {
        return state;
      }
      return {
        ...state,
        projects: state.projects.map((project) => ({
          ...project,
          evidence: project.evidence.filter((item) => item.id !== action.evidenceId),
        })),
      };
    }

    case "SAVE_OPPORTUNITY": {
      if (!state.opportunities.some((opportunity) => opportunity.id === action.opportunityId)) {
        return state;
      }
      if (state.applications[action.opportunityId]) return state;
      return {
        ...state,
        applications: {
          ...state.applications,
          [action.opportunityId]: { status: "saved", updatedAt: action.updatedAt },
        },
      };
    }

    case "UNSAVE_OPPORTUNITY": {
      if (!state.applications[action.opportunityId]) return state;
      const applications = { ...state.applications };
      delete applications[action.opportunityId];
      return { ...state, applications };
    }

    case "SET_APPLICATION_STATUS": {
      if (!state.opportunities.some((opportunity) => opportunity.id === action.opportunityId)) {
        return state;
      }
      return {
        ...state,
        applications: {
          ...state.applications,
          [action.opportunityId]: { status: action.status, updatedAt: action.updatedAt },
        },
      };
    }

    case "SELECT_OPPORTUNITY":
      if (!state.opportunities.some((opportunity) => opportunity.id === action.opportunityId)) {
        return state;
      }
      return { ...state, selectedOpportunityId: action.opportunityId };

    case "SUBMIT_ARTIFACT":
      if (state.verification.status !== "unsupported") return state;
      return {
        ...state,
        verification: {
          ...state.verification,
          status: "pending",
          bundle: action.bundle,
          submittedAt: action.submittedAt,
          lastResult: null,
          verifiedAt: null,
          verifiedEvidenceId: null,
        },
        history: withHistory(
          state,
          action.submittedAt,
          "unsupported",
          "pending",
          "Submitted for verification; not run.",
        ),
      };

    case "EDIT_SUBMISSION":
      if (state.verification.status !== "pending") return state;
      return {
        ...state,
        verification: {
          ...state.verification,
          status: "unsupported",
          bundle: null,
          submittedAt: null,
          lastResult: null,
          verifiedAt: null,
          verifiedEvidenceId: null,
        },
        history: withHistory(
          state,
          action.timestamp,
          "pending",
          "unsupported",
          "Submission withdrawn.",
        ),
      };

    case "RUN_VERIFICATION": {
      if (state.verification.status !== "pending" || !state.verification.bundle) return state;
      const result: VerificationResult = runContainerizationChecks(
        state.verification.bundle,
        action.runAt,
      );
      if (!result.passed) {
        return {
          ...state,
          verification: {
            ...state.verification,
            status: "unsupported",
            lastResult: result,
            verifiedAt: null,
            verifiedEvidenceId: null,
          },
          history: withHistory(
            state,
            action.runAt,
            "pending",
            "unsupported",
            historySummary(result),
          ),
        };
      }

      const verifiedEvidence = {
        id: VERIFIED_EVIDENCE_ID,
        projectId: "campus_cart",
        kind: "containerization" as const,
        label: "Verified containerization bundle",
        location: "Dockerfile + README commands",
        summary: "8/8 checks passed on the submitted bundle.",
        source: "verified" as const,
        addedAt: action.runAt,
        verifiedAt: action.runAt,
      };

      return {
        ...state,
        projects: updateProject(state, "campus_cart", (project) => ({
          ...project,
          evidence: project.evidence.some((item) => item.id === VERIFIED_EVIDENCE_ID)
            ? project.evidence
            : [...project.evidence, verifiedEvidence],
          milestones: project.milestones.map((milestone) =>
            milestone.id === "campus_cart_containerize"
              ? { ...milestone, status: "done" }
              : milestone,
          ),
        })),
        verification: {
          ...state.verification,
          status: "supported",
          lastResult: result,
          verifiedAt: action.runAt,
          verifiedEvidenceId: VERIFIED_EVIDENCE_ID,
        },
        history: withHistory(
          state,
          action.runAt,
          "pending",
          "supported",
          historySummary(result),
        ),
      };
    }

    case "RESET":
      return action.state;
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isOneOf<T extends string>(value: unknown, options: T[]): value is T {
  return typeof value === "string" && options.includes(value as T);
}

function isIso(value: unknown): value is string {
  return isString(value) && isValidIsoTimestamp(value);
}

function validProfile(value: unknown): boolean {
  return (
    isObject(value) &&
    isString(value.name) &&
    value.name.trim().length >= 2 &&
    value.name.length <= 60 &&
    isString(value.targetRole) &&
    value.targetRole.trim().length >= 2 &&
    value.targetRole.length <= 80 &&
    isOneOf(value.targetTimeline, ["3_months", "6_months", "12_months"])
  );
}

function validPractice(value: unknown): boolean {
  if (!isObject(value) || !isObject(value.topics)) return false;
  const topicKeys = ["arrays", "strings", "trees", "linkedLists", "graphs", "dp"];
  const topics = value.topics as Record<string, unknown>;
  return (
    isFiniteNumber(value.totalSolved) &&
    isFiniteNumber(value.sqlSolved) &&
    isFiniteNumber(value.contests) &&
    isFiniteNumber(value.bestRank) &&
    isFiniteNumber(value.rating) &&
    isFiniteNumber(value.recentSubmissions) &&
    topicKeys.every((key) => isFiniteNumber(topics[key]))
  );
}

function validVerificationResult(value: unknown): boolean {
  if (!isObject(value) || !Array.isArray(value.checks) || typeof value.passed !== "boolean") {
    return false;
  }
  if (!isIso(value.runAt)) return false;
  return value.checks.every(
    (check) =>
      isObject(check) &&
      isString(check.id) &&
      isString(check.label) &&
      typeof check.passed === "boolean" &&
      isString(check.inspected) &&
      isString(check.reason),
  );
}

function validVerification(value: unknown, state: WorkspaceState): boolean {
  if (!isObject(value) || !isOneOf(value.status, verificationStatuses)) return false;
  if (
    value.bundle !== null &&
    (!isObject(value.bundle) ||
      !isString(value.bundle.dockerfile) ||
      !isString(value.bundle.readmeCommands))
  ) {
    return false;
  }
  if (value.submittedAt !== null && !isIso(value.submittedAt)) return false;
  if (value.lastResult !== null && !validVerificationResult(value.lastResult)) return false;

  if (value.status === "supported") {
    if (value.verifiedEvidenceId !== VERIFIED_EVIDENCE_ID) return false;
    if (!isIso(value.verifiedAt)) return false;
    const evidence = state.projects
      .flatMap((project) => project.evidence)
      .find((item) => item.id === VERIFIED_EVIDENCE_ID);
    if (!evidence) return false;
    if (evidence.kind !== "containerization" || evidence.source !== "verified") return false;
    if (evidence.projectId !== "campus_cart") return false;
    if (!evidence.verifiedAt || !isIso(evidence.verifiedAt)) return false;
    if (evidence.addedAt !== value.verifiedAt) return false;
    if (evidence.verifiedAt !== value.verifiedAt) return false;
    return true;
  }

  if (value.verifiedEvidenceId !== null || value.verifiedAt !== null) return false;
  if (value.status === "pending" && value.bundle === null) return false;
  return true;
}

export function validateWorkspace(data: unknown): data is WorkspaceState {
  if (!isObject(data)) return false;
  if (data.schemaVersion !== 1 || data.seedVersion !== 1) return false;
  if (!isIso(data.seededAt)) return false;
  if (!validProfile(data.profile) || !validPractice(data.practice)) return false;
  if (!Array.isArray(data.projects) || !Array.isArray(data.opportunities)) return false;
  if (!Array.isArray(data.history)) return false;
  if (!isObject(data.applications)) return false;
  if (!isString(data.selectedOpportunityId)) return false;

  const projectIds = new Set<string>();
  const evidenceIds = new Set<string>();
  for (const project of data.projects) {
    if (!isObject(project)) return false;
    if (!isString(project.id) || projectIds.has(project.id)) return false;
    projectIds.add(project.id);
    if (!isString(project.name) || !isString(project.summary)) return false;
    if (!Array.isArray(project.technologies) || !project.technologies.every(isString)) return false;
    if (!Array.isArray(project.capabilities) || !project.capabilities.every((cap) => isOneOf(cap, capabilities))) {
      return false;
    }
    if (!Array.isArray(project.milestones) || !Array.isArray(project.evidence)) return false;

    const milestoneIds = new Set<string>();
    for (const milestone of project.milestones) {
      if (!isObject(milestone)) return false;
      if (!isString(milestone.id) || milestoneIds.has(milestone.id)) return false;
      milestoneIds.add(milestone.id);
      if (!isString(milestone.label) || !isOneOf(milestone.status, milestoneStatuses)) return false;
      if (milestone.teamContributed !== undefined && typeof milestone.teamContributed !== "boolean") {
        return false;
      }
    }

    for (const evidence of project.evidence) {
      if (!isObject(evidence)) return false;
      if (!isString(evidence.id) || evidenceIds.has(evidence.id)) return false;
      evidenceIds.add(evidence.id);
      if (!isString(evidence.projectId) || evidence.projectId !== project.id) return false;
      if (!isOneOf(evidence.kind, evidenceKinds) || !isOneOf(evidence.source, evidenceSources)) {
        return false;
      }
      if (
        !isString(evidence.label) ||
        !isString(evidence.location) ||
        !isString(evidence.summary) ||
        !isIso(evidence.addedAt)
      ) {
        return false;
      }
      if (evidence.verifiedAt !== undefined && !isIso(evidence.verifiedAt)) return false;
      if (evidence.metrics !== undefined && !isObject(evidence.metrics)) return false;
    }
  }

  const opportunityIds = new Set<string>();
  const requirementIds = new Set<string>();
  for (const opportunity of data.opportunities) {
    if (!isObject(opportunity)) return false;
    if (!isString(opportunity.id) || opportunityIds.has(opportunity.id)) return false;
    opportunityIds.add(opportunity.id);
    if (
      !isString(opportunity.title) ||
      !isString(opportunity.organisation) ||
      !isOneOf(opportunity.category, opportunityCategories) ||
      !isString(opportunity.location) ||
      !isString(opportunity.format) ||
      !isString(opportunity.summary)
    ) {
      return false;
    }
    if (opportunity.deadline !== null && (!isString(opportunity.deadline) || !isValidDateOnly(opportunity.deadline))) {
      return false;
    }
    if (
      !isObject(opportunity.source) ||
      !isOneOf(opportunity.source.type, ["sample", "verified_external"]) ||
      !isString(opportunity.source.label)
    ) {
      return false;
    }
    if (!Array.isArray(opportunity.requirements) || opportunity.requirements.length === 0) return false;
    for (const requirement of opportunity.requirements) {
      if (!isObject(requirement)) return false;
      if (!isString(requirement.id) || requirementIds.has(requirement.id)) return false;
      requirementIds.add(requirement.id);
      if (!isOneOf(requirement.capability, capabilities)) return false;
      if (requirement.id !== `${opportunity.id}_${requirement.capability}`) return false;
      if (!isString(requirement.label) || !isString(requirement.description)) return false;
    }
  }

  if (!data.opportunities.some((opportunity) => opportunity.id === data.selectedOpportunityId)) {
    return false;
  }

  for (const [opportunityId, application] of Object.entries(data.applications)) {
    if (!opportunityIds.has(opportunityId)) return false;
    if (!isObject(application) || !isOneOf(application.status, applicationStatuses)) return false;
    if (!isIso(application.updatedAt)) return false;
  }

  for (const entry of data.history) {
    if (!isObject(entry) || !isString(entry.id) || !isIso(entry.timestamp)) return false;
    if (entry.requirement !== "containerization") return false;
    if (!isOneOf(entry.previous, verificationStatuses) || !isOneOf(entry.next, verificationStatuses)) {
      return false;
    }
    if (!isString(entry.checkSummary)) return false;
  }

  const stateForVerification = data as unknown as WorkspaceState;
  if (!validVerification(data.verification, stateForVerification)) return false;

  return true;
}

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export interface LoadResult {
  state: WorkspaceState;
  persistenceAvailable: boolean;
  notice: string | null;
}

export function saveWorkspace(storage: StorageLike | null, state: WorkspaceState): boolean {
  if (!storage) return false;
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

export function loadWorkspace(
  storage: StorageLike | null,
  today: string,
  now = new Date(),
): LoadResult {
  const seed = buildSeed(today, now.toISOString());
  if (!storage) {
    return { state: seed, persistenceAvailable: false, notice: null };
  }

  let raw: string | null;
  try {
    raw = storage.getItem(STORAGE_KEY);
  } catch {
    return { state: seed, persistenceAvailable: false, notice: null };
  }

  if (!raw) {
    const available = saveWorkspace(storage, seed);
    return { state: seed, persistenceAvailable: available, notice: null };
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    if (validateWorkspace(parsed)) {
      return { state: parsed, persistenceAvailable: true, notice: null };
    }
  } catch {
    // Fall through to reseed with the visible notice.
  }

  const available = saveWorkspace(storage, seed);
  return {
    state: seed,
    persistenceAvailable: available,
    notice: "Saved sample data was reset because it could not be read.",
  };
}

export function isValidFitStatus(value: string): value is FitStatus {
  return fitStatuses.includes(value as FitStatus);
}

export { SAMPLE_SOURCE_LABEL };
