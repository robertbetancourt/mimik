import * as Haptics from "expo-haptics";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Info } from "lucide-react-native";
import { Image, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";

import { StageGlow } from "@/components/stage/StageGlow";
import { StageSegmented } from "@/components/stage/StageSegmented";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
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
        tone="stage"
        visible={player !== null}
        onClose={handleClose}
        footer={
          player ? (
            <View className="flex-row gap-3">
              {playerCount > MIN_PLAYERS ? (
                <Pressable accessibilityRole="button" onPress={handleRemove} style={styles.deleteButton}>
                  <Text style={styles.deleteText}>{t("common.delete")}</Text>
                </Pressable>
              ) : null}
              <View style={{ flex: 1 }}>
                <PrimaryButton tone="accent" label={t("common.accept")} onPress={handleAccept} />
              </View>
            </View>
          ) : null
        }
      >
        {player ? (
          <View className="gap-4">
            <View className="items-center">
              <View style={styles.previewGlow} pointerEvents="none">
                <StageGlow color="#FF7A45" width={200} intensity={0.45} />
              </View>
              <Animated.View style={[styles.preview, previewStyle]}>
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
              placeholderTextColor="rgba(255,255,255,0.35)"
              selectionColor="#FF7A45"
              keyboardAppearance="dark"
              style={styles.nameInput}
            />

            <View className="gap-2">
              <View className="flex-row items-center gap-2">
                <Text style={styles.label}>{t("difficulty.label")}</Text>
                <Pressable accessibilityRole="button" onPress={() => setShowInfo(true)} hitSlop={12}>
                  <Info size={16} color="rgba(255,255,255,0.5)" />
                </Pressable>
              </View>
              <StageSegmented
                options={[
                  { label: t("difficulty.facil"), value: "facil" },
                  { label: t("difficulty.normal"), value: "normal" },
                  { label: t("difficulty.dificil"), value: "dificil" },
                ]}
                value={player.dificultad ?? "normal"}
                onChange={(val) => setPlayerDifficulty(player.id, val as DifficultyLevel)}
              />
              <Text style={styles.hint}>
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

const styles = StyleSheet.create({
  previewGlow: { position: "absolute", top: -44 },
  preview: {
    width: 112,
    height: 112,
    borderRadius: 56,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FF7A45",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  nameInput: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.06)",
    paddingHorizontal: 16,
    paddingVertical: 12,
    textAlign: "center",
    fontFamily: "Urbanist_700Bold",
    fontSize: 18,
    color: "#FFFFFF",
  },
  label: { fontFamily: "Urbanist_700Bold", fontSize: 16, color: "#FFFFFF" },
  hint: { paddingHorizontal: 16, textAlign: "center", fontFamily: "Urbanist_400Regular", fontSize: 12, color: "rgba(255,255,255,0.5)" },
  deleteButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    paddingVertical: 14,
    backgroundColor: "rgba(232,92,74,0.15)",
    borderWidth: 1,
    borderColor: "rgba(232,92,74,0.35)",
  },
  deleteText: { fontFamily: "Urbanist_700Bold", fontSize: 16, color: "#F87171" },
});
