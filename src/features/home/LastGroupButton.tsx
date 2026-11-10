import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { ArrowRight } from "lucide-react-native";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";

import { getCharacterById } from "@/features/players/characters";
import type { Player } from "@/types/player";

interface LastGroupButtonProps {
  players: Player[];
  label: string;
  subtitle: string;
  onPress: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const PRESS_SPRING = { damping: 15, stiffness: 320 };
const MAX_AVATARS = 4;

// The fastest way back into a game: the last group's faces, one tap.
export function LastGroupButton({ players, label, subtitle, onPress }: LastGroupButtonProps) {
  const press = useSharedValue(0);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: 1 - press.value * 0.03 }] }));
  const shown = players.slice(0, MAX_AVATARS);
  const extra = players.length - shown.length;

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      onPressIn={() => {
        press.value = withSpring(1, PRESS_SPRING);
      }}
      onPressOut={() => {
        press.value = withSpring(0, PRESS_SPRING);
      }}
      style={style}
    >
      <LinearGradient
        colors={["#FF9A6B", "#FF7A45", "#E8552A"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.button}
      >
        <View style={styles.avatars}>
          {shown.map((player, i) => {
            const character = getCharacterById(player.characterId);
            return (
              <View key={player.id} style={[styles.avatar, { marginLeft: i === 0 ? 0 : -12, zIndex: MAX_AVATARS - i }]}>
                {character ? <Image source={character.illustration} resizeMode="contain" style={{ width: 26, height: 26 }} /> : null}
              </View>
            );
          })}
          {extra > 0 ? (
            <View style={[styles.avatar, { marginLeft: -12 }]}>
              <Text style={styles.extra}>+{extra}</Text>
            </View>
          ) : null}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.label} numberOfLines={1}>
            {label}
          </Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        </View>
        <View style={styles.arrow}>
          <ArrowRight size={18} color="#E8552A" strokeWidth={2.6} />
        </View>
      </LinearGradient>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 24,
    paddingVertical: 12,
    paddingLeft: 12,
    paddingRight: 12,
  },
  avatars: { flexDirection: "row", alignItems: "center" },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2A1A14",
    borderWidth: 2,
    borderColor: "#FF8A57",
  },
  extra: { fontFamily: "Urbanist_700Bold", fontSize: 12, color: "#FFFFFF" },
  label: { fontFamily: "Urbanist_700Bold", fontSize: 16, color: "#FFFFFF" },
  subtitle: { fontFamily: "Urbanist_600SemiBold", fontSize: 12, color: "rgba(255,255,255,0.8)" },
  arrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
});
