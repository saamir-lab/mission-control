"use client";

import { motion } from "framer-motion";
import { AnimatedCounter } from "./AnimatedCounter";

interface HealthRingProps {
  value: number;
  size?: number;
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export function HealthRing({ value, size = 100 }: HealthRingProps) {
  const bounded = clamp(value, 0, 100);
  const radius = (size - 16) / 2; // Account for stroke width
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (bounded / 100) * circumference;

  const getHealthColor = (score: number) => {
    if (score >= 75) return "#10b981"; // success
    if (score >= 50) return "#f59e0b"; // warning
    return "#ef4444"; // critical
  };

  const healthColor = getHealthColor(bounded);

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg
        className="transform -rotate-90"
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        aria-label={`Health score: ${bounded}%`}
      >
        <defs>
          <linearGradient id={`healthGradient-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={healthColor} stopOpacity="0.8" />
            <stop offset="100%" stopColor={healthColor} stopOpacity="1" />
          </linearGradient>
        </defs>
        
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(99, 102, 241, 0.1)"
          strokeWidth="8"
        />
        
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#healthGradient-${size})`}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />
      </svg>
      
      {/* Center value */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold text-text-primary">
            <AnimatedCounter value={bounded} />
          </div>
        </div>
      </div>
    </div>
  );
}
