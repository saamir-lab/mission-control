"use client";

import { motion } from "framer-motion";
import { CheckCircle, AlertCircle, Plus, MessageSquare, Mail } from "lucide-react";
import type { ActivityItem } from "@/src/types/dashboard";

interface ActivityStreamProps {
  activities: ActivityItem[];
}

export function ActivityStream({ activities }: ActivityStreamProps) {
  const getActivityIcon = (type: ActivityItem["type"]) => {
    switch (type) {
      case "completion":
        return <CheckCircle size={16} className="text-success" />;
      case "blocker":
        return <AlertCircle size={16} className="text-critical" />;
      case "new_issue":
        return <Plus size={16} className="text-accent" />;
      case "slack_message":
        return <MessageSquare size={16} className="text-client" />;
      case "email":
        return <Mail size={16} className="text-email" />;
      default:
        return <div className="w-4 h-4 rounded-full bg-text-muted" />;
    }
  };

  const getActivityColor = (type: ActivityItem["type"]) => {
    switch (type) {
      case "completion":
        return "border-l-success bg-success/5";
      case "blocker":
        return "border-l-critical bg-critical/5";
      case "new_issue":
        return "border-l-accent bg-accent/5";
      case "slack_message":
        return "border-l-client bg-client/5";
      case "email":
        return "border-l-email bg-email/5";
      default:
        return "border-l-text-muted bg-text-muted/5";
    }
  };

  const getSourceBadge = (source: ActivityItem["source"]) => {
    const badges = {
      linear: { label: "Linear", color: "bg-accent/20 text-accent" },
      slack: { label: "Slack", color: "bg-client/20 text-client" },
      email: { label: "Email", color: "bg-email/20 text-email" },
    };
    
    const badge = badges[source];
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${badge.color}`}>
        {badge.label}
      </span>
    );
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 px-4 pt-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-text-primary">Activity Stream</h3>
          <div className="flex items-center gap-1 px-2 py-1 bg-success/10 border border-success/30 rounded">
            <div className="w-1.5 h-1.5 bg-success rounded-full animate-pulse" />
            <span className="text-success text-xs font-medium">LIVE</span>
          </div>
        </div>
      </div>

      {/* Activity List */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {activities.length > 0 ? (
          <div className="space-y-3">
            {activities.map((activity, index) => (
              <motion.div
                key={activity.id}
                className={`
                  p-3 rounded-lg border-l-4 backdrop-blur-sm
                  ${getActivityColor(activity.type)}
                `}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {getActivityIcon(activity.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex-1">
                        <div className="text-sm font-medium text-text-primary">
                          {activity.actor}
                        </div>
                        <div className="text-sm text-text-secondary line-clamp-2">
                          {activity.summary}
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end gap-1">
                        <div className="text-xs text-text-muted whitespace-nowrap">
                          {activity.relativeTime}
                        </div>
                        {getSourceBadge(activity.source)}
                      </div>
                    </div>

                    {activity.priority && activity.priority === "high" && (
                      <div className="inline-flex items-center gap-1 px-2 py-1 bg-critical/10 border border-critical/30 rounded text-xs text-critical font-medium">
                        <AlertCircle size={12} />
                        High Priority
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-32">
            <div className="text-center text-text-muted">
              <div className="text-4xl mb-2">📡</div>
              <div className="text-sm">No recent activity</div>
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="border-t border-border-subtle p-3">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-2">
            <CheckCircle size={12} className="text-success" />
            <span className="text-text-muted">Completions</span>
          </div>
          <div className="flex items-center gap-2">
            <AlertCircle size={12} className="text-critical" />
            <span className="text-text-muted">Blockers</span>
          </div>
          <div className="flex items-center gap-2">
            <Plus size={12} className="text-accent" />
            <span className="text-text-muted">New Work</span>
          </div>
          <div className="flex items-center gap-2">
            <MessageSquare size={12} className="text-client" />
            <span className="text-text-muted">Client Messages</span>
          </div>
        </div>
      </div>
    </div>
  );
}