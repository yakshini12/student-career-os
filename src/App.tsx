import { useCallback, useEffect, useState } from "react";
import { AppShell } from "./components/AppShell";
import { WorkspaceProvider } from "./store/WorkspaceProvider";
import { useWorkspace } from "./store/workspace-context";
import type { NavSurface, ProjectIntent, View } from "./navigation";
import type { EvidenceKind, RankedAction } from "./model/types";
import { TodayView } from "./views/TodayView";
import { ProfileView } from "./views/ProfileView";
import { ProjectsView } from "./views/ProjectsView";
import { OpportunitiesView } from "./views/OpportunitiesView";
import { OpportunityDetailView } from "./views/OpportunityDetailView";
import { VerificationView } from "./views/VerificationView";

function WorkspaceApp() {
  const { state, dispatch, reset } = useWorkspace();
  const [view, setView] = useState<View>("today");
  const [projectIntent, setProjectIntent] = useState<ProjectIntent | null>(null);
  const [profileHighlight, setProfileHighlight] = useState({ active: false, nonce: 0 });

  const activeSurface: NavSurface =
    view === "opportunity" ? "opportunities" : view === "verification" ? "projects" : view;

  useEffect(() => {
    document.getElementById("workspace-main")?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [view]);

  const navigate = useCallback((surface: NavSurface) => {
    setProjectIntent(null);
    setProfileHighlight({ active: false, nonce: 0 });
    setView(surface);
  }, []);

  const openOpportunity = useCallback(
    (opportunityId: string) => {
      dispatch({ type: "SELECT_OPPORTUNITY", opportunityId });
      setProjectIntent(null);
      setProfileHighlight({ active: false, nonce: 0 });
      setView("opportunity");
    },
    [dispatch],
  );

  const openProject = useCallback((projectId: string, evidenceKind?: EvidenceKind) => {
    setProfileHighlight({ active: false, nonce: 0 });
    setProjectIntent({ projectId, evidenceKind, nonce: Date.now() });
    setView("projects");
  }, []);

  const openProfile = useCallback((highlightDsa = false) => {
    setProjectIntent(null);
    setProfileHighlight((current) =>
      highlightDsa
        ? { active: true, nonce: current.nonce + 1 }
        : { active: false, nonce: current.nonce },
    );
    setView("profile");
  }, []);

  const openVerification = useCallback(() => {
    setProjectIntent(null);
    setProfileHighlight({ active: false, nonce: 0 });
    setView("verification");
  }, []);

  const openAction = useCallback(
    (action: RankedAction) => {
      if (action.destination === "verification") {
        openVerification();
      } else if (action.destination === "profile") {
        openProfile(true);
      } else {
        const projectId =
          action.targetProjectId ??
          state.projects.find((project) => project.capabilities.includes(action.capability))?.id ??
          state.projects[0]?.id;
        if (projectId) openProject(projectId, action.evidenceKind);
      }
    },
    [openProfile, openProject, openVerification, state.projects],
  );

  const resetWorkspace = useCallback(() => {
    reset();
    setProjectIntent(null);
    setProfileHighlight({ active: false, nonce: 0 });
    setView("today");
  }, [reset]);

  return (
    <AppShell activeSurface={activeSurface} onNavigate={navigate} onReset={resetWorkspace}>
      {view === "today" ? (
        <TodayView
          onOpenOpportunity={openOpportunity}
          onOpenAction={openAction}
          onOpenProfile={() => openProfile(false)}
          onOpenProjects={() => navigate("projects")}
        />
      ) : null}
      {view === "profile" ? (
        <ProfileView
          key={state.seededAt}
          highlightDsa={profileHighlight.active}
          highlightNonce={profileHighlight.nonce}
        />
      ) : null}
      {view === "projects" ? (
        <ProjectsView focus={projectIntent} onOpenVerification={openVerification} />
      ) : null}
      {view === "opportunities" ? (
        <OpportunitiesView onOpenOpportunity={openOpportunity} />
      ) : null}
      {view === "opportunity" ? (
        <OpportunityDetailView
          onBack={() => navigate("opportunities")}
          onOpenAction={openAction}
          onOpenProject={openProject}
          onOpenProfile={openProfile}
          onOpenVerification={openVerification}
        />
      ) : null}
      {view === "verification" ? (
        <VerificationView
          key={state.seededAt}
          onBackToOpportunity={() => setView("opportunity")}
          onOpenProjects={() => navigate("projects")}
        />
      ) : null}
    </AppShell>
  );
}

export default function App() {
  return (
    <WorkspaceProvider>
      <WorkspaceApp />
    </WorkspaceProvider>
  );
}
