import * as Haptics from "expo-haptics";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Image, Pressable, Text, TextInput, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";

import { BottomSheet } from "@/components/ui/BottomSheet";
import { ChipSelector } from "@/components/ui/ChipSelector";
import { InfoDialog } from "@/components/ui/InfoDialog";
import { CharacterCategoryTabs } from "@/features/players/CharacterCategoryTabs";
import { CharacterGrid } from "@/features/players/CharacterGrid";
import {
  ALL_CHARACTERS_CATEGORY_ID,
  characterCategories,
  characters,
  getCharacterById,
} from "@/features/players/characters";
import { MIN_PLAYERS, useMatchStore } from "@/features/match/store";
import type { DifficultyLevel, Player } from "@/types/player";

interface PlayerEditorSheetProps {
  player: Player | null;
  onClose: () => void;
}

export function PlayerEditorSheet({ player, onClose }: PlayerEditorSheetProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [showInfo, setShowInfo] = useState(false);
  const renamePlayer = useMatchStore((state) => state.renamePlayer);
  const setPlayerCharacter = useMatchStore((state) => state.setPlayerCharacter);
  const setPlayerDifficulty = useMatchStore((state) => state.setPlayerDifficulty);
  const removePlayer = useMatchStore((state) => state.removePlayer);
  const playerCount = useMatchStore((state) => state.players.length);

  const [categoryId, setCategoryId] = useState(ALL_CHARACTERS_CATEGORY_ID);

  useEffect(() => {
    // Every player opens on "Todos" by default.
    setCategoryId(ALL_CHARACTERS_CATEGORY_ID);
  }, [player?.id]);

  const previewScale = useSharedValue(1);
  const previewStyle = useAnimatedStyle(() => ({ transform: [{ scale: previewScale.value }] }));

  useEffect(() => {
    previewScale.value = 0.85;
    previewScale.value = withSpring(1, { damping: 12, stiffness: 220 });
  }, [player?.characterId, previewScale]);

  const character = player ? getCharacterById(player.characterId) : undefined;
  const categoryCharacters =
    categoryId === ALL_CHARACTERS_CATEGORY_ID
      ? characters
      : characters.filter((item) => item.categoryId === categoryId);

  function handleRemove() {
    if (!player) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    removePlayer(player.id);
    onClose();
  }

  // A blank (or whitespace-only) name would leave the player unlabeled
  // everywhere downstream — leaderboard, podium, "Turno de ___". Falls back
  // silently instead of blocking the close, since this can also fire from
  // the sheet's swipe-to-dismiss / backdrop-tap paths, not just Aceptar.
  function handleClose() {
    if (player && player.name.trim() === "") {
      renamePlayer(player.id, t("common.player"));
    }
    onClose();
  }

  function handleAccept() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    handleClose();
  }

  return (
    <>
      <BottomSheet
        visible={player !== null}
        onClose={handleClose}
        footer={
          player ? (
            <View className="flex-row gap-3">
              {playerCount > MIN_PLAYERS ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={handleRemove}
                  className="flex-1 items-center justify-center rounded-full bg-error/10 py-3.5"
                >
                  <Text className="font-sans-bold text-base text-error">{t("common.delete")}</Text>
                </Pressable>
              ) : null}
              <Pressable
                accessibilityRole="button"
                onPress={handleAccept}
                className="flex-1 items-center justify-center rounded-full bg-ink py-3.5"
              >
                <Text className="font-sans-bold text-base text-white">{t("common.accept")}</Text>
              </Pressable>
            </View>
          ) : null
        }
      >
        {player ? (
          <View className="gap-4">
            <View className="items-center">
              <Animated.View
                style={previewStyle}
                className="h-28 w-28 items-center justify-center rounded-full bg-surface"
              >
                {character ? (
                  <Image source={character.illustration} resizeMode="contain" style={{ width: 80, height: 80 }} />
                ) : null}
              </Animated.View>
            </View>

            <TextInput
              value={player.name}
              onChangeText={(text) => renamePlayer(player.id, text)}
              placeholder={t("common.playerNamePlaceholder")}
              accessibilityLabel={t("common.playerNamePlaceholder")}
              maxLength={20}
              returnKeyType="done"
              className="rounded-2xl bg-white/70 border border-white px-4 py-3 text-center font-sans-bold text-lg text-ink"
            />

            <View className="gap-2">
              <ChipSelector
                label={t("difficulty.label")}
                onInfoPress={() => setShowInfo(true)}
                options={[
                  { label: t("difficulty.facil"), value: "facil" },
                  { label: t("difficulty.normal"), value: "normal" },
                  { label: t("difficulty.dificil"), value: "dificil" },
                ]}
                value={player.dificultad ?? "normal"}
                onChange={(val) => setPlayerDifficulty(player.id, val as DifficultyLevel)}
              />
              <Text className="text-center font-sans-medium text-xs text-ink/50 px-4">
                {t("difficulty.description")}
              </Text>
            </View>

            <CharacterCategoryTabs
              categories={characterCategories}
              selectedId={categoryId}
              onChange={setCategoryId}
            />

            <CharacterGrid
              categoryId={categoryId}
              characters={categoryCharacters}
              selectedId={player.characterId}
              onSelect={(characterId) => setPlayerCharacter(player.id, characterId)}
            />
          </View>
        ) : (
          <Text> </Text>
        )}
      </BottomSheet>

      <InfoDialog
        visible={showInfo}
        title={t("difficulty.tooltipTitle")}
        message={t("difficulty.tooltipMessage")}
        buttonLabel={t("difficulty.tooltipGotIt")}
        onClose={() => setShowInfo(false)}
      />
    </>
  );
}
