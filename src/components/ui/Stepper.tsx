import { Minus, Plus } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

import { IconButton } from "@/components/ui/IconButton";
import { cardShadow } from "@/theme/shadow";

interface StepperProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  formatValue?: (value: number) => string;
}

export function Stepper({ label, value, min, max, step = 1, onChange, formatValue }: StepperProps) {
  const canDecrease = value - step >= min;
  const canIncrease = value + step <= max;

  const [displayValue, setDisplayValue] = useState(value);
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (value === displayValue) return;
    opacity.value = withTiming(0, { duration: 90 }, (finished) => {
      if (finished) runOnJS(setDisplayValue)(value);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 120 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayValue]);

  const valueStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <View style={cardShadow} className="flex-row items-center justify-between rounded-3xl bg-surface px-5 py-4">
      <Text className="font-sans-bold text-base text-ink">{label}</Text>

      <View className="flex-row items-center gap-4">
        <IconButton
          disabled={!canDecrease}
          onPress={() => onChange(value - step)}
          className="h-11 w-11 bg-background"
        >
          <Minus size={20} color="#2B2118" />
        </IconButton>

        <Animated.Text
          style={[{ minWidth: 32, fontFamily: "Urbanist_700Bold", fontSize: 18, textAlign: "center", color: "#2B2118" }, valueStyle]}
        >
          {formatValue ? formatValue(displayValue) : displayValue}
        </Animated.Text>

        <IconButton
          disabled={!canIncrease}
          onPress={() => onChange(value + step)}
          className="h-11 w-11 bg-background"
        >
          <Plus size={20} color="#2B2118" />
        </IconButton>
      </View>
    </View>
  );
}
