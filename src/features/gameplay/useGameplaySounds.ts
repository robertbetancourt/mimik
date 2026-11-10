import { useAudioPlayer } from "expo-audio";

const correctSound = require("../../../assets/sounds/long-pop.wav");
const passSound = require("../../../assets/sounds/arrow-whoosh.wav");

export function useGameplaySounds() {
  const correctPlayer = useAudioPlayer(correctSound);
  const passPlayer = useAudioPlayer(passSound);

  function playCorrect() {
    correctPlayer.seekTo(0);
    correctPlayer.play();
  }

  function playPass() {
    passPlayer.seekTo(0);
    passPlayer.play();
  }

  return { playCorrect, playPass };
}
