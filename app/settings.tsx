import Constants from "expo-constants";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import * as ScreenOrientation from "expo-screen-orientation";
import { StatusBar } from "expo-status-bar";
import { ChevronLeft, Hand, Music, type LucideIcon, Zap } from "lucide-react-native";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Image, Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { KineticText } from "@/components/stage/KineticText";
import { StageSegmented } from "@/components/stage/StageSegmented";
import { withAlpha } from "@/components/stage/StageGlow";
import { MIX_CATEGORY_ID } from "@/features/categories/mix";
import { getStageAccent, STAGE_BASE } from "@/features/gameplay/stage/palette";
import { StageBackground } from "@/features/gameplay/stage/StageBackground";
import { mimikExpressions } from "@/features/mimik/expressions";
import { TILT_THRESHOLDS, type TiltSensitivity, useSettingsStore } from "@/features/settings/settingsStore";
import { TiltTester } from "@/features/settings/TiltTester";
import { useLockOrientation } from "@/lib/useLockOrientation";

const ACCENT = getStageAccent(MIX_CATEGORY_ID);
const ON_COLOR = "#FF7A45";

function SectionLabel({ label, delay }: { label: string; delay: number }) {
  return (
    <Animated.Text entering={FadeIn.delay(delay).duration(300)} style={styles.sectionLabel}>
      {label}
    </Animated.Text>
  );
}

function Panel({ children, delay }: { children: ReactNode; delay: number }) {
  return (
    <Animated.View entering={FadeInDown.delay(delay).springify().damping(16)} style={styles.panel}>
      {children}
    </Animated.View>
  );
}

function ToggleRow({
  icon: Icon,
  color,
  label,
  description,
  value,
  onChange,
}: {
  icon: LucideIcon;
  color: string;
  label: string;
  description: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <View className="flex-row items-center gap-3">
      <View style={[styles.iconWrap, { backgroundColor: withAlpha(color, 0.18), borderColor: withAlpha(color, 0.4) }]}>
        <Icon size={18} color={color} strokeWidth={2.2} />
      </View>
      <View className="flex-1">
        <Text style={styles.rowTitle}>{label}</Text>
        <Text style={styles.rowDescription}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={(v) => {
          Haptics.selectionAsync();
          onChange(v);
        }}
        trackColor={{ false: "rgba(255,255,255,0.16)", true: ON_COLOR }}
        thumbColor="#FFFFFF"
      />
    </View>
  );
}

export default function Settings() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  useLockOrientation(ScreenOrientation.OrientationLock.PORTRAIT_UP);

  const tiltSensitivity = useSettingsStore((s) => s.tiltSensitivity);
  const setTiltSensitivity = useSettingsStore((s) => s.setTiltSensitivity);
  const touchControls = useSettingsStore((s) => s.touchControls);
  const setTouchControls = useSettingsStore((s) => s.setTouchControls);
  const musicEnabled = useSettingsStore((s) => s.musicEnabled);
  const setMusicEnabled = useSettingsStore((s) => s.setMusicEnabled);
  const roadtripMode = useSettingsStore((s) => s.roadtripMode);
  const setRoadtripMode = useSettingsStore((s) => s.setRoadtripMode);

  const appVersion = Constants.expoConfig?.version ?? "—";

  const sensitivityOptions: { label: string; value: TiltSensitivity }[] = [
    { label: t("settings.sensitivityLow"), value: "low" },
    { label: t("settings.sensitivityMedium"), value: "medium" },
    { label: t("settings.sensitivityHigh"), value: "high" },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: STAGE_BASE }}>
      <StatusBar style="light" />
      <StageBackground accent={ACCENT} dim={0.85} />

      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 32, paddingHorizontal: 16 }}
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

        <View className="mt-5">
          <KineticText text={t("settings.title")} style={styles.title} delay={60} />
        </View>

        {/* ── Controls ───────────────────────────────────────────────────── */}
        <SectionLabel label={t("settings.controls")} delay={150} />
        <Panel delay={180}>
          <Text style={styles.rowTitle}>{t("settings.tiltSensitivity")}</Text>
          <View className="mt-3">
            <StageSegmented options={sensitivityOptions} value={tiltSensitivity} onChange={setTiltSensitivity} />
          </View>
          <View style={styles.divider} />
          <TiltTester active threshold={TILT_THRESHOLDS[tiltSensitivity]} />
        </Panel>
        <Panel delay={240}>
          <ToggleRow
            icon={Hand}
            color="#22D3EE"
            label={t("settings.touchControls")}
            description={t("settings.touchControlsDesc")}
            value={touchControls}
            onChange={setTouchControls}
          />
        </Panel>

        {/* ── Sound ──────────────────────────────────────────────────────── */}
        <SectionLabel label={t("settings.sound")} delay={290} />
        <Panel delay={320}>
          <ToggleRow
            icon={Music}
            color={ACCENT.b}
            label={t("settings.music")}
            description={t("settings.musicDesc")}
            value={musicEnabled}
            onChange={setMusicEnabled}
          />
        </Panel>

        {/* ── Performance ────────────────────────────────────────────────── */}
        <SectionLabel label={t("settings.performance")} delay={370} />
        <Panel delay={400}>
          <ToggleRow
            icon={Zap}
            color="#FFC531"
            label={t("settings.roadtripMode")}
            description={t("settings.roadtripModeDesc")}
            value={roadtripMode}
            onChange={setRoadtripMode}
          />
        </Panel>

        <Animated.View entering={FadeIn.delay(500).duration(400)} className="mt-10 items-center">
          <Image source={mimikExpressions.lookingAtYou} resizeMode="contain" style={{ width: 72, height: 72 }} />
          <Text style={styles.version}>Mimik · v{appVersion}</Text>
        </Animated.View>
      </ScrollView>
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
  title: { fontFamily: "Urbanist_700Bold", fontSize: 40, lineHeight: 44, letterSpacing: -1.2, color: "#FFFFFF" },
  sectionLabel: {
    marginTop: 26,
    marginBottom: 10,
    marginLeft: 4,
    fontFamily: "Urbanist_700Bold",
    fontSize: 12,
    letterSpacing: 3,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.5)",
  },
  panel: {
    marginBottom: 10,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "#14111E",
    padding: 16,
  },
  divider: { height: 1, backgroundColor: "rgba(255,255,255,0.08)", marginVertical: 16 },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  rowTitle: { fontFamily: "Urbanist_700Bold", fontSize: 16, color: "#FFFFFF" },
  rowDescription: { marginTop: 2, fontFamily: "Urbanist_400Regular", fontSize: 13, color: "rgba(255,255,255,0.55)" },
  version: { marginTop: 8, fontFamily: "Urbanist_600SemiBold", fontSize: 12, color: "rgba(255,255,255,0.4)" },
});
