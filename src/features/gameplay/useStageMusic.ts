import { useAudioPlayer } from "expo-audio";
import { useEffect, useRef } from "react";

import { useSettingsStore } from "@/features/settings/settingsStore";

const stageLoop = require("../../../assets/sounds/music/stage-loop.wav");

const MUSIC_VOLUME = 0.32;
const BASE_RATE = 1;
// Over the turn the groove speeds up gradually, then jumps for the final
// stretch so the music itself tells everyone time is almost out.
const RAMP_EXTRA = 0.14;
const URGENT_RATE = 1.22;
const FINAL_RATE = 1.32;

export function stageMusicRate(timeRemaining: number, totalSeconds: number): number {
  if (timeRemaining <= 3) return FINAL_RATE;
  if (timeRemaining <= 10) return URGENT_RATE;
  const elapsed = totalSeconds > 0 ? 1 - Math.min(timeRemaining / totalSeconds, 1) : 0;
  return BASE_RATE + RAMP_EXTRA * elapsed;
}

interface UseStageMusicOptions {
  /** True while the turn is live (playing / feedback / re-centering). */
  active: boolean;
  timeRemaining: number;
  totalSeconds: number;
}

export function useStageMusic({ active, timeRemaining, totalSeconds }: UseStageMusicOptions) {
  const musicEnabled = useSettingsStore((s) => s.musicEnabled);
  const player = useAudioPlayer(stageLoop);
  const startedRef = useRef(false);

  useEffect(() => {
    player.loop = true;
    player.volume = MUSIC_VOLUME;
    // Pitch rises with speed on purpose — it adds to the tension.
    player.shouldCorrectPitch = false;
  }, [player]);

  useEffect(() => {
    if (!musicEnabled) {
      if (startedRef.current) player.pause();
      return;
    }
    if (active) {
      player.play();
      startedRef.current = true;
    } else if (startedRef.current) {
      player.pause();
    }
  }, [active, musicEnabled, player]);

  const rate = stageMusicRate(timeRemaining, totalSeconds);
  useEffect(() => {
    if (!musicEnabled) return;
    try {
      player.setPlaybackRate(rate);
    } catch {
      // Some platforms reject rate changes before the source is loaded —
      // the next tick simply tries again.
    }
  }, [rate, musicEnabled, player]);
}
