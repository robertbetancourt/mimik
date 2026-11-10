import "@/i18n";
import "@/theme/global.css";

import {
  Urbanist_400Regular,
  Urbanist_600SemiBold,
  Urbanist_700Bold,
  useFonts,
} from "@expo-google-fonts/urbanist";
import * as NavigationBar from "expo-navigation-bar";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import * as SystemUI from "expo-system-ui";
import { useEffect, useState } from "react";
import { Platform, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AnimatedSplashScreen } from "@/components/ui/AnimatedSplashScreen";
import { STAGE_BASE } from "@/features/gameplay/stage/palette";

SplashScreen.preventAutoHideAsync();

// Android system bars: the app is dark everywhere now, so the navigation
// bar gets white buttons (which also switches Android's contrast scrim from
// white to dark) and the root window background matches the stage, so no
// white ever shows behind the bar or during transitions. app.json sets the
// same values for production builds; this also covers Expo Go.
function useDarkSystemBars() {
  useEffect(() => {
    SystemUI.setBackgroundColorAsync(STAGE_BASE).catch(() => {});
    if (Platform.OS !== "android") return;
    NavigationBar.setButtonStyleAsync("light").catch(() => {});
    try {
      NavigationBar.setStyle("dark");
    } catch {
      // Only available with edge-to-edge; the button style above still applies.
    }
  }, []);
}

const STAGE_SCREEN_OPTIONS = {
  animation: "fade",
  contentStyle: { backgroundColor: STAGE_BASE },
} as const;

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Urbanist_400Regular,
    Urbanist_600SemiBold,
    Urbanist_700Bold,
  });

  const [splashAnimationFinished, setSplashAnimationFinished] = useState(false);
  useDarkSystemBars();

  if (!fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: STAGE_BASE }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <View style={{ flex: 1 }}>
          <Stack screenOptions={{ headerShown: false }}>
            {/* Declared first on purpose: the first listed screen becomes
                the initial route. */}
            <Stack.Screen name="index" options={{ contentStyle: { backgroundColor: STAGE_BASE } }} />
            {/* Stage screens (dark): fade in over a dark card so the
                navigator never flashes the default white background. */}
            <Stack.Screen name="countdown" options={STAGE_SCREEN_OPTIONS} />
            <Stack.Screen name="gameplay" options={STAGE_SCREEN_OPTIONS} />
            <Stack.Screen name="turn-results" options={STAGE_SCREEN_OPTIONS} />
            <Stack.Screen name="final-results" options={STAGE_SCREEN_OPTIONS} />
            <Stack.Screen name="history" options={{ contentStyle: { backgroundColor: STAGE_BASE } }} />
            <Stack.Screen name="settings" options={{ contentStyle: { backgroundColor: STAGE_BASE } }} />
          </Stack>
          {!splashAnimationFinished && (
            <AnimatedSplashScreen
              onAnimationFinish={() => setSplashAnimationFinished(true)}
            />
          )}
        </View>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
