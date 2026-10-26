import type { RankedAction } from "../model/types";
import { SampleBadge } from "./SampleBadge";
import { ScoreBreakdown } from "./ScoreBreakdown";
import { StatusChip } from "./StatusChip";

const destinationLabels: Record<RankedAction["destination"], string> = {
  verification: "Open verification workspace",
  project: "Open evidence form",
  profile: "Open Profile & Practice",
};

export function ActionCard({
  action,
  rank,
  targetProjectName,
  onOpen,
}: {
  action: RankedAction;
  rank: number;
  targetProjectName?: string;
  onOpen: () => void;
}) {
  return (
    <article className="action-card">
      <div className="action-topline">
        <span className="action-rank">Action {rank}</span>
        <StatusChip status={action.requirementStatus} />
      </div>
      <h3>{action.title}</h3>
      <p className="action-requirement">
        <span className="mono-label">Requirement:</span> {action.requirementLabel}
      </p>
      <p className="action-description">{action.description}</p>
      <dl className="action-details">
        {targetProjectName ? (
          <div>
            <dt>Target</dt>
            <dd>{targetProjectName}</dd>
          </div>
        ) : null}
        <div>
          <dt>Expected artifact</dt>
          <dd>{action.artifact}</dd>
        </div>
      </dl>
      <ScoreBreakdown action={action} />
      <p className="action-limitation">{action.limitation}</p>
      <div className="action-footer">
        <SampleBadge label={action.sourceLabel} />
        <button type="button" className="btn btn-primary" onClick={onOpen}>
          {destinationLabels[action.destination]}
        </button>
      </div>
    </article>
  );
}
