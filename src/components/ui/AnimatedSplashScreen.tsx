import React, { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import * as SplashScreen from "expo-splash-screen";
import { AnimatedMimikLogo } from "./AnimatedMimikLogo";

interface AnimatedSplashScreenProps {
  onAnimationFinish: () => void;
}

export function AnimatedSplashScreen({
  onAnimationFinish,
}: AnimatedSplashScreenProps) {
  const [isReady, setIsReady] = useState(false);
  const containerOpacity = useSharedValue(1);

  useEffect(() => {
    // Hide the native splash screen as we take over with this component
    SplashScreen.hideAsync().then(() => {
      setIsReady(true);
    });
  }, []);

  const handleLogoAnimationComplete = () => {
    containerOpacity.value = withTiming(0, { duration: 400 }, (finished) => {
      if (finished) {
        runOnJS(onAnimationFinish)();
      }
    });
  };

  const containerStyle = useAnimatedStyle(() => {
    return {
      opacity: containerOpacity.value,
    };
  });

  if (!isReady) {
    // Render a static replica until native splash hides to avoid flicker
    // We could render the static SVG, but an empty black view is fine for 1 frame
    return (
      <View style={styles.container} />
    );
  }

  return (
    <Animated.View
      style={[styles.container, containerStyle]}
      pointerEvents="none"
    >
      <View style={styles.logoWrapper}>
        <AnimatedMimikLogo onAnimationComplete={handleLogoAnimationComplete} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000000",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    elevation: 1000,
  },
  logoWrapper: {
    width: 248, // width of SVG
    height: 262, // height of SVG
    // To match the visual scale of the previous 170x170 PNG, we can scale this wrapper if needed
    transform: [{ scale: 0.9 }],
  },
});
