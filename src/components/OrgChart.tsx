"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { StatusDot } from "./ui/StatusDot";
import type { OrgChartNode } from "@/src/types/dashboard";

interface OrgChartProps {
  nodes: OrgChartNode[];
  onPersonClick: (personId: string) => void;
}

export function OrgChart({ nodes, onPersonClick }: OrgChartProps) {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  // Group nodes by level
  const nodesByLevel = nodes.reduce((acc, node) => {
    if (!acc[node.level]) acc[node.level] = [];
    acc[node.level].push(node);
    return acc;
  }, {} as Record<number, OrgChartNode[]>);

  const getUtilizationColor = (utilization?: number) => {
    if (!utilization) return "bg-border-subtle";
    if (utilization >= 85) return "bg-critical";
    if (utilization >= 70) return "bg-warning";
    return "bg-success";
  };

  const getNodeWidth = (level: number) => {
    switch (level) {
      case 1: return "w-48"; // Founder - wider
      case 2: return "w-40"; // Co-founders
      case 3: return "w-36"; // Team
      case 4: return "w-32"; // Hiring slots
      default: return "w-36";
    }
  };

  const getNodeAccent = (node: OrgChartNode) => {
    if (node.level === 1) return "border-founder-gold bg-founder-gold/5"; // Founder
    if (node.isHiring) return "border-dashed border-border-subtle bg-border-subtle/5";
    return "border-accent/30 bg-accent/5";
  };

  return (
    <div className="h-full flex flex-col justify-center items-center p-6 relative">
      {/* SVG for connection lines */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
        <defs>
          <linearGradient id="connectionGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgb(99, 102, 241)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="rgb(99, 102, 241)" stopOpacity="0.1" />
          </linearGradient>
        </defs>
        
        {/* Draw connection lines between levels */}
        {Object.entries(nodesByLevel).map(([level, levelNodes]) => {
          const currentLevel = parseInt(level);
          const nextLevel = nodesByLevel[currentLevel + 1];
          
          if (!nextLevel) return null;
          
          return levelNodes.map((parentNode, parentIndex) => 
            nextLevel.map((childNode, childIndex) => (
              <motion.line
                key={`${parentNode.id}-${childNode.id}`}
                x1="50%"
                y1={`${(currentLevel - 1) * 25 + 15}%`}
                x2="50%"
                y2={`${currentLevel * 25 + 5}%`}
                stroke="url(#connectionGradient)"
                strokeWidth="2"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 1, delay: currentLevel * 0.2 }}
              />
            ))
          );
        })}
      </svg>

      {/* Org chart levels */}
      <div className="relative z-10 space-y-8">
        {Object.entries(nodesByLevel)
          .sort(([a], [b]) => parseInt(a) - parseInt(b))
          .map(([level, levelNodes]) => (
            <motion.div
              key={level}
              className="flex justify-center items-center gap-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: parseInt(level) * 0.1 }}
            >
              {levelNodes.map((node) => (
                <motion.div
                  key={node.id}
                  className={`
                    ${getNodeWidth(node.level)} p-4 rounded-xl border backdrop-blur-sm
                    ${getNodeAccent(node)}
                    cursor-pointer transition-all duration-200
                    hover:scale-105 hover:shadow-lg
                    ${hoveredNode === node.id ? "ring-2 ring-accent/50" : ""}
                  `}
                  onClick={() => !node.isHiring && onPersonClick(node.id)}
                  onMouseEnter={() => setHoveredNode(node.id)}
                  onMouseLeave={() => setHoveredNode(null)}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className={`font-semibold ${node.level === 1 ? "text-founder-gold" : "text-text-primary"}`}>
                        {node.name}
                      </div>
                      <div className="text-xs text-text-secondary uppercase tracking-wider">
                        {node.role}
                      </div>
                    </div>
                    {!node.isHiring && (
                      <StatusDot status={node.status} pulse={node.status === "active"} />
                    )}
                  </div>

                  {!node.isHiring && (
                    <>
                      {/* Task count badge */}
                      {node.activeTaskCount !== undefined && (
                        <div className="flex items-center gap-2 mb-2">
                          <div className="bg-accent/20 text-accent px-2 py-1 rounded text-xs font-medium">
                            {node.activeTaskCount} tasks
                          </div>
                        </div>
                      )}

                      {/* Utilization bar */}
                      {node.utilization !== undefined && (
                        <div className="mb-2">
                          <div className="flex justify-between text-xs text-text-secondary mb-1">
                            <span>Utilization</span>
                            <span>{node.utilization}%</span>
                          </div>
                          <div className="w-full bg-bg-card rounded-full h-1.5 overflow-hidden">
                            <motion.div
                              className={`h-full ${getUtilizationColor(node.utilization)} rounded-full`}
                              initial={{ width: 0 }}
                              animate={{ width: `${node.utilization}%` }}
                              transition={{ duration: 1, delay: parseInt(level) * 0.2 }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Current task */}
                      {node.currentTask && (
                        <div className="text-xs text-text-muted truncate">
                          {node.currentTask}
                        </div>
                      )}
                    </>
                  )}

                  {node.isHiring && (
                    <div className="text-center text-text-muted">
                      <div className="text-2xl mb-1">+</div>
                      <div className="text-xs">Open Position</div>
                    </div>
                  )}
                </motion.div>
              ))}
            </motion.div>
          ))}
      </div>
    </div>
  );
}