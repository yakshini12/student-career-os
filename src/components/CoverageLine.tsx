import type { FitRow } from "../model/types";

export function CoverageLine({ rows, label = "Evidence fit" }: { rows: FitRow[]; label?: string }) {
  const supported = rows.filter((row) => row.status === "supported").length;
  const total = rows.length;
  return (
    <div className="coverage-line">
      <span className="coverage-number">
        {supported} of {total}
      </span>
      <span>{label} supported</span>
      <span className="coverage-meter" aria-hidden="true">
        <span style={{ width: `${total === 0 ? 0 : (supported / total) * 100}%` }} />
      </span>
    </div>
  );
}
