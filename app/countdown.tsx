import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import * as ScreenOrientation from "expo-screen-orientation";
import { ChevronLeft } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import { BackHandler, Image, Pressable, Text } from "react-native";
import Animated, {
  FadeIn,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { useForeheadOrientation } from "@/features/gameplay/useForeheadOrientation";
import { useMatchStore } from "@/features/match/store";
import { getCharacterById } from "@/features/players/characters";
import { useLockOrientation } from "@/lib/useLockOrientation";

const COUNTDOWN_STEPS = ["3", "2", "1", "¡Ya!"];
const STEP_DURATION_MS = 700;

export default function Countdown() {
  const router = useRouter();
  const isOriented = useForeheadOrientation();
  const players = useMatchStore((state) => state.players);
  const currentPlayerIndex = useMatchStore((state) => state.currentPlayerIndex);
  const currentPlayer = players[currentPlayerIndex];
  const currentCharacter = currentPlayer ? getCharacterById(currentPlayer.characterId) : undefined;

  useLockOrientation(ScreenOrientation.OrientationLock.LANDSCAPE);

  // null = waiting for the correct position, otherwise index into COUNTDOWN_STEPS.
  const [stepIndex, setStepIndex] = useState<number | null>(null);
  // Lags stepIndex by a brief fade-out so numbers crossfade instead of
  // swapping instantly — purely visual, doesn't affect the countdown timing.
  const [displayIndex, setDisplayIndex] = useState<number | null>(null);

  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  // The player can always back out before gameplay starts — this leaves the
  // countdown state behind entirely and unmounts the sensor listener.
  useEffect(() => {
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      handleBack();
      return true;
    });
    return () => subscription.remove();
  }, [handleBack]);

  // Start counting as soon as the phone reaches the playing position. Once
  // started, the count never resets — if the position is lost mid-countdown
  // it just pauses on the current number and resumes when re-oriented.
  useEffect(() => {
    if (isOriented) {
      setStepIndex((current) => (current === null ? 0 : current));
    }
  }, [isOriented]);

  useEffect(() => {
    if (stepIndex === null || !isOriented) return;

    if (stepIndex >= COUNTDOWN_STEPS.length) {
      router.replace("/gameplay");
      return;
    }

    const isFinalStep = stepIndex === COUNTDOWN_STEPS.length - 1;
    Haptics.impactAsync(isFinalStep ? Haptics.ImpactFeedbackStyle.Heavy : Haptics.ImpactFeedbackStyle.Light);

    const timeout = setTimeout(() => {
      setStepIndex((current) => (current === null ? null : current + 1));
    }, STEP_DURATION_MS);

    return () => clearTimeout(timeout);
  }, [stepIndex, isOriented, router]);

  // Crossfade the displayed number: fade out, swap, then scale in with a
  // small overshoot. The very first number has nothing to fade from.
  useEffect(() => {
    if (stepIndex === displayIndex) return;

    if (displayIndex === null || stepIndex === null) {
      setDisplayIndex(stepIndex);
      return;
    }

    opacity.value = withTiming(0, { duration: 70 }, (finished) => {
      if (finished) runOnJS(setDisplayIndex)(stepIndex);
    });
  }, [stepIndex, displayIndex, opacity]);

  useEffect(() => {
    if (displayIndex === null) return;
    scale.value = 0.6;
    scale.value = withSequence(
      withTiming(1.12, { duration: 140 }),
      withTiming(1, { duration: 120 }),
    );
    opacity.value = withTiming(1, { duration: 150 });
  }, [displayIndex, scale, opacity]);

  const isCounting = stepIndex !== null && stepIndex < COUNTDOWN_STEPS.length;
  const isInterrupted = isCounting && !isOriented;

  return (
    <SafeAreaView className="flex-1 items-center justify-center bg-background px-10">
      <Pressable
        accessibilityRole="button"
        onPress={handleBack}
        className="absolute left-6 top-6 h-11 w-11 items-center justify-center rounded-full bg-surface"
      >
        <ChevronLeft size={22} color="#2B2118" />
      </Pressable>

      {isCounting && !isInterrupted && displayIndex !== null ? (
        <Animated.View style={animatedStyle}>
          <Text className="font-sans-bold text-8xl text-ink">{COUNTDOWN_STEPS[displayIndex]}</Text>
        </Animated.View>
      ) : isInterrupted ? (
        <Text className="text-center font-sans-bold text-4xl text-ink">
          Vuelve a colocar el teléfono sobre tu frente.
        </Text>
      ) : (
        <Animated.View entering={FadeIn.duration(220)} className="items-center gap-2">
          {currentCharacter ? (
            <Image
              source={currentCharacter.illustration}
              resizeMode="contain"
              style={{ width: 120, height: 120 }}
            />
          ) : null}
          <Text className="text-center font-sans text-base text-ink/60">Es el turno de</Text>
          <Text className="text-center font-sans-bold text-4xl text-ink">{currentPlayer?.name}</Text>
          <Text className="mt-3 text-center font-sans-bold text-lg text-ink/70">
            Coloca el teléfono sobre tu frente.
          </Text>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}
