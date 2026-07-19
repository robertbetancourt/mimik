import { Platform } from "react-native";

// A 3-level elevation system, shared across the whole app so depth reads
// consistently instead of every panel inventing its own soft, foggy shadow.
// Shadow color is a warm brown (not neutral grey/black) to match the warm
// background palette, and every level stays tight and close to the
// component rather than diffused.

// Level 1 — cards, list rows, chip panels. Barely there, just enough to
// separate a surface panel from the warm background behind it.
export const cardShadow = Platform.select({
  ios: {
    shadowColor: "#4A2E1A",
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  android: {
    elevation: 1.5,
  },
  default: {},
});

// Level 2 — the primary CTA. Grounded enough to feel pressable, warmer
// (tinted with the button's own orange) than the neutral card shadow.
export const buttonShadow = Platform.select({
  ios: {
    shadowColor: "#B4431C",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.24,
    shadowRadius: 5,
  },
  android: {
    elevation: 4,
  },
  default: {},
});

// Level 3 — bottom sheets and dialogs, the highest surface in the app.
export const overlayShadow = Platform.select({
  ios: {
    shadowColor: "#3A2413",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 9,
  },
  android: {
    elevation: 10,
  },
  default: {},
});
