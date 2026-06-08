import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { OrganizationVisualizer } from '../../src/components/OrganizationVisualizer';
import type { AgentProfile, OrganizationEvent } from '../../src/domain/organization';

const agents: AgentProfile[] = [
  {
    agentId: 'frontend',
    role: 'Frontend Engineer Agent',
    responsibility: 'Build runtime visualizations.',
    status: 'working',
    ownership: ['src/components'],
    reviewAuthority: ['UI review'],
  },
  {
    agentId: 'qa',
    role: 'QA Engineer Agent',
    responsibility: 'Review release quality.',
    status: 'approved',
    ownership: ['tests'],
    reviewAuthority: ['release sign-off'],
  },
];

const events: OrganizationEvent[] = [
  {
    eventId: 'evt-actual',
    runId: 'demo-run',
    timestamp: '2026-06-08T09:00:00+07:00',
    phase: 'implementation',
    agentId: 'frontend',
    role: 'Frontend Engineer Agent',
    eventType: 'tool_call',
    summary: 'Rendered the organization visualizer.',
    status: 'passed',
    toolName: 'npm test',
    durationMs: 900,
    tokenUsage: { prompt: 80, completion: 20, total: 100 },
    telemetryQuality: 'actual',
  },
  {
    eventId: 'evt-estimated',
    runId: 'demo-run',
    timestamp: '2026-06-08T09:05:00+07:00',
    phase: 'review',
    agentId: 'qa',
    role: 'QA Engineer Agent',
    eventType: 'review',
    summary: 'Reviewed quality gates.',
    status: 'approved',
    tokenUsage: { prompt: 50, completion: 25, total: 75 },
    telemetryQuality: 'estimated',
  },
  {
    eventId: 'evt-unavailable',
    runId: 'demo-run',
    timestamp: '2026-06-08T09:10:00+07:00',
    phase: 'release',
    agentId: 'qa',
    role: 'QA Engineer Agent',
    eventType: 'ci_check',
    summary: 'Release telemetry was unavailable.',
    status: 'pending',
    telemetryQuality: 'unavailable',
  },
];

describe('OrganizationVisualizer', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('loads organization fixtures through base-url-safe paths and renders Vietnamese runtime sections', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = input.toString();
      if (url.endsWith('/data/organization/agents.json')) {
        return Response.json(agents);
      }
      if (url.endsWith('/data/organization/runs/demo-run.json')) {
        return Response.json(events);
      }
      return new Response(null, { status: 404 });
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<OrganizationVisualizer />);

    expect(await screen.findByText('Bản đồ workflow')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Quy trình vận hành đội AI' })).toBeInTheDocument();
    expect(screen.getByText('Timeline sự kiện')).toBeInTheDocument();
    expect(screen.getByText('Bảng agent')).toBeInTheDocument();
    expect(screen.getByText('Sổ token/tool')).toBeInTheDocument();
    expect(screen.getByText('Trạng thái review')).toBeInTheDocument();
    expect(screen.getAllByText('Đo trực tiếp').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Ước tính').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Chưa có telemetry').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Frontend Engineer Agent').length).toBeGreaterThan(0);
    expect(screen.getByText('Tokens: 100')).toBeInTheDocument();

    expect(fetchMock).toHaveBeenCalledWith('/data/organization/agents.json');
    expect(fetchMock).toHaveBeenCalledWith('/data/organization/runs/demo-run.json');
  });
});
