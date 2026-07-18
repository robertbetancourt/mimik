import { useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ChipSelector } from "@/components/ui/ChipSelector";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { Stepper } from "@/components/ui/Stepper";
import { getCategoryById } from "@/features/categories";
import { SelectedCategoryHero } from "@/features/match/SelectedCategoryHero";
import {
  MAX_PLAYERS,
  MAX_ROUNDS,
  MIN_PLAYERS,
  MIN_ROUNDS,
  ROUND_DURATIONS_SECONDS,
  useMatchStore,
} from "@/features/match/store";

const roundDurationOptions = ROUND_DURATIONS_SECONDS.map((seconds) => ({
  label: `${seconds}s`,
  value: seconds,
}));

export default function GameSetup() {
  const router = useRouter();

  const selectedCategoryId = useMatchStore((state) => state.selectedCategoryId);
  const playerCount = useMatchStore((state) => state.playerCount);
  const setPlayerCount = useMatchStore((state) => state.setPlayerCount);
  const roundDurationSeconds = useMatchStore((state) => state.roundDurationSeconds);
  const setRoundDurationSeconds = useMatchStore((state) => state.setRoundDurationSeconds);
  const totalRounds = useMatchStore((state) => state.totalRounds);
  const setTotalRounds = useMatchStore((state) => state.setTotalRounds);
  const infiniteMode = useMatchStore((state) => state.infiniteMode);
  const setInfiniteMode = useMatchStore((state) => state.setInfiniteMode);

  const category = selectedCategoryId ? getCategoryById(selectedCategoryId) : undefined;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <ScrollView contentContainerClassName="px-4 pb-32 pt-4" showsVerticalScrollIndicator={false}>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.back()}
          className="h-11 w-11 items-center justify-center rounded-full bg-surface"
        >
          <ChevronLeft size={22} color="#2B2118" />
        </Pressable>

        <View className="mt-4">{category ? <SelectedCategoryHero category={category} /> : null}</View>

        <View className="mt-6 gap-3">
          <Stepper
            label="Jugadores"
            value={playerCount}
            min={MIN_PLAYERS}
            max={MAX_PLAYERS}
            onChange={setPlayerCount}
          />

          <ChipSelector
            label="Duración de la ronda"
            options={roundDurationOptions}
            value={roundDurationSeconds}
            onChange={setRoundDurationSeconds}
          />

          <Stepper
            label="Número de rondas"
            value={totalRounds}
            min={MIN_ROUNDS}
            max={MAX_ROUNDS}
            onChange={setTotalRounds}
            formatValue={() => (infiniteMode ? "∞" : `${totalRounds}`)}
          />

          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: infiniteMode }}
            onPress={() => setInfiniteMode(!infiniteMode)}
            className="flex-row items-center justify-between rounded-3xl bg-surface px-5 py-4"
          >
            <Text className="font-sans-bold text-base text-ink">Jugar sin límite de rondas</Text>
            <View
              className={`h-7 w-12 justify-center rounded-full px-1 ${
                infiniteMode ? "items-end bg-primary" : "items-start bg-background"
              }`}
            >
              <View className="h-5 w-5 rounded-full bg-white" />
            </View>
          </Pressable>
        </View>
      </ScrollView>

      <View className="absolute inset-x-0 bottom-0 border-t border-ink/5 bg-background px-4 pb-6 pt-4">
        <PrimaryButton label="Comenzar partida" onPress={() => router.push("/countdown")} />
      </View>
    </SafeAreaView>
  );
}
