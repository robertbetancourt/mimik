import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import * as ScreenOrientation from "expo-screen-orientation";
import { StatusBar } from "expo-status-bar";
import { ChevronLeft } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { BackHandler, Image, Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import Animated, {
  Easing,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useForeheadOrientation } from "@/features/gameplay/useForeheadOrientation";
import { getStageAccent } from "@/features/gameplay/stage/palette";
import { StageBackground } from "@/features/gameplay/stage/StageBackground";
import { useMatchStore } from "@/features/match/store";
import { getCharacterById } from "@/features/players/characters";
import { useSettingsStore } from "@/features/settings/settingsStore";
import { useLockOrientation } from "@/lib/useLockOrientation";

// Only the final "Go!" step needs translation — digits read the same in
// every supported language, so the array itself stays static and the
// translated label is swapped in at render time.
const COUNTDOWN_STEPS = ["3", "2", "1", "go"];
const STEP_DURATION_MS = 700;
const FINAL_STEP_INDEX = COUNTDOWN_STEPS.length - 1;

/** A ring of light that bursts outward on every count. */
function Shockwave({ trigger, color, size }: { trigger: number; color: string; size: number }) {
  const progress = useSharedValue(1);
  useEffect(() => {
    progress.value = 0;
    progress.value = withTiming(1, { duration: 650, easing: Easing.out(Easing.cubic) });
  }, [trigger, progress]);
  const style = useAnimatedStyle(() => ({
    opacity: 1 - progress.value,
    transform: [{ scale: 0.3 + progress.value * 1.6 }],
  }));
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        { position: "absolute", width: size, height: size, borderRadius: size / 2, borderWidth: 10, borderColor: color },
        style,
      ]}
    />
  );
}

