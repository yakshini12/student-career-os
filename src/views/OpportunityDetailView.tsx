import { useState } from "react";
import { ActionCard } from "../components/ActionCard";
import { Callout } from "../components/Callout";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { CoverageLine } from "../components/CoverageLine";
import { DsaCalculation } from "../components/DsaCalculation";
import { EmptyState } from "../components/EmptyState";
import { SampleBadge } from "../components/SampleBadge";
import { StatusChip } from "../components/StatusChip";
import {
  COMPETENCE_DISCLAIMER,
  FIT_DISCLOSURE,
  NO_ACTION_COPY,
  applicationStatusLabels,
  capabilityLabels,
  categoryLabels,
} from "../data/copy";
import { isRecordedOnly } from "../model/actions";
import { daysLeft, formatDisplayDate, formatDisplayDateTime, nowIso } from "../model/dates";
import type { ApplicationStatus, EvidenceKind, FitRow, RankedAction } from "../model/types";
import { useWorkspace } from "../store/workspace-context";
import {
  selectedActions,
  selectedFit,
  selectedOpportunity,
} from "../store/selectors";

function evidenceLabel(
  state: ReturnType<typeof useWorkspace>["state"],
  refId: string,
): { label: string; detail: string } {
  if (refId === "practice") return { label: "Practice snapshot", detail: "Profile & Practice" };
  if (refId === "verification") {
    return { label: "Verification record", detail: "Containerization gate" };
  }
  const evidence = state.projects.flatMap((project) => project.evidence).find((item) => item.id === refId);
  if (evidence) {
    return { label: evidence.label, detail: evidence.source === "verified" ? "Verified evidence" : "Linked evidence" };
  }
  return { label: refId, detail: "Referenced record" };
}

function GapButton({
  row,
  onOpenProject,
  onOpenProfile,
  onOpenVerification,
}: {
  row: FitRow;
  onOpenProject: (projectId: string, kind?: EvidenceKind) => void;
  onOpenProfile: (highlightDsa?: boolean) => void;
  onOpenVerification: () => void;
}) {
  if (!row.gap) return null;
  const open = () => {
    if (row.gap?.destination === "verification") {
      onOpenVerification();
    } else if (row.gap?.destination === "profile") {
      onOpenProfile(true);
    } else if (row.gap?.projectId) {
      onOpenProject(row.gap.projectId, row.gap.evidenceKind);
    }
  };
  return (
    <button type="button" className="text-link" onClick={open}>
      {row.gap.text} →
    </button>
  );
}

