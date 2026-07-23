import type { Category, Word } from "@/types/category";
import i18n from "@/i18n";

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
  titulo: i18n.t("mix.title"),
  descripcion: i18n.t("mix.description"),
  version: 1,
  idioma: i18n.language,
  ilustracion: "assets/images/categories/mix.png",
  palabras: buildMixWords(),
};
