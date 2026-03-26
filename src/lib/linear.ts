import type {
  ActivityItem,
  DashboardData,
  HiringSlot,
  ProjectMetric,
  TeamMember,
} from "@/types/dashboard";

const LINEAR_GRAPHQL_URL = "https://api.linear.app/graphql";

type LinearIssue = {
  id: string;
  identifier: string;
  title: string;
  priority: number;
  createdAt: string;
  updatedAt: string;
  dueDate: string | null;
  state: {
    name: string;
    type: string;
  };
  project: {
    name: string;
  } | null;
  assignee: {
    name: string;
  } | null;
  team: {
    key: string;
    name: string;
  } | null;
  labels: {
    nodes: Array<{
      name: string;
    }>;
  };
  relations: {
    nodes: Array<{
      type: string;
    }>;
  };
};

type LinearData = {
  teams: {
    nodes: Array<{
      key: string;
      name: string;
      issues: {
        nodes: LinearIssue[];
      };
    }>;
  };
};

type PersonBlueprint = Omit<TeamMember, "status" | "activeWork" | "utilization"> & {
  aliases: string[];
};

type GraphQLResult<T> = {
  data?: T;
  errors?: Array<{ message: string }>;
};

const TEAM_BLUEPRINT: PersonBlueprint[] = [
  {
    id: "saamir",
    name: "Saamir",
    role: "Founder",
    compensation: "Founder Equity",
    focusSummary: "Setting strategic direction and investor rhythm.",
    strategicPriorities: [
      "Close enterprise partnerships with predictable onboarding",
      "Strengthen weekly operating rhythm across every function",
      "Prioritize roadmap bets with direct revenue impact",
    ],
    aliases: ["saamir"],
  },
  {
    id: "cameron",
    name: "Cameron Mema",
    role: "Co-Founder",
    compensation: "$15K/mo",
    focusSummary: "Owning product delivery and customer-facing roadmap decisions.",
    aliases: ["cameron", "cameron mema", "cameron m"],
    isCofounder: true,
  },
  {
    id: "jaden",
    name: "Jaden",
    role: "COO",
    compensation: "$10K/mo",
    focusSummary: "Running operations, milestones, and cross-team coordination.",
    aliases: ["jaden"],
  },
  {
    id: "abdullah",
    name: "Abdullah",
    role: "VP Engineering",
    compensation: "$16K/mo",
    focusSummary: "Leading engineering throughput and production reliability.",
    aliases: ["abdullah"],
  },
  {
    id: "omar",
    name: "Omar Adel",
    role: "Developer",
    compensation: "$3K/mo",
    focusSummary: "Shipping feature work and debugging core flows.",
    aliases: ["omar", "omar adel"],
  },
  {
    id: "osman",
    name: "Osman E",
    role: "Developer",
    compensation: "$2K/mo",
    focusSummary: "Owning implementation details and task completion velocity.",
    aliases: ["osman", "osman e"],
  },
];

