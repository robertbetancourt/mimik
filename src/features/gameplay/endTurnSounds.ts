import i18n from "@/i18n";

export interface EndTurnSoundOption {
  id: string;
  label: string;
  file: number;
}

// Add new files here — the picker UI reads this list, nothing else to touch.
export const endTurnSounds: EndTurnSoundOption[] = [
  {
    id: "classic",
    label: i18n.t("endTurnSounds.classic"),
    file: require("../../../assets/sounds/game-finish/end-correct.mp3"),
  },
  {
    id: "retro-arcade",
    label: i18n.t("endTurnSounds.retroArcade"),
    file: require("../../../assets/sounds/game-finish/arcade-retro-game-over.wav"),
  },
  {
    id: "magic-bubbles",
    label: i18n.t("endTurnSounds.magicBubbles"),
    file: require("../../../assets/sounds/game-finish/magic-bubbles-spell.wav"),
  },
];

export const DEFAULT_END_TURN_SOUND_ID = endTurnSounds[0].id;
