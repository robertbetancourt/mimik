import { useRouter } from "expo-router";
import * as ScreenOrientation from "expo-screen-orientation";
import { Image, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { allCategories } from "@/features/categories";
import { CategoryGrid } from "@/features/categories/CategoryGrid";
import { useMatchStore } from "@/features/match/store";
import { useLockOrientation } from "@/lib/useLockOrientation";

export default function CategorySelection() {
  const router = useRouter();
  const selectCategory = useMatchStore((state) => state.selectCategory);

  useLockOrientation(ScreenOrientation.OrientationLock.PORTRAIT_UP);

  function handleSelect(categoryId: string) {
    selectCategory(categoryId);
    router.push("/game-setup");
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <ScrollView contentContainerClassName="px-4 pb-10 pt-6" showsVerticalScrollIndicator={false}>
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="font-sans-bold text-3xl italic text-ink">Bienvenido,</Text>
            <Text className="font-sans-bold text-3xl text-ink">elige una categoría</Text>
            <Text className="mt-1 font-sans text-base text-ink/70">¿A qué quieren jugar hoy?</Text>
          </View>
          <Image
            source={require("../branding/mimik/celebration.png")}
            resizeMode="contain"
            style={{ width: 150, height: 150, marginLeft: -16 }}
          />
        </View>

        <View className="mt-6">
          <CategoryGrid categories={allCategories} onSelect={handleSelect} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
