// Mimik is flat: surfaces separate through tint, borders and light (glows on
// the dark stage), not drop shadows. The old warm drop shadows read as a
// generic "card UI" and fought the stage look, so the two everyday levels
// are intentionally empty. Only floating overlays (sheets, dialogs) keep a
// soft shadow so they still lift off whatever is behind them.

export const cardShadow = {};

export const buttonShadow = {};

export const overlayShadow = {
  shadowColor: "#000000",
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.25,
  shadowRadius: 18,
  elevation: 12,
};
