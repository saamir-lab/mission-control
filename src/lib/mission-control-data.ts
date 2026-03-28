import fs from "node:fs";
import path from "node:path";
import type {
  ActivityApiResponse,
  ActivityItem,
  AlertItem,
  BrandMetric,
  DashboardApiResponse,
  GraphApiResponse,
  GraphLink,
  GraphNode,
  GraphNodeType,
} from "@/src/types/mission-control";

type StoreMetrics = {
  total_sales?: number;
  ad_spend?: number;
  meta_spend?: number;
  nc_roas?: number;
  ncpa?: number;
  net_profit?: number;
  purchases?: number;
  nc_purchases?: number;
  klone_split?: {
    klone_pct?: number;
    es_pct?: number;
    es_only_order_rev_est?: number;
  };
};

type DashboardRaw = {
  date?: string;
  stores?: Record<string, StoreMetrics>;
  portfolio_totals?: {
    total_revenue?: number;
    total_ad_spend?: number;
    total_meta_spend?: number;
  };
};

const DASHBOARD_PATH =
  "/Users/jarvis/.openclaw/workspace/memory/data/tw-dashboard-verified.json";
const MESSAGES_PATH =
  "/Users/jarvis/.openclaw/workspace/memory/data/messages-daily.json";
const NOTION_PATH =
  "/Users/jarvis/.openclaw/workspace/memory/data/notion-daily.json";
const GRAPH_ROOT_CANDIDATES = [
  "/Users/jarvis/.openclaw/workspace/memory/entities",
  "/Users/jarvis/.openclaw/workspace/memory",
  "/workspace/memory/entities",
  "/workspace/memory",
  "/workspace/data/entities",
  "/workspace/entities",
];

const FALLBACK_DASHBOARD: DashboardRaw = {
  date: "2026-03-27",
  stores: {
    ES: {
      total_sales: 14612,
      ad_spend: 1122,
      meta_spend: 1079.93,
      nc_roas: 9.59,
      ncpa: 3.7,
      net_profit: 11542,
      purchases: 435,
      nc_purchases: 297,
      klone_split: { klone_pct: 82.9, es_pct: 17.1, es_only_order_rev_est: 2499 },
    },
    Cured: {
      total_sales: 6595,
      ad_spend: 2955,
      meta_spend: 2954.9,
      nc_roas: 0.76,
      ncpa: 60.3,
      net_profit: 1866,
      purchases: 156,
      nc_purchases: 52,
    },
    TryCured: {
      total_sales: 2417,
      ad_spend: 0,
      net_profit: 2016,
      purchases: 111,
    },
    Veyora: {
      total_sales: 4643,
      ad_spend: 1229,
      meta_spend: 1228.97,
      nc_roas: 0.96,
      ncpa: 68.3,
      net_profit: 1611,
    },
    Veganic: { total_sales: 2287, ad_spend: 34, meta_spend: 34.48 },
    Femina: { total_sales: 2573, ad_spend: 0, net_profit: 2370 },
  },
  portfolio_totals: { total_revenue: 33127, total_ad_spend: 5340, total_meta_spend: 5298.28 },
};

const FALLBACK_MESSAGES = [
  {
    actor: "Cameron",
    target: "Media Team",
    message: "Shifted ES campaign budget toward high-intent ad sets.",
    timestamp: "2026-03-27T12:15:00.000Z",
    type: "media",
    brand: "ES",
  },
  {
    actor: "Sofia",
    target: "Cured Ops",
    message: "Shared updated NC ROAS concern thread for Cured.",
    timestamp: "2026-03-27T11:45:00.000Z",
    type: "slack",
    brand: "Cured",
  },
  {
    actor: "Marcus",
    target: "Growth",
    message: "Launched fresh Veyora creative set and paused low CTR ad.",
    timestamp: "2026-03-27T10:12:00.000Z",
    type: "media",
    brand: "Veyora",
  },
];

const FALLBACK_NOTION = [
  {
    actor: "Nina",
    message: "Completed Notion task: ES attribution QA complete.",
    timestamp: "2026-03-27T09:20:00.000Z",
    type: "notion",
    brand: "ES",
  },
  {
    actor: "Jordan",
    message: "Completed Notion task: Femina launch checklist closed.",
    timestamp: "2026-03-27T08:05:00.000Z",
    type: "notion",
    brand: "Femina",
  },
];

