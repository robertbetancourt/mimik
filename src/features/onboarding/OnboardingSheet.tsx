import * as Haptics from "expo-haptics";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Image, Pressable, Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  SlideInRight,
  SlideOutLeft,
  SlideInLeft,
  SlideOutRight,
} from "react-native-reanimated";

import { BottomSheet } from "@/components/ui/BottomSheet";
import { PrimaryButton } from "@/components/ui/PrimaryButton";

interface OnboardingSheetProps {
  visible: boolean;
  onComplete: () => void;
}

const PAGE_COUNT = 3;
// Pages 1-2 are a single illustration + short text; page 3 stacks two, so
// it needs real extra height instead of leaving the first two pages with a
// tall sheet and empty space at the bottom.
const PAGE_HEIGHT_RATIOS = [0.64, 0.64, 0.78];
const PAGE_TRANSITION_MS = 220;
const SWIPE_DISTANCE_THRESHOLD = 60;
const SWIPE_VELOCITY_THRESHOLD = 500;

function PageDots({
  count,
  activeIndex,
  onSelect,
}: {
  count: number;
  activeIndex: number;
  onSelect: (index: number) => void;
}) {
  return (
    <View className="flex-row items-center justify-center gap-2">
      {Array.from({ length: count }, (_, index) => (
        <Pressable
          key={index}
          accessibilityRole="button"
          hitSlop={8}
          onPress={() => onSelect(index)}
          className={`h-2 rounded-full ${index === activeIndex ? "w-6 bg-primary" : "w-2 bg-ink/15"}`}
        />
      ))}
    </View>
  );
}

// First-launch walkthrough — three fixed pages, not a generic carousel, so
// each page's layout is written directly rather than built from a data
// array. Slides horizontally in the direction of travel; dots + Previous
// only ever move state, never gate correctness.
export function OnboardingSheet({ visible, onComplete }: OnboardingSheetProps) {
  const { t } = useTranslation();
  const [pageIndex, setPageIndex] = useState(0);
  const [direction, setDirection] = useState<"forward" | "back">("forward");

  const isFirstPage = pageIndex === 0;
  const isLastPage = pageIndex === PAGE_COUNT - 1;

  function goNext() {
    if (isLastPage) {
      onComplete();
      return;
    }
    setDirection("forward");
    setPageIndex((current) => current + 1);
  }

  function goPrevious() {
    if (isFirstPage) return;
    Haptics.selectionAsync();
    setDirection("back");
    setPageIndex((current) => current - 1);
  }

  function goToPage(index: number) {
    if (index === pageIndex) return;
    Haptics.selectionAsync();
    setDirection(index > pageIndex ? "forward" : "back");
    setPageIndex(index);
  }

  const entering =
    direction === "forward"
      ? SlideInRight.duration(PAGE_TRANSITION_MS)
      : SlideInLeft.duration(PAGE_TRANSITION_MS);
  const exiting =
    direction === "forward"
      ? SlideOutLeft.duration(PAGE_TRANSITION_MS)
      : SlideOutRight.duration(PAGE_TRANSITION_MS);

  // Horizontal-only: activeOffsetX claims the gesture as soon as the drag
  // reads as sideways, failOffsetY releases it immediately on a vertical
  // drag so it never fights the sheet's own drag-to-dismiss or the
  // scroll view underneath.
  const swipe = Gesture.Pan()
    .activeOffsetX([-15, 15])
    .failOffsetY([-15, 15])
    .onEnd((event) => {
      const isSwipeLeft =
        event.translationX < -SWIPE_DISTANCE_THRESHOLD ||
        event.velocityX < -SWIPE_VELOCITY_THRESHOLD;
      const isSwipeRight =
        event.translationX > SWIPE_DISTANCE_THRESHOLD || event.velocityX > SWIPE_VELOCITY_THRESHOLD;

      if (isSwipeLeft) runOnJS(goNext)();
      else if (isSwipeRight) runOnJS(goPrevious)();
    });

  return (
    <BottomSheet
      visible={visible}
      onClose={onComplete}
      heightRatio={PAGE_HEIGHT_RATIOS[pageIndex]}
      footer={
        <View className="gap-4">
          <PageDots count={PAGE_COUNT} activeIndex={pageIndex} onSelect={goToPage} />
          <View className="flex-row items-center gap-3">
            {!isFirstPage ? (
              <Pressable
                accessibilityRole="button"
                onPress={goPrevious}
                className="flex-1 items-center justify-center rounded-full py-3.5"
              >
                <Text className="font-sans-bold text-base text-ink/60">
                  {t("onboarding.previous")}
                </Text>
              </Pressable>
            ) : null}
            <View className="flex-1">
              <PrimaryButton
                label={isLastPage ? t("onboarding.letsPlay") : t("onboarding.next")}
                onPress={goNext}
              />
            </View>
          </View>
        </View>
      }
    >
      <GestureDetector gesture={swipe}>
        <View className="items-center pt-2">
          {pageIndex === 0 ? (
            <Animated.View
              key="page-1"
              entering={entering}
              exiting={exiting}
              className="w-full items-center"
            >
              <Image
                source={require("../../../branding/mimik/say-hi.png")}
                resizeMode="contain"
                style={{ width: 220, height: 220 }}
              />
              <Text className="mt-6 text-center font-sans-bold text-2xl text-ink">
                {t("onboarding.page1.title")}
              </Text>
              <Text className="mt-2 text-center font-sans text-base text-ink/60">
                {t("onboarding.page1.description")}
              </Text>
            </Animated.View>
          ) : null}

          {pageIndex === 1 ? (
            <Animated.View
              key="page-2"
              entering={entering}
              exiting={exiting}
              className="w-full items-center"
            >
              <Image
                source={require("../../../assets/images/ui/foward-phone.png")}
                resizeMode="contain"
                style={{ width: 220, height: 220 }}
              />
              <Text className="mt-6 text-center font-sans-bold text-2xl text-ink">
                {t("onboarding.page2.title")}
              </Text>
              <Text className="mt-2 text-center font-sans text-base text-ink/60">
                {t("onboarding.page2.description")}
              </Text>
            </Animated.View>
          ) : null}

          {pageIndex === 2 ? (
            <Animated.View
              key="page-3"
              entering={entering}
              exiting={exiting}
              className="w-full items-center gap-8"
            >
              <View className="items-center">
                <Image
                  source={require("../../../assets/images/ui/pass.png")}
                  resizeMode="contain"
                  style={{ width: 140, height: 140 }}
                />
                <Text className="mt-4 text-center font-sans-bold text-lg text-ink">
                  {t("onboarding.page3.passText")}
                </Text>
              </View>
              <View className="items-center">
                <Image
                  source={require("../../../assets/images/ui/correct.png")}
                  resizeMode="contain"
                  style={{ width: 140, height: 140 }}
                />
                <Text className="mt-4 text-center font-sans-bold text-lg text-ink">
                  {t("onboarding.page3.correctText")}
                </Text>
              </View>
            </Animated.View>
          ) : null}
        </View>
      </GestureDetector>
    </BottomSheet>
  );
}
