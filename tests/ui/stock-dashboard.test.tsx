import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { StockDashboard } from '../../src/components/StockDashboard';
import type { MarketDataset } from '../../src/domain/types';

const datasetWithMissingDetailData: MarketDataset = {
  stocks: [
    {
      symbol: 'ACB',
      name: 'Ngân hàng TMCP Á Châu',
      exchange: 'HOSE',
      sector: 'Ngân hàng',
      isVn30: true,
      isDefaultWatchlist: true,
    },
  ],
  pricesBySymbol: {
    ACB: [
      {
        date: '2026-06-08',
        open: 24,
        high: 25,
        low: 23.8,
        close: 24.8,
        volume: 1200000,
      },
    ],
  },
  fundamentalsBySymbol: {},
  indicatorsBySymbol: {},
  recommendations: [
    {
      symbol: 'ACB',
      totalScore: 68,
      fundamentalScore: 64,
      technicalScore: 72,
      softLabel: 'Theo dõi',
      action: 'Hold',
      confidence: 0.72,
      reasons: ['Điểm tổng hợp 68/100 dựa trên 50% cơ bản và 50% kỹ thuật.'],
      positiveSignals: ['Giá trên SMA20'],
      negativeSignals: [],
      risks: ['Rủi ro chính đến từ độ trễ dữ liệu.'],
      dataWarnings: [],
    },
  ],
  dataHealth: {
    updatedAt: '2026-06-08T00:00:00+07:00',
    source: 'static-fixture',
    status: 'partial',
    message: 'Dữ liệu kiểm thử thiếu chi tiết cho một mã.',
    symbols: ['ACB'],
    missingFundamentals: ['ACB'],
    missingPrices: [],
  },
};

describe('StockDashboard', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('shows a Vietnamese missing-data message when selected detail inputs are absent', () => {
    render(
      <StockDashboard
        dataset={datasetWithMissingDetailData}
        refreshState="Dữ liệu kiểm thử"
        onRefresh={() => undefined}
      />,
    );

    expect(screen.getByText('Thiếu dữ liệu chi tiết cho ACB.')).toBeInTheDocument();
  });
});
