import type { Category } from "@/types/category";

import { categories } from "./registry";
import { mixCategory } from "./mix";

export { categoryIllustrations } from "./illustrations";
export { mixCategory, MIX_CATEGORY_ID } from "./mix";

// Mix is always shown first; the product intentionally treats it as the
// default, highest-visibility option ahead of the specific categories.
export const allCategories: Category[] = [mixCategory, ...categories];

export function getCategoryById(id: string): Category | undefined {
  return allCategories.find((category) => category.id === id);
}
