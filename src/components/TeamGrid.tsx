"use client";

import { motion } from "framer-motion";
import type { DashboardData, TeamMember } from "@/types/dashboard";
import { AnimatedCounter } from "./AnimatedCounter";

type TeamGridProps = {
  members: DashboardData["team"];
  hiring: DashboardData["hiring"];
  selectedMemberId: string | null;
  onSelect: (member: TeamMember) => void;
};

const statusTone: Record<TeamMember["status"], string> = {
  active: "status-success",
  busy: "status-warning",
  review: "status-critical",
};

function MemberCard({
  member,
  selected,
  onSelect,
}: {
  member: TeamMember;
  selected: boolean;
  onSelect: (member: TeamMember) => void;
}) {
  const strategicPreview = member.strategicPriorities?.slice(0, 2) ?? [];

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -6, boxShadow: "0 24px 50px rgba(0,0,0,.45)" }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className={`glass-card member-card ${member.isCofounder ? "member-card-wide" : ""} ${
        selected ? "member-card-selected" : ""
      }`}
      onClick={() => onSelect(member)}
    >
      <div className="member-card-top">
        <div>
          <p className="member-name">{member.name}</p>
          <p className="member-role">{member.role}</p>
        </div>
        <span className={`status-dot ${statusTone[member.status]}`} />
      </div>
      <p className="member-focus">{member.focusSummary}</p>
      {strategicPreview.length > 0 && (
        <ul className="member-priority-preview">
          {strategicPreview.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}
      <div className="member-metrics">
        <div>
          <span className="metric-label">Open work</span>
          <span className="metric-value">
            <AnimatedCounter value={member.activeWork} />
          </span>
        </div>
        <div>
          <span className="metric-label">Utilization</span>
          <span className="metric-value">
            <AnimatedCounter value={member.utilization} suffix="%" />
          </span>
        </div>
        <div>
          <span className="metric-label">Monthly</span>
          <span className="metric-value">{member.compensation}</span>
        </div>
      </div>
    </motion.button>
  );
}

function HiringCard({ title }: { title: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35 }}
      className="glass-card member-card member-card-ghost"
    >
      <p className="member-name">{title}</p>
      <p className="member-role">Hiring slot</p>
      <p className="member-focus">Position reserved for immediate recruitment.</p>
    </motion.div>
  );
}

export function TeamGrid({ members, hiring, selectedMemberId, onSelect }: TeamGridProps) {
  return (
    <section className="team-grid-wrap">
      <div className="section-heading">
        <h2>Team</h2>
        <p>People powering execution right now</p>
      </div>
      <div className="team-grid">
        {members.map((member) => (
          <MemberCard
            key={member.id}
            member={member}
            selected={selectedMemberId === member.id}
            onSelect={onSelect}
          />
        ))}
        {hiring.map((slot) => (
          <HiringCard key={slot.id} title={slot.title} />
        ))}
      </div>
    </section>
  );
}