export function OpportunityDetailView({
  onBack,
  onOpenAction,
  onOpenProject,
  onOpenProfile,
  onOpenVerification,
}: {
  onBack: () => void;
  onOpenAction: (action: RankedAction) => void;
  onOpenProject: (projectId: string, kind?: EvidenceKind) => void;
  onOpenProfile: (highlightDsa?: boolean) => void;
  onOpenVerification: () => void;
}) {
  const { state, dispatch, today } = useWorkspace();
  const opportunity = selectedOpportunity(state);
  const fit = selectedFit(state, today);
  const actions = selectedActions(state, today);
  const application = state.applications[opportunity.id];
  const [unsaveOpen, setUnsaveOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const remaining = opportunity.deadline ? daysLeft(opportunity.deadline, today) : null;
  const recordedRows = fit.filter(isRecordedOnly);
  const selectedMissing = !state.opportunities.some(
    (item) => item.id === state.selectedOpportunityId,
  );

  const save = () => {
    dispatch({
      type: "SAVE_OPPORTUNITY",
      opportunityId: opportunity.id,
      updatedAt: nowIso(),
    });
    setMessage("Opportunity saved to the application pipeline.");
  };

  const requestUnsave = () => {
    if (application && application.status !== "saved") {
      setUnsaveOpen(true);
      return;
    }
    dispatch({ type: "UNSAVE_OPPORTUNITY", opportunityId: opportunity.id });
    setMessage("Opportunity removed from the application pipeline.");
  };

  return (
    <div className="page">
      <button type="button" className="back-link" onClick={onBack}>
        ← Back to opportunities
      </button>

      {selectedMissing ? (
        <Callout tone="warning" title="Opportunity unavailable">
          That sample opportunity is unavailable. Select another.
        </Callout>
      ) : null}

      <header className="detail-head">
        <div>
          <div className="detail-topline">
            <span className="category-tag">{categoryLabels[opportunity.category]}</span>
            <SampleBadge label={opportunity.source.label} />
          </div>
          <p className="eyebrow">{opportunity.organisation}</p>
          <h1>{opportunity.title}</h1>
          <p className="detail-meta">
            {opportunity.location} · {opportunity.format} ·{" "}
            {opportunity.deadline
              ? `Deadline ${formatDisplayDate(opportunity.deadline)}${
                  remaining === null
                    ? ""
                    : remaining < 0
                      ? " · Deadline passed"
                      : ` · ${remaining} day${remaining === 1 ? "" : "s"} left`
                }`
              : "No deadline"}
          </p>
          <p className="detail-summary">{opportunity.summary}</p>
        </div>
        <div className="detail-status-card">
          <p className="micro-label">Application status</p>
          <label className="sr-only" htmlFor="detail-status">
            Application status for {opportunity.title}
          </label>
          <select
            id="detail-status"
            value={application?.status ?? ""}
            onChange={(event) => {
              const status = event.target.value as ApplicationStatus;
              if (!status) return;
              dispatch({
                type: "SET_APPLICATION_STATUS",
                opportunityId: opportunity.id,
                status,
                updatedAt: nowIso(),
              });
              setMessage(`Application status set to ${applicationStatusLabels[status]}.`);
            }}
          >
            <option value="" disabled>
              Not tracked
            </option>
            {(["saved", "preparing", "applied", "interviewing", "closed"] as const).map((status) => (
              <option key={status} value={status}>
                {applicationStatusLabels[status]}
              </option>
            ))}
          </select>
          <p className="micro-note">
            {application
              ? `Last updated ${formatDisplayDateTime(application.updatedAt)}`
              : "Not yet tracked"}
          </p>
          {application ? (
            <button type="button" className="btn btn-quiet" onClick={requestUnsave}>
              Unsave
            </button>
          ) : (
            <button type="button" className="btn btn-secondary" onClick={save}>
              Save opportunity
            </button>
          )}
          <p className="micro-note">
            Status is manual. No application is submitted by this prototype.
          </p>
        </div>
      </header>

      {message ? (
        <p className="success-note" role="status">
          {message}
        </p>
      ) : null}

      {remaining !== null && remaining < 0 ? (
        <Callout tone="warning" title="Deadline passed">
          <p>
            The deadline has passed. The current application status is kept until you change it
            manually.
          </p>
        </Callout>
      ) : null}

      <div className="detail-grid">
        <section className="panel fit-panel" aria-labelledby="fit-heading">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Requirement map</p>
              <h2 id="fit-heading">Evidence fit</h2>
            </div>
            <span className="panel-tag">Not readiness or hire probability</span>
          </div>
          <CoverageLine rows={fit} label="requirements supported" />
          <p className="fit-disclosure">{FIT_DISCLOSURE}</p>
          <ol className="fit-row-list">
            {fit.map((row) => (
              <li key={row.requirementId} className={`fit-row fit-row-${row.status}`}>
                <div className="fit-row-head">
                  <div>
                    <p className="fit-requirement">{row.requirementLabel}</p>
                    <p className="micro-note">{capabilityLabels[row.capability]} requirement</p>
                  </div>
                  <StatusChip status={row.status} />
                </div>
                <p className="fit-reason">{row.reason}</p>
                {row.evidenceRefs.length > 0 ? (
                  <div className="evidence-refs">
                    <span className="micro-label">Evidence</span>
                    <ul>
                      {row.evidenceRefs.map((refId) => {
                        const info = evidenceLabel(state, refId);
                        return (
                          <li key={refId}>
                            <span>{info.label}</span>
                            <span className="micro-note">{info.detail}</span>
                            <code className="ref-id">{refId}</code>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ) : (
                  <p className="micro-note">No acceptable evidence recorded.</p>
                )}
                {row.calculation ? <DsaCalculation calculation={row.calculation} /> : null}
                <p className="fit-limitation">{row.limitation}</p>
                {row.status !== "supported" ? (
                  <GapButton
                    row={row}
                    onOpenProject={onOpenProject}
                    onOpenProfile={onOpenProfile}
                    onOpenVerification={onOpenVerification}
                  />
                ) : null}
              </li>
            ))}
          </ol>
          <p className="micro-note">{COMPETENCE_DISCLAIMER}</p>
        </section>

        <section className="panel action-panel" aria-labelledby="actions-heading">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Ranked plan</p>
              <h2 id="actions-heading">Action plan</h2>
            </div>
            <span className="panel-tag">Top 3</span>
          </div>
          <p className="micro-note action-intro">
            Rank score = impact × urgency ÷ effort. Only partial and missing requirements generate
            actions.
          </p>
          {actions.length === 0 ? (
            <EmptyState title={NO_ACTION_COPY}>
              There are no partial or missing requirements that this prototype can advance.
            </EmptyState>
          ) : (
            <div className="action-list">
              {actions.map((action, index) => (
                <ActionCard
                  key={action.id}
                  action={action}
                  rank={index + 1}
                  targetProjectName={
                    action.targetProjectId
                      ? state.projects.find((project) => project.id === action.targetProjectId)?.name
                      : action.destination === "profile"
                        ? "Profile & Practice"
                        : undefined
                  }
                  onOpen={() => onOpenAction(action)}
                />
              ))}
            </div>
          )}
          {recordedRows.length > 0 ? (
            <div className="recorded-notes">
              <h3 className="subheading">Recorded but not advanced</h3>
              {recordedRows.map((row) => (
                <p key={row.requirementId} className="recorded-note">
                  <span className="mono-label">{row.requirementLabel}:</span>{" "}
                  {row.capability === "deployment"
                    ? "Recorded; live reachability is not verified."
                    : "Recorded; collaboration is not verifiable in this prototype."}
                </p>
              ))}
            </div>
          ) : null}
          <Callout tone="limit" title="What this plan cannot do">
            <p>
              The plan does not apply to the opportunity, contact anyone, execute deployment checks,
              or change practice data. It opens the surface where the artifact can be recorded or
              verified.
            </p>
          </Callout>
        </section>
      </div>

      {unsaveOpen && application ? (
        <ConfirmDialog
          title="Remove tracked application?"
          message={`This opportunity is currently “${
            applicationStatusLabels[application.status]
          }”. Unsaving removes the application record and its status. The sample opportunity stays in the catalog.`}
          confirmLabel="Unsave application"
          tone="danger"
          onConfirm={() => {
            dispatch({ type: "UNSAVE_OPPORTUNITY", opportunityId: opportunity.id });
            setUnsaveOpen(false);
            setMessage("Opportunity removed from the application pipeline.");
          }}
          onClose={() => setUnsaveOpen(false)}
        />
      ) : null}
    </div>
  );
}
