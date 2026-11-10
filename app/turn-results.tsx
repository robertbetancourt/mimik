import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import * as ScreenOrientation from "expo-screen-orientation";
import { StatusBar } from "expo-status-bar";
import { useTranslation } from "react-i18next";
import { Image, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { BounceIn, FadeIn, FadeInDown, ZoomIn } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CloseCircleIcon, TickCircleIcon } from "@/components/icons/FeedbackIcons";
import { StageGlow, withAlpha } from "@/components/stage/StageGlow";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { getStageAccent, STAGE_BASE, STAGE_GOLD } from "@/features/gameplay/stage/palette";
import { StageBackground } from "@/features/gameplay/stage/StageBackground";
import { scoreTurnResult, useMatchStore } from "@/features/match/store";
import { type MimikExpression, mimikExpressions } from "@/features/mimik/expressions";
import { getCharacterById } from "@/features/players/characters";
import { NextPlayerButton } from "@/features/players/NextPlayerButton";
import { PlayerRankRow } from "@/features/players/PlayerRankRow";
import { rankPlayers } from "@/features/players/ranking";
import { TurnWordChip } from "@/features/players/TurnWordChip";
import { useLockOrientation } from "@/lib/useLockOrientation";

const AVATAR_SIZE = 96;

// Mimik's verdict on the turn — never mean, always dramatic.
function verdictFor(points: number): MimikExpression {
  if (points === 0) return "facepalm";
  if (points <= 2) return "lookingAtYou";
  if (points <= 5) return "holdingLaughter";
  return "celebration";
}