export default function Countdown() {
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const isOrientedBySensor = useForeheadOrientation();
  const touchControls = useSettingsStore((s) => s.touchControls);
  const roadtripMode = useSettingsStore((s) => s.roadtripMode);
  const selectedCategoryId = useMatchStore((state) => state.selectedCategoryId);
  const players = useMatchStore((state) => state.players);
  const currentPlayerIndex = useMatchStore((state) => state.currentPlayerIndex);
  const currentPlayer = players[currentPlayerIndex];
  const currentCharacter = currentPlayer ? getCharacterById(currentPlayer.characterId) : undefined;
  const accent = getStageAccent(selectedCategoryId);

  useLockOrientation(ScreenOrientation.OrientationLock.LANDSCAPE);

  // With touch controls the player can start with a tap instead of waiting
  // for the sensor to detect the forehead position.
  const [tappedToStart, setTappedToStart] = useState(false);
  const isOriented = isOrientedBySensor || tappedToStart;

  // null = waiting for the correct position, otherwise index into COUNTDOWN_STEPS.
  const [stepIndex, setStepIndex] = useState<number | null>(null);

  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  // Breathing while waiting for the player to get in position.
  const breathe = useSharedValue(1);
  useEffect(() => {
    if (roadtripMode) return;
    breathe.value = withRepeat(
      withSequence(
        withTiming(1.04, { duration: 1400, easing: Easing.inOut(Easing.sin) }),
        withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
    );
  }, [breathe, roadtripMode]);
  const breatheStyle = useAnimatedStyle(() => ({ transform: [{ scale: breathe.value }] }));

  const handleBack = useCallback(() => {
    Haptics.selectionAsync();
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

    const isFinalStep = stepIndex === FINAL_STEP_INDEX;
    Haptics.impactAsync(isFinalStep ? Haptics.ImpactFeedbackStyle.Heavy : Haptics.ImpactFeedbackStyle.Medium);

    // Each number slams in big and settles — GO gets a stronger overshoot.
    if (roadtripMode) {
      scale.value = 1;
      opacity.value = withTiming(1, { duration: 120 });
    } else {
      scale.value = isFinalStep ? 2.2 : 1.9;
      opacity.value = 0;
      scale.value = withSpring(1, isFinalStep ? { damping: 8, stiffness: 240 } : { damping: 13, stiffness: 300 });
      opacity.value = withTiming(1, { duration: 90 });
    }

    const timeout = setTimeout(() => {
      setStepIndex((current) => (current === null ? null : current + 1));
    }, STEP_DURATION_MS);

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepIndex, isOriented, router]);

  const isCounting = stepIndex !== null && stepIndex < COUNTDOWN_STEPS.length;
  const isInterrupted = isCounting && !isOriented;
  const isFinalDisplay = stepIndex === FINAL_STEP_INDEX;
  const numberColor = isFinalDisplay ? accent.a : "#FFFFFF";

  return (
    <View style={{ flex: 1 }}>
      <StatusBar hidden />
      <StageBackground accent={accent} energy={isCounting ? 0.3 + (stepIndex ?? 0) * 0.2 : 0} />

      <View style={[StyleSheet.absoluteFill, styles.center]}>
        {isCounting && !isInterrupted && stepIndex !== null ? (
          <>
            {!roadtripMode ? <Shockwave trigger={stepIndex} color={stepIndex % 2 ? accent.b : accent.a} size={height * 0.8} /> : null}
            <Animated.View style={animatedStyle}>
              <Text
                style={[
                  styles.number,
                  {
                    color: numberColor,
                    fontSize: isFinalDisplay ? height * 0.42 : height * 0.62,
                    lineHeight: isFinalDisplay ? height * 0.48 : height * 0.68,
                  },
                ]}
              >
                {isFinalDisplay ? t("countdown.go") : COUNTDOWN_STEPS[stepIndex]}
              </Text>
            </Animated.View>
          </>
        ) : isInterrupted ? (
          <Animated.Text entering={FadeIn.duration(200)} className="px-16 text-center font-sans-bold text-4xl text-white">
            {t("countdown.reposition")}
          </Animated.Text>
        ) : (
          <View className="flex-row items-center gap-8 px-16">
            {currentCharacter ? (
              <Animated.View entering={FadeIn.duration(220)} style={breatheStyle}>
                <View style={[styles.avatarHalo, { borderColor: accent.a, width: height * 0.42, height: height * 0.42 }]}>
                  <Image
                    source={currentCharacter.illustration}
                    resizeMode="contain"
                    style={{ width: height * 0.32, height: height * 0.32 }}
                  />
                </View>
              </Animated.View>
            ) : null}
            <View className="shrink">
              <Animated.Text entering={FadeIn.delay(60).duration(220)} className="font-sans-bold text-sm uppercase tracking-widest text-white/50">
                {t("countdown.turnOf")}
              </Animated.Text>
              <Animated.Text
                entering={FadeIn.delay(120).duration(260)}
                numberOfLines={1}
                adjustsFontSizeToFit
                style={styles.playerName}
              >
                {currentPlayer?.name}
              </Animated.Text>
              <Animated.Text entering={FadeIn.delay(220).duration(260)} className="mt-2 font-sans-bold text-lg text-white/70">
                {touchControls ? t("countdown.tapToStart") : t("countdown.placePhone")}
              </Animated.Text>
            </View>
          </View>
        )}
      </View>

      {/* Tap anywhere to start (touch controls only) */}
      {touchControls && stepIndex === null ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("countdown.tapToStart")}
          onPress={() => setTappedToStart(true)}
          style={StyleSheet.absoluteFill}
        />
      ) : null}

      <Pressable
        accessibilityRole="button"
        onPress={handleBack}
        style={{ position: "absolute", left: Math.max(insets.left, 16) + 8, top: Math.max(insets.top, 12) + 8 }}
        className="h-11 w-11 items-center justify-center rounded-full bg-white/10"
      >
        <ChevronLeft size={22} color="#FFFFFF" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: "center", justifyContent: "center" },
  number: {
    fontFamily: "Urbanist_700Bold",
    letterSpacing: -4,
    textAlign: "center",
    includeFontPadding: false,
  },
  avatarHalo: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    borderWidth: 3,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  playerName: {
    fontFamily: "Urbanist_700Bold",
    fontSize: 64,
    color: "#FFFFFF",
    letterSpacing: -1.5,
    includeFontPadding: false,
  },
});
