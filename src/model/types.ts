export type Capability =
  | "api"
  | "database"
  | "dsa"
  | "containerization"
  | "deployment"
  | "testing"
  | "documentation"
  | "collaboration"
  | "data_pipeline";

export type FitStatus = "supported" | "partial" | "missing";
export type VerificationStatus = "unsupported" | "pending" | "supported";
export type EvidenceSource = "linked" | "verified";
export type EvidenceKind =
  | "repository"
  | "readme"
  | "schema"
  | "test_report"
  | "deployment"
  | "dataset"
  | "contribution"
  | "containerization"
  | "other";
export type ApplicationStatus =
  | "saved"
  | "preparing"
  | "applied"
  | "interviewing"
  | "closed";
export type MilestoneStatus = "not_started" | "in_progress" | "done";
export type OpportunityCategory =
  | "internship"
  | "apprenticeship"
  | "fellowship"
  | "job"
  | "hackathon";

export type TargetTimeline = "3_months" | "6_months" | "12_months";

export interface Profile {
  name: string;
  targetRole: string;
  targetTimeline: TargetTimeline;
}

export type PracticeTopic =
  | "arrays"
  | "strings"
  | "trees"
  | "linkedLists"
  | "graphs"
  | "dp";

export interface Practice {
  totalSolved: number;
  sqlSolved: number;
  topics: Record<PracticeTopic, number>;
  contests: number;
  bestRank: number;
  rating: number;
  recentSubmissions: number;
}

export interface Milestone {
  id: string;
  label: string;
  status: MilestoneStatus;
  teamContributed?: boolean;
}

export interface EvidenceMetrics {
  routeCount?: number;
  hasSetup?: boolean;
  hasUsage?: boolean;
  tableCount?: number;
  hasPrimaryKey?: boolean;
  hasForeignKey?: boolean;
  testPassed?: number;
  testFailed?: number;
  testErrors?: number;
  pipelineInput?: string;
  pipelineTransformation?: string;
  pipelineOutput?: string;
  healthPath?: string;
  healthResponse?: string;
  platform?: "Render" | "Railway" | "Fly.io" | "Vercel" | "Other";
  deployLog?: string;
  capturedDate?: string;
}

export interface EvidenceItem {
  id: string;
  projectId: string;
  kind: EvidenceKind;
  label: string;
  location: string;
  summary: string;
  source: EvidenceSource;
  addedAt: string;
  verifiedAt?: string;
  metrics?: EvidenceMetrics;
}

export interface Project {
  id: string;
  name: string;
  summary: string;
  technologies: string[];
  capabilities: Capability[];
  milestones: Milestone[];
  evidence: EvidenceItem[];
}

export type OpportunitySourceType = "sample" | "verified_external";

export interface OpportunitySource {
  type: OpportunitySourceType;
  label: string;
  provider?: string;
}

export interface Requirement {
  id: string;
  label: string;
  capability: Capability;
  description: string;
}

export interface Opportunity {
  id: string;
  title: string;
  organisation: string;
  category: OpportunityCategory;
  location: string;
  format: string;
  deadline: string | null;
  summary: string;
  source: OpportunitySource;
  requirements: Requirement[];
}

export interface Application {
  status: ApplicationStatus;
  updatedAt: string;
}

export interface VerificationCheck {
  id: string;
  label: string;
  passed: boolean;
  inspected: string;
  reason: string;
}

export interface VerificationResult {
  checks: VerificationCheck[];
  passed: boolean;
  runAt: string;
}

export interface ArtifactBundle {
  dockerfile: string;
  readmeCommands: string;
}

export interface VerificationState {
  status: VerificationStatus;
  bundle: ArtifactBundle | null;
  submittedAt: string | null;
  lastResult: VerificationResult | null;
  verifiedAt: string | null;
  verifiedEvidenceId: string | null;
}

export interface HistoryEntry {
  id: string;
  timestamp: string;
  requirement: "containerization";
  previous: VerificationStatus;
  next: VerificationStatus;
  checkSummary: string;
}

export interface WorkspaceState {
  schemaVersion: 1;
  seedVersion: 1;
  seededAt: string;
  profile: Profile;
  practice: Practice;
  projects: Project[];
  opportunities: Opportunity[];
  applications: Record<string, Application>;
  verification: VerificationState;
  history: HistoryEntry[];
  selectedOpportunityId: string;
}

export interface FitGap {
  text: string;
  destination: "verification" | "project" | "profile";
  projectId?: string;
  evidenceKind?: EvidenceKind;
}

export interface DsaCalculation {
  totalSolved: number;
  totalSolvedPass: boolean;
  coreTopicCount: number;
  coreTopicsRequired: number;
  coreTopicsPass: boolean;
  contests: number;
  contestsPass: boolean;
  topics: Record<PracticeTopic, number>;
}

export interface FitRow {
  requirementId: string;
  requirementLabel: string;
  capability: Capability;
  status: FitStatus;
  reason: string;
  evidenceRefs: string[];
  gap: FitGap | null;
  calculation?: DsaCalculation;
  limitation: string;
}

export interface RankedAction {
  id: string;
  requirementId: string;
  requirementLabel: string;
  requirementStatus: FitStatus;
  capability: Capability;
  title: string;
  description: string;
  artifact: string;
  sourceLabel: string;
  targetProjectId?: string;
  evidenceKind?: EvidenceKind;
  destination: "verification" | "project" | "profile";
  impact: number;
  effort: number;
  urgency: number;
  score: number;
  limitation: string;
}
