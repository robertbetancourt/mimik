import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import * as ScreenOrientation from "expo-screen-orientation";
import { StatusBar } from "expo-status-bar";
import { ChevronLeft } from "lucide-react-native";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn, FadeInDown, ZoomIn } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { KineticText } from "@/components/stage/KineticText";
import { StagePanel, StageSoundSelector, StageStepper, StageLabel, stageStyles } from "@/components/stage/StageControls";
import { StageGlow } from "@/components/stage/StageGlow";
import { StageSegmented } from "@/components/stage/StageSegmented";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { getCategoryById } from "@/features/categories";
import { categoryIllustrations } from "@/features/categories/illustrations";
import { endTurnSounds } from "@/features/gameplay/endTurnSounds";
import { getStageAccent, STAGE_BASE } from "@/features/gameplay/stage/palette";
import { StageBackground } from "@/features/gameplay/stage/StageBackground";
import { useSoundPreview } from "@/features/gameplay/useSoundPreview";
import { MAX_PLAYERS, MIN_PLAYERS, ROUND_DURATIONS_SECONDS, ROUND_STEPS, useMatchStore } from "@/features/match/store";
import { PlayerEditorSheet } from "@/features/players/PlayerEditorSheet";
import { PlayerGrid } from "@/features/players/PlayerGrid";
import { usePresetStore } from "@/features/players/presetStore";
import { useLockOrientation } from "@/lib/useLockOrientation";

const roundDurationOptions = ROUND_DURATIONS_SECONDS.map((seconds) => ({
  label: `${seconds}s`,
  value: seconds,
}));

