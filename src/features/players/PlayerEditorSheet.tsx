import { useEffect, useState } from "react";
import { Image, Text, TextInput, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";

import { BottomSheet } from "@/components/ui/BottomSheet";
import { CharacterCategoryTabs } from "@/features/players/CharacterCategoryTabs";
import { CharacterGrid } from "@/features/players/CharacterGrid";
import {
  ALL_CHARACTERS_CATEGORY_ID,
  characterCategories,
  characters,
  getCharacterById,
} from "@/features/players/characters";
import { useMatchStore } from "@/features/match/store";
import type { Player } from "@/types/player";

interface PlayerEditorSheetProps {
  player: Player | null;
  onClose: () => void;
}

export function PlayerEditorSheet({ player, onClose }: PlayerEditorSheetProps) {
  const renamePlayer = useMatchStore((state) => state.renamePlayer);
  const setPlayerCharacter = useMatchStore((state) => state.setPlayerCharacter);

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

  return (
    <BottomSheet visible={player !== null} onClose={onClose}>
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
            placeholder="Nombre del jugador"
            maxLength={20}
            className="rounded-2xl bg-surface px-4 py-3 text-center font-sans-bold text-lg text-ink"
          />

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
  );
}
