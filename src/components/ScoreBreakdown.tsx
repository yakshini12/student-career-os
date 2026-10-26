import type { RankedAction } from "../model/types";

export function ScoreBreakdown({ action }: { action: RankedAction }) {
  return (
    <p className="score-breakdown">
      <span className="score-label">Rank score</span>
      <span className="score-arithmetic">
        <span>impact {action.impact}</span>
        <span aria-hidden="true">×</span>
        <span>urgency {action.urgency}</span>
        <span aria-hidden="true">÷</span>
        <span>effort {action.effort}</span>
        <span aria-hidden="true">=</span>
        <strong>{action.score.toFixed(1)}</strong>
      </span>
    </p>
  );
}
