import { useEffect, useRef, useState } from "react";
import { useWindowDimensions, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from "react-native-reanimated";

const CONFETTI_COLORS = [
  "#FF7A45", // Mimik Orange
  "#FF3B30", // Vibrant Red
  "#3DBE6C", // Emerald Green
  "#FFC145", // Gold Yellow
  "#5B8DEF", // Electric Blue
  "#A855F7", // Purple
];

const SHAPES = ["rect", "circle", "diamond", "ribbon"] as const;
type Shape = (typeof SHAPES)[number];

// Perf: kept deliberately conservative rather than device-tier-detecting —
// detecting "low-end" reliably needs a native module (extra dependency,
// extra complexity) and is easy to get wrong. A single fixed count that's
// safe on low-end hardware benefits every device, not just the ones a
// heuristic correctly identifies. 48 total (two 16-particle cannons + a
// 16-particle shower) is well under the 95 of the original design and
// still reads as a clearly bigger, more dynamic burst than the previous
// single-anchor version.
const CANNON_PARTICLES_PER_SIDE = 16;
const SHOWER_PARTICLES = 16;

interface Particle {
  id: number;
  originX: number;
  originY: number;
  targetX: number;
  targetY: number;
  delay: number;
  duration: number;
  shape: Shape;
  color: string;
  size: number;
  rotation: number;
  wobbleX: number;
}

function createCannonParticle(id: number, side: "left" | "right", screenWidth: number, screenHeight: number): Particle {
  const isLeft = side === "left";
  const originX = isLeft ? 20 : screenWidth - 20;
  const originY = screenHeight * 0.85;

  // Velocity aimed up and towards center with random spread.
  const angleDeg = isLeft ? -75 + (Math.random() * 40 - 20) : -105 + (Math.random() * 40 - 20);
  const angleRad = (angleDeg * Math.PI) / 180;
  const distance = screenHeight * (0.4 + Math.random() * 0.45);

  const targetX = originX + Math.cos(angleRad) * distance;
  const targetY = originY + Math.sin(angleRad) * distance + screenHeight * 0.35;

  return {
    id,
    originX,
    originY,
    targetX,
    targetY,
    delay: Math.random() * 250,
    duration: 1800 + Math.random() * 900,
    shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    size: 7 + Math.random() * 9,
    rotation: Math.random() * 720 - 360,
    wobbleX: (Math.random() - 0.5) * 60,
  };
}

function createShowerParticle(id: number, screenWidth: number, screenHeight: number): Particle {
  const originX = Math.random() * screenWidth;
  const originY = -20 - Math.random() * 100;
  const targetX = originX + (Math.random() - 0.5) * 120;
  const targetY = screenHeight + 40;

  return {
    id,
    originX,
    originY,
    targetX,
    targetY,
    delay: 300 + Math.random() * 1500,
    duration: 2500 + Math.random() * 1500,
    shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    size: 6 + Math.random() * 8,
    rotation: Math.random() * 1080,
    wobbleX: (Math.random() - 0.5) * 80,
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
  if (shape === "ribbon") {
    return <View style={{ width: size * 0.4, height: size * 1.8, borderRadius: 2, backgroundColor: color }} />;
  }
  return <View style={{ width: size * 0.8, height: size * 1.2, borderRadius: 2, backgroundColor: color }} />;
}

function AnimatedParticle({ particle, active }: { particle: Particle; active: boolean }) {
  const opacity = useSharedValue(0);
  const posX = useSharedValue(particle.originX);
  const posY = useSharedValue(particle.originY);
  const rotate = useSharedValue(0);

  useEffect(() => {
    if (!active) return;

    opacity.value = withDelay(
      particle.delay,
      withSequence(
        withTiming(1, { duration: 150 }),
        withTiming(1, { duration: particle.duration * 0.6 }),
        withTiming(0, { duration: particle.duration * 0.25 }),
      ),
    );

    posX.value = withDelay(
      particle.delay,
      withTiming(particle.targetX + particle.wobbleX, {
        duration: particle.duration,
        easing: Easing.out(Easing.quad),
      }),
    );

    posY.value = withDelay(
      particle.delay,
      withTiming(particle.targetY, {
        duration: particle.duration,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      }),
    );

    rotate.value = withDelay(
      particle.delay,
      withTiming(particle.rotation, { duration: particle.duration, easing: Easing.linear }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, particle]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: posX.value }, { translateY: posY.value }, { rotate: `${rotate.value}deg` }],
  }));

  return (
    <Animated.View style={[{ position: "absolute", top: 0, left: 0 }, style]}>
      <ShapeView shape={particle.shape} size={particle.size} color={particle.color} />
    </Animated.View>
  );
}

interface ConfettiBurstProps {
  enabled: boolean;
}

// Sync point: fires exactly once, the instant `enabled` flips true — i.e.
// the moment the winner lands, not the earlier reveal spring. Dual cannons
// from the bottom corners plus a light shower from the top, all in a single
// burst — no repeating waves, matching "no continuous screen-filling".
export function ConfettiBurst({ enabled }: ConfettiBurstProps) {
  const { width, height } = useWindowDimensions();
  const [active, setActive] = useState(false);
  const hasBurstRef = useRef(false);
  const particlesRef = useRef<Particle[]>([]);

  useEffect(() => {
    if (!enabled || hasBurstRef.current) return;
    hasBurstRef.current = true;

    const leftCannon = Array.from({ length: CANNON_PARTICLES_PER_SIDE }, (_, i) =>
      createCannonParticle(i, "left", width, height),
    );
    const rightCannon = Array.from({ length: CANNON_PARTICLES_PER_SIDE }, (_, i) =>
      createCannonParticle(CANNON_PARTICLES_PER_SIDE + i, "right", width, height),
    );
    const shower = Array.from({ length: SHOWER_PARTICLES }, (_, i) =>
      createShowerParticle(CANNON_PARTICLES_PER_SIDE * 2 + i, width, height),
    );

    particlesRef.current = [...leftCannon, ...rightCannon, ...shower];
    setActive(true);
  }, [enabled, width, height]);

  if (!active) return null;

  return (
    <View pointerEvents="none" style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}>
      {particlesRef.current.map((particle) => (
        <AnimatedParticle key={particle.id} particle={particle} active={active} />
      ))}
    </View>
  );
}