const FALLBACK_GRAPH_FILES = [
  {
    filePath: "people/cameron.md",
    content: "# Cameron\n\nLeads growth for [[ES]] and [[Rimo Lite]].\nConnected to [[Marcus]].",
  },
  {
    filePath: "brands/es.md",
    content: "# ES\n\nKey brand in portfolio. Works with [[Cameron]] and [[Brandify]].",
  },
  {
    filePath: "deals/rimo-lite.md",
    content: "# Rimo Lite\n\nDeal supported by [[Cameron]] and [[ES]].",
  },
];

function safeNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return 0;
}

function readJsonWithFallback<T>(
  sourcePath: string,
  fallbackValue: T,
): { data: T; usedFallback: boolean; warning?: string; sourcePath: string | null } {
  try {
    const file = fs.readFileSync(sourcePath, "utf-8");
    return { data: JSON.parse(file) as T, usedFallback: false, sourcePath };
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown read error";
    return {
      data: fallbackValue,
      usedFallback: true,
      warning: `Missing or unreadable ${sourcePath}. Using sample data. (${detail})`,
      sourcePath: null,
    };
  }
}

function pickMetaSpend(store: StoreMetrics): number {
  const meta = safeNumber(store.meta_spend);
  if (meta > 0) {
    return meta;
  }
  return safeNumber(store.ad_spend);
}

function pickProfit(store: StoreMetrics, revenue: number): number {
  const profit = safeNumber(store.net_profit);
  if (profit !== 0) {
    return profit;
  }
  return revenue - safeNumber(store.ad_spend);
}

function buildSparkline(seedLabel: string, anchor: number): number[] {
  const base = anchor > 0 ? anchor : 100;
  const seed = seedLabel.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const wave = [0.91, 0.95, 1.01, 0.97, 1.06, 1.12, 1.08, 1.18];
  return wave.map((factor, index) => {
    const jitter = (((seed + index * 13) % 9) - 4) / 100;
    return Math.max(10, Math.round(base * (factor + jitter)));
  });
}

function statusFromRoas(ncRoas: number, spend: number): BrandMetric["status"] {
  if (spend <= 0) {
    return "watch";
  }
  if (ncRoas > 1.5) {
    return "healthy";
  }
  if (ncRoas >= 1) {
    return "watch";
  }
  return "critical";
}

function weightedNcRoas(stores: StoreMetrics[]): number {
  let weighted = 0;
  let totalSpend = 0;
  for (const store of stores) {
    const spend = pickMetaSpend(store);
    const roas = safeNumber(store.nc_roas);
    if (spend > 0 && roas > 0) {
      weighted += roas * spend;
      totalSpend += spend;
    }
  }
  return totalSpend > 0 ? weighted / totalSpend : 0;
}

function buildBrandFromStore(
  id: string,
  name: string,
  store: StoreMetrics,
  options?: { revenueOverride?: number; notes?: string; teamBreakdown?: BrandMetric["teamBreakdown"] },
): BrandMetric {
  const revenue = safeNumber(options?.revenueOverride ?? store.total_sales);
  const metaSpend = pickMetaSpend(store);
  const adSpend = safeNumber(store.ad_spend);
  const ncRoas = safeNumber(store.nc_roas);
  const totalOrders = safeNumber(store.purchases);
  const ncOrders = safeNumber(store.nc_purchases);
  const profit = pickProfit(store, revenue);
  const marginPct = revenue > 0 ? (profit / revenue) * 100 : 0;

  return {
    id,
    name,
    revenue,
    metaSpend,
    adSpend,
    ncRoas,
    ncOrders,
    totalOrders,
    profit,
    marginPct,
    sparkline: buildSparkline(name, revenue / 8),
    status: statusFromRoas(ncRoas, metaSpend),
    dataLabel: "TW est.",
    notes: options?.notes,
    teamBreakdown:
      options?.teamBreakdown ??
      [
        { role: "Media Buying", count: 2 },
        { role: "Creative", count: 2 },
        { role: "Ops", count: 1 },
      ],
    recentActivity: [
      `${name}: NC ROAS synced from latest TW data`,
      `${name}: Performance snapshot refreshed`,
      `${name}: Attribution memory updated`,
    ],
  };
}

