import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import * as ScreenOrientation from "expo-screen-orientation";
import { X } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { getCategoryById } from "@/features/categories";
import { FeedbackOverlay } from "@/features/gameplay/FeedbackOverlay";
import { TimerBar } from "@/features/gameplay/TimerBar";
import { useGameplaySession } from "@/features/gameplay/useGameplaySession";
import { useGameplaySounds } from "@/features/gameplay/useGameplaySounds";
import { WordCard } from "@/features/gameplay/WordCard";
import { useMatchStore } from "@/features/match/store";
import { useLockOrientation } from "@/lib/useLockOrientation";

export default function Gameplay() {
  const router = useRouter();
  useLockOrientation(ScreenOrientation.OrientationLock.LANDSCAPE);

  const selectedCategoryId = useMatchStore((state) => state.selectedCategoryId);
  const roundDurationSeconds = useMatchStore((state) => state.roundDurationSeconds);
  const category = selectedCategoryId ? getCategoryById(selectedCategoryId) : undefined;

  const { status, lastFeedback, currentWord, timeRemaining, correctWords, passedWords } = useGameplaySession(
    category?.palabras ?? [],
    roundDurationSeconds,
  );

  const setLastTurnResult = useMatchStore((state) => state.setLastTurnResult);
  const addTurnScore = useMatchStore((state) => state.addTurnScore);
  const players = useMatchStore((state) => state.players);
  const currentPlayerIndex = useMatchStore((state) => state.currentPlayerIndex);
  const { playCorrect, playPass } = useGameplaySounds();
  const previousStatus = useRef(status);
  const [exitDialogVisible, setExitDialogVisible] = useState(false);

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

  // Time's up: brief transition, then hand off the collected words to the
  // Turn Results screen (this screen's local session state won't survive
  // navigation, so it has to be captured into the store first).
  useEffect(() => {
    if (status !== "turnFinished") return;
    setLastTurnResult({ correctWords, passedWords });
    const currentPlayer = players[currentPlayerIndex];
    if (currentPlayer) addTurnScore(currentPlayer.id, correctWords.length);
    const timeout = setTimeout(() => router.replace("/turn-results"), 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  return (
    <SafeAreaView className="flex-1 bg-[#111111] px-8 py-4">
      <FeedbackOverlay feedback={status === "feedback" ? lastFeedback : null} />

      <View className="flex-row items-center justify-between">
        <Text className="font-sans-bold text-lg text-white/70">{category?.titulo}</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => setExitDialogVisible(true)}
          className="h-9 w-9 items-center justify-center rounded-full bg-white/10"
        >
          <X size={18} color="rgba(255,255,255,0.7)" />
        </Pressable>
      </View>

      <View className="flex-1 flex-row">
        <View className="flex-1 items-center justify-center" style={{ marginTop: -16 }}>
          {status === "playing" && currentWord ? <WordCard word={currentWord.texto} /> : null}

          {status === "waitingForCenter" ? (
            <Text className="text-center font-sans-bold text-4xl text-white">
              Vuelve a colocar el teléfono en tu frente.
            </Text>
          ) : null}

          {status === "turnFinished" ? (
            <View className="items-center gap-2">
              <Text className="text-5xl">⏰</Text>
              <Text className="text-center font-sans-bold text-4xl text-white">¡Tiempo!</Text>
            </View>
          ) : null}
        </View>

        <View className="justify-center pl-4">
          <TimerBar timeRemaining={timeRemaining} totalSeconds={roundDurationSeconds} />
        </View>
      </View>

      <ConfirmDialog
        visible={exitDialogVisible}
        title="¿Salir de la partida?"
        message="El progreso de la partida actual se perderá."
        primaryLabel="Seguir jugando"
        onPrimary={() => setExitDialogVisible(false)}
        secondaryLabel="Salir de la partida"
        onSecondary={() => router.replace("/")}
        onBackdropPress={() => setExitDialogVisible(false)}
      />
    </SafeAreaView>
  );
}
