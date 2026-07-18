import type { Category } from "@/types/category";

import { categoryColors } from "@/features/categories/colors";
import { categoryIllustrations } from "@/features/categories/illustrations";
import { CategoryCardContent } from "@/features/categories/CategoryCard";

interface SelectedCategoryHeroProps {
  category: Category;
}

export function SelectedCategoryHero({ category }: SelectedCategoryHeroProps) {
  return (
    <CategoryCardContent
      variant="hero"
      illustration={categoryIllustrations[category.id]}
      title={category.titulo}
      description={category.descripcion}
      wordCount={category.palabras.length}
      backgroundColor={categoryColors[category.id]}
    />
  );
}
