import * as Haptics from "expo-haptics";
import { ArrowRight } from "lucide-react-native";
import { Image, Pressable, Text } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";

interface NextPlayerButtonProps {
  playerName: string;
  characterIllustration?: number;
  onPress: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const SPRING_CONFIG = { damping: 14, stiffness: 260 };

export function NextPlayerButton({ playerName, characterIllustration, onPress }: NextPlayerButtonProps) {
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
      style={animatedStyle}
      className="flex-row items-center justify-center gap-2 rounded-full bg-primary py-4"
    >
      {characterIllustration ? (
        <Image source={characterIllustration} resizeMode="contain" style={{ width: 28, height: 28 }} />
      ) : null}
      <Text className="font-sans-bold text-base text-white">Turno de {playerName}</Text>
      <ArrowRight size={20} color="white" />
    </AnimatedPressable>
  );
}
