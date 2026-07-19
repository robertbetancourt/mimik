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

const TROPHY_DELAY = 150;
const PODIUM_DELAY = 450;
const THIRD_DELAY = 750;
const SECOND_DELAY = 900;
const WINNER_DELAY = 1050;

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
        runOnJS(onWinnerRevealed)();

        // Anticipation (tiny crouch) → jump (stretch) → soft landing (squash) → settle.
        winnerJumpY.value = withSequence(
          withTiming(5, { duration: 90 }),
          withTiming(-22, { duration: 170 }),
          withTiming(0, { duration: 180 }),
          withTiming(0, { duration: 140 }, (jumpFinished) => {
            if (jumpFinished) runOnJS(setEntranceDone)(true);
          }),
        );
        winnerSquashY.value = withSequence(
          withTiming(0.9, { duration: 90 }),
          withTiming(1.08, { duration: 170 }),
          withTiming(0.92, { duration: 130 }),
          withTiming(1, { duration: 190 }),
        );
        winnerSquashX.value = withSequence(
          withTiming(1.08, { duration: 90 }),
          withTiming(0.94, { duration: 170 }),
          withTiming(1.06, { duration: 130 }),
          withTiming(1, { duration: 190 }),
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

  return { entranceDone, screenStyle, trophyStyle, podiumStyle, thirdStyle, secondStyle, winnerStyle };
}
