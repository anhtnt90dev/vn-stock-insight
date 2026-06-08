import { X } from 'lucide-react';
import type { FundamentalMetrics, PriceBar, Recommendation, TechnicalIndicators } from '../domain/types';
import { MetricBadge } from './MetricBadge';
import { PriceChart } from './PriceChart';

interface StockDetailProps {
  symbol: string;
  prices: PriceBar[];
  fundamentals: FundamentalMetrics;
  indicators: TechnicalIndicators;
  recommendation: Recommendation;
  onClose: () => void;
}

function formatNumber(value: number | null, digits = 1): string {
  if (value === null) return 'N/A';
  return value.toLocaleString('vi-VN', {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  });
}

function formatPercent(value: number | null): string {
  if (value === null) return 'N/A';
  return `${Math.round(value * 100)}%`;
}

export function StockDetail({
  symbol,
  prices,
  fundamentals,
  indicators,
  recommendation,
  onClose,
}: StockDetailProps) {
  return (
    <aside className="detail-panel" aria-label={`Chi tiết ${symbol}`}>
      <div className="detail-header">
        <div>
          <span className="eyebrow">Chi tiết mã</span>
          <h2>{symbol}</h2>
        </div>
        <button type="button" className="icon-button" onClick={onClose} aria-label="Đóng chi tiết">
          <X size={18} />
        </button>
      </div>

      <PriceChart prices={prices} />

      <div className="metric-grid">
        <MetricBadge label="P/E" value={formatNumber(fundamentals.pe)} />
        <MetricBadge label="P/B" value={formatNumber(fundamentals.pb)} />
        <MetricBadge label="ROE" value={formatPercent(fundamentals.roe)} tone="positive" />
        <MetricBadge label="RSI" value={formatNumber(indicators.rsi14, 0)} />
        <MetricBadge label="SMA20" value={formatNumber(indicators.sma20)} />
        <MetricBadge label="Vol20" value={formatPercent(indicators.volatility20)} />
      </div>

      <section className="recommendation-copy">
        <div>
          <span className="eyebrow">Khuyến nghị</span>
          <h3>{recommendation.action} · {recommendation.softLabel}</h3>
        </div>
        {recommendation.reasons.map((reason) => (
          <p key={reason}>{reason}</p>
        ))}

        <div className="signal-columns">
          <section>
            <h4>Tín hiệu tích cực</h4>
            <ul>
              {recommendation.positiveSignals.map((signal) => (
                <li key={signal}>{signal}</li>
              ))}
            </ul>
          </section>
          <section>
            <h4>Rủi ro</h4>
            <ul>
              {recommendation.risks.map((risk) => (
                <li key={risk}>{risk}</li>
              ))}
            </ul>
          </section>
        </div>

        {recommendation.dataWarnings.length > 0 ? (
          <section className="data-warnings">
            <h4>Cảnh báo dữ liệu</h4>
            <ul>
              {recommendation.dataWarnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          </section>
        ) : null}
      </section>
    </aside>
  );
}
