import { useRouter } from "expo-router";
import * as ScreenOrientation from "expo-screen-orientation";
import { useTranslation } from "react-i18next";
import { Image, Text, View } from "react-native";
import Animated from "react-native-reanimated";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { ConfettiBurst } from "@/components/effects/ConfettiBurst";
import { ShineSweep } from "@/components/effects/ShineSweep";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { useMatchStore } from "@/features/match/store";
import { calculateAwards } from "@/features/players/awards";
import { getCharacterById } from "@/features/players/characters";
import { PlayerRankRow } from "@/features/players/PlayerRankRow";
import { rankPlayers } from "@/features/players/ranking";
import { useCelebrationSound } from "@/features/players/useCelebrationSound";
import { usePodiumEntrance } from "@/features/players/usePodiumEntrance";
import { usePodiumIdle } from "@/features/players/usePodiumIdle";
import { useLockOrientation } from "@/lib/useLockOrientation";
import { cardShadow } from "@/theme/shadow";

const PODIUM_WIDTH = 300;
const PODIUM_HEIGHT = PODIUM_WIDTH / 1.484;
const TROPHY_SIZE = 90;

export default function FinalResults() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  useLockOrientation(ScreenOrientation.OrientationLock.PORTRAIT_UP);

  const players = useMatchStore((state) => state.players);
  const playerScores = useMatchStore((state) => state.playerScores);
  const playerStats = useMatchStore((state) => state.playerStats);
  const gameMode = useMatchStore((state) => state.gameMode);
  const startRematch = useMatchStore((state) => state.startRematch);
  const resetMatch = useMatchStore((state) => state.resetMatch);

  const isTeamMode = gameMode === "teams";
  // Team mode orders the podium by team score first — the same comparison
  // that decides the banner below — so the podium can never contradict the
  // team the app just announced as the winner.
  const ranked = rankPlayers(players, playerScores, isTeamMode);
  const [first, second, third] = ranked;
  const remaining = ranked.slice(3);

  const winnerCharacter = first ? getCharacterById(first.player.characterId) : undefined;
  const secondCharacter = second ? getCharacterById(second.player.characterId) : undefined;
  const thirdCharacter = third ? getCharacterById(third.player.characterId) : undefined;

  const redScore = players
    .filter((player) => player.teamId === "red")
    .reduce((sum, player) => sum + (playerScores[player.id] ?? 0), 0);
  const blueScore = players
    .filter((player) => player.teamId === "blue")
    .reduce((sum, player) => sum + (playerScores[player.id] ?? 0), 0);
  const winningTeamId = redScore >= blueScore ? "red" : "blue";
  const winningTeamLabel = winningTeamId === "red" ? t("finalResults.teamRed") : t("finalResults.teamBlue");

  const awards = calculateAwards(players, playerStats, playerScores);

  const { play: playCelebrationSound } = useCelebrationSound();
  const {
    entranceDone,
    celebrationPeak,
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

  // Navigate first, reset after — resetting the store immediately would
  // recompute this still-mounted screen's podium with the new (empty or
  // freshly-generated) player data for a frame before it unmounts, flashing
  // different characters right as the screen is supposed to just vanish.
  function handleRematch() {
    router.replace("/countdown");
    setTimeout(() => startRematch(), 0);
  }

  function handleHome() {
    router.replace("/");
    setTimeout(() => resetMatch(), 0);
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
        {isTeamMode ? (
          <View className="mt-2 items-center">
            <View className={`rounded-full px-4 py-1 ${winningTeamId === "red" ? "bg-[#FF3B30]" : "bg-[#5B8DEF]"}`}>
              <Text className="font-sans-bold text-lg text-white">
                {t("finalResults.teamWins", { team: winningTeamLabel })}
              </Text>
            </View>
            <Text className="mt-1 font-sans text-sm text-ink/60">
              {t("finalResults.scoreLine", { red: redScore, blue: blueScore })}
            </Text>
            {first ? (
              <Text className="mt-1 font-sans-bold text-sm text-ink">
                {t("finalResults.mvp", { name: first.player.name })}
              </Text>
            ) : null}
          </View>
        ) : (
          <View className="items-center">
            <Text className="mt-2 font-sans-bold text-2xl text-ink">{first?.player.name}</Text>
            <Text className="font-sans text-base text-ink/60">{t("finalResults.winsMatch")}</Text>
          </View>
        )}

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

        {awards.length > 0 ? (
          <View className="mt-8 w-full">
            <Text className="mb-3 font-sans-bold text-base text-ink">{t("finalResults.specialAwards")}</Text>
            <View className="gap-2.5">
              {awards.map((award) => (
                <View
                  key={award.id}
                  style={cardShadow}
                  className="flex-row items-center justify-between rounded-2xl bg-surface px-4 py-3"
                >
                  <View className="flex-row items-center gap-3">
                    <Text className="text-2xl">{award.badge}</Text>
                    <View>
                      <Text className="font-sans-bold text-base text-ink">{award.title}</Text>
                      <Text className="font-sans text-xs text-ink/60">
                        {award.player.name} • {award.description}
                      </Text>
                    </View>
                  </View>
                  <Text className="font-sans-bold text-sm text-primary">{award.statValue}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {remaining.length > 0 ? (
          <View className="mt-8 w-full">
            <Text className="mb-3 font-sans-bold text-base text-ink">{t("finalResults.finalRanking")}</Text>
            <View className="gap-2">
              {remaining.map(({ player, rank, score }) => (
                <PlayerRankRow key={player.id} rank={rank} player={player} score={score} />
              ))}
            </View>
          </View>
        ) : null}
      </Animated.ScrollView>

      <ConfettiBurst enabled={celebrationPeak} />

      <Animated.View
        style={[{ paddingBottom: insets.bottom + 24 }, buttonStyle]}
        className="absolute inset-x-0 bottom-0 border-t border-ink/5 bg-background px-4 pt-4"
      >
        <PrimaryButton label={t("finalResults.rematch")} onPress={handleRematch} />
        <Text
          onPress={handleHome}
          accessibilityRole="button"
          className="mt-4 py-2 text-center font-sans-bold text-base text-ink/60"
        >
          {t("finalResults.goHome")}
        </Text>
      </Animated.View>
    </SafeAreaView>
  );
}
