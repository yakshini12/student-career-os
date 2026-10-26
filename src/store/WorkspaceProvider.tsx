import { useCallback, useEffect, useMemo, useReducer, useState } from "react";
import type { ReactNode } from "react";
import { buildSeed } from "../data/seed";
import { nowIso } from "../model/dates";
import {
  loadWorkspace,
  reduceWorkspace,
  saveWorkspace,
  type StorageLike,
} from "../model/state";
import { useToday } from "./useToday";
import { WorkspaceContext } from "./workspace-context";

function browserStorage(): StorageLike | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const today = useToday();
  const [initial] = useState(() => loadWorkspace(browserStorage(), today));
  const [state, dispatch] = useReducer(reduceWorkspace, initial.state);
  const [persistenceAvailable, setPersistenceAvailable] = useState(initial.persistenceAvailable);
  const [notice, setNotice] = useState<string | null>(initial.notice);

  useEffect(() => {
    const storage = browserStorage();
    if (!storage) {
      // oxlint-disable-next-line react/set-state-in-effect -- the storage probe is an external read
      setPersistenceAvailable(false);
      return;
    }
    const available = saveWorkspace(storage, state);
    // oxlint-disable-next-line react/set-state-in-effect -- the write result is an external outcome
    setPersistenceAvailable(available);
  }, [state]);

  const dismissNotice = useCallback(() => setNotice(null), []);

  const reset = useCallback(() => {
    dispatch({ type: "RESET", state: buildSeed(today, nowIso()) });
    setNotice(null);
  }, [today]);

  const value = useMemo(
    () => ({
      state,
      dispatch,
      today,
      persistenceAvailable,
      notice,
      dismissNotice,
      reset,
    }),
    [state, today, persistenceAvailable, notice, dismissNotice, reset],
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}
