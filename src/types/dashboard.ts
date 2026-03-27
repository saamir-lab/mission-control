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
  status: "active" | "busy" | "blocked" | "offline";
  activeWork: number;
  strategicPriorities?: string[];
  focusSummary: string;
  utilization: number;
  isCofounder?: boolean;
  completedThisWeek?: number;
  blockers?: string[];
  currentTask?: string;
  timeAllocation?: { [project: string]: number };
  recentSlackActivity?: SlackMessage[];
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
  ownerAvatar?: string;
};

export type ActivityItem = {
  id: string;
  type: "completion" | "new_issue" | "blocker" | "slack_message" | "email";
  actor: string;
  summary: string;
  relativeTime: string;
  source: "linear" | "slack" | "email";
  priority?: "high" | "medium" | "low";
};

export type HealthBreakdown = {
  velocity: number;
  blockers: number;
  utilization: number;
  overdue: number;
  composite: number;
};

// New V5 Types

export type SlackMessage = {
  id: string;
  channelName: string;
  userName: string;
  text: string;
  timestamp: string;
  relativeTime: string;
  isUrgent: boolean;
};

export type SlackChannel = {
  id: string;
  name: string;
  isPrivate: boolean;
};

export type EmailSummary = {
  id: string;
  subject: string;
  sender: string;
  snippet: string;
  category: "client" | "legal" | "financial" | "team" | "other";
  priority: "high" | "medium" | "low";
  relativeTime: string;
  timestamp: string;
};

export type TasksByPerson = {
  personId: string;
  personName: string;
  tasks: TaskItem[];
  taskCount: number;
  topTask?: string;
};

export type TaskItem = {
  id: string;
  title: string;
  status: string;
  project: string;
  priority: 1 | 2 | 3 | 4; // P1 = 1 (highest), P4 = 4 (lowest)
  relativeTime: string;
};

export type OrgChartNode = {
  id: string;
  name: string;
  role: string;
  level: number; // 1 = founder, 2 = co-founders, 3 = team, 4 = hiring
  status: "active" | "busy" | "blocked" | "offline" | "hiring";
  utilization?: number;
  activeTaskCount?: number;
  currentTask?: string;
  isHiring?: boolean;
};

export type PersonDetailData = {
  id: string;
  name: string;
  role: string;
  compensation: string;
  status: "active" | "busy" | "blocked" | "offline";
  utilization: number;
  activeTasks: TaskItem[];
  completedThisWeek: number;
  blockers: string[];
  recentSlackActivity: SlackMessage[];
  timeAllocation: { [project: string]: number };
};

// Extended Dashboard Data for V5
export type DashboardData = {
  generatedAt: string;
  health: HealthBreakdown;
  healthStatusLine: string;
  team: TeamMember[];
  hiring: HiringSlot[];
  projects: ProjectMetric[];
  activity: ActivityItem[]; // merged from all sources
  tasks: TasksByPerson[]; // grouped tasks for task board
  email: {
    unreadCount: number;
    topEmails: EmailSummary[];
  };
  slack: {
    recentMessages: SlackMessage[];
    clientAlerts: SlackMessage[];
  };
  orgChart: OrgChartNode[];
};
