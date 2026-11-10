import { LinearGradient } from "expo-linear-gradient";
import { useTranslation } from "react-i18next";
import { Image, Text, View } from "react-native";

export type CategoryCardVariant = "hero" | "default";

interface CategoryCardContentProps {
  illustration: number;
  title: string;
  description?: string;
  wordCount: number;
  backgroundColor: string;
  variant?: CategoryCardVariant;
}



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

// Read-only category hero shown on the Match Configuration screen. (Home
// uses StageCategoryCard.)
export function CategoryCardContent({
  illustration,
  title,
  description,
  wordCount,
  backgroundColor,
  variant = "default",
}: CategoryCardContentProps) {
  const { t } = useTranslation();
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
          {t("home.wordCount", { count: formatWordCount(wordCount) })}
        </Text>
      </View>
    </View>
  );
}
