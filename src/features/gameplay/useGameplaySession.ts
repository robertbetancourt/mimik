import { useEffect, useMemo, useReducer } from "react";

import type { Word } from "@/types/category";
import { shuffle } from "@/lib/shuffle";
import { TILT_THRESHOLDS, useSettingsStore } from "@/features/settings/settingsStore";

import { createInitialGameplayState, gameplayReducer } from "./gameplayReducer";
import { useTiltSensor, type TiltSensorMode } from "./useTiltSensor";

const READY_DURATION_MS = 200;
const FEEDBACK_DURATION_MS = 400;

export function useGameplaySession(words: Word[], roundDurationSeconds: number, timeBonusSeconds: number = 0) {
  const shuffledWords = useMemo(() => shuffle(words), [words]);
  const tiltSensitivity = useSettingsStore((s) => s.tiltSensitivity);
  const tiltThreshold = TILT_THRESHOLDS[tiltSensitivity];

  const [state, dispatch] = useReducer(
    gameplayReducer,
    { shuffledWords, roundDurationSeconds },
    ({ shuffledWords: w, roundDurationSeconds: d }) => createInitialGameplayState(w, d),
  );

  useEffect(() => {
    if (state.status !== "playing") return;
    const interval = setInterval(() => dispatch({ type: "TICK" }), 1000);
    return () => clearInterval(interval);
  }, [state.status]);

  // Brief settle beat right after mounting, before gestures are accepted —
  // matches the PREPARING/COUNTDOWN → READY → PLAYING sequence.
  useEffect(() => {
    if (state.status !== "ready") return;
    const timeout = setTimeout(() => dispatch({ type: "READY_DONE" }), READY_DURATION_MS);
    return () => clearTimeout(timeout);
  }, [state.status]);

  // The next word is prepared internally while still in FEEDBACK, then
  // revealed only once the phone is centered again (see useTiltSensor).
  useEffect(() => {
    if (state.status !== "feedback") return;
    const timeout = setTimeout(() => dispatch({ type: "FEEDBACK_DONE" }), FEEDBACK_DURATION_MS);
    return () => clearTimeout(timeout);
  }, [state.status]);

  const sensorMode: TiltSensorMode =
    state.status === "playing" ? "gesture" : state.status === "waitingForCenter" ? "neutral" : "off";

  useTiltSensor({
    mode: sensorMode,
    // Matches the onboarding tutorial: tilt down = correct, tilt up = pass.
    onTiltDown: () => dispatch({ type: "PASS" }),
    onTiltUp: () => dispatch({ type: "CORRECT", timeBonus: timeBonusSeconds }),
    onCentered: () => dispatch({ type: "CENTERED" }),
    threshold: tiltThreshold,
  });

  return {
    status: state.status,
    lastFeedback: state.lastFeedback,
    currentWord: state.words[state.currentIndex] as Word | undefined,
    timeRemaining: state.timeRemaining,
    correctWords: state.correctWords,
    passedWords: state.passedWords,
  };
}
