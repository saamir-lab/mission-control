"use client";

import { motion } from "framer-motion";
import type { ProjectMetric } from "@/types/dashboard";

const healthMap: Record<ProjectMetric["health"], string> = {
  success: "var(--success)",
  warning: "var(--warning)",
  critical: "var(--critical)",
};

type ProjectsSidebarProps = {
  projects: ProjectMetric[];
};

export function ProjectsSidebar({ projects }: ProjectsSidebarProps) {
  return (
    <aside className="panel projects-panel glass">
      <div className="panel-header">
        <h2>Projects</h2>
        <p>Milestone confidence and momentum</p>
      </div>

      <div className="project-list">
        {projects.map((project, idx) => (
          <motion.article
            key={project.id}
            className="project-item"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.32, delay: idx * 0.06 }}
            whileHover={{ y: -2, scale: 1.01 }}
          >
            <div className="project-top">
              <div>
                <h3>{project.title}</h3>
                <p>{project.owner}</p>
              </div>
              <span className="status-pill" style={{ color: healthMap[project.health] }}>
                {project.health === "success"
                  ? "Healthy"
                  : project.health === "warning"
                    ? "At risk"
                    : "Critical"}
              </span>
            </div>

            <div className="progress-track">
              <motion.div
                className="progress-fill"
                initial={{ width: 0 }}
                animate={{ width: `${project.completion}%` }}
                transition={{ duration: 0.7, delay: idx * 0.06 + 0.15 }}
                style={{ background: `linear-gradient(90deg, var(--accent), ${healthMap[project.health]})` }}
              />
            </div>

            <div className="project-meta">
              <span>{project.completion}% complete</span>
              <span>{project.blockers} blockers</span>
            </div>
          </motion.article>
        ))}
      </div>
    </aside>
  );
}
