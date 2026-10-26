import {
  LINKED_EVIDENCE_LIMITATION,
  VERIFICATION_LIMITATION,
} from "../data/copy";
import { isValidDateOnly, parseDateOnly } from "./dates";
import type {
  Capability,
  DsaCalculation,
  EvidenceItem,
  FitGap,
  FitRow,
  FitStatus,
  Opportunity,
  Project,
  WorkspaceState,
} from "./types";

interface ProjectEvaluation {
  project: Project;
  status: FitStatus;
  reason: string;
  evidenceRefs: string[];
  gap: FitGap | null;
}

const statusWeight: Record<FitStatus, number> = { supported: 3, partial: 2, missing: 1 };

function evidenceIsVerified(items: EvidenceItem[]): boolean {
  return items.some((item) => item.source === "verified");
}

function newestAddedAt(items: EvidenceItem[]): number {
  return items.reduce((latest, item) => {
    const time = Date.parse(item.addedAt);
    return Number.isFinite(time) ? Math.max(latest, time) : latest;
  }, 0);
}

function chooseStrongest(evaluations: ProjectEvaluation[]): ProjectEvaluation | null {
  if (evaluations.length === 0) return null;
  return evaluations.reduce((best, candidate) => {
    const statusDiff = statusWeight[candidate.status] - statusWeight[best.status];
    if (statusDiff !== 0) return statusDiff > 0 ? candidate : best;

    const verifiedDiff =
      Number(evidenceIsVerified(candidate.project.evidence)) -
      Number(evidenceIsVerified(best.project.evidence));
    if (verifiedDiff !== 0) return verifiedDiff > 0 ? candidate : best;

    const dateDiff =
      newestAddedAt(candidate.project.evidence) - newestAddedAt(best.project.evidence);
    if (dateDiff !== 0) return dateDiff > 0 ? candidate : best;

    return best;
  });
}

function firstProjectWithCapability(state: WorkspaceState, capability: Capability): Project {
  return state.projects.find((project) => project.capabilities.includes(capability)) ?? state.projects[0];
}

function projectForGap(state: WorkspaceState, capability: Capability): string {
  return firstProjectWithCapability(state, capability).id;
}

function findEvidence(project: Project, kind: EvidenceItem["kind"]): EvidenceItem[] {
  return project.evidence.filter((item) => item.kind === kind);
}

export function dsaCalculation(state: WorkspaceState): DsaCalculation {
  const topics = state.practice.topics;
  const coreTopicCount = Object.values(topics).filter((value) => value >= 10).length;
  return {
    totalSolved: state.practice.totalSolved,
    totalSolvedPass: state.practice.totalSolved >= 120,
    coreTopicCount,
    coreTopicsRequired: 4,
    coreTopicsPass: coreTopicCount >= 4,
    contests: state.practice.contests,
    contestsPass: state.practice.contests >= 3,
    topics: { ...topics },
  };
}

function dsaRow(state: WorkspaceState): FitRow {
  const calculation = dsaCalculation(state);
  const passed = [calculation.totalSolvedPass, calculation.coreTopicsPass, calculation.contestsPass];
  const passCount = passed.filter(Boolean).length;
  const status: FitStatus =
    passCount === 3 ? "supported" : passCount > 0 ? "partial" : "missing";
  const reason =
    status === "supported"
      ? `${calculation.totalSolved} solved, ${calculation.coreTopicCount} of 6 core topics at 10+ solves, and ${calculation.contests} contests meet all thresholds.`
      : status === "partial"
        ? `${calculation.totalSolved} solved and ${calculation.contests} contests pass, but only ${calculation.coreTopicCount} of 6 core topics have 10+ solves.`
        : "No practice threshold is met.";
  return {
    requirementId: "",
    requirementLabel: "",
    capability: "dsa",
    status,
    reason,
    evidenceRefs: ["practice"],
    gap:
      status === "supported"
        ? null
        : {
            text: "Strengthen core-topic coverage in Profile & Practice.",
            destination: "profile",
          },
    calculation,
    limitation: "Practice data is seeded and not synced from a coding platform.",
  };
}

