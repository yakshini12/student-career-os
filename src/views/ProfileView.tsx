import { useEffect, useRef, useState, type FormEvent } from "react";
import { DsaCalculation } from "../components/DsaCalculation";
import { FieldError } from "../components/FieldError";
import { PRACTICE_NOTICE, PRACTICE_SAMPLE_LABEL, timelineLabel } from "../data/copy";
import { dsaCalculation } from "../model/fit";
import type { Profile, TargetTimeline } from "../model/types";
import { useWorkspace } from "../store/workspace-context";

const timelines: TargetTimeline[] = ["3_months", "6_months", "12_months"];

export function ProfileView({ highlightDsa = false, highlightNonce = 0 }: { highlightDsa?: boolean; highlightNonce?: number }) {
  const { state, dispatch } = useWorkspace();
  const [form, setForm] = useState<Profile>(state.profile);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);
  const summaryRef = useRef<HTMLDivElement>(null);
  const dsaRef = useRef<HTMLElement>(null);
  const practice = state.practice;
  const calculation = dsaCalculation(state);

  useEffect(() => {
    if (Object.keys(errors).length > 0) summaryRef.current?.focus();
  }, [errors]);

  useEffect(() => {
    if (highlightDsa) {
      dsaRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
      dsaRef.current?.focus({ preventScroll: true });
    }
  }, [highlightDsa, highlightNonce]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const next: Record<string, string> = {};
    const name = form.name.trim();
    const targetRole = form.targetRole.trim();
    if (name.length < 2 || name.length > 60) {
      next.name = "Name must be 2–60 characters.";
    }
    if (targetRole.length < 2 || targetRole.length > 80) {
      next.targetRole = "Target role must be 2–80 characters.";
    }
    if (!timelines.includes(form.targetTimeline)) {
      next.targetTimeline = "Choose a supported timeline.";
    }
    if (Object.keys(next).length > 0) {
      setErrors(next);
      setSaved(false);
      return;
    }
    dispatch({
      type: "SAVE_PROFILE",
      profile: { name, targetRole, targetTimeline: form.targetTimeline },
    });
    setForm({ name, targetRole, targetTimeline: form.targetTimeline });
    setErrors({});
    setSaved(true);
  };

  const cancel = () => {
    setForm(state.profile);
    setErrors({});
    setSaved(false);
  };

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <p className="eyebrow">Profile & Practice</p>
          <h1>The student behind the evidence</h1>
          <p className="page-lede">
            Profile details are the only editable identity fields. Practice is a seeded snapshot
            and is not synced from a coding platform.
          </p>
        </div>
        <span className="page-stamp">{PRACTICE_SAMPLE_LABEL}</span>
      </header>

      <div className="profile-layout">
        <section className="panel" aria-labelledby="profile-form-heading">
          <div className="panel-heading">
            <h2 id="profile-form-heading">Profile</h2>
            <span className="panel-tag">Saved workspace preference</span>
          </div>
          <form onSubmit={submit} noValidate>
            {Object.keys(errors).length > 0 ? (
              <div className="error-summary" role="alert" tabIndex={-1} ref={summaryRef}>
                <p className="error-summary-title">Profile was not saved. Fix these fields:</p>
                <ul>
                  {Object.values(errors).map((message) => (
                    <li key={message}>{message}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {saved ? (
              <p className="success-note" role="status">
                Profile saved.
              </p>
            ) : null}
            <div className="field">
              <label htmlFor="profile-name">Name</label>
              <input
                id="profile-name"
                value={form.name}
                maxLength={60}
                aria-invalid={Boolean(errors.name)}
                aria-describedby={errors.name ? "profile-name-error" : undefined}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
              />
              <FieldError id="profile-name-error" message={errors.name} />
            </div>
            <div className="field">
              <label htmlFor="profile-role">Target role</label>
              <input
                id="profile-role"
                value={form.targetRole}
                maxLength={80}
                aria-invalid={Boolean(errors.targetRole)}
                aria-describedby={errors.targetRole ? "profile-role-error" : undefined}
                onChange={(event) => setForm({ ...form, targetRole: event.target.value })}
              />
              <FieldError id="profile-role-error" message={errors.targetRole} />
              <p className="field-hint">
                A workspace preference only. It does not alter opportunity requirements or fit.
              </p>
            </div>
            <div className="field">
              <label htmlFor="profile-timeline">Target timeline</label>
              <select
                id="profile-timeline"
                value={form.targetTimeline}
                aria-invalid={Boolean(errors.targetTimeline)}
                aria-describedby={errors.targetTimeline ? "profile-timeline-error" : undefined}
                onChange={(event) =>
                  setForm({ ...form, targetTimeline: event.target.value as TargetTimeline })
                }
              >
                {timelines.map((timeline) => (
                  <option key={timeline} value={timeline}>
                    {timelineLabel(timeline)}
                  </option>
                ))}
              </select>
              <FieldError id="profile-timeline-error" message={errors.targetTimeline} />
            </div>
            <div className="form-actions">
              <button type="submit" className="btn btn-primary">
                Save profile
              </button>
              <button type="button" className="btn btn-secondary" onClick={cancel}>
                Cancel
              </button>
            </div>
          </form>
        </section>

        <section className="panel" aria-labelledby="practice-heading">
          <div className="panel-heading">
            <h2 id="practice-heading">Practice snapshot</h2>
            <span className="panel-tag">Read-only</span>
          </div>
          <div className="stat-row stat-row-wide">
            <div className="stat">
              <span className="stat-value">{practice.totalSolved}</span>
              <span className="stat-label">total solved</span>
            </div>
            <div className="stat">
              <span className="stat-value">{practice.sqlSolved}</span>
              <span className="stat-label">SQL problems</span>
            </div>
            <div className="stat">
              <span className="stat-value">{practice.contests}</span>
              <span className="stat-label">contests</span>
            </div>
            <div className="stat">
              <span className="stat-value">{practice.bestRank}</span>
              <span className="stat-label">best rank</span>
            </div>
            <div className="stat">
              <span className="stat-value">{practice.rating}</span>
              <span className="stat-label">current rating</span>
            </div>
            <div className="stat">
              <span className="stat-value">{practice.recentSubmissions}</span>
              <span className="stat-label">last 14 days</span>
            </div>
          </div>
          <table className="topic-table">
            <caption>Core topic counts</caption>
            <thead>
              <tr>
                <th scope="col">Topic</th>
                <th scope="col">Solved</th>
                <th scope="col">At 10+</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">Arrays</th>
                <td>{practice.topics.arrays}</td>
                <td>{practice.topics.arrays >= 10 ? "Yes" : "No"}</td>
              </tr>
              <tr>
                <th scope="row">Strings</th>
                <td>{practice.topics.strings}</td>
                <td>{practice.topics.strings >= 10 ? "Yes" : "No"}</td>
              </tr>
              <tr>
                <th scope="row">Trees</th>
                <td>{practice.topics.trees}</td>
                <td>{practice.topics.trees >= 10 ? "Yes" : "No"}</td>
              </tr>
              <tr>
                <th scope="row">Linked lists</th>
                <td>{practice.topics.linkedLists}</td>
                <td>{practice.topics.linkedLists >= 10 ? "Yes" : "No"}</td>
              </tr>
              <tr>
                <th scope="row">Graphs</th>
                <td>{practice.topics.graphs}</td>
                <td>{practice.topics.graphs >= 10 ? "Yes" : "No"}</td>
              </tr>
              <tr>
                <th scope="row">Dynamic programming</th>
                <td>{practice.topics.dp}</td>
                <td>{practice.topics.dp >= 10 ? "Yes" : "No"}</td>
              </tr>
            </tbody>
          </table>
          <p className="micro-note">{PRACTICE_NOTICE}</p>
        </section>
      </div>

      <section
        className={`panel dsa-panel${highlightDsa ? " panel-highlight" : ""}`}
        aria-labelledby="dsa-heading"
        ref={dsaRef}
        tabIndex={-1}
      >
        <div className="panel-heading">
          <div>
            <p className="eyebrow">DSA calculation</p>
            <h2 id="dsa-heading">DSA threshold calculation</h2>
          </div>
          <span className="panel-tag">Visible rule outcome</span>
        </div>
        <DsaCalculation calculation={calculation} />
        <p className="micro-note">
          Guidance only. Practice editing and coding-platform sync are outside this prototype.
        </p>
      </section>
    </div>
  );
}
