export interface EndTurnSoundOption {
  id: string;
  label: string;
  file: number;
}

// Add new files here — the picker UI reads this list, nothing else to touch.
export const endTurnSounds: EndTurnSoundOption[] = [
  {
    id: "classic",
    label: "Clásico",
    file: require("../../../assets/sounds/game-finish/end-correct.mp3"),
  },
  {
    id: "retro-arcade",
    label: "Retro Arcade",
    file: require("../../../assets/sounds/game-finish/arcade-retro-game-over.wav"),
  },
  {
    id: "magic-bubbles",
    label: "Magic Bubbles",
    file: require("../../../assets/sounds/game-finish/magic-bubbles-spell.wav"),
  },
];

export const DEFAULT_END_TURN_SOUND_ID = endTurnSounds[0].id;
