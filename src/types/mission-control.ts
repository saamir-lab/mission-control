export type BrandStatus = "healthy" | "watch" | "critical";

export type AlertSeverity = "success" | "warning" | "danger";

export type GraphNodeType = "person" | "brand" | "deal";

export interface TeamBreakdownItem {
  role: string;
  count: number;
}

export interface BrandMetric {
  id: string;
  name: string;
  revenue: number;
  metaSpend: number;
  adSpend: number;
  ncRoas: number;
  ncOrders: number;
  totalOrders: number;
  profit: number;
  marginPct: number;
  sparkline: number[];
  status: BrandStatus;
  dataLabel: string;
  notes?: string;
  teamBreakdown: TeamBreakdownItem[];
  recentActivity: string[];
}

export interface PortfolioHud {
  totalRevenue: number;
  totalMetaSpend: number;
  totalAdSpend: number;
  totalOrders: number;
  totalNcOrders: number;
  totalProfit: number;
  ncRoas: number;
  marginPct: number;
  dataLabel: string;
}

export interface AlertItem {
  id: string;
  severity: AlertSeverity;
  title: string;
  detail: string;
}

export interface DashboardApiResponse {
  date: string;
  sourcePath: string | null;
  usedFallback: boolean;
  warnings: string[];
  portfolio: PortfolioHud;
  brands: BrandMetric[];
  alerts: AlertItem[];
}

export interface ActivityItem {
  id: string;
  type: "slack" | "notion" | "media";
  actor: string;
  target?: string;
  brand?: string;
  message: string;
  timestamp: string;
}

export interface ActivityApiResponse {
  sourcePaths: string[];
  usedFallback: boolean;
  warnings: string[];
  activities: ActivityItem[];
}

export interface GraphNode {
  id: string;
  label: string;
  type: GraphNodeType;
  color: string;
}

export interface GraphLink {
  source: string;
  target: string;
}

export interface BrainStreamItem {
  id: string;
  message: string;
  timestamp: string;
}

export interface GraphApiResponse {
  sourcePaths: string[];
  usedFallback: boolean;
  warnings: string[];
  nodes: GraphNode[];
  links: GraphLink[];
  stream: BrainStreamItem[];
}
