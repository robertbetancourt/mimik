import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Image, StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import Svg, { Defs, Ellipse, Polygon, RadialGradient, Stop } from "react-native-svg";

import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { mimikExpressions } from "@/features/mimik/expressions";
import { getCharacterById } from "@/features/players/characters";
import type { RankedPlayer } from "@/features/players/ranking";
import { useSettingsStore } from "@/features/settings/settingsStore";

type Place = 1 | 2 | 3;

const BLOCK_HEIGHT: Record<Place, number> = { 1: 150, 2: 112, 3: 84 };
const CHARACTER_SIZE: Record<Place, number> = { 1: 108, 2: 76, 3: 70 };
const RANK_FONT_SIZE: Record<Place, number> = { 1: 56, 2: 46, 3: 38 };
const BLOCK_COLORS: Record<Place, { cap: string; face: [string, string] }> = {
  1: { cap: "#FFF1B8", face: ["#FFDD6B", "#F29A0A"] },
  2: { cap: "#FFFFFF", face: ["#E9EEF5", "#8E9BB0"] },
  3: { cap: "#FFDCC0", face: ["#FDB283", "#BD4A12"] },
};

// Reveal order: bronze → silver → gold. Each block rises, then its player
// drops onto it. The winner lands last with the biggest drop, the crown
// falls onto their head, and the room explodes (confetti + sound + haptic).
const TIMELINE: Record<Place, { block: number; character: number }> = {
  3: { block: 250, character: 520 },
  2: { block: 650, character: 920 },
  1: { block: 1100, character: 1420 },
};
export const PODIUM_WINNER_LANDS_MS = 1760;
const CROWN_MS = 1900;

interface StagePodiumProps {
  first?: RankedPlayer;
  second?: RankedPlayer;
  third?: RankedPlayer;
  width: number;
  accent: string;
  onWinnerLanded: () => void;
}

function SunburstRays({ size, color }: { size: number; color: string }) {
  const roadtripMode = useSettingsStore((s) => s.roadtripMode);
  const rotation = useSharedValue(0);
  const opacity = useSharedValue(0);
  useEffect(() => {
    opacity.value = withDelay(PODIUM_WINNER_LANDS_MS - 150, withTiming(1, { duration: 600 }));
    if (roadtripMode) return;
    rotation.value = withRepeat(withTiming(360, { duration: 40000, easing: Easing.linear }), -1);
  }, [opacity, rotation, roadtripMode]);
  const style = useAnimatedStyle(() => ({ opacity: opacity.value, transform: [{ rotate: `${rotation.value}deg` }] }));

  const rays = 14;
  const c = size / 2;
  const polygons = Array.from({ length: rays }, (_, i) => {
    const a = (i / rays) * Math.PI * 2;
    const spread = Math.PI / rays / 2.2;
    const p1 = `${c + Math.cos(a - spread) * c},${c + Math.sin(a - spread) * c}`;
    const p2 = `${c + Math.cos(a + spread) * c},${c + Math.sin(a + spread) * c}`;
    return `${c},${c} ${p1} ${p2}`;
  });

  return (
    <Animated.View pointerEvents="none" style={[{ position: "absolute", width: size, height: size }, style]}>
      <Svg width={size} height={size}>
        <Defs>
          <RadialGradient id="rayFade" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={color} stopOpacity={0.35} />
            <Stop offset="1" stopColor={color} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        {polygons.map((points, i) => (
          <Polygon key={i} points={points} fill="url(#rayFade)" />
        ))}
      </Svg>
    </Animated.View>
  );
}

