import * as Localization from "expo-localization";

import type { Category } from "@/types/category";

import animalesEs from "@data/categories/ES/animals_es.json";
import comidaEs from "@data/categories/ES/foods_es.json";
import deportesEs from "@data/categories/ES/sports_es.json";
import famososEs from "@data/categories/ES/celebrities_es.json";
import gamesEs from "@data/categories/ES/games_es.json";
import logosEs from "@data/categories/ES/logos_es.json";
import musicaEs from "@data/categories/ES/music_es.json";
import peliculasEs from "@data/categories/ES/movies_es.json";
import superheroesEs from "@data/categories/ES/superheroes_es.json";
import tvSeriesEs from "@data/categories/ES/series_es.json";
import worldEs from "@data/categories/ES/world_es.json";

import animalesEn from "@data/categories/EN/animals_en.json";
import comidaEn from "@data/categories/EN/foods_en.json";
import deportesEn from "@data/categories/EN/sports_en.json";
import famososEn from "@data/categories/EN/celebrities_en.json";
import gamesEn from "@data/categories/EN/games_en.json";
import logosEn from "@data/categories/EN/logos_en.json";
import musicaEn from "@data/categories/EN/music_en.json";
import peliculasEn from "@data/categories/EN/movies_en.json";
import superheroesEn from "@data/categories/EN/superheroes_en.json";
import tvSeriesEn from "@data/categories/EN/series_en.json";
import worldEn from "@data/categories/EN/world_en.json";

const categoriesEs: Category[] = [
  animalesEs,
  comidaEs,
  deportesEs,
  famososEs,
  gamesEs,
  logosEs,
  musicaEs,
  peliculasEs,
  superheroesEs,
  tvSeriesEs,
  worldEs,
];

const categoriesEn: Category[] = [
  animalesEn,
  comidaEn,
  deportesEn,
  famososEn,
  gamesEn,
  logosEn,
  musicaEn,
  peliculasEn,
  superheroesEn,
  tvSeriesEn,
  worldEn,
];

// Only Spanish and English content exists today — any other device language
// falls back to Spanish rather than guessing at a partial translation.
const deviceLanguage = Localization.getLocales()[0]?.languageCode;

export const categories: Category[] = deviceLanguage === "en" ? categoriesEn : categoriesEs;
