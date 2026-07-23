import { BlurView } from "expo-blur";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, useWindowDimensions, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { overlayShadow } from "@/theme/shadow";

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** Rendered below the scrollable area, always visible without scrolling. */
  footer?: React.ReactNode;
  /** Fraction of screen height the sheet covers. Defaults to the standard 0.72. */
  heightRatio?: number;
}

// Smooth native-style slide, no bounce.
const OPEN_TIMING = { duration: 280, easing: Easing.out(Easing.cubic) };
const CLOSE_TIMING = { duration: 220, easing: Easing.in(Easing.cubic) };
const SCRIM_OPACITY = 0.4;
const DEFAULT_HEIGHT_RATIO = 0.72;
// The handle is the only draggable area, so closing takes a short, precise
// flick instead of a long drag across the whole card.
const DISMISS_DISTANCE = 45;
const DISMISS_VELOCITY = 600;

export function BottomSheet({
  visible,
  onClose,
  children,
  footer,
  heightRatio = DEFAULT_HEIGHT_RATIO,
}: BottomSheetProps) {
  const { height: screenHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const sheetHeight = screenHeight * heightRatio;
  const translateY = useSharedValue(screenHeight);
  const backdropProgress = useSharedValue(0);
  const animatedHeight = useSharedValue(sheetHeight);
  const [shouldRender, setShouldRender] = useState(visible);

  useEffect(() => {
    if (visible) {
      setShouldRender(true);
      translateY.value = withTiming(0, OPEN_TIMING);
      backdropProgress.value = withTiming(1, OPEN_TIMING);
    } else {
      translateY.value = withTiming(sheetHeight, CLOSE_TIMING);
      backdropProgress.value = withTiming(0, CLOSE_TIMING, (finished) => {
        if (finished) runOnJS(setShouldRender)(false);
      });
    }
  }, [visible, sheetHeight, translateY, backdropProgress]);

  // Lets callers resize the sheet to fit shorter/taller content (e.g. a
  // multi-page onboarding) without a jump cut — height eases the same way
  // the sheet itself slides in.
  useEffect(() => {
    animatedHeight.value = withTiming(sheetHeight, OPEN_TIMING);
  }, [sheetHeight, animatedHeight]);

  const pan = Gesture.Pan()
    .onUpdate((event) => {
      if (event.translationY > 0) translateY.value = event.translationY;
    })
    .onEnd((event) => {
      if (event.translationY > DISMISS_DISTANCE || event.velocityY > DISMISS_VELOCITY) {
        translateY.value = withTiming(sheetHeight, CLOSE_TIMING);
        runOnJS(onClose)();
      } else {
        translateY.value = withTiming(0, OPEN_TIMING);
      }
    });

  const sheetStyle = useAnimatedStyle(() => ({
    height: animatedHeight.value,
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropProgress.value * SCRIM_OPACITY,
  }));
  const blurStyle = useAnimatedStyle(() => ({ opacity: backdropProgress.value }));

  if (!shouldRender) return null;

  return (
    <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}>
      <Animated.View
        style={[{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }, blurStyle]}
      >
        <BlurView intensity={25} tint="dark" style={{ flex: 1 }} />
      </Animated.View>

      {/* Dark scrim on top of the blur — never a solid opaque background. */}
      <Animated.View
        style={[
          { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "black" },
          backdropStyle,
        ]}
      >
        <Pressable style={{ flex: 1 }} onPress={onClose} />
      </Animated.View>

      <Animated.View
        style={[{ position: "absolute", left: 0, right: 0, bottom: 0 }, sheetStyle, overlayShadow]}
      >
        {/* Shadows don't render through overflow: hidden, so clipping lives
            on this inner wrapper instead of the shadow-casting one above. */}
        <View className="flex-1 overflow-hidden rounded-t-3xl bg-background">
          {/* Only the handle is draggable, so the content below can scroll
              freely without fighting the dismiss gesture. */}
          <GestureDetector gesture={pan}>
            <View className="items-center py-3">
              <View className="h-1.5 w-10 rounded-full bg-ink/15" />
            </View>
          </GestureDetector>

          <ScrollView
            className="flex-1 px-5"
            contentContainerStyle={{ paddingBottom: footer ? 12 : insets.bottom + 24 }}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled
          >
            {children}
          </ScrollView>

          {footer ? (
            <View
              className="border-t border-ink/5 px-5 pt-3"
              style={{ paddingBottom: insets.bottom + 16 }}
            >
              {footer}
            </View>
          ) : null}
        </View>
      </Animated.View>
    </View>
  );
}
