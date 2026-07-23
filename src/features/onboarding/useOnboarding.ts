import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";

const STORAGE_KEY = "hasSeenOnboarding";

// Starts `false` (never shows before we actually know) and flips to `true`
// only if AsyncStorage confirms the flag was never set — avoids a flash of
// the sheet on every cold start while the read is in flight.
export function useOnboarding() {
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    let cancelled = false;

    AsyncStorage.getItem(STORAGE_KEY).then((value) => {
      if (!cancelled && value !== "true") setShouldShow(true);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  function markCompleted() {
    setShouldShow(false);
    AsyncStorage.setItem(STORAGE_KEY, "true");
  }

  return { shouldShow, markCompleted };
}
