import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { generateId } from "@/lib/generateId";
import type { TeamId } from "@/types/player";

export interface MatchRecordPlayer {
  id: string;
  name: string;
  characterId: string;
  teamId?: TeamId;
  score: number;
}

export interface MatchRecord {
  id: string;
  finishedAt: number;
  categoryId: string | null;
  categoryTitle: string;
  gameMode: "individual" | "teams";
  /** Sorted best → worst. */
  players: MatchRecordPlayer[];
  /** Winners (several on a tie). Team mode: the winning team's players. */
  winnerIds: string[];
  winningTeamId?: TeamId;
}

// Enough to look back over a good stretch of game nights without the
// persisted blob growing forever.
const MAX_RECORDS = 60;

interface HistoryState {
  records: MatchRecord[];
  addRecord: (record: Omit<MatchRecord, "id" | "finishedAt">) => void;
  clear: () => void;
}

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set, get) => ({
      records: [],
      addRecord: (record) =>
        set({
          records: [
            { ...record, id: generateId("match"), finishedAt: Date.now() },
            ...get().records,
          ].slice(0, MAX_RECORDS),
        }),
      clear: () => set({ records: [] }),
    }),
    {
      name: "mimik-history-storage",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

/** Player name with the most match wins across the whole history. */
export function topWinner(records: MatchRecord[]): { name: string; wins: number } | null {
  const wins = new Map<string, number>();
  for (const record of records) {
    for (const id of record.winnerIds) {
      const player = record.players.find((p) => p.id === id);
      if (!player) continue;
      // Names (not ids) identify people across matches: ids are regenerated
      // for every new group, names are what the family actually reuses.
      const key = player.name.trim();
      wins.set(key, (wins.get(key) ?? 0) + 1);
    }
  }
  let best: { name: string; wins: number } | null = null;
  for (const [name, count] of wins) {
    if (!best || count > best.wins) best = { name, wins: count };
  }
  return best;
}
