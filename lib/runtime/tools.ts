import type { AgentKey } from "@/types";

export interface ToolParameter {
  type: "string" | "number" | "boolean" | "array" | "object";
  description: string;
  enum?: string[];
  items?: { type: ToolParameter["type"] };
  required?: boolean;
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, ToolParameter>;
  requiredParams: string[];
}

export interface ToolResult {
  success: boolean;
  data?: unknown;
  error?: string;
  display?: string;
}

export interface ToolContext {
  userId: string;
  companyId: string;
  agentId: string;
  agentType: AgentKey;
  conversationId?: string;
}

export type ToolScope = AgentKey | "*";
export type ToolHandler = (
  params: Record<string, unknown>,
  context: ToolContext,
) => Promise<ToolResult> | ToolResult;

interface RegisteredTool {
  definition: ToolDefinition;
  agents: ToolScope[];
  handler: ToolHandler;
}

interface ClaudeJsonSchema {
  type: ToolParameter["type"];
  description: string;
  enum?: string[];
  items?: { type: ToolParameter["type"] };
  additionalProperties?: boolean;
}

export interface ClaudeToolDefinition {
  name: string;
  description: string;
  input_schema: {
    type: "object";
    properties: Record<string, ClaudeJsonSchema>;
    required: string[];
    additionalProperties: false;
  };
}

export interface ListedToolDefinition extends ToolDefinition {
  agents: ToolScope[];
}

const registry = new Map<string, RegisteredTool>();

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeRequiredParams(definition: ToolDefinition) {
  const required = new Set(definition.requiredParams);

  for (const [paramName, param] of Object.entries(definition.parameters)) {
    if (param.required) {
      required.add(paramName);
    }
  }

  return [...required];
}

function validateArrayItems(
  value: unknown[],
  itemType: ToolParameter["type"] | undefined,
) {
  if (!itemType) {
    return true;
  }

  return value.every((item) => validateParameterType(item, itemType));
}

function validateParameterType(value: unknown, type: ToolParameter["type"]) {
  if (type === "string") {
    return typeof value === "string";
  }

  if (type === "number") {
    return typeof value === "number" && Number.isFinite(value);
  }

  if (type === "boolean") {
    return typeof value === "boolean";
  }

  if (type === "array") {
    return Array.isArray(value);
  }

  return isPlainObject(value);
}

function validateParams(
  definition: ToolDefinition,
  params: unknown,
): { ok: true; params: Record<string, unknown> } | { ok: false; error: string } {
  if (!isPlainObject(params)) {
    return {
      ok: false,
      error: "Os parametros precisam ser um objeto JSON valido.",
    };
  }

  const requiredParams = normalizeRequiredParams(definition);

  for (const requiredParam of requiredParams) {
    if (!(requiredParam in params)) {
      return {
        ok: false,
        error: `Parametro obrigatorio ausente: ${requiredParam}.`,
      };
    }
  }

  for (const [paramName, paramDefinition] of Object.entries(definition.parameters)) {
    const value = params[paramName];

    if (value === undefined) {
      continue;
    }

    if (!validateParameterType(value, paramDefinition.type)) {
      return {
        ok: false,
        error: `Parametro invalido para ${paramName}: esperado ${paramDefinition.type}.`,
      };
    }

    if (paramDefinition.enum && typeof value === "string") {
      if (!paramDefinition.enum.includes(value)) {
        return {
          ok: false,
          error: `Valor invalido para ${paramName}. Use um destes: ${paramDefinition.enum.join(", ")}.`,
        };
      }
    }

    if (paramDefinition.type === "array" && Array.isArray(value)) {
      const itemType = paramDefinition.items?.type;

      if (!validateArrayItems(value, itemType)) {
        return {
          ok: false,
          error: `Um ou mais itens em ${paramName} nao seguem o tipo ${itemType}.`,
        };
      }
    }
  }

  return { ok: true, params };
}

function toJsonSchemaParameter(param: ToolParameter): ClaudeJsonSchema {
  const schema: ClaudeJsonSchema = {
    type: param.type,
    description: param.description,
  };

  if (param.enum?.length) {
    schema.enum = [...param.enum];
  }

  if (param.type === "array" && param.items) {
    schema.items = { type: param.items.type };
  }

  if (param.type === "object") {
    schema.additionalProperties = true;
  }

  return schema;
}

export function registerTool(config: {
  agents: ToolScope[];
  definition: ToolDefinition;
  handler: ToolHandler;
}) {
  const normalizedDefinition: ToolDefinition = {
    ...config.definition,
    requiredParams: normalizeRequiredParams(config.definition),
  };

  if (registry.has(normalizedDefinition.name)) {
    throw new Error(`Tool ja registrada: ${normalizedDefinition.name}`);
  }

  registry.set(normalizedDefinition.name, {
    definition: normalizedDefinition,
    agents: [...config.agents],
    handler: config.handler,
  });
}

export function listRegisteredTools(): ListedToolDefinition[] {
  return [...registry.values()]
    .map((tool) => ({
      ...tool.definition,
      agents: [...tool.agents],
    }))
    .sort((left, right) => left.name.localeCompare(right.name));
}

export function getToolsForAgent(agentType: AgentKey): ToolDefinition[] {
  return [...registry.values()]
    .filter(
      (tool) => tool.agents.includes("*") || tool.agents.includes(agentType),
    )
    .map((tool) => tool.definition)
    .sort((left, right) => left.name.localeCompare(right.name));
}

export function toClaudeTools(agentType: AgentKey): ClaudeToolDefinition[] {
  return getToolsForAgent(agentType).map((tool) => ({
    name: tool.name,
    description: tool.description,
    input_schema: {
      type: "object",
      properties: Object.fromEntries(
        Object.entries(tool.parameters).map(([name, definition]) => [
          name,
          toJsonSchemaParameter(definition),
        ]),
      ),
      required: [...tool.requiredParams],
      additionalProperties: false,
    },
  }));
}

export async function executeTool(
  name: string,
  params: unknown,
  context: ToolContext,
): Promise<ToolResult> {
  const registeredTool = registry.get(name);

  if (!registeredTool) {
    return {
      success: false,
      error: `Tool nao encontrada: ${name}.`,
      display: `Nao encontrei a tool ${name}.`,
    };
  }

  if (
    !registeredTool.agents.includes("*") &&
    !registeredTool.agents.includes(context.agentType)
  ) {
    return {
      success: false,
      error: `A tool ${name} nao esta disponivel para o agente ${context.agentType}.`,
      display: `A tool ${name} nao esta disponivel para este agente.`,
    };
  }

  const validation = validateParams(registeredTool.definition, params);

  if (!validation.ok) {
    return {
      success: false,
      error: validation.error,
      display: validation.error,
    };
  }

  try {
    return await registeredTool.handler(validation.params, context);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Falha desconhecida na execucao da tool.";

    return {
      success: false,
      error: message,
      display: `Falha ao executar ${name}: ${message}`,
    };
  }
}
