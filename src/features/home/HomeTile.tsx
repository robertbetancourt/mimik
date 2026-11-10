import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { ChevronRight, type LucideIcon } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";

import { withAlpha } from "@/components/stage/StageGlow";

interface HomeTileProps {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  color: string;
  onPress: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const PRESS_SPRING = { damping: 15, stiffness: 340 };

// Secondary destinations at the end of Home (History, Settings). Same
// material as the category cards — dark glass lit by one accent — so they
// read as part of the grid's world instead of floating utility pills.
export function HomeTile({ icon: Icon, title, subtitle, color, onPress }: HomeTileProps) {
  const press = useSharedValue(0);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: 1 - press.value * 0.04 }] }));

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={() => {
        Haptics.selectionAsync();
        onPress();
      }}
      onPressIn={() => {
        press.value = withSpring(1, PRESS_SPRING);
      }}
      onPressOut={() => {
        press.value = withSpring(0, PRESS_SPRING);
      }}
      style={[{ flex: 1 }, style]}
    >
      <View style={styles.tile}>
        <LinearGradient
          colors={[withAlpha(color, 0.22), "rgba(20,17,30,0)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View className="flex-row items-start justify-between">
          <View style={[styles.iconWrap, { backgroundColor: withAlpha(color, 0.2), borderColor: withAlpha(color, 0.4) }]}>
            <Icon size={20} color={color} strokeWidth={2.2} />
          </View>
          <ChevronRight size={18} color="rgba(255,255,255,0.35)" />
        </View>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.subtitle} numberOfLines={1}>
          {subtitle}
        </Text>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    overflow: "hidden",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "#14111E",
    padding: 14,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { marginTop: 14, fontFamily: "Urbanist_700Bold", fontSize: 17, color: "#FFFFFF" },
  subtitle: { marginTop: 1, fontFamily: "Urbanist_400Regular", fontSize: 13, color: "rgba(255,255,255,0.55)" },
});
