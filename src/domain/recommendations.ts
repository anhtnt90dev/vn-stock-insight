import { latestTechnicalIndicators } from './indicators';
import { scoreFundamentals, scoreTechnical, toRecommendation } from './scoring';
import type { FundamentalMetrics, PriceBar, Recommendation, TechnicalIndicators } from './types';

export function buildIndicatorsForSymbol(
  symbol: string,
  prices: PriceBar[],
  updatedAt: string,
): TechnicalIndicators {
  return latestTechnicalIndicators(symbol, prices, updatedAt);
}

export function buildRecommendationForSymbol(
  symbol: string,
  prices: PriceBar[],
  fundamentals: FundamentalMetrics,
  indicators: TechnicalIndicators,
): Recommendation {
  const latestClose = prices[prices.length - 1]?.close ?? 0;
  const fundamental = scoreFundamentals(fundamentals);
  const technical = scoreTechnical(indicators, latestClose);
  const warningCount = fundamental.warnings.length + technical.warnings.length;
  const confidence = Math.max(0.4, Math.min(0.95, 0.95 - warningCount * 0.08));
  const totalScore = fundamental.score * 0.5 + technical.score * 0.5;

  return toRecommendation(
    symbol,
    totalScore,
    fundamental.score,
    technical.score,
    confidence,
    [...fundamental.positives, ...technical.positives],
    [...fundamental.negatives, ...technical.negatives],
    [...fundamental.warnings, ...technical.warnings],
  );
}