const HERO_IMAGE = 190;

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
  const { t } = useTranslation();
  useLockOrientation(ScreenOrientation.OrientationLock.PORTRAIT_UP);

  const selectedCategoryId = useMatchStore((state) => state.selectedCategoryId);
  const gameMode = useMatchStore((state) => state.gameMode);
  const setGameMode = useMatchStore((state) => state.setGameMode);
  const players = useMatchStore((state) => state.players);
  const addPlayer = useMatchStore((state) => state.addPlayer);
  const removeLastPlayer = useMatchStore((state) => state.removeLastPlayer);
  const roundDurationSeconds = useMatchStore((state) => state.roundDurationSeconds);
  const setRoundDurationSeconds = useMatchStore((state) => state.setRoundDurationSeconds);
  const totalRounds = useMatchStore((state) => state.totalRounds);
  const setTotalRounds = useMatchStore((state) => state.setTotalRounds);
  const infiniteMode = useMatchStore((state) => state.infiniteMode);
  const setInfiniteMode = useMatchStore((state) => state.setInfiniteMode);
  const timeBonusEnabled = useMatchStore((state) => state.timeBonusEnabled);
  const setTimeBonusEnabled = useMatchStore((state) => state.setTimeBonusEnabled);
  const timeBonusSeconds = useMatchStore((state) => state.timeBonusSeconds);
  const setTimeBonusSeconds = useMatchStore((state) => state.setTimeBonusSeconds);
  const endTurnSoundId = useMatchStore((state) => state.endTurnSoundId);
  const setEndTurnSoundId = useMatchStore((state) => state.setEndTurnSoundId);
  const survivalMode = useMatchStore((state) => state.survivalMode);
  const setSurvivalMode = useMatchStore((state) => state.setSurvivalMode);
  const goldenWordsEnabled = useMatchStore((state) => state.goldenWordsEnabled);
  const setGoldenWordsEnabled = useMatchStore((state) => state.setGoldenWordsEnabled);
  const saveLastMatch = usePresetStore((state) => state.saveLastMatch);

  const { play: previewSound } = useSoundPreview();
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const editingPlayer = players.find((player) => player.id === editingPlayerId) ?? null;

  const category = selectedCategoryId ? getCategoryById(selectedCategoryId) : undefined;
  const accent = getStageAccent(selectedCategoryId);
  const roundsIndex = getRoundsIndex(totalRounds, infiniteMode);

  function handlePlayerCountChange(nextCount: number) {
    if (nextCount > players.length) addPlayer();
    else removeLastPlayer();
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
    <View style={{ flex: 1, backgroundColor: STAGE_BASE }}>
      <StatusBar style="light" />
      <StageBackground accent={accent} dim={0.75} />

      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 140, paddingHorizontal: 16 }}
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            Haptics.selectionAsync();
            router.back();
          }}
          style={styles.backButton}
        >
          <ChevronLeft size={22} color="#FFFFFF" />
        </Pressable>

        {/* ── Hero: the chosen category under its own spotlight ─────────── */}
        {category ? (
          <View className="mt-2 items-center">
            <Animated.View entering={ZoomIn.springify().damping(12)} style={{ width: HERO_IMAGE, height: HERO_IMAGE }}>
              <View style={styles.heroGlow}>
                <StageGlow color={accent.a} width={HERO_IMAGE * 1.7} intensity={0.6} />
              </View>
              <Animated.Image
                source={categoryIllustrations[category.id]}
                resizeMode="contain"
                resizeMethod="resize"
                style={{ width: HERO_IMAGE, height: HERO_IMAGE }}
              />
            </Animated.View>
            <Animated.Text entering={FadeIn.delay(120).duration(300)} style={[styles.kicker, { color: accent.a }]}>
              {t("gameSetup.kicker")}
            </Animated.Text>
            <KineticText text={category.titulo} style={styles.title} align="center" delay={160} />
            <Animated.Text entering={FadeIn.delay(450).duration(300)} style={styles.description}>
              {category.descripcion} · {t("home.wordCount", { count: category.palabras.length })}
            </Animated.Text>
          </View>
        ) : null}

        {/* ── Players ────────────────────────────────────────────────────── */}
        <Animated.Text entering={FadeIn.delay(200)} style={stageStyles.sectionLabel}>
          {t("gameSetup.playersSection")}
        </Animated.Text>
        <Animated.View entering={FadeInDown.delay(220).springify().damping(16)}>
          <StagePanel>
            <StageSegmented
              options={[
                { label: t("gameSetup.individual"), value: "individual" },
                { label: t("gameSetup.teams"), value: "teams" },
              ]}
              value={gameMode}
              onChange={(mode) => setGameMode(mode as "individual" | "teams")}
            />
            <View style={stageStyles.divider} />
            <StageStepper
              label={t("gameSetup.players")}
              value={players.length}
              min={MIN_PLAYERS}
              max={MAX_PLAYERS}
              onChange={handlePlayerCountChange}
            />
            <View className="mt-5">
              <PlayerGrid tone="stage" players={players} onSelectPlayer={(player) => setEditingPlayerId(player.id)} />
            </View>
            <Text style={stageStyles.hint}>
              {gameMode === "teams" ? t("gameSetup.teamHint") : t("gameSetup.playerHint")}
            </Text>
          </StagePanel>
        </Animated.View>

        {/* ── Rules ──────────────────────────────────────────────────────── */}
        <Animated.Text entering={FadeIn.delay(280)} style={stageStyles.sectionLabel}>
          {t("gameSetup.rulesSection")}
        </Animated.Text>
        <Animated.View entering={FadeInDown.delay(300).springify().damping(16)}>
          <StagePanel>
            <StageLabel>{t("gameSetup.matchMode")}</StageLabel>
            <View className="mt-3">
              <StageSegmented
                options={[
                  { label: t("gameSetup.classicMode"), value: "classic" },
                  { label: t("gameSetup.survivalMode"), value: "survival" },
                ]}
                value={survivalMode ? "survival" : "classic"}
                onChange={(val) => setSurvivalMode(val === "survival")}
              />
            </View>
            {survivalMode ? <Text style={stageStyles.hint}>{t("gameSetup.survivalHint")}</Text> : null}

            {!survivalMode ? (
              <>
                <View style={stageStyles.divider} />
                <StageLabel>{t("gameSetup.turnDuration")}</StageLabel>
                <View className="mt-3">
                  <StageSegmented options={roundDurationOptions} value={roundDurationSeconds} onChange={setRoundDurationSeconds} />
                </View>
              </>
            ) : null}

            <View style={stageStyles.divider} />
            <StageStepper
              label={t("gameSetup.rounds")}
              value={roundsIndex}
              min={0}
              max={ROUND_STEPS.length - 1}
              onChange={handleRoundsChange}
              formatValue={formatRoundsStep}
            />

            {!survivalMode ? (
              <>
                <View style={stageStyles.divider} />
                <StageLabel>{t("gameSetup.timeBonus")}</StageLabel>
                <View className="mt-3">
                  <StageSegmented
                    options={[
                      { label: t("gameSetup.timeBonusOff"), value: 0 },
                      { label: "+1s", value: 1 },
                      { label: "+2s", value: 2 },
                      { label: "+3s", value: 3 },
                      { label: "+5s", value: 5 },
                    ]}
                    value={timeBonusEnabled ? timeBonusSeconds : 0}
                    onChange={(val) => {
                      if (val === 0) {
                        setTimeBonusEnabled(false);
                      } else {
                        setTimeBonusEnabled(true);
                        setTimeBonusSeconds(val as number);
                      }
                    }}
                  />
                </View>
              </>
            ) : null}

            <View style={stageStyles.divider} />
            <StageLabel>{t("gameSetup.goldenWords")}</StageLabel>
            <View className="mt-3">
              <StageSegmented
                options={[
                  { label: `✦ ${t("gameSetup.goldenWordsOn")}`, value: "on" },
                  { label: t("gameSetup.goldenWordsOff"), value: "off" },
                ]}
                value={goldenWordsEnabled ? "on" : "off"}
                onChange={(val) => setGoldenWordsEnabled(val === "on")}
              />
            </View>
            {goldenWordsEnabled ? <Text style={stageStyles.hint}>{t("gameSetup.goldenWordsHint")}</Text> : null}
          </StagePanel>
        </Animated.View>

        {/* ── Sound ──────────────────────────────────────────────────────── */}
        <Animated.Text entering={FadeIn.delay(360)} style={stageStyles.sectionLabel}>
          {t("gameSetup.soundSection")}
        </Animated.Text>
        <Animated.View entering={FadeInDown.delay(380).springify().damping(16)}>
          <StagePanel>
            <StageSoundSelector
              label={t("gameSetup.endTurnSound")}
              options={endTurnSounds}
              selectedId={endTurnSoundId}
              onChange={setEndTurnSoundId}
              onPreview={handlePreviewSound}
            />
          </StagePanel>
        </Animated.View>
      </ScrollView>

      <Animated.View entering={FadeIn.delay(300).duration(260)} style={styles.footer}>
        <LinearGradient
          colors={["rgba(11,9,18,0)", "rgba(11,9,18,0.92)", STAGE_BASE]}
          locations={[0, 0.35, 1]}
          style={{ paddingTop: 34, paddingHorizontal: 16, paddingBottom: insets.bottom + 18 }}
        >
          <PrimaryButton
            tone="accent"
            label={t("gameSetup.start")}
            onPress={() => {
              saveLastMatch(players, selectedCategoryId);
              router.push("/countdown");
            }}
          />
        </LinearGradient>
      </Animated.View>

      <PlayerEditorSheet player={editingPlayer} onClose={() => setEditingPlayerId(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.10)",
  },
  heroGlow: { position: "absolute", left: -HERO_IMAGE * 0.35, top: -HERO_IMAGE * 0.35 },
  kicker: { marginTop: 4, fontFamily: "Urbanist_700Bold", fontSize: 12, letterSpacing: 3, textTransform: "uppercase" },
  title: {
    fontFamily: "Urbanist_700Bold",
    fontSize: 38,
    lineHeight: 44,
    letterSpacing: -1.2,
    color: "#FFFFFF",
  },
  description: {
    marginTop: 4,
    textAlign: "center",
    fontFamily: "Urbanist_400Regular",
    fontSize: 14,
    color: "rgba(255,255,255,0.6)",
  },
  footer: { position: "absolute", left: 0, right: 0, bottom: 0 },
});
