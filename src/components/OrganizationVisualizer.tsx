import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  ClipboardCheck,
  GitBranch,
  ListChecks,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { loadJson } from '../data/loaders';
import { groupEventsByPhase, summarizeAgentUsage } from '../domain/organization';
import type {
  AgentProfile,
  AgentStatus,
  OrganizationEvent,
  OrganizationEventStatus,
  OrganizationEventType,
  OrganizationPhase,
} from '../domain/organization';
import type { TelemetryQuality } from '../domain/types';

const PHASE_ORDER: OrganizationPhase[] = [
  'Sales',
  'discovery',
  'architecture',
  'implementation',
  'review',
  'QA',
  'release',
];

const agentsPath = 'data/organization/agents.json';
const demoRunPath = 'data/organization/runs/demo-run.json';

interface TelemetryCopy {
  label: string;
  explanation: string;
}

const telemetryCopy: Record<TelemetryQuality, TelemetryCopy> = {
  actual: {
    label: 'Đo trực tiếp',
    explanation: 'Số liệu được ghi trực tiếp trong trace đã sanitize.',
  },
  estimated: {
    label: 'Ước tính',
    explanation: 'Số liệu được suy luận từ trace, chưa phủ đủ mọi bước.',
  },
  unavailable: {
    label: 'Chưa có telemetry',
    explanation: 'Sự kiện chưa có token, thời lượng hoặc trace chi tiết.',
  },
};

const phaseLabels: Record<OrganizationPhase, string> = {
  Sales: 'Sales',
  discovery: 'Khám phá',
  architecture: 'Kiến trúc',
  implementation: 'Triển khai',
  review: 'Review',
  QA: 'QA',
  release: 'Release',
};

const statusLabels: Record<OrganizationEventStatus, string> = {
  pending: 'Chờ xử lý',
  running: 'Đang chạy',
  passed: 'Đạt',
  failed: 'Lỗi',
  blocked: 'Bị chặn',
  approved: 'Đã duyệt',
  rejected: 'Từ chối',
};

const agentStatusLabels: Record<AgentStatus, string> = {
  idle: 'Sẵn sàng',
  working: 'Đang làm',
  reviewing: 'Đang review',
  blocked: 'Bị chặn',
  approved: 'Đã duyệt',
};

const eventTypeLabels: Record<OrganizationEventType, string> = {
  message: 'Trao đổi',
  handoff: 'Bàn giao',
  decision: 'Quyết định',
  tool_call: 'Tool call',
  artifact: 'Artifact',
  review: 'Review',
  approval: 'Phê duyệt',
  ci_check: 'CI check',
  token_usage: 'Token usage',
};

