import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface PlayedWordsState {
  playedWordIds: Record<string, string[]>; // categoryId -> wordId[]
  addPlayedWords: (categoryId: string, wordIds: string[]) => void;
  clearCategory: (categoryId: string) => void;
  clearAll: () => void;
}

export const usePlayedWordsStore = create<PlayedWordsState>()(
  persist(
    (set) => ({
      playedWordIds: {},
      addPlayedWords: (categoryId, wordIds) =>
        set((state) => {
          const current = state.playedWordIds[categoryId] || [];
          // Use Set to avoid duplicates
          const updated = Array.from(new Set([...current, ...wordIds]));
          return {
            playedWordIds: {
              ...state.playedWordIds,
              [categoryId]: updated,
            },
          };
        }),
      clearCategory: (categoryId) =>
        set((state) => {
          const next = { ...state.playedWordIds };
          delete next[categoryId];
          return { playedWordIds: next };
        }),
      clearAll: () => set({ playedWordIds: {} }),
    }),
    {
      name: "mimik-played-words",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
