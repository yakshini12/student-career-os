import { addDays } from "../model/dates";
import type {
  Application,
  Capability,
  EvidenceItem,
  Opportunity,
  OpportunityCategory,
  Project,
  Requirement,
  WorkspaceState,
} from "../model/types";
import { seedTimestamp } from "../model/dates";

export const SAMPLE_SOURCE_LABEL = "Sample — not live";

const requirementTemplates: Record<Capability, { label: string; description: string }> = {
  api: { label: "REST API implementation", description: "Build and document a working API." },
  database: {
    label: "Relational database modeling",
    description: "Model related data with keys and relationships.",
  },
  dsa: { label: "DSA fundamentals", description: "Show consistent practice across core topics." },
  containerization: {
    label: "Containerization",
    description: "Package the service with a reproducible image definition.",
  },
  deployment: {
    label: "Deployment evidence",
    description: "Record where the service runs and how it was observed.",
  },
  testing: { label: "Automated testing", description: "Capture a test result with passing checks." },
  documentation: { label: "Documentation", description: "Explain setup and usage." },
  collaboration: { label: "Collaboration evidence", description: "Record team contribution." },
  data_pipeline: {
    label: "Data pipeline",
    description: "Describe input, transformation, and output.",
  },
};

function requirement(opportunityId: string, capability: Capability): Requirement {
  const template = requirementTemplates[capability];
  return {
    id: `${opportunityId}_${capability}`,
    label: template.label,
    capability,
    description: template.description,
  };
}

function makeOpportunity(input: {
  id: string;
  title: string;
  organisation: string;
  category: OpportunityCategory;
  offset: number | null;
  location: string;
  format: string;
  summary: string;
  capabilities: Capability[];
  today: string;
}): Opportunity {
  return {
    id: input.id,
    title: input.title,
    organisation: input.organisation,
    category: input.category,
    location: input.location,
    format: input.format,
    deadline: input.offset === null ? null : addDays(input.today, input.offset),
    summary: input.summary,
    source: { type: "sample", label: SAMPLE_SOURCE_LABEL },
    requirements: input.capabilities.map((capability) => requirement(input.id, capability)),
  };
}

