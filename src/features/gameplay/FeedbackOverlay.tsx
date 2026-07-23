import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Text } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from "react-native-reanimated";

import { CloseCircleIcon, TickCircleIcon } from "@/components/icons/FeedbackIcons";

import type { FeedbackType } from "./gameplayReducer";

interface FeedbackOverlayProps {
  feedback: FeedbackType | null;
}

const FEEDBACK_COLORS: Record<FeedbackType, { color: string; Icon: typeof TickCircleIcon }> = {
  correct: { color: "#3DBE6C", Icon: TickCircleIcon },
  pass: { color: "#E85C4A", Icon: CloseCircleIcon },
};

export function FeedbackOverlay({ feedback }: FeedbackOverlayProps) {
  const { t } = useTranslation();
  const opacity = useSharedValue(0);
  const contentScale = useSharedValue(0.6);

  useEffect(() => {
    if (feedback === "correct") {
      // A touch more energetic — a small celebratory pop.
      opacity.value = withTiming(1, { duration: 80 });
      contentScale.value = 0.6;
      contentScale.value = withSpring(1, { damping: 11, stiffness: 240 });
    } else if (feedback === "pass") {
      // Softer and calmer — this isn't an error, just "next word".
      opacity.value = withTiming(1, { duration: 100 });
      contentScale.value = 0.85;
      contentScale.value = withTiming(1, { duration: 180 });
    } else {
      opacity.value = withTiming(0, { duration: 120 });
    }
  }, [feedback, opacity, contentScale]);

  const backgroundStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  const contentStyle = useAnimatedStyle(() => ({ transform: [{ scale: contentScale.value }] }));

  if (!feedback) return null;

  const { color, Icon } = FEEDBACK_COLORS[feedback];
  const label = t(`feedback.${feedback}`);

  return (
    <Animated.View
      pointerEvents="none"
      style={[{ position: "absolute", inset: 0, backgroundColor: color }, backgroundStyle]}
      className="items-center justify-center"
    >
      <Animated.View style={contentStyle} className="items-center gap-3">
        <Icon size={72} />
        <Text className="font-sans-bold text-6xl text-white">{label}</Text>
      </Animated.View>
    </Animated.View>
  );
}
