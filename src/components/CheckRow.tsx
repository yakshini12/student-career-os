import type { VerificationCheck } from "../model/types";

export function CheckRow({ index, check }: { index: number; check: VerificationCheck }) {
  return (
    <li className={`check-row ${check.passed ? "check-pass" : "check-fail"}`}>
      <span className="check-number" aria-hidden="true">
        {index}
      </span>
      <div className="check-main">
        <div className="check-heading">
          <span className="check-label">{check.label}</span>
          <span className={`check-status ${check.passed ? "check-status-pass" : "check-status-fail"}`}>
            {check.passed ? "Pass" : "Fail"}
          </span>
        </div>
        <p className="check-inspected">
          <span className="mono-label">Inspected:</span> <code>{check.inspected}</code>
        </p>
        <p className="check-reason">{check.reason}</p>
      </div>
    </li>
  );
}
