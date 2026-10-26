import { dayNumber, daysLeft } from "../model/dates";
import { coverageFor, computeFit } from "../model/fit";
import { generateActions } from "../model/actions";
import type { FitRow, Opportunity, WorkspaceState } from "../model/types";

export function selectedOpportunity(state: WorkspaceState): Opportunity {
  return (
    state.opportunities.find((opportunity) => opportunity.id === state.selectedOpportunityId) ??
    state.opportunities[0]
  );
}

export function activeApplications(state: WorkspaceState) {
  return Object.entries(state.applications)
    .filter(([, application]) => application.status !== "closed")
    .map(([opportunityId, application]) => ({
      opportunity: state.opportunities.find((item) => item.id === opportunityId),
      application,
    }))
    .filter(
      (entry): entry is { opportunity: Opportunity; application: WorkspaceState["applications"][string] } =>
        Boolean(entry.opportunity),
    );
}

export function nearestDeadline(state: WorkspaceState, today: string) {
  const active = activeApplications(state)
    .filter((entry) => entry.opportunity.deadline !== null)
    .sort((a, b) => {
      const aDeadline = a.opportunity.deadline as string;
      const bDeadline = b.opportunity.deadline as string;
      return dayNumber(aDeadline) - dayNumber(bDeadline);
    });
  const first = active[0];
  if (!first || !first.opportunity.deadline) return null;
  const remaining = daysLeft(first.opportunity.deadline, today);
  return {
    opportunityId: first.opportunity.id,
    date: first.opportunity.deadline,
    daysLeft: remaining,
    overdue: remaining < 0,
  };
}

export function pipelineCounts(state: WorkspaceState) {
  const counts = { saved: 0, preparing: 0, applied: 0, interviewing: 0, closed: 0 };
  for (const application of Object.values(state.applications)) {
    counts[application.status] += 1;
  }
  return counts;
}

export function selectedFit(state: WorkspaceState, today: string): FitRow[] {
  return computeFit(selectedOpportunity(state), state, today);
}

export function selectedCoverage(state: WorkspaceState, today: string) {
  return coverageFor(selectedFit(state, today));
}

export function selectedActions(state: WorkspaceState, today: string) {
  return generateActions(selectedOpportunity(state), selectedFit(state, today), state, today);
}

export function fitFor(
  state: WorkspaceState,
  opportunity: Opportunity,
  today: string,
): FitRow[] {
  return computeFit(opportunity, state, today);
}
