import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { memo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSpring, withTiming } from "react-native-reanimated";

import { withAlpha } from "@/components/stage/StageGlow";
import type { StageAccent } from "@/features/gameplay/stage/palette";
import { useSettingsStore } from "@/features/settings/settingsStore";

export type StageCategoryCardVariant = "hero" | "default";

interface StageCategoryCardProps {
  illustration: number;
  title: string;
  description?: string;
  wordCount: number;
  accent: StageAccent;
  variant?: StageCategoryCardVariant;
  /** Position in the grid — staggers the entrance. */
  index?: number;
  categoryId: string;
  /** Stable callback (receives the id) so memo actually skips re-renders. */
  onSelect: (categoryId: string) => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const PRESS_SPRING = { damping: 15, stiffness: 340 };

// Fixed card heights so the zigzag grid always balances: a hero card is
// exactly two regular cards plus the gap between them, whatever the title
// or description length. The illustration takes whatever space the text
// leaves.
export const CATEGORY_CARD_GAP = 10;
const DEFAULT_CARD_HEIGHT = 200;
const CARD_HEIGHT: Record<StageCategoryCardVariant, number> = {
  default: DEFAULT_CARD_HEIGHT,
  hero: DEFAULT_CARD_HEIGHT * 2 + CATEGORY_CARD_GAP,
};

const ENTRANCE_BASE_DELAY = 220;
const ENTRANCE_STAGGER = 45;
const ENTRANCE_STAGGER_CAP = 8;

function formatWordCount(count: number): string {
  return count >= 1000 ? `+${Math.floor(count / 100) * 100}` : `${count}`;
}

// A category as a little lit stage: dark card washed with the category's
// two accent colors, illustration on top. Entrance rises in with a small
// tilt; pressing pushes the card in and lifts the illustration.
//
// Performance notes (15 of these mount at once on Home):
// - no per-card infinite loops and no SVG — the light comes from one native
//   LinearGradient per card;
// - illustrations are decoded at display size on Android (resizeMethod),
//   instead of at their 1000–1400 px source size;
// - memo: the grid re-renders only when its data changes.
function StageCategoryCardBase({
  illustration,
  title,
  description,
  wordCount,
  accent,
  variant = "default",
  index = 0,
  categoryId,
  onSelect,
}: StageCategoryCardProps) {
  const { t } = useTranslation();
  const roadtripMode = useSettingsStore((s) => s.roadtripMode);
  const isHero = variant === "hero";

  const enter = useSharedValue(0);
  const press = useSharedValue(0);

  useEffect(() => {
    const delay = ENTRANCE_BASE_DELAY + Math.min(index, ENTRANCE_STAGGER_CAP) * ENTRANCE_STAGGER;
    enter.value = roadtripMode
      ? withTiming(1, { duration: 200 })
      : withDelay(delay, withSpring(1, { damping: 14, stiffness: 160 }));
    // Runs once per mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const tilt = index % 2 === 0 ? -3 : 3;
  const cardStyle = useAnimatedStyle(() => ({
    opacity: Math.min(enter.value * 1.4, 1),
    transform: [
      { translateY: (1 - enter.value) * 40 },
      { rotate: `${(1 - enter.value) * tilt}deg` },
      { scale: (0.94 + enter.value * 0.06) * (1 - press.value * 0.04) },
    ],
  }));
  const imageStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -press.value * 6 }, { scale: 1.08 + press.value * 0.06 }],
  }));

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onSelect(categoryId);
      }}
      onPressIn={() => {
        press.value = withSpring(1, PRESS_SPRING);
      }}
      onPressOut={() => {
        press.value = withSpring(0, PRESS_SPRING);
      }}
      style={cardStyle}
    >
      <View style={[styles.card, { height: CARD_HEIGHT[variant] }, isHero && { borderColor: withAlpha(accent.a, 0.5) }]}>
        <LinearGradient
          colors={[withAlpha(accent.a, isHero ? 0.42 : 0.32), withAlpha(accent.b, 0.1), "rgba(20,17,30,0)"]}
          locations={[0, 0.55, 1]}
          style={StyleSheet.absoluteFill}
        />

        <View style={{ flex: 1 }}>
          <Animated.Image
            source={illustration}
            resizeMode="contain"
            resizeMethod="resize"
            fadeDuration={0}
            style={[styles.image, imageStyle]}
          />
        </View>

        <View style={{ paddingHorizontal: 14, paddingBottom: 14, paddingTop: isHero ? 4 : 2 }}>
          <Text numberOfLines={1} style={[styles.title, { fontSize: isHero ? 24 : 17 }]}>
            {title}
          </Text>
          {isHero && description ? <Text style={styles.description}>{description}</Text> : null}
          <View style={styles.countPill}>
            <View style={[styles.countDot, { backgroundColor: accent.a }]} />
            <Text style={styles.countText}>{t("home.wordCount", { count: formatWordCount(wordCount) })}</Text>
          </View>
        </View>
      </View>
    </AnimatedPressable>
  );
}

export const StageCategoryCard = memo(StageCategoryCardBase);

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "#14111E",
  },
  image: { width: "100%", height: "100%" },
  title: { fontFamily: "Urbanist_700Bold", color: "#FFFFFF", letterSpacing: -0.4 },
  description: { marginTop: 2, fontFamily: "Urbanist_400Regular", fontSize: 13, color: "rgba(255,255,255,0.65)" },
  countPill: {
    marginTop: 8,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  countDot: { width: 6, height: 6, borderRadius: 3 },
  countText: { fontFamily: "Urbanist_600SemiBold", fontSize: 12, color: "rgba(255,255,255,0.75)" },
});
