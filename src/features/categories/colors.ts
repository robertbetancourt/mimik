import type { Category } from "@/types/category";

// Subtle pastel background per category, inspired by its theme.
export const categoryColors: Record<Category["id"], string> = {
  mix: "#FBE3C0",
  animales: "#DCEEE4",
  food: "#F6C6B4",
  deportes: "#F6EFC2",
  famosos: "#EFE4D6",
  games: "#E5E0F4",
  logos: "#E6E6F0",
  musica: "#FBE1EC",
  peliculas: "#F5E0DA",
  superheroes: "#DCEAF6",
  "tv-series": "#F2E5D6",
  world: "#DFEEE1",
};
