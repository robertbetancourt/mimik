import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import * as ScreenOrientation from "expo-screen-orientation";
import { ChevronLeft } from "lucide-react-native";
import { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import Animated from "react-native-reanimated";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { ChipSelector } from "@/components/ui/ChipSelector";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { SoundSelector } from "@/components/ui/SoundSelector";
import { Stepper } from "@/components/ui/Stepper";
import { getCategoryById } from "@/features/categories";
import { endTurnSounds } from "@/features/gameplay/endTurnSounds";
import { useSoundPreview } from "@/features/gameplay/useSoundPreview";
import { SelectedCategoryHero } from "@/features/match/SelectedCategoryHero";
import {
  MAX_PLAYERS,
  MIN_PLAYERS,
  ROUND_DURATIONS_SECONDS,
  ROUND_STEPS,
  useMatchStore,
} from "@/features/match/store";
import { useMatchSettingsEntrance } from "@/features/match/useMatchSettingsEntrance";
import { PlayerEditorSheet } from "@/features/players/PlayerEditorSheet";
import { PlayerGrid } from "@/features/players/PlayerGrid";
import { useLockOrientation } from "@/lib/useLockOrientation";
import { cardShadow } from "@/theme/shadow";

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
  const { headerStyle, settingStyles, buttonStyle } = useMatchSettingsEntrance();

  const selectedCategoryId = useMatchStore((state) => state.selectedCategoryId);
  const players = useMatchStore((state) => state.players);
  const addPlayer = useMatchStore((state) => state.addPlayer);
  const removeLastPlayer = useMatchStore((state) => state.removeLastPlayer);
  const roundDurationSeconds = useMatchStore((state) => state.roundDurationSeconds);
  const setRoundDurationSeconds = useMatchStore((state) => state.setRoundDurationSeconds);
  const totalRounds = useMatchStore((state) => state.totalRounds);
  const setTotalRounds = useMatchStore((state) => state.setTotalRounds);
  const infiniteMode = useMatchStore((state) => state.infiniteMode);
  const setInfiniteMode = useMatchStore((state) => state.setInfiniteMode);
  const endTurnSoundId = useMatchStore((state) => state.endTurnSoundId);
  const setEndTurnSoundId = useMatchStore((state) => state.setEndTurnSoundId);

  const { play: previewSound } = useSoundPreview();
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const editingPlayer = players.find((player) => player.id === editingPlayerId) ?? null;

  const category = selectedCategoryId ? getCategoryById(selectedCategoryId) : undefined;
  const roundsIndex = getRoundsIndex(totalRounds, infiniteMode);

  function handlePlayerCountChange(nextCount: number) {
    if (nextCount > players.length) {
      addPlayer();
    } else {
      removeLastPlayer();
    }
  }

  function handlePreviewSound(soundId: string) {
    const sound = endTurnSounds.find((option) => option.id === soundId);
    if (sound) previewSound(sound.file);
  }

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
      <ScrollView contentContainerClassName="px-4 pb-44 pt-4" showsVerticalScrollIndicator={false}>
        <Animated.View style={headerStyle}>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              Haptics.selectionAsync();
              router.back();
            }}
            style={cardShadow}
            className="h-11 w-11 items-center justify-center rounded-full bg-surface"
          >
            <ChevronLeft size={22} color="#2B2118" />
          </Pressable>

          <View className="mt-4">{category ? <SelectedCategoryHero category={category} /> : null}</View>
        </Animated.View>

        <View className="mt-6 gap-3">
          <Animated.View style={settingStyles[0]}>
            <Stepper
              label="Jugadores"
              value={players.length}
              min={MIN_PLAYERS}
              max={MAX_PLAYERS}
              onChange={handlePlayerCountChange}
            />
          </Animated.View>

          <Animated.View style={[cardShadow, settingStyles[1]]} className="rounded-3xl bg-surface px-5 py-4">
            <PlayerGrid players={players} onSelectPlayer={(player) => setEditingPlayerId(player.id)} />
          </Animated.View>

          <Animated.View style={settingStyles[2]}>
            <ChipSelector
              label="Duración del turno"
              options={roundDurationOptions}
              value={roundDurationSeconds}
              onChange={setRoundDurationSeconds}
            />
          </Animated.View>

          <Animated.View style={settingStyles[3]}>
            <Stepper
              label="Número de rondas"
              value={roundsIndex}
              min={0}
              max={ROUND_STEPS.length - 1}
              onChange={handleRoundsChange}
              formatValue={formatRoundsStep}
            />
          </Animated.View>

          <Animated.View style={settingStyles[4]}>
            <SoundSelector
              label="Sonido de fin de turno"
              options={endTurnSounds}
              selectedId={endTurnSoundId}
              onChange={setEndTurnSoundId}
              onPreview={handlePreviewSound}
            />
          </Animated.View>
        </View>
      </ScrollView>

      <Animated.View
        className="absolute inset-x-0 bottom-0 border-t border-ink/5 bg-background px-4 pt-4"
        style={[{ paddingBottom: insets.bottom + 24 }, buttonStyle]}
      >
        <PrimaryButton label="Comenzar partida" onPress={() => router.push("/countdown")} />
      </Animated.View>

      <PlayerEditorSheet player={editingPlayer} onClose={() => setEditingPlayerId(null)} />
    </SafeAreaView>
  );
}