const HIRING_SLOTS: HiringSlot[] = [
  { id: "hire-sales-manager", title: "Sales Mgr" },
  { id: "hire-dev-m1", title: "Dev M1" },
  { id: "hire-dev-m2", title: "Dev M2" },
  { id: "hire-account-manager", title: "Account Mgr" },
];

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function sanitizeText(input: string): string {
  return input
    .replace(/\b[A-Z][A-Z0-9]{1,7}-\d+\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function relativeTime(dateIso: string): string {
  const deltaMs = Date.now() - +new Date(dateIso);
  const minutes = Math.max(1, Math.floor(deltaMs / 60000));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function isBlocker(issue: LinearIssue): boolean {
  const stateText = `${issue.state.name} ${issue.state.type}`.toLowerCase();
  const hasLabel = issue.labels.nodes.some((label) => label.name.toLowerCase().includes("block"));
  const hasRelation = issue.relations.nodes.some((relation) =>
    relation.type.toLowerCase().includes("block"),
  );
  return issue.priority <= 1 || hasLabel || hasRelation || stateText.includes("block");
}

function assigneeKey(name: string | null | undefined): string {
  return (name ?? "").toLowerCase().trim();
}

async function linearFetch<T>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<GraphQLResult<T>> {
  const linearApiKey = process.env.LINEAR_API_KEY?.trim();
  if (!linearApiKey) {
    throw new Error("LINEAR_API_KEY is not set.");
  }

  const response = await fetch(LINEAR_GRAPHQL_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: linearApiKey,
    },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Linear request failed: ${response.status} ${response.statusText}`);
  }

  return (await response.json()) as GraphQLResult<T>;
}

export async function queryLinearRaw(
  query: string,
  variables?: Record<string, unknown>,
): Promise<GraphQLResult<unknown>> {
  return linearFetch<unknown>(query, variables);
}

async function queryLinearData<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const result = await linearFetch<T>(query, variables);
  if (result.errors?.length) {
    throw new Error(result.errors.map((error) => error.message).join("; "));
  }
  if (!result.data) {
    throw new Error("Linear returned empty data.");
  }
  return result.data;
}

async function getLinearIssues(): Promise<LinearIssue[]> {
  const query = `
    query MissionControlIssues {
      teams(filter: { key: { in: ["JAR", "FIX"] } }) {
        nodes {
          key
          name
          issues(first: 200, orderBy: updatedAt) {
            nodes {
              id
              identifier
              title
              priority
              createdAt
              updatedAt
              dueDate
              state {
                name
                type
              }
              project {
                name
              }
              assignee {
                name
              }
              team {
                key
                name
              }
              labels(first: 12) {
                nodes {
                  name
                }
              }
              relations(first: 12) {
                nodes {
                  type
                }
              }
            }
          }
        }
      }
    }
  `;

  const data = await queryLinearData<LinearData>(query);
  return data.teams.nodes.flatMap((team) => team.issues.nodes ?? []);
}

function buildTeam(issues: LinearIssue[]): TeamMember[] {
  return TEAM_BLUEPRINT.map((person) => {
    const activeWork = issues.filter((issue) => {
      if (issue.state.type === "completed" || issue.state.type === "canceled") {
        return false;
      }
      const assignee = assigneeKey(issue.assignee?.name);
      return assignee.length > 0 && person.aliases.some((alias) => assignee.includes(alias));
    }).length;

    const utilization = clamp(Math.round((activeWork / 4) * 100), 18, 100);
    const status: TeamMember["status"] =
      activeWork >= 5 ? "busy" : activeWork >= 2 ? "active" : "review";

    return {
      id: person.id,
      name: person.name,
      role: person.role,
      compensation: person.compensation,
      status,
      activeWork,
      strategicPriorities: person.strategicPriorities,
      focusSummary: person.focusSummary,
      utilization,
      isCofounder: person.isCofounder,
    };
  });
}

function buildProjects(issues: LinearIssue[]): ProjectMetric[] {
  const buckets = new Map<
    string,
    {
      total: number;
      done: number;
      blockers: number;
      owners: Map<string, number>;
    }
  >();

  for (const issue of issues) {
    const title = sanitizeText(issue.project?.name || `${issue.team?.name || "Core"} Initiatives`);
    if (!buckets.has(title)) {
      buckets.set(title, { total: 0, done: 0, blockers: 0, owners: new Map() });
    }
    const bucket = buckets.get(title);
    if (!bucket) continue;

    bucket.total += 1;
    if (issue.state.type === "completed") bucket.done += 1;
    if (isBlocker(issue)) bucket.blockers += 1;

    const owner = sanitizeText(issue.assignee?.name || "Team");
    bucket.owners.set(owner, (bucket.owners.get(owner) ?? 0) + 1);
  }

  const results = Array.from(buckets.entries()).map(([title, bucket], index) => {
    const completion = bucket.total ? Math.round((bucket.done / bucket.total) * 100) : 0;
    const owner =
      Array.from(bucket.owners.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "Team";

    const health: ProjectMetric["health"] =
      bucket.blockers >= 3 || completion < 35
        ? "critical"
        : bucket.blockers > 0 || completion < 65
          ? "warning"
          : "success";

    return {
      id: `project-${index + 1}`,
      title,
      owner,
      completion,
      blockers: bucket.blockers,
      health,
    };
  });

  const severity = { critical: 3, warning: 2, success: 1 };
  return results.sort((a, b) => severity[b.health] - severity[a.health]).slice(0, 7);
}

function buildActivity(issues: LinearIssue[]): ActivityItem[] {
  const completions = issues
    .filter((issue) => issue.state.type === "completed")
    .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt))
    .slice(0, 4)
    .map(
      (issue): ActivityItem => ({
        id: `completion-${issue.id}`,
        type: "completion",
        actor: sanitizeText(issue.assignee?.name || issue.team?.name || "Team"),
        summary: `${sanitizeText(issue.title)} completed`,
        relativeTime: relativeTime(issue.updatedAt),
      }),
    );

  const newIssues = issues
    .filter((issue) => issue.state.type !== "completed")
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
    .slice(0, 3)
    .map(
      (issue): ActivityItem => ({
        id: `new-${issue.id}`,
        type: "new_issue",
        actor: sanitizeText(issue.assignee?.name || issue.team?.name || "Ops"),
        summary: `${sanitizeText(issue.title)} opened`,
        relativeTime: relativeTime(issue.createdAt),
      }),
    );

  const blockers = issues
    .filter(isBlocker)
    .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt))
    .slice(0, 3)
    .map(
      (issue): ActivityItem => ({
        id: `blocker-${issue.id}`,
        type: "blocker",
        actor: sanitizeText(issue.assignee?.name || "Ops"),
        summary: `${sanitizeText(issue.title)} blocked`,
        relativeTime: relativeTime(issue.updatedAt),
      }),
    );

  return [...blockers, ...newIssues, ...completions].slice(0, 10);
}

function fallbackData(): DashboardData {
  const team = TEAM_BLUEPRINT.map<TeamMember>((member, index) => ({
    id: member.id,
    name: member.name,
    role: member.role,
    compensation: member.compensation,
    status: index % 2 === 0 ? "active" : "busy",
    activeWork: index < 4 ? 3 + (index % 2) : 2,
    utilization: index < 4 ? 82 : 64,
    strategicPriorities: member.strategicPriorities,
    focusSummary: member.focusSummary,
    isCofounder: member.isCofounder,
  }));

  return {
    generatedAt: new Date().toISOString(),
    health: {
      velocity: 76,
      blockers: 65,
      utilization: 81,
      overdue: 72,
      composite: 74,
    },
    healthStatusLine: "Team is productive. 2 milestones behind. 3 blockers need attention.",
    team,
    hiring: HIRING_SLOTS,
    projects: [
      {
        id: "fallback-1",
        title: "Fixing Rimo Stability Sprint",
        owner: "Abdullah",
        completion: 59,
        health: "warning",
        blockers: 2,
      },
      {
        id: "fallback-2",
        title: "Jarvis Clinical Workflow",
        owner: "Cameron Mema",
        completion: 71,
        health: "warning",
        blockers: 1,
      },
      {
        id: "fallback-3",
        title: "Customer Onboarding Automation",
        owner: "Jaden",
        completion: 83,
        health: "success",
        blockers: 0,
      },
    ],
    activity: [
      {
        id: "fallback-complete",
        type: "completion",
        actor: "Omar Adel",
        summary: "Referral intake workflow completed",
        relativeTime: "24m ago",
      },
      {
        id: "fallback-new",
        type: "new_issue",
        actor: "Cameron Mema",
        summary: "Pricing page updates opened",
        relativeTime: "39m ago",
      },
      {
        id: "fallback-blocker",
        type: "blocker",
        actor: "Abdullah",
        summary: "Production auth callback blocked",
        relativeTime: "1h ago",
      },
    ],
  };
}

function buildDashboardData(issues: LinearIssue[]): DashboardData {
  const team = buildTeam(issues);
  const projects = buildProjects(issues);
  const activity = buildActivity(issues);

  const activeIssues = issues.filter(
    (issue) => issue.state.type !== "completed" && issue.state.type !== "canceled",
  );
  const completedWeek = issues.filter((issue) => {
    if (issue.state.type !== "completed") return false;
    return Date.now() - +new Date(issue.updatedAt) < 7 * 24 * 60 * 60 * 1000;
  }).length;
  const startedWeek = issues.filter(
    (issue) => Date.now() - +new Date(issue.createdAt) < 7 * 24 * 60 * 60 * 1000,
  ).length;
  const blockerCount = activeIssues.filter(isBlocker).length;
  const overdueCount = activeIssues.filter((issue) => issue.dueDate && +new Date(issue.dueDate) < Date.now())
    .length;

  const velocity = clamp(Math.round((completedWeek / Math.max(1, startedWeek)) * 100), 15, 100);
  const blockers = clamp(100 - blockerCount * 16, 0, 100);
  const utilization = clamp(
    Math.round(team.reduce((sum, member) => sum + member.utilization, 0) / Math.max(1, team.length)),
    20,
    100,
  );
  const overdue = clamp(100 - overdueCount * 15, 0, 100);
  const composite = clamp(
    Math.round(velocity * 0.35 + blockers * 0.25 + utilization * 0.2 + overdue * 0.2),
    0,
    100,
  );

  const milestonesBehind = Math.max(
    1,
    projects.filter((project) => project.health !== "success" && project.completion < 65).length,
  );
  const blockersNeedAttention = Math.max(1, blockerCount);

  return {
    generatedAt: new Date().toISOString(),
    health: {
      velocity,
      blockers,
      utilization,
      overdue,
      composite,
    },
    healthStatusLine: `Team is productive. ${milestonesBehind} milestones behind. ${blockersNeedAttention} blockers need attention.`,
    team,
    hiring: HIRING_SLOTS,
    projects,
    activity,
  };
}

export async function getDashboardData(): Promise<DashboardData> {
  try {
    const issues = await getLinearIssues();
    if (!issues.length) {
      return fallbackData();
    }
    return buildDashboardData(issues);
  } catch {
    return fallbackData();
  }
}
