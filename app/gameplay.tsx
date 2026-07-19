import * as Haptics from "expo-haptics";
import * as ScreenOrientation from "expo-screen-orientation";
import { useEffect, useRef } from "react";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getCategoryById } from "@/features/categories";
import { FeedbackOverlay } from "@/features/gameplay/FeedbackOverlay";
import { TimerBar } from "@/features/gameplay/TimerBar";
import { useGameplaySession } from "@/features/gameplay/useGameplaySession";
import { useGameplaySounds } from "@/features/gameplay/useGameplaySounds";
import { WordCard } from "@/features/gameplay/WordCard";
import { useMatchStore } from "@/features/match/store";
import { useLockOrientation } from "@/lib/useLockOrientation";

export default function Gameplay() {
  useLockOrientation(ScreenOrientation.OrientationLock.LANDSCAPE);

  const selectedCategoryId = useMatchStore((state) => state.selectedCategoryId);
  const roundDurationSeconds = useMatchStore((state) => state.roundDurationSeconds);
  const category = selectedCategoryId ? getCategoryById(selectedCategoryId) : undefined;

  const { status, lastFeedback, currentWord, timeRemaining } = useGameplaySession(
    category?.palabras ?? [],
    roundDurationSeconds,
  );

  const { playCorrect, playPass } = useGameplaySounds();
  const previousStatus = useRef(status);

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

  return (
    <SafeAreaView className="flex-1 flex-row bg-[#111111] px-8 py-4">
      <FeedbackOverlay feedback={status === "feedback" ? lastFeedback : null} />

      <View className="flex-1">
        <Text className="font-sans-bold text-lg text-white/70">{category?.titulo}</Text>

        <View className="flex-1 items-center justify-center" style={{ marginTop: -16 }}>
          {status === "playing" && currentWord ? <WordCard word={currentWord.texto} /> : null}

          {status === "waitingForCenter" ? (
            <Text className="text-center font-sans-bold text-4xl text-white">
              Vuelve a colocar el teléfono en tu frente.
            </Text>
          ) : null}

          {status === "turnFinished" ? (
            <Text className="text-center font-sans-bold text-4xl text-white">Turno terminado</Text>
          ) : null}
        </View>
      </View>

      <View className="justify-center pl-4">
        <TimerBar timeRemaining={timeRemaining} totalSeconds={roundDurationSeconds} />
      </View>
    </SafeAreaView>
  );
}
