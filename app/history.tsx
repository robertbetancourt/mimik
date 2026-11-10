import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import * as ScreenOrientation from "expo-screen-orientation";
import { StatusBar } from "expo-status-bar";
import { ChevronLeft, Trash2 } from "lucide-react-native";
import { memo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { KineticText } from "@/components/stage/KineticText";
import { withAlpha } from "@/components/stage/StageGlow";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { categoryIllustrations } from "@/features/categories";
import { MIX_CATEGORY_ID } from "@/features/categories/mix";
import { getStageAccent, STAGE_BASE, STAGE_GOLD } from "@/features/gameplay/stage/palette";
import { StageBackground } from "@/features/gameplay/stage/StageBackground";
import { type MatchRecord, topWinner, useHistoryStore } from "@/features/history/historyStore";
import { mimikExpressions } from "@/features/mimik/expressions";
import { getCharacterById } from "@/features/players/characters";
import { useLockOrientation } from "@/lib/useLockOrientation";

const HOME_ACCENT = getStageAccent(MIX_CATEGORY_ID);

function Avatar({ characterId, size }: { characterId: string; size: number }) {
  const character = getCharacterById(characterId);
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2 }} className="items-center justify-center bg-white/10">
      {character ? (
        <Image source={character.illustration} resizeMode="contain" style={{ width: size * 0.72, height: size * 0.72 }} />
      ) : null}
    </View>
  );
}

// Only the first screenful animates in; older matches just appear, so a long
// history never queues dozens of entrance animations.
const ANIMATED_CARDS = 6;