function composeBrands(raw: DashboardRaw): BrandMetric[] {
  const stores = raw.stores ?? {};
  const es = stores.ES ?? {};
  const cured = stores.Cured ?? {};
  const tryCured = stores.TryCured ?? {};
  const veyora = stores.Veyora ?? {};
  const veganic = stores.Veganic ?? {};
  const femina = stores.Femina ?? {};

  const esRevenue = safeNumber(es.klone_split?.es_only_order_rev_est);
  const esBrand = buildBrandFromStore("es", "ES", es, {
    revenueOverride: esRevenue,
    notes: `ES-only est. revenue used. Klone ${
      safeNumber(es.klone_split?.klone_pct) || 82.9
    }% excluded.`,
    teamBreakdown: [
      { role: "Media Buying", count: 3 },
      { role: "Creative", count: 2 },
      { role: "CRM", count: 1 },
    ],
  });

  const curedRevenue = safeNumber(cured.total_sales) + safeNumber(tryCured.total_sales);
  const curedMetaSpend = pickMetaSpend(cured) + pickMetaSpend(tryCured);
  const curedAdSpend = safeNumber(cured.ad_spend) + safeNumber(tryCured.ad_spend);
  const curedProfit = pickProfit(cured, safeNumber(cured.total_sales)) + pickProfit(tryCured, safeNumber(tryCured.total_sales));
  const curedNcOrders = safeNumber(cured.nc_purchases) + safeNumber(tryCured.nc_purchases);
  const curedOrders = safeNumber(cured.purchases) + safeNumber(tryCured.purchases);
  const curedNcRoas = weightedNcRoas([cured, tryCured]) || safeNumber(cured.nc_roas);
  const curedMargin = curedRevenue > 0 ? (curedProfit / curedRevenue) * 100 : 0;
  const curedBrand: BrandMetric = {
    id: "cured",
    name: "Cured",
    revenue: curedRevenue,
    metaSpend: curedMetaSpend,
    adSpend: curedAdSpend,
    ncRoas: curedNcRoas,
    ncOrders: curedNcOrders,
    totalOrders: curedOrders,
    profit: curedProfit,
    marginPct: curedMargin,
    sparkline: buildSparkline("Cured", curedRevenue / 8),
    status: statusFromRoas(curedNcRoas, curedMetaSpend),
    dataLabel: "TW est.",
    notes: "Combined: shop-cured + TryCured",
    teamBreakdown: [
      { role: "Growth", count: 2 },
      { role: "Lifecycle", count: 1 },
      { role: "Ops", count: 2 },
    ],
    recentActivity: [
      "Cured + TryCured merged in one card",
      "NC acquisition efficiency below target",
      "Creative refresh queued for media team",
    ],
  };

  const veyoraBrand = buildBrandFromStore("veyora", "Veyora", veyora, {
      teamBreakdown: [
        { role: "Media Buying", count: 2 },
        { role: "Creative", count: 1 },
        { role: "Ops", count: 1 },
      ],
    });
  const veganicBrand = buildBrandFromStore("veganic", "Veganic", veganic, {
      teamBreakdown: [
        { role: "Media Buying", count: 1 },
        { role: "Creative", count: 1 },
      ],
    });
  const feminaBrand = buildBrandFromStore("femina", "Femina", femina, {
      teamBreakdown: [
        { role: "Growth", count: 1 },
        { role: "Ops", count: 1 },
      ],
    });

  const activeBusinesses = [
    {
      id: "sana-direct",
      name: "Sana Direct",
      note: "Awaiting live feed",
    },
    {
      id: "brandify",
      name: "Brandify",
      note: "Awaiting live feed",
    },
    {
      id: "rimo",
      name: "Rimo",
      note: "Awaiting live feed",
    },
  ].map<BrandMetric>((brand) => ({
    id: brand.id,
    name: brand.name,
    revenue: 0,
    metaSpend: 0,
    adSpend: 0,
    ncRoas: 0,
    ncOrders: 0,
    totalOrders: 0,
    profit: 0,
    marginPct: 0,
    sparkline: buildSparkline(brand.name, 80),
    status: "watch",
    dataLabel: "TW est.",
    notes: brand.note,
    teamBreakdown: [
      { role: "Leadership", count: 1 },
      { role: "Ops", count: 1 },
    ],
    recentActivity: [`${brand.name}: No file data yet, showing standby state.`],
  }));

  return [esBrand, curedBrand, veyoraBrand, veganicBrand, feminaBrand, ...activeBusinesses];
}

