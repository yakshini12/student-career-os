import { createContext, useContext, type Dispatch } from "react";
import type { WorkspaceAction } from "../model/state";
import type { WorkspaceState } from "../model/types";

export interface WorkspaceContextValue {
  state: WorkspaceState;
  dispatch: Dispatch<WorkspaceAction>;
  today: string;
  persistenceAvailable: boolean;
  notice: string | null;
  dismissNotice: () => void;
  reset: () => void;
}

export const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function useWorkspace(): WorkspaceContextValue {
  const value = useContext(WorkspaceContext);
  if (!value) throw new Error("useWorkspace must be used inside WorkspaceProvider");
  return value;
}
