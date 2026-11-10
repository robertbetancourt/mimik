import { useEffect } from "react";
import { StyleSheet, useWindowDimensions } from "react-native";
import Animated, {
  interpolateColor,
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import Svg, { Rect } from "react-native-svg";

import { STAGE_URGENT } from "./palette";

const AnimatedRect = Animated.createAnimatedComponent(Rect);

interface StageTimerFrameProps {
  timeRemaining: number;
  totalSeconds: number;
  color: string;
  urgent: boolean;
  /** Distance from the screen edge (safe-area aware). */
  inset: number;
}

const STROKE = 5;
const RADIUS = 26;

// The whole screen is the timer: a lit frame around the stage that burns
// down as the turn runs out. Readable from across the room, unlike a small
// bar, and it never competes with the word for the center.
export function StageTimerFrame({ timeRemaining, totalSeconds, color, urgent, inset }: StageTimerFrameProps) {
  const { width, height } = useWindowDimensions();
  const w = width - inset * 2;
  const h = height - inset * 2;
  // Perimeter of a rounded rectangle.
  const perimeter = 2 * (w + h) - (8 - 2 * Math.PI) * RADIUS;

  // Survival / time bonus can push the remaining time above the starting
  // value — the frame simply stays full in that case.
  const progress = useSharedValue(1);
  const urgentMix = useSharedValue(0);

  useEffect(() => {
    const target = totalSeconds > 0 ? Math.min(timeRemaining / totalSeconds, 1) : 0;
    progress.value = withTiming(target, { duration: 950 });
  }, [timeRemaining, totalSeconds, progress]);

  useEffect(() => {
    urgentMix.value = withTiming(urgent ? 1 : 0, { duration: 300 });
  }, [urgent, urgentMix]);

  const fillProps = useAnimatedProps(() => ({
    strokeDashoffset: perimeter * (1 - Math.max(progress.value, 0)),
    stroke: interpolateColor(urgentMix.value, [0, 1], [color, STAGE_URGENT]),
  }));
  const glowProps = useAnimatedProps(() => ({
    strokeDashoffset: perimeter * (1 - Math.max(progress.value, 0)),
    stroke: interpolateColor(urgentMix.value, [0, 1], [color, STAGE_URGENT]),
    strokeOpacity: 0.22 + urgentMix.value * 0.2,
  }));

  return (
    <Svg pointerEvents="none" width={width} height={height} style={StyleSheet.absoluteFill}>
      <Rect
        x={inset}
        y={inset}
        width={w}
        height={h}
        rx={RADIUS}
        fill="none"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth={STROKE}
      />
      {/* Wide soft pass = glow; thin pass on top = the hot filament. */}
      <AnimatedRect
        x={inset}
        y={inset}
        width={w}
        height={h}
        rx={RADIUS}
        fill="none"
        strokeWidth={STROKE * 4}
        strokeLinecap="round"
        strokeDasharray={[perimeter, perimeter]}
        animatedProps={glowProps}
      />
      <AnimatedRect
        x={inset}
        y={inset}
        width={w}
        height={h}
        rx={RADIUS}
        fill="none"
        strokeWidth={STROKE}
        strokeLinecap="round"
        strokeDasharray={[perimeter, perimeter]}
        animatedProps={fillProps}
      />
    </Svg>
  );
}
