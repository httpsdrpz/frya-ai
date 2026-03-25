export type MessageRole = "assistant" | "user" | "system";

export type AgentKey = "sdr" | "cs" | "financeiro" | "marketing";

export type AgentState = "draft" | "configuring" | "active";

export interface CompanyProfile {
  id: string;
  businessName: string;
  industry: string;
  description: string;
  teamSize: string;
  segment?: string;
  size?: string;
  mainPain?: string;
  icp?: string;
  product?: string;
  tone?: string;
  salesChannels: string[];
  currentTools: string[];
  goals: string[];
  painPoints: string[];
  monthlyLeads: number;
  monthlyRevenueRange: string;
  onboardingStage: "discovery" | "operations" | "activation";
  language: "pt-BR";
}

export interface OnboardingMessage {
  id: string;
  role: Exclude<MessageRole, "system">;
  content: string;
  createdAt: string;
}

export interface OnboardingInsight {
  key: string;
  label: string;
  value: string;
  completed: boolean;
}

export interface AgentCapability {
  title: string;
  description: string;
}

export interface AgentDefinition {
  id: AgentKey;
  name: string;
  sector: string;
  description: string;
  objective: string;
  tone: string;
  status: AgentState;
  readiness: number;
  channels: string[];
  tools: string[];
  checklist: string[];
  metrics: string[];
  capabilities: AgentCapability[];
}

export interface AgentChatMessage {
  id: string;
  agentId: AgentKey;
  role: Exclude<MessageRole, "system">;
  content: string;
  createdAt: string;
}

export interface OnboardingAnalysis {
  summary: string;
  nextQuestion: string;
  completion: number;
  suggestedAgents: AgentKey[];
  insights: OnboardingInsight[];
  companyProfile: CompanyProfile;
}

export interface AgentTeamBundle {
  company: CompanyProfile;
  agents: AgentDefinition[];
}

export interface OnboardingGenerationData {
  name: string;
  segment: string;
  size: string;
  mainPain: string;
  icp: string;
  product: string;
  tone: string;
  suggestedAgents: AgentKey[];
}

export interface DatabaseHealth {
  provider: "neon";
  orm: "drizzle";
  configured: boolean;
  status: "ready" | "missing_env";
}

export interface ClaudeMessage {
  role: "user" | "assistant";
  content: string;
}
