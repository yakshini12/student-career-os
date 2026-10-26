import type { EvidenceKind } from "./model/types";

export type View =
  | "today"
  | "profile"
  | "projects"
  | "opportunities"
  | "opportunity"
  | "verification";

export type NavSurface = "today" | "profile" | "projects" | "opportunities";

export interface ProjectIntent {
  projectId: string;
  evidenceKind?: EvidenceKind;
  nonce: number;
}

export const navItems: { id: NavSurface; label: string; icon: string }[] = [
  { id: "today", label: "Today", icon: "◉" },
  { id: "profile", label: "Profile & Practice", icon: "◍" },
  { id: "projects", label: "Projects", icon: "▤" },
  { id: "opportunities", label: "Opportunities", icon: "◎" },
];