export default function TurnResults() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  useLockOrientation(ScreenOrientation.OrientationLock.PORTRAIT_UP);

  const players = useMatchStore((state) => state.players);
  const playerScores = useMatchStore((state) => state.playerScores);
  const currentPlayerIndex = useMatchStore((state) => state.currentPlayerIndex);
  const currentRound = useMatchStore((state) => state.currentRound);
  const totalRounds = useMatchStore((state) => state.totalRounds);
  const infiniteMode = useMatchStore((state) => state.infiniteMode);
  const lastTurnResult = useMatchStore((state) => state.lastTurnResult);
  const advanceTurn = useMatchStore((state) => state.advanceTurn);
  const toggleLastTurnWord = useMatchStore((state) => state.toggleLastTurnWord);
  const selectedCategoryId = useMatchStore((state) => state.selectedCategoryId);
  const accent = getStageAccent(selectedCategoryId);

  const currentPlayer = players[currentPlayerIndex];
  const currentCharacter = currentPlayer ? getCharacterById(currentPlayer.characterId) : undefined;

  const correctWords = lastTurnResult?.correctWords ?? [];
  const passedWords = lastTurnResult?.passedWords ?? [];
  const goldenWordIds = lastTurnResult?.goldenWordIds ?? [];
  const turnPoints = lastTurnResult ? scoreTurnResult(lastTurnResult) : 0;
  const goldenHits = correctWords.filter((w) => goldenWordIds.includes(w.id)).length;
  const hasWords = correctWords.length + passedWords.length > 0;

  const ranked = rankPlayers(players, playerScores);
  const maxScore = Math.max(...ranked.map((r) => r.score), 0);

  const nextPlayerIndex = players.length > 0 ? (currentPlayerIndex + 1) % players.length : 0;
  const nextPlayer = players[nextPlayerIndex];
  const nextCharacter = nextPlayer ? getCharacterById(nextPlayer.characterId) : undefined;

  // Mirrors advanceTurn()'s finishing condition without mutating the store,
  // so the button can announce the podium instead of a next player that
  // will never actually play.
  const isMatchWillFinish = !infiniteMode && nextPlayerIndex === 0 && currentRound + 1 > totalRounds;

  function handleContinue() {
    const matchFinished = advanceTurn();
    router.replace(matchFinished ? "/final-results" : "/countdown");
  }

  const roundLabel = infiniteMode
    ? t("turnResults.roundInfinite", { round: currentRound })
    : t("turnResults.round", { round: currentRound, total: totalRounds });

  return (
    <View style={{ flex: 1, backgroundColor: STAGE_BASE }}>
      <StatusBar style="light" />
      <StageBackground accent={accent} energy={Math.min(turnPoints / 8, 1)} />

      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 20, paddingBottom: insets.bottom + 140, paddingHorizontal: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Who played ─────────────────────────────────────────────────── */}
        <View className="items-center">
          <Animated.Text entering={FadeIn.duration(260)} style={[styles.kicker, { color: accent.a }]}>
            {roundLabel}
          </Animated.Text>
          <Animated.View entering={ZoomIn.springify().damping(12)} style={[styles.halo, { borderColor: accent.a }]}>
            {currentCharacter ? (
              <Image source={currentCharacter.illustration} resizeMode="contain" style={{ width: AVATAR_SIZE * 0.78, height: AVATAR_SIZE * 0.78 }} />
            ) : null}
          </Animated.View>
          <Animated.Text entering={FadeIn.delay(80).duration(260)} style={styles.name} numberOfLines={1}>
            {currentPlayer?.name}
          </Animated.Text>
        </View>

        {/* ── Score hero ─────────────────────────────────────────────────── */}
        <View className="mt-2 items-center">
          <View style={styles.scoreGlow}>
            <StageGlow color={accent.a} width={300} height={220} intensity={0.5} />
          </View>
          <View className="flex-row items-center">
            <Animated.Image
              entering={FadeIn.delay(300).duration(300)}
              source={require("../assets/images/ui/left-points.png")}
              resizeMode="contain"
              style={{ width: 84, height: 84, marginRight: -10 }}
            />
            <Animated.View entering={ZoomIn.delay(120).springify().damping(9).stiffness(200)}>
              <AnimatedCounter value={turnPoints} duration={800} style={styles.score} />
            </Animated.View>
            <Animated.Image
              entering={FadeIn.delay(300).duration(300)}
              source={require("../assets/images/ui/right-points.png")}
              resizeMode="contain"
              style={{ width: 84, height: 84, marginLeft: -10 }}
            />
          </View>
          <Text style={styles.scoreLabel}>{t("turnResults.points")}</Text>

          {goldenHits > 0 ? (
            <Animated.View entering={ZoomIn.delay(500).springify()} style={styles.goldenPill}>
              <Text style={styles.goldenPillText}>{t("turnResults.goldenHits", { count: goldenHits })}</Text>
            </Animated.View>
          ) : null}

          {/* Mimik's verdict, perched next to the score */}
          <Animated.View entering={BounceIn.delay(450).duration(700)} style={styles.verdict} pointerEvents="none">
            <Image source={mimikExpressions[verdictFor(turnPoints)]} resizeMode="contain" style={{ width: 78, height: 78 }} />
          </Animated.View>
        </View>

        {/* ── Words of the turn ──────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(250).springify().damping(16)} style={[styles.glass, { marginTop: 22 }]}>
          <View className="flex-row items-center gap-2">
            <TickCircleIcon size={20} color="#4ADE80" />
            <Text style={styles.sectionTitle}>{t("turnResults.correct")}</Text>
            <Text style={styles.sectionCount}>{correctWords.length}</Text>
          </View>
          {correctWords.length === 0 ? (
            <Text style={styles.empty}>{t("turnResults.noneThisTime")}</Text>
          ) : (
            <View className="mt-3 flex-row flex-wrap gap-2">
              {correctWords.map((word) => (
                <TurnWordChip
                  key={word.id}
                  word={word}
                  kind="correct"
                  golden={goldenWordIds.includes(word.id)}
                  onPress={() => toggleLastTurnWord(word.id)}
                />
              ))}
            </View>
          )}

          <View style={styles.divider} />

          <View className="flex-row items-center gap-2">
            <CloseCircleIcon size={20} color="#FB923C" />
            <Text style={styles.sectionTitle}>{t("turnResults.passed")}</Text>
            <Text style={styles.sectionCount}>{passedWords.length}</Text>
          </View>
          {passedWords.length === 0 ? (
            <Text style={styles.empty}>{t("turnResults.noneThisTime")}</Text>
          ) : (
            <View className="mt-3 flex-row flex-wrap gap-2">
              {passedWords.map((word) => (
                <TurnWordChip
                  key={word.id}
                  word={word}
                  kind="passed"
                  golden={goldenWordIds.includes(word.id)}
                  onPress={() => toggleLastTurnWord(word.id)}
                />
              ))}
            </View>
          )}

          {hasWords ? <Text style={styles.hint}>{t("turnResults.tapToFix")}</Text> : null}
        </Animated.View>

        {/* ── Leaderboard ────────────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(380).springify().damping(16)} className="mt-6">
          <Text style={styles.boardLabel}>{t("turnResults.leaderboard")}</Text>
          <View style={{ gap: 8 }}>
            {ranked.map(({ player, rank, score }, index) => (
              <PlayerRankRow
                key={player.id}
                rank={rank}
                player={player}
                score={score}
                maxScore={maxScore}
                highlight={player.id === currentPlayer?.id}
                accent={accent.a}
                index={index}
              />
            ))}
          </View>
        </Animated.View>
      </ScrollView>

      {/* ── Way forward ──────────────────────────────────────────────────── */}
      <Animated.View entering={FadeIn.delay(450).duration(260)} style={styles.footer}>
        <LinearGradient
          colors={["rgba(11,9,18,0)", "rgba(11,9,18,0.92)", STAGE_BASE]}
          locations={[0, 0.35, 1]}
          style={{ paddingTop: 34, paddingHorizontal: 16, paddingBottom: insets.bottom + 18 }}
        >
          {isMatchWillFinish ? (
            <PrimaryButton tone="accent" label={`🏆 ${t("turnResults.viewPodium")}`} onPress={handleContinue} />
          ) : (
            <NextPlayerButton
              playerName={nextPlayer?.name ?? ""}
              characterIllustration={nextCharacter?.illustration}
              onPress={handleContinue}
            />
          )}
        </LinearGradient>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  kicker: { fontFamily: "Urbanist_700Bold", fontSize: 12, letterSpacing: 3, textTransform: "uppercase", marginBottom: 12 },
  halo: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  name: { marginTop: 10, fontFamily: "Urbanist_700Bold", fontSize: 26, color: "#FFFFFF", letterSpacing: -0.5 },
  scoreGlow: { position: "absolute", top: -40 },
  score: {
    fontFamily: "Urbanist_700Bold",
    fontSize: 96,
    lineHeight: 104,
    color: "#FFFFFF",
    minWidth: 80,
    textAlign: "center",
    includeFontPadding: false,
  },
  scoreLabel: { marginTop: -6, fontFamily: "Urbanist_600SemiBold", fontSize: 13, letterSpacing: 3, textTransform: "uppercase", color: "rgba(255,255,255,0.55)" },
  goldenPill: {
    marginTop: 10,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: withAlpha(STAGE_GOLD, 0.55),
    backgroundColor: withAlpha(STAGE_GOLD, 0.14),
  },
  goldenPillText: { fontFamily: "Urbanist_700Bold", fontSize: 13, color: STAGE_GOLD },
  verdict: { position: "absolute", right: 0, top: 6 },
  glass: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
    backgroundColor: "rgba(255,255,255,0.05)",
    padding: 16,
  },
  sectionTitle: { fontFamily: "Urbanist_700Bold", fontSize: 16, color: "#FFFFFF" },
  sectionCount: {
    fontFamily: "Urbanist_700Bold",
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
    backgroundColor: "rgba(255,255,255,0.10)",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 1,
    overflow: "hidden",
  },
  empty: { marginTop: 8, fontFamily: "Urbanist_400Regular", fontSize: 13, color: "rgba(255,255,255,0.45)" },
  divider: { height: 1, backgroundColor: "rgba(255,255,255,0.08)", marginVertical: 14 },
  hint: { marginTop: 14, fontFamily: "Urbanist_400Regular", fontSize: 12, color: "rgba(255,255,255,0.45)", textAlign: "center" },
  boardLabel: {
    marginBottom: 10,
    marginLeft: 4,
    fontFamily: "Urbanist_700Bold",
    fontSize: 12,
    letterSpacing: 3,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.5)",
  },
  footer: { position: "absolute", left: 0, right: 0, bottom: 0 },
});
