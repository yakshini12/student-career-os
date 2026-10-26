import { formatDisplayDate } from "../model/dates";
import type { EvidenceItem } from "../model/types";

const kindLabels: Record<EvidenceItem["kind"], string> = {
  repository: "Repository",
  readme: "README / docs",
  schema: "Schema",
  test_report: "Test report",
  deployment: "Deployment",
  dataset: "Dataset / pipeline",
  contribution: "Contribution",
  containerization: "Containerization",
  other: "Other",
};

function MetricRows({ evidence }: { evidence: EvidenceItem }) {
  const metrics = evidence.metrics;
  if (!metrics) return null;
  const rows: { label: string; value: string }[] = [];

  if (evidence.kind === "readme") {
    if (metrics.routeCount !== undefined) {
      rows.push({ label: "Routes documented", value: String(metrics.routeCount) });
    }
    rows.push({ label: "Setup content", value: metrics.hasSetup ? "Recorded" : "Not recorded" });
    rows.push({ label: "Usage content", value: metrics.hasUsage ? "Recorded" : "Not recorded" });
  }

  if (evidence.kind === "schema") {
    if (metrics.tableCount !== undefined) {
      rows.push({ label: "Tables", value: String(metrics.tableCount) });
    }
    rows.push({ label: "Primary key", value: metrics.hasPrimaryKey ? "Recorded" : "Not recorded" });
    rows.push({ label: "Foreign key", value: metrics.hasForeignKey ? "Recorded" : "Not recorded" });
  }

  if (evidence.kind === "test_report") {
    rows.push(
      metrics.testPassed === undefined
        ? { label: "Captured counts", value: "None" }
        : { label: "Passed", value: String(metrics.testPassed) },
    );
    if (metrics.testFailed !== undefined) {
      rows.push({ label: "Failed", value: String(metrics.testFailed) });
    }
    if (metrics.testErrors !== undefined) {
      rows.push({ label: "Errors", value: String(metrics.testErrors) });
    }
  }

  if (evidence.kind === "deployment") {
    if (metrics.platform) rows.push({ label: "Platform", value: metrics.platform });
    if (metrics.healthPath) rows.push({ label: "Health path", value: metrics.healthPath });
    if (metrics.healthResponse) {
      rows.push({ label: "Observed response", value: metrics.healthResponse });
    }
    if (metrics.capturedDate) {
      rows.push({ label: "Captured", value: formatDisplayDate(metrics.capturedDate) });
    }
    if (metrics.deployLog) {
      rows.push({ label: "Deploy log excerpt", value: metrics.deployLog });
    }
    rows.push({ label: "Live reachability", value: "Not verified" });
  }

  if (evidence.kind === "dataset") {
    if (metrics.pipelineInput) rows.push({ label: "Input", value: metrics.pipelineInput });
    if (metrics.pipelineTransformation) {
      rows.push({ label: "Transformation", value: metrics.pipelineTransformation });
    }
    if (metrics.pipelineOutput) rows.push({ label: "Output", value: metrics.pipelineOutput });
  }

  if (rows.length === 0) return null;
  return (
    <dl className="evidence-metrics">
      {rows.map((row) => (
        <div key={row.label}>
          <dt>{row.label}</dt>
          <dd>{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function EvidenceCard({
  evidence,
  onEdit,
  onRemove,
}: {
  evidence: EvidenceItem;
  onEdit?: (evidence: EvidenceItem) => void;
  onRemove?: (evidence: EvidenceItem) => void;
}) {
  const verified = evidence.source === "verified";
  return (
    <article className={`evidence-card${verified ? " evidence-verified" : ""}`}>
      <div className="evidence-topline">
        <span className="evidence-kind">{kindLabels[evidence.kind]}</span>
        <span className={`source-stamp source-${evidence.source}`}>
          {verified ? "Verified" : "Linked"}
        </span>
      </div>
      <h4>{evidence.label}</h4>
      {evidence.summary ? <p className="evidence-summary">{evidence.summary}</p> : null}
      <MetricRows evidence={evidence} />
      <p className="evidence-location">{evidence.location}</p>
      <div className="evidence-footer">
        <span className="mono">{evidence.id}</span>
        <span>
          Added {formatDisplayDate(evidence.addedAt.slice(0, 10))}
          {verified && evidence.verifiedAt
            ? ` · verified ${formatDisplayDate(evidence.verifiedAt.slice(0, 10))}`
            : ""}
        </span>
      </div>
      {verified ? (
        <p className="evidence-lock">Verified by the gate. Editing and removal are locked until reset.</p>
      ) : onEdit || onRemove ? (
        <div className="evidence-actions">
          {onEdit ? (
            <button type="button" className="btn btn-quiet" onClick={() => onEdit(evidence)}>
              Edit
            </button>
          ) : null}
          {onRemove ? (
            <button type="button" className="btn btn-quiet btn-quiet-danger" onClick={() => onRemove(evidence)}>
              Remove
            </button>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
