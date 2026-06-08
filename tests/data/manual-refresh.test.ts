import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  MANUAL_REFRESH_CACHE_KEY,
  manualRefreshWithFallback,
} from '../../src/data/manualRefresh';
import type { MarketDataset } from '../../src/domain/types';

const currentDataset: MarketDataset = {
  stocks: [
    {
      symbol: 'FPT',
      name: 'FPT Corporation',
      exchange: 'HOSE',
      sector: 'Cong nghe',
      isVn30: true,
      isDefaultWatchlist: true,
    },
  ],
  pricesBySymbol: {
    FPT: [
      {
        date: '2026-06-08',
        open: 118,
        high: 122,
        low: 117,
        close: 121,
        volume: 1500000,
      },
    ],
  },
  fundamentalsBySymbol: {
    FPT: {
      symbol: 'FPT',
      updatedAt: '2026-06-08T00:00:00+07:00',
      pe: 23,
      pb: 5.1,
      roe: 0.25,
      epsGrowth: 0.18,
      revenueGrowth: 0.21,
      debtToEquity: 0.4,
    },
  },
  indicatorsBySymbol: {
    FPT: {
      symbol: 'FPT',
      updatedAt: '2026-06-08T00:00:00+07:00',
      sma20: 119,
      sma50: 115,
      sma200: 102,
      rsi14: 62,
      macd: 1.2,
      macdSignal: 0.8,
      volumeRatio20: 1.15,
      volatility20: 0.21,
      drawdown60: -0.04,
    },
  },
  recommendations: [
    {
      symbol: 'FPT',
      totalScore: 82,
      fundamentalScore: 80,
      technicalScore: 84,
      softLabel: 'Rất tiềm năng',
      action: 'Buy',
      confidence: 0.83,
      reasons: ['Strong test fixture reason that should not be cached.'],
      positiveSignals: ['Momentum'],
      negativeSignals: [],
      risks: ['Valuation'],
      dataWarnings: [],
    },
  ],
  dataHealth: {
    updatedAt: '2026-06-08T00:00:00+07:00',
    source: 'static-fixture',
    status: 'healthy',
    message: 'Static test data',
    symbols: ['FPT'],
    missingFundamentals: [],
    missingPrices: [],
  },
};

describe('manualRefreshWithFallback', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('marks the dataset as manual refresh and caches only a sanitized snapshot', async () => {
    const result = await manualRefreshWithFallback(currentDataset);

    expect(result.dataset.dataHealth.source).toBe('manual-browser-refresh');
    expect(result.dataset.dataHealth.message).toContain('best-effort');
    expect(result.dataset.recommendations).toEqual(currentDataset.recommendations);
    expect(result.state).toContain('Manual refresh');

    const cached = localStorage.getItem(MANUAL_REFRESH_CACHE_KEY);
    expect(cached).not.toBeNull();
    expect(cached).toContain('"symbols":["FPT"]');
    expect(cached).not.toContain('pricesBySymbol');
    expect(cached).not.toContain('fundamentalsBySymbol');
    expect(cached).not.toContain('Strong test fixture reason');
  });

  it('still returns dashboard data when browser storage is unavailable', async () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota exceeded');
    });

    const result = await manualRefreshWithFallback(currentDataset);

    expect(result.dataset.dataHealth.source).toBe('manual-browser-refresh');
    expect(result.dataset.recommendations).toEqual(currentDataset.recommendations);
    expect(result.state).toContain('không ghi được cache');
  });
});