function apiEvaluation(project: Project): ProjectEvaluation {
  const hasCapability = project.capabilities.includes("api");
  const readme = findEvidence(project, "readme");
  const apiEvidence = project.evidence.filter((item) =>
    ["readme", "repository", "other"].includes(item.kind),
  );
  const qualifying = readme.find((item) => (item.metrics?.routeCount ?? 0) >= 3);
  if (hasCapability && qualifying) {
    return {
      project,
      status: "supported",
      reason: `${project.name} documents ${qualifying.metrics?.routeCount} endpoints in its README.`,
      evidenceRefs: [qualifying.id],
      gap: null,
    };
  }
  if (hasCapability && apiEvidence.length > 0) {
    const ref = apiEvidence[0];
    return {
      project,
      status: "partial",
      reason: `${project.name} has linked API evidence, but no README lists at least 3 routes.`,
      evidenceRefs: [ref.id],
      gap: {
        text: `Document at least 3 endpoints in ${project.name}’s README.`,
        destination: "project",
        projectId: project.id,
        evidenceKind: "readme",
      },
    };
  }
  return {
    project,
    status: "missing",
    reason: hasCapability
      ? `${project.name} has the API capability but no linked API evidence.`
      : `${project.name} does not record API capability or linked API evidence.`,
    evidenceRefs: [],
    gap: {
      text: `Document ${project.name}’s API in a README.`,
      destination: "project",
      projectId: project.id,
      evidenceKind: "readme",
    },
  };
}

function databaseEvaluation(project: Project): ProjectEvaluation {
  const hasCapability = project.capabilities.includes("database");
  const schemas = findEvidence(project, "schema");
  const schema = schemas[0];
  if (schema) {
    const metrics = schema.metrics ?? {};
    const complete =
      hasCapability &&
      (metrics.tableCount ?? 0) >= 2 &&
      metrics.hasPrimaryKey === true &&
      metrics.hasForeignKey === true;
    if (complete) {
      return {
        project,
        status: "supported",
        reason: `${project.name} has ${metrics.tableCount} tables, primary keys, and a foreign key.`,
        evidenceRefs: [schema.id],
        gap: null,
      };
    }
    return {
      project,
      status: "partial",
      reason: `${project.name} has a schema with ${metrics.tableCount ?? 0} table(s), but does not meet the complete schema threshold.`,
      evidenceRefs: [schema.id],
      gap: {
        text: "Add at least 2 tables, a primary key, and a foreign key.",
        destination: "project",
        projectId: project.id,
        evidenceKind: "schema",
      },
    };
  }
  return {
    project,
    status: "missing",
    reason: hasCapability
      ? `${project.name} has the database capability but no linked schema evidence.`
      : `${project.name} does not record database capability or schema evidence.`,
    evidenceRefs: [],
    gap: {
      text: `Add a complete schema for ${project.name}.`,
      destination: "project",
      projectId: project.id,
      evidenceKind: "schema",
    },
  };
}

function deploymentComplete(item: EvidenceItem, today: string): boolean {
  const metrics = item.metrics ?? {};
  return (
    /^https:\/\//i.test(item.location) &&
    Boolean(metrics.healthPath && /^\/\S+$/.test(metrics.healthPath)) &&
    Boolean(metrics.healthResponse && /\b(status:\s*ok|ok|healthy|up)\b/i.test(metrics.healthResponse)) &&
    Boolean(metrics.platform) &&
    Boolean(metrics.deployLog && metrics.deployLog.length >= 10) &&
    Boolean(metrics.capturedDate && isValidDateOnly(metrics.capturedDate)) &&
    parseDateOnly(metrics.capturedDate ?? "").getTime() <= parseDateOnly(today).getTime()
  );
}

