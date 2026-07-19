import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  primaryLabel: string;
  onPrimary: () => void;
  secondaryLabel: string;
  onSecondary: () => void;
  /** Tapping the backdrop is always the safe, non-destructive action. */
  onBackdropPress: () => void;
  /** Highlights the primary button in red for destructive confirmations. */
  destructivePrimary?: boolean;
}

const TIMING = { duration: 180, easing: Easing.out(Easing.cubic) };

export function ConfirmDialog({
  visible,
  title,
  message,
  primaryLabel,
  onPrimary,
  secondaryLabel,
  onSecondary,
  onBackdropPress,
  destructivePrimary,
}: ConfirmDialogProps) {
  const progress = useSharedValue(0);
  const [shouldRender, setShouldRender] = useState(visible);

  useEffect(() => {
    if (visible) {
      setShouldRender(true);
      progress.value = withTiming(1, TIMING);
    } else {
      progress.value = withTiming(0, TIMING, (finished) => {
        if (finished) runOnJS(setShouldRender)(false);
      });
    }
  }, [visible, progress]);

  const backdropStyle = useAnimatedStyle(() => ({ opacity: progress.value * 0.55 }));
  const cardStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scale: 0.92 + progress.value * 0.08 }],
  }));

  if (!shouldRender) return null;

  return (
    <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }} className="items-center justify-center">
      <Animated.View
        style={[{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "black" }, backdropStyle]}
      >
        <Pressable style={{ flex: 1 }} onPress={onBackdropPress} />
      </Animated.View>

      <Animated.View style={cardStyle} className="w-[80%] max-w-sm rounded-3xl bg-background p-5">
        <Text className="text-center font-sans-bold text-xl text-ink">{title}</Text>
        <Text className="mt-2 text-center font-sans text-base text-ink/70">{message}</Text>

        <Pressable
          accessibilityRole="button"
          onPress={onPrimary}
          className={`mt-5 items-center rounded-full py-3.5 ${destructivePrimary ? "bg-error" : "bg-primary"}`}
        >
          <Text className="font-sans-bold text-base text-white">{primaryLabel}</Text>
        </Pressable>

        <Pressable accessibilityRole="button" onPress={onSecondary} className="mt-2 items-center py-3">
          <Text className="font-sans-bold text-base text-ink/60">{secondaryLabel}</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}
