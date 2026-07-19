import { createAudioPlayer, type AudioPlayer } from "expo-audio";
import { useEffect, useRef } from "react";

// For one-off previews of a dynamically chosen sound. useAudioPlayer expects
// a fixed source, so each preview creates a fresh player and releases the
// previous one instead.
export function useSoundPreview() {
  const playerRef = useRef<AudioPlayer | null>(null);

  useEffect(() => {
    return () => playerRef.current?.remove();
  }, []);

  function play(source: number) {
    playerRef.current?.remove();
    const player = createAudioPlayer(source);
    playerRef.current = player;
    player.play();
  }

  return { play };
}
