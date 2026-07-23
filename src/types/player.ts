export type TeamId = "red" | "blue";

export interface Player {
  id: string;
  name: string;
  characterId: string;
  teamId?: TeamId;
}
