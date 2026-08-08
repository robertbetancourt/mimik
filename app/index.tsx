import { useRouter } from "expo-router";
import * as ScreenOrientation from "expo-screen-orientation";
import { Settings } from "lucide-react-native";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, Text, View } from "react-native";
import Animated from "react-native-reanimated";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { MimikIdle } from "@/components/effects/MimikIdle";
import { Sparkle } from "@/components/effects/Sparkle";
import { allCategories } from "@/features/categories";
import { CategoryGrid } from "@/features/categories/CategoryGrid";
import { useHomeEntrance } from "@/features/categories/useHomeEntrance";
import { MIX_CATEGORY_ID } from "@/features/categories/mix";
import { useMatchStore } from "@/features/match/store";
import { usePresetStore } from "@/features/players/presetStore";
import { OnboardingSheet } from "@/features/onboarding/OnboardingSheet";
import { useOnboarding } from "@/features/onboarding/useOnboarding";
import { SettingsSheet } from "@/features/settings/SettingsSheet";
import { useLockOrientation } from "@/lib/useLockOrientation";

export default function CategorySelection() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const selectCategory = useMatchStore((state) => state.selectCategory);
  const loadPreset = useMatchStore((state) => state.loadPreset);
  const lastPlayers = usePresetStore((state) => state.lastPlayers);
  const lastCategoryId = usePresetStore((state) => state.lastCategoryId);
  const { shouldShow: showOnboarding, markCompleted: completeOnboarding } = useOnboarding();
  const [settingsVisible, setSettingsVisible] = useState(false);

  useLockOrientation(ScreenOrientation.OrientationLock.PORTRAIT_UP);
  const { mimikStyle, titleStyle } = useHomeEntrance();

  function handleSelect(categoryId: string) {
    selectCategory(categoryId);
    router.push("/game-setup");
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <ScrollView
        contentContainerClassName="px-4 pt-6"
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-row items-center justify-between">
          <Animated.View style={titleStyle} className="flex-1">
            <Sparkle animated size={13} style={{ position: "absolute", left: 2, top: -6 }} />
            <Text className="font-sans-bold text-4xl italic text-ink">{t("home.greeting")}</Text>
            <Text className="font-sans-bold text-4xl text-ink">{t("home.title")}</Text>
            <Text className="mt-1 font-sans text-base text-ink/60">{t("home.subtitle")}</Text>
          </Animated.View>

        <Animated.View style={[mimikStyle, { marginLeft: -16, alignItems: "flex-end" }]}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Ajustes"
              onPress={() => setSettingsVisible(true)}
              className="mb-2 h-9 w-9 items-center justify-center rounded-full bg-ink/8"
              style={{ zIndex: 2 }}
            >
              <Settings size={18} color="rgba(43,33,24,0.45)" />
            </Pressable>
          <Sparkle animated size={11} style={{ position: "absolute", right: 18, top: 8, zIndex: 1 }} />
          <MimikIdle source={require("../branding/mimik/celebration.png")} size={150} />
        </Animated.View>
        </View>

        <View className="mt-6">
          {lastPlayers && lastPlayers.length > 0 ? (
            <View className="mb-6">
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  loadPreset(lastPlayers, lastCategoryId || MIX_CATEGORY_ID);
                  router.push("/game-setup");
                }}
                className="flex-row items-center justify-center gap-2 rounded-3xl bg-ink px-4 py-4"
              >
                <Sparkle size={14} color="white" />
                <Text className="font-sans-bold text-base text-white">{t("home.playWithLastGroup")}</Text>
              </Pressable>
            </View>
          ) : null}
          <CategoryGrid categories={allCategories} onSelect={handleSelect} />
        </View>
      </ScrollView>

      <OnboardingSheet visible={showOnboarding} onComplete={completeOnboarding} />
      <SettingsSheet visible={settingsVisible} onClose={() => setSettingsVisible(false)} />
    </SafeAreaView>
  );
}
