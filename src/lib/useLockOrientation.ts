import { useFocusEffect } from "expo-router";
import * as ScreenOrientation from "expo-screen-orientation";
import { useCallback } from "react";

// Expo Router keeps previous screens mounted in the stack, so a plain
// mount-time effect only fires once and never re-applies the lock when a
// screen regains focus after navigating back. useFocusEffect re-runs on
// every focus, keeping the orientation correct in both directions.
export function useLockOrientation(lock: ScreenOrientation.OrientationLock) {
  useFocusEffect(
    useCallback(() => {
      ScreenOrientation.lockAsync(lock);
    }, [lock]),
  );
}
