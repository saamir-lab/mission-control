"use client";

import { useEffect, useState } from "react";

type AnimatedCounterProps = {
  value: number;
  durationMs?: number;
  suffix?: string;
};

export function AnimatedCounter({
  value,
  durationMs = 1200,
  suffix = "",
}: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let frame = 0;
    const totalFrames = Math.max(1, Math.round(durationMs / 16));
    const step = value / totalFrames;
    const timer = window.setInterval(() => {
      frame += 1;
      const next = Math.min(value, Math.round(frame * step));
      setDisplayValue(next);
      if (frame >= totalFrames) {
        window.clearInterval(timer);
      }
    }, 16);

    return () => window.clearInterval(timer);
  }, [durationMs, value]);

  return (
    <span>
      {displayValue}
      {suffix}
    </span>
  );
}
