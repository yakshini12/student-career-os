import type {
  ApplicationStatus,
  Capability,
  EvidenceKind,
  MilestoneStatus,
  OpportunityCategory,
  TargetTimeline,
} from "../model/types";

export const SYNTHETIC_NOTICE =
  "This workspace uses synthetic student, project, and opportunity data.";

export const COMPETENCE_DISCLAIMER =
  "Synthetic sample. Evidence coverage is not a competence score.";

export const LINKED_EVIDENCE_LIMITATION =
  "Linked evidence is recorded, not independently verified.";

export const VERIFICATION_LIMITATION =
  "Checks validate the submitted bundle’s completeness and internal consistency, not that the image builds or the container runs.";

export const DEPLOYMENT_LIMITATION =
  "The app does not open the URL, check DNS/TLS, test uptime, or confirm the deployed commit.";

export const PRACTICE_NOTICE =
  "Practice data is seeded for this demo. Platform sync is not connected.";

export const FIT_DISCLOSURE =
  "Evidence fit is a rule-based comparison between this sample opportunity’s requirements and the evidence in your workspace. It is not readiness, hire probability, or an employer decision.";

export const PRACTICE_SAMPLE_LABEL = "Practice data · seeded sample";

export const NO_ACTION_COPY = "No further verifiable action in this prototype.";

export const NO_DEADLINE_COPY = "No upcoming deadline.";

export const applicationStatusLabels: Record<ApplicationStatus, string> = {
  saved: "Saved",
  preparing: "Preparing",
  applied: "Applied",
  interviewing: "Interviewing",
  closed: "Closed",
};

export const pipelineStatuses: ApplicationStatus[] = [
  "saved",
  "preparing",
  "applied",
  "interviewing",
];

export const milestoneStatusLabels: Record<MilestoneStatus, string> = {
  not_started: "Not started",
  in_progress: "In progress",
  done: "Done",
};

export const capabilityLabels: Record<Capability, string> = {
  api: "API",
  database: "Database",
  dsa: "DSA",
  containerization: "Containerization",
  deployment: "Deployment",
  testing: "Testing",
  documentation: "Documentation",
  collaboration: "Collaboration",
  data_pipeline: "Data pipeline",
};

export const categoryLabels: Record<OpportunityCategory, string> = {
  internship: "Internship",
  apprenticeship: "Apprenticeship",
  fellowship: "Fellowship",
  job: "Job",
  hackathon: "Hackathon",
};

export const evidenceKindLabels: Record<EvidenceKind, string> = {
  repository: "Repository",
  readme: "README / docs",
  schema: "Schema",
  test_report: "Test report",
  deployment: "Deployment",
  dataset: "Dataset / pipeline",
  contribution: "Contribution",
  containerization: "Containerization",
  other: "Other",
};

export const timelineLabels: Record<TargetTimeline, string> = {
  "3_months": "Next 3 months",
  "6_months": "Next 6 months",
  "12_months": "Next 12 months",
};

export function timelineLabel(timeline: TargetTimeline): string {
  return timelineLabels[timeline];
}
