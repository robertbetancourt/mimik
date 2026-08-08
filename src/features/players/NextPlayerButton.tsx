import * as Haptics from "expo-haptics";
import { ArrowRight } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { Image, Pressable, Text, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { buttonShadow } from "@/theme/shadow";

interface NextPlayerButtonProps {
  playerName: string;
  characterIllustration?: number;
  onPress: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const SPRING_CONFIG = { damping: 14, stiffness: 260 };

export function NextPlayerButton({ playerName, characterIllustration, onPress }: NextPlayerButtonProps) {
  const { t } = useTranslation();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

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
      style={[animatedStyle, buttonShadow]}
      className="rounded-full"
    >
      <View className="overflow-hidden rounded-full">
        <LinearGradient
          colors={["#3D2F23", "#2B2118", "#1A140F"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="flex-row items-center justify-center gap-2 py-4"
        >
          {characterIllustration ? (
            <Image source={characterIllustration} resizeMode="contain" style={{ width: 28, height: 28 }} />
          ) : null}
          <Text className="font-sans-bold text-base text-white">{t("turnResults.nextTurnOf", { name: playerName })}</Text>
          <ArrowRight size={20} color="white" />
        </LinearGradient>
      </View>
    </AnimatedPressable>
  );
}
