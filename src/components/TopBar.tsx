"use client";

import { motion } from "framer-motion";
import { HealthRing } from "./HealthRing";
import { MetricPill } from "./ui/MetricPill";
import type { HealthBreakdown } from "@/src/types/dashboard";

interface TopBarProps {
  health: HealthBreakdown;
  statusLine: string;
  lastUpdated: string;
}

export function TopBar({ health, statusLine, lastUpdated }: TopBarProps) {
  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getHealthColor = (score: number): "success" | "warning" | "critical" => {
    if (score >= 75) return "success";
    if (score >= 50) return "warning";
    return "critical";
  };

  return (
    <motion.div
      className="bg-card backdrop-blur-xl border-b border-border-subtle p-6"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className="flex items-center justify-between">
        {/* Left: Title and Health */}
        <div className="flex items-center gap-8">
          <div>
            <motion.h1
              className="text-3xl font-bold text-text-primary tracking-tight"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              RIMO MISSION CONTROL
            </motion.h1>
            <motion.p
              className="text-text-secondary mt-1 text-lg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {statusLine}
            </motion.p>
          </div>
          
          <div className="flex items-center gap-2">
            <HealthRing value={health.composite} size={80} />
            <div className="text-sm text-text-secondary">
              <div className="font-medium">Health</div>
              <div className="text-xs opacity-75">●{health.composite}</div>
            </div>
          </div>
        </div>

        {/* Right: Metrics and Status */}
        <div className="flex items-center gap-4">
          <div className="grid grid-cols-2 gap-3">
            <MetricPill
              label="Velocity"
              value={health.velocity}
              color={getHealthColor(health.velocity)}
              delay={0.1}
            />
            <MetricPill
              label="Blockers"
              value={health.blockers}
              color={getHealthColor(health.blockers)}
              delay={0.2}
            />
            <MetricPill
              label="Team Load"
              value={health.utilization}
              color={getHealthColor(health.utilization)}
              delay={0.3}
            />
            <MetricPill
              label="Overdue"
              value={health.overdue}
              color={getHealthColor(health.overdue)}
              delay={0.4}
            />
          </div>

          {/* Live Status */}
          <motion.div
            className="flex items-center gap-2 px-4 py-2 bg-success/10 border border-success/30 rounded-lg"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
          >
            <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
            <div className="text-sm">
              <div className="text-success font-medium">LIVE</div>
              <div className="text-success/80 text-xs">{formatTime(lastUpdated)}</div>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}