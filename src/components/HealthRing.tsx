"use client";

import { motion } from "framer-motion";
import { AnimatedCounter } from "@/components/AnimatedCounter";

type HealthRingProps = {
  score: number;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export function HealthRing({ score }: HealthRingProps) {
  const bounded = clamp(score, 0, 100);
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (bounded / 100) * circumference;

  return (
    <div className="health-ring-wrap">
      <svg className="health-ring-svg" viewBox="0 0 100 100" aria-label="Team health score">
        <defs>
          <linearGradient id="healthGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" />
            <stop offset="100%" />
          </linearGradient>
        </defs>
        <circle className="health-ring-track" cx="50" cy="50" r={radius} />
        <motion.circle
          className="health-ring-progress"
          cx="50"
          cy="50"
          r={radius}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
      </svg>
      <div className="health-ring-value">
        <AnimatedCounter value={bounded} suffix="%" durationMs={1200} />
      </div>
    </div>
  );
}
