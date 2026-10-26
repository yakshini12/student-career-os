import type { ReactNode } from "react";

export function Callout({
  tone = "note",
  title,
  children,
}: {
  tone?: "note" | "warning" | "success" | "limit";
  title?: string;
  children: ReactNode;
}) {
  return (
    <div className={`callout callout-${tone}`}>
      {title ? <p className="callout-title">{title}</p> : null}
      <div>{children}</div>
    </div>
  );
}
