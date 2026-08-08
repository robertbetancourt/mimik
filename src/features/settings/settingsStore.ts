import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// Sensitivity presets map to the accelerometer threshold used in useTiltSensor.
// Lower value = more sensitive (triggers on a smaller tilt).
// Higher value = less sensitive (requires a more pronounced tilt).
export type TiltSensitivity = "low" | "medium" | "high";

export const TILT_THRESHOLDS: Record<TiltSensitivity, number> = {
  low: 0.45,   // Easy to trigger — good for younger players or large movements
  medium: 0.60, // Default — matches the original hardcoded value
  high: 0.75,  // Requires a deliberate tilt — reduces accidental triggers
};

interface SettingsState {
  /** How sensitive the accelerometer is to tilts. Default: "medium". */
  tiltSensitivity: TiltSensitivity;
  setTiltSensitivity: (sensitivity: TiltSensitivity) => void;

  /**
   * Roadtrip Mode reduces animations to a minimum to save battery during
   * long play sessions (e.g. on a road trip).
   */
  roadtripMode: boolean;
  setRoadtripMode: (enabled: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      tiltSensitivity: "medium",
      setTiltSensitivity: (tiltSensitivity) => set({ tiltSensitivity }),

      roadtripMode: false,
      setRoadtripMode: (roadtripMode) => set({ roadtripMode }),
    }),
    {
      name: "mimik-settings-storage",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
