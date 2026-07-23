import "@/i18n";
import "@/theme/global.css";

import {
  Urbanist_400Regular,
  Urbanist_600SemiBold,
  Urbanist_700Bold,
  useFonts,
} from "@expo-google-fonts/urbanist";
import { View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Urbanist_400Regular,
    Urbanist_600SemiBold,
    Urbanist_700Bold,
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        {/* Hides the native splash only once the real screen has actually
            laid out — hiding it as soon as fonts resolve (the previous
            approach) let the splash disappear a frame before React had
            committed anything, leaving a blank background-color screen
            until some interaction forced a repaint. */}
        <View style={{ flex: 1 }} onLayout={() => SplashScreen.hideAsync()}>
          <Stack screenOptions={{ headerShown: false }} />
        </View>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