function deploymentEvaluation(project: Project, today: string): ProjectEvaluation {
  const deployments = findEvidence(project, "deployment");
  const complete = deployments.find((item) => deploymentComplete(item, today));
  if (complete) {
    return {
      project,
      status: "partial",
      reason: `${project.name} records a deployment with an observed health response. Live reachability is not verified.`,
      evidenceRefs: [complete.id],
      gap: null,
    };
  }
  return {
    project,
    status: "missing",
    reason:
      deployments.length > 0
        ? `${project.name} has incomplete deployment evidence. Live reachability is not verified.`
        : "No deployment evidence is recorded. Live reachability is not verified.",
    evidenceRefs: deployments.map((item) => item.id),
    gap: {
      text: `Record deployment evidence for ${project.name}.`,
      destination: "project",
      projectId: project.id,
      evidenceKind: "deployment",
    },
  };
}

function testingEvaluation(project: Project): ProjectEvaluation {
  const reports = findEvidence(project, "test_report");
  const passing = reports.find(
    (item) =>
      (item.metrics?.testPassed ?? 0) > 0 &&
      item.metrics?.testFailed === 0 &&
      item.metrics?.testErrors === 0,
  );
  if (passing) {
    return {
      project,
      status: "supported",
      reason: `${project.name} has a test report with ${passing.metrics?.testPassed} passing checks and no failures or errors.`,
      evidenceRefs: [passing.id],
      gap: null,
    };
  }
  if (reports.length > 0) {
    return {
      project,
      status: "partial",
      reason: `${project.name} has a test report with failures, errors, or no captured counts.`,
      evidenceRefs: reports.map((item) => item.id),
      gap: {
        text: `Capture a passing test report for ${project.name}.`,
        destination: "project",
        projectId: project.id,
        evidenceKind: "test_report",
      },
    };
  }
  const mentioningRepo = findEvidence(project, "repository").find((item) =>
    `${item.label} ${item.summary}`.toLowerCase().includes("test"),
  );
  if (mentioningRepo) {
    return {
      project,
      status: "partial",
      reason: `${project.name} links a repository that mentions tests, but no captured report exists.`,
      evidenceRefs: [mentioningRepo.id],
      gap: {
        text: `Capture a passing test report for ${project.name}.`,
        destination: "project",
        projectId: project.id,
        evidenceKind: "test_report",
      },
    };
  }
  return {
    project,
    status: "missing",
    reason: `No captured test report is recorded for ${project.name}.`,
    evidenceRefs: [],
    gap: {
      text: `Capture a test report for ${project.name}.`,
      destination: "project",
      projectId: project.id,
      evidenceKind: "test_report",
    },
  };
}

function documentationEvaluation(project: Project): ProjectEvaluation {
  const readmes = findEvidence(project, "readme");
  const complete = readmes.find(
    (item) => item.metrics?.hasSetup === true && item.metrics?.hasUsage === true,
  );
  if (complete) {
    return {
      project,
      status: "supported",
      reason: `${project.name} README covers setup and usage.`,
      evidenceRefs: [complete.id],
      gap: null,
    };
  }
  const repository = findEvidence(project, "repository");
  if (readmes.length > 0 || repository.length > 0) {
    const ref = readmes[0] ?? repository[0];
    return {
      project,
      status: "partial",
      reason: `${project.name} links documentation or a repository, but setup and usage are not both complete.`,
      evidenceRefs: [ref.id],
      gap: {
        text: `Complete setup and usage documentation for ${project.name}.`,
        destination: "project",
        projectId: project.id,
        evidenceKind: "readme",
      },
    };
  }
  return {
    project,
    status: "missing",
    reason: `No documentation evidence is recorded for ${project.name}.`,
    evidenceRefs: [],
    gap: {
      text: `Add setup and usage documentation for ${project.name}.`,
      destination: "project",
      projectId: project.id,
      evidenceKind: "readme",
    },
  };
}

