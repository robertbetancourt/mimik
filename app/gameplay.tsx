import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import * as ScreenOrientation from "expo-screen-orientation";
import { X } from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { BackHandler, Pressable, Text, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { getCategoryById } from "@/features/categories";
import { endTurnSounds } from "@/features/gameplay/endTurnSounds";
import { FeedbackOverlay } from "@/features/gameplay/FeedbackOverlay";
import { usePlayedWordsStore } from "@/features/gameplay/playedWordsStore";
import { TimerBar } from "@/features/gameplay/TimerBar";
import { useGameplaySession } from "@/features/gameplay/useGameplaySession";
import { useGameplaySounds } from "@/features/gameplay/useGameplaySounds";
import { useSoundPreview } from "@/features/gameplay/useSoundPreview";
import { WordCard } from "@/features/gameplay/WordCard";
import { useMatchStore } from "@/features/match/store";
import { useLockOrientation } from "@/lib/useLockOrientation";

export default function Gameplay() {
  const router = useRouter();
  const { t } = useTranslation();
  useLockOrientation(ScreenOrientation.OrientationLock.LANDSCAPE);

  const selectedCategoryId = useMatchStore((state) => state.selectedCategoryId);
  const roundDurationSeconds = useMatchStore((state) => state.roundDurationSeconds);
  const timeBonusEnabled = useMatchStore((state) => state.timeBonusEnabled);
  const timeBonusSeconds = useMatchStore((state) => state.timeBonusSeconds);
  const category = selectedCategoryId ? getCategoryById(selectedCategoryId) : undefined;

  const playedWordIdsRaw = usePlayedWordsStore((state) => (selectedCategoryId ? state.playedWordIds[selectedCategoryId] : undefined));
  const playedWordIds = playedWordIdsRaw || [];
  const addPlayedWords = usePlayedWordsStore((state) => state.addPlayedWords);
  const clearCategory = usePlayedWordsStore((state) => state.clearCategory);

  const allCategoryWords = category?.palabras ?? [];
  const unplayedWords = allCategoryWords.filter((w) => !playedWordIds.includes(w.id));
  
  const availableWords = unplayedWords.length >= 15 ? unplayedWords : allCategoryWords;

  useEffect(() => {
    if (unplayedWords.length < 15 && allCategoryWords.length >= 15 && selectedCategoryId) {
      clearCategory(selectedCategoryId);
    }
  }, [unplayedWords.length, allCategoryWords.length, selectedCategoryId, clearCategory]);

  const { status, lastFeedback, currentWord, timeRemaining, correctWords, passedWords } = useGameplaySession(
    availableWords,
    roundDurationSeconds,
    timeBonusEnabled ? timeBonusSeconds : 0
  );

  const setLastTurnResult = useMatchStore((state) => state.setLastTurnResult);
  const addTurnScore = useMatchStore((state) => state.addTurnScore);
  const recordTurnStats = useMatchStore((state) => state.recordTurnStats);
  const gameMode = useMatchStore((state) => state.gameMode);
  const players = useMatchStore((state) => state.players);
  const currentPlayerIndex = useMatchStore((state) => state.currentPlayerIndex);
  const endTurnSoundId = useMatchStore((state) => state.endTurnSoundId);
  const { playCorrect, playPass, playCountdownTick, playCountdownUrgent } = useGameplaySounds();
  const { play: playEndTurnSound } = useSoundPreview();
  const previousStatus = useRef(status);
  const [exitDialogVisible, setExitDialogVisible] = useState(false);

  const currentPlayer = players[currentPlayerIndex];

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
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        playCorrect();
      } else if (lastFeedback === "pass") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        playPass();
      }
    }
    previousStatus.current = status;
  }, [status, lastFeedback, playCorrect, playPass]);

  // Ticks once per second once the clock drops to 10s, switching to a more
  // urgent tone for the final 3-2-1 — paired with TimerBar turning red at
  // the same threshold so the audio and visual read as one signal.
  useEffect(() => {
    if (status !== "playing" || timeRemaining <= 0 || timeRemaining > 10) return;
    if (timeRemaining <= 3) {
      playCountdownUrgent();
    } else {
      playCountdownTick();
    }
  }, [status, timeRemaining, playCountdownTick, playCountdownUrgent]);

  // Time's up: brief transition, then hand off the collected words to the
  // Turn Results screen (this screen's local session state won't survive
  // navigation, so it has to be captured into the store first).
  useEffect(() => {
    if (status !== "turnFinished") return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLastTurnResult({ correctWords, passedWords });
    
    // Save played words to persistent store
    if (selectedCategoryId) {
      const turnPlayedWordIds = [...correctWords, ...passedWords].map(w => w.id);
      addPlayedWords(selectedCategoryId, turnPlayedWordIds);
    }

    if (currentPlayer) {
      addTurnScore(currentPlayer.id, correctWords.length);
      recordTurnStats(currentPlayer.id, correctWords.length, passedWords.length);
    }
    const selectedSound = endTurnSounds.find((sound) => sound.id === endTurnSoundId);
    if (selectedSound) playEndTurnSound(selectedSound.file);
    const timeout = setTimeout(() => router.replace("/turn-results"), 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  return (
    <SafeAreaView className="flex-1 bg-[#111111] px-8 py-4">
      <FeedbackOverlay feedback={status === "feedback" ? lastFeedback : null} />

      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <Text className="font-sans-bold text-lg text-white/70">{category?.titulo}</Text>
          {gameMode === "teams" && currentPlayer ? (
            <View
              style={{ backgroundColor: currentPlayer.teamId === "blue" ? "#5B8DEF" : "#FF3B30" }}
              className="rounded-full px-2.5 py-0.5"
            >
              <Text className="font-sans-bold text-xs text-white">
                {currentPlayer.teamId === "blue" ? `🔵 ${t("gameplay.teamBlue")}` : `🔴 ${t("gameplay.teamRed")}`}
              </Text>
            </View>
          ) : null}
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            Haptics.selectionAsync();
            setExitDialogVisible(true);
          }}
          className="h-9 w-9 items-center justify-center rounded-full bg-white/10"
        >
          <X size={18} color="rgba(255,255,255,0.7)" />
        </Pressable>
      </View>

      <View className="flex-1 flex-row">
        <View className="flex-1 items-center justify-center" style={{ marginTop: -16 }}>
          {/* Also true during the brief "ready" beat right after the
              countdown's GO — the word is already known, so showing it
              immediately (its own entrance animation still plays) avoids a
              blank gap between the countdown and gameplay. */}
          {(status === "playing" || status === "ready") && currentWord ? (
            <WordCard word={currentWord.texto} />
          ) : null}

          {status === "feedback" && lastFeedback === "correct" && timeBonusEnabled && timeBonusSeconds > 0 ? (
            <Animated.View
              entering={FadeIn.duration(200)}
              style={{ position: "absolute", top: "10%", right: 20 }}
            >
              <Text className="font-sans-bold text-2xl text-[#FF7A45]">+{timeBonusSeconds}s</Text>
            </Animated.View>
          ) : null}

          {status === "waitingForCenter" ? (
            <Text className="text-center font-sans-bold text-4xl text-white">
              {t("countdown.reposition")}
            </Text>
          ) : null}

          {status === "turnFinished" ? (
            <Animated.View entering={FadeIn.duration(180)} className="items-center gap-2">
              <Text className="text-5xl">⏰</Text>
              <Text className="text-center font-sans-bold text-4xl text-white">{t("gameplay.timeUp")}</Text>
            </Animated.View>
          ) : null}
        </View>

        <View className="justify-center pl-4">
          <TimerBar timeRemaining={timeRemaining} totalSeconds={roundDurationSeconds} />
        </View>
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
    </SafeAreaView>
  );
}
