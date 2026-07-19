import { Minus, Plus } from "lucide-react-native";
import { Text, View } from "react-native";

import { IconButton } from "@/components/ui/IconButton";

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

  return (
    <View className="flex-row items-center justify-between rounded-3xl bg-surface px-5 py-4">
      <Text className="font-sans-bold text-base text-ink">{label}</Text>

      <View className="flex-row items-center gap-4">
        <IconButton
          disabled={!canDecrease}
          onPress={() => onChange(value - step)}
          className="h-11 w-11 bg-background"
        >
          <Minus size={20} color="#2B2118" />
        </IconButton>

        <Text className="min-w-[32px] text-center font-sans-bold text-lg text-ink">
          {formatValue ? formatValue(value) : value}
        </Text>

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
