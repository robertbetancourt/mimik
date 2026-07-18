import type { Category, Word } from "@/types/category";

import { categories } from "./registry";

export const MIX_CATEGORY_ID = "mix";

function buildMixWords(): Word[] {
  return categories.flatMap((category) =>
    category.palabras.map((word) => ({
      id: `${category.id}-${word.id}`,
      texto: word.texto,
    })),
  );
}

export const mixCategory: Category = {
  id: MIX_CATEGORY_ID,
  titulo: "Mezcla",
  descripcion: "Un poco de todas las categorías.",
  version: 1,
  idioma: "es",
  ilustracion: "assets/images/categories/mix.png",
  palabras: buildMixWords(),
};
