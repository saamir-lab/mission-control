"use client";

import { motion } from "framer-motion";

interface ProgressBarProps {
  value: number; // 0-100
  health?: "success" | "warning" | "critical";
  className?: string;
  showLabel?: boolean;
}

export function ProgressBar({ value, health = "success", className = "", showLabel = false }: ProgressBarProps) {
  const clampedValue = Math.max(0, Math.min(100, value));

  const colorClasses = {
    success: "bg-success",
    warning: "bg-warning", 
    critical: "bg-critical",
  };

  return (
    <div className={`w-full ${className}`}>
      <div className="bg-bg-card rounded-full h-2 overflow-hidden border border-border-subtle">
        <motion.div
          className={`h-full ${colorClasses[health]} rounded-full`}
          initial={{ width: 0 }}
          animate={{ width: `${clampedValue}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </div>
      {showLabel && (
        <div className="text-xs text-text-secondary mt-1">
          {clampedValue}%
        </div>
      )}
    </div>
  );
}