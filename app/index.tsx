import { useRouter } from "expo-router";
import * as ScreenOrientation from "expo-screen-orientation";
import { StatusBar } from "expo-status-bar";
import { History, Settings } from "lucide-react-native";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { BounceInDown, FadeIn, FadeInDown } from "react-native-reanimated";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { MimikIdle } from "@/components/effects/MimikIdle";
import { KineticText } from "@/components/stage/KineticText";
import { StageGlow } from "@/components/stage/StageGlow";
import { allCategories, getCategoryById } from "@/features/categories";
import { CategoryGrid } from "@/features/categories/CategoryGrid";
import { MIX_CATEGORY_ID } from "@/features/categories/mix";
import { getStageAccent, STAGE_BASE } from "@/features/gameplay/stage/palette";
import { StageBackground } from "@/features/gameplay/stage/StageBackground";
import { useHistoryStore } from "@/features/history/historyStore";
import { HomeTile } from "@/features/home/HomeTile";
import { LastGroupButton } from "@/features/home/LastGroupButton";
import { useMatchStore } from "@/features/match/store";
import { mimikExpressions } from "@/features/mimik/expressions";
import { OnboardingSheet } from "@/features/onboarding/OnboardingSheet";
import { useOnboarding } from "@/features/onboarding/useOnboarding";
import { usePresetStore } from "@/features/players/presetStore";
import { useLockOrientation } from "@/lib/useLockOrientation";

const HOME_ACCENT = getStageAccent(MIX_CATEGORY_ID);
const MIMIK_SIZE = 140;

export default function CategorySelection() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const selectCategory = useMatchStore((state) => state.selectCategory);
  const loadPreset = useMatchStore((state) => state.loadPreset);
  const lastPlayers = usePresetStore((state) => state.lastPlayers);
  const lastCategoryId = usePresetStore((state) => state.lastCategoryId);
  const matchCount = useHistoryStore((state) => state.records.length);
  const { shouldShow: showOnboarding, markCompleted: completeOnboarding } = useOnboarding();

  useLockOrientation(ScreenOrientation.OrientationLock.PORTRAIT_UP);

  // Stable identity so the memoized category cards don't all re-render
  // whenever Home does.
  const handleSelect = useCallback(
    (categoryId: string) => {
      selectCategory(categoryId);
      router.push("/game-setup");
    },
    [selectCategory, router],
  );

  const lastCategory = getCategoryById(lastCategoryId || MIX_CATEGORY_ID);
  const hasLastGroup = Boolean(lastPlayers && lastPlayers.length > 0);

  return (
    <View style={{ flex: 1, backgroundColor: STAGE_BASE }}>
      <StatusBar style="light" />
      {/* Dimmed: on Home the cards are the light source, not the background. */}
      <StageBackground accent={HOME_ACCENT} dim={0.85} />

      <SafeAreaView className="flex-1" edges={["top"]}>
        <ScrollView
          contentContainerClassName="px-4 pt-4"
          contentContainerStyle={{ paddingBottom: insets.bottom + 28 }}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Header: kinetic title + Mimik under a spotlight ───────────── */}
          <View className="flex-row items-center">
            <View className="flex-1 pr-2">
              <Animated.Text entering={FadeIn.duration(300)} style={[styles.kicker, { color: HOME_ACCENT.a }]}>
                ✦ {t("home.kicker")}
              </Animated.Text>
              <KineticText text={t("home.stageTitle")} style={styles.title} delay={80} stagger={26} />
              <Animated.Text entering={FadeIn.delay(650).duration(400)} style={styles.subtitle}>
                {t("home.subtitle")}
              </Animated.Text>
            </View>

            <Animated.View entering={BounceInDown.delay(150).duration(800)} style={{ width: MIMIK_SIZE, height: MIMIK_SIZE + 10 }}>
              <View style={styles.mimikGlow}>
                <StageGlow color={HOME_ACCENT.a} width={MIMIK_SIZE * 1.6} intensity={0.55} />
              </View>
              <MimikIdle source={mimikExpressions.popcorn} size={MIMIK_SIZE} />
            </Animated.View>
          </View>

          {hasLastGroup && lastPlayers ? (
            <Animated.View entering={FadeInDown.delay(220).springify().damping(16)} className="mt-6">
              <LastGroupButton
                players={lastPlayers}
                label={t("home.playWithLastGroup")}
                subtitle={`${lastCategory?.titulo ?? ""} · ${t("history.players", { count: lastPlayers.length })}`}
                onPress={() => {
                  loadPreset(lastPlayers, lastCategoryId || MIX_CATEGORY_ID);
                  router.push("/game-setup");
                }}
              />
            </Animated.View>
          ) : null}

          <Animated.View entering={FadeIn.delay(240).duration(300)} className="mb-3 mt-7 flex-row items-baseline justify-between px-1">
            <Text style={styles.sectionLabel}>{t("home.categories")}</Text>
            <Text style={styles.sectionCount}>{allCategories.length}</Text>
          </Animated.View>

          <CategoryGrid categories={allCategories} onSelect={handleSelect} />

          {/* ── Secondary destinations, same material as the grid ─────────── */}
          <Animated.View entering={FadeInDown.delay(500).springify().damping(16)} className="mt-3 flex-row" style={{ gap: 10 }}>
            <HomeTile
              icon={History}
              title={t("home.history")}
              subtitle={matchCount > 0 ? t("home.historySub", { count: matchCount }) : t("home.historyEmpty")}
              color={HOME_ACCENT.b}
              onPress={() => router.push("/history")}
            />
            <HomeTile
              icon={Settings}
              title={t("settings.title")}
              subtitle={t("home.settingsSub")}
              color="#22D3EE"
              onPress={() => router.push("/settings")}
            />
          </Animated.View>
        </ScrollView>
      </SafeAreaView>

      <OnboardingSheet visible={showOnboarding} onComplete={completeOnboarding} />
    </View>
  );
}

const styles = StyleSheet.create({
  kicker: {
    fontFamily: "Urbanist_700Bold",
    fontSize: 12,
    letterSpacing: 3,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  title: {
    fontFamily: "Urbanist_700Bold",
    fontSize: 40,
    lineHeight: 44,
    letterSpacing: -1.2,
    color: "#FFFFFF",
  },
  subtitle: { marginTop: 6, fontFamily: "Urbanist_400Regular", fontSize: 15, color: "rgba(255,255,255,0.6)" },
  mimikGlow: {
    position: "absolute",
    left: -MIMIK_SIZE * 0.3,
    top: -MIMIK_SIZE * 0.25,
  },
  sectionLabel: {
    fontFamily: "Urbanist_700Bold",
    fontSize: 12,
    letterSpacing: 3,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.5)",
  },
  sectionCount: { fontFamily: "Urbanist_700Bold", fontSize: 12, color: "rgba(255,255,255,0.35)" },
});
