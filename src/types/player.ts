export type TeamId = "red" | "blue";
export type DifficultyLevel = "facil" | "normal" | "dificil";

export interface Player {
  id: string;
  name: string;
  characterId: string;
  teamId?: TeamId;
  dificultad?: DifficultyLevel; // undefined means "normal" (default)
}
