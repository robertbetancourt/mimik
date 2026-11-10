import { useEffect, useRef, useState } from "react";
import { Text, type TextStyle } from "react-native";

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  className?: string;
  style?: TextStyle;
}

// Counts from the previously shown value to the new one — the first render
// counts up from 0, later changes (e.g. fixing a word on Turn Results) tick
// from where the number already was instead of restarting from zero.
export function AnimatedCounter({ value, duration = 700, className, style }: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const displayRef = useRef(0);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const startTime = Date.now();
    const from = displayRef.current;

    function tick() {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const next = Math.round(from + (value - from) * progress);
      displayRef.current = next;
      setDisplayValue(next);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      }
    }

    tick();

    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, [value, duration]);

  return (
    <Text className={className} style={style}>
      {displayValue}
    </Text>
  );
}
