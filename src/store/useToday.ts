import { useEffect, useState } from "react";
import { localToday, nextMidnightDelay } from "../model/dates";

export function useToday(): string {
  const [today, setToday] = useState(() => localToday());

  useEffect(() => {
    let timer = 0;
    const refresh = () => setToday(localToday());
    const schedule = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        refresh();
        schedule();
      }, nextMidnightDelay());
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        refresh();
        schedule();
      }
    };
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", onVisibility);
    schedule();
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return today;
}
