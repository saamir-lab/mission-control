import { execSync } from "child_process";
import type { EmailSummary } from "@/src/types/dashboard";

// Cache for 5 minutes to avoid excessive CLI calls
const CACHE_DURATION = 5 * 60 * 1000;
let cachedEmails: { data: EmailSummary[]; timestamp: number } | null = null;
let cachedCount: { data: number; timestamp: number } | null = null;

type GogEmail = {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  date: string;
  snippet: string;
  labels: string[];
};

function relativeTime(dateString: string): string {
  const deltaMs = Date.now() - new Date(dateString).getTime();
  const minutes = Math.max(1, Math.floor(deltaMs / 60000));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function categorizeEmail(subject: string, from: string): EmailSummary["category"] {
  const subjectLower = subject.toLowerCase();
  const fromLower = from.toLowerCase();

  // Client emails - look for customer names or client-related keywords
  if (
    fromLower.includes("@client") ||
    fromLower.includes("@customer") ||
    subjectLower.includes("client") ||
    subjectLower.includes("customer") ||
    subjectLower.includes("partnership") ||
    subjectLower.includes("contract")
  ) {
    return "client";
  }

  // Legal emails
  if (
    fromLower.includes("@law") ||
    fromLower.includes("legal") ||
    subjectLower.includes("legal") ||
    subjectLower.includes("contract") ||
    subjectLower.includes("agreement") ||
    subjectLower.includes("compliance")
  ) {
    return "legal";
  }

  // Financial emails
  if (
    fromLower.includes("bank") ||
    fromLower.includes("invoice") ||
    fromLower.includes("payment") ||
    fromLower.includes("stripe") ||
    fromLower.includes("quickbooks") ||
    subjectLower.includes("invoice") ||
    subjectLower.includes("payment") ||
    subjectLower.includes("financial") ||
    subjectLower.includes("accounting")
  ) {
    return "financial";
  }

  // Team emails - internal communications
  if (
    fromLower.includes("@rimo") ||
    fromLower.includes("github") ||
    fromLower.includes("linear") ||
    fromLower.includes("slack") ||
    subjectLower.includes("team") ||
    subjectLower.includes("meeting")
  ) {
    return "team";
  }

  return "other";
}

function getPriority(category: EmailSummary["category"], subject: string): "high" | "medium" | "low" {
  const subjectLower = subject.toLowerCase();
  
  // High priority keywords
  if (
    subjectLower.includes("urgent") ||
    subjectLower.includes("asap") ||
    subjectLower.includes("critical") ||
    subjectLower.includes("emergency") ||
    subjectLower.includes("action required")
  ) {
    return "high";
  }

  // Client emails are generally medium-high priority
  if (category === "client" || category === "legal") {
    return "high";
  }

  // Financial emails are medium priority
  if (category === "financial") {
    return "medium";
  }

  return "low";
}

function sanitizeEmailText(text: string): string {
  return text
    .replace(/\s+/g, " ")
    .trim()
    .substring(0, 150); // Limit snippet length
}

function extractSenderName(from: string): string {
  // Extract name from "Name <email@domain.com>" format
  const match = from.match(/^([^<]+)<.+>$/);
  if (match) {
    return match[1].trim().replace(/"/g, "");
  }
  
  // If it's just an email, extract the part before @
  const emailMatch = from.match(/^([^@]+)@/);
  if (emailMatch) {
    return emailMatch[1].replace(/[._]/g, " ").trim();
  }
  
  return from;
}

async function executeGogCommand(): Promise<GogEmail[]> {
  const gogPassword = process.env.GOG_KEYRING_PASSWORD?.trim();
  const gmailAccount = process.env.GMAIL_ACCOUNT?.trim();

  if (!gogPassword || !gmailAccount) {
    throw new Error("GOG_KEYRING_PASSWORD and GMAIL_ACCOUNT must be set.");
  }

  try {
    const command = `GOG_KEYRING_PASSWORD="${gogPassword}" gog gmail ls "is:inbox is:unread" -a "${gmailAccount}" --limit 20 --json`;
    
    const output = execSync(command, {
      encoding: "utf8",
      timeout: 30000, // 30 second timeout
      stdio: ["ignore", "pipe", "ignore"], // Suppress stderr to avoid noise
    });

    if (!output.trim()) {
      return [];
    }

    const emails = JSON.parse(output) as GogEmail[];
    return Array.isArray(emails) ? emails : [];
  } catch (error) {
    console.warn("Failed to fetch Gmail data via gog CLI:", error);
    return [];
  }
}

export async function getGmailSummary(): Promise<{
  unreadCount: number;
  topEmails: EmailSummary[];
}> {
  // Check cache first
  if (
    cachedEmails &&
    cachedCount &&
    Date.now() - cachedEmails.timestamp < CACHE_DURATION &&
    Date.now() - cachedCount.timestamp < CACHE_DURATION
  ) {
    return {
      unreadCount: cachedCount.data,
      topEmails: cachedEmails.data,
    };
  }

  try {
    const gogEmails = await executeGogCommand();
    const unreadCount = gogEmails.length;

    // Process and prioritize emails
    const processedEmails: EmailSummary[] = gogEmails
      .map((email): EmailSummary => {
        const category = categorizeEmail(email.subject, email.from);
        const priority = getPriority(category, email.subject);
        const senderName = extractSenderName(email.from);

        return {
          id: email.id,
          subject: sanitizeEmailText(email.subject),
          sender: senderName,
          snippet: sanitizeEmailText(email.snippet),
          category,
          priority,
          relativeTime: relativeTime(email.date),
          timestamp: email.date,
        };
      })
      .sort((a, b) => {
        // Sort by priority first (high > medium > low), then by timestamp
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
        if (priorityDiff !== 0) return priorityDiff;
        
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      })
      .slice(0, 5); // Top 5 most important emails

    // Cache the results
    cachedEmails = { data: processedEmails, timestamp: Date.now() };
    cachedCount = { data: unreadCount, timestamp: Date.now() };

    return {
      unreadCount,
      topEmails: processedEmails,
    };
  } catch (error) {
    console.warn("Failed to get Gmail summary:", error);
    
    // Return empty data on error
    return {
      unreadCount: 0,
      topEmails: [],
    };
  }
}

export async function getUnreadEmailCount(): Promise<number> {
  try {
    const { unreadCount } = await getGmailSummary();
    return unreadCount;
  } catch (error) {
    console.warn("Failed to get unread email count:", error);
    return 0;
  }
}