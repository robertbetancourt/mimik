import { create } from "zustand";

interface MatchState {
  selectedCategoryId: string | null;
  selectCategory: (categoryId: string) => void;
}

export const useMatchStore = create<MatchState>((set) => ({
  selectedCategoryId: null,
  selectCategory: (categoryId) => set({ selectedCategoryId: categoryId }),
}));
