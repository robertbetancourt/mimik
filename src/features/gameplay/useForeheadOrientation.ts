import { Accelerometer } from "expo-sensors";
import { useEffect, useState } from "react";

const UPDATE_INTERVAL_MS = 200;

// Playing position: phone held upright against the forehead, rotated to
// landscape (long edge horizontal). We can't detect which way the screen
// faces without a camera, so this checks for "held up in landscape" as a
// reliable proxy — the X axis dominates gravity (landscape, standing up)
// and the Z axis (face-flat tilt) is low.
const LANDSCAPE_THRESHOLD = 0.7;
const FLAT_THRESHOLD = 0.5;

export function useForeheadOrientation(): boolean {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    Accelerometer.setUpdateInterval(UPDATE_INTERVAL_MS);

    const subscription = Accelerometer.addListener(({ x, z }) => {
      const isLandscape = Math.abs(x) > LANDSCAPE_THRESHOLD;
      const isUpright = Math.abs(z) < FLAT_THRESHOLD;
      setIsReady(isLandscape && isUpright);
    });

    return () => subscription.remove();
  }, []);

  return isReady;
}
