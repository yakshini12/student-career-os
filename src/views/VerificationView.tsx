import { useEffect, useRef, useState, type FormEvent } from "react";
import { Callout } from "../components/Callout";
import { CheckRow } from "../components/CheckRow";
import { EvidenceCard } from "../components/EvidenceCard";
import { StatusChip } from "../components/StatusChip";
import { COMPLETE_BUNDLE, INCOMPLETE_BUNDLE, validateArtifactBundle } from "../model/verification";
import type { ArtifactBundle, HistoryEntry, VerificationStatus } from "../model/types";
import { useWorkspace } from "../store/workspace-context";
import { formatDisplayDateTime, nowIso } from "../model/dates";
import { VERIFICATION_LIMITATION } from "../data/copy";

const verificationStatusLabels: Record<VerificationStatus, string> = {
  unsupported: "Unsupported",
  pending: "Pending verification",
  supported: "Supported",
};

const emptyBundle: ArtifactBundle = { dockerfile: "", readmeCommands: "" };

export function VerificationView({
  onBackToOpportunity,
  onOpenProjects,
}: {
  onBackToOpportunity: () => void;
  onOpenProjects: () => void;
}) {
  const { state, dispatch } = useWorkspace();
  const [draft, setDraft] = useState<ArtifactBundle>(() => state.verification.bundle ?? emptyBundle);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);
  const summaryRef = useRef<HTMLDivElement>(null);
  const verification = state.verification;
  const pending = verification.status === "pending";
  const supported = verification.status === "supported";
  const milestone = state.projects
    .find((project) => project.id === "campus_cart")
    ?.milestones.find((item) => item.id === "campus_cart_containerize");
  const verifiedEvidence = state.projects
    .flatMap((project) => project.evidence)
    .find((item) => item.id === verification.verifiedEvidenceId);
  const locked = pending || supported;

  useEffect(() => {
    if (Object.keys(errors).length > 0) summaryRef.current?.focus();
  }, [errors]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (locked) return;
    const result = validateArtifactBundle(draft);
    if (Object.keys(result.errors).length > 0) {
      setErrors(result.errors);
      setMessage(null);
      return;
    }
    setErrors({});
    dispatch({
      type: "SUBMIT_ARTIFACT",
      bundle: { dockerfile: draft.dockerfile, readmeCommands: draft.readmeCommands },
      submittedAt: nowIso(),
    });
    setMessage("Artifact submitted for verification. It is pending, not yet verified.");
  };

  const loadSample = (bundle: ArtifactBundle) => {
    setDraft(bundle);
    setErrors({});
    setMessage("Sample loaded into the form only. Nothing has been submitted.");
  };

  const run = () => {
    dispatch({ type: "RUN_VERIFICATION", runAt: nowIso() });
    setMessage("Verification run completed. Inspect each check below.");
  };

  return (
    <div className="page">
      <button type="button" className="back-link" onClick={onBackToOpportunity}>
        ← Back to opportunity fit
      </button>

      <header className="page-head">
        <div>
          <p className="eyebrow">Verification gate</p>
          <h1>Containerization evidence</h1>
          <p className="page-lede">
            The only gate in this prototype. Eight deterministic checks inspect the submitted
            Dockerfile and README commands. Passing is what creates verified containerization
            evidence.
          </p>
        </div>
        <div className="verification-status-block">
          <p className="micro-label">Verification state</p>
          <StatusChip status={verification.status} kind="verification" />
        </div>
      </header>

      <div className="verification-topline">
        <section className="panel requirement-panel" aria-labelledby="requirement-heading">
          <div className="panel-heading">
            <h2 id="requirement-heading">Requirement</h2>
            <span className="panel-tag">CampusCart</span>
          </div>
          <p className="requirement-title">Containerization</p>
          <p className="micro-note">
            Package the service with a reproducible image definition. Milestone state is shown for
            context and is ignored by fit.
          </p>
          <div className="milestone-inline">
            <span className="mono-label">Milestone</span>
            <span>{milestone?.label ?? "Containerize API"}</span>
            <StatusChip status={milestone?.status === "done" ? "supported" : "partial"} />
          </div>
          {milestone && milestone.status !== "done" ? (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() =>
                dispatch({
                  type: "SET_MILESTONE",
                  projectId: "campus_cart",
                  milestoneId: "campus_cart_containerize",
                  status: "done",
                })
              }
            >
              Mark milestone done
            </button>
          ) : (
            <p className="success-note">Milestone done. This does not create evidence by itself.</p>
          )}
        </section>

        <section className="panel proof-contract" aria-labelledby="contract-heading">
          <div className="panel-heading">
            <h2 id="contract-heading">What passing means</h2>
            <span className="panel-tag">8 checks</span>
          </div>
          <p>
            A pass records a verified evidence item for CampusCart, marks the milestone done, and
            changes the containerization requirement to Supported on the next read.
          </p>
          <p className="micro-note">{VERIFICATION_LIMITATION}</p>
          <p className="micro-note">
            It does not change any application status. Application tracking stays manual.
          </p>
        </section>
      </div>

      <div className="verification-grid">
        <section className="panel artifact-panel" aria-labelledby="artifact-heading">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Artifact</p>
              <h2 id="artifact-heading">Submit a bundle</h2>
            </div>
            <span className="panel-tag">{pending ? "Locked while pending" : supported ? "Locked after pass" : "Editable"}</span>
          </div>

          {errors && Object.keys(errors).length > 0 ? (
            <div className="error-summary" role="alert" tabIndex={-1} ref={summaryRef}>
              <p className="error-summary-title">Artifact was not submitted. Fix these fields:</p>
              <ul>
                {Object.values(errors).map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {message ? (
            <p className="success-note" role="status">
              {message}
            </p>
          ) : null}

          <form onSubmit={submit} noValidate>
            <div className="field">
              <label htmlFor="artifact-dockerfile">Dockerfile</label>
              <textarea
                id="artifact-dockerfile"
                className="mono-textarea"
                rows={12}
                maxLength={20_000}
                value={draft.dockerfile}
                disabled={locked}
                aria-invalid={Boolean(errors.dockerfile)}
                aria-describedby={errors.dockerfile ? "artifact-dockerfile-error" : "artifact-dockerfile-hint"}
                onChange={(event) => setDraft({ ...draft, dockerfile: event.target.value })}
              />
              {errors.dockerfile ? (
                <p className="field-error" id="artifact-dockerfile-error" role="alert">
                  {errors.dockerfile}
                </p>
              ) : (
                <p className="field-hint" id="artifact-dockerfile-hint">
                  Full-line comments are ignored. Continuation lines are joined. Not a Docker
                  engine.
                </p>
              )}
            </div>
            <div className="field">
              <label htmlFor="artifact-readme">README build and run commands</label>
              <textarea
                id="artifact-readme"
                className="mono-textarea"
                rows={6}
                maxLength={20_000}
                value={draft.readmeCommands}
                disabled={locked}
                aria-invalid={Boolean(errors.readmeCommands)}
                aria-describedby={errors.readmeCommands ? "artifact-readme-error" : "artifact-readme-hint"}
                onChange={(event) => setDraft({ ...draft, readmeCommands: event.target.value })}
              />
              {errors.readmeCommands ? (
                <p className="field-error" id="artifact-readme-error" role="alert">
                  {errors.readmeCommands}
                </p>
              ) : (
                <p className="field-hint" id="artifact-readme-hint">
                  Include both <code>docker build</code> and <code>docker run</code>. A published
                  container port must match an exposed TCP port.
                </p>
              )}
            </div>

            <div className="sample-buttons">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => loadSample(INCOMPLETE_BUNDLE)}
                disabled={locked}
              >
                Load incomplete sample
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => loadSample(COMPLETE_BUNDLE)}
                disabled={locked}
              >
                Load complete sample
              </button>
            </div>

            <div className="form-actions">
              {!pending && !supported ? (
                <button type="submit" className="btn btn-primary">
                  Submit artifact
                </button>
              ) : null}
              {pending ? (
                <>
                  <button type="button" className="btn btn-primary" onClick={run}>
                    Run verification
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      dispatch({ type: "EDIT_SUBMISSION", timestamp: nowIso() });
                      setErrors({});
                      setMessage(
                        "Submission withdrawn. Correct the fields in this local draft, then submit again.",
                      );
                    }}
                  >
                    Edit submission
                  </button>
                </>
              ) : null}
              {supported ? (
                <button type="button" className="btn btn-primary" onClick={onOpenProjects}>
                  View verified evidence in Projects
                </button>
              ) : null}
            </div>
          </form>

          {!pending && !supported && !verification.lastResult ? (
            <p className="micro-note">
              A malformed bundle stays Unsupported and writes no history. Load a sample to inspect
              the expected failure and pass paths.
            </p>
          ) : null}
          {supported ? (
            <p className="micro-note">
              The form is locked because this bundle passed. Verified evidence remains until reset.
            </p>
          ) : null}
        </section>

        <section className="panel checks-panel" aria-labelledby="checks-heading">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Results</p>
              <h2 id="checks-heading">Eight checks</h2>
            </div>
            {verification.lastResult ? (
              <span className={`check-summary ${verification.lastResult.passed ? "check-pass" : "check-fail"}`}>
                {verification.lastResult.checks.filter((check) => check.passed).length}/8 passed
              </span>
            ) : null}
          </div>

          {pending ? (
            <Callout tone="warning" title="Submitted; not yet verified.">
              <p>
                The bundle is stored as pending. Run verification to inspect all eight checks.
                Pending does not count as Supported.
              </p>
            </Callout>
          ) : null}

          {verification.lastResult ? (
            <>
              <p className="micro-note">
                Run at {formatDisplayDateTime(verification.lastResult.runAt)}. Checks inspect the
                bundle only; they do not build the image or run the container.
              </p>
              <ol className="check-list">
                {verification.lastResult.checks.map((check, index) => (
                  <CheckRow key={check.id} index={index + 1} check={check} />
                ))}
              </ol>
            </>
          ) : !pending ? (
            <div className="empty-state">
              <p className="empty-title">No verification run yet</p>
              <div className="empty-copy">
                Submit a valid bundle, then run verification. The result will list the inspected
                value and reason for every check.
              </div>
            </div>
          ) : null}

          {verifiedEvidence ? (
            <div className="verified-block">
              <p className="micro-label">Verified evidence created</p>
              <EvidenceCard evidence={verifiedEvidence} />
              <p className="micro-note">
                Reference: <code>{verification.verifiedEvidenceId}</code> · verified{" "}
                {verification.verifiedAt ? formatDisplayDateTime(verification.verifiedAt) : "unknown"}
              </p>
            </div>
          ) : null}
        </section>
      </div>

      <section className="panel history-panel" aria-labelledby="history-heading">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Audit ledger</p>
            <h2 id="history-heading">Verification history</h2>
          </div>
          <span className="panel-tag">{state.history.length} entries</span>
        </div>
        {state.history.length === 0 ? (
          <p className="empty-inline">No verification transitions recorded yet.</p>
        ) : (
          <ol className="history-list">
            {[...state.history].reverse().map((entry: HistoryEntry) => (
              <li key={entry.id}>
                <span className="history-time mono">{formatDisplayDateTime(entry.timestamp)}</span>
                <span className="history-transition">
                  <span className={`status-inline status-${entry.previous}`}>
                    {verificationStatusLabels[entry.previous]}
                  </span>
                  <span aria-hidden="true">→</span>
                  <span className={`status-inline status-${entry.next}`}>
                    {verificationStatusLabels[entry.next]}
                  </span>
                </span>
                <span className="history-summary">{entry.checkSummary}</span>
              </li>
            ))}
          </ol>
        )}
        <p className="micro-note">
          History stores the transition and check summary, never a second copy of the artifact.
        </p>
      </section>
    </div>
  );
}
