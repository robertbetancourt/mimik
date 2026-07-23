import { useAudioPlayer } from "expo-audio";

const correctSound = require("../../../assets/sounds/long-pop.wav");
const passSound = require("../../../assets/sounds/arrow-whoosh.wav");
const tickSound = require("../../../assets/sounds/clock-time.mp3");
const urgentSound = require("../../../assets/sounds/countdown-urgent.wav");

export function useGameplaySounds() {
  const correctPlayer = useAudioPlayer(correctSound);
  const passPlayer = useAudioPlayer(passSound);
  const tickPlayer = useAudioPlayer(tickSound);
  const urgentPlayer = useAudioPlayer(urgentSound);

  function playCorrect() {
    correctPlayer.seekTo(0);
    correctPlayer.play();
  }

  function playPass() {
    passPlayer.seekTo(0);
    passPlayer.play();
  }

  // Ticks once per second from 10s down to 4s, then switches to a more
  // urgent tone for the final 3-2-1 — paired with TimerBar turning red at
  // the same 10s threshold so audio and visual agree on when it's tense.
  function playCountdownTick() {
    tickPlayer.seekTo(0);
    tickPlayer.play();
  }

  function playCountdownUrgent() {
    urgentPlayer.seekTo(0);
    urgentPlayer.play();
  }

  return { playCorrect, playPass, playCountdownTick, playCountdownUrgent };
}