function collaborationEvaluation(project: Project): ProjectEvaluation {
  const contributions = findEvidence(project, "contribution");
  const teamMilestone = project.milestones.find((milestone) => milestone.teamContributed);
  if (contributions.length > 0 || teamMilestone) {
    return {
      project,
      status: "partial",
      reason: `${project.name} records self-reported collaboration evidence. Supported is unreachable in this prototype.`,
      evidenceRefs: [
        ...contributions.map((item) => item.id),
        ...(teamMilestone ? [teamMilestone.id] : []),
      ],
      gap: {
        text: "Collaboration is recorded but cannot be verified in this prototype.",
        destination: "project",
        projectId: project.id,
        evidenceKind: "contribution",
      },
    };
  }
  return {
    project,
    status: "missing",
    reason: `No collaboration evidence is recorded for ${project.name}.`,
    evidenceRefs: [],
    gap: {
      text: `Record a contribution note for ${project.name}.`,
      destination: "project",
      projectId: project.id,
      evidenceKind: "contribution",
    },
  };
}

function dataPipelineEvaluation(project: Project): ProjectEvaluation {
  const hasCapability = project.capabilities.includes("data_pipeline");
  const items = [...findEvidence(project, "dataset"), ...findEvidence(project, "readme")];
  const complete = items.find(
    (item) =>
      Boolean(item.metrics?.pipelineInput) &&
      Boolean(item.metrics?.pipelineTransformation) &&
      Boolean(item.metrics?.pipelineOutput),
  );
  if (hasCapability && complete) {
    return {
      project,
      status: "supported",
      reason: `${project.name} describes the pipeline input, transformation, and output.`,
      evidenceRefs: [complete.id],
      gap: null,
    };
  }
  if (hasCapability) {
    return {
      project,
      status: "partial",
      reason: `${project.name} has the data-pipeline capability but no complete pipeline description.`,
      evidenceRefs: items.map((item) => item.id),
      gap: {
        text: `Describe the pipeline input, transformation, and output for ${project.name}.`,
        destination: "project",
        projectId: project.id,
        evidenceKind: "dataset",
      },
    };
  }
  return {
    project,
    status: "missing",
    reason: `${project.name} does not record data-pipeline capability or evidence.`,
    evidenceRefs: [],
    gap: {
      text: `Describe a data pipeline for ${project.name}.`,
      destination: "project",
      projectId: project.id,
      evidenceKind: "dataset",
    },
  };
}

function containerizationRow(state: WorkspaceState): FitRow {
  const verified = state.projects
    .flatMap((project) => project.evidence)
    .find((item) => item.kind === "containerization" && item.source === "verified");
  if (state.verification.status === "supported" && verified) {
    return {
      requirementId: "",
      requirementLabel: "",
      capability: "containerization",
      status: "supported",
      reason: "A submitted containerization bundle passed all 8 checks and is recorded as verified evidence.",
      evidenceRefs: [verified.id, "verification"],
      gap: null,
      limitation: VERIFICATION_LIMITATION,
    };
  }
  if (state.verification.status === "pending") {
    return {
      requirementId: "",
      requirementLabel: "",
      capability: "containerization",
      status: "partial",
      reason: "A containerization bundle is submitted and waiting for verification.",
      evidenceRefs: ["verification"],
      gap: {
        text: "Run the pending verification.",
        destination: "verification",
      },
      limitation: VERIFICATION_LIMITATION,
    };
  }
  return {
    requirementId: "",
    requirementLabel: "",
    capability: "containerization",
    status: "missing",
    reason:
      state.verification.status === "unsupported" && state.verification.lastResult
        ? "The last submitted bundle failed verification. No verified containerization evidence exists."
        : "No containerization bundle has passed the verification gate.",
    evidenceRefs: [],
    gap: {
      text: "Submit a containerization artifact for verification.",
      destination: "verification",
    },
    limitation: VERIFICATION_LIMITATION,
  };
}

