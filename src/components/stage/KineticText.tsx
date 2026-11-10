import { useMemo } from "react";
import { type StyleProp, StyleSheet, type TextStyle, View } from "react-native";
import Animated, { Easing, Keyframe } from "react-native-reanimated";

import { useSettingsStore } from "@/features/settings/settingsStore";

interface KineticTextProps {
  text: string;
  style: StyleProp<TextStyle>;
  /** Delay before the first letter, in ms. */
  delay?: number;
  /** Delay between letters, in ms. */
  stagger?: number;
  align?: "left" | "center";
}

// Headline that cascades in letter by letter — the same "slot machine"
// gesture the gameplay word uses, so menus and the stage share one motion
// language. Words wrap naturally; each word's letters stay together.
export function KineticText({ text, style, delay = 0, stagger = 22, align = "left" }: KineticTextProps) {
  const roadtripMode = useSettingsStore((s) => s.roadtripMode);
  const words = useMemo(() => text.split(" "), [text]);
  let letterIndex = 0;

  return (
    <View style={[styles.wrap, { justifyContent: align === "center" ? "center" : "flex-start" }]}>
      {words.map((word, wordIdx) => (
        <View key={`${word}-${wordIdx}`} style={styles.word}>
          {Array.from(word).map((char, charIdx) => {
            const i = letterIndex++;
            const tilt = ((i * 37) % 13) - 6;
            const entering = roadtripMode
              ? undefined
              : new Keyframe({
                  0: { opacity: 0, transform: [{ translateY: 26 }, { scale: 0.5 }, { rotate: `${tilt}deg` }] },
                  60: {
                    opacity: 1,
                    transform: [{ translateY: -3 }, { scale: 1.08 }, { rotate: "0deg" }],
                    easing: Easing.out(Easing.cubic),
                  },
                  100: { opacity: 1, transform: [{ translateY: 0 }, { scale: 1 }, { rotate: "0deg" }] },
                })
                  .duration(360)
                  .delay(delay + i * stagger);
            return (
              <Animated.Text key={charIdx} entering={entering} style={style}>
                {char}
              </Animated.Text>
            );
          })}
          {wordIdx < words.length - 1 ? <Animated.Text style={style}> </Animated.Text> : null}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: "row", flexWrap: "wrap" },
  word: { flexDirection: "row" },
});
