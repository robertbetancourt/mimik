import { useEffect, useMemo, useState } from "react";
import { type LayoutChangeEvent, StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  interpolateColor,
  Keyframe,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { useSettingsStore } from "@/features/settings/settingsStore";

import { STAGE_CORRECT, STAGE_GOLD, STAGE_INK, STAGE_PASS } from "./palette";

interface KineticWordProps {
  word: string;
  feedback: "correct" | "pass" | null;
  golden: boolean;
  /** Box the word must fit in — already excludes the HUD margins. */
  maxWidth: number;
  maxHeight: number;
  /** Changes once per second in the final 3 seconds → small shake. */
  shakeKey?: number;
}

// Urbanist Bold, uppercase: average advance ≈ 0.68em. Used only for the
// first guess at a font size; the real layout is measured afterwards and
// scaled down if it still overflows (see `fitScale`).
const CHAR_WIDTH_EM = 0.68;
const SPACE_EM = 0.28;
const LINE_HEIGHT_EM = 1.02;
const MAX_LINES = 3;
const MIN_FONT_SIZE = 34;

function splitLines(words: string[], fontSize: number, maxWidth: number): string[][] | null {
  const lines: string[][] = [];
  let current: string[] = [];
  let currentWidth = 0;
  for (const w of words) {
    const wordWidth = Array.from(w).length * CHAR_WIDTH_EM * fontSize;
    if (wordWidth > maxWidth) return null;
    const extra = current.length > 0 ? SPACE_EM * fontSize + wordWidth : wordWidth;
    if (currentWidth + extra > maxWidth && current.length > 0) {
      lines.push(current);
      current = [w];
      currentWidth = wordWidth;
    } else {
      current.push(w);
      currentWidth += extra;
    }
  }
  if (current.length > 0) lines.push(current);
  return lines;
}

/** Largest font size whose greedy line-break fits the box. */
function layoutWord(text: string, maxWidth: number, maxHeight: number) {
  const words = text.split(/\s+/).filter(Boolean);
  const start = Math.floor(maxHeight * 0.62);
  for (let size = start; size >= MIN_FONT_SIZE; size -= 2) {
    const lines = splitLines(words, size, maxWidth);
    if (!lines || lines.length > MAX_LINES) continue;
    if (lines.length * size * LINE_HEIGHT_EM <= maxHeight) return { fontSize: size, lines };
  }
  return { fontSize: MIN_FONT_SIZE, lines: splitLines(words, MIN_FONT_SIZE, Number.MAX_VALUE) ?? [words] };
}

function Letter({
  char,
  index,
  fontSize,
  colorMix,
  baseColor,
  feedbackColor,
  animate,
}: {
  char: string;
  index: number;
  fontSize: number;
  colorMix: SharedValue<number>;
  baseColor: string;
  feedbackColor: string;
  animate: boolean;
}) {
  // Each letter springs up from below with its own small tilt — a "slot
  // machine" cascade that reads as one confident gesture, not 12 random pops.
  const tilt = ((index * 37) % 17) - 8;
  const entering = useMemo(
    () =>
      new Keyframe({
        0: { opacity: 0, transform: [{ translateY: fontSize * 0.55 }, { scale: 0.35 }, { rotate: `${tilt}deg` }] },
        55: {
          opacity: 1,
          transform: [{ translateY: -fontSize * 0.06 }, { scale: 1.12 }, { rotate: `${-tilt * 0.3}deg` }],
          easing: Easing.out(Easing.cubic),
        },
        100: { opacity: 1, transform: [{ translateY: 0 }, { scale: 1 }, { rotate: "0deg" }] },
      })
        .duration(340)
        .delay(index * 24),
    [fontSize, index, tilt],
  );

  const colorStyle = useAnimatedStyle(() => ({
    color: interpolateColor(colorMix.value, [0, 1], [baseColor, feedbackColor]),
  }));

  return (
    <Animated.Text
      entering={animate ? entering : undefined}
      style={[
        styles.letter,
        { fontSize, lineHeight: fontSize * LINE_HEIGHT_EM, height: fontSize * LINE_HEIGHT_EM },
        colorStyle,
      ]}
    >
      {char}
    </Animated.Text>
  );
}

// The word is the star of the stage: huge, white, uppercase, perfectly
// centered in its box, and it enters/leaves with a gesture that mirrors the
// tilt (correct flies up, pass falls down).
export function KineticWord({ word, feedback, golden, maxWidth, maxHeight, shakeKey }: KineticWordProps) {
  const roadtripMode = useSettingsStore((s) => s.roadtripMode);
  const display = word.toLocaleUpperCase();
  const { fontSize, lines } = useMemo(() => layoutWord(display, maxWidth, maxHeight), [display, maxWidth, maxHeight]);

  // Measured correction: if the real glyphs are wider than the estimate,
  // scale the whole block down so it never clips.
  const [fitScale, setFitScale] = useState(1);
  useEffect(() => setFitScale(1), [display, maxWidth, maxHeight]);
  function handleLayout(event: LayoutChangeEvent) {
    const { width, height } = event.nativeEvent.layout;
    if (width <= 0 || height <= 0) return;
    const next = Math.min(1, maxWidth / width, maxHeight / height);
    if (Math.abs(next - fitScale) > 0.01) setFitScale(next);
  }

  const translateY = useSharedValue(0);
  const rotate = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const shakeX = useSharedValue(0);
  const colorMix = useSharedValue(0);

  // Reset for every new word (the block remounts letters via `key`).
  useEffect(() => {
    translateY.value = 0;
    rotate.value = 0;
    scale.value = roadtripMode ? 1 : 0.96;
    scale.value = roadtripMode ? 1 : withSpring(1, { damping: 12, stiffness: 180 });
    opacity.value = roadtripMode ? withTiming(1, { duration: 160 }) : 1;
    colorMix.value = 0;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [display]);

  useEffect(() => {
    if (!feedback) return;
    colorMix.value = withTiming(1, { duration: 90 });
    if (roadtripMode) return;
    if (feedback === "correct") {
      scale.value = withSequence(withTiming(1.12, { duration: 90 }), withTiming(0.9, { duration: 200 }));
      translateY.value = withTiming(-maxHeight * 0.55, { duration: 290, easing: Easing.in(Easing.cubic) });
      opacity.value = withTiming(0, { duration: 290 });
    } else {
      rotate.value = withTiming(7, { duration: 280 });
      translateY.value = withTiming(maxHeight * 0.6, { duration: 300, easing: Easing.in(Easing.quad) });
      scale.value = withTiming(0.92, { duration: 300 });
      opacity.value = withTiming(0, { duration: 300 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feedback]);

  useEffect(() => {
    if (shakeKey === undefined || shakeKey <= 0 || roadtripMode) return;
    shakeX.value = withSequence(
      withTiming(-5, { duration: 40 }),
      withTiming(5, { duration: 60 }),
      withTiming(-3, { duration: 50 }),
      withTiming(0, { duration: 40 }),
    );
  }, [shakeKey, roadtripMode, shakeX]);

  const blockStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateX: shakeX.value },
      { translateY: translateY.value },
      { rotate: `${rotate.value}deg` },
      { scale: scale.value * fitScale },
    ],
  }));

  const baseColor = golden ? STAGE_GOLD : STAGE_INK;
  const feedbackColor = feedback === "pass" ? STAGE_PASS : STAGE_CORRECT;
  let letterIndex = 0;

  return (
    <Animated.View key={display} style={blockStyle} onLayout={handleLayout} className="items-center">
      {lines.map((line, lineIdx) => (
        <View key={lineIdx} style={[styles.line, { gap: fontSize * SPACE_EM }]}>
          {line.map((w, wordIdx) => (
            <View key={wordIdx} style={styles.word}>
              {Array.from(w).map((char, charIdx) => (
                <Letter
                  key={charIdx}
                  char={char}
                  index={letterIndex++}
                  fontSize={fontSize}
                  colorMix={colorMix}
                  baseColor={baseColor}
                  feedbackColor={feedbackColor}
                  animate={!roadtripMode}
                />
              ))}
            </View>
          ))}
        </View>
      ))}
      {/* Golden words get a thin gold underline that reads as a "prize" tag. */}
      {golden ? <View style={[styles.goldRule, { width: Math.min(maxWidth * 0.5, fontSize * 3) }]} /> : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  line: { flexDirection: "row", justifyContent: "center", alignItems: "center" },
  word: { flexDirection: "row" },
  letter: {
    fontFamily: "Urbanist_700Bold",
    letterSpacing: -1,
    textAlign: "center",
    includeFontPadding: false,
    textAlignVertical: "center",
  },
  // Absolute so the underline never shifts the word off its optical center.
  goldRule: { position: "absolute", bottom: -14, height: 4, borderRadius: 2, backgroundColor: STAGE_GOLD, opacity: 0.85 },
});
