const CLAUDE_API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-4-20250514";

export interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ClaudeResponse {
  content: Array<{
    text: string;
  }>;
}

export async function callClaude(
  messages: Message[],
  systemPrompt: string,
  maxTokens = 1000,
): Promise<string> {
  const response = await fetch(CLAUDE_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages,
    }),
  });

  if (!response.ok) {
    throw new Error(`Claude API error: ${response.statusText}`);
  }

  const data = (await response.json()) as ClaudeResponse;
  return data.content[0].text;
}
