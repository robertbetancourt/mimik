import { useEffect, useRef } from "react";
import { Text } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { useSettingsStore } from "@/features/settings/settingsStore";

interface WordCardProps {
  word: string;
  /** Feedback from the last gesture — drives the exit animation direction and color. */
  feedback: "correct" | "pass" | null;
}

function getFontSize(word: string): number {
  if (word.length <= 6) return 128;
  if (word.length <= 10) return 100;
  if (word.length <= 14) return 78;
  return 58;
}

// ── Spring config for the entrance ── more overshoot than the original
// withTiming so the word "pops" into place — feels alive, not mechanical.
const ENTRANCE_SPRING = { damping: 10, stiffness: 200 };

// ── Feedback colors ──────────────────────────────────────────────────────────
const COLOR_DEFAULT = "white";
const COLOR_CORRECT = "#4ADE80"; // green-400
const COLOR_PASS = "#FB923C";   // orange-400

export function WordCard({ word, feedback }: WordCardProps) {
  const roadtripMode = useSettingsStore((s) => s.roadtripMode);

  const translateY = useSharedValue(10);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.94);
  const color = useSharedValue(COLOR_DEFAULT);

  // Track the previous word so we can detect a real word change vs a
  // feedback color change happening on the same word.
  const prevWordRef = useRef<string | null>(null);

  // ── Entrance: plays every time the word changes ───────────────────────────
  useEffect(() => {
    if (prevWordRef.current === word) return;
    prevWordRef.current = word;

    // Reset color to white for the new word
    color.value = COLOR_DEFAULT;

    if (roadtripMode) {
      // Roadtrip: simple fade, no spring — saves GPU work for long sessions
      translateY.value = 0;
      opacity.value = withTiming(1, { duration: 180 });
      scale.value = 1;
    } else {
      // Full kinetic entrance: slide up + spring overshoot
      translateY.value = 10;
      opacity.value = 0;
      scale.value = 0.94;

      translateY.value = withSpring(0, ENTRANCE_SPRING);
      opacity.value = withTiming(1, { duration: 200 });
      scale.value = withSpring(1, ENTRANCE_SPRING);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [word]);

  // ── Feedback: animate out in the direction of the gesture ─────────────────
  useEffect(() => {
    if (!feedback) return;
    if (roadtripMode) {
      // Roadtrip: just tint the color, no motion
      color.value = feedback === "correct" ? COLOR_CORRECT : COLOR_PASS;
      return;
    }

    if (feedback === "correct") {
      // Fly up + turn green
      color.value = COLOR_CORRECT;
      translateY.value = withTiming(-48, { duration: 220 });
      opacity.value = withTiming(0, { duration: 220 });
    } else {
      // Drop down + turn orange
      color.value = COLOR_PASS;
      translateY.value = withTiming(48, { duration: 200 });
      opacity.value = withTiming(0, { duration: 200 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feedback]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
  }));

  const textStyle = useAnimatedStyle(() => ({
    color: color.value,
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Animated.Text
        style={[
          {
            fontFamily: "Urbanist_700Bold",
            fontSize: getFontSize(word),
            textAlign: "center",
          },
          textStyle,
        ]}
        numberOfLines={2}
        adjustsFontSizeToFit
      >
        {word}
      </Animated.Text>
    </Animated.View>
  );
}
