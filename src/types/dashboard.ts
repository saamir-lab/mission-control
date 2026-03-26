export type MemberRole =
  | "Founder"
  | "Co-Founder"
  | "COO"
  | "VP Engineering"
  | "Developer";

export type TeamMember = {
  id: string;
  name: string;
  role: MemberRole;
  compensation: string;
  status: "active" | "busy" | "review";
  activeWork: number;
  strategicPriorities?: string[];
  focusSummary: string;
  utilization: number;
  isCofounder?: boolean;
};

export type HiringSlot = {
  id: string;
  title: string;
};

export type ProjectMetric = {
  id: string;
  title: string;
  owner: string;
  completion: number;
  health: "success" | "warning" | "critical";
  blockers: number;
};

export type ActivityItem = {
  id: string;
  type: "completion" | "new_issue" | "blocker";
  actor: string;
  summary: string;
  relativeTime: string;
};

export type HealthBreakdown = {
  velocity: number;
  blockers: number;
  utilization: number;
  overdue: number;
  composite: number;
};

export type DashboardData = {
  generatedAt: string;
  health: HealthBreakdown;
  healthStatusLine: string;
  team: TeamMember[];
  hiring: HiringSlot[];
  projects: ProjectMetric[];
  activity: ActivityItem[];
};