function PodiumColumn({ entry, place, columnWidth }: { entry?: RankedPlayer; place: Place; columnWidth: number }) {
  const { t } = useTranslation();
  const roadtripMode = useSettingsStore((s) => s.roadtripMode);
  const blockHeight = BLOCK_HEIGHT[place];
  const characterSize = CHARACTER_SIZE[place];
  const colors = BLOCK_COLORS[place];
  const timing = TIMELINE[place];
  const character = entry ? getCharacterById(entry.player.characterId) : undefined;

  const blockRise = useSharedValue(blockHeight);
  const drop = useSharedValue(-260);
  const dropOpacity = useSharedValue(0);
  const squashY = useSharedValue(1);
  const crownY = useSharedValue(-120);
  const crownOpacity = useSharedValue(0);
  const idle = useSharedValue(0);

  useEffect(() => {
    if (!entry) return;
    const spring = { damping: 15, stiffness: 170 };
    blockRise.value = withDelay(timing.block, roadtripMode ? withTiming(0, { duration: 200 }) : withSpring(0, spring));
    dropOpacity.value = withDelay(timing.character, withTiming(1, { duration: 120 }));
    drop.value = withDelay(
      timing.character,
      roadtripMode ? withTiming(0, { duration: 200 }) : withSpring(0, { damping: place === 1 ? 9 : 12, stiffness: 200 }),
    );
    if (!roadtripMode) {
      // Landing squash, timed to the spring's first impact.
      squashY.value = withDelay(
        timing.character + 170,
        withSequence(withTiming(0.82, { duration: 90 }), withSpring(1, { damping: 6, stiffness: 300 })),
      );
    }
    if (place === 1) {
      crownOpacity.value = withDelay(CROWN_MS, withTiming(1, { duration: 120 }));
      crownY.value = withDelay(CROWN_MS, withSpring(0, { damping: 7, stiffness: 220 }));
    }
    if (!roadtripMode) {
      idle.value = withDelay(
        PODIUM_WINNER_LANDS_MS + 600 + place * 300,
        withRepeat(
          withSequence(
            withTiming(-6, { duration: 700, easing: Easing.inOut(Easing.sin) }),
            withTiming(0, { duration: 700, easing: Easing.inOut(Easing.sin) }),
          ),
          -1,
        ),
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const blockStyle = useAnimatedStyle(() => ({ transform: [{ translateY: blockRise.value }] }));
  const characterStyle = useAnimatedStyle(() => ({
    opacity: dropOpacity.value,
    transform: [
      { translateY: drop.value + idle.value },
      { scaleY: squashY.value },
      { scaleX: 2 - squashY.value },
    ],
  }));
  const crownStyle = useAnimatedStyle(() => ({
    opacity: crownOpacity.value,
    transform: [{ translateY: crownY.value }, { rotate: "-12deg" }],
  }));

  return (
    <View style={{ width: columnWidth, alignItems: "center", justifyContent: "flex-end" }}>
      {entry ? (
        <Animated.View style={[{ alignItems: "center", marginBottom: 6 }, characterStyle]}>
          {place === 1 ? (
            <Animated.Text style={[styles.crown, crownStyle]}>👑</Animated.Text>
          ) : null}
          {character ? (
            <Image source={character.illustration} resizeMode="contain" style={{ width: characterSize, height: characterSize }} />
          ) : null}
          <Text numberOfLines={1} style={[styles.name, { maxWidth: columnWidth - 6, fontSize: place === 1 ? 17 : 14 }]}>
            {entry.player.name}
          </Text>
        </Animated.View>
      ) : null}

      {/* The block lives in a clipped box so it can "rise out of the floor". */}
      <View style={{ width: columnWidth - 8, height: blockHeight, overflow: "hidden" }}>
        {entry ? (
          <Animated.View style={[{ flex: 1 }, blockStyle]}>
            <View style={[styles.cap, { backgroundColor: colors.cap }]} />
            <LinearGradient colors={colors.face} style={styles.face}>
              <Text style={[styles.rank, { fontSize: RANK_FONT_SIZE[place], lineHeight: RANK_FONT_SIZE[place] * 1.08 }]}>
                {entry.rank}
              </Text>
              <View style={styles.scorePill}>
                <AnimatedCounter
                  value={entry.score}
                  duration={900}
                  style={{ fontFamily: "Urbanist_700Bold", fontSize: 13, color: "#FFFFFF" }}
                />
                <Text style={{ fontFamily: "Urbanist_700Bold", fontSize: 11, color: "rgba(255,255,255,0.8)" }}>
                  {" "}
                  {t("finalResults.pointsShort")}
                </Text>
              </View>
            </LinearGradient>
          </Animated.View>
        ) : null}
      </View>
    </View>
  );
}

export function StagePodium({ first, second, third, width, accent, onWinnerLanded }: StagePodiumProps) {
  const columnWidth = width / 3;

  useEffect(() => {
    if (!first) return;
    const timeout = setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      onWinnerLanded();
    }, PODIUM_WINNER_LANDS_MS);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const raysSize = width * 1.25;

  return (
    <View style={{ width, alignItems: "center" }}>
      {/* Rays behind the winner's column */}
      <View style={{ position: "absolute", top: -raysSize * 0.32, left: (width - raysSize) / 2 }}>
        <SunburstRays size={raysSize} color={accent} />
      </View>

      <View style={{ flexDirection: "row", alignItems: "flex-end", height: BLOCK_HEIGHT[1] + CHARACTER_SIZE[1] + 70 }}>
        <PodiumColumn entry={second} place={2} columnWidth={columnWidth} />
        <PodiumColumn entry={first} place={1} columnWidth={columnWidth} />
        <PodiumColumn entry={third} place={3} columnWidth={columnWidth} />
      </View>

      {/* Floor glow */}
      <Svg width={width} height={36} style={{ marginTop: -14 }}>
        <Defs>
          <RadialGradient id="floorGlow" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={accent} stopOpacity={0.55} />
            <Stop offset="1" stopColor={accent} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Ellipse cx={width / 2} cy={18} rx={width / 2} ry={18} fill="url(#floorGlow)" />
      </Svg>

      {/* Mimik applauding from the wings */}
      <Animated.View
        entering={FadeIn.delay(PODIUM_WINNER_LANDS_MS + 300).duration(400)}
        pointerEvents="none"
        style={{ position: "absolute", right: -18, bottom: 6 }}
      >
        <Image source={mimikExpressions.slowClap} resizeMode="contain" style={{ width: 74, height: 74 }} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  crown: { fontSize: 34, marginBottom: -12, zIndex: 2 },
  name: {
    marginTop: 4,
    fontFamily: "Urbanist_700Bold",
    color: "#FFFFFF",
    textAlign: "center",
  },
  cap: { height: 12, borderTopLeftRadius: 14, borderTopRightRadius: 14 },
  face: { flex: 1, alignItems: "center", paddingTop: 6 },
  rank: {
    fontFamily: "Urbanist_700Bold",
    color: "rgba(255,255,255,0.92)",
    includeFontPadding: false,
    textShadowColor: "rgba(0,0,0,0.18)",
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 6,
  },
  scorePill: {
    flexDirection: "row",
    alignItems: "baseline",
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 2,
    backgroundColor: "rgba(0,0,0,0.18)",
  },
});
