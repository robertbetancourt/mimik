import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";

interface StageSegmentedProps<T extends string | number> {
  options: { label: string; value: T }[];
  value: T;
  onChange: (value: T) => void;
}

const PADDING = 4;
const SLIDE_SPRING = { damping: 18, stiffness: 260, mass: 0.8 };

// Pill selector for the dark stage. One glowing orange indicator slides
// under the selected option (instead of each chip swapping colors), so a
// change reads as motion, not as a flicker.
export function StageSegmented<T extends string | number>({ options, value, onChange }: StageSegmentedProps<T>) {
  const [width, setWidth] = useState(0);
  const selectedIndex = Math.max(
    options.findIndex((o) => o.value === value),
    0,
  );
  const segmentWidth = width > 0 ? (width - PADDING * 2) / options.length : 0;
  const x = useSharedValue(0);

  useEffect(() => {
    if (segmentWidth === 0) return;
    x.value = withSpring(selectedIndex * segmentWidth, SLIDE_SPRING);
  }, [selectedIndex, segmentWidth, x]);

  const indicatorStyle = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));

  return (
    <View style={styles.track} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      {segmentWidth > 0 ? (
        <Animated.View style={[styles.indicator, { width: segmentWidth }, indicatorStyle]}>
          <LinearGradient
            colors={["#FF9A6B", "#FF7A45", "#E8552A"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      ) : null}
      {options.map((option, index) => {
        const selected = index === selectedIndex;
        return (
          <Pressable
            key={String(option.value)}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => {
              if (selected) return;
              Haptics.selectionAsync();
              onChange(option.value);
            }}
            style={styles.segment}
          >
            <Text numberOfLines={1} style={[styles.label, selected && styles.labelSelected]}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: "row",
    padding: PADDING,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  indicator: {
    position: "absolute",
    top: PADDING,
    bottom: PADDING,
    left: PADDING,
    borderRadius: 999,
    overflow: "hidden",
  },
  segment: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 10, paddingHorizontal: 4 },
  label: { fontFamily: "Urbanist_700Bold", fontSize: 14, color: "rgba(255,255,255,0.7)" },
  labelSelected: { color: "#FFFFFF" },
});
