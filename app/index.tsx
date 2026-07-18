import { View, Text } from "react-native";

import { categories } from "@/features/categories/registry";
import { useMatchStore } from "@/features/match/store";

export default function Splash() {
  const selectedCategoryId = useMatchStore((state) => state.selectedCategoryId);

  return (
    <View className="flex-1 items-center justify-center bg-background">
      <Text className="text-2xl font-bold text-ink">Mimik</Text>
      <Text className="mt-2 text-ink">{categories.length} categorías cargadas</Text>
      <Text className="text-ink">Selección actual: {selectedCategoryId ?? "ninguna"}</Text>
    </View>
  );
}