export function buildSeed(today: string, seededAt = new Date().toISOString()): WorkspaceState {
  const evidence = (
    id: string,
    projectId: string,
    kind: EvidenceItem["kind"],
    label: string,
    location: string,
    summary: string,
    addedDaysAgo: number,
    metrics?: EvidenceItem["metrics"],
  ): EvidenceItem => ({
    id,
    projectId,
    kind,
    label,
    location,
    summary,
    source: "linked",
    addedAt: seedTimestamp(seededAt, addedDaysAgo),
    ...(metrics ? { metrics } : {}),
  });

  const campusCart: Project = {
    id: "campus_cart",
    name: "CampusCart",
    summary: "A Flask and SQLite shopping-cart API used for the containerization upgrade.",
    technologies: ["Python", "Flask", "SQLite", "REST"],
    capabilities: ["api", "database", "documentation", "testing"],
    milestones: [
      { id: "campus_cart_api", label: "Ship REST API", status: "done" },
      { id: "campus_cart_db", label: "Model database schema", status: "done" },
      { id: "campus_cart_tests", label: "Add automated tests", status: "in_progress" },
      { id: "campus_cart_containerize", label: "Containerize API", status: "not_started" },
      { id: "campus_cart_deploy", label: "Deploy service", status: "not_started" },
    ],
    evidence: [
      evidence(
        "ev_campus_repo",
        "campus_cart",
        "repository",
        "CampusCart repository",
        "https://example.invalid/aarav/campuscart",
        "Flask API source and setup notes.",
        40,
      ),
      evidence(
        "ev_campus_readme",
        "campus_cart",
        "readme",
        "API route table",
        "README.md",
        "Six REST routes with setup and usage instructions.",
        38,
        { routeCount: 6, hasSetup: true, hasUsage: true },
      ),
      evidence(
        "ev_campus_schema",
        "campus_cart",
        "schema",
        "SQLite schema",
        "schema.sql",
        "Four tables with primary keys and one foreign key.",
        36,
        { tableCount: 4, hasPrimaryKey: true, hasForeignKey: true },
      ),
      evidence(
        "ev_campus_test_note",
        "campus_cart",
        "test_report",
        "Testing plan note",
        "notes/testing.md",
        "Tests are planned but no captured result exists yet.",
        20,
      ),
    ],
  };

  const studySync: Project = {
    id: "study_sync",
    name: "StudySync",
    summary: "A React and Firebase study-group planner built with a partner.",
    technologies: ["JavaScript", "React", "Firebase"],
    capabilities: ["documentation", "collaboration"],
    milestones: [
      { id: "study_sync_auth", label: "Ship authentication", status: "done" },
      {
        id: "study_sync_collab",
        label: "Partner contribution",
        status: "done",
        teamContributed: true,
      },
    ],
    evidence: [
      evidence(
        "ev_study_repo",
        "study_sync",
        "repository",
        "StudySync repository",
        "https://example.invalid/aarav/studysync",
        "React source and setup notes.",
        60,
      ),
      evidence(
        "ev_study_readme",
        "study_sync",
        "readme",
        "Setup and usage guide",
        "README.md",
        "Setup and usage instructions for the study-group planner.",
        58,
        { hasSetup: true, hasUsage: true },
      ),
      evidence(
        "ev_study_contribution",
        "study_sync",
        "contribution",
        "Partner contribution note",
        "notes/team.md",
        "Self-reported split of work with a project partner.",
        55,
      ),
    ],
  };

  const routeWise: Project = {
    id: "route_wise",
    name: "RouteWise",
    summary: "A pandas pipeline that cleans and summarises travel-survey data.",
    technologies: ["Python", "pandas", "CSV"],
    capabilities: ["data_pipeline", "testing", "documentation"],
    milestones: [
      { id: "route_wise_pipeline", label: "Build data pipeline", status: "done" },
      { id: "route_wise_tests", label: "Add test suite", status: "done" },
    ],
    evidence: [
      evidence(
        "ev_route_repo",
        "route_wise",
        "repository",
        "RouteWise repository",
        "https://example.invalid/aarav/routewise",
        "pandas pipeline source and setup notes.",
        50,
      ),
      evidence(
        "ev_route_readme",
        "route_wise",
        "readme",
        "Setup and usage guide",
        "README.md",
        "Setup and usage instructions for the pipeline.",
        48,
        { hasSetup: true, hasUsage: true },
      ),
      evidence(
        "ev_route_tests",
        "route_wise",
        "test_report",
        "Pipeline test report",
        "reports/tests.txt",
        "Twelve passing checks, no failures or errors.",
        30,
        { testPassed: 12, testFailed: 0, testErrors: 0 },
      ),
      evidence(
        "ev_route_dataset",
        "route_wise",
        "dataset",
        "Travel survey sample",
        "data/sample.csv",
        "Cleaned sample used by the pipeline.",
        29,
        {
          pipelineInput: "Raw travel survey CSV",
          pipelineTransformation: "Clean missing trips and aggregate by route",
          pipelineOutput: "Route summary CSV",
        },
      ),
    ],
  };

  const opportunities: Opportunity[] = [
    makeOpportunity({
      id: "northstar_backend_intern",
      title: "Backend Engineering Intern",
      organisation: "Northstar Labs",
      category: "internship",
      offset: 7,
      location: "Bengaluru, India",
      format: "Hybrid",
      summary: "Build and document REST endpoints for a logistics platform.",
      capabilities: ["api", "database", "dsa", "containerization", "deployment"],
      today,
    }),
    makeOpportunity({
      id: "meridian_data_apprentice",
      title: "Data Engineering Apprentice",
      organisation: "Meridian Data",
      category: "apprenticeship",
      offset: 12,
      location: "Remote",
      format: "Remote",
      summary: "Maintain batch pipelines and document data contracts.",
      capabilities: ["data_pipeline", "database", "testing", "documentation"],
      today,
    }),
    makeOpportunity({
      id: "commons_backend_fellow",
      title: "Open Source Backend Fellow",
      organisation: "Commons Labs",
      category: "fellowship",
      offset: 21,
      location: "Remote",
      format: "Remote",
      summary: "Contribute to an open-source backend with tests and docs.",
      capabilities: ["api", "documentation", "testing", "collaboration"],
      today,
    }),
    makeOpportunity({
      id: "blue_harbor_junior_swe",
      title: "Junior Software Engineer",
      organisation: "Blue Harbor Systems",
      category: "job",
      offset: 30,
      location: "Pune, India",
      format: "On-site",
      summary: "Ship and operate services with databases and containers.",
      capabilities: ["api", "database", "containerization", "deployment", "testing"],
      today,
    }),
    makeOpportunity({
      id: "orbit_campusbuild",
      title: "CampusBuild Hackathon",
      organisation: "Orbit Collective",
      category: "hackathon",
      offset: 35,
      location: "Online",
      format: "Online",
      summary: "Build a small API-backed project in a team and present it.",
      capabilities: ["api", "documentation", "collaboration", "deployment"],
      today,
    }),
    makeOpportunity({
      id: "hearthstone_platform_intern",
      title: "Platform Engineering Intern",
      organisation: "Hearthstone Cloud",
      category: "internship",
      offset: 28,
      location: "Hyderabad, India",
      format: "Hybrid",
      summary: "Package and test internal platform services.",
      capabilities: ["api", "containerization", "testing", "documentation"],
      today,
    }),
  ];

  const applications: Record<string, Application> = {
    northstar_backend_intern: { status: "preparing", updatedAt: seededAt },
    orbit_campusbuild: { status: "saved", updatedAt: seededAt },
    blue_harbor_junior_swe: { status: "saved", updatedAt: seededAt },
  };

  return {
    schemaVersion: 1,
    seedVersion: 1,
    seededAt,
    profile: {
      name: "Aarav Mehta",
      targetRole: "Backend Engineering Intern",
      targetTimeline: "6_months",
    },
    practice: {
      totalSolved: 145,
      sqlSolved: 21,
      topics: { arrays: 48, strings: 31, trees: 22, linkedLists: 9, graphs: 8, dp: 6 },
      contests: 6,
      bestRank: 812,
      rating: 1543,
      recentSubmissions: 12,
    },
    projects: [campusCart, studySync, routeWise],
    opportunities,
    applications,
    verification: {
      status: "unsupported",
      bundle: null,
      submittedAt: null,
      lastResult: null,
      verifiedAt: null,
      verifiedEvidenceId: null,
    },
    history: [],
    selectedOpportunityId: "northstar_backend_intern",
  };
}

export function requirementTemplate(capability: Capability): { label: string; description: string } {
  return requirementTemplates[capability];
}
