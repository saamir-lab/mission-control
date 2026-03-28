"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { animate, motion, useMotionValue, useTransform } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  Brain,
  CircleDollarSign,
  Clock3,
  Signal,
  TrendingUp,
} from "lucide-react";
import { Line, LineChart, ResponsiveContainer } from "recharts";
import type {
  ActivityApiResponse,
  ActivityItem,
  AlertItem,
  BrandMetric,
  DashboardApiResponse,
  GraphApiResponse,
} from "@/src/types/mission-control";

const BrainVisualization = dynamic(
  () =>
    import("@/src/components/mission-control/BrainVisualization").then(
      (mod) => mod.BrainVisualization,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="glass-strong h-[420px] w-full animate-pulse rounded-2xl border border-cyan-400/20" />
    ),
  },
);

const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" as const } },
};

function currency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function percentage(value: number) {
  return `${value.toFixed(1)}%`;
}

function NumberTicker({
  value,
  formatter,
}: {
  value: number;
  formatter: (value: number) => string;
}) {
  const motionValue = useMotionValue(0);
  const roundedValue = useTransform(motionValue, (latest) => formatter(latest));
  const [display, setDisplay] = useState(formatter(0));

  useEffect(() => {
    const controls = animate(motionValue, value, {
      duration: 1,
      ease: "easeOut",
    });
    const unsubscribe = roundedValue.on("change", (latest) => setDisplay(latest));
    return () => {
      controls.stop();
      unsubscribe();
    };
  }, [motionValue, roundedValue, value]);

  return <span className="font-mono-numbers">{display}</span>;
}

function roasClass(ncRoas: number) {
  if (ncRoas > 1.5) {
    return "text-emerald-300";
  }
  if (ncRoas >= 1) {
    return "text-yellow-300";
  }
  return "text-rose-300";
}

function statusColor(status: BrandMetric["status"]) {
  if (status === "healthy") {
    return "text-emerald-300";
  }
  if (status === "critical") {
    return "text-rose-300";
  }
  return "text-yellow-300";
}

function activityDotColor(type: ActivityItem["type"]) {
  if (type === "notion") {
    return "bg-violet-300";
  }
  if (type === "media") {
    return "bg-cyan-300";
  }
  return "bg-emerald-300";
}

function alertStyles(severity: AlertItem["severity"]) {
  if (severity === "danger") {
    return "border-rose-400/30 bg-rose-600/10 text-rose-200";
  }
  if (severity === "warning") {
    return "border-yellow-400/30 bg-yellow-600/10 text-yellow-100";
  }
  return "border-emerald-400/30 bg-emerald-600/10 text-emerald-100";
}

function relativeTime(isoTime: string) {
  const delta = Date.now() - new Date(isoTime).getTime();
  const minutes = Math.max(1, Math.floor(delta / 60000));
  if (minutes < 60) {
    return `${minutes}m ago`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }
  return `${Math.floor(hours / 24)}d ago`;
}

