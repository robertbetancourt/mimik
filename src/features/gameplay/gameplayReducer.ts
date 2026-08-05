import type { Word } from "@/types/category";

export type GameplayStatus = "ready" | "playing" | "feedback" | "waitingForCenter" | "turnFinished";
export type FeedbackType = "correct" | "pass";

export interface GameplayState {
  status: GameplayStatus;
  words: Word[];
  currentIndex: number;
  correctWords: Word[];
  passedWords: Word[];
  timeRemaining: number;
  lastFeedback: FeedbackType | null;
}

export type GameplayAction =
  | { type: "READY_DONE" }
  | { type: "CORRECT"; timeBonus: number }
  | { type: "PASS" }
  | { type: "FEEDBACK_DONE" }
  | { type: "CENTERED" }
  | { type: "TICK" };

export function createInitialGameplayState(words: Word[], roundDurationSeconds: number): GameplayState {
  return {
    status: "ready",
    words,
    currentIndex: 0,
    correctWords: [],
    passedWords: [],
    timeRemaining: roundDurationSeconds,
    lastFeedback: null,
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
      return {
        ...state,
        status: "feedback",
        lastFeedback: "correct",
        correctWords: [...state.correctWords, word],
        timeRemaining: state.timeRemaining + action.timeBonus,
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
      return { ...state, currentIndex: nextIndex, status: "waitingForCenter" };
    }

    case "CENTERED":
      if (state.status !== "waitingForCenter") return state;
      return { ...state, status: "playing" };

    case "TICK": {
      if (state.status !== "playing") return state;
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
