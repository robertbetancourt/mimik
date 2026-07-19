import { useEffect } from "react";
import { Text } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";

import type { FeedbackType } from "./gameplayReducer";

interface FeedbackOverlayProps {
  feedback: FeedbackType | null;
}

function TickCircleIcon({ size = 64 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2C6.49 2 2 6.49 2 12C2 17.51 6.49 22 12 22C17.51 22 22 17.51 22 12C22 6.49 17.51 2 12 2ZM16.78 9.7L11.11 15.37C10.97 15.51 10.78 15.59 10.58 15.59C10.38 15.59 10.19 15.51 10.05 15.37L7.22 12.54C6.93 12.25 6.93 11.77 7.22 11.48C7.51 11.19 7.99 11.19 8.28 11.48L10.58 13.78L15.72 8.64C16.01 8.35 16.49 8.35 16.78 8.64C17.07 8.93 17.07 9.4 16.78 9.7Z"
        fill="white"
      />
    </Svg>
  );
}

function CloseCircleIcon({ size = 64 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2C6.49 2 2 6.49 2 12C2 17.51 6.49 22 12 22C17.51 22 22 17.51 22 12C22 6.49 17.51 2 12 2ZM15.36 14.3C15.65 14.59 15.65 15.07 15.36 15.36C15.21 15.51 15.02 15.58 14.83 15.58C14.64 15.58 14.45 15.51 14.3 15.36L12 13.06L9.7 15.36C9.55 15.51 9.36 15.58 9.17 15.58C8.98 15.58 8.79 15.51 8.64 15.36C8.35 15.07 8.35 14.59 8.64 14.3L10.94 12L8.64 9.7C8.35 9.41 8.35 8.93 8.64 8.64C8.93 8.35 9.41 8.35 9.7 8.64L12 10.94L14.3 8.64C14.59 8.35 15.07 8.35 15.36 8.64C15.65 8.93 15.65 9.41 15.36 9.7L13.06 12L15.36 14.3Z"
        fill="white"
      />
    </Svg>
  );
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
      contentScale.value = withSequence(
        withTiming(1.1, { duration: 140 }),
        withTiming(1, { duration: 110 }),
      );
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
