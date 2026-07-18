import { useRouter } from "expo-router";
import * as ScreenOrientation from "expo-screen-orientation";
import { ChevronLeft } from "lucide-react-native";
import { Pressable, ScrollView, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { ChipSelector } from "@/components/ui/ChipSelector";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { Stepper } from "@/components/ui/Stepper";
import { getCategoryById } from "@/features/categories";
import { SelectedCategoryHero } from "@/features/match/SelectedCategoryHero";
import {
  MAX_PLAYERS,
  MIN_PLAYERS,
  ROUND_DURATIONS_SECONDS,
  ROUND_STEPS,
  useMatchStore,
} from "@/features/match/store";
import { useLockOrientation } from "@/lib/useLockOrientation";

const roundDurationOptions = ROUND_DURATIONS_SECONDS.map((seconds) => ({
  label: `${seconds}s`,
  value: seconds,
}));

function getRoundsIndex(totalRounds: number, infiniteMode: boolean): number {
  if (infiniteMode) return ROUND_STEPS.length - 1;
  const index = ROUND_STEPS.indexOf(totalRounds);
  return index === -1 ? 0 : index;
}

function formatRoundsStep(index: number): string {
  const step = ROUND_STEPS[index];
  return step === "infinite" ? "∞" : `${step}`;
}

export default function GameSetup() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  useLockOrientation(ScreenOrientation.OrientationLock.PORTRAIT_UP);

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
  const roundsIndex = getRoundsIndex(totalRounds, infiniteMode);

  function handleRoundsChange(index: number) {
    const step = ROUND_STEPS[index];
    if (step === "infinite") {
      setInfiniteMode(true);
    } else {
      setInfiniteMode(false);
      setTotalRounds(step);
    }
  }

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
            label="Duración del turno"
            options={roundDurationOptions}
            value={roundDurationSeconds}
            onChange={setRoundDurationSeconds}
          />

          <Stepper
            label="Número de rondas"
            value={roundsIndex}
            min={0}
            max={ROUND_STEPS.length - 1}
            onChange={handleRoundsChange}
            formatValue={formatRoundsStep}
          />
        </View>
      </ScrollView>

      <View
        className="absolute inset-x-0 bottom-0 border-t border-ink/5 bg-background px-4 pt-4"
        style={{ paddingBottom: insets.bottom + 24 }}
      >
        <PrimaryButton label="Comenzar partida" onPress={() => router.push("/countdown")} />
      </View>
    </SafeAreaView>
  );
}
