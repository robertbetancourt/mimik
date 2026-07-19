import { useRouter } from "expo-router";
import * as ScreenOrientation from "expo-screen-orientation";
import { ScrollView, Text, View } from "react-native";
import Animated from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { MimikIdle } from "@/components/effects/MimikIdle";
import { Sparkle } from "@/components/effects/Sparkle";
import { allCategories } from "@/features/categories";
import { CategoryGrid } from "@/features/categories/CategoryGrid";
import { useHomeEntrance } from "@/features/categories/useHomeEntrance";
import { useMatchStore } from "@/features/match/store";
import { useLockOrientation } from "@/lib/useLockOrientation";

export default function CategorySelection() {
  const router = useRouter();
  const selectCategory = useMatchStore((state) => state.selectCategory);

  useLockOrientation(ScreenOrientation.OrientationLock.PORTRAIT_UP);
  const { mimikStyle, titleStyle } = useHomeEntrance();

  function handleSelect(categoryId: string) {
    selectCategory(categoryId);
    router.push("/game-setup");
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <ScrollView contentContainerClassName="px-4 pb-10 pt-6" showsVerticalScrollIndicator={false}>
        <View className="flex-row items-center justify-between">
          <Animated.View style={titleStyle} className="flex-1">
            <Sparkle animated size={13} style={{ position: "absolute", left: 2, top: -6 }} />
            <Text className="font-sans-bold text-4xl italic text-ink">Bienvenido,</Text>
            <Text className="font-sans-bold text-4xl text-ink">elige una categoría</Text>
            <Text className="mt-1 font-sans text-base text-ink/60">¿A qué quieren jugar hoy?</Text>
          </Animated.View>

          <Animated.View style={[mimikStyle, { marginLeft: -16 }]}>
            <Sparkle animated size={11} style={{ position: "absolute", right: 18, top: 8, zIndex: 1 }} />
            <MimikIdle source={require("../branding/mimik/celebration.png")} size={150} />
          </Animated.View>
        </View>

        <View className="mt-6">
          <CategoryGrid categories={allCategories} onSelect={handleSelect} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
