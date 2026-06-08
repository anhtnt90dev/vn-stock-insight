interface MetricBadgeProps {
  label: string;
  value: string | number;
  tone?: 'neutral' | 'positive' | 'warning' | 'danger';
}

export function MetricBadge({ label, value, tone = 'neutral' }: MetricBadgeProps) {
  return (
    <span className={`metric-badge metric-badge--${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </span>
  );
}
