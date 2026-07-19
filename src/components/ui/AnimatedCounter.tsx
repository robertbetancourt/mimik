import { useEffect, useRef, useState } from "react";
import { Text, type TextStyle } from "react-native";

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  className?: string;
  style?: TextStyle;
}

export function AnimatedCounter({ value, duration = 700, className, style }: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const startTime = Date.now();

    function tick() {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      setDisplayValue(Math.round(progress * value));

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
