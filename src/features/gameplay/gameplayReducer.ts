import type { Word } from "@/types/category";

export type GameplayStatus = "ready" | "playing" | "feedback" | "waitingForCenter" | "turnFinished";
export type FeedbackType = "correct" | "pass";

/** Points a golden word is worth when guessed. Regular words are worth 1. */
export const GOLDEN_WORD_POINTS = 2;

export interface GameplayState {
  status: GameplayStatus;
  words: Word[];
  /** Ids of the words in `words` that are worth double when guessed. */
  goldenWordIds: string[];
  currentIndex: number;
  correctWords: Word[];
  passedWords: Word[];
  timeRemaining: number;
  lastFeedback: FeedbackType | null;
  /** Points earned this turn (golden words count double). */
  points: number;
  /** Consecutive correct answers — resets on every pass. */
  streak: number;
  bestStreak: number;
}

export type GameplayAction =
  | { type: "READY_DONE" }
  | { type: "CORRECT"; timeBonus: number }
  | { type: "PASS" }
  /**
   * `skipCenter`: with touch controls the phone may never return to the
   * forehead's neutral angle (e.g. held flat in a hand), so the next word is
   * revealed straight away instead of waiting for the sensor.
   */
  | { type: "FEEDBACK_DONE"; skipCenter?: boolean }
  | { type: "CENTERED" }
  | { type: "TICK" };

export function createInitialGameplayState(
  words: Word[],
  roundDurationSeconds: number,
  goldenWordIds: string[] = [],
): GameplayState {
  return {
    status: "ready",
    words,
    goldenWordIds,
    currentIndex: 0,
    correctWords: [],
    passedWords: [],
    timeRemaining: roundDurationSeconds,
    lastFeedback: null,
    points: 0,
    streak: 0,
    bestStreak: 0,
  };
}

export function gameplayReducer(state: GameplayState, action: GameplayAction): GameplayState {
  switch (action.type) {
    case "READY_DONE":
      if (state.status !== "ready") return state;
      return { ...state, status: "playing" };

    case "CORRECT": {
      if (state.status !== "playing") return state;
      const word = state.words[state.currentIndex];
      const isGolden = state.goldenWordIds.includes(word.id);
      const streak = state.streak + 1;
      return {
        ...state,
        status: "feedback",
        lastFeedback: "correct",
        correctWords: [...state.correctWords, word],
        timeRemaining: state.timeRemaining + action.timeBonus,
        points: state.points + (isGolden ? GOLDEN_WORD_POINTS : 1),
        streak,
        bestStreak: Math.max(state.bestStreak, streak),
      };
    }

    case "PASS": {
      if (state.status !== "playing") return state;
      const word = state.words[state.currentIndex];
      return {
        ...state,
        status: "feedback",
        lastFeedback: "pass",
        passedWords: [...state.passedWords, word],
        streak: 0,
      };
    }

    case "FEEDBACK_DONE": {
      if (state.status !== "feedback") return state;
      // The next word is selected here — while still hidden — so it's
      // ready to reveal the instant the phone re-centers.
      const nextIndex = state.currentIndex + 1;
      if (nextIndex >= state.words.length) {
        return { ...state, status: "turnFinished" };
      }
      return {
        ...state,
        currentIndex: nextIndex,
        status: action.skipCenter ? "playing" : "waitingForCenter",
      };
    }

    case "CENTERED":
      if (state.status !== "waitingForCenter") return state;
      return { ...state, status: "playing" };

    case "TICK": {
      // The clock keeps running through feedback and re-centering.
      if (state.status !== "playing" && state.status !== "feedback" && state.status !== "waitingForCenter") {
        return state;
      }
      const timeRemaining = state.timeRemaining - 1;
      if (timeRemaining <= 0) {
        return { ...state, timeRemaining: 0, status: "turnFinished" };
      }
      return { ...state, timeRemaining };
    }

    default:
      return state;
  }
}