function rowFromEvaluation(
  capability: Capability,
  evaluation: ProjectEvaluation,
  state: WorkspaceState,
): FitRow {
  let limitation = LINKED_EVIDENCE_LIMITATION;
  if (capability === "testing") limitation = "The app does not run the tests.";
  if (capability === "collaboration") {
    limitation = "Collaboration is self-reported and cannot be verified in this prototype.";
  }
  if (capability === "data_pipeline") limitation = "The pipeline is described, not executed.";
  if (capability === "deployment") {
    limitation =
      "The app does not open the URL, check DNS/TLS, test uptime, or confirm the deployed commit.";
  }
  return {
    requirementId: "",
    requirementLabel: "",
    capability,
    status: evaluation.status,
    reason: evaluation.reason,
    evidenceRefs: evaluation.evidenceRefs,
    gap:
      evaluation.gap ??
      (evaluation.status === "missing"
        ? {
            text: `Add evidence for ${capability.replaceAll("_", " ")}.`,
            destination: "project",
            projectId: projectForGap(state, capability),
          }
        : null),
    limitation,
  };
}

export function computeFit(
  opportunity: Opportunity,
  state: WorkspaceState,
  today: string,
): FitRow[] {
  return opportunity.requirements.map((requirement) => {
    const { capability } = requirement;
    let row: FitRow;

    if (capability === "dsa") {
      row = dsaRow(state);
    } else if (capability === "containerization") {
      row = containerizationRow(state);
    } else if (capability === "deployment") {
      const evaluation = chooseStrongest(
        state.projects.map((project) => deploymentEvaluation(project, today)),
      );
      const targetProject =
        evaluation?.project ??
        firstProjectWithCapability(state, capability) ??
        state.projects[0];
      row = rowFromEvaluation(capability, {
        ...(evaluation ?? deploymentEvaluation(targetProject, today)),
        gap:
          evaluation && evaluation.status === "partial"
            ? null
            : {
                text: `Record deployment evidence for ${targetProject.name}.`,
                destination: "project",
                projectId: targetProject.id,
                evidenceKind: "deployment",
              },
      }, state);
    } else if (capability === "collaboration") {
      const evaluation = chooseStrongest(state.projects.map(collaborationEvaluation));
      const targetProject = evaluation?.project ?? firstProjectWithCapability(state, capability);
      row = rowFromEvaluation(
        capability,
        evaluation ?? collaborationEvaluation(targetProject),
        state,
      );
    } else {
      const evaluator =
        capability === "api"
          ? apiEvaluation
          : capability === "database"
            ? databaseEvaluation
            : capability === "testing"
              ? testingEvaluation
              : capability === "documentation"
                ? documentationEvaluation
                : dataPipelineEvaluation;
      let evaluation = chooseStrongest(state.projects.map(evaluator));
      if (!evaluation || evaluation.status === "missing") {
        const target = firstProjectWithCapability(state, capability);
        const fallback = evaluator(target);
        evaluation = fallback;
      }
      row = rowFromEvaluation(capability, evaluation, state);
    }

    return {
      ...row,
      requirementId: requirement.id,
      requirementLabel: requirement.label,
      gap:
        row.gap ??
        (row.status !== "supported"
          ? {
              text: `Add evidence for ${requirement.label.toLowerCase()}.`,
              destination: capability === "containerization" ? "verification" : "project",
              projectId:
                capability === "containerization" ? undefined : projectForGap(state, capability),
            }
          : null),
    };
  });
}

export function coverageFor(rows: FitRow[]): { supported: number; total: number; partial: number; missing: number } {
  const supported = rows.filter((row) => row.status === "supported").length;
  const partial = rows.filter((row) => row.status === "partial").length;
  const missing = rows.filter((row) => row.status === "missing").length;
  return { supported, total: rows.length, partial, missing };
}

export function fitStatusForCapability(
  opportunity: Opportunity,
  state: WorkspaceState,
  today: string,
  capability: Capability,
): FitStatus | null {
  return computeFit(opportunity, state, today).find((row) => row.capability === capability)?.status ?? null;
}
