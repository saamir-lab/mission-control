"use client";

import { motion } from "framer-motion";
import { AnimatedCounter } from "../AnimatedCounter";

interface MetricPillProps {
  label: string;
  value: number;
  color?: "success" | "warning" | "critical" | "accent";
  delay?: number;
}

export function MetricPill({ label, value, color = "accent", delay = 0 }: MetricPillProps) {
  const colorClasses = {
    success: "border-success/30 bg-success/10 text-success",
    warning: "border-warning/30 bg-warning/10 text-warning",
    critical: "border-critical/30 bg-critical/10 text-critical",
    accent: "border-accent/30 bg-accent/10 text-accent",
  };

  return (
    <motion.div
      className={`
        px-4 py-2 rounded-lg border backdrop-blur-sm
        ${colorClasses[color]}
      `}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay, ease: "easeOut" }}
    >
      <div className="text-xs uppercase tracking-wider font-medium opacity-80">
        {label}
      </div>
      <div className="text-2xl font-bold">
        <AnimatedCounter value={value} />
      </div>
    </motion.div>
  );
}