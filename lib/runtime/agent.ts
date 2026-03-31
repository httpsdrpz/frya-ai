import { manageContextWindow } from "@/lib/context/manager";
import {
  executeTool,
  toClaudeTools,
  type ToolContext,
  type ToolResult,
} from "@/lib/runtime/tools";
import type { AgentKey } from "@/types";

const CLAUDE_API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-4-20250514";

type RuntimeMessage = {
  role: "user" | "assistant";
  content: string;
};

type AnthropicTextBlock = {
  type: "text";
  text: string;
};

type AnthropicToolUseBlock = {
  type: "tool_use";
  id: string;
  name: string;
  input: Record<string, unknown>;
};

type AnthropicToolResultBlock = {
  type: "tool_result";
  tool_use_id: string;
  content: string;
  is_error?: boolean;
};

type AnthropicAssistantBlock = AnthropicTextBlock | AnthropicToolUseBlock;
type AnthropicUserBlock = AnthropicTextBlock | AnthropicToolResultBlock;

type AnthropicMessage =
  | {
      role: "user";
      content: string | AnthropicUserBlock[];
    }
  | {
      role: "assistant";
      content: string | AnthropicAssistantBlock[];
    };

interface AnthropicUsage {
  input_tokens?: number;
  output_tokens?: number;
}

interface AnthropicResponse {
  content: AnthropicAssistantBlock[];
  stop_reason?: "end_turn" | "tool_use" | "max_tokens" | "stop_sequence" | string;
  usage?: AnthropicUsage;
  error?: {
    message?: string;
  };
}

export interface ToolCallRecord {
  tool: string;
  input: Record<string, unknown>;
  result: ToolResult;
  durationMs: number;
}

export interface RuntimeResult {
  reply: string;
  toolCalls: ToolCallRecord[];
  tokensUsed: number;
  rounds: number;
}

interface RuntimeConfig {
  maxToolRounds?: number;
  maxTokens?: number;
  temperature?: number;
}

function getApiKey() {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY nao configurada.");
  }

  return apiKey;
}

function extractText(blocks: AnthropicAssistantBlock[]) {
  return blocks
    .filter((block): block is AnthropicTextBlock => block.type === "text")
    .map((block) => block.text.trim())
    .filter(Boolean)
    .join("\n")
    .trim();
}

function extractToolUseBlocks(blocks: AnthropicAssistantBlock[]) {
  return blocks.filter(
    (block): block is AnthropicToolUseBlock => block.type === "tool_use",
  );
}

function formatToolResultContent(result: ToolResult) {
  return JSON.stringify(
    {
      success: result.success,
      display: result.display ?? null,
      data: result.data ?? null,
      error: result.error ?? null,
    },
    null,
    2,
  );
}

async function callAnthropic(
  systemPrompt: string,
  messages: AnthropicMessage[],
  agentType: AgentKey,
  config: Required<RuntimeConfig>,
) {
  const response = await fetch(CLAUDE_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": getApiKey(),
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      system: systemPrompt,
      max_tokens: config.maxTokens,
      temperature: config.temperature,
      tools: toClaudeTools(agentType),
      messages,
    }),
  });

  const data = (await response.json()) as AnthropicResponse;

  if (!response.ok) {
    const errorMessage = data.error?.message ?? response.statusText;
    throw new Error(`Claude API error: ${errorMessage}`);
  }

  return data;
}

export async function runAgent(
  agentType: AgentKey,
  systemPrompt: string,
  messages: RuntimeMessage[],
  toolContext: ToolContext,
  config?: RuntimeConfig,
): Promise<RuntimeResult> {
  const resolvedConfig: Required<RuntimeConfig> = {
    maxToolRounds: config?.maxToolRounds ?? 5,
    maxTokens: config?.maxTokens ?? 1000,
    temperature: config?.temperature ?? 0.4,
  };

  const contextWindow = manageContextWindow(messages);
  const transcript: AnthropicMessage[] = contextWindow.messages.map((message) => ({
    role: message.role,
    content: message.content,
  }));
  const toolCalls: ToolCallRecord[] = [];
  let tokensUsed = 0;
  let rounds = 0;
  let toolRounds = 0;
  let lastTextReply = "";

  while (toolRounds <= resolvedConfig.maxToolRounds) {
    rounds += 1;

    const response = await callAnthropic(
      systemPrompt,
      transcript,
      agentType,
      resolvedConfig,
    );

    tokensUsed +=
      (response.usage?.input_tokens ?? 0) + (response.usage?.output_tokens ?? 0);

    const textReply = extractText(response.content);
    if (textReply) {
      lastTextReply = textReply;
    }

    if (response.stop_reason === "end_turn") {
      return {
        reply: lastTextReply || "Nao houve resposta textual final do agente.",
        toolCalls,
        tokensUsed,
        rounds,
      };
    }

    if (response.stop_reason === "tool_use") {
      if (toolRounds >= resolvedConfig.maxToolRounds) {
        break;
      }

      const toolUses = extractToolUseBlocks(response.content);

      if (!toolUses.length) {
        break;
      }

      toolRounds += 1;
      transcript.push({
        role: "assistant",
        content: response.content,
      });

      const toolResults: AnthropicToolResultBlock[] = [];

      for (const toolUse of toolUses) {
        const startedAt = Date.now();
        const result = await executeTool(toolUse.name, toolUse.input, toolContext);
        const durationMs = Date.now() - startedAt;

        toolCalls.push({
          tool: toolUse.name,
          input: toolUse.input,
          result,
          durationMs,
        });

        toolResults.push({
          type: "tool_result",
          tool_use_id: toolUse.id,
          content: formatToolResultContent(result),
          ...(result.success ? {} : { is_error: true }),
        });
      }

      transcript.push({
        role: "user",
        content: toolResults,
      });

      continue;
    }

    if (response.stop_reason === "max_tokens") {
      return {
        reply: lastTextReply || "A resposta foi interrompida antes de concluir.",
        toolCalls,
        tokensUsed,
        rounds,
      };
    }

    break;
  }

  return {
    reply:
      lastTextReply ||
      "Nao consegui concluir a solicitacao dentro do limite de execucao.",
    toolCalls,
    tokensUsed,
    rounds,
  };
}
