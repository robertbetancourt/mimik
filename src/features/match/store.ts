import { create } from "zustand";

export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 12;

export const MIN_ROUNDS = 1;
export const MAX_ROUNDS = 10;

export const ROUND_DURATIONS_SECONDS = [30, 45, 60, 90, 120];

interface MatchState {
  selectedCategoryId: string | null;
  selectCategory: (categoryId: string) => void;

  playerCount: number;
  setPlayerCount: (count: number) => void;

  roundDurationSeconds: number;
  setRoundDurationSeconds: (seconds: number) => void;

  totalRounds: number;
  setTotalRounds: (rounds: number) => void;

  infiniteMode: boolean;
  setInfiniteMode: (infinite: boolean) => void;
}

export const useMatchStore = create<MatchState>((set) => ({
  selectedCategoryId: null,
  selectCategory: (categoryId) => set({ selectedCategoryId: categoryId }),

  playerCount: 4,
  setPlayerCount: (count) => set({ playerCount: count }),

  roundDurationSeconds: 60,
  setRoundDurationSeconds: (seconds) => set({ roundDurationSeconds: seconds }),

  totalRounds: 3,
  setTotalRounds: (rounds) => set({ totalRounds: rounds }),

  infiniteMode: false,
  setInfiniteMode: (infinite) => set({ infiniteMode: infinite }),
}));
