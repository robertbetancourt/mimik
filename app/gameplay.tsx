import * as ScreenOrientation from "expo-screen-orientation";
import { Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useLockOrientation } from "@/lib/useLockOrientation";

// Temporary placeholder screen. Real gameplay lands in a later milestone.
export default function Gameplay() {
  useLockOrientation(ScreenOrientation.OrientationLock.LANDSCAPE);

  return (
    <SafeAreaView className="flex-1 items-center justify-center bg-background px-6">
      <Text className="text-2xl font-bold text-ink">Gameplay</Text>
    </SafeAreaView>
  );
}
