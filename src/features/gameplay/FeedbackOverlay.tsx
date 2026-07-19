import { useEffect } from "react";
import { Text } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from "react-native-reanimated";

import { CloseCircleIcon, TickCircleIcon } from "@/components/icons/FeedbackIcons";

import type { FeedbackType } from "./gameplayReducer";

interface FeedbackOverlayProps {
  feedback: FeedbackType | null;
}

const FEEDBACK_CONTENT: Record<FeedbackType, { label: string; color: string; Icon: typeof TickCircleIcon }> = {
  correct: { label: "¡Correcto!", color: "#3DBE6C", Icon: TickCircleIcon },
  pass: { label: "Pasar", color: "#E85C4A", Icon: CloseCircleIcon },
};

export function FeedbackOverlay({ feedback }: FeedbackOverlayProps) {
  const opacity = useSharedValue(0);
  const contentScale = useSharedValue(0.6);

  useEffect(() => {
    if (feedback) {
      opacity.value = withTiming(1, { duration: 80 });
      contentScale.value = 0.6;
      contentScale.value = withSpring(1, { damping: 12, stiffness: 220 });
    } else {
      opacity.value = withTiming(0, { duration: 120 });
    }
  }, [feedback, opacity, contentScale]);

  const backgroundStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  const contentStyle = useAnimatedStyle(() => ({ transform: [{ scale: contentScale.value }] }));

  if (!feedback) return null;

  const { label, color, Icon } = FEEDBACK_CONTENT[feedback];

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
