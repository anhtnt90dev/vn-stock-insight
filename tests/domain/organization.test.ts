import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { groupEventsByPhase, summarizeAgentUsage } from '../../src/domain/organization';
import type {
  AgentProfile,
  OrganizationEvent,
  OrganizationEventStatus,
  OrganizationEventType,
  OrganizationPhase,
} from '../../src/domain/organization';
import type { TelemetryQuality } from '../../src/domain/types';

const organizationFixtureRoot = join(process.cwd(), 'public', 'data', 'organization');
const expectedAgentIds = [
  'sales',
  'architect',
  'tech-lead',
  'data-engineer',
  'quant',
  'frontend',
  'qa',
  'devops',
];
const secretLikePattern = /(gho_|ghp_|sk-|api_key|password|secret)/i;

interface TokenUsageFixture {
  eventId: string;
  runId: string;
  agentId: string;
  role: string;
  phase: OrganizationPhase;
  task: string;
  prompt: number;
  completion: number;
  total: number;
  telemetryQuality: TelemetryQuality;
  sanitized: boolean;
}

interface ToolCallFixture {
  eventId: string;
  runId: string;
  agentId: string;
  role: string;
  toolName: string;
  purpose: string;
  status: OrganizationEventStatus;
  durationMs: number;
  summary: string;
  sanitized: boolean;
}

function readOrganizationFixture<T>(...pathSegments: string[]): T {
  return JSON.parse(readFileSync(join(organizationFixtureRoot, ...pathSegments), 'utf8')) as T;
}

function findSecretLikeValue(value: unknown, path = '$'): string | undefined {
  if (typeof value === 'string') {
    return secretLikePattern.test(value) ? path : undefined;
  }

  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index += 1) {
      const found = findSecretLikeValue(value[index], `${path}[${index}]`);
      if (found) return found;
    }
  }

  if (value && typeof value === 'object') {
    for (const [key, childValue] of Object.entries(value)) {
      if (secretLikePattern.test(key)) return `${path}.${key}`;
      const found = findSecretLikeValue(childValue, `${path}.${key}`);
      if (found) return found;
    }
  }

  return undefined;
}

function expectStringArray(value: unknown) {
  expect(Array.isArray(value)).toBe(true);
  expect(value).not.toHaveLength(0);
  expect((value as unknown[]).every((item) => typeof item === 'string' && item.length > 0)).toBe(true);
}

const agents: AgentProfile[] = [
  {
    agentId: 'tech-lead',
    role: 'Tech Lead Agent',
    responsibility: 'Coordinate implementation quality',
    status: 'reviewing',
    ownership: ['src', 'tests'],
    reviewAuthority: ['feature/* -> dev'],
  },
  {
    agentId: 'frontend',
    role: 'Frontend Engineer Agent',
    responsibility: 'Build the visualizer UI',
    status: 'working',
    ownership: ['src/components'],
    reviewAuthority: ['UI changes'],
  },
  {
    agentId: 'qa',
    role: 'QA Engineer Agent',
    responsibility: 'Verify release quality',
    status: 'idle',
    ownership: ['tests'],
    reviewAuthority: ['release sign-off'],
  },
];

