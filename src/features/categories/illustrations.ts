import type { Category } from "@/types/category";

// Metro requires static, literal require() calls, so illustrations are mapped
// explicitly instead of built from the `ilustracion` field in the JSON data.
export const categoryIllustrations: Record<string, number> = {
  animales: require("../../../assets/images/categories/animals.png"),
  food: require("../../../assets/images/categories/food.png"),
  deportes: require("../../../assets/images/categories/sports.png"),
  famosos: require("../../../assets/images/categories/famous.png"),
  games: require("../../../assets/images/categories/games.png"),
  logos: require("../../../assets/images/categories/logos.png"),
  musica: require("../../../assets/images/categories/music.png"),
  peliculas: require("../../../assets/images/categories/movies.png"),
  superheroes: require("../../../assets/images/categories/superheroes.png"),
  "tv-series": require("../../../assets/images/categories/tv-series.png"),
  mix: require("../../../assets/images/categories/mix.png"),
  world: require("../../../assets/images/categories/countries.png"),
};
