import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const dataRoot = join(root, 'public', 'data');
const stockExchanges = ['HOSE', 'HNX', 'UPCOM'];
const dataHealthSources = ['static-fixture', 'github-actions-etl', 'manual-browser-refresh'];
const dataHealthStatuses = ['healthy', 'partial', 'failed'];
const fundamentalKeys = ['pe', 'pb', 'roe', 'epsGrowth', 'revenueGrowth', 'debtToEquity'];
const priceKeys = ['open', 'high', 'low', 'close', 'volume'];

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function validateString(value, message) {
  assert(typeof value === 'string' && value.length > 0, message);
}

function validateStock(stock) {
  validateString(stock.symbol, 'stock.symbol is required');
  validateString(stock.name, `${stock.symbol}.name is required`);
  assert(stockExchanges.includes(stock.exchange), `${stock.symbol}.exchange is invalid`);
  validateString(stock.sector, `${stock.symbol}.sector is required`);
  assert(typeof stock.isVn30 === 'boolean', `${stock.symbol}.isVn30 must be boolean`);
  assert(typeof stock.isDefaultWatchlist === 'boolean', `${stock.symbol}.isDefaultWatchlist must be boolean`);
}

function validatePriceBar(symbol, bar) {
  assert(/^\d{4}-\d{2}-\d{2}$/.test(bar.date), `${symbol}.price.date is invalid`);

  for (const key of priceKeys) {
    assert(Number.isFinite(bar[key]), `${symbol}.price.${key} must be numeric`);
  }

  assert(bar.high >= bar.low, `${symbol}.price high must be >= low`);
  assert(bar.volume >= 0, `${symbol}.price volume must be >= 0`);
}

function validateFundamental(symbol, fundamental) {
  assert(fundamental.symbol === symbol, `${symbol}.fundamentals symbol mismatch`);
  validateString(fundamental.updatedAt, `${symbol}.fundamentals updatedAt is required`);

  for (const key of fundamentalKeys) {
    assert(
      fundamental[key] === null || Number.isFinite(fundamental[key]),
      `${symbol}.fundamentals.${key} invalid`,
    );
  }
}

function validateDataHealth(dataHealth, symbols) {
  validateString(dataHealth.updatedAt, 'data-health.updatedAt is required');
  assert(dataHealthSources.includes(dataHealth.source), 'data-health.source invalid');
  assert(dataHealthStatuses.includes(dataHealth.status), 'data-health.status invalid');
  validateString(dataHealth.message, 'data-health.message is required');
  assert(Array.isArray(dataHealth.symbols), 'data-health.symbols must be an array');
  assert(Array.isArray(dataHealth.missingFundamentals), 'data-health.missingFundamentals must be an array');
  assert(Array.isArray(dataHealth.missingPrices), 'data-health.missingPrices must be an array');

  const healthSymbols = new Set(dataHealth.symbols);
  assert(healthSymbols.size === dataHealth.symbols.length, 'data-health.symbols must be unique');

  for (const symbol of symbols) {
    assert(healthSymbols.has(symbol), `data-health.symbols missing ${symbol}`);
  }

  for (const symbol of dataHealth.symbols) {
    assert(symbols.includes(symbol), `data-health.symbols has unknown ${symbol}`);
  }
}

const stocks = readJson(join(dataRoot, 'stocks.json'));
assert(Array.isArray(stocks), 'stocks.json must be an array');
assert(stocks.length >= 3, 'stocks.json must include at least three MVP symbols');

const symbols = [];
const seenSymbols = new Set();

for (const stock of stocks) {
  validateStock(stock);
  assert(!seenSymbols.has(stock.symbol), `${stock.symbol} is duplicated in stocks.json`);
  seenSymbols.add(stock.symbol);
  symbols.push(stock.symbol);

  const pricePath = join(dataRoot, 'prices', `${stock.symbol}.json`);
  const fundamentalPath = join(dataRoot, 'fundamentals', `${stock.symbol}.json`);

  assert(existsSync(pricePath), `${stock.symbol} prices file missing`);
  assert(existsSync(fundamentalPath), `${stock.symbol} fundamentals file missing`);

  const prices = readJson(pricePath);
  assert(Array.isArray(prices) && prices.length >= 10, `${stock.symbol} must have at least 10 price bars`);
  prices.forEach((bar) => validatePriceBar(stock.symbol, bar));
  validateFundamental(stock.symbol, readJson(fundamentalPath));
}

validateDataHealth(readJson(join(dataRoot, 'data-health.json')), symbols);

console.log(`Validated ${stocks.length} stock fixture(s).`);
