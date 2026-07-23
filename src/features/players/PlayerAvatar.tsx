import * as Haptics from "expo-haptics";
import { useEffect } from "react";
import { Image, Pressable, Text, View } from "react-native";
import Animated, {
  Easing,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
  ZoomOut,
} from "react-native-reanimated";

import { useMatchStore } from "@/features/match/store";
import { getCharacterById } from "@/features/players/characters";
import type { Player } from "@/types/player";

interface PlayerAvatarProps {
  player: Player;
  onPress: () => void;
}

const TEAM_COLORS = { red: "#FF3B30", blue: "#5B8DEF" } as const;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const PRESS_SPRING = { damping: 14, stiffness: 260 };
const ENTER_SPRING = { damping: 13, stiffness: 220 };
const RISE_DISTANCE = 10;
// Existing siblings' LinearTransition reflow runs first; this card's own
// entrance waits until that settles instead of animating in simultaneously.
const ENTER_DELAY = 130;

export function PlayerAvatar({ player, onPress }: PlayerAvatarProps) {
  const character = getCharacterById(player.characterId);
  const gameMode = useMatchStore((state) => state.gameMode);
  const togglePlayerTeam = useMatchStore((state) => state.togglePlayerTeam);
  const pressScale = useSharedValue(1);

  const enterOpacity = useSharedValue(0);
  const enterY = useSharedValue(RISE_DISTANCE);
  const enterScale = useSharedValue(0.9);

  useEffect(() => {
    enterOpacity.value = withDelay(ENTER_DELAY, withTiming(1, { duration: 180, easing: Easing.out(Easing.cubic) }));
    enterY.value = withDelay(ENTER_DELAY, withSpring(0, ENTER_SPRING));
    enterScale.value = withDelay(ENTER_DELAY, withSpring(1, ENTER_SPRING));
    // Plays once when this player card mounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressScale.value }],
  }));
  const enterStyle = useAnimatedStyle(() => ({
    opacity: enterOpacity.value,
    transform: [{ translateY: enterY.value }, { scale: enterScale.value }],
  }));

  const isRed = (player.teamId ?? "red") === "red";
  const teamColor = isRed ? TEAM_COLORS.red : TEAM_COLORS.blue;

  return (
    <Animated.View
      layout={LinearTransition.duration(140).easing(Easing.out(Easing.cubic))}
      exiting={ZoomOut.duration(150)}
      style={enterStyle}
      className="w-[22%] items-center"
    >
      <AnimatedPressable
        accessibilityRole="button"
        onPress={() => {
          Haptics.selectionAsync();
          onPress();
        }}
        onPressIn={() => {
          pressScale.value = withSpring(0.92, PRESS_SPRING);
        }}
        onPressOut={() => {
          pressScale.value = withSpring(1, PRESS_SPRING);
        }}
        style={pressStyle}
        className="items-center"
      >
        <View
          style={gameMode === "teams" ? { borderWidth: 2, borderColor: teamColor } : undefined}
          className="h-16 w-16 items-center justify-center rounded-full bg-surface"
        >
          {character ? (
            <Image source={character.illustration} resizeMode="contain" style={{ width: 44, height: 44 }} />
          ) : null}
          {gameMode === "teams" ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Cambiar al equipo ${isRed ? "azul" : "rojo"}`}
              onPress={(event) => {
                event.stopPropagation();
                Haptics.selectionAsync();
                togglePlayerTeam(player.id);
              }}
              style={{ backgroundColor: teamColor }}
              className="absolute -right-1 -top-1 h-5 w-5 items-center justify-center rounded-full"
            >
              <Text className="text-[10px] font-sans-bold text-white">{isRed ? "R" : "A"}</Text>
            </Pressable>
          ) : null}
        </View>
        <Text className="mt-1 font-sans-bold text-xs text-ink" numberOfLines={1}>
          {player.name}
        </Text>
      </AnimatedPressable>
    </Animated.View>
  );
}
