import { describe, expect, it } from 'vitest';
import { calculateRsi, calculateSma, latestTechnicalIndicators } from '../../src/domain/indicators';
import type { PriceBar } from '../../src/domain/types';

const bars: PriceBar[] = [
  { date: '2026-01-01', open: 10, high: 11, low: 9, close: 10, volume: 100 },
  { date: '2026-01-02', open: 10, high: 12, low: 10, close: 12, volume: 120 },
  { date: '2026-01-03', open: 12, high: 13, low: 11, close: 11, volume: 130 },
  { date: '2026-01-04', open: 11, high: 14, low: 11, close: 14, volume: 150 },
  { date: '2026-01-05', open: 14, high: 15, low: 13, close: 15, volume: 160 },
];

describe('technical indicators', () => {
  it('calculates simple moving average for the latest window', () => {
    expect(calculateSma([10, 12, 11, 14, 15], 3)).toBeCloseTo(13.333, 3);
  });

  it('returns null for insufficient SMA input', () => {
    expect(calculateSma([10, 12], 3)).toBeNull();
  });

  it('calculates RSI within the expected 0-100 range', () => {
    const rsi = calculateRsi([10, 12, 11, 14, 15], 4);
    expect(rsi).not.toBeNull();
    expect(rsi as number).toBeGreaterThan(0);
    expect(rsi as number).toBeLessThanOrEqual(100);
  });

  it('builds latest technical indicator object', () => {
    const indicators = latestTechnicalIndicators('FPT', bars, '2026-01-05T00:00:00+07:00');
    expect(indicators.symbol).toBe('FPT');
    expect(indicators.sma20).toBeNull();
    expect(indicators.volumeRatio20).toBeCloseTo(160 / 132, 3);
  });
});
