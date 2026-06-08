import type { TelemetryQuality } from './types';

export type AgentStatus = 'idle' | 'working' | 'reviewing' | 'blocked' | 'approved';
export type OrganizationPhase =
  | 'Sales'
  | 'discovery'
  | 'architecture'
  | 'implementation'
  | 'review'
  | 'QA'
  | 'release';
export type OrganizationEventType =
  | 'message'
  | 'handoff'
  | 'decision'
  | 'tool_call'
  | 'artifact'
  | 'review'
  | 'approval'
  | 'ci_check'
  | 'token_usage';
export type OrganizationEventStatus =
  | 'pending'
  | 'running'
  | 'passed'
  | 'failed'
  | 'blocked'
  | 'approved'
  | 'rejected';

export interface AgentProfile {
  agentId: string;
  role: string;
  responsibility: string;
  status: AgentStatus;
  ownership: string[];
  reviewAuthority: string[];
}

export interface TokenUsage {
  prompt: number;
  completion: number;
  total: number;
}

export interface OrganizationEvent {
  eventId: string;
  runId: string;
  timestamp: string;
  phase: OrganizationPhase;
  agentId: string;
  role: string;
  eventType: OrganizationEventType;
  summary: string;
  status: OrganizationEventStatus;
  fromAgentId?: string;
  toAgentId?: string;
  artifactRefs?: string[];
  toolName?: string;
  durationMs?: number;
  tokenUsage?: TokenUsage;
  telemetryQuality: TelemetryQuality;
}

export interface AgentUsageSummary {
  agentId: string;
  role: string;
  status: AgentStatus;
  toolCalls: number;
  tokens: TokenUsage & { quality: TelemetryQuality };
}

type TokenizedOrganizationEvent = OrganizationEvent & { tokenUsage: TokenUsage };

function hasTokenUsage(event: OrganizationEvent): event is TokenizedOrganizationEvent {
  return event.tokenUsage !== undefined;
}

function summarizeTokenQuality(events: TokenizedOrganizationEvent[]): TelemetryQuality {
  if (events.length === 0) return 'unavailable';
  if (events.every((event) => event.telemetryQuality === 'actual')) return 'actual';
  if (events.some((event) => event.telemetryQuality === 'actual' || event.telemetryQuality === 'estimated')) {
    return 'estimated';
  }
  return 'unavailable';
}

export function groupEventsByPhase(events: OrganizationEvent[]): Record<string, OrganizationEvent[]> {
  return events.reduce<Record<string, OrganizationEvent[]>>((groups, event) => {
    groups[event.phase] = groups[event.phase] ?? [];
    groups[event.phase].push(event);
    return groups;
  }, {});
}

export function summarizeAgentUsage(
  agents: AgentProfile[],
  events: OrganizationEvent[],
): AgentUsageSummary[] {
  return agents.map((agent) => {
    const agentEvents = events.filter((event) => event.agentId === agent.agentId);
    const tokenEvents = agentEvents.filter(hasTokenUsage);
    const tokens = tokenEvents.reduce<TokenUsage>(
      (sum, event) => ({
        prompt: sum.prompt + event.tokenUsage.prompt,
        completion: sum.completion + event.tokenUsage.completion,
        total: sum.total + event.tokenUsage.total,
      }),
      { prompt: 0, completion: 0, total: 0 },
    );

    return {
      agentId: agent.agentId,
      role: agent.role,
      status: agent.status,
      toolCalls: agentEvents.filter((event) => event.eventType === 'tool_call').length,
      tokens: {
        ...tokens,
        quality: summarizeTokenQuality(tokenEvents),
      },
    };
  });
}