function buildAlerts(brands: BrandMetric[]): AlertItem[] {
  const alerts: AlertItem[] = [];
  for (const brand of brands) {
    if (brand.metaSpend > 500 && brand.ncRoas < 1) {
      alerts.push({
        id: `alert-danger-${brand.id}`,
        severity: "danger",
        title: `${brand.name} under target`,
        detail: `NC ROAS ${brand.ncRoas.toFixed(2)} on $${Math.round(brand.metaSpend)} spend.`,
      });
    } else if (brand.metaSpend > 250 && brand.ncRoas >= 1 && brand.ncRoas < 1.5) {
      alerts.push({
        id: `alert-warning-${brand.id}`,
        severity: "warning",
        title: `${brand.name} needs optimization`,
        detail: `NC ROAS ${brand.ncRoas.toFixed(2)} in caution range.`,
      });
    } else if (brand.revenue > 0 && brand.marginPct > 35) {
      alerts.push({
        id: `alert-success-${brand.id}`,
        severity: "success",
        title: `${brand.name} efficient margin`,
        detail: `Margin ${brand.marginPct.toFixed(1)}% with healthy profitability.`,
      });
    }
  }
  return alerts.slice(0, 8);
}

export function getDashboardPayload(): DashboardApiResponse {
  const read = readJsonWithFallback<DashboardRaw>(DASHBOARD_PATH, FALLBACK_DASHBOARD);
  const warnings: string[] = [];
  if (read.warning) {
    warnings.push(read.warning);
  }

  const brands = composeBrands(read.data);
  const totalRevenue = brands.reduce((sum, brand) => sum + brand.revenue, 0);
  const totalMetaSpend = brands.reduce((sum, brand) => sum + brand.metaSpend, 0);
  const totalAdSpend = brands.reduce((sum, brand) => sum + brand.adSpend, 0);
  const totalOrders = brands.reduce((sum, brand) => sum + brand.totalOrders, 0);
  const totalNcOrders = brands.reduce((sum, brand) => sum + brand.ncOrders, 0);
  const totalProfit = brands.reduce((sum, brand) => sum + brand.profit, 0);
  const weightedRoasNumerator = brands.reduce(
    (sum, brand) => sum + brand.ncRoas * brand.metaSpend,
    0,
  );
  const ncRoas = totalMetaSpend > 0 ? weightedRoasNumerator / totalMetaSpend : 0;
  const marginPct = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

  return {
    date: read.data.date ?? new Date().toISOString().slice(0, 10),
    sourcePath: read.sourcePath,
    usedFallback: read.usedFallback,
    warnings,
    portfolio: {
      totalRevenue,
      totalMetaSpend,
      totalAdSpend,
      totalOrders,
      totalNcOrders,
      totalProfit,
      ncRoas,
      marginPct,
      dataLabel: "TW est.",
    },
    brands,
    alerts: buildAlerts(brands),
  };
}

function normalizeIntoList(payload: unknown): Record<string, unknown>[] {
  if (Array.isArray(payload)) {
    return payload.filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null);
  }
  if (!payload || typeof payload !== "object") {
    return [];
  }
  const objectPayload = payload as Record<string, unknown>;
  const preferredKeys = ["messages", "items", "events", "activities", "tasks", "completed", "data"];
  for (const key of preferredKeys) {
    const value = objectPayload[key];
    if (Array.isArray(value)) {
      return value.filter(
        (item): item is Record<string, unknown> => typeof item === "object" && item !== null,
      );
    }
  }
  const flattened: Record<string, unknown>[] = [];
  for (const value of Object.values(objectPayload)) {
    if (Array.isArray(value)) {
      flattened.push(
        ...value.filter(
          (item): item is Record<string, unknown> => typeof item === "object" && item !== null,
        ),
      );
    }
  }
  return flattened;
}

