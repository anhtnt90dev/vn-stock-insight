export type StockExchange = 'HOSE' | 'HNX' | 'UPCOM';
export type RecommendationAction = 'Buy' | 'Hold' | 'Sell/Avoid';
export type SoftLabel = 'Rất tiềm năng' | 'Theo dõi' | 'Trung lập' | 'Rủi ro cao';
export type TelemetryQuality = 'actual' | 'estimated' | 'unavailable';

export interface StockMeta {
  symbol: string;
  name: string;
  exchange: StockExchange;
  sector: string;
  isVn30: boolean;
  isDefaultWatchlist: boolean;
}

export interface PriceBar {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface FundamentalMetrics {
  symbol: string;
  updatedAt: string;
  pe: number | null;
  pb: number | null;
  roe: number | null;
  epsGrowth: number | null;
  revenueGrowth: number | null;
  debtToEquity: number | null;
}

export interface TechnicalIndicators {
  symbol: string;
  updatedAt: string;
  sma20: number | null;
  sma50: number | null;
  sma200: number | null;
  rsi14: number | null;
  macd: number | null;
  macdSignal: number | null;
  volumeRatio20: number | null;
  volatility20: number | null;
  drawdown60: number | null;
}

export interface Recommendation {
  symbol: string;
  totalScore: number;
  fundamentalScore: number;
  technicalScore: number;
  softLabel: SoftLabel;
  action: RecommendationAction;
  confidence: number;
  reasons: string[];
  positiveSignals: string[];
  negativeSignals: string[];
  risks: string[];
  dataWarnings: string[];
}

export interface DataHealth {
  updatedAt: string;
  source: 'static-fixture' | 'github-actions-etl' | 'manual-browser-refresh';
  status: 'healthy' | 'partial' | 'failed';
  message: string;
  symbols: string[];
  missingFundamentals: string[];
  missingPrices: string[];
}

export interface MarketDataset {
  stocks: StockMeta[];
  pricesBySymbol: Record<string, PriceBar[]>;
  fundamentalsBySymbol: Record<string, FundamentalMetrics>;
  indicatorsBySymbol: Record<string, TechnicalIndicators>;
  recommendations: Recommendation[];
  dataHealth: DataHealth;
}
