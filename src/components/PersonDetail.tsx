"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { StatusDot } from "./ui/StatusDot";
import { ProgressBar } from "./ui/ProgressBar";
import type { PersonDetailData, TaskItem, SlackMessage } from "@/src/types/dashboard";

interface PersonDetailProps {
  person: PersonDetailData | null;
  isOpen: boolean;
  onClose: () => void;
}

export function PersonDetail({ person, isOpen, onClose }: PersonDetailProps) {
  if (!person) return null;

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 1: return "text-critical bg-critical/10 border-critical/30"; // P1 - Critical
      case 2: return "text-warning bg-warning/10 border-warning/30"; // P2 - High
      case 3: return "text-accent bg-accent/10 border-accent/30"; // P3 - Medium
      case 4: return "text-text-muted bg-text-muted/10 border-text-muted/30"; // P4 - Low
      default: return "text-text-muted bg-text-muted/10 border-text-muted/30";
    }
  };

  const getPriorityLabel = (priority: number) => {
    switch (priority) {
      case 1: return "P1";
      case 2: return "P2";
      case 3: return "P3";
      case 4: return "P4";
      default: return "P?";
    }
  };

  const getUtilizationColor = (utilization: number): "success" | "warning" | "critical" => {
    if (utilization >= 85) return "critical";
    if (utilization >= 70) return "warning";
    return "success";
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            className="fixed right-0 top-0 h-full w-96 bg-card backdrop-blur-xl border-l border-border-subtle z-50 overflow-y-auto"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-text-primary">{person.name}</h2>
                  <p className="text-text-secondary uppercase tracking-wider text-sm">{person.role}</p>
                  <p className="text-text-muted text-sm mt-1">{person.compensation}</p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-border-subtle rounded-lg transition-colors"
                >
                  <X size={20} className="text-text-secondary" />
                </button>
              </div>

              {/* Status & Utilization */}
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-3">
                  <StatusDot status={person.status} size="lg" pulse={person.status === "active"} />
                  <span className="text-text-primary capitalize font-medium">{person.status}</span>
                </div>
                <div>
                  <div className="flex justify-between text-sm text-text-secondary mb-2">
                    <span>Utilization</span>
                    <span>{person.utilization}%</span>
                  </div>
                  <ProgressBar
                    value={person.utilization}
                    health={getUtilizationColor(person.utilization)}
                  />
                </div>
              </div>

              {/* Active Tasks */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-text-primary mb-3">Active Tasks</h3>
                {person.activeTasks.length > 0 ? (
                  <div className="space-y-3">
                    {person.activeTasks.map((task) => (
                      <motion.div
                        key={task.id}
                        className="p-3 bg-bg-card rounded-lg border border-border-subtle"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="text-sm font-medium text-text-primary line-clamp-2">
                              {task.title}
                            </div>
                            <div className="text-xs text-text-secondary mt-1">
                              {task.project} • {task.relativeTime}
                            </div>
                          </div>
                          <div className={`px-2 py-1 rounded text-xs font-medium border ${getPriorityColor(task.priority)}`}>
                            {getPriorityLabel(task.priority)}
                          </div>
                        </div>
                        <div className="text-xs text-text-muted">
                          Status: {task.status}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <p className="text-text-muted text-sm">No active tasks</p>
                )}
              </div>

              {/* Completed This Week */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-text-primary mb-2">This Week</h3>
                <div className="bg-success/10 border border-success/30 rounded-lg p-3">
                  <div className="text-success font-bold text-2xl">{person.completedThisWeek}</div>
                  <div className="text-success/80 text-sm">Tasks Completed</div>
                </div>
              </div>

              {/* Blockers */}
              {person.blockers.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-text-primary mb-3">Blockers</h3>
                  <div className="space-y-2">
                    {person.blockers.map((blocker, index) => (
                      <motion.div
                        key={index}
                        className="p-3 bg-critical/10 border border-critical/30 rounded-lg"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <div className="text-critical text-sm font-medium">{blocker}</div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Slack Activity */}
              {person.recentSlackActivity.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-text-primary mb-3">Recent Slack Activity</h3>
                  <div className="space-y-3">
                    {person.recentSlackActivity.slice(0, 5).map((message) => (
                      <motion.div
                        key={message.id}
                        className="p-3 bg-bg-card rounded-lg border border-border-subtle"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="text-xs text-client font-medium">#{message.channelName}</div>
                          <div className="text-xs text-text-muted">{message.relativeTime}</div>
                        </div>
                        <div className="text-sm text-text-primary">{message.text}</div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Time Allocation */}
              {Object.keys(person.timeAllocation).length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-text-primary mb-3">Time Allocation</h3>
                  <div className="space-y-3">
                    {Object.entries(person.timeAllocation).map(([project, percentage]) => (
                      <div key={project}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-text-primary">{project}</span>
                          <span className="text-text-secondary">{percentage}%</span>
                        </div>
                        <ProgressBar value={percentage} health="success" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}