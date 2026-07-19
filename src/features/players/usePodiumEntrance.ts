import * as Haptics from "expo-haptics";
import { useEffect, useState } from "react";
import {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";

interface UsePodiumEntranceOptions {
  hasSecond: boolean;
  hasThird: boolean;
  onWinnerRevealed: () => void;
}

const SOFT_SPRING = { damping: 14, stiffness: 140 };
const STRONG_SPRING = { damping: 11, stiffness: 170 };

const TROPHY_DELAY = 120;
const PODIUM_DELAY = 380;
const THIRD_DELAY = 620;
const SECOND_DELAY = 760;
const WINNER_DELAY = 900;

// Scripted, one-shot entrance: fade → trophy drops → podium rises → 3rd →
// 2nd → winner (strongest entrance, then a single joyful jump). Everything
// is chained through animation completion callbacks rather than guessed
// setTimeouts, so the "entrance done" flag fires exactly when the winner's
// jump actually settles.
export function usePodiumEntrance({ hasSecond, hasThird, onWinnerRevealed }: UsePodiumEntranceOptions) {
  const [entranceDone, setEntranceDone] = useState(false);

  const screenOpacity = useSharedValue(0);
  const trophyY = useSharedValue(-80);
  const podiumY = useSharedValue(60);
  const podiumOpacity = useSharedValue(0);
  const thirdScale = useSharedValue(0);
  const secondScale = useSharedValue(0);
  const winnerScale = useSharedValue(0);
  const winnerJumpY = useSharedValue(0);
  const winnerSquashX = useSharedValue(1);
  const winnerSquashY = useSharedValue(1);
  const buttonOpacity = useSharedValue(0);
  const buttonY = useSharedValue(10);

  useEffect(() => {
    screenOpacity.value = withTiming(1, { duration: 300 });
    trophyY.value = withDelay(TROPHY_DELAY, withSpring(0, SOFT_SPRING));

    podiumOpacity.value = withDelay(PODIUM_DELAY, withTiming(1, { duration: 250 }));
    podiumY.value = withDelay(PODIUM_DELAY, withSpring(0, SOFT_SPRING));

    if (hasThird) {
      thirdScale.value = withDelay(THIRD_DELAY, withSpring(1, SOFT_SPRING));
    }
    if (hasSecond) {
      secondScale.value = withDelay(SECOND_DELAY, withSpring(1, SOFT_SPRING));
    }

    winnerScale.value = withDelay(
      WINNER_DELAY,
      withSpring(1, STRONG_SPRING, (finished) => {
        if (!finished) return;

        // Sync point: anticipation (crouch) → jump → landing squash → settle.
        // onWinnerRevealed (celebration sound) fires at the landing squash,
        // not the crouch — it should land with the impact, not the windup.
        winnerJumpY.value = withSequence(
          withTiming(4, { duration: 80 }),
          withTiming(-18, { duration: 150 }),
          withTiming(0, { duration: 160 }, (jumpFinished) => {
            if (!jumpFinished) return;
            runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Heavy);
            runOnJS(onWinnerRevealed)();
          }),
          withTiming(0, { duration: 120 }, (settleFinished) => {
            if (!settleFinished) return;
            runOnJS(setEntranceDone)(true);
            // Sync point: CTA only appears once the celebration is over —
            // small fade + lift, no pulsing.
            buttonOpacity.value = withTiming(1, { duration: 260 });
            buttonY.value = withTiming(0, { duration: 260 });
          }),
        );
        winnerSquashY.value = withSequence(
          withTiming(0.94, { duration: 80 }),
          withTiming(1.05, { duration: 150 }),
          withTiming(0.96, { duration: 110 }),
          withTiming(1, { duration: 150 }),
        );
        winnerSquashX.value = withSequence(
          withTiming(1.04, { duration: 80 }),
          withTiming(0.97, { duration: 150 }),
          withTiming(1.03, { duration: 110 }),
          withTiming(1, { duration: 150 }),
        );
      }),
    );
    // Entrance is scripted to run exactly once per mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const screenStyle = useAnimatedStyle(() => ({ opacity: screenOpacity.value }));
  const trophyStyle = useAnimatedStyle(() => ({ transform: [{ translateY: trophyY.value }] }));
  const podiumStyle = useAnimatedStyle(() => ({
    opacity: podiumOpacity.value,
    transform: [{ translateY: podiumY.value }],
  }));
  const thirdStyle = useAnimatedStyle(() => ({
    opacity: thirdScale.value,
    transform: [{ scale: thirdScale.value }],
  }));
  const secondStyle = useAnimatedStyle(() => ({
    opacity: secondScale.value,
    transform: [{ scale: secondScale.value }],
  }));
  const winnerStyle = useAnimatedStyle(() => ({
    opacity: winnerScale.value,
    transform: [
      { scale: winnerScale.value },
      { translateY: winnerJumpY.value },
      { scaleX: winnerSquashX.value },
      { scaleY: winnerSquashY.value },
    ],
  }));

  const buttonStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
    transform: [{ translateY: buttonY.value }],
  }));

  return {
    entranceDone,
    screenStyle,
    trophyStyle,
    podiumStyle,
    thirdStyle,
    secondStyle,
    winnerStyle,
    buttonStyle,
  };
}
