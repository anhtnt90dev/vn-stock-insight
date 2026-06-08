import type { DataHealth } from '../domain/types';

interface DataStatusProps {
  dataHealth: DataHealth;
  refreshState: string;
}

function sourceLabel(source: DataHealth['source']): string {
  if (source === 'github-actions-etl') return 'ETL từ GitHub Actions';
  if (source === 'manual-browser-refresh') return 'Làm mới thủ công';
  return 'Dữ liệu tĩnh';
}

function statusLabel(status: DataHealth['status']): string {
  if (status === 'healthy') return 'Sẵn sàng';
  if (status === 'partial') return 'Thiếu một phần';
  return 'Lỗi dữ liệu';
}

export function DataStatus({ dataHealth, refreshState }: DataStatusProps) {
  const updatedAt = new Date(dataHealth.updatedAt).toLocaleString('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    <section className={`data-status data-status--${dataHealth.status}`} aria-label="Trạng thái dữ liệu">
      <div>
        <span className="eyebrow">{sourceLabel(dataHealth.source)}</span>
        <strong>{statusLabel(dataHealth.status)}</strong>
        <p>{dataHealth.message}</p>
      </div>
      <dl>
        <div>
          <dt>Cập nhật</dt>
          <dd>{updatedAt}</dd>
        </div>
        <div>
          <dt>Làm mới</dt>
          <dd>{refreshState}</dd>
        </div>
      </dl>
    </section>
  );
}
