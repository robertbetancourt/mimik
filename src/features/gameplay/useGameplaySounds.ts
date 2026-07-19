import { useAudioPlayer } from "expo-audio";

const correctSound = require("../../../assets/sounds/long-pop.wav");
const passSound = require("../../../assets/sounds/arrow-whoosh.wav");
const timeUpSound = require("../../../assets/sounds/end-correct.mp3");

export function useGameplaySounds() {
  const correctPlayer = useAudioPlayer(correctSound);
  const passPlayer = useAudioPlayer(passSound);
  const timeUpPlayer = useAudioPlayer(timeUpSound);

  function playCorrect() {
    correctPlayer.seekTo(0);
    correctPlayer.play();
  }

  function playPass() {
    passPlayer.seekTo(0);
    passPlayer.play();
  }

  function playTimeUp() {
    timeUpPlayer.seekTo(0);
    timeUpPlayer.play();
  }

  return { playCorrect, playPass, playTimeUp };
}