function formatDateTime(timestamp: string): string {
  return new Date(timestamp).toLocaleString('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

function formatDuration(durationMs?: number): string {
  if (durationMs === undefined) return 'Không có thời lượng';
  if (durationMs < 1000) return `${durationMs} ms`;
  return `${(durationMs / 1000).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} giây`;
}

function orderedPhaseEntries(
  grouped: Record<string, OrganizationEvent[]>,
): Array<[string, OrganizationEvent[]]> {
  const ordered = PHASE_ORDER.filter((phase) => grouped[phase]).map<[string, OrganizationEvent[]]>((phase) => [
    phase,
    grouped[phase],
  ]);
  const extras = Object.entries(grouped).filter(
    ([phase]) => !PHASE_ORDER.includes(phase as OrganizationPhase),
  );

  return [...ordered, ...extras];
}

function TelemetryBadge({ quality }: { quality: TelemetryQuality }) {
  const copy = telemetryCopy[quality];

  return (
    <span className={`telemetry-badge telemetry-badge--${quality}`} title={copy.explanation}>
      {copy.label}
    </span>
  );
}

function LoadingState() {
  return (
    <section className="workspace organization-workspace">
      <span className="eyebrow">Organization Runtime Visualizer</span>
      <h1>Quy trình vận hành đội AI</h1>
      <p className="muted-copy">Đang tải trace vận hành...</p>
    </section>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <section className="workspace organization-workspace">
      <span className="eyebrow">Organization Runtime Visualizer</span>
      <h1>Quy trình vận hành đội AI</h1>
      <p className="error-copy">{message}</p>
    </section>
  );
}

export function OrganizationVisualizer() {
  const [agents, setAgents] = useState<AgentProfile[]>([]);
  const [events, setEvents] = useState<OrganizationEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadOrganizationRun() {
      setIsLoading(true);
      setError(null);

      try {
        const [agentData, eventData] = await Promise.all([
          loadJson<AgentProfile[]>(agentsPath),
          loadJson<OrganizationEvent[]>(demoRunPath),
        ]);

        if (!isMounted) return;
        setAgents(agentData);
        setEvents(eventData);
      } catch (err: unknown) {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : 'Không tải được workflow đội AI');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    void loadOrganizationRun();

    return () => {
      isMounted = false;
    };
  }, []);

  const grouped = useMemo(() => groupEventsByPhase(events), [events]);
  const phaseEntries = useMemo(() => orderedPhaseEntries(grouped), [grouped]);
  const usage = useMemo(() => summarizeAgentUsage(agents, events), [agents, events]);
  const latestReviewEvent = useMemo(
    () =>
      [...events]
        .reverse()
        .find((event) => event.phase === 'review' || event.eventType === 'review' || event.eventType === 'approval'),
    [events],
  );
  const toolCallCount = useMemo(
    () => events.filter((event) => event.eventType === 'tool_call').length,
    [events],
  );
  const totalTokens = useMemo(
    () => usage.reduce((sum, item) => sum + item.tokens.total, 0),
    [usage],
  );

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;

  return (
    <section className="workspace organization-workspace">
      <header className="topbar">
        <div>
          <span className="eyebrow">Organization Runtime Visualizer</span>
          <h1>Quy trình vận hành đội AI</h1>
        </div>
        <div className="organization-run-meta" aria-label="Thông tin run">
          <span>Run demo-run</span>
          <strong>{events.length} sự kiện</strong>
        </div>
      </header>

      <div className="organization-summary-grid" aria-label="Tổng quan workflow">
        <article className="metric-badge">
          <span>Agent</span>
          <strong>{agents.length}</strong>
        </article>
        <article className="metric-badge metric-badge--positive">
          <span>Sự kiện đạt/duyệt</span>
          <strong>{events.filter((event) => event.status === 'passed' || event.status === 'approved').length}</strong>
        </article>
        <article className="metric-badge metric-badge--warning">
          <span>Tool calls</span>
          <strong>{toolCallCount}</strong>
        </article>
        <article className="metric-badge">
          <span>Tokens</span>
          <strong>{totalTokens.toLocaleString('vi-VN')}</strong>
        </article>
      </div>

      <section className="telemetry-legend" aria-label="Chất lượng telemetry">
        {Object.entries(telemetryCopy).map(([quality, copy]) => (
          <div key={quality}>
            <TelemetryBadge quality={quality as TelemetryQuality} />
            <p>{copy.explanation}</p>
          </div>
        ))}
      </section>

      <div className="organization-layout">
        <section className="workflow-map" aria-label="Bản đồ workflow">
          <div className="section-heading">
            <GitBranch size={18} />
            <h2>Bản đồ workflow</h2>
          </div>
          <ol className="phase-map">
            {phaseEntries.map(([phase, phaseEvents]) => (
              <li key={phase}>
                <span>{phaseLabels[phase as OrganizationPhase] ?? phase}</span>
                <strong>{phaseEvents.length} sự kiện</strong>
              </li>
            ))}
          </ol>
        </section>

        <section className="agent-board" aria-label="Bảng agent">
          <div className="section-heading">
            <Users size={18} />
            <h2>Bảng agent</h2>
          </div>
          <div className="agent-grid">
            {agents.map((agent) => (
              <article key={agent.agentId} className="agent-card">
                <div>
                  <span className={`status-pill status-pill--${agent.status}`}>
                    {agentStatusLabels[agent.status]}
                  </span>
                  <h3>{agent.role}</h3>
                </div>
                <p>{agent.responsibility}</p>
                <dl>
                  <div>
                    <dt>Ownership</dt>
                    <dd>{agent.ownership.join(', ')}</dd>
                  </div>
                  <div>
                    <dt>Quyền review</dt>
                    <dd>{agent.reviewAuthority.join(', ')}</dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
        </section>

        <section className="timeline" aria-label="Timeline sự kiện">
          <div className="section-heading">
            <Activity size={18} />
            <h2>Timeline sự kiện</h2>
          </div>
          {phaseEntries.map(([phase, phaseEvents]) => (
            <section key={phase} className="phase-block">
              <h3>{phaseLabels[phase as OrganizationPhase] ?? phase}</h3>
              {phaseEvents.map((event) => (
                <article key={event.eventId} className="event-row">
                  <div className="event-row__header">
                    <strong>{event.role}</strong>
                    <TelemetryBadge quality={event.telemetryQuality} />
                  </div>
                  <p>{event.summary}</p>
                  <dl className="event-meta">
                    <div>
                      <dt>Thời gian</dt>
                      <dd>{formatDateTime(event.timestamp)}</dd>
                    </div>
                    <div>
                      <dt>Loại</dt>
                      <dd>{eventTypeLabels[event.eventType]}</dd>
                    </div>
                    <div>
                      <dt>Trạng thái sự kiện</dt>
                      <dd>{statusLabels[event.status]}</dd>
                    </div>
                    <div>
                      <dt>Thời lượng</dt>
                      <dd>{formatDuration(event.durationMs)}</dd>
                    </div>
                  </dl>
                  {event.toolName ? <small>Tool: {event.toolName}</small> : null}
                </article>
              ))}
            </section>
          ))}
        </section>

        <aside className="organization-side-panels">
          <section className="review-panel" aria-label="Trạng thái review">
            <div className="section-heading">
              <ClipboardCheck size={18} />
              <h2>Trạng thái review</h2>
            </div>
            {latestReviewEvent ? (
              <article className="event-row">
                <div className="event-row__header">
                  <strong>{statusLabels[latestReviewEvent.status]}</strong>
                  <TelemetryBadge quality={latestReviewEvent.telemetryQuality} />
                </div>
                <p>{latestReviewEvent.summary}</p>
                <small>{formatDateTime(latestReviewEvent.timestamp)}</small>
              </article>
            ) : (
              <p className="muted-copy">Chưa có sự kiện review trong run này.</p>
            )}
          </section>

          <section className="ledger" aria-label="Sổ token/tool">
            <div className="section-heading">
              <ListChecks size={18} />
              <h2>Sổ token/tool</h2>
            </div>
            {usage.map((item) => (
              <article key={item.agentId} className="ledger-row">
                <div>
                  <strong>{item.role}</strong>
                  <span>{agentStatusLabels[item.status]}</span>
                </div>
                <dl>
                  <div>
                    <dt>Tool calls</dt>
                    <dd>{item.toolCalls}</dd>
                  </div>
                  <div>
                    <dt>Tokens</dt>
                    <dd>Tokens: {item.tokens.total.toLocaleString('vi-VN')}</dd>
                  </div>
                </dl>
                <TelemetryBadge quality={item.tokens.quality} />
              </article>
            ))}
          </section>

          <section className="review-panel" aria-label="Ghi chú dữ liệu trace">
            <div className="section-heading">
              <ShieldCheck size={18} />
              <h2>Trace đã sanitize</h2>
            </div>
            <p className="muted-copy">
              UI chỉ đọc JSON tĩnh trong public/data/organization và không hiển thị secret, API key hoặc endpoint live.
            </p>
          </section>
        </aside>
      </div>
    </section>
  );
}
