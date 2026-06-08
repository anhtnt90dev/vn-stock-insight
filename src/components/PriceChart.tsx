import type { PriceBar } from '../domain/types';

interface PriceChartProps {
  prices: PriceBar[];
}

function formatPrice(value: number): string {
  return value.toLocaleString('vi-VN', { maximumFractionDigits: 1 });
}

export function PriceChart({ prices }: PriceChartProps) {
  if (prices.length === 0) {
    return <div className="chart-empty">Không có dữ liệu giá.</div>;
  }

  const closes = prices.map((bar) => bar.close);
  const min = Math.min(...closes);
  const max = Math.max(...closes);
  const range = max - min || 1;
  const points = prices
    .map((bar, index) => {
      const x = (index / Math.max(1, prices.length - 1)) * 100;
      const y = 100 - ((bar.close - min) / range) * 100;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(' ');
  const latest = prices[prices.length - 1];

  return (
    <div className="chart-panel">
      <div className="chart-header">
        <div>
          <span className="eyebrow">Giá đóng cửa</span>
          <strong>{formatPrice(latest.close)}</strong>
        </div>
        <span>{latest.date}</span>
      </div>
      <svg className="price-chart" viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label="Biểu đồ giá đóng cửa">
        <polyline points={points} fill="none" stroke="currentColor" strokeWidth="3" vectorEffect="non-scaling-stroke" />
      </svg>
      <div className="chart-scale" aria-hidden="true">
        <span>{formatPrice(min)}</span>
        <span>{formatPrice(max)}</span>
      </div>
    </div>
  );
}