const MatchCard = memo(function MatchCard({ record, index }: { record: MatchRecord; index: number }) {
  const { t, i18n } = useTranslation();
  const accent = getStageAccent(record.categoryId);
  const winners = record.players.filter((p) => record.winnerIds.includes(p.id));
  const others = record.players.filter((p) => !record.winnerIds.includes(p.id));
  const illustration = record.categoryId ? categoryIllustrations[record.categoryId] : undefined;
  const date = new Date(record.finishedAt).toLocaleDateString(i18n.language, {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
  const isTie = record.gameMode === "individual" && winners.length > 1;
  const headline =
    record.gameMode === "teams" && record.winningTeamId
      ? t("history.teamWins", { team: record.winningTeamId === "red" ? t("finalResults.teamRed") : t("finalResults.teamBlue") })
      : isTie
        ? t("history.tie")
        : winners[0]?.name ?? "—";

  return (
    <Animated.View entering={index < ANIMATED_CARDS ? FadeInDown.delay(index * 50 + 120).duration(260) : undefined} style={styles.card}>
      <LinearGradient
        colors={[withAlpha(accent.a, 0.28), withAlpha(accent.b, 0.08), "rgba(20,17,30,0)"]}
        locations={[0, 0.5, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View className="flex-row items-center gap-3 px-4 pt-3">
        {illustration ? <Image source={illustration} resizeMode="contain" resizeMethod="resize" style={{ width: 30, height: 30 }} /> : null}
        <Text style={styles.category} numberOfLines={1}>
          {record.categoryTitle}
        </Text>
        <Text style={styles.date}>{date}</Text>
      </View>

      <View className="flex-row items-center gap-3 px-4 pt-3">
        <View className="flex-row">
          {winners.slice(0, 3).map((w, i) => (
            <View key={w.id} style={{ marginLeft: i === 0 ? 0 : -14 }}>
              <Avatar characterId={w.characterId} size={52} />
            </View>
          ))}
        </View>
        <View className="flex-1">
          <Text style={styles.winnerKicker}>🏆 {t("history.winner")}</Text>
          <Text style={styles.headline} numberOfLines={1}>
            {headline}
          </Text>
        </View>
        <Text style={styles.winnerScore}>{winners[0]?.score ?? 0}</Text>
      </View>

      {others.length > 0 ? (
        <View style={styles.others}>
          {others.map((p) => (
            <View key={p.id} style={styles.otherChip}>
              <Avatar characterId={p.characterId} size={22} />
              <Text style={styles.otherName} numberOfLines={1}>
                {p.name}
              </Text>
              <Text style={styles.otherScore}>{p.score}</Text>
            </View>
          ))}
        </View>
      ) : (
        <View className="h-4" />
      )}
    </Animated.View>
  );
});

export default function History() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  useLockOrientation(ScreenOrientation.OrientationLock.PORTRAIT_UP);
  const records = useHistoryStore((s) => s.records);
  const clear = useHistoryStore((s) => s.clear);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const best = topWinner(records);

  return (
    <View style={{ flex: 1, backgroundColor: STAGE_BASE }}>
      <StatusBar style="light" />
      <StageBackground accent={HOME_ACCENT} dim={0.85} />

      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 32, paddingHorizontal: 16 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-row items-center justify-between">
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              Haptics.selectionAsync();
              router.back();
            }}
            style={styles.iconButton}
          >
            <ChevronLeft size={22} color="#FFFFFF" />
          </Pressable>
          {records.length > 0 ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("history.clear")}
              onPress={() => setConfirmVisible(true)}
              style={styles.iconButton}
            >
              <Trash2 size={18} color="rgba(255,255,255,0.7)" />
            </Pressable>
          ) : null}
        </View>

        <View className="mt-5">
          <KineticText text={t("history.title")} style={styles.title} delay={60} />
        </View>

        {records.length === 0 ? (
          <Animated.View entering={FadeIn.delay(250).duration(400)} className="mt-16 items-center px-6">
            <Image source={mimikExpressions.waiting} resizeMode="contain" style={{ width: 150, height: 150 }} />
            <Text style={styles.emptyTitle}>{t("history.emptyTitle")}</Text>
            <Text style={styles.emptyMessage}>{t("history.emptyMessage")}</Text>
          </Animated.View>
        ) : (
          <>
            <Animated.View entering={FadeInDown.delay(120).springify().damping(16)} className="mt-5 flex-row" style={{ gap: 10 }}>
              <View style={styles.statCard}>
                <Text style={styles.statKicker}>{t("history.matches")}</Text>
                <Text style={styles.statValue}>{records.length}</Text>
              </View>
              {best ? (
                <LinearGradient
                  colors={["#FF9A6B", "#FF7A45", "#E8552A"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.statCard, { flex: 1.6, flexDirection: "row", alignItems: "center", borderWidth: 0 }]}
                >
                  <View className="flex-1">
                    <Text style={[styles.statKicker, { color: "rgba(255,255,255,0.8)" }]}>{t("history.topWinner")}</Text>
                    <Text style={styles.bestName} numberOfLines={1}>
                      {best.name}
                    </Text>
                    <Text style={styles.bestWins}>{t("history.wins", { count: best.wins })}</Text>
                  </View>
                  <Image source={mimikExpressions.winner} resizeMode="contain" style={{ width: 64, height: 64, marginRight: -6 }} />
                </LinearGradient>
              ) : null}
            </Animated.View>

            <View className="mt-5" style={{ gap: 10 }}>
              {records.map((record, index) => (
                <MatchCard key={record.id} record={record} index={index} />
              ))}
            </View>
          </>
        )}
      </ScrollView>

      <ConfirmDialog
        visible={confirmVisible}
        title={t("history.clearTitle")}
        message={t("history.clearMessage")}
        primaryLabel={t("history.cancel")}
        onPrimary={() => setConfirmVisible(false)}
        secondaryLabel={t("history.clearConfirm")}
        onSecondary={() => {
          clear();
          setConfirmVisible(false);
        }}
        onBackdropPress={() => setConfirmVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.10)",
  },
  title: { fontFamily: "Urbanist_700Bold", fontSize: 40, lineHeight: 44, letterSpacing: -1.2, color: "#FFFFFF" },
  emptyTitle: { marginTop: 16, textAlign: "center", fontFamily: "Urbanist_700Bold", fontSize: 20, color: "#FFFFFF" },
  emptyMessage: { marginTop: 4, textAlign: "center", fontFamily: "Urbanist_400Regular", fontSize: 15, color: "rgba(255,255,255,0.6)" },
  statCard: {
    flex: 1,
    overflow: "hidden",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(255,255,255,0.06)",
    padding: 16,
  },
  statKicker: {
    fontFamily: "Urbanist_700Bold",
    fontSize: 11,
    letterSpacing: 2.5,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.5)",
  },
  statValue: { marginTop: 4, fontFamily: "Urbanist_700Bold", fontSize: 40, color: "#FFFFFF" },
  bestName: { marginTop: 4, fontFamily: "Urbanist_700Bold", fontSize: 22, color: "#FFFFFF" },
  bestWins: { fontFamily: "Urbanist_600SemiBold", fontSize: 13, color: "rgba(255,255,255,0.85)" },
  card: {
    overflow: "hidden",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "#14111E",
  },
  category: { flex: 1, fontFamily: "Urbanist_700Bold", fontSize: 14, color: "#FFFFFF" },
  date: { fontFamily: "Urbanist_400Regular", fontSize: 12, color: "rgba(255,255,255,0.5)" },
  winnerKicker: {
    fontFamily: "Urbanist_700Bold",
    fontSize: 11,
    letterSpacing: 2.5,
    textTransform: "uppercase",
    color: STAGE_GOLD,
  },
  headline: { fontFamily: "Urbanist_700Bold", fontSize: 20, color: "#FFFFFF" },
  winnerScore: { fontFamily: "Urbanist_700Bold", fontSize: 26, color: "#FFFFFF" },
  others: {
    marginTop: 12,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  otherChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    paddingVertical: 3,
    paddingLeft: 3,
    paddingRight: 10,
    backgroundColor: "rgba(255,255,255,0.07)",
  },
  otherName: { fontFamily: "Urbanist_700Bold", fontSize: 12, color: "rgba(255,255,255,0.8)" },
  otherScore: { fontFamily: "Urbanist_400Regular", fontSize: 12, color: "rgba(255,255,255,0.5)" },
});
