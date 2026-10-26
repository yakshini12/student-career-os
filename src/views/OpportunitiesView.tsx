import { useState } from "react";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { EmptyState } from "../components/EmptyState";
import { SampleBadge } from "../components/SampleBadge";
import {
  applicationStatusLabels,
  categoryLabels,
} from "../data/copy";
import { daysLeft, formatDisplayDate, nowIso } from "../model/dates";
import type { ApplicationStatus, OpportunityCategory } from "../model/types";
import { useWorkspace } from "../store/workspace-context";

const categories: OpportunityCategory[] = [
  "internship",
  "apprenticeship",
  "fellowship",
  "job",
  "hackathon",
];

const allStatuses: ApplicationStatus[] = [
  "saved",
  "preparing",
  "applied",
  "interviewing",
  "closed",
];

export function OpportunitiesView({ onOpenOpportunity }: { onOpenOpportunity: (id: string) => void }) {
  const { state, dispatch, today } = useWorkspace();
  const [filter, setFilter] = useState<OpportunityCategory | "all">("all");
  const [unsaveTarget, setUnsaveTarget] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const visible = state.opportunities.filter(
    (opportunity) => filter === "all" || opportunity.category === filter,
  );
  const targetOpportunity = state.opportunities.find((opportunity) => opportunity.id === unsaveTarget);

  const save = (opportunityId: string) => {
    dispatch({
      type: "SAVE_OPPORTUNITY",
      opportunityId,
      updatedAt: nowIso(),
    });
    setMessage("Opportunity saved to the application pipeline.");
  };

  const requestUnsave = (opportunityId: string) => {
    const application = state.applications[opportunityId];
    if (application && application.status !== "saved") {
      setUnsaveTarget(opportunityId);
      return;
    }
    dispatch({ type: "UNSAVE_OPPORTUNITY", opportunityId });
    setMessage("Opportunity removed from the application pipeline.");
  };

  const changeStatus = (opportunityId: string, status: ApplicationStatus | "") => {
    if (!status) return;
    dispatch({
      type: "SET_APPLICATION_STATUS",
      opportunityId,
      status,
      updatedAt: nowIso(),
    });
    setMessage(`Application status set to ${applicationStatusLabels[status]}.`);
  };

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <p className="eyebrow">Opportunities & Applications</p>
          <h1>A sample catalog you can assess</h1>
          <p className="page-lede">
            All six records are synthetic. Saving and status changes are manual and independent of
            verification.
          </p>
        </div>
        <span className="page-stamp">Sample — not live</span>
      </header>

      <section className="filter-bar" aria-labelledby="filter-heading">
        <div>
          <h2 id="filter-heading">Filter by category</h2>
          <p className="micro-note">
            Showing {visible.length} of {state.opportunities.length} sample opportunities.
          </p>
        </div>
        <div className="filter-group" role="group" aria-label="Opportunity category filter">
          <button
            type="button"
            className={`filter-chip${filter === "all" ? " filter-active" : ""}`}
            aria-pressed={filter === "all"}
            onClick={() => setFilter("all")}
          >
            All
          </button>
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              className={`filter-chip${filter === category ? " filter-active" : ""}`}
              aria-pressed={filter === category}
              onClick={() => setFilter(category)}
            >
              {categoryLabels[category]}
            </button>
          ))}
        </div>
      </section>

      {message ? (
        <p className="success-note" role="status">
          {message}
        </p>
      ) : null}

      {visible.length === 0 ? (
        <EmptyState
          title="No sample opportunities in this category"
          action={
            <button type="button" className="btn btn-primary" onClick={() => setFilter("all")}>
              Clear filter
            </button>
          }
        >
          The catalog still contains six sample records. Reset the filter to see them.
        </EmptyState>
      ) : (
        <div className="opportunity-grid">
          {visible.map((opportunity) => {
            const application = state.applications[opportunity.id];
            const remaining = opportunity.deadline ? daysLeft(opportunity.deadline, today) : null;
            return (
              <article className="panel opportunity-card" key={opportunity.id}>
                <div className="opportunity-topline">
                  <span className="category-tag">{categoryLabels[opportunity.category]}</span>
                  <SampleBadge label={opportunity.source.label} />
                </div>
                <h2>{opportunity.title}</h2>
                <p className="opportunity-org">{opportunity.organisation}</p>
                <p className="opportunity-meta">
                  {opportunity.location} · {opportunity.format}
                </p>
                <p className="opportunity-summary">{opportunity.summary}</p>
                <p className={`opportunity-deadline${remaining !== null && remaining < 0 ? " deadline-overdue" : ""}`}>
                  {opportunity.deadline ? (
                    <>
                      Deadline {formatDisplayDate(opportunity.deadline)}
                      {remaining !== null
                        ? remaining < 0
                          ? " · Deadline passed"
                          : ` · ${remaining} day${remaining === 1 ? "" : "s"} left`
                        : ""}
                    </>
                  ) : (
                    "No deadline"
                  )}
                </p>

                <div className="opportunity-controls">
                  <label htmlFor={`status-${opportunity.id}`}>
                    Status
                    <select
                      id={`status-${opportunity.id}`}
                      value={application?.status ?? ""}
                      onChange={(event) =>
                        changeStatus(opportunity.id, event.target.value as ApplicationStatus | "")
                      }
                    >
                      <option value="" disabled>
                        Not tracked
                      </option>
                      {allStatuses.map((status) => (
                        <option key={status} value={status}>
                          {applicationStatusLabels[status]}
                        </option>
                      ))}
                    </select>
                  </label>
                  {application ? (
                    <button
                      type="button"
                      className="btn btn-quiet"
                      onClick={() => requestUnsave(opportunity.id)}
                    >
                      Unsave
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => save(opportunity.id)}
                    >
                      Save
                    </button>
                  )}
                </div>

                <div className="opportunity-footer">
                  <span className={`status-inline status-${application?.status ?? "untracked"}`}>
                    {application ? applicationStatusLabels[application.status] : "Not tracked"}
                  </span>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => onOpenOpportunity(opportunity.id)}
                  >
                    View and assess
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {targetOpportunity ? (
        <ConfirmDialog
          title="Remove tracked application?"
          message={`This opportunity is currently “${
            applicationStatusLabels[state.applications[targetOpportunity.id].status]
          }”. Unsaving removes the application record and its status. The sample opportunity stays in the catalog.`}
          confirmLabel="Unsave application"
          tone="danger"
          onConfirm={() => {
            dispatch({ type: "UNSAVE_OPPORTUNITY", opportunityId: targetOpportunity.id });
            setUnsaveTarget(null);
            setMessage("Opportunity removed from the application pipeline.");
          }}
          onClose={() => setUnsaveTarget(null)}
        />
      ) : null}
    </div>
  );
}
