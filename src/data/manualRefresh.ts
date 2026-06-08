import type { DataHealth, MarketDataset } from '../domain/types';

export const MANUAL_REFRESH_CACHE_KEY = 'vn-stock-insight.manual-refresh';

interface ManualRefreshSnapshot {
  version: 1;
  savedAt: string;
  source: DataHealth['source'];
  status: DataHealth['status'];
  updatedAt: string;
  symbols: string[];
  recommendationCount: number;
  missingFundamentals: string[];
  missingPrices: string[];
}

export interface ManualRefreshResult {
  dataset: MarketDataset;
  state: string;
  cached: boolean;
}

function uniqueSortedSymbols(current: MarketDataset): string[] {
  return Array.from(
    new Set([
      ...current.dataHealth.symbols,
      ...current.stocks.map((stock) => stock.symbol),
      ...current.recommendations.map((recommendation) => recommendation.symbol),
    ]),
  ).sort((left, right) => left.localeCompare(right));
}

function buildSanitizedSnapshot(current: MarketDataset, savedAt: string): ManualRefreshSnapshot {
  return {
    version: 1,
    savedAt,
    source: 'manual-browser-refresh',
    status: current.dataHealth.status,
    updatedAt: current.dataHealth.updatedAt,
    symbols: uniqueSortedSymbols(current),
    recommendationCount: current.recommendations.length,
    missingFundamentals: [...current.dataHealth.missingFundamentals],
    missingPrices: [...current.dataHealth.missingPrices],
  };
}

function cacheSnapshot(snapshot: ManualRefreshSnapshot): { ok: true } | { ok: false; reason: string } {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return { ok: false, reason: 'localStorage không khả dụng' };
    }

    window.localStorage.setItem(MANUAL_REFRESH_CACHE_KEY, JSON.stringify(snapshot));
    return { ok: true };
  } catch {
    return { ok: false, reason: 'không ghi được cache cục bộ' };
  }
}

export async function manualRefreshWithFallback(current: MarketDataset): Promise<ManualRefreshResult> {
  const savedAt = new Date().toISOString();
  const snapshot = buildSanitizedSnapshot(current, savedAt);
  const cacheResult = cacheSnapshot(snapshot);
  const dataset: MarketDataset = {
    ...current,
    dataHealth: {
      ...current.dataHealth,
      source: 'manual-browser-refresh',
      message:
        'Manual refresh best-effort trong trình duyệt; chưa có endpoint live nên tiếp tục dùng static JSON đã validate.',
    },
  };

  if (!cacheResult.ok) {
    return {
      dataset,
      cached: false,
      state: `Manual refresh hoàn tất; ${cacheResult.reason}.`,
    };
  }

  return {
    dataset,
    cached: true,
    state: 'Manual refresh hoàn tất; snapshot đã được lưu cục bộ.',
  };
}