function stringField(record: Record<string, unknown>, keys: string[], fallback: string): string {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return fallback;
}

function classifyMessageType(record: Record<string, unknown>): ActivityItem["type"] {
  const hint = stringField(record, ["type", "category", "kind"], "").toLowerCase();
  const text = stringField(record, ["message", "text", "summary", "title", "action"], "").toLowerCase();
  if (hint.includes("notion") || text.includes("notion")) {
    return "notion";
  }
  if (
    hint.includes("media") ||
    text.includes("campaign") ||
    text.includes("budget") ||
    text.includes("meta")
  ) {
    return "media";
  }
  return "slack";
}

function toIsoTimestamp(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return new Date().toISOString();
  }
  return parsed.toISOString();
}

function normalizeActivity(
  record: Record<string, unknown>,
  fallbackType: ActivityItem["type"],
  index: number,
): ActivityItem {
  const actor = stringField(record, ["actor", "from", "user", "owner", "person"], "System");
  const target = stringField(record, ["target", "to", "recipient", "channel", "brand"], "");
  const message = stringField(record, ["message", "text", "summary", "title", "action"], "Activity update received.");
  const timestamp = toIsoTimestamp(stringField(record, ["timestamp", "time", "createdAt", "date"], new Date().toISOString()));
  const type = classifyMessageType(record) || fallbackType;
  const brand = stringField(record, ["brand", "store", "business"], "");
  return {
    id: `${type}-${index}-${actor.replace(/\s+/g, "-").toLowerCase()}`,
    type,
    actor,
    target: target || undefined,
    brand: brand || undefined,
    message,
    timestamp,
  };
}

export function getActivityPayload(): ActivityApiResponse {
  const messagesRead = readJsonWithFallback<unknown>(MESSAGES_PATH, FALLBACK_MESSAGES);
  const notionRead = readJsonWithFallback<unknown>(NOTION_PATH, FALLBACK_NOTION);
  const warnings: string[] = [];
  if (messagesRead.warning) {
    warnings.push(messagesRead.warning);
  }
  if (notionRead.warning) {
    warnings.push(notionRead.warning);
  }

  const messageList = normalizeIntoList(messagesRead.data).map((item, index) =>
    normalizeActivity(item, "slack", index),
  );
  const notionList = normalizeIntoList(notionRead.data).map((item, index) =>
    normalizeActivity(item, "notion", index + 1000),
  );

  const activities = [...messageList, ...notionList]
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    .slice(0, 80);

  return {
    sourcePaths: [messagesRead.sourcePath, notionRead.sourcePath].filter(
      (value): value is string => Boolean(value),
    ),
    usedFallback: messagesRead.usedFallback || notionRead.usedFallback,
    warnings,
    activities:
      activities.length > 0
        ? activities
        : FALLBACK_MESSAGES.map((record, index) =>
            normalizeActivity(record as unknown as Record<string, unknown>, "media", index),
          ),
  };
}

type GraphFile = {
  filePath: string;
  content: string;
};

function collectMarkdownFiles(rootDir: string, maxDepth = 6): GraphFile[] {
  const files: GraphFile[] = [];

  function walk(currentDir: string, depth: number) {
    if (depth > maxDepth) {
      return;
    }
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(currentDir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name.startsWith(".") || entry.name === "node_modules") {
          continue;
        }
        walk(fullPath, depth + 1);
      } else if (entry.isFile() && entry.name.endsWith(".md")) {
        try {
          const content = fs.readFileSync(fullPath, "utf-8");
          files.push({ filePath: fullPath, content });
        } catch {
          // Skip unreadable files.
        }
      }
    }
  }

  walk(rootDir, 0);
  return files;
}

