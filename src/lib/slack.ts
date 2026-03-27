import type { SlackMessage, SlackChannel } from "@/src/types/dashboard";

const SLACK_API_BASE = "https://slack.com/api";

type SlackApiResponse<T> = {
  ok: boolean;
  error?: string;
  data?: T;
};

type SlackConversation = {
  id: string;
  name: string;
  is_channel: boolean;
  is_private: boolean;
  is_archived: boolean;
};

type SlackUser = {
  id: string;
  name: string;
  real_name: string;
};

type SlackMessageRaw = {
  type: string;
  user?: string;
  text: string;
  ts: string;
  thread_ts?: string;
  bot_id?: string;
};

// Cache for 2 minutes to avoid rate limits
const CACHE_DURATION = 2 * 60 * 1000;
const cache = new Map<string, { data: any; timestamp: number }>();

function getCachedData<T>(key: string): T | null {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data as T;
  }
  cache.delete(key);
  return null;
}

function setCachedData<T>(key: string, data: T): void {
  cache.set(key, { data, timestamp: Date.now() });
}

async function slackFetch<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
  const slackToken = process.env.SLACK_TOKEN_RIMO?.trim();
  if (!slackToken) {
    throw new Error("SLACK_TOKEN_RIMO is not set.");
  }

  const url = new URL(`${SLACK_API_BASE}/${endpoint}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
  }

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      Authorization: `Bearer ${slackToken}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Slack API request failed: ${response.status} ${response.statusText}`);
  }

  const result = await response.json();
  if (!result.ok) {
    throw new Error(`Slack API error: ${result.error || "Unknown error"}`);
  }

  return result as T;
}

async function getSlackUsers(): Promise<Map<string, string>> {
  const cacheKey = "slack-users";
  const cached = getCachedData<Map<string, string>>(cacheKey);
  if (cached) return cached;

  try {
    const response = await slackFetch<{ members: SlackUser[] }>("users.list");
    const userMap = new Map<string, string>();
    
    response.members.forEach((user) => {
      userMap.set(user.id, user.real_name || user.name);
    });

    setCachedData(cacheKey, userMap);
    return userMap;
  } catch (error) {
    console.warn("Failed to fetch Slack users:", error);
    return new Map();
  }
}

async function getSlackChannels(): Promise<SlackConversation[]> {
  const cacheKey = "slack-channels";
  const cached = getCachedData<SlackConversation[]>(cacheKey);
  if (cached) return cached;

  try {
    const response = await slackFetch<{ channels: SlackConversation[] }>("conversations.list", {
      types: "public_channel,private_channel",
      exclude_archived: "true",
      limit: "100",
    });

    // Focus on client-facing and important team channels
    const importantChannels = response.channels.filter((channel) => {
      const name = channel.name.toLowerCase();
      return (
        name.includes("client") ||
        name.includes("customer") ||
        name === "general" ||
        name.includes("team") ||
        name.includes("urgent") ||
        name.includes("alert")
      );
    });

    setCachedData(cacheKey, importantChannels);
    return importantChannels;
  } catch (error) {
    console.warn("Failed to fetch Slack channels:", error);
    return [];
  }
}

async function getChannelHistory(channelId: string, limit: number = 10): Promise<SlackMessageRaw[]> {
  const cacheKey = `slack-history-${channelId}`;
  const cached = getCachedData<SlackMessageRaw[]>(cacheKey);
  if (cached) return cached;

  try {
    const response = await slackFetch<{ messages: SlackMessageRaw[] }>("conversations.history", {
      channel: channelId,
      limit: limit.toString(),
    });

    // Filter out bot messages and system messages
    const userMessages = response.messages.filter(
      (msg) => msg.type === "message" && msg.user && !msg.bot_id
    );

    setCachedData(cacheKey, userMessages);
    return userMessages;
  } catch (error) {
    console.warn(`Failed to fetch history for channel ${channelId}:`, error);
    return [];
  }
}

function relativeTime(timestamp: string): string {
  const deltaMs = Date.now() - parseFloat(timestamp) * 1000;
  const minutes = Math.max(1, Math.floor(deltaMs / 60000));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function sanitizeSlackText(text: string): string {
  return text
    .replace(/<@U[A-Z0-9]+>/g, "@user") // Replace user mentions
    .replace(/<#C[A-Z0-9]+\|([^>]+)>/g, "#$1") // Replace channel mentions
    .replace(/<https?:\/\/[^|>]+\|([^>]+)>/g, "$1") // Replace links
    .replace(/<[^>]+>/g, "") // Remove other markup
    .replace(/\s+/g, " ")
    .trim()
    .substring(0, 100); // Limit length
}

function isUrgentMessage(text: string, channelName: string): boolean {
  const urgentKeywords = ["urgent", "asap", "emergency", "critical", "blocker", "down", "error"];
  const textLower = text.toLowerCase();
  const channelLower = channelName.toLowerCase();
  
  return (
    urgentKeywords.some((keyword) => textLower.includes(keyword)) ||
    channelLower.includes("client") ||
    channelLower.includes("urgent")
  );
}

export async function getSlackActivity(): Promise<{
  recentMessages: SlackMessage[];
  clientAlerts: SlackMessage[];
}> {
  try {
    const [channels, users] = await Promise.all([getSlackChannels(), getSlackUsers()]);
    
    const allMessages: SlackMessage[] = [];
    const clientAlerts: SlackMessage[] = [];

    // Get recent messages from each important channel
    for (const channel of channels.slice(0, 8)) { // Limit to 8 channels to avoid rate limits
      const messages = await getChannelHistory(channel.id, 5);
      
      for (const msg of messages) {
        const userName = users.get(msg.user || "") || "Unknown User";
        const sanitizedText = sanitizeSlackText(msg.text);
        
        if (sanitizedText.length === 0) continue;

        const slackMessage: SlackMessage = {
          id: `slack-${channel.id}-${msg.ts}`,
          channelName: channel.name,
          userName,
          text: sanitizedText,
          timestamp: msg.ts,
          relativeTime: relativeTime(msg.ts),
          isUrgent: isUrgentMessage(msg.text, channel.name),
        };

        allMessages.push(slackMessage);

        // Collect client alerts
        if (slackMessage.isUrgent || channel.name.toLowerCase().includes("client")) {
          clientAlerts.push(slackMessage);
        }
      }
    }

    // Sort by timestamp (most recent first)
    allMessages.sort((a, b) => parseFloat(b.timestamp) - parseFloat(a.timestamp));
    clientAlerts.sort((a, b) => parseFloat(b.timestamp) - parseFloat(a.timestamp));

    return {
      recentMessages: allMessages.slice(0, 15), // Top 15 recent messages
      clientAlerts: clientAlerts.slice(0, 5), // Top 5 client alerts
    };
  } catch (error) {
    console.warn("Failed to fetch Slack activity:", error);
    return {
      recentMessages: [],
      clientAlerts: [],
    };
  }
}

export async function getSlackChannelList(): Promise<SlackChannel[]> {
  try {
    const channels = await getSlackChannels();
    return channels.map((channel) => ({
      id: channel.id,
      name: channel.name,
      isPrivate: channel.is_private,
    }));
  } catch (error) {
    console.warn("Failed to fetch Slack channel list:", error);
    return [];
  }
}