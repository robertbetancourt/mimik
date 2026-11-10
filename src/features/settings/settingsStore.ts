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

/** |z| below this counts as the neutral, centered forehead position. */
export const TILT_NEUTRAL_THRESHOLD = 0.3;

interface SettingsState {
  /** How sensitive the accelerometer is to tilts. Default: "medium". */
  tiltSensitivity: TiltSensitivity;
  setTiltSensitivity: (sensitivity: TiltSensitivity) => void;

  /**
   * Touch controls: tap the right half of the screen for "correct" and the
   * left half for "pass". Tilt keeps working alongside. Useful when the
   * sensor misbehaves or when the phone is held in the hand.
   */
  touchControls: boolean;
  setTouchControls: (enabled: boolean) => void;

  /** Background music during a turn — speeds up as the clock runs out. */
  musicEnabled: boolean;
  setMusicEnabled: (enabled: boolean) => void;

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

      touchControls: false,
      setTouchControls: (touchControls) => set({ touchControls }),

      musicEnabled: true,
      setMusicEnabled: (musicEnabled) => set({ musicEnabled }),

      roadtripMode: false,
      setRoadtripMode: (roadtripMode) => set({ roadtripMode }),
    }),
    {
      name: "mimik-settings-storage",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
