"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import type { DashboardData, TeamMember } from "@/types/dashboard";
import { HealthRing } from "@/components/HealthRing";
import { ProjectsSidebar } from "@/components/ProjectsSidebar";
import { TeamGrid } from "@/components/TeamGrid";
import { ActivityFeed } from "@/components/ActivityFeed";
import { MemberDetailPanel } from "@/components/MemberDetailPanel";
import { AnimatedCounter } from "@/components/AnimatedCounter";

const REFRESH_INTERVAL_MS = 60_000;

export default function HomePage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = async () => {
    try {
      setError(null);
      const res = await fetch("/api/dashboard", { cache: "no-store" });
      if (!res.ok) {
        throw new Error(`Dashboard fetch failed: ${res.status}`);
      }
      const json = (await res.json()) as DashboardData;
      setData(json);
    } catch (err) {
      console.error(err);
      setError("Unable to load live mission data right now.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadDashboard();
    const timer = window.setInterval(() => {
      void loadDashboard();
    }, REFRESH_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, []);

  const generatedLabel = useMemo(() => {
    if (!data) return "Loading live feed...";
    return new Date(data.generatedAt).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }, [data]);

  return (
    <main className="dashboard-shell">
      <motion.div
        className="background-glow glow-a"
        animate={{ opacity: [0.4, 0.7, 0.4], scale: [1, 1.08, 1] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="background-glow glow-b"
        animate={{ opacity: [0.35, 0.6, 0.35], scale: [1, 1.06, 1] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />

      <header className="health-bar glass-panel">
        <div>
          <h1 className="dashboard-title">Mission Control V4</h1>
          <p className="dashboard-subtitle">
            Bloomberg Terminal precision, NASA mission clarity
          </p>
        </div>
        <div className="health-main">
          <HealthRing score={data?.health.composite ?? 0} />
          <div className="health-meta">
            <div className="health-score">
              <AnimatedCounter value={data?.health.composite ?? 0} /> / 100
            </div>
            <p className="status-line">
              {data?.healthStatusLine ??
                "Team is productive. 2 milestones behind. 3 blockers need attention."}
            </p>
            <p className="updated-label">Updated at {generatedLabel}</p>
            <div className="health-breakdown">
              <span>
                Velocity <strong>{data?.health.velocity ?? 0}</strong>
              </span>
              <span>
                Blockers <strong>{data?.health.blockers ?? 0}</strong>
              </span>
              <span>
                Utilization <strong>{data?.health.utilization ?? 0}</strong>
              </span>
              <span>
                Overdue <strong>{data?.health.overdue ?? 0}</strong>
              </span>
            </div>
          </div>
        </div>
      </header>

      <section className="dashboard-grid">
        <aside className="grid-left glass-panel">
          <div className="sidebar-title-wrap">
            <h2>Projects</h2>
            <span className="live-pill">
              <span className="pulse-dot" /> live
            </span>
          </div>
          {data ? (
            <ProjectsSidebar projects={data.projects} />
          ) : (
            <div className="loading-card">{error ?? "Loading projects..."}</div>
          )}
        </aside>

        <section className="grid-center glass-panel">
          <div className="center-head">
            <h2>Team Grid</h2>
            <div className="team-counters">
              <div className="counter-pill">
                Active{" "}
                <strong>
                  <AnimatedCounter
                    value={data?.team.filter((m) => m.status === "active").length ?? 0}
                  />
                </strong>
              </div>
              <div className="counter-pill">
                Blockers{" "}
                <strong>
                  <AnimatedCounter value={Math.max(0, 100 - (data?.health.blockers ?? 0))} />
                </strong>
              </div>
            </div>
          </div>

          {isLoading && <div className="loading-card">Syncing with Linear...</div>}
          {error && !data && <div className="loading-card critical">{error}</div>}
          {data && (
            <TeamGrid
              members={data.team}
              hiring={data.hiring}
              selectedMemberId={selectedMember?.id ?? null}
              onSelect={(member) => setSelectedMember(member)}
            />
          )}
        </section>

        <aside className="grid-right glass-panel">
          <h2>Activity Feed</h2>
          {data ? (
            <ActivityFeed activity={data.activity} />
          ) : (
            <div className="loading-card">Loading feed...</div>
          )}
        </aside>
      </section>

      <AnimatePresence>
        {selectedMember && (
          <MemberDetailPanel
            member={selectedMember}
            onClose={() => setSelectedMember(null)}
          />
        )}
      </AnimatePresence>
    </main>
  );
}
