import { useAudioPlayer } from "expo-audio";

const celebrationSound = require("../../../assets/sounds/end-correct.mp3");

export function useCelebrationSound() {
  const player = useAudioPlayer(celebrationSound);

  function play() {
    player.seekTo(0);
    player.play();
  }

  return { play };
}
