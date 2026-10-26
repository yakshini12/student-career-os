import { timelineLabel } from "../data/copy";
import type { Profile } from "../model/types";

export function TopBar({
  profile,
  onReset,
}: {
  profile: Profile;
  onReset: () => void;
}) {
  return (
    <header className="top-bar">
      <div className="brand">
        <span className="brand-mark" aria-hidden="true">
          SC
        </span>
        <div>
          <p className="brand-kicker">Local career field notebook</p>
          <p className="brand-name">Student Career OS</p>
        </div>
      </div>
      <div className="identity">
        <p className="identity-name">{profile.name}</p>
        <p className="identity-target">
          {profile.targetRole} · {timelineLabel(profile.targetTimeline)}
        </p>
      </div>
      <div className="top-actions">
        <span className="synthetic-badge">Synthetic sample workspace</span>
        <button type="button" className="btn btn-secondary" onClick={onReset}>
          Reset sample
        </button>
      </div>
    </header>
  );
}
