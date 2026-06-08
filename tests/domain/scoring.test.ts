import { describe, expect, it } from 'vitest';
import { scoreFundamentals, scoreTechnical, toRecommendation } from '../../src/domain/scoring';
import type { FundamentalMetrics, TechnicalIndicators } from '../../src/domain/types';

const strongFundamentals: FundamentalMetrics = {
  symbol: 'FPT',
  updatedAt: '2026-06-08T00:00:00+07:00',
  pe: 18,
  pb: 2.5,
  roe: 0.24,
  epsGrowth: 0.18,
  revenueGrowth: 0.15,
  debtToEquity: 0.4,
};

const strongTechnical: TechnicalIndicators = {
  symbol: 'FPT',
  updatedAt: '2026-06-08T00:00:00+07:00',
  sma20: 120,
  sma50: 115,
  sma200: 100,
  rsi14: 62,
  macd: 1,
  macdSignal: 0.6,
  volumeRatio20: 1.35,
  volatility20: 0.018,
  drawdown60: -0.03,
};

describe('stock scoring', () => {
  it('scores strong fundamentals above neutral', () => {
    expect(scoreFundamentals(strongFundamentals).score).toBeGreaterThan(70);
  });

  it('scores strong technicals above neutral', () => {
    expect(scoreTechnical(strongTechnical, 131).score).toBeGreaterThan(70);
  });

  it('maps high total score to Buy and Rất tiềm năng', () => {
    const recommendation = toRecommendation('FPT', 84, 82, 86, 0.92, [], []);
    expect(recommendation.action).toBe('Buy');
    expect(recommendation.softLabel).toBe('Rất tiềm năng');
    expect(recommendation.confidence).toBe(0.92);
  });

  it('clamps confidence above one', () => {
    const recommendation = toRecommendation('FPT', 84, 82, 86, 1.25, [], []);
    expect(recommendation.confidence).toBe(1);
  });

  it('clamps confidence below zero', () => {
    const recommendation = toRecommendation('FPT', 84, 82, 86, -0.25, [], []);
    expect(recommendation.confidence).toBe(0);
  });
});
