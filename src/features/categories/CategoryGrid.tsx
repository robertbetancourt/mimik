import { View } from "react-native";

import type { Category } from "@/types/category";

import { categoryColors } from "./colors";
import { categoryIllustrations } from "./illustrations";
import { CategoryCard, type CategoryCardVariant } from "./CategoryCard";

const CARD_GAP = 10;

interface CategoryGridProps {
  categories: Category[];
  onSelect: (categoryId: string) => void;
}

interface ColumnItem {
  category: Category;
  variant: CategoryCardVariant;
  index: number;
}

// Categories are grouped into blocks of 3: one "tall" card and a pair of
// regular cards that together match its height. Each block alternates which
// side gets the tall card, producing the zigzag rhythm down the screen.
const BLOCK_SIZE = 3;

function splitIntoColumns(categories: Category[]): [ColumnItem[], ColumnItem[]] {
  const left: ColumnItem[] = [];
  const right: ColumnItem[] = [];
  let index = 0;

  for (let start = 0, blockIndex = 0; start < categories.length; start += BLOCK_SIZE, blockIndex++) {
    const [tall, ...pair] = categories.slice(start, start + BLOCK_SIZE);
    const tallColumn = blockIndex % 2 === 0 ? left : right;
    const pairColumn = blockIndex % 2 === 0 ? right : left;

    tallColumn.push({ category: tall, variant: "hero", index: index++ });
    pair.forEach((category) => pairColumn.push({ category, variant: "default", index: index++ }));
  }

  return [left, right];
}

function CategoryColumn({
  items,
  onSelect,
}: {
  items: ColumnItem[];
  onSelect: (categoryId: string) => void;
}) {
  return (
    <View className="flex-1" style={{ gap: CARD_GAP }}>
      {items.map(({ category, variant, index }) => (
        <CategoryCard
          key={category.id}
          variant={variant}
          index={index}
          illustration={categoryIllustrations[category.id]}
          title={category.titulo}
          description={category.descripcion}
          wordCount={category.palabras.length}
          backgroundColor={categoryColors[category.id]}
          onPress={() => onSelect(category.id)}
        />
      ))}
    </View>
  );
}

export function CategoryGrid({ categories, onSelect }: CategoryGridProps) {
  const [leftColumn, rightColumn] = splitIntoColumns(categories);

  return (
    <View className="flex-row" style={{ gap: CARD_GAP }}>
      <CategoryColumn items={leftColumn} onSelect={onSelect} />
      <CategoryColumn items={rightColumn} onSelect={onSelect} />
    </View>
  );
}
