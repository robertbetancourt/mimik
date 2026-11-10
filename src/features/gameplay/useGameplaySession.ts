import { useCallback, useEffect, useReducer } from "react";

import type { Word } from "@/types/category";
import { shuffle } from "@/lib/shuffle";
import { TILT_THRESHOLDS, useSettingsStore } from "@/features/settings/settingsStore";

import { createInitialGameplayState, gameplayReducer } from "./gameplayReducer";
import { useTiltSensor, type TiltSensorMode } from "./useTiltSensor";

const READY_DURATION_MS = 200;
const FEEDBACK_DURATION_MS = 400;

// Roughly one word in seven turns golden. The first word never does (the
// turn needs a normal start) and two golden words never come back to back,
// so they stay a surprise instead of a pattern.
const GOLDEN_WORD_CHANCE = 0.14;

function pickGoldenWordIds(words: Word[]): string[] {
  const ids: string[] = [];
  let previousWasGolden = false;
  words.forEach((word, index) => {
    const isGolden = index > 0 && !previousWasGolden && Math.random() < GOLDEN_WORD_CHANCE;
    if (isGolden) ids.push(word.id);
    previousWasGolden = isGolden;
  });
  return ids;
}

interface GameplaySessionOptions {
  timeBonusSeconds?: number;
  goldenWordsEnabled?: boolean;
}

export function useGameplaySession(
  words: Word[],
  roundDurationSeconds: number,
  { timeBonusSeconds = 0, goldenWordsEnabled = true }: GameplaySessionOptions = {},
) {
  // Shuffle + golden pick happen exactly once per turn (lazy reducer init),
  // so a re-render with a new array identity can never reshuffle mid-turn.
  const tiltSensitivity = useSettingsStore((s) => s.tiltSensitivity);
  const touchControls = useSettingsStore((s) => s.touchControls);
  const tiltThreshold = TILT_THRESHOLDS[tiltSensitivity];

  const [state, dispatch] = useReducer(gameplayReducer, null, () => {
    const shuffled = shuffle(words);
    return createInitialGameplayState(
      shuffled,
      roundDurationSeconds,
      goldenWordsEnabled ? pickGoldenWordIds(shuffled) : [],
    );
  });

  // One continuous clock for the whole live turn. It used to restart on every
  // status change (playing → feedback → playing), which froze the clock
  // during feedback and threw away the partial second each time — every
  // answer quietly added ~1 s to the turn.
  const isLive = state.status === "playing" || state.status === "feedback" || state.status === "waitingForCenter";
  useEffect(() => {
    if (!isLive) return;
    const interval = setInterval(() => dispatch({ type: "TICK" }), 1000);
    return () => clearInterval(interval);
  }, [isLive]);

  // Brief settle beat right after mounting, before gestures are accepted —
  // matches the PREPARING/COUNTDOWN → READY → PLAYING sequence.
  useEffect(() => {
    if (state.status !== "ready") return;
    const timeout = setTimeout(() => dispatch({ type: "READY_DONE" }), READY_DURATION_MS);
    return () => clearTimeout(timeout);
  }, [state.status]);

  // The next word is prepared internally while still in FEEDBACK, then
  // revealed only once the phone is centered again (see useTiltSensor) —
  // or immediately when touch controls are on.
  useEffect(() => {
    if (state.status !== "feedback") return;
    const timeout = setTimeout(
      () => dispatch({ type: "FEEDBACK_DONE", skipCenter: touchControls }),
      FEEDBACK_DURATION_MS,
    );
    return () => clearTimeout(timeout);
  }, [state.status, touchControls]);

  const sensorMode: TiltSensorMode =
    state.status === "playing" ? "gesture" : state.status === "waitingForCenter" ? "neutral" : "off";

  const markCorrect = useCallback(
    () => dispatch({ type: "CORRECT", timeBonus: timeBonusSeconds }),
    [timeBonusSeconds],
  );
  const markPass = useCallback(() => dispatch({ type: "PASS" }), []);

  useTiltSensor({
    mode: sensorMode,
    // Matches the onboarding tutorial: tilt down = correct, tilt up = pass.
    onTiltDown: markPass,
    onTiltUp: markCorrect,
    onCentered: () => dispatch({ type: "CENTERED" }),
    threshold: tiltThreshold,
  });

  const currentWord = state.words[state.currentIndex] as Word | undefined;

  return {
    status: state.status,
    lastFeedback: state.lastFeedback,
    currentWord,
    isGoldenWord: currentWord ? state.goldenWordIds.includes(currentWord.id) : false,
    goldenWordIds: state.goldenWordIds,
    timeRemaining: state.timeRemaining,
    correctWords: state.correctWords,
    passedWords: state.passedWords,
    points: state.points,
    streak: state.streak,
    bestStreak: state.bestStreak,
    touchControls,
    markCorrect,
    markPass,
  };
}
