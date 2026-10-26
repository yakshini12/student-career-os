import type { FitStatus, VerificationStatus } from "../model/types";

const fitLabels: Record<FitStatus, string> = {
  supported: "Supported",
  partial: "Partial",
  missing: "Missing",
};

const verificationLabels: Record<VerificationStatus, string> = {
  supported: "Supported",
  pending: "Pending verification",
  unsupported: "Unsupported",
};

export function StatusChip({
  status,
  kind = "fit",
}: {
  status: FitStatus | VerificationStatus;
  kind?: "fit" | "verification";
}) {
  const label =
    kind === "verification"
      ? verificationLabels[status as VerificationStatus]
      : fitLabels[status as FitStatus];
  return <span className={`status-chip status-${status}`}>{label}</span>;
}
