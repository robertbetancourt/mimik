import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import * as ScreenOrientation from "expo-screen-orientation";
import { StatusBar } from "expo-status-bar";
import { X } from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { BackHandler, Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
  ZoomIn,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { getCategoryById } from "@/features/categories";
import { endTurnSounds } from "@/features/gameplay/endTurnSounds";
import { usePlayedWordsStore } from "@/features/gameplay/playedWordsStore";
import { KineticWord } from "@/features/gameplay/stage/KineticWord";
import { MimikReactor } from "@/features/gameplay/stage/MimikReactor";
import { getStageAccent, STAGE_GOLD, STAGE_URGENT } from "@/features/gameplay/stage/palette";
import { StageBackground } from "@/features/gameplay/stage/StageBackground";
import { StageFeedback } from "@/features/gameplay/stage/StageFeedback";
import { StageTimerFrame } from "@/features/gameplay/stage/StageTimerFrame";
import { useGameplaySession } from "@/features/gameplay/useGameplaySession";
import { useGameplaySounds } from "@/features/gameplay/useGameplaySounds";
import { useSoundPreview } from "@/features/gameplay/useSoundPreview";
import { useStageMusic } from "@/features/gameplay/useStageMusic";
import { useMatchStore } from "@/features/match/store";
import { useSettingsStore } from "@/features/settings/settingsStore";
import { useLockOrientation } from "@/lib/useLockOrientation";

// In Survival Mode the turn always starts at 15 s and each correct
// answer adds 5 s — these values override the configured store settings.
const SURVIVAL_START_SECONDS = 15;
const SURVIVAL_BONUS_SECONDS = 5;
const URGENT_THRESHOLD_SECONDS = 10;
const FRAME_INSET = 8;
// Only nag about re-centering if the phone takes a while to come back —
// a normal answer re-centers well before this and never sees the hint.
const RECENTER_HINT_DELAY_MS = 700;
const TIME_UP_HOLD_MS = 900;

/** Score pill that pops every time the score goes up. */
function ScorePill({ points }: { points: number }) {
  const scale = useSharedValue(1);
  useEffect(() => {
    if (points <= 0) return;
    scale.value = withSequence(withTiming(1.35, { duration: 110 }), withSpring(1, { damping: 9, stiffness: 260 }));
  }, [points, scale]);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Animated.View style={style} className="flex-row items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1.5">
      <Text style={{ color: STAGE_GOLD }} className="font-sans-bold text-base">★</Text>
      <Text className="font-sans-bold text-lg text-white">{points}</Text>
    </Animated.View>
  );
}

/** Seconds readout in the corner — grows and turns red in the final stretch. */
function SecondsReadout({ seconds, urgent }: { seconds: number; urgent: boolean }) {
  const scale = useSharedValue(1);
  useEffect(() => {
    if (!urgent) return;
    scale.value = withSequence(withTiming(1.25, { duration: 90 }), withTiming(1, { duration: 300 }));
  }, [seconds, urgent, scale]);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Animated.Text
      style={[
        { fontFamily: "Urbanist_700Bold", fontSize: urgent ? 48 : 36, color: urgent ? STAGE_URGENT : "rgba(255,255,255,0.75)", includeFontPadding: false },
        style,
      ]}
    >
      {seconds}
    </Animated.Text>
  );
}

