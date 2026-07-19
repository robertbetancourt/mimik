import { Accelerometer } from "expo-sensors";
import { useEffect, useRef } from "react";

const UPDATE_INTERVAL_MS = 100;
const TILT_THRESHOLD = 0.6;
const NEUTRAL_THRESHOLD = 0.3;
const COOLDOWN_MS = 700;

export type TiltSensorMode = "gesture" | "neutral" | "off";

interface UseTiltSensorOptions {
  mode: TiltSensorMode;
  onTiltDown: () => void;
  onTiltUp: () => void;
  onCentered: () => void;
}

// One sensor subscription, two behaviors depending on the gameplay state:
// - "gesture": edge-triggered tilt detection (Correct / Pass), same
//   arm/cooldown logic as before.
// - "neutral": just reports when the phone is back near the flat, centered
//   angle — used to leave WAITING_FOR_CENTER without a fixed timer.
// - "off": no subscription at all. Every non-PLAYING, non-WAITING_FOR_CENTER
//   state ignores the sensor completely.
export function useTiltSensor({ mode, onTiltDown, onTiltUp, onCentered }: UseTiltSensorOptions) {
  const armedRef = useRef(true);
  const lastTriggerRef = useRef(0);
  const callbacksRef = useRef({ onTiltDown, onTiltUp, onCentered });
  callbacksRef.current = { onTiltDown, onTiltUp, onCentered };

  useEffect(() => {
    if (mode === "off") return;

    armedRef.current = true;
    Accelerometer.setUpdateInterval(UPDATE_INTERVAL_MS);

    const subscription = Accelerometer.addListener(({ z }) => {
      const isNeutral = Math.abs(z) < NEUTRAL_THRESHOLD;

      if (mode === "neutral") {
        if (isNeutral) callbacksRef.current.onCentered();
        return;
      }

      if (isNeutral) {
        armedRef.current = true;
        return;
      }
      if (!armedRef.current) return;

      const now = Date.now();
      if (now - lastTriggerRef.current < COOLDOWN_MS) return;

      if (z > TILT_THRESHOLD) {
        armedRef.current = false;
        lastTriggerRef.current = now;
        callbacksRef.current.onTiltDown();
      } else if (z < -TILT_THRESHOLD) {
        armedRef.current = false;
        lastTriggerRef.current = now;
        callbacksRef.current.onTiltUp();
      }
    });

    return () => subscription.remove();
  }, [mode]);
}