const events: OrganizationEvent[] = [
  {
    eventId: 'evt-001',
    runId: 'demo-run',
    timestamp: '2026-06-08T09:00:00+07:00',
    phase: 'Sales',
    agentId: 'sales',
    role: 'Sales Agent',
    eventType: 'message',
    summary: 'Sales intake captured VN Stock Insight scope.',
    status: 'passed',
    telemetryQuality: 'unavailable',
  },
  {
    eventId: 'evt-002',
    runId: 'demo-run',
    timestamp: '2026-06-08T09:15:00+07:00',
    phase: 'architecture',
    agentId: 'frontend',
    role: 'Frontend Engineer Agent',
    eventType: 'decision',
    summary: 'Selected static trace replay for GitHub Pages.',
    status: 'approved',
    tokenUsage: { prompt: 90, completion: 35, total: 125 },
    telemetryQuality: 'estimated',
  },
  {
    eventId: 'evt-003',
    runId: 'demo-run',
    timestamp: '2026-06-08T09:45:00+07:00',
    phase: 'implementation',
    agentId: 'tech-lead',
    role: 'Tech Lead Agent',
    eventType: 'tool_call',
    summary: 'Ran focused organization tests.',
    status: 'passed',
    toolName: 'npm test',
    durationMs: 1200,
    tokenUsage: { prompt: 100, completion: 40, total: 140 },
    telemetryQuality: 'actual',
  },
  {
    eventId: 'evt-004',
    runId: 'demo-run',
    timestamp: '2026-06-08T09:50:00+07:00',
    phase: 'implementation',
    agentId: 'tech-lead',
    role: 'Tech Lead Agent',
    eventType: 'tool_call',
    summary: 'Inspected git status.',
    status: 'passed',
    toolName: 'git status',
    durationMs: 300,
    telemetryQuality: 'unavailable',
  },
  {
    eventId: 'evt-005',
    runId: 'demo-run',
    timestamp: '2026-06-08T10:15:00+07:00',
    phase: 'review',
    agentId: 'qa',
    role: 'QA Engineer Agent',
    eventType: 'review',
    summary: 'Approved quality gate coverage.',
    status: 'approved',
    telemetryQuality: 'unavailable',
  },
];