export default function Gameplay() {
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  useLockOrientation(ScreenOrientation.OrientationLock.LANDSCAPE);

  const selectedCategoryId = useMatchStore((state) => state.selectedCategoryId);
  const roundDurationSeconds = useMatchStore((state) => state.roundDurationSeconds);
  const timeBonusEnabled = useMatchStore((state) => state.timeBonusEnabled);
  const timeBonusSeconds = useMatchStore((state) => state.timeBonusSeconds);
  const survivalMode = useMatchStore((state) => state.survivalMode);
  const goldenWordsEnabled = useMatchStore((state) => state.goldenWordsEnabled);
  const roadtripMode = useSettingsStore((s) => s.roadtripMode);
  const category = selectedCategoryId ? getCategoryById(selectedCategoryId) : undefined;
  const accent = getStageAccent(selectedCategoryId);

  const effectiveDuration = survivalMode ? SURVIVAL_START_SECONDS : roundDurationSeconds;
  const effectiveBonus = survivalMode ? SURVIVAL_BONUS_SECONDS : timeBonusEnabled ? timeBonusSeconds : 0;

  const playedWordIdsRaw = usePlayedWordsStore((state) => (selectedCategoryId ? state.playedWordIds[selectedCategoryId] : undefined));
  const playedWordIds = playedWordIdsRaw || [];
  const addPlayedWords = usePlayedWordsStore((state) => state.addPlayedWords);
  const clearCategory = usePlayedWordsStore((state) => state.clearCategory);

  const players = useMatchStore((state) => state.players);
  const currentPlayerIndex = useMatchStore((state) => state.currentPlayerIndex);
  const currentPlayer = players[currentPlayerIndex];

  const allCategoryWords = category?.palabras ?? [];

  // Filter words by the current player's difficulty level.
  // Words without a "dificultad" field are treated as "normal".
  // If fewer than 15 words exist at the player's level, fall back to the
  // full pool so the game never breaks on sparsely-tagged categories.
  const playerDifficulty = currentPlayer?.dificultad ?? "normal";
  const difficultyPool = allCategoryWords.filter((w) => (w.dificultad ?? "normal") === playerDifficulty);
  const wordPool = difficultyPool.length >= 15 ? difficultyPool : allCategoryWords;

  const unplayedWords = wordPool.filter((w) => !playedWordIds.includes(w.id));
  const availableWords = unplayedWords.length >= 15 ? unplayedWords : wordPool;

  useEffect(() => {
    if (unplayedWords.length < 15 && wordPool.length >= 15 && selectedCategoryId) {
      clearCategory(selectedCategoryId);
    }
  }, [unplayedWords.length, wordPool.length, selectedCategoryId, clearCategory]);

  const {
    status,
    lastFeedback,
    currentWord,
    isGoldenWord,
    goldenWordIds,
    timeRemaining,
    correctWords,
    passedWords,
    points,
    streak,
    touchControls,
    markCorrect,
    markPass,
  } = useGameplaySession(availableWords, effectiveDuration, {
    timeBonusSeconds: effectiveBonus,
    goldenWordsEnabled,
  });

  const setLastTurnResult = useMatchStore((state) => state.setLastTurnResult);
  const addTurnScore = useMatchStore((state) => state.addTurnScore);
  const recordTurnStats = useMatchStore((state) => state.recordTurnStats);
  const gameMode = useMatchStore((state) => state.gameMode);
  const endTurnSoundId = useMatchStore((state) => state.endTurnSoundId);
  // The final-seconds urgency is carried by the stage music (it speeds up)
  // and the red frame/vignette — no separate countdown tick on top.
  const { playCorrect, playPass } = useGameplaySounds();
  const { play: playEndTurnSound } = useSoundPreview();
  const previousStatus = useRef(status);
  const [exitDialogVisible, setExitDialogVisible] = useState(false);

  const isLive = status === "playing" || status === "feedback" || status === "waitingForCenter";
  const isUrgent = isLive && timeRemaining > 0 && timeRemaining <= URGENT_THRESHOLD_SECONDS;
  const feedbackKey = correctWords.length + passedWords.length;
  const showFeedback = status === "feedback" ? lastFeedback : null;

  useStageMusic({ active: isLive && !exitDialogVisible, timeRemaining, totalSeconds: effectiveDuration });

  // Without this, Android's hardware back button pops the navigation stack
  // directly and silently drops the turn in progress — the same exit needs
  // the same confirmation regardless of which back affordance triggers it.
  const handleHardwareBack = useCallback(() => {
    setExitDialogVisible(true);
    return true;
  }, []);

  useEffect(() => {
    const subscription = BackHandler.addEventListener("hardwareBackPress", handleHardwareBack);
    return () => subscription.remove();
  }, [handleHardwareBack]);

  useEffect(() => {
    if (status === "feedback" && previousStatus.current !== "feedback") {
      if (lastFeedback === "correct") {
        Haptics.impactAsync(isGoldenWord ? Haptics.ImpactFeedbackStyle.Heavy : Haptics.ImpactFeedbackStyle.Medium);
        playCorrect();
      } else if (lastFeedback === "pass") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        playPass();
      }
    }
    previousStatus.current = status;
  }, [status, lastFeedback, isGoldenWord, playCorrect, playPass]);

  // Time's up: hold the stamp for a beat, then hand off the collected words
  // to the Turn Results screen (this screen's local session state won't
  // survive navigation, so it has to be captured into the store first).
  useEffect(() => {
    if (status !== "turnFinished") return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    const playedIds = new Set([...correctWords, ...passedWords].map((w) => w.id));
    setLastTurnResult({
      correctWords,
      passedWords,
      goldenWordIds: goldenWordIds.filter((id) => playedIds.has(id)),
    });

    // Save played words to persistent store
    if (selectedCategoryId) {
      addPlayedWords(selectedCategoryId, [...playedIds]);
    }

    if (currentPlayer) {
      addTurnScore(currentPlayer.id, points);
      recordTurnStats(currentPlayer.id, correctWords.length, passedWords.length);
    }
    const selectedSound = endTurnSounds.find((sound) => sound.id === endTurnSoundId);
    if (selectedSound) playEndTurnSound(selectedSound.file);
    const timeout = setTimeout(() => router.replace("/turn-results"), TIME_UP_HOLD_MS);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  // ── Layout ────────────────────────────────────────────────────────────────
  // The word lives in its own full-screen layer, centered on the *screen*
  // (not on whatever space the HUD leaves over). Side margins are symmetric
  // — the larger of the two landscape insets is used on both sides — so a
  // notch on one side can never push the word off-center.
  const sideInset = Math.max(insets.left, insets.right);
  const verticalInset = Math.max(insets.top, insets.bottom);
  const hudX = sideInset + 26;
  const hudY = verticalInset + 20;
  // Touch controls add "← PASS / CORRECT →" labels on both edges — keep the
  // word clear of them (still symmetric, so centering is unaffected).
  const touchHintGutter = touchControls ? 110 : 70;
  const wordMaxWidth = Math.max(width - 2 * (hudX + touchHintGutter), 200);
  const wordMaxHeight = Math.max(height - 2 * (hudY + 44), 120);
  const mimikSize = Math.round(Math.min(height * 0.3, 130));
  const energy = Math.min(streak, 5) / 5;

  const showWord = (status === "playing" || status === "ready" || status === "feedback") && currentWord;
  const showGhostCount = isLive && timeRemaining > 0 && timeRemaining <= 3;

  return (
    <View style={{ flex: 1 }}>
      <StatusBar hidden />
      <StageBackground
        accent={accent}
        energy={energy}
        urgent={isUrgent}
        beatKey={timeRemaining}
        golden={isGoldenWord && status !== "turnFinished"}
      />
      <StageTimerFrame
        timeRemaining={timeRemaining}
        totalSeconds={effectiveDuration}
        color={accent.a}
        urgent={isUrgent}
        inset={FRAME_INSET}
      />

      {/* Final 3-2-1: a giant ghost number behind the word. */}
      {showGhostCount ? (
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.center]}>
          <Animated.Text
            key={timeRemaining}
            entering={roadtripMode ? undefined : ZoomIn.springify().damping(12)}
            style={[styles.ghostCount, { fontSize: height * 0.9, lineHeight: height * 0.95 }]}
          >
            {timeRemaining}
          </Animated.Text>
        </View>
      ) : null}

      {/* Mimik sits behind the word, in the bottom-left corner. */}
      <View pointerEvents="none" style={{ position: "absolute", left: hudX - 8, bottom: hudY - 10 }}>
        <MimikReactor
          size={mimikSize}
          feedback={showFeedback}
          feedbackKey={feedbackKey}
          golden={isGoldenWord}
          urgent={isUrgent}
          streak={streak}
        />
      </View>

      {/* ── Word layer: full screen, centered ─────────────────────────────── */}
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.center]}>
        {showWord ? (
          <KineticWord
            word={currentWord.texto}
            feedback={showFeedback}
            golden={isGoldenWord}
            maxWidth={wordMaxWidth}
            maxHeight={wordMaxHeight}
            shakeKey={timeRemaining <= 3 ? 4 - timeRemaining : 0}
          />
        ) : null}

        {status === "waitingForCenter" ? (
          <Animated.Text
            entering={FadeIn.delay(RECENTER_HINT_DELAY_MS).duration(220)}
            style={{ maxWidth: wordMaxWidth }}
            className="text-center font-sans-bold text-3xl text-white/80"
          >
            {t("countdown.reposition")}
          </Animated.Text>
        ) : null}

        {status === "turnFinished" ? (
          <Animated.View entering={ZoomIn.springify().damping(9).stiffness(220)} className="items-center">
            <Text style={styles.timeUp}>{t("gameplay.timeUp")}</Text>
          </Animated.View>
        ) : null}
      </View>

      {/* Golden word tag above the word */}
      {isGoldenWord && (status === "playing" || status === "feedback") ? (
        <Animated.View
          entering={ZoomIn.springify().damping(10)}
          exiting={FadeOut.duration(150)}
          pointerEvents="none"
          style={{ position: "absolute", top: hudY + 4, left: 0, right: 0, alignItems: "center" }}
        >
          <View style={styles.goldenTag}>
            <Text style={styles.goldenTagText}>{t("gameplay.goldenWord")}</Text>
          </View>
        </Animated.View>
      ) : null}

      <StageFeedback feedback={showFeedback} golden={isGoldenWord} feedbackKey={feedbackKey} />

      {/* ── Touch controls (opt-in, from Settings) ────────────────────────── */}
      {touchControls && status === "playing" ? (
        <View style={[StyleSheet.absoluteFill, { flexDirection: "row" }]}>
          <Pressable accessibilityRole="button" accessibilityLabel={t("feedback.pass")} onPress={markPass} style={styles.touchZone}>
            <Text style={[styles.touchHint, { left: hudX }]}>← {t("feedback.pass")}</Text>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel={t("feedback.correct")} onPress={markCorrect} style={styles.touchZone}>
            <Text style={[styles.touchHint, { right: hudX }]}>{t("feedback.correct")} →</Text>
          </Pressable>
        </View>
      ) : null}

      {/* ── HUD ────────────────────────────────────────────────────────────── */}
      <View
        pointerEvents="box-none"
        style={{ position: "absolute", top: hudY, left: hudX, right: hudX }}
        className="flex-row items-start justify-between"
      >
        <View className="flex-row flex-wrap items-center gap-2" style={{ maxWidth: width * 0.34 }}>
          <Text className="font-sans-bold text-base text-white/70" numberOfLines={1}>
            {category?.titulo}
          </Text>
          {survivalMode ? (
            <View className="rounded-full bg-[#FF7A45]/25 px-2.5 py-0.5">
              <Text className="font-sans-bold text-xs text-[#FF9A6B]">{t("gameplay.survivalBadge")}</Text>
            </View>
          ) : null}
          {gameMode === "teams" && currentPlayer ? (
            <View
              style={{ backgroundColor: currentPlayer.teamId === "blue" ? "#5B8DEF" : "#FF3B30" }}
              className="rounded-full px-2.5 py-0.5"
            >
              <Text className="font-sans-bold text-xs text-white">
                {currentPlayer.teamId === "blue" ? t("gameplay.teamBlue") : t("gameplay.teamRed")}
              </Text>
            </View>
          ) : null}
        </View>

        <View className="flex-row items-center gap-3">
          <ScorePill points={points} />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("gameplay.exitTitle")}
            onPress={() => {
              Haptics.selectionAsync();
              setExitDialogVisible(true);
            }}
            className="h-9 w-9 items-center justify-center rounded-full bg-white/10"
          >
            <X size={18} color="rgba(255,255,255,0.7)" />
          </Pressable>
        </View>
      </View>

      {/* Streak chip — bottom center */}
      {streak >= 2 && isLive ? (
        <Animated.View
          key={streak}
          entering={roadtripMode ? undefined : ZoomIn.springify().damping(8).stiffness(300)}
          pointerEvents="none"
          style={{ position: "absolute", bottom: hudY, left: 0, right: 0, alignItems: "center" }}
        >
          <View className="flex-row items-center gap-1 rounded-full px-3.5 py-1" style={{ backgroundColor: accent.a }}>
            <Text className="font-sans-bold text-base text-white">🔥 {t("gameplay.streak", { n: streak })}</Text>
          </View>
        </Animated.View>
      ) : null}

      {/* Seconds — bottom right, with the time-bonus pop above it */}
      <View pointerEvents="none" style={{ position: "absolute", right: hudX, bottom: hudY - 6, alignItems: "flex-end" }}>
        {status === "feedback" && lastFeedback === "correct" && effectiveBonus > 0 ? (
          <Animated.Text
            entering={FadeIn.duration(120)}
            exiting={FadeOut.duration(200)}
            className="font-sans-bold text-2xl text-[#4ADE80]"
          >
            +{effectiveBonus}s
          </Animated.Text>
        ) : null}
        <SecondsReadout seconds={timeRemaining} urgent={isUrgent} />
      </View>

      <ConfirmDialog
        visible={exitDialogVisible}
        title={t("gameplay.exitTitle")}
        message={t("gameplay.exitMessage")}
        primaryLabel={t("gameplay.exitPrimary")}
        onPrimary={() => setExitDialogVisible(false)}
        secondaryLabel={t("gameplay.exitSecondary")}
        onSecondary={() => router.replace("/")}
        onBackdropPress={() => setExitDialogVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: "center", justifyContent: "center" },
  ghostCount: {
    fontFamily: "Urbanist_700Bold",
    color: STAGE_URGENT,
    opacity: 0.16,
    includeFontPadding: false,
    textAlign: "center",
  },
  timeUp: {
    fontFamily: "Urbanist_700Bold",
    fontSize: 88,
    color: "#FFFFFF",
    letterSpacing: -2,
    includeFontPadding: false,
    transform: [{ rotate: "-4deg" }],
  },
  goldenTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 5,
    backgroundColor: "rgba(255,213,74,0.16)",
    borderWidth: 1,
    borderColor: "rgba(255,213,74,0.55)",
  },
  goldenTagText: { fontFamily: "Urbanist_700Bold", fontSize: 14, color: STAGE_GOLD, letterSpacing: 1.5 },
  touchZone: { flex: 1, justifyContent: "center" },
  touchHint: {
    position: "absolute",
    fontFamily: "Urbanist_700Bold",
    fontSize: 13,
    letterSpacing: 1.5,
    color: "rgba(255,255,255,0.35)",
    textTransform: "uppercase",
  },
});
