import { useState, type ReactNode } from "react";
import { useWorkspace } from "../store/workspace-context";
import type { NavSurface } from "../navigation";
import { ConfirmDialog } from "./ConfirmDialog";
import { SideNav } from "./SideNav";
import { TopBar } from "./TopBar";

export function AppShell({
  activeSurface,
  onNavigate,
  onReset,
  children,
}: {
  activeSurface: NavSurface;
  onNavigate: (surface: NavSurface) => void;
  onReset: () => void;
  children: ReactNode;
}) {
  const { state, persistenceAvailable, notice, dismissNotice } = useWorkspace();
  const [resetOpen, setResetOpen] = useState(false);

  return (
    <div className="app-shell">
      <a className="skip-link" href="#workspace-main">
        Skip to main content
      </a>
      <TopBar profile={state.profile} onReset={() => setResetOpen(true)} />
      {!persistenceAvailable ? (
        <p className="storage-warning" role="status">
          Changes will be lost when this page closes. Local storage is unavailable in this browser
          context.
        </p>
      ) : null}
      {notice ? (
        <div className="global-notice" role="status">
          <span>{notice}</span>
          <button type="button" className="btn btn-quiet" onClick={dismissNotice}>
            Dismiss
          </button>
        </div>
      ) : null}
      <div className="shell-body">
        <SideNav activeSurface={activeSurface} onNavigate={onNavigate} />
        <main id="workspace-main" className="workspace" tabIndex={-1}>
          {children}
        </main>
      </div>
      <footer className="app-footer">
        <p>
          Student Career OS is a local prototype. All students, projects, opportunities, and
          evidence are synthetic. Every opportunity is labelled <strong>Sample — not live</strong>.
        </p>
        <p>
          Evidence fit is a rule-based comparison, not readiness, hire probability, or an employer
          decision. No data leaves this browser.
        </p>
      </footer>
      {resetOpen ? (
        <ConfirmDialog
          title="Reset sample workspace?"
          message="This restores the seeded student, projects, opportunities, and applications. It also clears evidence you added, verification history, and the passed verification state. Deadlines are regenerated relative to today."
          confirmLabel="Reset sample"
          tone="danger"
          onConfirm={() => {
            setResetOpen(false);
            onReset();
          }}
          onClose={() => setResetOpen(false)}
        />
      ) : null}
    </div>
  );
}
