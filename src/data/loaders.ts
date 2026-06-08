import { buildIndicatorsForSymbol, buildRecommendationForSymbol } from '../domain/recommendations';
import type {
  DataHealth,
  FundamentalMetrics,
  MarketDataset,
  PriceBar,
  Recommendation,
  StockMeta,
  TechnicalIndicators,
} from '../domain/types';

declare global {
  interface ImportMeta {
    readonly env: {
      readonly BASE_URL: string;
    };
  }
}

export async function loadJson<T>(path: string): Promise<T> {
  const response = await fetch(`${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`);

  if (!response.ok) {
    throw new Error(`Không tải được ${path}: HTTP ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function loadMarketDataset(): Promise<MarketDataset> {
  const [stocks, dataHealth] = await Promise.all([
    loadJson<StockMeta[]>('data/stocks.json'),
    loadJson<DataHealth>('data/data-health.json'),
  ]);

  const pricesBySymbol: Record<string, PriceBar[]> = {};
  const fundamentalsBySymbol: Record<string, FundamentalMetrics> = {};
  const indicatorsBySymbol: Record<string, TechnicalIndicators> = {};
  const recommendations: Recommendation[] = [];

  await Promise.all(
    stocks.map(async (stock) => {
      const [prices, fundamentals] = await Promise.all([
        loadJson<PriceBar[]>(`data/prices/${stock.symbol}.json`),
        loadJson<FundamentalMetrics>(`data/fundamentals/${stock.symbol}.json`),
      ]);
      const indicators = buildIndicatorsForSymbol(stock.symbol, prices, dataHealth.updatedAt);

      pricesBySymbol[stock.symbol] = prices;
      fundamentalsBySymbol[stock.symbol] = fundamentals;
      indicatorsBySymbol[stock.symbol] = indicators;
      recommendations.push(buildRecommendationForSymbol(stock.symbol, prices, fundamentals, indicators));
    }),
  );

  recommendations.sort((left, right) => right.totalScore - left.totalScore);

  return {
    stocks,
    pricesBySymbol,
    fundamentalsBySymbol,
    indicatorsBySymbol,
    recommendations,
    dataHealth,
  };
}
