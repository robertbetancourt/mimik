import { useEffect, useId } from "react";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import Svg, { Defs, RadialGradient, Rect, Stop } from "react-native-svg";

import { useSettingsStore } from "@/features/settings/settingsStore";

import { STAGE_BASE, STAGE_GOLD, STAGE_URGENT, type StageAccent } from "./palette";

interface StageBackgroundProps {
  accent: StageAccent;
  /** 0..1 — how much the lights heat up (streaks, celebration). */
  energy?: number;
  /** Last-10-seconds mode: a red vignette that beats once per `beatKey`. */
  urgent?: boolean;
  /** Changes once per second while urgent — each change is a heartbeat. */
  beatKey?: number;
  /** Golden word on screen: warm gold light in the center. */
  golden?: boolean;
  /**
   * 0..1 — turns the lights down. Screens where content (cards, lists)
   * should outshine the background use a high value; gameplay uses 0.
   */
  dim?: number;
}

/**
 * A soft radial light — the building block of the stage.
 *
 * Rendered at 1/RENDER_DOWNSCALE of its size and scaled up on the GPU: a
 * radial gradient has no detail to lose, and rasterizing a ~2500 px SVG on
 * every screen mount was the main cost of opening a stage screen.
 */
const RENDER_DOWNSCALE = 4;
function Glow({ color, size, opacity = 1 }: { color: string; size: number; opacity?: number }) {
  const id = useId().replace(/:/g, "");
  const small = size / RENDER_DOWNSCALE;
  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <View renderToHardwareTextureAndroid style={{ width: small, height: small, transform: [{ scale: RENDER_DOWNSCALE }] }}>
        <Svg width={small} height={small}>
          <Defs>
            <RadialGradient id={id} cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor={color} stopOpacity={0.9 * opacity} />
              <Stop offset="0.45" stopColor={color} stopOpacity={0.35 * opacity} />
              <Stop offset="1" stopColor={color} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Rect width={small} height={small} fill={`url(#${id})`} />
        </Svg>
      </View>
    </View>
  );
}

function Vignette({ color, width, height }: { color: string; width: number; height: number }) {
  const id = useId().replace(/:/g, "");
  return (
    <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
      <Defs>
        <RadialGradient id={id} cx="50%" cy="50%" rx="65%" ry="75%">
          <Stop offset="0.45" stopColor={color} stopOpacity={0} />
          <Stop offset="1" stopColor={color} stopOpacity={0.85} />
        </RadialGradient>
      </Defs>
      <Rect width={width} height={height} fill={`url(#${id})`} />
    </Svg>
  );
}

// Dark stage lit by two drifting colored lights in the category's accents.
// Everything here is decorative and sits behind the word — it can be as
// loud as it wants as long as the word on top stays white-on-dark legible.
export function StageBackground({ accent, energy = 0, urgent = false, beatKey = 0, golden = false, dim = 0 }: StageBackgroundProps) {
  const lightLevel = 1 - Math.min(Math.max(dim, 0), 1) * 0.7;
  const { width, height } = useWindowDimensions();
  const roadtripMode = useSettingsStore((s) => s.roadtripMode);
  const glowSize = Math.max(width, height) * 1.05;

  const driftA = useSharedValue(0);
  const driftB = useSharedValue(0);
  const energyValue = useSharedValue(energy);
  const urgentOpacity = useSharedValue(0);
  const goldOpacity = useSharedValue(0);

  useEffect(() => {
    if (roadtripMode) return;
    driftA.value = withRepeat(withTiming(1, { duration: 7000, easing: Easing.inOut(Easing.sin) }), -1, true);
    driftB.value = withRepeat(withTiming(1, { duration: 9000, easing: Easing.inOut(Easing.sin) }), -1, true);
    return () => {
      cancelAnimation(driftA);
      cancelAnimation(driftB);
    };
  }, [roadtripMode, driftA, driftB]);

  useEffect(() => {
    energyValue.value = withTiming(Math.min(Math.max(energy, 0), 1), { duration: 450 });
  }, [energy, energyValue]);

  useEffect(() => {
    goldOpacity.value = withTiming(golden ? 1 : 0, { duration: golden ? 260 : 180 });
  }, [golden, goldOpacity]);

  // Heartbeat: every second in the urgent zone the red vignette slams in and
  // decays — paired with the countdown tick sound.
  useEffect(() => {
    if (!urgent) {
      urgentOpacity.value = withTiming(0, { duration: 300 });
      return;
    }
    urgentOpacity.value = roadtripMode
      ? withTiming(0.6, { duration: 200 })
      : withSequence(withTiming(1, { duration: 90 }), withTiming(0.35, { duration: 800 }));
  }, [urgent, beatKey, roadtripMode, urgentOpacity]);

  const glowAStyle = useAnimatedStyle(() => ({
    opacity: (0.55 + energyValue.value * 0.45) * lightLevel,
    transform: [
      { translateX: -glowSize * 0.35 + driftA.value * width * 0.12 },
      { translateY: -glowSize * 0.45 + driftA.value * height * 0.1 },
      { scale: 1 + energyValue.value * 0.15 },
    ],
  }));
  const glowBStyle = useAnimatedStyle(() => ({
    opacity: (0.45 + energyValue.value * 0.5) * lightLevel,
    transform: [
      { translateX: width - glowSize * 0.6 - driftB.value * width * 0.14 },
      { translateY: height - glowSize * 0.55 - driftB.value * height * 0.12 },
      { scale: 1 + energyValue.value * 0.2 },
    ],
  }));
  const urgentStyle = useAnimatedStyle(() => ({ opacity: urgentOpacity.value }));
  const goldStyle = useAnimatedStyle(() => ({ opacity: goldOpacity.value }));

  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: STAGE_BASE, overflow: "hidden" }]}>
      <Animated.View style={[styles.glow, glowAStyle]}>
        <Glow color={accent.a} size={glowSize} />
      </Animated.View>
      <Animated.View style={[styles.glow, glowBStyle]}>
        <Glow color={accent.b} size={glowSize} />
      </Animated.View>

      {/* Golden word spotlight */}
      <Animated.View
        style={[
          styles.glow,
          { left: (width - glowSize * 0.8) / 2, top: (height - glowSize * 0.8) / 2 },
          goldStyle,
        ]}
      >
        <Glow color={STAGE_GOLD} size={glowSize * 0.8} opacity={0.7} />
      </Animated.View>

      {/* Darkens the middle a touch so the word always has contrast. */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: `rgba(11,9,18,${0.28 + Math.min(Math.max(dim, 0), 1) * 0.3})` }]} />

      <Animated.View style={[StyleSheet.absoluteFill, urgentStyle]}>
        <Vignette color={STAGE_URGENT} width={width} height={height} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  glow: { position: "absolute", left: 0, top: 0 },
});
