import { useEffect, useRef, useState } from "react";
import { Image } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { type MimikExpression, mimikExpressions } from "@/features/mimik/expressions";
import { useSettingsStore } from "@/features/settings/settingsStore";

import type { FeedbackType } from "../gameplayReducer";

interface MimikReactorProps {
  size: number;
  feedback: FeedbackType | null;
  feedbackKey: number;
  golden: boolean;
  urgent: boolean;
  streak: number;
}

// How long a reaction stays before Mimik settles back to its resting mood.
const REACTION_HOLD_MS = 1100;

function restingExpression(urgent: boolean, streak: number): MimikExpression {
  if (urgent) return "evilSmile";
  if (streak >= 3) return "holdingLaughter";
  return "lookingAtYou";
}

// Mimik watches the turn from the corner of the stage — the silent
// spectator from the product brief. It never speaks; it only reacts.
export function MimikReactor({ size, feedback, feedbackKey, golden, urgent, streak }: MimikReactorProps) {
  const roadtripMode = useSettingsStore((s) => s.roadtripMode);
  const [reaction, setReaction] = useState<MimikExpression | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const bob = useSharedValue(0);
  const pop = useSharedValue(1);
  const hop = useSharedValue(0);
  const tilt = useSharedValue(0);

  useEffect(() => {
    if (roadtripMode) return;
    bob.value = withRepeat(
      withSequence(
        withTiming(-4, { duration: 1400, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 1400, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
    );
  }, [roadtripMode, bob]);

  useEffect(() => {
    if (!feedback || feedbackKey <= 0) return;
    const next: MimikExpression = feedback === "pass" ? "facepalm" : golden ? "love" : "celebration";
    setReaction(next);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setReaction(null), REACTION_HOLD_MS);

    if (!roadtripMode) {
      pop.value = 0.75;
      pop.value = withSpring(1, { damping: 8, stiffness: 260 });
      if (feedback === "correct") {
        hop.value = withSequence(withTiming(-size * 0.18, { duration: 160 }), withSpring(0, { damping: 9 }));
        tilt.value = withSequence(withTiming(-8, { duration: 120 }), withSpring(0, { damping: 7 }));
      } else {
        tilt.value = withSequence(withTiming(6, { duration: 120 }), withTiming(-4, { duration: 120 }), withSpring(0));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feedbackKey]);

  useEffect(() => () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  // Small pop when the resting mood changes (e.g. entering the urgent zone).
  const resting = restingExpression(urgent, streak);
  useEffect(() => {
    if (roadtripMode || reaction) return;
    pop.value = withSequence(withTiming(0.9, { duration: 90 }), withSpring(1, { damping: 9 }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resting]);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateY: bob.value + hop.value },
      { rotate: `${tilt.value}deg` },
      { scale: pop.value },
    ],
  }));

  const expression = reaction ?? resting;

  return (
    <Animated.View pointerEvents="none" style={style}>
      <Image source={mimikExpressions[expression]} resizeMode="contain" style={{ width: size, height: size }} />
    </Animated.View>
  );
}
