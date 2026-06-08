import type { PriceBar, TechnicalIndicators } from './types';

export function calculateSma(values: number[], window: number): number | null {
  if (values.length < window || window <= 0) return null;
  const slice = values.slice(values.length - window);
  return slice.reduce((sum, value) => sum + value, 0) / window;
}

export function calculateRsi(closes: number[], period = 14): number | null {
  if (closes.length < period + 1) return null;
  const deltas = closes.slice(1).map((close, index) => close - closes[index]);
  const recent = deltas.slice(-period);
  const gains = recent.map((delta) => Math.max(delta, 0));
  const losses = recent.map((delta) => Math.max(-delta, 0));
  const avgGain = gains.reduce((sum, value) => sum + value, 0) / period;
  const avgLoss = losses.reduce((sum, value) => sum + value, 0) / period;
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

export function calculateVolatility(closes: number[], window = 20): number | null {
  if (closes.length < Math.min(window, 2)) return null;
  const slice = closes.slice(-window);
  const returns = slice.slice(1).map((close, index) => (close - slice[index]) / slice[index]);
  const mean = returns.reduce((sum, value) => sum + value, 0) / returns.length;
  const variance = returns.reduce((sum, value) => sum + (value - mean) ** 2, 0) / returns.length;
  return Math.sqrt(variance);
}

export function calculateDrawdown(closes: number[], window = 60): number | null {
  if (closes.length < 2) return null;
  const slice = closes.slice(-window);
  const peak = Math.max(...slice);
  const latest = slice[slice.length - 1];
  return peak === 0 ? null : (latest - peak) / peak;
}

export function latestTechnicalIndicators(
  symbol: string,
  bars: PriceBar[],
  updatedAt: string,
): TechnicalIndicators {
  const closes = bars.map((bar) => bar.close);
  const volumes = bars.map((bar) => bar.volume);
  const latestVolume = volumes[volumes.length - 1] ?? 0;
  const volumeBase = calculateSma(volumes, Math.min(20, volumes.length));

  return {
    symbol,
    updatedAt,
    sma20: calculateSma(closes, 20),
    sma50: calculateSma(closes, 50),
    sma200: calculateSma(closes, 200),
    rsi14: calculateRsi(closes, 14),
    macd: null,
    macdSignal: null,
    volumeRatio20: volumeBase && volumeBase > 0 ? latestVolume / volumeBase : null,
    volatility20: calculateVolatility(closes, 20),
    drawdown60: calculateDrawdown(closes, 60),
  };
}
