import Constants from "expo-constants";
import * as Haptics from "expo-haptics";
import { useTranslation } from "react-i18next";
import { Switch, Text, View } from "react-native";

import { BottomSheet } from "@/components/ui/BottomSheet";
import { ChipSelector } from "@/components/ui/ChipSelector";
import { type TiltSensitivity, useSettingsStore } from "./settingsStore";

interface SettingsSheetProps {
  visible: boolean;
  onClose: () => void;
}

// ─── Section label ────────────────────────────────────────────────────────────
function SectionLabel({ label }: { label: string }) {
  return (
    <Text className="mb-2 font-sans-bold text-xs uppercase tracking-widest text-ink/40">
      {label}
    </Text>
  );
}

// ─── Toggle row for a boolean setting ────────────────────────────────────────
function ToggleRow({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description?: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <View className="rounded-3xl border border-white/70 bg-white/70 px-5 py-4">
      <View className="flex-row items-center justify-between">
        <View className="flex-1 pr-4">
          <Text className="font-sans-bold text-base text-ink">{label}</Text>
          {description ? (
            <Text className="mt-0.5 font-sans text-sm text-ink/60">{description}</Text>
          ) : null}
        </View>
        <Switch
          value={value}
          onValueChange={(v) => {
            Haptics.selectionAsync();
            onChange(v);
          }}
          trackColor={{ false: "rgba(43,33,24,0.12)", true: "#2B2118" }}
          thumbColor="#FFFFFF"
        />
      </View>
    </View>
  );
}

// ─── Main sheet ──────────────────────────────────────────────────────────────
export function SettingsSheet({ visible, onClose }: SettingsSheetProps) {
  const { t } = useTranslation();

  const tiltSensitivity = useSettingsStore((s) => s.tiltSensitivity);
  const setTiltSensitivity = useSettingsStore((s) => s.setTiltSensitivity);
  const roadtripMode = useSettingsStore((s) => s.roadtripMode);
  const setRoadtripMode = useSettingsStore((s) => s.setRoadtripMode);

  const appVersion = Constants.expoConfig?.version ?? "—";

  const sensitivityOptions: { label: string; value: TiltSensitivity }[] = [
    { label: t("settings.sensitivityLow"), value: "low" },
    { label: t("settings.sensitivityMedium"), value: "medium" },
    { label: t("settings.sensitivityHigh"), value: "high" },
  ];

  return (
    <BottomSheet visible={visible} onClose={onClose} heightRatio={0.62}>
      {/* Title */}
      <Text className="mb-6 font-sans-bold text-2xl text-ink">{t("settings.title")}</Text>

      {/* Controls section */}
      <View className="mb-6 gap-3">
        <SectionLabel label={t("settings.controls")} />
        <ChipSelector
          label={t("settings.tiltSensitivity")}
          options={sensitivityOptions}
          value={tiltSensitivity}
          onChange={(v) => setTiltSensitivity(v as TiltSensitivity)}
        />
      </View>

      {/* Performance section */}
      <View className="mb-6 gap-3">
        <SectionLabel label={t("settings.performance")} />
        <ToggleRow
          label={t("settings.roadtripMode")}
          description={t("settings.roadtripModeDesc")}
          value={roadtripMode}
          onChange={setRoadtripMode}
        />
      </View>

      {/* Version section */}
      <View className="mb-8 mt-4 items-center justify-center">
        <Text className="font-sans text-sm text-ink/40">
          Mimik {t("settings.version").toLowerCase()} {appVersion}
        </Text>
      </View>
    </BottomSheet>
  );
}
