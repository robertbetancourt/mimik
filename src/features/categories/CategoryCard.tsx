import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useEffect } from "react";
import { Image, Pressable, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";

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
  /** Position in the category list — staggers this card's entrance. */
  index?: number;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const PRESS_SPRING = { damping: 16, stiffness: 320 };

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
          // Bleeds 1px past the box's own bottom edge (still clipped by its
          // parent's overflow: hidden) so no hairline seam shows between the
          // faded image and the solid card color below.
          style={{ position: "absolute", bottom: -1, left: 0, right: 0, height: size.imageBoxHeight * 0.45 + 2 }}
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

// Mix (the hero card) plays the "primary button" role on Home: its own
// entrance, then a single attention pulse once that entrance settles.
const HERO_ENTRANCE_DELAY = 160;

// The rest of the grid staggers in right after, card by card. Stagger is
// capped so a long category list still finishes well under the ~600ms
// entrance budget instead of trailing on forever.
const GRID_BASE_DELAY = 140;
const GRID_STAGGER = 28;
const GRID_STAGGER_CAP = 9;

export function CategoryCard({ onPress, index = 0, ...content }: CategoryCardProps) {
  const scale = useSharedValue(1);
  const isHero = content.variant === "hero";
  const entranceOpacity = useSharedValue(0);
  const entranceScale = useSharedValue(isHero ? 0.94 : 0.96);
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    if (isHero) {
      entranceOpacity.value = withDelay(HERO_ENTRANCE_DELAY, withTiming(1, { duration: 260 }));
      entranceScale.value = withDelay(
        HERO_ENTRANCE_DELAY,
        withSpring(1, { damping: 14, stiffness: 180 }, (finished) => {
          if (finished) {
            pulseScale.value = withSequence(
              withTiming(1.02, { duration: 160 }),
              withTiming(1, { duration: 160 }),
            );
          }
        }),
      );
      return;
    }

    const delay = GRID_BASE_DELAY + Math.min(index, GRID_STAGGER_CAP) * GRID_STAGGER;
    entranceOpacity.value = withDelay(delay, withTiming(1, { duration: 200 }));
    entranceScale.value = withDelay(delay, withTiming(1, { duration: 200 }));
    // Runs once per mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: entranceOpacity.value,
    transform: [
      { scale: scale.value },
      { scale: entranceScale.value },
      { scale: pulseScale.value },
    ],
  }));

  return (
    <AnimatedPressable
      accessibilityRole="button"
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      onPressIn={() => {
        scale.value = withSpring(0.98, PRESS_SPRING);
      }}
      onPressOut={() => {
        scale.value = withSpring(1, PRESS_SPRING);
      }}
      style={animatedStyle}
    >
      <CategoryCardContent {...content} />
    </AnimatedPressable>
  );
}
