import { Minus, Plus } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";

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
        <Pressable
          accessibilityRole="button"
          disabled={!canDecrease}
          onPress={() => onChange(value - step)}
          className={`h-11 w-11 items-center justify-center rounded-full bg-background ${
            canDecrease ? "" : "opacity-30"
          }`}
        >
          <Minus size={20} color="#2B2118" />
        </Pressable>

        <Text className="min-w-[32px] text-center font-sans-bold text-lg text-ink">
          {formatValue ? formatValue(value) : value}
        </Text>

        <Pressable
          accessibilityRole="button"
          disabled={!canIncrease}
          onPress={() => onChange(value + step)}
          className={`h-11 w-11 items-center justify-center rounded-full bg-background ${
            canIncrease ? "" : "opacity-30"
          }`}
        >
          <Plus size={20} color="#2B2118" />
        </Pressable>
      </View>
    </View>
  );
}
