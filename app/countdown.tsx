import { Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useMatchStore } from "@/features/match/store";

// Temporary placeholder screen. Countdown + orientation check land in a later milestone.
export default function Countdown() {
  const playerCount = useMatchStore((state) => state.playerCount);
  const roundDurationSeconds = useMatchStore((state) => state.roundDurationSeconds);
  const totalRounds = useMatchStore((state) => state.totalRounds);
  const infiniteMode = useMatchStore((state) => state.infiniteMode);

  return (
    <SafeAreaView className="flex-1 items-center justify-center bg-background px-6">
      <Text className="text-2xl font-bold text-ink">Cuenta regresiva</Text>
      <Text className="mt-2 text-base text-ink/70">
        {playerCount} jugadores · {roundDurationSeconds}s por ronda ·{" "}
        {infiniteMode ? "rondas ilimitadas" : `${totalRounds} rondas`}
      </Text>
    </SafeAreaView>
  );
}
