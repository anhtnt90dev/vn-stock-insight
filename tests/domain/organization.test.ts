import { describe, expect, it } from 'vitest';
import { groupEventsByPhase, summarizeAgentUsage } from '../../src/domain/organization';
import type { AgentProfile, OrganizationEvent } from '../../src/domain/organization';

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
      tokens: { prompt: 100, completion: 40, total: 140, quality: 'actual' },
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
});
