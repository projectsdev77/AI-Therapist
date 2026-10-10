import { useMemo } from "react";
import { WEATHERS, type Weather } from "@/lib/conversation/types";
import { seeded } from "@/lib/design/random";
import styles from "./sky.module.css";

export interface SkyProps {
  /** null = no sessions yet (a quiet, neutral sky). */
  weather: Weather | null;
  /** "full" fills its positioned parent as a background; "tile" is a compact thumbnail. */
  variant?: "full" | "tile";
  className?: string;
  /** Seed so tiles in a strip don't all look identical. */
  seed?: number;
}

const LAYERS = [...WEATHERS, "unknown"] as const;

function Rain({ count, seed, heavy }: { count: number; seed: number; heavy: boolean }) {
  const drops = useMemo(() => {
    const rnd = seeded(seed);
    return Array.from({ length: count }, () => ({
      left: rnd() * 100,
      delay: -rnd() * 3,
      duration: (heavy ? 0.7 : 1.3) + rnd() * 0.8,
      opacity: 0.15 + rnd() * (heavy ? 0.35 : 0.25),
    }));
  }, [count, seed, heavy]);
  return (
    <div className={styles.particles} aria-hidden>
      {drops.map((d, i) => (
        <span
          key={i}
          className={styles.drop}
          style={{
            left: `${d.left}%`,
            animationDelay: `${d.delay}s`,
            animationDuration: `${d.duration}s`,
            opacity: d.opacity,
          }}
        />
      ))}
    </div>
  );
}

function Stars({ count, seed }: { count: number; seed: number }) {
  const stars = useMemo(() => {
    const rnd = seeded(seed);
    return Array.from({ length: count }, () => ({
      left: rnd() * 100,
      top: rnd() * 65,
      size: 1 + rnd() * 1.8,
      delay: -rnd() * 6,
      duration: 3 + rnd() * 5,
    }));
  }, [count, seed]);
  return (
    <div className={`${styles.particles} ${styles.stars}`} aria-hidden>
      {stars.map((s, i) => (
        <span
          key={i}
          className={styles.star}
          style={{
            left: `${s.left}%`,
            top: `${s.top}%`,
            width: s.size,
            height: s.size,
            animationDelay: `${s.delay}s`,
            animationDuration: `${s.duration}s`,
          }}
        />
      ))}
    </div>
  );
}

function Haze({ seed }: { seed: number }) {
  const blobs = useMemo(() => {
    const rnd = seeded(seed);
    return Array.from({ length: 4 }, () => ({
      left: rnd() * 80 - 10,
      top: 20 + rnd() * 60,
      size: 40 + rnd() * 40,
      delay: -rnd() * 30,
    }));
  }, [seed]);
  return (
    <div className={styles.particles} aria-hidden>
      {blobs.map((b, i) => (
        <span
          key={i}
          className={styles.haze}
          style={{
            left: `${b.left}%`,
            top: `${b.top}%`,
            width: `${b.size}%`,
            height: `${b.size * 0.5}%`,
            animationDelay: `${b.delay}s`,
          }}
        />
      ))}
    </div>
  );
}

export function Sky({ weather, variant = "full", className = "", seed = 1 }: SkyProps) {
  const active = weather ?? "unknown";
  const tile = variant === "tile";
  return (
    <div
      className={`${styles.sky} ${tile ? styles.tile : ""} ${className}`}
      data-weather={active}
      aria-hidden
    >
      {LAYERS.map((w) => (
        <div
          key={w}
          className={styles.layer}
          style={{
            background: `linear-gradient(to bottom, var(--sky-${w}-top), var(--sky-${w}-bottom))`,
            opacity: w === active ? 1 : 0,
          }}
        />
      ))}
      {(active === "clear" || active === "unknown") && <Stars count={tile ? 8 : active === "clear" ? 60 : 24} seed={seed} />}
      {active === "clear" && <div className={styles.sunGlow} />}
      {active === "haze" && <Haze seed={seed} />}
      {active === "drizzle" && <Rain count={tile ? 10 : 45} seed={seed} heavy={false} />}
      {active === "storm" && <Rain count={tile ? 22 : 110} seed={seed} heavy />}
      {active === "breaking" && <div className={styles.horizonGlow} />}
    </div>
  );
}
