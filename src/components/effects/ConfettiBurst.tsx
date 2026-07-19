import { useEffect, useRef, useState } from "react";
import { useWindowDimensions, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSequence, withTiming } from "react-native-reanimated";

const CONFETTI_COLORS = ["#FF7A45", "#3DBE6C", "#FFC145", "#5B8DEF", "#FF6F91"];
const SHAPES = ["rect", "circle", "diamond"] as const;
type Shape = (typeof SHAPES)[number];

const NORMAL_PARTICLE_COUNT = 9;
const BIG_PARTICLE_COUNT = 30;
const WAVE_GAP_MS = 4000;
const NORMAL_WAVE_SPAN_MS = 2000;
// Perf/battery: the podium screen can sit idle a long time — stop spawning
// waves after a handful instead of forever.
const MAX_WAVES = 4;

interface Particle {
  x: number;
  driftX: number;
  delay: number;
  duration: number;
  rise: number;
  shape: Shape;
  color: string;
  size: number;
  rotation: number;
}

function randomParticle(x: number, big: boolean): Particle {
  return {
    x,
    driftX: (Math.random() - 0.5) * (big ? 90 : 60),
    delay: Math.random() * (big ? 220 : 300),
    // "fall speed variation" — the big burst spreads timing further apart.
    duration: big ? 900 + Math.random() * 700 : 1200 + Math.random() * 300,
    rise: big ? 75 + Math.random() * 65 : 80 + Math.random() * 20,
    shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    size: big ? 8 + Math.random() * 9 : 6 + Math.random() * 6,
    rotation: Math.random() * 360,
  };
}

function ShapeView({ shape, size, color }: { shape: Shape; size: number; color: string }) {
  if (shape === "circle") {
    return <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color }} />;
  }
  if (shape === "diamond") {
    return (
      <View style={{ width: size, height: size, backgroundColor: color, transform: [{ rotate: "45deg" }] }} />
    );
  }
  return <View style={{ width: size * 0.7, height: size * 1.3, borderRadius: 1.5, backgroundColor: color }} />;
}

function ConfettiParticle({ particle, active }: { particle: Particle; active: boolean }) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(0);
  const translateX = useSharedValue(0);
  const rotate = useSharedValue(particle.rotation);

  useEffect(() => {
    if (!active) return;

    opacity.value = withDelay(
      particle.delay,
      withSequence(withTiming(1, { duration: 220 }), withTiming(0, { duration: particle.duration - 220 })),
    );
    translateY.value = withDelay(particle.delay, withTiming(-particle.rise, { duration: particle.duration }));
    translateX.value = withDelay(particle.delay, withTiming(particle.driftX, { duration: particle.duration }));
    rotate.value = withDelay(
      particle.delay,
      withTiming(particle.rotation + 140, { duration: particle.duration }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, particle]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: translateY.value },
      { translateX: translateX.value },
      { rotate: `${rotate.value}deg` },
    ],
  }));

  return (
    <Animated.View style={[{ position: "absolute", left: particle.x, bottom: 0 }, style]}>
      <ShapeView shape={particle.shape} size={particle.size} color={particle.color} />
    </Animated.View>
  );
}

interface ConfettiBurstProps {
  enabled: boolean;
}

// Sync point: the biggest burst fires exactly when `enabled` flips true,
// i.e. the instant the winner lands (not the earlier reveal spring). Settles
// into short, subtle waves every few seconds, capped so it never runs forever.
export function ConfettiBurst({ enabled }: ConfettiBurstProps) {
  const { width } = useWindowDimensions();
  const anchorX = width / 2;
  const [wave, setWave] = useState(0);
  const hasBurstRef = useRef(false);

  const bigParticles = useRef<Particle[]>(
    Array.from({ length: BIG_PARTICLE_COUNT }, () => randomParticle(Math.random() * width, true)),
  ).current;

  const normalParticles = useRef<Particle[]>(
    Array.from({ length: NORMAL_PARTICLE_COUNT }, () =>
      randomParticle(anchorX + (Math.random() - 0.5) * 160, false),
    ),
  ).current;

  useEffect(() => {
    if (!enabled || hasBurstRef.current) return;
    hasBurstRef.current = true;

    setWave(1);
    const interval = setInterval(() => {
      setWave((current) => {
        if (current >= MAX_WAVES) {
          clearInterval(interval);
          return current;
        }
        return current + 1;
      });
    }, NORMAL_WAVE_SPAN_MS + WAVE_GAP_MS);

    return () => clearInterval(interval);
  }, [enabled]);

  if (!enabled || wave === 0) return null;

  const particles = wave === 1 ? bigParticles : normalParticles;

  return (
    <View pointerEvents="none" style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}>
      {particles.map((particle, index) => (
        <ConfettiParticle key={`${wave}-${index}`} particle={particle} active={enabled} />
      ))}
    </View>
  );
}
