import { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, useWindowDimensions, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { CloseCircleIcon, TickCircleIcon } from "@/components/icons/FeedbackIcons";
import { useSettingsStore } from "@/features/settings/settingsStore";

import type { FeedbackType } from "../gameplayReducer";
import { STAGE_CORRECT, STAGE_GOLD, STAGE_PASS } from "./palette";

interface StageFeedbackProps {
  feedback: FeedbackType | null;
  /** The answered word was golden → double-points celebration. */
  golden: boolean;
  /** Increments on every answer so identical consecutive answers replay. */
  feedbackKey: number;
}

const PARTICLE_COUNT = 18;

function Particle({ index, color, trigger, radius }: { index: number; color: string; trigger: number; radius: number }) {
  const progress = useSharedValue(0);
  // Deterministic spread so every burst looks designed, not noisy.
  const angle = (index / PARTICLE_COUNT) * Math.PI * 2 + (index % 2 ? 0.12 : -0.08);
  const distance = radius * (0.65 + ((index * 7) % 5) * 0.09);
  const size = 6 + ((index * 3) % 4) * 3;

  useEffect(() => {
    if (trigger <= 0) return;
    progress.value = 0;
    progress.value = withTiming(1, { duration: 520, easing: Easing.out(Easing.cubic) });
  }, [trigger, progress]);

  const style = useAnimatedStyle(() => ({
    opacity: progress.value === 0 ? 0 : 1 - progress.value,
    transform: [
      { translateX: Math.cos(angle) * distance * progress.value },
      { translateY: Math.sin(angle) * distance * progress.value },
      { scale: 1 - progress.value * 0.5 },
      { rotate: `${progress.value * 180}deg` },
    ],
  }));

  return (
    <Animated.View
      style={[
        { position: "absolute", width: size, height: size, borderRadius: index % 3 === 0 ? 2 : size / 2, backgroundColor: color },
        style,
      ]}
    />
  );
}

// The answer moment: a shockwave of color wipes the stage from the
// direction of the tilt (correct → from the top, pass → from the bottom),
// a stamp slams in, and correct answers burst into particles.
export function StageFeedback({ feedback, golden, feedbackKey }: StageFeedbackProps) {
  const { t } = useTranslation();
  const { width, height } = useWindowDimensions();
  const roadtripMode = useSettingsStore((s) => s.roadtripMode);
  const diagonal = Math.sqrt(width * width + height * height);

  const wipeScale = useSharedValue(0);
  const wipeOpacity = useSharedValue(0);
  const stampScale = useSharedValue(0);
  const stampOpacity = useSharedValue(0);

  useEffect(() => {
    if (!feedback) return;
    if (roadtripMode) {
      wipeScale.value = 1;
      wipeOpacity.value = withSequence(withTiming(0.85, { duration: 60 }), withDelay(200, withTiming(0, { duration: 140 })));
      stampScale.value = 1;
      stampOpacity.value = withSequence(withTiming(1, { duration: 60 }), withDelay(220, withTiming(0, { duration: 120 })));
      return;
    }
    wipeScale.value = 0;
    wipeOpacity.value = 0.92;
    wipeScale.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.cubic) });
    wipeOpacity.value = withDelay(150, withTiming(0, { duration: 260 }));

    stampOpacity.value = 1;
    stampScale.value = feedback === "correct" ? 1.8 : 1.3;
    stampScale.value = withSpring(1, { damping: 10, stiffness: 320 });
    stampOpacity.value = withDelay(260, withTiming(0, { duration: 140 }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feedbackKey]);

  const fromTop = feedback !== "pass";
  const wipeColor = feedback === "pass" ? STAGE_PASS : golden ? STAGE_GOLD : STAGE_CORRECT;

  const wipeStyle = useAnimatedStyle(() => ({
    opacity: wipeOpacity.value,
    transform: [{ scale: wipeScale.value }],
  }));
  const stampStyle = useAnimatedStyle(() => ({
    opacity: stampOpacity.value,
    transform: [{ scale: stampScale.value }, { rotate: fromTop ? "-6deg" : "4deg" }],
  }));

  const particleColors = useMemo(
    () => (golden ? [STAGE_GOLD, "#FFF3B0", "#F59E0B"] : [STAGE_CORRECT, "#BBF7D0", "#FFFFFF", STAGE_GOLD]),
    [golden],
  );

  if (!feedback) return null;

  const Icon = feedback === "correct" ? TickCircleIcon : CloseCircleIcon;
  const label =
    feedback === "correct" && golden ? t("gameplay.goldenStamp") : t(`feedback.${feedback}`);

  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { alignItems: "center", justifyContent: "center" }]}>
      <Animated.View
        style={[
          {
            position: "absolute",
            width: diagonal * 2,
            height: diagonal * 2,
            borderRadius: diagonal,
            left: width / 2 - diagonal,
            top: fromTop ? -diagonal : height - diagonal,
            backgroundColor: wipeColor,
          },
          wipeStyle,
        ]}
      />

      {feedback === "correct" && !roadtripMode
        ? Array.from({ length: PARTICLE_COUNT }, (_, i) => (
            <Particle
              key={i}
              index={i}
              color={particleColors[i % particleColors.length]}
              trigger={feedbackKey}
              radius={Math.min(width, height) * 0.62}
            />
          ))
        : null}

      <Animated.View style={[styles.stamp, stampStyle]}>
        <Icon size={64} />
        <Text style={styles.stampText}>{label}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  stamp: { alignItems: "center", gap: 6 },
  stampText: {
    fontFamily: "Urbanist_700Bold",
    fontSize: 64,
    color: "#FFFFFF",
    letterSpacing: -1,
    includeFontPadding: false,
    textShadowColor: "rgba(0,0,0,0.25)",
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 12,
  },
});
