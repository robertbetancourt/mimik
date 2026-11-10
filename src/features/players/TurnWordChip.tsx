import * as Haptics from "expo-haptics";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { LinearTransition, ZoomIn } from "react-native-reanimated";

import { STAGE_GOLD } from "@/features/gameplay/stage/palette";
import type { Word } from "@/types/category";

interface TurnWordChipProps {
  word: Word;
  kind: "correct" | "passed";
  golden: boolean;
  onPress: () => void;
}

const TONES = {
  correct: { bg: "rgba(34,197,94,0.16)", border: "rgba(74,222,128,0.35)", text: "#4ADE80" },
  passed: { bg: "rgba(251,146,60,0.14)", border: "rgba(251,146,60,0.32)", text: "#FDBA74" },
} as const;

// A word from the finished turn. Tapping it moves it to the other list —
// the fix for the occasional tilt the sensor misread.
export function TurnWordChip({ word, kind, golden, onPress }: TurnWordChipProps) {
  const { t } = useTranslation();
  const tone = TONES[kind];

  return (
    <Animated.View entering={ZoomIn.springify().damping(14)} layout={LinearTransition.duration(220)}>
      <Pressable
        accessibilityRole="button"
        accessibilityHint={t("turnResults.tapToFix")}
        onPress={() => {
          Haptics.selectionAsync();
          onPress();
        }}
      >
        {/* Inner View carries the styles — NativeWind drops function-style
            `style` props on Pressable. */}
        {({ pressed }) => (
          <View
            style={[
              styles.chip,
              { backgroundColor: tone.bg, borderColor: golden ? STAGE_GOLD : tone.border, opacity: pressed ? 0.6 : 1 },
            ]}
          >
            {golden ? <Text style={[styles.text, { color: STAGE_GOLD }]}>✦</Text> : null}
            <Text style={[styles.text, { color: tone.text }]}>{word.texto}</Text>
            {golden && kind === "correct" ? (
              <Text style={[styles.text, { color: STAGE_GOLD }]}>{t("turnResults.golden")}</Text>
            ) : null}
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 11,
    paddingVertical: 5,
  },
  text: { fontFamily: "Urbanist_700Bold", fontSize: 13 },
});
