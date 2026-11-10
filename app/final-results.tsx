import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import * as ScreenOrientation from "expo-screen-orientation";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Image, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import Animated, { FadeIn, FadeInDown, ZoomIn } from "react-native-reanimated";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { ConfettiBurst } from "@/components/effects/ConfettiBurst";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { getCategoryById } from "@/features/categories";
import { getStageAccent, STAGE_BASE } from "@/features/gameplay/stage/palette";
import { StageBackground } from "@/features/gameplay/stage/StageBackground";
import { useHistoryStore } from "@/features/history/historyStore";
import { useMatchStore } from "@/features/match/store";
import { calculateAwards } from "@/features/players/awards";
import { getCharacterById } from "@/features/players/characters";
import { rankPlayers } from "@/features/players/ranking";
import { PODIUM_WINNER_LANDS_MS, StagePodium } from "@/features/players/StagePodium";
import { useCelebrationSound } from "@/features/players/useCelebrationSound";
import { useLockOrientation } from "@/lib/useLockOrientation";

const TEAM_COLORS = { red: "#FF3B30", blue: "#5B8DEF" } as const;

export default function FinalResults() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { t } = useTranslation();
  useLockOrientation(ScreenOrientation.OrientationLock.PORTRAIT_UP);

  const players = useMatchStore((state) => state.players);
  const playerScores = useMatchStore((state) => state.playerScores);
  const playerStats = useMatchStore((state) => state.playerStats);
  const gameMode = useMatchStore((state) => state.gameMode);
  const selectedCategoryId = useMatchStore((state) => state.selectedCategoryId);
  const startRematch = useMatchStore((state) => state.startRematch);
  const resetMatch = useMatchStore((state) => state.resetMatch);
  const addRecord = useHistoryStore((state) => state.addRecord);
  const accent = getStageAccent(selectedCategoryId);

  const isTeamMode = gameMode === "teams";
  // Team mode orders the podium by team score first — the same comparison
  // that decides the banner below — so the podium can never contradict the
  // team the app just announced as the winner.
  const ranked = rankPlayers(players, playerScores, isTeamMode);
  const [first, second, third] = ranked;
  const remaining = ranked.slice(3);
  const isTie = !isTeamMode && ranked.filter((entry) => entry.rank === 1).length > 1;

  const redScore = players
    .filter((player) => player.teamId === "red")
    .reduce((sum, player) => sum + (playerScores[player.id] ?? 0), 0);
  const blueScore = players
    .filter((player) => player.teamId === "blue")
    .reduce((sum, player) => sum + (playerScores[player.id] ?? 0), 0);
  const winningTeamId = redScore >= blueScore ? "red" : "blue";
  const winningTeamLabel = winningTeamId === "red" ? t("finalResults.teamRed") : t("finalResults.teamBlue");

  const awards = calculateAwards(players, playerStats, playerScores);

  const { play: playCelebrationSound } = useCelebrationSound();
  const [celebrationPeak, setCelebrationPeak] = useState(false);

  // Save the finished match to the history exactly once per mount.
  const savedRef = useRef(false);
  useEffect(() => {
    if (savedRef.current || ranked.length === 0) return;
    savedRef.current = true;
    const category = selectedCategoryId ? getCategoryById(selectedCategoryId) : undefined;
    addRecord({
      categoryId: selectedCategoryId,
      categoryTitle: category?.titulo ?? "",
      gameMode,
      players: ranked.map(({ player, score }) => ({
        id: player.id,
        name: player.name,
        characterId: player.characterId,
        teamId: player.teamId,
        score,
      })),
      winnerIds: isTeamMode
        ? players.filter((player) => player.teamId === winningTeamId).map((player) => player.id)
        : ranked.filter((entry) => entry.rank === 1).map((entry) => entry.player.id),
      winningTeamId: isTeamMode ? winningTeamId : undefined,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Navigate first, reset after — resetting the store immediately would
  // recompute this still-mounted screen's podium with the new (empty or
  // freshly-generated) player data for a frame before it unmounts, flashing
  // different characters right as the screen is supposed to just vanish.
  function handleRematch() {
    router.replace("/countdown");
    setTimeout(() => startRematch(), 0);
  }

  function handleHome() {
    router.replace("/");
    setTimeout(() => resetMatch(), 0);
  }

  const podiumWidth = Math.min(width - 32, 390);
  const titleDelay = PODIUM_WINNER_LANDS_MS - 100;

  return (
    <View style={{ flex: 1, backgroundColor: STAGE_BASE }}>
      <StatusBar style="light" />
      <StageBackground accent={accent} energy={celebrationPeak ? 0.8 : 0.2} />

      <SafeAreaView className="flex-1" edges={["top"]}>
        <ScrollView contentContainerClassName="items-center px-4 pb-56 pt-8" showsVerticalScrollIndicator={false}>
          {/* Title — lands together with the winner */}
          <Animated.View entering={FadeIn.delay(titleDelay).duration(300)} className="items-center">
            <Text style={{ color: isTeamMode ? TEAM_COLORS[winningTeamId] : accent.a }} className="font-sans-bold text-xs uppercase tracking-[3px]">
              {isTeamMode ? t("finalResults.teamKicker") : t("finalResults.winnerKicker")}
            </Text>
          </Animated.View>
          <Animated.View entering={ZoomIn.delay(titleDelay).springify().damping(10).stiffness(180)} className="items-center px-4">
            <Text numberOfLines={2} adjustsFontSizeToFit style={styles.title}>
              {isTeamMode
                ? t("finalResults.teamWins", { team: winningTeamLabel })
                : isTie
                  ? t("history.tie")
                  : first?.player.name}
            </Text>
            {isTeamMode ? (
              <Text className="mt-1 font-sans text-sm text-white/70">
                {t("finalResults.scoreLine", { red: redScore, blue: blueScore })}
              </Text>
            ) : (
              <Text className="font-sans text-base text-white/70">{t("finalResults.winsMatch")}</Text>
            )}
          </Animated.View>

          <View style={{ marginTop: 18 }}>
            <StagePodium
              first={first}
              second={second}
              third={third}
              width={podiumWidth}
              accent={accent.a}
              onWinnerLanded={() => {
                playCelebrationSound();
                setCelebrationPeak(true);
              }}
            />
          </View>

          {isTeamMode && first ? (
            <Animated.Text entering={FadeIn.delay(titleDelay + 200)} className="mt-3 font-sans-bold text-sm text-white">
              {t("finalResults.mvp", { name: first.player.name })}
            </Animated.Text>
          ) : null}

          {awards.length > 0 ? (
            <View className="mt-8 w-full">
              <Text className="mb-3 font-sans-bold text-base text-white">{t("finalResults.specialAwards")}</Text>
              <View className="gap-2.5">
                {awards.map((award, index) => {
                  const character = getCharacterById(award.player.characterId);
                  return (
                    <Animated.View
                      key={award.id}
                      entering={FadeInDown.delay(titleDelay + 300 + index * 120).springify().damping(15)}
                      style={styles.glassCard}
                      className="flex-row items-center gap-3 px-4 py-3"
                    >
                      <View style={styles.badge}>
                        <Text className="text-2xl">{award.badge}</Text>
                      </View>
                      <View className="flex-1">
                        <Text className="font-sans-bold text-base text-white">{award.title}</Text>
                        <View className="flex-row items-center gap-1.5">
                          {character ? (
                            <Image source={character.illustration} resizeMode="contain" style={{ width: 16, height: 16 }} />
                          ) : null}
                          <Text className="font-sans text-xs text-white/60" numberOfLines={1}>
                            {award.player.name} • {award.description}
                          </Text>
                        </View>
                      </View>
                      <Text style={{ color: accent.a }} className="font-sans-bold text-sm">
                        {award.statValue}
                      </Text>
                    </Animated.View>
                  );
                })}
              </View>
            </View>
          ) : null}

          {remaining.length > 0 ? (
            <View className="mt-8 w-full">
              <Text className="mb-3 font-sans-bold text-base text-white">{t("finalResults.finalRanking")}</Text>
              <View className="gap-2">
                {remaining.map(({ player, rank, score }, index) => {
                  const character = getCharacterById(player.characterId);
                  return (
                    <Animated.View
                      key={player.id}
                      entering={FadeInDown.delay(titleDelay + 500 + index * 80)}
                      style={styles.glassCard}
                      className="flex-row items-center gap-3 p-2.5"
                    >
                      <Text className="w-5 text-center font-sans-bold text-sm text-white/40">{rank}</Text>
                      <View className="h-9 w-9 items-center justify-center rounded-full bg-white/10">
                        {character ? (
                          <Image source={character.illustration} resizeMode="contain" style={{ width: 24, height: 24 }} />
                        ) : null}
                      </View>
                      <Text className="flex-1 font-sans-bold text-sm text-white" numberOfLines={1}>
                        {player.name}
                      </Text>
                      <Text className="pr-2 font-sans-bold text-base text-white">{score}</Text>
                    </Animated.View>
                  );
                })}
              </View>
            </View>
          ) : null}
        </ScrollView>
      </SafeAreaView>

      <ConfettiBurst enabled={celebrationPeak} />

      <Animated.View
        entering={FadeIn.delay(200).duration(260)}
        style={{ position: "absolute", left: 0, right: 0, bottom: 0 }}
      >
        <LinearGradient
          colors={["rgba(11,9,18,0)", "rgba(11,9,18,0.92)", STAGE_BASE]}
          locations={[0, 0.35, 1]}
          style={{ paddingTop: 36, paddingHorizontal: 16, paddingBottom: insets.bottom + 20 }}
        >
          <PrimaryButton tone="accent" label={t("finalResults.rematch")} onPress={handleRematch} />
          <Text
            onPress={handleHome}
            accessibilityRole="button"
            className="mt-3 py-2 text-center font-sans-bold text-base text-white/60"
          >
            {t("finalResults.goHome")}
          </Text>
        </LinearGradient>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontFamily: "Urbanist_700Bold",
    fontSize: 46,
    lineHeight: 52,
    letterSpacing: -1.2,
    color: "#FFFFFF",
    textAlign: "center",
  },
  glassCard: {
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  badge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
  },
});
