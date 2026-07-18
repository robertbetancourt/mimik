import { Pressable, Text, View } from "react-native";

interface ChipOption<T extends string | number> {
  label: string;
  value: T;
}

interface ChipSelectorProps<T extends string | number> {
  label: string;
  options: ChipOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

export function ChipSelector<T extends string | number>({
  label,
  options,
  value,
  onChange,
}: ChipSelectorProps<T>) {
  return (
    <View className="rounded-3xl bg-surface px-5 py-4">
      <Text className="font-sans-bold text-base text-ink">{label}</Text>

      <View className="mt-3 flex-row gap-2">
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <Pressable
              key={option.value}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => onChange(option.value)}
              className={`flex-1 items-center rounded-full px-3 py-2 ${
                selected ? "bg-primary" : "bg-background"
              }`}
            >
              <Text className={`font-sans-bold text-sm ${selected ? "text-white" : "text-ink/70"}`}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
