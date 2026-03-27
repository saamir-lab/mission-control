"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { TopBar } from "@/src/components/TopBar";
import { OrgChart } from "@/src/components/OrgChart";
import { PersonDetail } from "@/src/components/PersonDetail";
import { ProjectsSidebar } from "@/src/components/ProjectsSidebar";
import { ActivityStream } from "@/src/components/ActivityStream";
import { TasksBoard } from "@/src/components/TasksBoard";
import type { DashboardData, PersonDetailData } from "@/src/types/dashboard";

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [selectedPerson, setSelectedPerson] = useState<PersonDetailData | null>(null);
  const [isPersonDetailOpen, setIsPersonDetailOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setError(null);
      const response = await fetch("/api/dashboard", {
        cache: "no-store",
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || "Failed to fetch dashboard data");
      }
      
      const dashboardData = await response.json();
      setData(dashboardData);
    } catch (err) {
      console.error("Failed to fetch dashboard data:", err);
      setError(err instanceof Error ? err.message : "Unknown error occurred");
    } finally {
      setLoading(false);
    }
  };

  const fetchPersonDetail = async (personId: string) => {
    try {
      const response = await fetch(`/api/dashboard?personId=${personId}`);
      if (response.ok) {
        const personData = await response.json();
        setSelectedPerson(personData);
        setIsPersonDetailOpen(true);
      }
    } catch (err) {
      console.error("Failed to fetch person detail:", err);
    }
  };

  const handlePersonClick = (personId: string) => {
    fetchPersonDetail(personId);
  };

  const handleClosePersonDetail = () => {
    setIsPersonDetailOpen(false);
    setSelectedPerson(null);
  };

  const handleProjectClick = (projectId: string) => {
    // Highlight team members working on this project
    console.log("Project clicked:", projectId);
    // TODO: Implement project highlighting in org chart
  };

  // Auto-refresh every 60 seconds
  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="h-screen bg-bg-deep flex items-center justify-center">
        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="w-16 h-16 border-4 border-accent/30 border-t-accent rounded-full animate-spin mx-auto mb-4" />
          <div className="text-text-primary text-xl font-semibold">Loading Mission Control...</div>
          <div className="text-text-secondary text-sm mt-2">Aggregating data from Linear, Slack, and Gmail</div>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen bg-bg-deep flex items-center justify-center">
        <motion.div
          className="text-center max-w-md mx-auto p-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="text-6xl mb-4">⚠️</div>
          <div className="text-text-primary text-xl font-semibold mb-2">
            Mission Control Offline
          </div>
          <div className="text-text-secondary text-sm mb-6">
            {error}
          </div>
          <div className="text-text-muted text-xs mb-4">
            Check your environment variables in .env.local:
            <br />• LINEAR_API_KEY
            <br />• SLACK_TOKEN_RIMO (optional)
            <br />• GOG_KEYRING_PASSWORD (optional)
          </div>
          <button
            onClick={fetchDashboardData}
            className="px-6 py-2 bg-accent hover:bg-accent/80 text-white rounded-lg transition-colors"
          >
            Retry Connection
          </button>
        </motion.div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="h-screen bg-bg-deep overflow-hidden flex flex-col">
      {/* Top Bar */}
      <TopBar
        health={data.health}
        statusLine={data.healthStatusLine}
        lastUpdated={data.generatedAt}
      />

      {/* Main Content Grid */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Projects */}
        <ProjectsSidebar
          projects={data.projects}
          onProjectClick={handleProjectClick}
        />

        {/* Center - Org Chart */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 bg-card backdrop-blur-xl">
            <OrgChart
              nodes={data.orgChart}
              onPersonClick={handlePersonClick}
            />
          </div>

          {/* Bottom - Tasks Board */}
          <div className="h-80">
            <TasksBoard tasksByPerson={data.tasks} />
          </div>
        </div>

        {/* Right Sidebar - Activity Stream */}
        <div className="w-96 bg-card backdrop-blur-xl border-l border-border-subtle">
          <ActivityStream activities={data.activity} />
        </div>
      </div>

      {/* Person Detail Panel */}
      <PersonDetail
        person={selectedPerson}
        isOpen={isPersonDetailOpen}
        onClose={handleClosePersonDetail}
      />
    </div>
  );
}