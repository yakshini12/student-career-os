import { ActionCard } from "../components/ActionCard";
import { Callout } from "../components/Callout";
import { CoverageLine } from "../components/CoverageLine";
import { EmptyState } from "../components/EmptyState";
import { SampleBadge } from "../components/SampleBadge";
import { StatusChip } from "../components/StatusChip";
import {
  COMPETENCE_DISCLAIMER,
  NO_ACTION_COPY,
  NO_DEADLINE_COPY,
  PRACTICE_NOTICE,
  PRACTICE_SAMPLE_LABEL,
  SYNTHETIC_NOTICE,
  applicationStatusLabels,
  pipelineStatuses,
  timelineLabel,
} from "../data/copy";
import { daysLeft, formatDisplayDate } from "../model/dates";
import type { RankedAction } from "../model/types";
import { useWorkspace } from "../store/workspace-context";
import {
  activeApplications,
  nearestDeadline,
  pipelineCounts,
  selectedActions,
  selectedCoverage,
  selectedFit,
  selectedOpportunity,
} from "../store/selectors";

export function TodayView({
  onOpenOpportunity,
  onOpenAction,
  onOpenProfile,
  onOpenProjects,
}: {
  onOpenOpportunity: (opportunityId: string) => void;
  onOpenAction: (action: RankedAction) => void;
  onOpenProfile: () => void;
  onOpenProjects: () => void;
}) {
  const { state, today } = useWorkspace();
  const opportunity = selectedOpportunity(state);
  const fit = selectedFit(state, today);
  const coverage = selectedCoverage(state, today);
  const actions = selectedActions(state, today);
  const active = activeApplications(state);
  const deadline = nearestDeadline(state, today);
  const counts = pipelineCounts(state);
  const topAction = actions[0];
  const practice = state.practice;
  const coreTopics = Object.values(practice.topics).filter((value) => value >= 10).length;
  const deadlineOpportunity =
    deadline && state.opportunities.find((item) => item.id === deadline.opportunityId);

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <p className="eyebrow">Today · {formatDisplayDate(today)}</p>
          <h1>Your working snapshot</h1>
          <p className="page-lede">
            One workspace drives this view, the fit map, and the verification gate. Everything
            here is computed from the saved state.
          </p>
        </div>
        <span className="page-stamp">Field notes · {state.projects.length} projects</span>
      </header>

      <div className="today-grid">
        <section className="panel profile-panel" aria-labelledby="today-profile">
          <div className="panel-heading">
            <h2 id="today-profile">Profile</h2>
            <button type="button" className="btn btn-quiet" onClick={onOpenProfile}>
              Edit profile
            </button>
          </div>
          <p className="profile-name">{state.profile.name}</p>
          <p className="profile-role">{state.profile.targetRole}</p>
          <p className="profile-timeline">{timelineLabel(state.profile.targetTimeline)}</p>
          <p className="micro-note">Target role is a workspace preference; it does not change fit.</p>
        </section>

        <section className="panel practice-panel" aria-labelledby="today-practice">
          <div className="panel-heading">
            <h2 id="today-practice">Practice snapshot</h2>
            <span className="panel-tag">{PRACTICE_SAMPLE_LABEL}</span>
          </div>
          <div className="stat-row">
            <div className="stat">
              <span className="stat-value">{practice.totalSolved}</span>
              <span className="stat-label">problems solved</span>
            </div>
            <div className="stat">
              <span className="stat-value">{coreTopics}/6</span>
              <span className="stat-label">core topics at 10+</span>
            </div>
            <div className="stat">
              <span className="stat-value">{practice.contests}</span>
              <span className="stat-label">contests</span>
            </div>
            <div className="stat">
              <span className="stat-value">{practice.rating}</span>
              <span className="stat-label">rating</span>
            </div>
          </div>
          <p className="practice-line">
            {practice.recentSubmissions} submissions in the last 14 days · best rank{" "}
            {practice.bestRank} · {practice.sqlSolved} SQL problems
          </p>
          <p className="micro-note">{PRACTICE_NOTICE}</p>
        </section>

        <section className="panel applications-panel" aria-labelledby="today-applications">
          <div className="panel-heading">
            <h2 id="today-applications">Application pipeline</h2>
            <button type="button" className="btn btn-quiet" onClick={() => onOpenOpportunity(opportunity.id)}>
              Open selected
            </button>
          </div>
          <ul className="pipeline-counts" aria-label="Application status counts">
            {pipelineStatuses.map((status) => (
              <li key={status} className={`pipeline-count pipeline-${status}`}>
                <span className="pipeline-count-value">{counts[status]}</span>
                <span>{applicationStatusLabels[status]}</span>
              </li>
            ))}
            <li className="pipeline-count pipeline-closed">
              <span className="pipeline-count-value">{counts.closed}</span>
              <span>Closed</span>
            </li>
          </ul>
          <div className="deadline-block">
            <p className="micro-label">Nearest active deadline</p>
            {deadline && deadlineOpportunity ? (
              <>
                <p className={`deadline-title${deadline.overdue ? " deadline-overdue" : ""}`}>
                  {deadlineOpportunity.organisation} · {deadlineOpportunity.title}
                </p>
                <p className={deadline.overdue ? "deadline-overdue" : "deadline-meta"}>
                  {formatDisplayDate(deadline.date)} ·{" "}
                  {deadline.overdue
                    ? "Deadline passed"
                    : `${deadline.daysLeft} day${deadline.daysLeft === 1 ? "" : "s"} left`}
                </p>
              </>
            ) : (
              <p className="deadline-meta">{NO_DEADLINE_COPY}</p>
            )}
          </div>
          {active.length === 0 ? (
            <EmptyState title="No active applications">
              Save a sample opportunity to start tracking it.
            </EmptyState>
          ) : (
            <ul className="application-list">
              {active.map(({ opportunity: item, application }) => {
                const remaining = item.deadline ? daysLeft(item.deadline, today) : null;
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      className="application-row"
                      onClick={() => onOpenOpportunity(item.id)}
                    >
                      <span>
                        <span className="application-org">{item.organisation}</span>
                        <span className="application-title">{item.title}</span>
                      </span>
                      <span className="application-meta">
                        <span className={`status-inline status-${application.status}`}>
                          {applicationStatusLabels[application.status]}
                        </span>
                        <span className={remaining !== null && remaining < 0 ? "deadline-overdue" : ""}>
                          {remaining === null
                            ? "No deadline"
                            : remaining < 0
                              ? "Deadline passed"
                              : `${remaining} day${remaining === 1 ? "" : "s"} left`}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="panel fit-snapshot" aria-labelledby="today-fit">
          <div className="panel-heading">
            <h2 id="today-fit">Selected opportunity</h2>
            <button type="button" className="btn btn-quiet" onClick={() => onOpenOpportunity(opportunity.id)}>
              View fit map
            </button>
          </div>
          <div className="snapshot-title">
            <div>
              <p className="snapshot-org">{opportunity.organisation}</p>
              <p className="snapshot-role">{opportunity.title}</p>
            </div>
            <SampleBadge label={opportunity.source.label} />
          </div>
          <CoverageLine rows={fit} />
          <ul className="fit-mini-list">
            {fit.map((row) => (
              <li key={row.requirementId}>
                <span className="fit-mini-label">{row.requirementLabel}</span>
                <StatusChip status={row.status} />
              </li>
            ))}
          </ul>
          <p className="micro-note">
            This fit map compares {coverage.total} requirements with the evidence saved in your
            workspace. {coverage.supported} of them{" "}
            {coverage.supported === 1 ? "is" : "are"} currently supported.
          </p>
          <p className="micro-note">{COMPETENCE_DISCLAIMER}</p>
        </section>
      </div>

      <section className="today-action" aria-labelledby="today-next-action">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Next best move</p>
            <h2 id="today-next-action">Primary recommended action</h2>
          </div>
          <p className="section-note">Ranked by impact × urgency ÷ effort for the selected sample.</p>
        </div>
        {topAction ? (
          <div className="action-wrap">
            <ActionCard
              action={topAction}
              rank={1}
              targetProjectName={
                topAction.targetProjectId
                  ? state.projects.find((project) => project.id === topAction.targetProjectId)?.name
                  : undefined
              }
              onOpen={() => onOpenAction(topAction)}
            />
            <div className="action-side">
              <Callout tone="limit" title="What the ranking means">
                <p>
                  This ordering reflects only the sample opportunity’s deadline and the rule-based
                  impact and effort values. It is not a prediction of hiring outcomes.
                </p>
              </Callout>
              <button type="button" className="text-link" onClick={onOpenProjects}>
                Inspect projects and evidence →
              </button>
            </div>
          </div>
        ) : (
          <EmptyState title={NO_ACTION_COPY}>
            All requirements for this sample either have supported evidence or are recorded but
            cannot be advanced further in this prototype.
          </EmptyState>
        )}
      </section>

      <Callout tone="note" title="Synthetic workspace">
        <p>{SYNTHETIC_NOTICE}</p>
      </Callout>
    </div>
  );
}
