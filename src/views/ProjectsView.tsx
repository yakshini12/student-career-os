import { useEffect, useRef, useState } from "react";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { EvidenceCard } from "../components/EvidenceCard";
import { EvidenceForm } from "../components/EvidenceForm";
import {
  capabilityLabels,
  evidenceKindLabels,
  milestoneStatusLabels,
} from "../data/copy";
import type { EvidenceItem, EvidenceKind, MilestoneStatus, Project } from "../model/types";
import type { ProjectIntent } from "../navigation";
import { useWorkspace } from "../store/workspace-context";

interface FormTarget {
  project: Project;
  evidence?: EvidenceItem;
  initialKind?: EvidenceKind;
}

export function ProjectsView({
  focus,
  onOpenVerification,
}: {
  focus: ProjectIntent | null;
  onOpenVerification: () => void;
}) {
  const { state, dispatch, today } = useWorkspace();
  const [formTarget, setFormTarget] = useState<FormTarget | null>(null);
  const [removeTarget, setRemoveTarget] = useState<EvidenceItem | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [focusedProject, setFocusedProject] = useState<string | null>(null);
  const handledNonce = useRef<number | null>(null);

  const projectById = (projectId: string) => state.projects.find((project) => project.id === projectId);

  useEffect(() => {
    if (!focus || handledNonce.current === focus.nonce) return;
    handledNonce.current = focus.nonce;
    const project = state.projects.find((item) => item.id === focus.projectId);
    if (!project) return;
    // oxlint-disable-next-line react/set-state-in-effect -- opening the evidence form is the response to a navigation intent
    setFocusedProject(project.id);
    document.getElementById(`project-${project.id}`)?.scrollIntoView({ block: "start" });
    // oxlint-disable-next-line react/set-state-in-effect -- opening the evidence form is the response to a navigation intent
    setFormTarget({ project, initialKind: focus.evidenceKind });
  }, [focus, state.projects]);

  const handleSave = (evidence: EvidenceItem) => {
    const target = formTarget;
    if (!target) return;
    if (target.evidence) {
      dispatch({ type: "UPDATE_EVIDENCE", evidence });
      setSavedMessage(`Saved changes to ${evidence.label}.`);
    } else {
      dispatch({ type: "ADD_EVIDENCE", evidence });
      setSavedMessage(`Added ${evidenceKindLabels[evidence.kind].toLowerCase()} evidence to ${target.project.name}.`);
    }
    setFormTarget(null);
  };

  const handleRemove = () => {
    if (!removeTarget) return;
    dispatch({ type: "REMOVE_EVIDENCE", evidenceId: removeTarget.id });
    setSavedMessage(`Removed ${removeTarget.label}. Fit was recomputed from the remaining evidence.`);
    setRemoveTarget(null);
  };

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <p className="eyebrow">Projects & Evidence</p>
          <h1>Work you can point to</h1>
          <p className="page-lede">
            Milestones are progress notes. Evidence is what fit reads. Adding, editing, or removing
            linked evidence recomputes requirement fit immediately.
          </p>
        </div>
        <span className="page-stamp">
          {state.projects.reduce((count, project) => count + project.evidence.length, 0)} evidence
          records
        </span>
      </header>

      {savedMessage ? (
        <p className="success-note" role="status">
          {savedMessage}
        </p>
      ) : null}

      <div className="project-stack">
        {state.projects.map((project) => {
          const isCampusCart = project.id === "campus_cart";
          return (
            <section
              className={`panel project-card${focusedProject === project.id ? " panel-highlight" : ""}`}
              key={project.id}
              id={`project-${project.id}`}
              aria-labelledby={`project-${project.id}-heading`}
            >
              <div className="project-head">
                <div>
                  <p className="eyebrow">{project.technologies.join(" · ")}</p>
                  <h2 id={`project-${project.id}-heading`}>{project.name}</h2>
                  <p className="project-summary">{project.summary}</p>
                </div>
                <div className="project-head-actions">
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => setFormTarget({ project, initialKind: "repository" })}
                  >
                    Add evidence
                  </button>
                  {isCampusCart ? (
                    <button type="button" className="btn btn-secondary" onClick={onOpenVerification}>
                      Open verification gate
                    </button>
                  ) : null}
                </div>
              </div>

              <div className="capability-tags" aria-label="Recorded capabilities">
                {project.capabilities.map((capability) => (
                  <span className="tag" key={capability}>
                    {capabilityLabels[capability]}
                  </span>
                ))}
                <span className="tag tag-muted">Containerization: gate only</span>
              </div>

              <div className="project-columns">
                <div>
                  <h3 className="subheading">Milestones</h3>
                  <ul className="milestone-list">
                    {project.milestones.map((milestone) => (
                      <li key={milestone.id}>
                        <div className="milestone-text">
                          <label htmlFor={`milestone-${milestone.id}`}>{milestone.label}</label>
                          {milestone.teamContributed ? (
                            <span className="tag tag-muted">Team contributed</span>
                          ) : null}
                        </div>
                        <select
                          id={`milestone-${milestone.id}`}
                          value={milestone.status}
                          onChange={(event) =>
                            dispatch({
                              type: "SET_MILESTONE",
                              projectId: project.id,
                              milestoneId: milestone.id,
                              status: event.target.value as MilestoneStatus,
                            })
                          }
                        >
                          {(Object.keys(milestoneStatusLabels) as MilestoneStatus[]).map((status) => (
                            <option key={status} value={status}>
                              {milestoneStatusLabels[status]}
                            </option>
                          ))}
                        </select>
                      </li>
                    ))}
                  </ul>
                  <p className="micro-note">
                    A milestone alone never creates evidence or changes verification state.
                  </p>
                </div>

                <div>
                  <div className="subheading-row">
                    <h3 className="subheading">Evidence</h3>
                    <span className="micro-note">{project.evidence.length} records</span>
                  </div>
                  <p className="micro-note evidence-disclaimer">
                    Linked evidence is recorded, not independently verified. The app never opens a
                    link.
                  </p>
                  {project.evidence.length === 0 ? (
                    <p className="empty-inline">No evidence recorded for this project yet.</p>
                  ) : (
                    <div className="evidence-grid">
                      {project.evidence.map((evidence) => (
                        <EvidenceCard
                          key={evidence.id}
                          evidence={evidence}
                          onEdit={
                            evidence.source === "verified"
                              ? undefined
                              : (item) => {
                                  const owner = projectById(item.projectId);
                                  if (owner) setFormTarget({ project: owner, evidence: item });
                                }
                          }
                          onRemove={
                            evidence.source === "verified" ? undefined : (item) => setRemoveTarget(item)
                          }
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </section>
          );
        })}
      </div>

      {formTarget ? (
        <EvidenceForm
          projectId={formTarget.project.id}
          projectName={formTarget.project.name}
          today={today}
          evidence={formTarget.evidence}
          initialKind={formTarget.initialKind}
          onSave={handleSave}
          onClose={() => setFormTarget(null)}
        />
      ) : null}

      {removeTarget ? (
        <ConfirmDialog
          title="Remove evidence?"
          message={`Remove “${removeTarget.label}” from ${
            projectById(removeTarget.projectId)?.name ?? "this project"
          }? Fit is recomputed from the remaining evidence. This cannot be undone.`}
          confirmLabel="Remove evidence"
          tone="danger"
          onConfirm={handleRemove}
          onClose={() => setRemoveTarget(null)}
        />
      ) : null}
    </div>
  );
}