export default function DashboardPage() {
  const [dashboard, setDashboard] = useState<DashboardApiResponse | null>(null);
  const [activity, setActivity] = useState<ActivityApiResponse | null>(null);
  const [graph, setGraph] = useState<GraphApiResponse | null>(null);
  const [clock, setClock] = useState(() => new Date());
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    try {
      setError(null);
      const [dashboardRes, activityRes, graphRes] = await Promise.all([
        fetch("/api/dashboard", { cache: "no-store" }),
        fetch("/api/activity", { cache: "no-store" }),
        fetch("/api/graph", { cache: "no-store" }),
      ]);
      if (!dashboardRes.ok || !activityRes.ok || !graphRes.ok) {
        throw new Error("One or more APIs failed to return fresh data.");
      }
      const [dashboardPayload, activityPayload, graphPayload] = await Promise.all([
        dashboardRes.json() as Promise<DashboardApiResponse>,
        activityRes.json() as Promise<ActivityApiResponse>,
        graphRes.json() as Promise<GraphApiResponse>,
      ]);
      setDashboard(dashboardPayload);
      setActivity(activityPayload);
      setGraph(graphPayload);
      setSelectedBrandId((current) => current ?? dashboardPayload.brands[0]?.id ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to render dashboard.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    const dataInterval = window.setInterval(refresh, 45_000);
    const clockInterval = window.setInterval(() => setClock(new Date()), 1000);
    return () => {
      window.clearInterval(dataInterval);
      window.clearInterval(clockInterval);
    };
  }, []);

  const selectedBrand = useMemo(
    () => dashboard?.brands.find((brand) => brand.id === selectedBrandId) ?? null,
    [dashboard?.brands, selectedBrandId],
  );

  const warningLines = useMemo(() => {
    const warnings = [
      ...(dashboard?.warnings ?? []),
      ...(activity?.warnings ?? []),
      ...(graph?.warnings ?? []),
    ];
    return Array.from(new Set(warnings));
  }, [activity?.warnings, dashboard?.warnings, graph?.warnings]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6 text-cyan-100">
        <div className="glass flex items-center gap-4 rounded-2xl px-6 py-5">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-300/30 border-t-cyan-300" />
          <div>
            <p className="font-display text-lg tracking-wide">Booting Mission Control...</p>
            <p className="text-sm text-cyan-100/70">Syncing TW est. data + memory graph</p>
          </div>
        </div>
      </main>
    );
  }

  if (error || !dashboard || !activity || !graph) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6">
        <div className="glass max-w-xl rounded-2xl border border-rose-400/30 p-8 text-cyan-100">
          <h1 className="font-display text-2xl">Mission Control Offline</h1>
          <p className="mt-3 text-sm text-cyan-100/75">{error ?? "Could not load dashboard data."}</p>
          <button
            type="button"
            onClick={refresh}
            className="mt-6 rounded-lg border border-cyan-300/40 bg-cyan-500/10 px-4 py-2 text-sm hover:bg-cyan-500/20"
          >
            Retry systems check
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen pb-10 pt-6">
      <div className="relative z-10 mx-auto flex w-full max-w-[1600px] flex-col gap-6 px-4 sm:px-6 lg:px-8">
        <motion.section
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="glass hud-glow rounded-2xl p-4 sm:p-5"
        >
          <motion.div variants={fadeUp} className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-xl border border-cyan-300/30 bg-cyan-400/10 p-2 text-cyan-200">
                <Brain className="h-5 w-5" />
              </div>
              <div>
                <h1 className="font-display text-2xl tracking-[0.12em] text-cyan-100">JARVIS // Mission Control</h1>
                <p className="text-xs uppercase tracking-[0.2em] text-cyan-100/60">TW est. live portfolio intelligence</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <div className="flex items-center gap-2 rounded-lg border border-cyan-300/20 bg-cyan-400/5 px-3 py-2">
                <Clock3 className="h-4 w-4 text-cyan-200" />
                <span className="font-mono-numbers text-cyan-100">{clock.toLocaleTimeString()}</span>
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-emerald-300/20 bg-emerald-400/10 px-3 py-2 text-emerald-100">
                <span className="status-dot text-emerald-300" />
                <span>System status: operational</span>
              </div>
            </div>
          </motion.div>
        </motion.section>

        {warningLines.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-xl border border-yellow-300/25 bg-yellow-500/10 p-3 text-sm text-yellow-100"
          >
            <div className="mb-2 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              <span className="font-semibold">Live file warning</span>
            </div>
            <ul className="space-y-1 pl-5">
              {warningLines.map((warning) => (
                <li key={warning} className="list-disc text-yellow-100/90">
                  {warning}
                </li>
              ))}
            </ul>
          </motion.div>
        )}

        <motion.section variants={staggerContainer} initial="hidden" animate="show" className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
          {[
            {
              id: "revenue",
              label: "Portfolio Revenue",
              icon: CircleDollarSign,
              render: (
                <NumberTicker
                  value={dashboard.portfolio.totalRevenue}
                  formatter={(value) => currency(Math.max(0, value))}
                />
              ),
            },
            {
              id: "spend",
              label: "Meta Spend",
              icon: Activity,
              render: (
                <NumberTicker
                  value={dashboard.portfolio.totalMetaSpend}
                  formatter={(value) => currency(Math.max(0, value))}
                />
              ),
            },
            {
              id: "roas",
              label: "NC ROAS",
              icon: TrendingUp,
              render: (
                <NumberTicker
                  value={dashboard.portfolio.ncRoas}
                  formatter={(value) => value.toFixed(2)}
                />
              ),
            },
            {
              id: "orders",
              label: "Orders",
              icon: Signal,
              render: (
                <NumberTicker
                  value={dashboard.portfolio.totalOrders}
                  formatter={(value) => `${Math.round(value)}`}
                />
              ),
            },
            {
              id: "profit",
              label: "Profit",
              icon: CircleDollarSign,
              render: (
                <NumberTicker
                  value={dashboard.portfolio.totalProfit}
                  formatter={(value) => currency(Math.max(0, value))}
                />
              ),
            },
          ].map((item) => (
            <motion.article
              key={item.id}
              variants={fadeUp}
              className="glass hud-glow rounded-xl p-4"
            >
              <div className="mb-3 flex items-center justify-between text-cyan-100/75">
                <p className="text-xs uppercase tracking-[0.18em]">{item.label}</p>
                <item.icon className="h-4 w-4" />
              </div>
              <div className="text-2xl font-semibold text-cyan-200">{item.render}</div>
              <p className="mt-2 text-[11px] uppercase tracking-[0.18em] text-cyan-100/45">TW est.</p>
            </motion.article>
          ))}
        </motion.section>

        <motion.section variants={staggerContainer} initial="hidden" animate="show" className="space-y-4">
          <motion.div variants={fadeUp} className="flex items-center justify-between">
            <h2 className="font-display text-xl tracking-[0.12em] text-cyan-100">Active Businesses</h2>
            <span className="text-xs uppercase tracking-[0.2em] text-cyan-100/50">
              Tap a card for team + activity
            </span>
          </motion.div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {dashboard.brands.map((brand) => (
              <motion.button
                type="button"
                key={brand.id}
                variants={fadeUp}
                onClick={() => setSelectedBrandId(brand.id)}
                className={`glass hud-glow rounded-xl p-4 text-left transition ${
                  selectedBrandId === brand.id ? "border-cyan-300/50 bg-cyan-500/10" : ""
                }`}
              >
                <div className="mb-3 flex items-start justify-between">
                  <div>
                    <p className="font-display text-lg tracking-wide text-cyan-100">{brand.name}</p>
                    <p className="text-[11px] uppercase tracking-[0.18em] text-cyan-100/50">{brand.dataLabel}</p>
                  </div>
                  <span className={`status-dot ${statusColor(brand.status)}`} />
                </div>
                <p className="font-mono-numbers text-3xl font-semibold text-cyan-300">
                  {currency(brand.revenue)}
                </p>
                <p className="mt-1 text-xs uppercase tracking-[0.16em] text-cyan-100/55">Revenue</p>
                <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-cyan-100/80">
                  <div>
                    <p className="text-cyan-100/50">Meta Spend</p>
                    <p className="font-mono-numbers">{currency(brand.metaSpend)}</p>
                  </div>
                  <div>
                    <p className="text-cyan-100/50">NC ROAS</p>
                    <p className={`font-mono-numbers ${roasClass(brand.ncRoas)}`}>{brand.ncRoas.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-cyan-100/50">NC Orders</p>
                    <p className="font-mono-numbers">{brand.ncOrders}</p>
                  </div>
                  <div>
                    <p className="text-cyan-100/50">Margin</p>
                    <p className="font-mono-numbers">{percentage(brand.marginPct)}</p>
                  </div>
                  <div>
                    <p className="text-cyan-100/50">Profit</p>
                    <p className="font-mono-numbers">{currency(brand.profit)}</p>
                  </div>
                  <div>
                    <p className="text-cyan-100/50">Orders</p>
                    <p className="font-mono-numbers">{brand.totalOrders}</p>
                  </div>
                </div>
                <div className="mt-4 h-14">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={brand.sparkline.map((value, index) => ({ index, value }))}>
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke={brand.status === "healthy" ? "#00ff88" : brand.status === "critical" ? "#ff3366" : "#ffc800"}
                        strokeWidth={2}
                        dot={false}
                        isAnimationActive
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                {brand.notes ? <p className="mt-2 text-xs text-cyan-100/60">{brand.notes}</p> : null}
              </motion.button>
            ))}
          </div>

          {selectedBrand ? (
            <motion.article variants={fadeUp} className="glass-strong rounded-xl p-4 sm:p-5">
              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="font-display text-lg tracking-wide text-cyan-100">
                  {selectedBrand.name} // Team breakdown + recent activity
                </h3>
                <div className="flex items-center gap-3 text-sm">
                  <span className={`status-dot ${statusColor(selectedBrand.status)}`} />
                  <span className="text-cyan-100/80">NC ROAS {selectedBrand.ncRoas.toFixed(2)}</span>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_2fr]">
                <div className="rounded-lg border border-cyan-400/15 bg-cyan-400/5 p-4">
                  <p className="mb-3 text-xs uppercase tracking-[0.18em] text-cyan-100/55">Team mix</p>
                  <ul className="space-y-2 text-sm">
                    {selectedBrand.teamBreakdown.map((teamItem) => (
                      <li key={teamItem.role} className="flex items-center justify-between">
                        <span className="text-cyan-100/80">{teamItem.role}</span>
                        <span className="font-mono-numbers text-cyan-200">{teamItem.count}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-lg border border-cyan-400/15 bg-cyan-400/5 p-4">
                  <p className="mb-3 text-xs uppercase tracking-[0.18em] text-cyan-100/55">Recent activity</p>
                  <ul className="space-y-2 text-sm text-cyan-100/85">
                    {selectedBrand.recentActivity.map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <span className="mt-1 h-2 w-2 rounded-full bg-cyan-300/80" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.article>
          ) : null}
        </motion.section>

        <motion.section variants={staggerContainer} initial="hidden" animate="show" className="grid grid-cols-1 gap-4 xl:grid-cols-[1.6fr_1fr]">
          <motion.article variants={fadeUp} className="glass rounded-xl p-4 sm:p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-display text-lg tracking-[0.1em] text-cyan-100">Business Activity Feed</h3>
              <span className="text-xs uppercase tracking-[0.18em] text-cyan-100/55">Live</span>
            </div>
            <div className="max-h-[360px] space-y-2 overflow-y-auto pr-1">
              {activity.activities.map((item) => (
                <div
                  key={item.id}
                  className="rounded-lg border border-cyan-400/15 bg-cyan-400/5 p-3 text-sm"
                >
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${activityDotColor(item.type)}`} />
                      <span className="font-medium text-cyan-100">
                        {item.actor}
                        {item.target ? ` -> ${item.target}` : ""}
                      </span>
                    </div>
                    <span className="font-mono-numbers text-xs text-cyan-100/55">
                      {relativeTime(item.timestamp)}
                    </span>
                  </div>
                  <p className="text-cyan-100/80">{item.message}</p>
                </div>
              ))}
            </div>
          </motion.article>

          <motion.article variants={fadeUp} className="glass rounded-xl p-4 sm:p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-display text-lg tracking-[0.1em] text-cyan-100">Alerts</h3>
              <AlertTriangle className="h-4 w-4 text-cyan-200" />
            </div>
            <div className="space-y-2">
              {dashboard.alerts.length === 0 ? (
                <div className="rounded-lg border border-emerald-400/30 bg-emerald-500/10 p-3 text-sm text-emerald-100">
                  No active alerts from TW est. metrics.
                </div>
              ) : (
                dashboard.alerts.map((alert) => (
                  <div key={alert.id} className={`rounded-lg border p-3 text-sm ${alertStyles(alert.severity)}`}>
                    <p className="font-semibold">{alert.title}</p>
                    <p className="mt-1 opacity-90">{alert.detail}</p>
                  </div>
                ))
              )}
            </div>
          </motion.article>
        </motion.section>

        <motion.section variants={staggerContainer} initial="hidden" animate="show">
          <motion.article variants={fadeUp} className="glass-strong rounded-2xl p-4 sm:p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-xl tracking-[0.12em] text-cyan-100">JARVIS Brain</h3>
              <p className="text-xs uppercase tracking-[0.18em] text-cyan-100/55">
                Entity graph learning stream
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.8fr_1fr]">
              <BrainVisualization nodes={graph.nodes} links={graph.links} />
              <div className="glass relative h-[420px] overflow-hidden rounded-2xl border border-cyan-400/20 p-3">
                <div className="brain-stream-animate space-y-2">
                  {[...graph.stream, ...graph.stream].map((item, index) => (
                    <div key={`${item.id}-${index}`} className="rounded-lg border border-cyan-300/20 bg-cyan-400/5 p-2.5 text-sm">
                      <p className="text-cyan-100">{item.message}</p>
                      <p className="mt-1 text-[11px] text-cyan-100/50">{relativeTime(item.timestamp)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.article>
        </motion.section>
      </div>
    </main>
  );
}