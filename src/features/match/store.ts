import { create } from "zustand";

import type { Word } from "@/types/category";
import { DEFAULT_END_TURN_SOUND_ID } from "@/features/gameplay/endTurnSounds";
import { pickRandomCharacterId } from "@/features/players/characters";
import { generateId } from "@/lib/generateId";
import type { Player } from "@/types/player";

export interface TurnResult {
  correctWords: Word[];
  passedWords: Word[];
}

export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 12;

export const ROUND_DURATIONS_SECONDS = [30, 45, 60, 90, 120];
const DEFAULT_ROUND_DURATION_SECONDS = 60;
const DEFAULT_TOTAL_ROUNDS = 3;

export const ROUND_STEPS: (number | "infinite")[] = [1, 2, 3, 5, "infinite"];

function createPlayer(index: number, excludeCharacterIds: string[]): Player {
  return {
    id: generateId("player"),
    name: `Jugador ${index + 1}`,
    characterId: pickRandomCharacterId(excludeCharacterIds),
  };
}

function createInitialPlayers(): Player[] {
  const players: Player[] = [];
  for (let i = 0; i < MIN_PLAYERS; i++) {
    players.push(createPlayer(i, players.map((player) => player.characterId)));
  }
  return players;
}

interface MatchState {
  selectedCategoryId: string | null;
  selectCategory: (categoryId: string) => void;

  players: Player[];
  addPlayer: () => void;
  removeLastPlayer: () => void;
  removePlayer: (playerId: string) => void;
  renamePlayer: (playerId: string, name: string) => void;
  setPlayerCharacter: (playerId: string, characterId: string) => void;

  currentPlayerIndex: number;
  currentRound: number;
  /**
   * Call after a turn's score has already been recorded. Advances to the
   * next player, rolling into the next round once every player has had a
   * turn. Returns true once the configured number of rounds is complete
   * (never, in infinite mode) — the caller should route to Final Results
   * instead of the next Preparation screen when that happens.
   */
  advanceTurn: () => boolean;

  lastTurnResult: TurnResult | null;
  setLastTurnResult: (result: TurnResult) => void;

  playerScores: Record<string, number>;
  addTurnScore: (playerId: string, points: number) => void;

  roundDurationSeconds: number;
  setRoundDurationSeconds: (seconds: number) => void;

  totalRounds: number;
  setTotalRounds: (rounds: number) => void;

  infiniteMode: boolean;
  setInfiniteMode: (infinite: boolean) => void;

  endTurnSoundId: string;
  setEndTurnSoundId: (soundId: string) => void;

  /** Same players, characters, names, category and settings — fresh scores and round progress. */
  startRematch: () => void;
  /** Full reset, as if the app just launched. */
  resetMatch: () => void;
}

export const useMatchStore = create<MatchState>((set, get) => ({
  selectedCategoryId: null,
  // Picking a category from Home always starts a fresh match creation flow
  // — everything configured for a previous match resets here. Navigating
  // back and forth *within* the flow (e.g. countdown -> back to setup)
  // never calls this, so that state is preserved.
  selectCategory: (categoryId) =>
    set({
      selectedCategoryId: categoryId,
      players: createInitialPlayers(),
      currentPlayerIndex: 0,
      currentRound: 1,
      lastTurnResult: null,
      playerScores: {},
      roundDurationSeconds: DEFAULT_ROUND_DURATION_SECONDS,
      totalRounds: DEFAULT_TOTAL_ROUNDS,
      infiniteMode: false,
      endTurnSoundId: DEFAULT_END_TURN_SOUND_ID,
    }),

  players: createInitialPlayers(),
  currentPlayerIndex: 0,
  currentRound: 1,
  advanceTurn: () => {
    const { players, currentPlayerIndex, currentRound, totalRounds, infiniteMode } = get();
    const nextIndex = (currentPlayerIndex + 1) % players.length;
    const roundJustCompleted = nextIndex === 0;
    const nextRound = roundJustCompleted ? currentRound + 1 : currentRound;
    const matchFinished = !infiniteMode && roundJustCompleted && nextRound > totalRounds;

    set({ currentPlayerIndex: nextIndex, currentRound: nextRound });
    return matchFinished;
  },

  lastTurnResult: null,
  setLastTurnResult: (result) => set({ lastTurnResult: result }),

  playerScores: {},
  addTurnScore: (playerId, points) => {
    const { playerScores } = get();
    set({ playerScores: { ...playerScores, [playerId]: (playerScores[playerId] ?? 0) + points } });
  },

  addPlayer: () => {
    const players = get().players;
    if (players.length >= MAX_PLAYERS) return;
    const newPlayer = createPlayer(
      players.length,
      players.map((player) => player.characterId),
    );
    set({ players: [...players, newPlayer] });
  },
  removeLastPlayer: () => {
    const players = get().players;
    if (players.length <= MIN_PLAYERS) return;
    set({ players: players.slice(0, -1) });
  },
  removePlayer: (playerId) => {
    const players = get().players;
    if (players.length <= MIN_PLAYERS) return;
    set({ players: players.filter((player) => player.id !== playerId) });
  },
  renamePlayer: (playerId, name) =>
    set({
      players: get().players.map((player) => (player.id === playerId ? { ...player, name } : player)),
    }),
  setPlayerCharacter: (playerId, characterId) =>
    set({
      players: get().players.map((player) =>
        player.id === playerId ? { ...player, characterId } : player,
      ),
    }),

  roundDurationSeconds: DEFAULT_ROUND_DURATION_SECONDS,
  setRoundDurationSeconds: (seconds) => set({ roundDurationSeconds: seconds }),

  totalRounds: DEFAULT_TOTAL_ROUNDS,
  setTotalRounds: (rounds) => set({ totalRounds: rounds }),

  infiniteMode: false,
  setInfiniteMode: (infinite) => set({ infiniteMode: infinite }),

  endTurnSoundId: DEFAULT_END_TURN_SOUND_ID,
  setEndTurnSoundId: (soundId) => set({ endTurnSoundId: soundId }),

  startRematch: () =>
    set({
      currentPlayerIndex: 0,
      currentRound: 1,
      playerScores: {},
      lastTurnResult: null,
    }),

  resetMatch: () =>
    set({
      selectedCategoryId: null,
      players: createInitialPlayers(),
      currentPlayerIndex: 0,
      currentRound: 1,
      lastTurnResult: null,
      playerScores: {},
      roundDurationSeconds: DEFAULT_ROUND_DURATION_SECONDS,
      totalRounds: DEFAULT_TOTAL_ROUNDS,
      infiniteMode: false,
      endTurnSoundId: DEFAULT_END_TURN_SOUND_ID,
    }),
}));
