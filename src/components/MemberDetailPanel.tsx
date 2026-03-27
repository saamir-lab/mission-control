"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { TeamMember } from "@/src/types/dashboard";

type MemberDetailPanelProps = {
  member: TeamMember | null;
  onClose: () => void;
};

export function MemberDetailPanel({ member, onClose }: MemberDetailPanelProps) {
  return (
    <AnimatePresence>
      {member ? (
        <>
          <motion.button
            className="panel-overlay"
            type="button"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.aside
            className="member-panel glass-card"
            initial={{ x: 420, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 420, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <div className="member-panel-header">
              <div>
                <p className="eyebrow">{member.role}</p>
                <h2>{member.name}</h2>
              </div>
              <button className="panel-close" type="button" onClick={onClose}>
                Close
              </button>
            </div>
            <p className="member-focus">{member.focusSummary}</p>
            <div className="member-panel-stats">
              <div>
                <span>Comp</span>
                <strong>{member.compensation}</strong>
              </div>
              <div>
                <span>Utilization</span>
                <strong>{member.utilization}%</strong>
              </div>
              <div>
                <span>Active Work</span>
                <strong>{member.activeWork}</strong>
              </div>
            </div>
            {member.strategicPriorities?.length ? (
              <div className="priority-list">
                <h3>Strategic priorities</h3>
                <ul>
                  {member.strategicPriorities.map((priority) => (
                    <li key={priority}>{priority}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}