function normalizeId(value: string): string {
  return value
    .toLowerCase()
    .replace(/\.md$/i, "")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

function inferNodeType(filePath: string, label: string, content: string): GraphNodeType {
  const source = `${filePath} ${content}`.toLowerCase();
  if (source.includes("people") || source.includes("person") || source.includes("human")) {
    return "person";
  }
  if (source.includes("deal") || source.includes("opportunity")) {
    return "deal";
  }
  if (
    source.includes("brand") ||
    ["es", "cured", "veyora", "veganic", "femina", "sana direct", "brandify", "rimo"].includes(
      label.toLowerCase(),
    )
  ) {
    return "brand";
  }
  return "brand";
}

function colorForNodeType(type: GraphNodeType): string {
  if (type === "person") {
    return "#00ff88";
  }
  if (type === "deal") {
    return "#ffc800";
  }
  return "#00d4ff";
}

function extractWikiLinks(content: string): string[] {
  const links: string[] = [];
  const regex = /\[\[([^\]]+)\]\]/g;
  let match = regex.exec(content);
  while (match) {
    const raw = match[1] ?? "";
    const cleaned = raw.split("|")[0]?.trim();
    if (cleaned) {
      links.push(cleaned);
    }
    match = regex.exec(content);
  }
  return links;
}

function buildGraphFromFiles(files: GraphFile[]): {
  nodes: GraphNode[];
  links: GraphLink[];
  stream: GraphApiResponse["stream"];
} {
  const nodeMap = new Map<string, GraphNode>();
  const links: GraphLink[] = [];

  for (const file of files) {
    const fileName = path.basename(file.filePath, ".md");
    const label = fileName.replace(/[-_]/g, " ");
    const id = normalizeId(label);
    const type = inferNodeType(file.filePath, label, file.content);
    if (!nodeMap.has(id)) {
      nodeMap.set(id, {
        id,
        label: label.replace(/\b\w/g, (char) => char.toUpperCase()),
        type,
        color: colorForNodeType(type),
      });
    }
    const wikilinks = extractWikiLinks(file.content);
    for (const wikiLink of wikilinks) {
      const targetId = normalizeId(wikiLink);
      if (!targetId) {
        continue;
      }
      if (!nodeMap.has(targetId)) {
        const targetType = inferNodeType(file.filePath, wikiLink, wikiLink);
        nodeMap.set(targetId, {
          id: targetId,
          label: wikiLink,
          type: targetType,
          color: colorForNodeType(targetType),
        });
      }
      links.push({ source: id, target: targetId });
    }
  }

  const nodes = Array.from(nodeMap.values());
  const stream = [
    {
      id: "stream-memory-refresh",
      message: "Memory updated: ES revenue data refreshed",
      timestamp: new Date().toISOString(),
    },
    {
      id: "stream-connection-cameron",
      message: "New connection: Cameron > Rimo Lite",
      timestamp: new Date(Date.now() - 1000 * 45).toISOString(),
    },
    {
      id: "stream-klone-learned",
      message: "Brain learned: Klone 82.9% of ES revenue",
      timestamp: new Date(Date.now() - 1000 * 90).toISOString(),
    },
    ...nodes.slice(0, 10).map((node, index) => ({
      id: `stream-node-${node.id}`,
      message: `Entity synced: ${node.label}`,
      timestamp: new Date(Date.now() - (index + 3) * 1000 * 40).toISOString(),
    })),
  ];

  return { nodes, links, stream };
}

export function getGraphPayload(): GraphApiResponse {
  const warnings: string[] = [];
  const graphFiles: GraphFile[] = [];
  const sourcePaths: string[] = [];

  for (const root of GRAPH_ROOT_CANDIDATES) {
    if (!fs.existsSync(root)) {
      continue;
    }
    sourcePaths.push(root);
    graphFiles.push(...collectMarkdownFiles(root));
  }

  let usedFallback = false;
  if (graphFiles.length === 0) {
    warnings.push("No markdown graph entities found. Using sample graph.");
    usedFallback = true;
    graphFiles.push(
      ...FALLBACK_GRAPH_FILES.map((file) => ({
        filePath: file.filePath,
        content: file.content,
      })),
    );
  }

  const graph = buildGraphFromFiles(graphFiles);
  return {
    sourcePaths,
    usedFallback,
    warnings,
    nodes: graph.nodes,
    links: graph.links,
    stream: graph.stream,
  };
}
