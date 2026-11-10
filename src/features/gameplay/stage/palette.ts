// "Stage mode" palette — used only by the high-energy moments of the game
// (countdown, gameplay, podium). The rest of the app keeps the warm,
// editorial "backstage" palette from tailwind.config.js.
//
// Each category gets two vivid accents that light the dark stage. They are
// deliberately saturated: on a near-black background they read as stage
// lighting, not as UI chrome, and the word itself always stays white.

export const STAGE_BASE = "#0B0912";
export const STAGE_INK = "#FFFFFF";

export const STAGE_CORRECT = "#22C55E";
export const STAGE_PASS = "#FB923C";
export const STAGE_URGENT = "#FF3B30";
export const STAGE_GOLD = "#FFD54A";
export const STAGE_GOLD_DEEP = "#F59E0B";

export interface StageAccent {
  a: string;
  b: string;
}

const DEFAULT_ACCENT: StageAccent = { a: "#FF7A45", b: "#A855F7" };

const STAGE_ACCENTS: Record<string, StageAccent> = {
  mix: DEFAULT_ACCENT,
  animales: { a: "#2DD4A7", b: "#84CC16" },
  food: { a: "#FF5A3C", b: "#FFB020" },
  deportes: { a: "#FFC531", b: "#FF6A1A" },
  famosos: { a: "#FF4FA3", b: "#FFC145" },
  games: { a: "#8B5CF6", b: "#22D3EE" },
  logos: { a: "#3B82F6", b: "#A78BFA" },
  musica: { a: "#EC4899", b: "#8B5CF6" },
  peliculas: { a: "#EF4444", b: "#F59E0B" },
  superheroes: { a: "#3B82F6", b: "#EF4444" },
  "tv-series": { a: "#F97316", b: "#EAB308" },
  world: { a: "#10B981", b: "#3B82F6" },
  jobs: { a: "#F59E0B", b: "#14B8A6" },
  actions: { a: "#06B6D4", b: "#F43F5E" },
  anime: { a: "#F472B6", b: "#6366F1" },
};

export function getStageAccent(categoryId: string | null | undefined): StageAccent {
  if (!categoryId) return DEFAULT_ACCENT;
  return STAGE_ACCENTS[categoryId] ?? DEFAULT_ACCENT;
}
