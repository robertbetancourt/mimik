import { useRouter } from "expo-router";
import * as ScreenOrientation from "expo-screen-orientation";
import { Image, Text, View } from "react-native";
import Animated from "react-native-reanimated";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { ConfettiBurst } from "@/components/effects/ConfettiBurst";
import { ShineSweep } from "@/components/effects/ShineSweep";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { useMatchStore } from "@/features/match/store";
import { getCharacterById } from "@/features/players/characters";
import { PlayerRankRow } from "@/features/players/PlayerRankRow";
import { rankPlayers } from "@/features/players/ranking";
import { useCelebrationSound } from "@/features/players/useCelebrationSound";
import { usePodiumEntrance } from "@/features/players/usePodiumEntrance";
import { usePodiumIdle } from "@/features/players/usePodiumIdle";
import { useLockOrientation } from "@/lib/useLockOrientation";

const PODIUM_WIDTH = 300;
const PODIUM_HEIGHT = PODIUM_WIDTH / 1.484;
const TROPHY_SIZE = 90;

export default function FinalResults() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  useLockOrientation(ScreenOrientation.OrientationLock.PORTRAIT_UP);

  const players = useMatchStore((state) => state.players);
  const playerScores = useMatchStore((state) => state.playerScores);
  const startRematch = useMatchStore((state) => state.startRematch);
  const resetMatch = useMatchStore((state) => state.resetMatch);

  const ranked = rankPlayers(players, playerScores);
  const [first, second, third] = ranked;
  const remaining = ranked.slice(3);

  const winnerCharacter = first ? getCharacterById(first.player.characterId) : undefined;
  const secondCharacter = second ? getCharacterById(second.player.characterId) : undefined;
  const thirdCharacter = third ? getCharacterById(third.player.characterId) : undefined;

  const { play: playCelebrationSound } = useCelebrationSound();
  const {
    entranceDone,
    screenStyle,
    trophyStyle,
    podiumStyle,
    thirdStyle,
    secondStyle,
    winnerStyle,
    buttonStyle,
  } = usePodiumEntrance({
      hasSecond: Boolean(second),
      hasThird: Boolean(third),
      onWinnerRevealed: playCelebrationSound,
    });
  const [winnerIdleStyle, secondIdleStyle, thirdIdleStyle] = usePodiumIdle(
    entranceDone,
    third ? 3 : second ? 2 : 1,
  );

  function handleRematch() {
    startRematch();
    router.replace("/countdown");
  }

  function handleHome() {
    resetMatch();
    router.replace("/");
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <Animated.ScrollView
        style={screenStyle}
        contentContainerClassName="items-center px-6 pb-56 pt-8"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={trophyStyle}>
          <ShineSweep enabled={entranceDone} width={TROPHY_SIZE} height={TROPHY_SIZE}>
            <Image
              source={require("../assets/images/ui/cup.png")}
              resizeMode="contain"
              style={{ width: TROPHY_SIZE, height: TROPHY_SIZE }}
            />
          </ShineSweep>
        </Animated.View>

        <Animated.View style={winnerStyle}>
          {winnerCharacter ? (
            <Animated.View style={winnerIdleStyle}>
              <Image
                source={winnerCharacter.illustration}
                resizeMode="contain"
                style={{ width: 130, height: 130, marginTop: 4 }}
              />
            </Animated.View>
          ) : null}
        </Animated.View>
        <Text className="mt-2 font-sans-bold text-2xl text-ink">{first?.player.name}</Text>
        <Text className="font-sans text-base text-ink/60">¡Gana la partida!</Text>

        <Animated.View style={[{ width: PODIUM_WIDTH, height: PODIUM_HEIGHT, marginTop: 24 }, podiumStyle]}>
          <Image
            source={require("../assets/images/ui/podium.png")}
            resizeMode="contain"
            style={{ width: PODIUM_WIDTH, height: PODIUM_HEIGHT, position: "absolute" }}
          />

          {second && secondCharacter ? (
            <Animated.View style={[{ position: "absolute", left: 60, top: 24 }, secondStyle, secondIdleStyle]}>
              <Image source={secondCharacter.illustration} resizeMode="contain" style={{ width: 54, height: 54 }} />
            </Animated.View>
          ) : null}

          {winnerCharacter ? (
            <View style={{ position: "absolute", left: 116, top: -26 }}>
              <Image source={winnerCharacter.illustration} resizeMode="contain" style={{ width: 68, height: 68 }} />
            </View>
          ) : null}

          {third && thirdCharacter ? (
            <Animated.View style={[{ position: "absolute", left: 208, top: 24 }, thirdStyle, thirdIdleStyle]}>
              <Image source={thirdCharacter.illustration} resizeMode="contain" style={{ width: 54, height: 54 }} />
            </Animated.View>
          ) : null}
        </Animated.View>

        {remaining.length > 0 ? (
          <View className="mt-8 w-full">
            <Text className="mb-3 font-sans-bold text-base text-ink">Clasificación final</Text>
            <View className="gap-2">
              {remaining.map(({ player, rank, score }) => (
                <PlayerRankRow key={player.id} rank={rank} player={player} score={score} />
              ))}
            </View>
          </View>
        ) : null}
      </Animated.ScrollView>

      <ConfettiBurst enabled={entranceDone} />

      <Animated.View
        style={[{ paddingBottom: insets.bottom + 24 }, buttonStyle]}
        className="absolute inset-x-0 bottom-0 border-t border-ink/5 bg-background px-4 pt-4"
      >
        <PrimaryButton label="🎮 Revancha" onPress={handleRematch} />
        <Text
          onPress={handleHome}
          accessibilityRole="button"
          className="mt-4 py-2 text-center font-sans-bold text-base text-ink/60"
        >
          🏠 Inicio
        </Text>
      </Animated.View>
    </SafeAreaView>
  );
}
