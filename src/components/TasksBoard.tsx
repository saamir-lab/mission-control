"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { TasksByPerson, TaskItem } from "@/src/types/dashboard";

interface TasksBoardProps {
  tasksByPerson: TasksByPerson[];
}

export function TasksBoard({ tasksByPerson }: TasksBoardProps) {
  const [expandedPerson, setExpandedPerson] = useState<string | null>(null);

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 1: return "bg-critical text-white"; // P1 - Critical
      case 2: return "bg-warning text-white"; // P2 - High
      case 3: return "bg-accent text-white"; // P3 - Medium
      case 4: return "bg-text-muted text-white"; // P4 - Low
      default: return "bg-text-muted text-white";
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

  const toggleExpanded = (personId: string) => {
    setExpandedPerson(expandedPerson === personId ? null : personId);
  };

  return (
    <div className="bg-card backdrop-blur-xl border-t border-border-subtle">
      <div className="p-4">
        <h3 className="text-lg font-semibold text-text-primary mb-4 uppercase tracking-wider">
          Tasks Board — What everyone is working on
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {tasksByPerson.map((person, index) => (
            <motion.div
              key={person.personId}
              className="bg-bg-card border border-border-subtle rounded-lg overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              {/* Person Header */}
              <div
                className="p-4 cursor-pointer hover:bg-border-subtle/50 transition-colors"
                onClick={() => toggleExpanded(person.personId)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      {expandedPerson === person.personId ? (
                        <ChevronDown size={16} className="text-text-secondary" />
                      ) : (
                        <ChevronRight size={16} className="text-text-secondary" />
                      )}
                    </div>
                    <div>
                      <div className="font-semibold text-text-primary">{person.personName}</div>
                      <div className="text-sm text-text-secondary">
                        {person.taskCount} task{person.taskCount !== 1 ? "s" : ""}
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-accent/20 text-accent px-2 py-1 rounded text-sm font-medium">
                    {person.taskCount}
                  </div>
                </div>

                {/* Top Task Preview (when collapsed) */}
                {expandedPerson !== person.personId && person.topTask && (
                  <div className="mt-2 text-sm text-text-muted truncate">
                    {person.topTask}
                  </div>
                )}
              </div>

              {/* Expanded Task List */}
              {expandedPerson === person.personId && (
                <motion.div
                  className="border-t border-border-subtle"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="p-4 space-y-3 max-h-80 overflow-y-auto">
                    {person.tasks.length > 0 ? (
                      person.tasks
                        .sort((a, b) => a.priority - b.priority) // Sort by priority (P1 first)
                        .map((task, taskIndex) => (
                          <motion.div
                            key={task.id}
                            className="p-3 bg-bg-deep rounded-lg border border-border-subtle"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: taskIndex * 0.05 }}
                          >
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="flex-1">
                                <div className="text-sm font-medium text-text-primary line-clamp-2">
                                  {task.title}
                                </div>
                                <div className="text-xs text-text-secondary mt-1">
                                  {task.project}
                                </div>
                              </div>
                              
                              <div className={`px-2 py-1 rounded text-xs font-bold ${getPriorityColor(task.priority)}`}>
                                {getPriorityLabel(task.priority)}
                              </div>
                            </div>

                            <div className="flex items-center justify-between text-xs">
                              <div className="text-text-muted">
                                Status: {task.status}
                              </div>
                              <div className="text-text-muted">
                                {task.relativeTime}
                              </div>
                            </div>
                          </motion.div>
                        ))
                    ) : (
                      <div className="text-center text-text-muted py-4">
                        <div className="text-2xl mb-1">✅</div>
                        <div className="text-sm">No active tasks</div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>

        {tasksByPerson.length === 0 && (
          <div className="text-center text-text-muted py-8">
            <div className="text-4xl mb-2">📋</div>
            <div className="text-lg">No task data available</div>
          </div>
        )}
      </div>
    </div>
  );
}