import { useRouter } from "expo-router";
import * as ScreenOrientation from "expo-screen-orientation";
import { useTranslation } from "react-i18next";
import { Image, ScrollView, Text, View } from "react-native";
import Animated from "react-native-reanimated";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { CloseCircleIcon, TickCircleIcon } from "@/components/icons/FeedbackIcons";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { useMatchStore } from "@/features/match/store";
import { getCharacterById } from "@/features/players/characters";
import { NextPlayerButton } from "@/features/players/NextPlayerButton";
import { PlayerRankRow } from "@/features/players/PlayerRankRow";
import { rankPlayers } from "@/features/players/ranking";
import { useTurnResultsEntrance } from "@/features/players/useTurnResultsEntrance";
import { useLockOrientation } from "@/lib/useLockOrientation";
import { cardShadow } from "@/theme/shadow";

export default function TurnResults() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  useLockOrientation(ScreenOrientation.OrientationLock.PORTRAIT_UP);
  const { characterStyle, scoreStyle, decorationStyle, countersStyle, leaderboardStyle, buttonStyle } =
    useTurnResultsEntrance();

  const players = useMatchStore((state) => state.players);
  const playerScores = useMatchStore((state) => state.playerScores);
  const currentPlayerIndex = useMatchStore((state) => state.currentPlayerIndex);
  const currentRound = useMatchStore((state) => state.currentRound);
  const totalRounds = useMatchStore((state) => state.totalRounds);
  const infiniteMode = useMatchStore((state) => state.infiniteMode);
  const lastTurnResult = useMatchStore((state) => state.lastTurnResult);
  const advanceTurn = useMatchStore((state) => state.advanceTurn);

  const currentPlayer = players[currentPlayerIndex];
  const currentCharacter = currentPlayer ? getCharacterById(currentPlayer.characterId) : undefined;

  const correctWords = lastTurnResult?.correctWords ?? [];
  const passedWords = lastTurnResult?.passedWords ?? [];

  const ranked = rankPlayers(players, playerScores);

  const nextPlayerIndex = players.length > 0 ? (currentPlayerIndex + 1) % players.length : 0;
  const nextPlayer = players[nextPlayerIndex];
  const nextCharacter = nextPlayer ? getCharacterById(nextPlayer.characterId) : undefined;

  // Mirrors advanceTurn()'s finishing condition without mutating the store,
  // so the button can announce the podium instead of a next player that
  // will never actually play.
  const isMatchWillFinish =
    !infiniteMode && nextPlayerIndex === 0 && currentRound + 1 > totalRounds;

  function handleContinue() {
    const matchFinished = advanceTurn();
    router.replace(matchFinished ? "/final-results" : "/countdown");
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <ScrollView contentContainerClassName="items-center px-6 pb-48 pt-8" showsVerticalScrollIndicator={false}>
        <Animated.View style={characterStyle} className="items-center">
          {currentCharacter ? (
            <Image source={currentCharacter.illustration} resizeMode="contain" style={{ width: 110, height: 110 }} />
          ) : null}
          <Text className="mt-2 font-sans-bold text-2xl text-ink">{currentPlayer?.name}</Text>
        </Animated.View>

        <Animated.View style={scoreStyle} className="mt-5 flex-row items-center justify-center">
          <Animated.Image
            source={require("../assets/images/ui/left-points.png")}
            resizeMode="contain"
            style={[{ width: 80, height: 80, marginRight: -16, zIndex: 1 }, decorationStyle]}
          />
          <AnimatedCounter
            value={correctWords.length}
            style={{
              fontSize: 64,
              fontFamily: "Urbanist_700Bold",
              color: "#2B2118",
              minWidth: 64,
              textAlign: "center",
            }}
          />
          <Animated.Image
            source={require("../assets/images/ui/right-points.png")}
            resizeMode="contain"
            style={[{ width: 80, height: 80, marginLeft: -16, zIndex: 1 }, decorationStyle]}
          />
        </Animated.View>
        <Animated.Text
          style={[{ marginTop: -4, fontFamily: "Urbanist_400Regular", fontSize: 16, color: "#2B211899" }, scoreStyle]}
        >
          {t("turnResults.points")}
        </Animated.Text>

        <Animated.View style={countersStyle} className="mt-8 w-full gap-3">
          <View style={cardShadow} className="rounded-3xl bg-surface p-4">
            <View className="flex-row items-center gap-2">
              <TickCircleIcon size={20} color="#3DBE6C" />
              <Text className="font-sans-bold text-base text-ink">{t("turnResults.correct")}</Text>
              <Text className="font-sans-bold text-base text-ink/40">
                · <AnimatedCounter value={correctWords.length} duration={500} style={{ fontSize: 16, fontFamily: "Urbanist_700Bold", color: "#2B211866" }} />
              </Text>
            </View>
            {correctWords.length === 0 ? (
              <Text className="mt-2 font-sans text-sm text-ink/50">{t("turnResults.noneThisTime")}</Text>
            ) : (
              <View className="mt-2 flex-row flex-wrap gap-1.5">
                {correctWords.map((word) => (
                  <View key={word.id} className="rounded-full bg-success/15 px-2.5 py-1">
                    <Text className="font-sans-bold text-xs text-success">{word.texto}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          <View style={cardShadow} className="rounded-3xl bg-surface p-4">
            <View className="flex-row items-center gap-2">
              <CloseCircleIcon size={20} color="#E85C4A" />
              <Text className="font-sans-bold text-base text-ink">{t("turnResults.passed")}</Text>
              <Text className="font-sans-bold text-base text-ink/40">
                · <AnimatedCounter value={passedWords.length} duration={500} style={{ fontSize: 16, fontFamily: "Urbanist_700Bold", color: "#2B211866" }} />
              </Text>
            </View>
            {passedWords.length === 0 ? (
              <Text className="mt-2 font-sans text-sm text-ink/50">{t("turnResults.noneThisTime")}</Text>
            ) : (
              <View className="mt-2 flex-row flex-wrap gap-1.5">
                {passedWords.map((word) => (
                  <View key={word.id} className="rounded-full bg-error/15 px-2.5 py-1">
                    <Text className="font-sans-bold text-xs text-error">{word.texto}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </Animated.View>

        <Animated.View style={leaderboardStyle} className="mt-6 w-full">
          <Text className="mb-3 font-sans-bold text-base text-ink">{t("turnResults.leaderboard")}</Text>
          <View className="gap-2">
            {ranked.map(({ player, rank, score }) => (
              <PlayerRankRow key={player.id} rank={rank} player={player} score={score} />
            ))}
          </View>
        </Animated.View>
      </ScrollView>

      <Animated.View
        style={[{ paddingBottom: insets.bottom + 24 }, buttonStyle]}
        className="absolute inset-x-0 bottom-0 border-t border-ink/5 bg-background px-4 pt-4"
      >
        {isMatchWillFinish ? (
          <PrimaryButton label={`🏆 ${t("turnResults.viewPodium")}`} onPress={handleContinue} />
        ) : (
          <NextPlayerButton
            playerName={nextPlayer?.name ?? ""}
            characterIllustration={nextCharacter?.illustration}
            onPress={handleContinue}
          />
        )}
      </Animated.View>
    </SafeAreaView>
  );
}
