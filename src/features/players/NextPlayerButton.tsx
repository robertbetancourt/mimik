import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { ArrowRight } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";

interface NextPlayerButtonProps {
  playerName: string;
  characterIllustration?: number;
  onPress: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const SPRING_CONFIG = { damping: 14, stiffness: 260 };

// Stage CTA: the next player's face, their name, and a way forward.
export function NextPlayerButton({ playerName, characterIllustration, onPress }: NextPlayerButtonProps) {
  const { t } = useTranslation();
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <AnimatedPressable
      accessibilityRole="button"
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      onPressIn={() => {
        scale.value = withSpring(0.96, SPRING_CONFIG);
      }}
      onPressOut={() => {
        scale.value = withSpring(1, SPRING_CONFIG);
      }}
      style={animatedStyle}
    >
      <LinearGradient
        colors={["#FF9A6B", "#FF7A45", "#E8552A"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.button}
      >
        {characterIllustration ? (
          <View style={styles.avatar}>
            <Image source={characterIllustration} resizeMode="contain" style={{ width: 28, height: 28 }} />
          </View>
        ) : null}
        <Text style={styles.label} numberOfLines={1}>
          {t("turnResults.nextTurnOf", { name: playerName })}
        </Text>
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
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2A1A14",
    borderWidth: 2,
    borderColor: "#FF8A57",
  },
  label: { flex: 1, fontFamily: "Urbanist_700Bold", fontSize: 17, color: "#FFFFFF" },
  arrow: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
});
