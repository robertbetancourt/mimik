import { Accelerometer } from "expo-sensors";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

import { TILT_NEUTRAL_THRESHOLD } from "./settingsStore";

interface TiltTesterProps {
  /** Only listens to the sensor while the screen is focused. */
  active: boolean;
  /** Current sensitivity threshold (accelerometer z). */
  threshold: number;
}

const TRACK_HEIGHT = 12;
const KNOB = 24;
// The meter shows z in [-1, 1]; beyond that the phone is past flat.
const RANGE = 1;

const CORRECT = "#4ADE80";
const PASS = "#FB923C";

// Live calibration aid: shows the accelerometer reading against the current
// sensitivity thresholds, so players can feel exactly how far they have to
// tilt before choosing Suave / Normal / Preciso. Uses the same z axis and
// the same thresholds as useTiltSensor — what you see is what the game does.
export function TiltTester({ active, threshold }: TiltTesterProps) {
  const { t } = useTranslation();
  const [available, setAvailable] = useState(true);
  const [zone, setZone] = useState<"pass" | "correct" | "neutral" | "between">("neutral");
  const z = useSharedValue(0);
  const [trackWidth, setTrackWidth] = useState(0);

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    let subscription: { remove: () => void } | null = null;

    Accelerometer.isAvailableAsync()
      .then((isAvailable) => {
        if (cancelled) return;
        setAvailable(isAvailable);
        if (!isAvailable) return;
        Accelerometer.setUpdateInterval(80);
        subscription = Accelerometer.addListener((reading) => {
          const value = Math.max(-RANGE, Math.min(RANGE, reading.z));
          z.value = withTiming(value, { duration: 80 });
          // Same mapping as useGameplaySession: z > threshold → pass, z < -threshold → correct.
          if (value > threshold) setZone("pass");
          else if (value < -threshold) setZone("correct");
          else if (Math.abs(value) < TILT_NEUTRAL_THRESHOLD) setZone("neutral");
          else setZone("between");
        });
      })
      .catch(() => !cancelled && setAvailable(false));

    return () => {
      cancelled = true;
      subscription?.remove();
    };
  }, [active, threshold, z]);

  const knobStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: ((z.value + RANGE) / (2 * RANGE)) * trackWidth - KNOB / 2 }],
  }));

  const toX = (value: number) => ((value + RANGE) / (2 * RANGE)) * trackWidth;

  if (!available) {
    return <Text style={styles.hint}>{t("settings.tiltUnavailable")}</Text>;
  }

  const label =
    zone === "pass" ? t("settings.tiltPass") : zone === "correct" ? t("settings.tiltCorrect") : zone === "neutral" ? t("settings.tiltNeutral") : "…";
  const labelColor = zone === "pass" ? PASS : zone === "correct" ? CORRECT : "rgba(255,255,255,0.8)";

  return (
    <View>
      <View className="flex-row items-center justify-between">
        <Text style={styles.title}>{t("settings.tiltTest")}</Text>
        <Text style={[styles.zone, { color: labelColor }]}>{label}</Text>
      </View>
      <Text style={styles.hint}>{t("settings.tiltTestHint")}</Text>

      <View style={{ marginTop: 16, height: KNOB, justifyContent: "center" }} onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}>
        <View style={styles.track}>
          {trackWidth > 0 ? (
            <>
              <View style={[styles.zoneFill, { left: 0, width: toX(-threshold), backgroundColor: "rgba(74,222,128,0.45)" }]} />
              <View
                style={[
                  styles.zoneFill,
                  {
                    left: toX(-TILT_NEUTRAL_THRESHOLD),
                    width: toX(TILT_NEUTRAL_THRESHOLD) - toX(-TILT_NEUTRAL_THRESHOLD),
                    backgroundColor: "rgba(255,255,255,0.14)",
                  },
                ]}
              />
              <View style={[styles.zoneFill, { left: toX(threshold), right: 0, backgroundColor: "rgba(251,146,60,0.45)" }]} />
            </>
          ) : null}
        </View>
        {trackWidth > 0 ? <Animated.View style={[styles.knob, { borderColor: labelColor }, knobStyle]} /> : null}
      </View>
      <View className="mt-2 flex-row justify-between">
        <Text style={[styles.edge, { color: CORRECT }]}>{t("settings.tiltCorrect")}</Text>
        <Text style={[styles.edge, { color: PASS }]}>{t("settings.tiltPass")}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: "Urbanist_700Bold", fontSize: 16, color: "#FFFFFF" },
  zone: { fontFamily: "Urbanist_700Bold", fontSize: 15 },
  hint: { marginTop: 2, fontFamily: "Urbanist_400Regular", fontSize: 13, color: "rgba(255,255,255,0.55)" },
  track: {
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  zoneFill: { position: "absolute", top: 0, bottom: 0 },
  knob: {
    position: "absolute",
    width: KNOB,
    height: KNOB,
    borderRadius: KNOB / 2,
    borderWidth: 3,
    backgroundColor: "#0B0912",
  },
  edge: { fontFamily: "Urbanist_700Bold", fontSize: 12 },
});
