// Mimik's expression sheet. Metro needs literal require() calls, so every
// pose the app uses is listed here once and referenced by name elsewhere.
export const mimikExpressions = {
  lookingAtYou: require("../../../branding/mimik/looking-at-you.png"),
  waiting: require("../../../branding/mimik/waiting.png"),
  celebration: require("../../../branding/mimik/celebration.png"),
  facepalm: require("../../../branding/mimik/facepalm.png"),
  evilSmile: require("../../../branding/mimik/evil-sonrise.png"),
  love: require("../../../branding/mimik/love.png"),
  winner: require("../../../branding/mimik/winner.png"),
  slowClap: require("../../../branding/mimik/slow-clap.png"),
  popcorn: require("../../../branding/mimik/popcorn.png"),
  holdingLaughter: require("../../../branding/mimik/holding-back-laughter.png"),
} as const;

export type MimikExpression = keyof typeof mimikExpressions;
