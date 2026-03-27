"use client";

import { motion } from "framer-motion";
import { ProgressBar } from "./ui/ProgressBar";
import type { ProjectMetric } from "@/src/types/dashboard";

interface ProjectsSidebarProps {
  projects: ProjectMetric[];
  onProjectClick?: (projectId: string) => void;
}

export function ProjectsSidebar({ projects, onProjectClick }: ProjectsSidebarProps) {
  const getHealthColor = (health: ProjectMetric["health"]): "success" | "warning" | "critical" => {
    return health;
  };

  const getHealthBorder = (health: ProjectMetric["health"]) => {
    switch (health) {
      case "success":
        return "border-success/30 hover:border-success/50";
      case "warning":
        return "border-warning/30 hover:border-warning/50";
      case "critical":
        return "border-critical/30 hover:border-critical/50";
      default:
        return "border-border-subtle hover:border-border-hover";
    }
  };

  return (
    <div className="w-80 bg-card backdrop-blur-xl border-r border-border-subtle p-6 h-full overflow-y-auto">
      <h3 className="text-lg font-semibold text-text-primary mb-6 uppercase tracking-wider">
        Projects
      </h3>
      
      <div className="space-y-4">
        {projects.map((project, index) => (
          <motion.div
            key={project.id}
            className={`
              p-4 rounded-xl border backdrop-blur-sm transition-all duration-200 
              hover:scale-[1.02] cursor-pointer bg-bg-card
              ${getHealthBorder(project.health)}
            `}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            whileHover={{ y: -2 }}
            onClick={() => onProjectClick?.(project.id)}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h4 className="font-medium text-text-primary text-sm leading-tight line-clamp-2">
                  {project.title}
                </h4>
                <div className="flex items-center gap-2 mt-1">
                  {project.ownerAvatar && (
                    <div className="w-4 h-4 bg-accent/20 rounded-full flex items-center justify-center">
                      <span className="text-xs text-accent font-medium">
                        {project.owner.charAt(0)}
                      </span>
                    </div>
                  )}
                  <p className="text-text-secondary text-xs">
                    {project.owner}
                  </p>
                </div>
              </div>
              
              {project.blockers > 0 && (
                <div className="bg-critical/20 text-critical px-2 py-1 rounded text-xs font-medium border border-critical/30">
                  {project.blockers}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs text-text-secondary">
                <span>Progress</span>
                <span>{project.completion}%</span>
              </div>
              
              <ProgressBar
                value={project.completion}
                health={getHealthColor(project.health)}
              />
              
              {/* Health indicator */}
              <div className="flex items-center justify-between text-xs">
                <div className={`
                  px-2 py-1 rounded capitalize font-medium
                  ${project.health === "success" ? "bg-success/10 text-success border border-success/30" : ""}
                  ${project.health === "warning" ? "bg-warning/10 text-warning border border-warning/30" : ""}
                  ${project.health === "critical" ? "bg-critical/10 text-critical border border-critical/30" : ""}
                `}>
                  {project.health}
                </div>
                {project.blockers > 0 && (
                  <span className="text-critical">
                    {project.blockers} blocker{project.blockers !== 1 ? "s" : ""}
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      
      {projects.length === 0 && (
        <div className="text-center text-text-muted py-8">
          <div className="text-4xl mb-2">📊</div>
          <div className="text-sm">No active projects</div>
        </div>
      )}
    </div>
  );
}