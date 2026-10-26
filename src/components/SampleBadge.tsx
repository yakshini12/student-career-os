export function SampleBadge({ label = "Sample — not live" }: { label?: string }) {
  return <span className="sample-badge">{label}</span>;
}
