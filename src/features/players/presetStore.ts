import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import type { Player } from "@/types/player";

interface PresetState {
  lastPlayers: Player[] | null;
  lastCategoryId: string | null;
  saveLastMatch: (players: Player[], categoryId: string | null) => void;
}

export const usePresetStore = create<PresetState>()(
  persist(
    (set) => ({
      lastPlayers: null,
      lastCategoryId: null,
      saveLastMatch: (players, categoryId) => set({ lastPlayers: players, lastCategoryId: categoryId }),
    }),
    {
      name: "mimik-preset-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
