"use client";

import { motion } from "framer-motion";
import type { ActivityItem } from "@/types/dashboard";

type ActivityFeedProps = {
  activity: ActivityItem[];
};

const typeMap: Record<
  ActivityItem["type"],
  { label: string; className: string; dotClass: string }
> = {
  completion: {
    label: "Completion",
    className: "feed-item feed-success",
    dotClass: "pulse-dot dot-success",
  },
  new_issue: {
    label: "New issue",
    className: "feed-item feed-blue",
    dotClass: "pulse-dot dot-blue",
  },
  blocker: {
    label: "Blocker",
    className: "feed-item feed-critical",
    dotClass: "pulse-dot dot-critical",
  },
};

export function ActivityFeed({ activity }: ActivityFeedProps) {
  return (
    <aside className="sidebar glass-card">
      <h2 className="sidebar-title">Live Activity</h2>
      <div className="feed-list">
        {activity.length === 0 && (
          <div className="muted">No activity items right now.</div>
        )}
        {activity.map((item, index) => {
          const map = typeMap[item.type];
          return (
            <motion.article
              key={item.id}
              className={map.className}
              initial={{ opacity: 0, x: 18 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.35, delay: index * 0.06 }}
            >
              <div className="feed-row">
                <span className={map.dotClass} />
                <span className="feed-type">{map.label}</span>
                <span className="feed-time">{item.relativeTime}</span>
              </div>
              <p className="feed-summary">
                <strong>{item.actor}</strong> {item.summary}
              </p>
            </motion.article>
          );
        })}
      </div>
    </aside>
  );
}
