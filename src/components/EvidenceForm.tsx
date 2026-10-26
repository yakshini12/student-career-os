import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  blankDraft,
  draftFromEvidence,
  newEvidenceId,
  validateEvidenceDraft,
  type EvidenceDraft,
} from "../model/evidence";
import type { EvidenceItem, EvidenceKind } from "../model/types";
import { FieldError } from "./FieldError";
import { Modal } from "./Modal";

const selectableKinds: { value: EvidenceKind; label: string }[] = [
  { value: "repository", label: "Repository" },
  { value: "readme", label: "README / documentation" },
  { value: "schema", label: "Database schema" },
  { value: "test_report", label: "Test report" },
  { value: "deployment", label: "Deployment" },
  { value: "dataset", label: "Dataset / pipeline" },
  { value: "contribution", label: "Contribution" },
  { value: "other", label: "Other" },
];

export function EvidenceForm({
  projectId,
  projectName,
  today,
  evidence,
  initialKind,
  onSave,
  onClose,
}: {
  projectId: string;
  projectName: string;
  today: string;
  evidence?: EvidenceItem;
  initialKind?: EvidenceKind;
  onSave: (evidence: EvidenceItem) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<EvidenceDraft>(() =>
    evidence ? draftFromEvidence(evidence) : blankDraft(projectId, initialKind ?? "repository"),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const summaryRef = useRef<HTMLDivElement>(null);
  const editing = Boolean(evidence);

  useEffect(() => {
    if (Object.keys(errors).length > 0) summaryRef.current?.focus();
  }, [errors]);

  const set = <K extends keyof EvidenceDraft>(key: K, value: EvidenceDraft[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const changeKind = (kind: EvidenceKind) => {
    setDraft((current) => ({
      ...blankDraft(projectId, kind),
      label: current.label,
      location: current.location,
      summary: current.summary,
    }));
    setErrors({});
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const result = validateEvidenceDraft(draft, today);
    if (!result.evidence) {
      setErrors(result.errors);
      return;
    }
    const saved: EvidenceItem = {
      ...result.evidence,
      projectId,
      id: evidence?.id ?? newEvidenceId(),
      source: "linked",
      addedAt: evidence?.addedAt ?? new Date().toISOString(),
    };
    delete saved.verifiedAt;
    onSave(saved);
  };

  const describedBy = (key: string) => (errors[key] ? `evidence-${key}-error` : undefined);

  return (
    <Modal
      title={editing ? "Edit evidence" : "Add evidence"}
      description={`${projectName} · linked evidence is recorded, not independently verified.`}
      onClose={onClose}
      wide
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" form="evidence-form" className="btn btn-primary">
            {editing ? "Save changes" : "Save evidence"}
          </button>
        </>
      }
    >
      <form id="evidence-form" onSubmit={submit} noValidate>
        {Object.keys(errors).length > 0 ? (
          <div className="error-summary" role="alert" tabIndex={-1} ref={summaryRef}>
            <p className="error-summary-title">Evidence was not saved. Fix these fields:</p>
            <ul>
              {Object.entries(errors).map(([key, message]) => (
                <li key={key}>{message}</li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="form-grid">
          <div className="field">
            <label htmlFor="evidence-kind">Evidence type</label>
            <select
              id="evidence-kind"
              value={draft.kind}
              onChange={(event) => changeKind(event.target.value as EvidenceKind)}
              disabled={editing}
            >
              {selectableKinds.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {editing ? (
              <p className="field-hint">The type is fixed while editing. Add a new item to change type.</p>
            ) : (
              <p className="field-hint">
                Containerization evidence is created only by the verification gate.
              </p>
            )}
          </div>

          <div className="field">
            <label htmlFor="evidence-label">Label</label>
            <input
              id="evidence-label"
              value={draft.label}
              maxLength={80}
              aria-invalid={Boolean(errors.label)}
              aria-describedby={describedBy("label")}
              onChange={(event) => set("label", event.target.value)}
            />
            <FieldError id="evidence-label-error" message={errors.label} />
          </div>

          <div className="field field-wide">
            <label htmlFor="evidence-location">
              {draft.kind === "deployment" ? "Live HTTPS URL" : "Location or note"}
            </label>
            <input
              id="evidence-location"
              value={draft.location}
              maxLength={500}
              placeholder={
                draft.kind === "deployment"
                  ? "https://example.invalid/service"
                  : "README.md, repository URL, or file path"
              }
              aria-invalid={Boolean(errors.location)}
              aria-describedby={describedBy("location")}
              onChange={(event) => set("location", event.target.value)}
            />
            <p className="field-hint">The link is recorded, not opened or verified.</p>
            <FieldError id="evidence-location-error" message={errors.location} />
          </div>

          <div className="field field-wide">
            <label htmlFor="evidence-summary">
              Summary{draft.kind === "contribution" ? "" : " (optional)"}
            </label>
            <textarea
              id="evidence-summary"
              rows={3}
              maxLength={500}
              value={draft.summary}
              aria-invalid={Boolean(errors.summary)}
              aria-describedby={describedBy("summary")}
              onChange={(event) => set("summary", event.target.value)}
            />
            <FieldError id="evidence-summary-error" message={errors.summary} />
          </div>

          {draft.kind === "readme" ? (
            <>
              <div className="field">
                <label htmlFor="evidence-routes">Routes documented (optional)</label>
                <input
                  id="evidence-routes"
                  inputMode="numeric"
                  value={draft.routeCount}
                  aria-invalid={Boolean(errors.routeCount)}
                  aria-describedby={describedBy("routeCount")}
                  onChange={(event) => set("routeCount", event.target.value)}
                />
                <FieldError id="evidence-routeCount-error" message={errors.routeCount} />
              </div>
              <div className="field checkbox-field">
                <label>
                  <input
                    type="checkbox"
                    checked={draft.hasSetup}
                    onChange={(event) => set("hasSetup", event.target.checked)}
                  />
                  README includes setup content
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={draft.hasUsage}
                    onChange={(event) => set("hasUsage", event.target.checked)}
                  />
                  README includes usage content
                </label>
              </div>
            </>
          ) : null}

          {draft.kind === "schema" ? (
            <>
              <div className="field">
                <label htmlFor="evidence-tables">Table count</label>
                <input
                  id="evidence-tables"
                  inputMode="numeric"
                  value={draft.tableCount}
                  aria-invalid={Boolean(errors.tableCount)}
                  aria-describedby={describedBy("tableCount")}
                  onChange={(event) => set("tableCount", event.target.value)}
                />
                <FieldError id="evidence-tableCount-error" message={errors.tableCount} />
              </div>
              <div className="field checkbox-field">
                <label>
                  <input
                    type="checkbox"
                    checked={draft.hasPrimaryKey}
                    onChange={(event) => set("hasPrimaryKey", event.target.checked)}
                  />
                  Schema records a primary key
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={draft.hasForeignKey}
                    onChange={(event) => set("hasForeignKey", event.target.checked)}
                  />
                  Schema records a foreign key
                </label>
              </div>
            </>
          ) : null}

          {draft.kind === "test_report" ? (
            <fieldset className="field field-wide field-group">
              <legend>Test counts (optional as a group)</legend>
              <div className="three-up">
                <div>
                  <label htmlFor="evidence-passed">Passed</label>
                  <input
                    id="evidence-passed"
                    inputMode="numeric"
                    value={draft.testPassed}
                    aria-invalid={Boolean(errors.testCounts)}
                    aria-describedby={describedBy("testCounts")}
                    onChange={(event) => set("testPassed", event.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="evidence-failed">Failed</label>
                  <input
                    id="evidence-failed"
                    inputMode="numeric"
                    value={draft.testFailed}
                    aria-invalid={Boolean(errors.testCounts)}
                    onChange={(event) => set("testFailed", event.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="evidence-errors">Errors</label>
                  <input
                    id="evidence-errors"
                    inputMode="numeric"
                    value={draft.testErrors}
                    aria-invalid={Boolean(errors.testCounts)}
                    onChange={(event) => set("testErrors", event.target.value)}
                  />
                </div>
              </div>
              <p className="field-hint">Leave all three blank to save a partial test note.</p>
              <FieldError id="evidence-testCounts-error" message={errors.testCounts} />
            </fieldset>
          ) : null}

          {draft.kind === "deployment" ? (
            <>
              <div className="field">
                <label htmlFor="evidence-health-path">Health path</label>
                <input
                  id="evidence-health-path"
                  value={draft.healthPath}
                  placeholder="/health"
                  aria-invalid={Boolean(errors.healthPath)}
                  aria-describedby={describedBy("healthPath")}
                  onChange={(event) => set("healthPath", event.target.value)}
                />
                <FieldError id="evidence-healthPath-error" message={errors.healthPath} />
              </div>
              <div className="field">
                <label htmlFor="evidence-health-response">Observed response</label>
                <input
                  id="evidence-health-response"
                  value={draft.healthResponse}
                  placeholder='{"status":"ok"}'
                  aria-invalid={Boolean(errors.healthResponse)}
                  aria-describedby={describedBy("healthResponse")}
                  onChange={(event) => set("healthResponse", event.target.value)}
                />
                <FieldError id="evidence-healthResponse-error" message={errors.healthResponse} />
              </div>
              <div className="field">
                <label htmlFor="evidence-platform">Platform</label>
                <select
                  id="evidence-platform"
                  value={draft.platform}
                  aria-invalid={Boolean(errors.platform)}
                  aria-describedby={describedBy("platform")}
                  onChange={(event) => set("platform", event.target.value)}
                >
                  {["Render", "Railway", "Fly.io", "Vercel", "Other"].map((platform) => (
                    <option key={platform} value={platform}>
                      {platform}
                    </option>
                  ))}
                </select>
                <FieldError id="evidence-platform-error" message={errors.platform} />
              </div>
              <div className="field">
                <label htmlFor="evidence-captured">Captured date</label>
                <input
                  id="evidence-captured"
                  type="date"
                  max={today}
                  value={draft.capturedDate}
                  aria-invalid={Boolean(errors.capturedDate)}
                  aria-describedby={describedBy("capturedDate")}
                  onChange={(event) => set("capturedDate", event.target.value)}
                />
                <FieldError id="evidence-capturedDate-error" message={errors.capturedDate} />
              </div>
              <div className="field field-wide">
                <label htmlFor="evidence-deploy-log">Deploy log excerpt</label>
                <textarea
                  id="evidence-deploy-log"
                  rows={3}
                  value={draft.deployLog}
                  aria-invalid={Boolean(errors.deployLog)}
                  aria-describedby={describedBy("deployLog")}
                  onChange={(event) => set("deployLog", event.target.value)}
                />
                <FieldError id="evidence-deployLog-error" message={errors.deployLog} />
              </div>
              <p className="field-hint field-wide">
                This records what you observed. The app does not open the URL, check DNS or TLS,
                test uptime, or confirm the deployed commit.
              </p>
            </>
          ) : null}

          {draft.kind === "dataset" ? (
            <fieldset className="field field-wide field-group">
              <legend>Pipeline description (optional as a group)</legend>
              <div className="field">
                <label htmlFor="evidence-pipeline-input">Input</label>
                <input
                  id="evidence-pipeline-input"
                  value={draft.pipelineInput}
                  aria-invalid={Boolean(errors.pipelineFields)}
                  aria-describedby={describedBy("pipelineFields")}
                  onChange={(event) => set("pipelineInput", event.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="evidence-pipeline-transformation">Transformation</label>
                <input
                  id="evidence-pipeline-transformation"
                  value={draft.pipelineTransformation}
                  aria-invalid={Boolean(errors.pipelineFields)}
                  onChange={(event) => set("pipelineTransformation", event.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="evidence-pipeline-output">Output</label>
                <input
                  id="evidence-pipeline-output"
                  value={draft.pipelineOutput}
                  aria-invalid={Boolean(errors.pipelineFields)}
                  onChange={(event) => set("pipelineOutput", event.target.value)}
                />
              </div>
              <FieldError id="evidence-pipelineFields-error" message={errors.pipelineFields} />
            </fieldset>
          ) : null}
        </div>
      </form>
    </Modal>
  );
}
