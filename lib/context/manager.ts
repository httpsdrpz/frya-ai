export interface ContextMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ContextWindowResult {
  messages: ContextMessage[];
  estimatedTokens: number;
  summarized: boolean;
}

const DEFAULT_TOKEN_BUDGET = 6000;
const RECENT_MESSAGE_COUNT = 6;

function estimateMessageTokens(message: ContextMessage) {
  return Math.ceil(message.content.length / 4) + 8;
}

function estimateMessagesTokens(messages: ContextMessage[]) {
  return messages.reduce((total, message) => total + estimateMessageTokens(message), 0);
}

function getFirstSentence(content: string) {
  const normalized = content.replace(/\s+/g, " ").trim();

  if (!normalized) {
    return "";
  }

  const match = normalized.match(/^(.{1,220}?[.!?])(?:\s|$)/);

  if (match?.[1]) {
    return match[1];
  }

  return normalized.length > 220 ? `${normalized.slice(0, 217)}...` : normalized;
}

function buildSummaryMessage(messages: ContextMessage[]) {
  const lines = messages
    .map((message) => {
      const prefix = message.role === "user" ? "Usuario" : "Agente";
      return `- ${prefix}: ${getFirstSentence(message.content)}`;
    })
    .filter(Boolean);

  if (!lines.length) {
    return null;
  }

  return {
    role: "assistant" as const,
    content: `Resumo da conversa anterior:\n${lines.join("\n")}`,
  };
}

export function manageContextWindow(
  messages: ContextMessage[],
  tokenBudget = DEFAULT_TOKEN_BUDGET,
): ContextWindowResult {
  if (!messages.length) {
    return {
      messages: [],
      estimatedTokens: 0,
      summarized: false,
    };
  }

  const estimatedTokens = estimateMessagesTokens(messages);

  if (estimatedTokens <= tokenBudget) {
    return {
      messages,
      estimatedTokens,
      summarized: false,
    };
  }

  let recentMessages = messages.slice(-RECENT_MESSAGE_COUNT);
  let olderMessages = messages.slice(0, Math.max(0, messages.length - recentMessages.length));
  let summarySource = [...olderMessages];
  let summaryMessage = buildSummaryMessage(summarySource);

  const buildCandidate = () => {
    if (!summaryMessage) {
      return [...recentMessages];
    }

    return [summaryMessage, ...recentMessages];
  };

  let candidate = buildCandidate();

  while (estimateMessagesTokens(candidate) > tokenBudget) {
    if (summarySource.length > 1) {
      summarySource = summarySource.slice(1);
      summaryMessage = buildSummaryMessage(summarySource);
      candidate = buildCandidate();
      continue;
    }

    if (recentMessages.length > 1) {
      recentMessages = recentMessages.slice(1);
      olderMessages = messages.slice(
        0,
        Math.max(0, messages.length - recentMessages.length),
      );
      summarySource = olderMessages.slice(-4);
      summaryMessage = buildSummaryMessage(summarySource);
      candidate = buildCandidate();
      continue;
    }

    break;
  }

  return {
    messages: candidate,
    estimatedTokens: estimateMessagesTokens(candidate),
    summarized: true,
  };
}