describe('organization trace model', () => {
  it('groups events by phase while preserving event order inside each phase', () => {
    const grouped = groupEventsByPhase(events);

    expect(grouped.Sales.map((event) => event.eventId)).toEqual(['evt-001']);
    expect(grouped.architecture.map((event) => event.eventId)).toEqual(['evt-002']);
    expect(grouped.implementation.map((event) => event.eventId)).toEqual(['evt-003', 'evt-004']);
    expect(grouped.review.map((event) => event.eventId)).toEqual(['evt-005']);
  });

  it('summarizes token and tool usage by agent', () => {
    const summary = summarizeAgentUsage(agents, events);

    expect(summary).toHaveLength(3);
    expect(summary[0]).toMatchObject({
      agentId: 'tech-lead',
      role: 'Tech Lead Agent',
      status: 'reviewing',
      toolCalls: 2,
      tokens: { prompt: 100, completion: 40, total: 140, quality: 'estimated' },
    });
    expect(summary[1]).toMatchObject({
      agentId: 'frontend',
      toolCalls: 0,
      tokens: { prompt: 90, completion: 35, total: 125, quality: 'estimated' },
    });
    expect(summary[2]).toMatchObject({
      agentId: 'qa',
      toolCalls: 0,
      tokens: { prompt: 0, completion: 0, total: 0, quality: 'unavailable' },
    });
  });

  it('marks partial token telemetry as estimated even when token events are actual', () => {
    const partialAgents: AgentProfile[] = [
      {
        agentId: 'architect',
        role: 'Architect Agent',
        responsibility: 'Own architecture decisions',
        status: 'reviewing',
        ownership: ['src/domain'],
        reviewAuthority: ['architecture-impacting changes'],
      },
    ];
    const partialEvents: OrganizationEvent[] = [
      {
        eventId: 'partial-001',
        runId: 'demo-run',
        timestamp: '2026-06-08T09:15:00+07:00',
        phase: 'architecture',
        agentId: 'architect',
        role: 'Architect Agent',
        eventType: 'decision',
        summary: 'Recorded an architecture decision.',
        status: 'approved',
        tokenUsage: { prompt: 20, completion: 10, total: 30 },
        telemetryQuality: 'actual',
      },
      {
        eventId: 'partial-002',
        runId: 'demo-run',
        timestamp: '2026-06-08T09:20:00+07:00',
        phase: 'architecture',
        agentId: 'architect',
        role: 'Architect Agent',
        eventType: 'artifact',
        summary: 'Linked a design artifact without token telemetry.',
        status: 'passed',
        telemetryQuality: 'unavailable',
      },
    ];

    const [summary] = summarizeAgentUsage(partialAgents, partialEvents);

    expect(summary.tokens).toEqual({ prompt: 20, completion: 10, total: 30, quality: 'estimated' });
  });

  it('keeps fully covered actual token telemetry as actual', () => {
    const [summary] = summarizeAgentUsage([agents[0]], [
      {
        eventId: 'actual-001',
        runId: 'demo-run',
        timestamp: '2026-06-08T09:45:00+07:00',
        phase: 'implementation',
        agentId: 'tech-lead',
        role: 'Tech Lead Agent',
        eventType: 'tool_call',
        summary: 'Ran a command with full telemetry.',
        status: 'passed',
        toolName: 'npm test',
        durationMs: 800,
        tokenUsage: { prompt: 45, completion: 15, total: 60 },
        telemetryQuality: 'actual',
      },
    ]);

    expect(summary.tokens).toEqual({ prompt: 45, completion: 15, total: 60, quality: 'actual' });
  });

  it('validates static organization fixtures and redaction markers', () => {
    const fixtureAgents = readOrganizationFixture<AgentProfile[]>('agents.json');
    const runEvents = readOrganizationFixture<OrganizationEvent[]>('runs', 'demo-run.json');
    const tokenUsage = readOrganizationFixture<TokenUsageFixture[]>('token-usage', 'demo-run.json');
    const toolCalls = readOrganizationFixture<ToolCallFixture[]>('tool-calls', 'demo-run.json');
    const agentIds = fixtureAgents.map((agent) => agent.agentId);
    const runEventIds = runEvents.map((event) => event.eventId);
    const runEventIdSet = new Set(runEventIds);

    expect(agentIds).toEqual(expectedAgentIds);
    for (const agent of fixtureAgents) {
      expect(agent.role).toContain('Agent');
      expect(agent.responsibility).not.toHaveLength(0);
      expectStringArray(agent.ownership);
      expectStringArray(agent.reviewAuthority);
    }

    expect(runEventIds).toEqual(['evt-001', 'evt-002', 'evt-003', 'evt-004', 'evt-005']);
    expect(runEvents.every((event) => event.runId === 'demo-run')).toBe(true);
    expect(runEvents).toEqual(
      expect.arrayContaining([
        expect.objectContaining<Partial<OrganizationEvent>>({
          eventId: 'evt-001',
          phase: 'Sales',
          eventType: 'message' as OrganizationEventType,
        }),
        expect.objectContaining<Partial<OrganizationEvent>>({
          eventId: 'evt-002',
          phase: 'architecture',
          eventType: 'decision' as OrganizationEventType,
        }),
        expect.objectContaining<Partial<OrganizationEvent>>({
          eventId: 'evt-003',
          phase: 'implementation',
          eventType: 'handoff' as OrganizationEventType,
        }),
        expect.objectContaining<Partial<OrganizationEvent>>({
          eventId: 'evt-005',
          phase: 'review',
          eventType: 'review' as OrganizationEventType,
        }),
      ]),
    );

    expect(tokenUsage.every((entry) => entry.runId === 'demo-run')).toBe(true);
    for (const entry of tokenUsage) {
      expect(expectedAgentIds).toContain(entry.agentId);
      expect(runEventIdSet.has(entry.eventId)).toBe(true);
      expect(entry.total).toBe(entry.prompt + entry.completion);
      expect(entry.sanitized).toBe(true);
    }

    expect(toolCalls.every((entry) => entry.runId === 'demo-run')).toBe(true);
    for (const entry of toolCalls) {
      expect(expectedAgentIds).toContain(entry.agentId);
      expect(entry.eventId).toMatch(/^tool-\d{3}$/);
      expect(entry.sanitized).toBe(true);
      expect(entry.durationMs).toBeGreaterThanOrEqual(0);
    }

    expect(
      findSecretLikeValue({
        fixtureAgents,
        runEvents,
        tokenUsage,
        toolCalls,
      }),
    ).toBeUndefined();
  });
});
