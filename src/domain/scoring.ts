import type {
  FundamentalMetrics,
  Recommendation,
  RecommendationAction,
  SoftLabel,
  TechnicalIndicators,
} from './types';

interface ScoreResult {
  score: number;
  positives: string[];
  negatives: string[];
  warnings: string[];
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function clampConfidence(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

function addMetricScore(
  value: number | null,
  good: boolean,
  points: number,
  positive: string,
  negative: string,
  result: ScoreResult,
) {
  if (value === null) {
    result.warnings.push(`${positive}: thiếu dữ liệu`);
    return;
  }
  if (good) {
    result.score += points;
    result.positives.push(positive);
  } else {
    result.score -= points * 0.6;
    result.negatives.push(negative);
  }
}

export function scoreFundamentals(metrics: FundamentalMetrics): ScoreResult {
  const result: ScoreResult = { score: 50, positives: [], negatives: [], warnings: [] };

  addMetricScore(
    metrics.pe,
    metrics.pe !== null && metrics.pe > 0 && metrics.pe <= 22,
    10,
    'P/E trong vùng hợp lý',
    'P/E cao hoặc không hợp lệ',
    result,
  );
  addMetricScore(
    metrics.pb,
    metrics.pb !== null && metrics.pb > 0 && metrics.pb <= 3.5,
    8,
    'P/B không quá cao',
    'P/B cao so với ngưỡng MVP',
    result,
  );
  addMetricScore(
    metrics.roe,
    metrics.roe !== null && metrics.roe >= 0.15,
    14,
    'ROE mạnh',
    'ROE dưới ngưỡng hấp dẫn',
    result,
  );
  addMetricScore(
    metrics.epsGrowth,
    metrics.epsGrowth !== null && metrics.epsGrowth >= 0.08,
    10,
    'EPS tăng trưởng tốt',
    'EPS tăng trưởng yếu',
    result,
  );
  addMetricScore(
    metrics.revenueGrowth,
    metrics.revenueGrowth !== null && metrics.revenueGrowth >= 0.06,
    8,
    'Doanh thu tăng trưởng tích cực',
    'Doanh thu tăng trưởng thấp',
    result,
  );
  addMetricScore(
    metrics.debtToEquity,
    metrics.debtToEquity !== null && metrics.debtToEquity <= 1.2,
    8,
    'Đòn bẩy tài chính trong vùng kiểm soát',
    'Đòn bẩy tài chính cao',
    result,
  );

  return { ...result, score: clampScore(result.score) };
}

export function scoreTechnical(indicators: TechnicalIndicators, latestClose: number): ScoreResult {
  const result: ScoreResult = { score: 50, positives: [], negatives: [], warnings: [] };

  addMetricScore(
    indicators.sma20,
    indicators.sma20 !== null && latestClose >= indicators.sma20,
    10,
    'Giá trên SMA20',
    'Giá dưới SMA20',
    result,
  );
  addMetricScore(
    indicators.sma50,
    indicators.sma50 !== null && latestClose >= indicators.sma50,
    10,
    'Giá trên SMA50',
    'Giá dưới SMA50',
    result,
  );
  addMetricScore(
    indicators.sma200,
    indicators.sma200 !== null && latestClose >= indicators.sma200,
    8,
    'Giá trên SMA200',
    'Giá dưới SMA200',
    result,
  );
  addMetricScore(
    indicators.rsi14,
    indicators.rsi14 !== null && indicators.rsi14 >= 45 && indicators.rsi14 <= 70,
    10,
    'RSI trong vùng khỏe',
    'RSI quá yếu hoặc quá nóng',
    result,
  );
  addMetricScore(
    indicators.volumeRatio20,
    indicators.volumeRatio20 !== null && indicators.volumeRatio20 >= 1,
    8,
    'Thanh khoản xác nhận xu hướng',
    'Thanh khoản chưa xác nhận',
    result,
  );
  addMetricScore(
    indicators.volatility20,
    indicators.volatility20 !== null && indicators.volatility20 <= 0.035,
    7,
    'Biến động trong vùng kiểm soát',
    'Biến động cao',
    result,
  );
  addMetricScore(
    indicators.drawdown60,
    indicators.drawdown60 !== null && indicators.drawdown60 >= -0.12,
    7,
    'Drawdown gần đây được kiểm soát',
    'Drawdown gần đây lớn',
    result,
  );

  return { ...result, score: clampScore(result.score) };
}

function labelFor(score: number): SoftLabel {
  if (score >= 80) return 'Rất tiềm năng';
  if (score >= 65) return 'Theo dõi';
  if (score >= 50) return 'Trung lập';
  return 'Rủi ro cao';
}

function actionFor(score: number, confidence: number): RecommendationAction {
  if (score >= 80 && confidence >= 0.7) return 'Buy';
  if (score >= 65) return confidence >= 0.55 ? 'Buy' : 'Hold';
  if (score >= 50) return 'Hold';
  return 'Sell/Avoid';
}

export function toRecommendation(
  symbol: string,
  totalScore: number,
  fundamentalScore: number,
  technicalScore: number,
  confidence: number,
  positives: string[],
  negatives: string[],
  warnings: string[] = [],
): Recommendation {
  const score = clampScore(totalScore);
  const clampedConfidence = clampConfidence(confidence);
  return {
    symbol,
    totalScore: score,
    fundamentalScore: clampScore(fundamentalScore),
    technicalScore: clampScore(technicalScore),
    softLabel: labelFor(score),
    action: actionFor(score, clampedConfidence),
    confidence: clampedConfidence,
    reasons: [`Điểm tổng hợp ${score}/100 dựa trên 50% cơ bản và 50% kỹ thuật.`],
    positiveSignals: positives,
    negativeSignals: negatives,
    risks: negatives.length > 0 ? negatives : ['Rủi ro chính đến từ biến động thị trường chung và độ trễ dữ liệu.'],
    dataWarnings: warnings,
  };
}
