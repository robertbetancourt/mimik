import { create } from "zustand";

import type { Word } from "@/types/category";
import { DEFAULT_END_TURN_SOUND_ID } from "@/features/gameplay/endTurnSounds";
import { pickRandomCharacterId } from "@/features/players/characters";
import { generateId } from "@/lib/generateId";
import i18n from "@/i18n";
import type { Player } from "@/types/player";
import type { DifficultyLevel } from "@/types/player";

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

export type GameMode = "individual" | "teams";

export interface PlayerStat {
  correct: number;
  passed: number;
  totalWords: number;
}

function createPlayer(index: number, excludeCharacterIds: string[]): Player {
  return {
    id: generateId("player"),
    name: i18n.t("common.defaultPlayerName", { n: index + 1 }),
    characterId: pickRandomCharacterId(excludeCharacterIds),
    teamId: index % 2 === 0 ? "red" : "blue",
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
  gameMode: GameMode;
  setGameMode: (mode: GameMode) => void;

  selectedCategoryId: string | null;
  selectCategory: (categoryId: string) => void;

  players: Player[];
  addPlayer: () => void;
  removeLastPlayer: () => void;
  removePlayer: (playerId: string) => void;
  renamePlayer: (playerId: string, name: string) => void;
  setPlayerCharacter: (playerId: string, characterId: string) => void;
  togglePlayerTeam: (playerId: string) => void;
  setPlayerDifficulty: (playerId: string, level: DifficultyLevel) => void;

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

  playerStats: Record<string, PlayerStat>;
  recordTurnStats: (playerId: string, correctCount: number, passedCount: number) => void;



  roundDurationSeconds: number;
  setRoundDurationSeconds: (seconds: number) => void;

  totalRounds: number;
  setTotalRounds: (rounds: number) => void;

  infiniteMode: boolean;
  setInfiniteMode: (infinite: boolean) => void;

  timeBonusEnabled: boolean;
  setTimeBonusEnabled: (enabled: boolean) => void;
  timeBonusSeconds: number;
  setTimeBonusSeconds: (seconds: number) => void;

  endTurnSoundId: string;
  setEndTurnSoundId: (soundId: string) => void;

  /**
   * Survival Mode: the timer starts at 15 s and each correct answer adds 5 s.
   * When enabled, roundDurationSeconds and timeBonusSeconds are overridden
   * at the gameplay level — they stay in the store at their user-configured
   * values so that switching back to Classic preserves those settings.
   */
  survivalMode: boolean;
  setSurvivalMode: (enabled: boolean) => void;

  /** Same players, characters, names, category and settings — fresh scores and round progress. */
  startRematch: () => void;
  /** Full reset, as if the app just launched. */
  resetMatch: () => void;
  /** Load a preset of players and category. */
  loadPreset: (players: Player[], categoryId: string | null) => void;
}

export const useMatchStore = create<MatchState>((set, get) => ({
  gameMode: "individual",
  setGameMode: (gameMode) => set({ gameMode }),

  selectedCategoryId: null,
  // Picking a category from Home always starts a fresh match creation flow
  // — everything configured for a previous match resets here. Navigating
  // back and forth *within* the flow (e.g. countdown -> back to setup)
  // never calls this, so that state is preserved.
  selectCategory: (categoryId) =>
    set({
      selectedCategoryId: categoryId,
      players: createInitialPlayers(),
      gameMode: "individual",
      currentPlayerIndex: 0,
      currentRound: 1,
      lastTurnResult: null,
      playerScores: {},
      playerStats: {},
      roundDurationSeconds: DEFAULT_ROUND_DURATION_SECONDS,
      totalRounds: DEFAULT_TOTAL_ROUNDS,
      infiniteMode: false,
      timeBonusEnabled: false,
      timeBonusSeconds: 2,
      endTurnSoundId: DEFAULT_END_TURN_SOUND_ID,
      survivalMode: false,
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

    set({
      currentPlayerIndex: nextIndex,
      currentRound: nextRound,
    });
    return matchFinished;
  },

  lastTurnResult: null,
  setLastTurnResult: (result) => {
    set({
      lastTurnResult: result,
    });
  },

  playerScores: {},
  addTurnScore: (playerId, points) => {
    const { playerScores } = get();
    set({ playerScores: { ...playerScores, [playerId]: (playerScores[playerId] ?? 0) + points } });
  },

  playerStats: {},
  recordTurnStats: (playerId, correctCount, passedCount) => {
    const { playerStats } = get();
    const current = playerStats[playerId] ?? { correct: 0, passed: 0, totalWords: 0 };
    set({
      playerStats: {
        ...playerStats,
        [playerId]: {
          correct: current.correct + correctCount,
          passed: current.passed + passedCount,
          totalWords: current.totalWords + correctCount + passedCount,
        },
      },
    });
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
  togglePlayerTeam: (playerId) =>
    set({
      players: get().players.map((player) =>
        player.id === playerId ? { ...player, teamId: player.teamId === "red" ? "blue" : "red" } : player,
      ),
    }),
  setPlayerDifficulty: (playerId, level) =>
    set({
      players: get().players.map((player) =>
        player.id === playerId ? { ...player, dificultad: level } : player,
      ),
    }),

  roundDurationSeconds: DEFAULT_ROUND_DURATION_SECONDS,
  setRoundDurationSeconds: (seconds) => set({ roundDurationSeconds: seconds }),

  totalRounds: DEFAULT_TOTAL_ROUNDS,
  setTotalRounds: (rounds) => set({ totalRounds: rounds }),

  infiniteMode: false,
  setInfiniteMode: (infinite) => set({ infiniteMode: infinite }),

  timeBonusEnabled: false,
  setTimeBonusEnabled: (enabled) => set({ timeBonusEnabled: enabled }),
  timeBonusSeconds: 2,
  setTimeBonusSeconds: (seconds) => set({ timeBonusSeconds: seconds }),

  endTurnSoundId: DEFAULT_END_TURN_SOUND_ID,
  setEndTurnSoundId: (soundId) => set({ endTurnSoundId: soundId }),

  survivalMode: false,
  setSurvivalMode: (survivalMode) => set({ survivalMode }),

  startRematch: () =>
    set({
      currentPlayerIndex: 0,
      currentRound: 1,
      playerScores: {},
      playerStats: {},
      lastTurnResult: null,
    }),

  resetMatch: () =>
    set({
      selectedCategoryId: null,
      players: createInitialPlayers(),
      gameMode: "individual",
      currentPlayerIndex: 0,
      currentRound: 1,
      lastTurnResult: null,
      playerScores: {},
      playerStats: {},
      roundDurationSeconds: DEFAULT_ROUND_DURATION_SECONDS,
      totalRounds: DEFAULT_TOTAL_ROUNDS,
      infiniteMode: false,
      timeBonusEnabled: false,
      timeBonusSeconds: 2,
      endTurnSoundId: DEFAULT_END_TURN_SOUND_ID,
      survivalMode: false,
    }),

  loadPreset: (players, categoryId) =>
    set({
      selectedCategoryId: categoryId,
      players,
      gameMode: "individual",
      currentPlayerIndex: 0,
      currentRound: 1,
      lastTurnResult: null,
      playerScores: {},
      playerStats: {},
    }),
}));
