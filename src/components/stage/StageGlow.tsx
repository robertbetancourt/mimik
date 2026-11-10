import { useId } from "react";
import Svg, { Defs, RadialGradient, Rect, Stop } from "react-native-svg";

interface StageGlowProps {
  color: string;
  width: number;
  height?: number;
  /** Peak opacity at the center. */
  intensity?: number;
}

/** Soft radial light — puts a "spotlight" behind illustrations and numbers. */
export function StageGlow({ color, width, height = width, intensity = 0.6 }: StageGlowProps) {
  const id = useId().replace(/:/g, "");
  return (
    <Svg width={width} height={height} pointerEvents="none">
      <Defs>
        <RadialGradient id={id} cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor={color} stopOpacity={intensity} />
          <Stop offset="0.5" stopColor={color} stopOpacity={intensity * 0.35} />
          <Stop offset="1" stopColor={color} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Rect width={width} height={height} fill={`url(#${id})`} />
    </Svg>
  );
}

/** "#RRGGBB" → "rgba(r, g, b, a)". Android gradients need explicit rgba. */
export function withAlpha(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
