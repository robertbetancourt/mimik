import * as Haptics from "expo-haptics";
import { ChevronLeft, ChevronRight, Minus, Play, Plus } from "lucide-react-native";
import { useEffect, useState, type ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from "react-native-reanimated";

/** Dark glass panel — the one surface every stage screen builds on. */
export function StagePanel({ children, style }: { children: ReactNode; style?: object }) {
  return <View style={[styles.panel, style]}>{children}</View>;
}

export function StageLabel({ children }: { children: ReactNode }) {
  return <Text style={styles.rowTitle}>{children}</Text>;
}

function RoundButton({ onPress, disabled, children, filled }: { onPress: () => void; disabled?: boolean; children: ReactNode; filled?: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={() => {
        Haptics.selectionAsync();
        onPress();
      }}
      hitSlop={6}
    >
      {/* Styles live on an inner View: NativeWind's Pressable wrapper drops
          function-style `style` props, so the pressed state is applied here. */}
      {({ pressed }) => (
        <View
          style={[
            styles.round,
            filled && { backgroundColor: "#FF7A45" },
            { opacity: disabled ? 0.3 : pressed ? 0.6 : 1, transform: [{ scale: pressed ? 0.92 : 1 }] },
          ]}
        >
          {children}
        </View>
      )}
    </Pressable>
  );
}

interface StageStepperProps {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  formatValue?: (value: number) => string;
}

/** − value + with the number popping on every change. */
export function StageStepper({ label, value, min, max, onChange, formatValue }: StageStepperProps) {
  const pop = useSharedValue(1);
  const [shown, setShown] = useState(value);

  useEffect(() => {
    if (value === shown) return;
    setShown(value);
    pop.value = withSequence(withTiming(1.35, { duration: 90 }), withSpring(1, { damping: 9, stiffness: 300 }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const popStyle = useAnimatedStyle(() => ({ transform: [{ scale: pop.value }] }));

  return (
    <View className="flex-row items-center justify-between">
      <StageLabel>{label}</StageLabel>
      <View className="flex-row items-center gap-3">
        <RoundButton disabled={value <= min} onPress={() => onChange(value - 1)}>
          <Minus size={18} color="#FFFFFF" />
        </RoundButton>
        <Animated.Text style={[styles.stepValue, popStyle]}>{formatValue ? formatValue(shown) : shown}</Animated.Text>
        <RoundButton disabled={value >= max} onPress={() => onChange(value + 1)}>
          <Plus size={18} color="#FFFFFF" />
        </RoundButton>
      </View>
    </View>
  );
}

interface StageSoundSelectorProps {
  label: string;
  options: { id: string; label: string }[];
  selectedId: string;
  onChange: (id: string) => void;
  onPreview: (id: string) => void;
}

/** ‹ sound name ▶ › — changing the sound also previews it. */
export function StageSoundSelector({ label, options, selectedId, onChange, onPreview }: StageSoundSelectorProps) {
  const selectedIndex = Math.max(
    options.findIndex((o) => o.id === selectedId),
    0,
  );
  const selected = options[selectedIndex];

  function selectByOffset(offset: number) {
    const next = options[(selectedIndex + offset + options.length) % options.length];
    onChange(next.id);
    onPreview(next.id);
  }

  return (
    <View>
      <StageLabel>{label}</StageLabel>
      <View className="mt-3 flex-row items-center justify-between">
        <RoundButton onPress={() => selectByOffset(-1)}>
          <ChevronLeft size={20} color="#FFFFFF" />
        </RoundButton>
        <View className="flex-1 flex-row items-center justify-center gap-3">
          <Animated.Text key={selected?.id} style={styles.soundName}>
            {selected?.label}
          </Animated.Text>
          <RoundButton filled onPress={() => onPreview(selectedId)}>
            <Play size={14} color="#FFFFFF" fill="#FFFFFF" />
          </RoundButton>
        </View>
        <RoundButton onPress={() => selectByOffset(1)}>
          <ChevronRight size={20} color="#FFFFFF" />
        </RoundButton>
      </View>
    </View>
  );
}

export const stageStyles = StyleSheet.create({
  hint: { marginTop: 8, fontFamily: "Urbanist_400Regular", fontSize: 12, color: "rgba(255,255,255,0.5)" },
  divider: { height: 1, backgroundColor: "rgba(255,255,255,0.08)", marginVertical: 16 },
  sectionLabel: {
    marginTop: 26,
    marginBottom: 10,
    marginLeft: 4,
    fontFamily: "Urbanist_700Bold",
    fontSize: 12,
    letterSpacing: 3,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.5)",
  },
});

const styles = StyleSheet.create({
  panel: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "#14111E",
    padding: 16,
  },
  rowTitle: { fontFamily: "Urbanist_700Bold", fontSize: 16, color: "#FFFFFF" },
  round: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.10)",
  },
  stepValue: { minWidth: 34, textAlign: "center", fontFamily: "Urbanist_700Bold", fontSize: 22, color: "#FFFFFF" },
  soundName: { fontFamily: "Urbanist_700Bold", fontSize: 16, color: "#FFFFFF" },
});
