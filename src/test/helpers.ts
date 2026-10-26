import { buildSeed, requirementTemplate } from "../data/seed";
import { SAMPLE_SOURCE_LABEL } from "../data/seed";
import { generateActions } from "../model/actions";
import { coverageFor, computeFit } from "../model/fit";
import type {
  Capability,
  Opportunity,
  Project,
  WorkspaceState,
} from "../model/types";
import type { StorageLike } from "../model/state";

export const TODAY = "2026-10-26";
export const SEEDED_AT = "2026-10-26T08:00:00.000Z";
export const NORTHSTAR_ID = "northstar_backend_intern";

export function seedState(): WorkspaceState {
  return buildSeed(TODAY, SEEDED_AT);
}

export function clone<T>(value: T): T {
  return structuredClone(value);
}

export function projectById(state: WorkspaceState, projectId: string): Project {
  const project = state.projects.find((item) => item.id === projectId);
  if (!project) throw new Error(`Missing project ${projectId}`);
  return project;
}

export function opportunityById(state: WorkspaceState, opportunityId: string): Opportunity {
  const opportunity = state.opportunities.find((item) => item.id === opportunityId);
  if (!opportunity) throw new Error(`Missing opportunity ${opportunityId}`);
  return opportunity;
}

export function northstar(state: WorkspaceState): Opportunity {
  return opportunityById(state, NORTHSTAR_ID);
}

export function fitFor(
  state: WorkspaceState,
  opportunity: Opportunity = northstar(state),
  today: string = TODAY,
) {
  return computeFit(opportunity, state, today);
}

export function coverageForOpportunity(
  state: WorkspaceState,
  opportunity: Opportunity = northstar(state),
) {
  return coverageFor(fitFor(state, opportunity));
}

export function actionsFor(
  state: WorkspaceState,
  opportunity: Opportunity = northstar(state),
) {
  return generateActions(opportunity, fitFor(state, opportunity), state, TODAY);
}

export function isolatedState(projectId = "campus_cart", base = seedState()): WorkspaceState {
  return { ...base, projects: [clone(projectById(base, projectId))] };
}

export function customOpportunity(
  capabilities: Capability[],
  options: { id?: string; deadline?: string | null } = {},
): Opportunity {
  const id = options.id ?? "custom_opportunity";
  return {
    id,
    title: "Synthetic test role",
    organisation: "Fixture Labs",
    category: "internship",
    location: "Remote",
    format: "Remote",
    deadline: options.deadline === undefined ? "2026-11-02" : options.deadline,
    summary: "A test-only synthetic opportunity used to isolate one requirement.",
    source: { type: "sample", label: SAMPLE_SOURCE_LABEL },
    requirements: capabilities.map((capability) => {
      const template = requirementTemplate(capability);
      return {
        id: `${id}_${capability}`,
        capability,
        label: template.label,
        description: template.description,
      };
    }),
  };
}

export interface MemoryStorage extends StorageLike {
  dump(): Record<string, string>;
}

export function memoryStorage(initial: Record<string, string> = {}): MemoryStorage {
  const map = new Map(Object.entries(initial));
  return {
    getItem(key) {
      return map.get(key) ?? null;
    },
    setItem(key, value) {
      map.set(key, value);
    },
    dump() {
      return Object.fromEntries(map);
    },
  };
}
