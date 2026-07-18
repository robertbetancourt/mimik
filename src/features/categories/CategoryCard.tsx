import { LinearGradient } from "expo-linear-gradient";
import { Image, Pressable, Text, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

export type CategoryCardVariant = "hero" | "default";

interface CategoryCardContentProps {
  illustration: number;
  title: string;
  description?: string;
  wordCount: number;
  backgroundColor: string;
  variant?: CategoryCardVariant;
}

interface CategoryCardProps extends CategoryCardContentProps {
  onPress: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function formatWordCount(count: number): string {
  return count >= 1000 ? `+${Math.floor(count / 100) * 100}` : `${count}`;
}

// expo-linear-gradient on Android can't parse the "transparent" CSS keyword,
// so the fade-out start color has to be an explicit rgba with alpha 0.
function toTransparent(hexColor: string): string {
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, 0)`;
}

interface CardSize {
  imageBoxHeight: number;
  imageSize: number;
}

const SIZES: Record<CategoryCardVariant, CardSize> = {
  hero: { imageBoxHeight: 300, imageSize: 420 },
  default: { imageBoxHeight: 130, imageSize: 182 },
};

// The visual shell shared by the selectable grid card and the read-only
// hero shown on the Match Configuration screen.
export function CategoryCardContent({
  illustration,
  title,
  description,
  wordCount,
  backgroundColor,
  variant = "default",
}: CategoryCardContentProps) {
  const size = SIZES[variant];
  const isHero = variant === "hero";

  return (
    <View style={{ backgroundColor }} className="w-full overflow-hidden rounded-3xl">
      <View
        style={{ height: size.imageBoxHeight }}
        className="items-center justify-center overflow-hidden"
      >
        <Image
          source={illustration}
          resizeMode="contain"
          style={{ width: size.imageSize, height: size.imageSize }}
        />
        <LinearGradient
          colors={[toTransparent(backgroundColor), backgroundColor]}
          locations={[0, 0.85]}
          style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: size.imageBoxHeight * 0.45 }}
        />
      </View>

      <View className={`px-4 pb-4 ${isHero ? "pt-2" : "pt-1"}`}>
        <Text className={`font-sans-bold text-ink ${isHero ? "text-2xl" : "text-lg"}`} numberOfLines={1}>
          {title}
        </Text>
        {isHero && description ? (
          <Text className="mt-1 font-sans text-sm text-ink/70">{description}</Text>
        ) : null}
        <Text className={`mt-0.5 font-sans text-ink/60 ${isHero ? "text-base" : "text-sm"}`}>
          {formatWordCount(wordCount)} palabras
        </Text>
      </View>
    </View>
  );
}

export function CategoryCard({ onPress, ...content }: CategoryCardProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      accessibilityRole="button"
      onPress={onPress}
      onPressIn={() => {
        scale.value = withTiming(0.97, { duration: 100 });
      }}
      onPressOut={() => {
        scale.value = withTiming(1, { duration: 100 });
      }}
      style={animatedStyle}
    >
      <CategoryCardContent {...content} />
    </AnimatedPressable>
  );
}
