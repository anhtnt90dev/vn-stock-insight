import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = process.cwd();
const dataRootFlagIndex = process.argv.indexOf('--data-root');
const dataRootArgument = dataRootFlagIndex === -1 ? undefined : process.argv[dataRootFlagIndex + 1];

if (dataRootFlagIndex !== -1 && !dataRootArgument) {
  throw new Error('--data-root requires a directory path.');
}

const dataRoot =
  dataRootFlagIndex === -1
    ? join(root, 'public', 'data')
    : resolve(root, dataRootArgument);
const stockExchanges = ['HOSE', 'HNX', 'UPCOM'];
const dataHealthSources = ['static-fixture', 'github-actions-etl', 'manual-browser-refresh'];
const dataHealthStatuses = ['healthy', 'partial', 'failed'];
const fundamentalKeys = ['pe', 'pb', 'roe', 'epsGrowth', 'revenueGrowth', 'debtToEquity'];
const priceKeys = ['open', 'high', 'low', 'close', 'volume'];
const organizationRunId = 'demo-run';
const organizationAgentIds = [
  'sales',
  'architect',
  'tech-lead',
  'data-engineer',
  'quant',
  'frontend',
  'qa',
  'devops',
];
const agentStatuses = ['idle', 'working', 'reviewing', 'blocked', 'approved'];
const organizationPhases = ['Sales', 'discovery', 'architecture', 'implementation', 'review', 'QA', 'release'];
const organizationEventTypes = [
  'message',
  'handoff',
  'decision',
  'tool_call',
  'artifact',
  'review',
  'approval',
  'ci_check',
  'token_usage',
];
const organizationEventStatuses = ['pending', 'running', 'passed', 'failed', 'blocked', 'approved', 'rejected'];
const telemetryQualities = ['actual', 'estimated', 'unavailable'];
const secretLikePattern = /(gho_|ghp_|sk-|api_key|password|secret)/i;

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

function validateStringArray(value, message) {
  assert(Array.isArray(value) && value.length > 0, message);
  for (const item of value) {
    validateString(item, `${message} entries must be non-empty strings`);
  }
}

function validateTokenUsageValue(usage, message) {
  assert(usage && typeof usage === 'object', `${message} must be an object`);
  assert(Number.isFinite(usage.prompt) && usage.prompt >= 0, `${message}.prompt must be non-negative`);
  assert(Number.isFinite(usage.completion) && usage.completion >= 0, `${message}.completion must be non-negative`);
  assert(Number.isFinite(usage.total) && usage.total >= 0, `${message}.total must be non-negative`);
  assert(usage.prompt + usage.completion === usage.total, `${message}.total must equal prompt + completion`);
}

function assertNoSecretLikeStrings(value, path = 'organization') {
  if (typeof value === 'string') {
    assert(!secretLikePattern.test(value), `${path} contains a secret-like string`);
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => assertNoSecretLikeStrings(item, `${path}[${index}]`));
    return;
  }

  if (value && typeof value === 'object') {
    for (const [key, childValue] of Object.entries(value)) {
      assert(!secretLikePattern.test(key), `${path}.${key} contains a secret-like key`);
      assertNoSecretLikeStrings(childValue, `${path}.${key}`);
    }
  }
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

function validateOrganizationAgent(agent) {
  validateString(agent.agentId, 'organization agent.agentId is required');
  validateString(agent.role, `${agent.agentId}.role is required`);
  validateString(agent.responsibility, `${agent.agentId}.responsibility is required`);
  assert(agentStatuses.includes(agent.status), `${agent.agentId}.status is invalid`);
  validateStringArray(agent.ownership, `${agent.agentId}.ownership must be a non-empty array`);
  validateStringArray(agent.reviewAuthority, `${agent.agentId}.reviewAuthority must be a non-empty array`);
}

function validateOrganizationEvent(event, expectedRunId, agentIdSet) {
  const label = typeof event.eventId === 'string' ? event.eventId : 'organization event';
  validateString(event.eventId, 'organization event.eventId is required');
  assert(event.runId === expectedRunId, `${label}.runId must be ${expectedRunId}`);
  validateString(event.timestamp, `${label}.timestamp is required`);
  assert(/^\d{4}-\d{2}-\d{2}T/.test(event.timestamp), `${label}.timestamp is invalid`);
  assert(organizationPhases.includes(event.phase), `${label}.phase is invalid`);
  assert(agentIdSet.has(event.agentId), `${label}.agentId is unknown`);
  validateString(event.role, `${label}.role is required`);
  assert(organizationEventTypes.includes(event.eventType), `${label}.eventType is invalid`);
  validateString(event.summary, `${label}.summary is required`);
  assert(organizationEventStatuses.includes(event.status), `${label}.status is invalid`);
  assert(telemetryQualities.includes(event.telemetryQuality), `${label}.telemetryQuality is invalid`);

  if (event.fromAgentId !== undefined) {
    assert(agentIdSet.has(event.fromAgentId), `${label}.fromAgentId is unknown`);
  }

  if (event.toAgentId !== undefined) {
    assert(agentIdSet.has(event.toAgentId), `${label}.toAgentId is unknown`);
  }

  if (event.artifactRefs !== undefined) {
    validateStringArray(event.artifactRefs, `${label}.artifactRefs must be a non-empty array`);
  }

  if (event.toolName !== undefined) {
    validateString(event.toolName, `${label}.toolName is required`);
  }

  if (event.durationMs !== undefined) {
    assert(Number.isFinite(event.durationMs) && event.durationMs >= 0, `${label}.durationMs must be non-negative`);
  }

  if (event.tokenUsage !== undefined) {
    validateTokenUsageValue(event.tokenUsage, `${label}.tokenUsage`);
  }
}

function validateTokenUsageEntry(entry, expectedRunId, agentIdSet, runEventIdSet) {
  const label = typeof entry.eventId === 'string' ? entry.eventId : 'organization token usage';
  validateString(entry.eventId, 'organization token usage eventId is required');
  assert(runEventIdSet.has(entry.eventId), `${label}.eventId must reference a run event`);
  assert(entry.runId === expectedRunId, `${label}.runId must be ${expectedRunId}`);
  assert(agentIdSet.has(entry.agentId), `${label}.agentId is unknown`);
  validateString(entry.role, `${label}.role is required`);
  assert(organizationPhases.includes(entry.phase), `${label}.phase is invalid`);
  validateString(entry.task, `${label}.task is required`);
  validateTokenUsageValue(entry, label);
  assert(telemetryQualities.includes(entry.telemetryQuality), `${label}.telemetryQuality is invalid`);
  assert(entry.sanitized === true, `${label}.sanitized must be true`);
}

function validateToolCallEntry(entry, expectedRunId, agentIdSet) {
  const label = typeof entry.eventId === 'string' ? entry.eventId : 'organization tool call';
  validateString(entry.eventId, 'organization tool call eventId is required');
  assert(entry.runId === expectedRunId, `${label}.runId must be ${expectedRunId}`);
  assert(agentIdSet.has(entry.agentId), `${label}.agentId is unknown`);
  validateString(entry.role, `${label}.role is required`);
  validateString(entry.toolName, `${label}.toolName is required`);
  validateString(entry.purpose, `${label}.purpose is required`);
  assert(organizationEventStatuses.includes(entry.status), `${label}.status is invalid`);
  assert(Number.isFinite(entry.durationMs) && entry.durationMs >= 0, `${label}.durationMs must be non-negative`);
  validateString(entry.summary, `${label}.summary is required`);
  assert(entry.sanitized === true, `${label}.sanitized must be true`);
}

function validateOrganizationFixtures() {
  const organizationRoot = join(dataRoot, 'organization');
  const agents = readJson(join(organizationRoot, 'agents.json'));
  const runEvents = readJson(join(organizationRoot, 'runs', `${organizationRunId}.json`));
  const tokenUsage = readJson(join(organizationRoot, 'token-usage', `${organizationRunId}.json`));
  const toolCalls = readJson(join(organizationRoot, 'tool-calls', `${organizationRunId}.json`));

  assertNoSecretLikeStrings({ agents, runEvents, tokenUsage, toolCalls });

  assert(Array.isArray(agents), 'organization agents.json must be an array');
  const agentIds = agents.map((agent) => agent.agentId);
  const agentIdSet = new Set(agentIds);
  assert(agentIdSet.size === agentIds.length, 'organization agents must be unique');
  assert(agentIds.length === organizationAgentIds.length, 'organization agents must match expected agents');

  for (const agentId of organizationAgentIds) {
    assert(agentIdSet.has(agentId), `organization agents missing ${agentId}`);
  }

  agents.forEach(validateOrganizationAgent);

  assert(Array.isArray(runEvents) && runEvents.length >= 4, `${organizationRunId} run must include events`);
  const runEventIds = runEvents.map((event) => event.eventId);
  const runEventIdSet = new Set(runEventIds);
  assert(runEventIdSet.size === runEventIds.length, `${organizationRunId} event IDs must be unique`);
  runEvents.forEach((event) => validateOrganizationEvent(event, organizationRunId, agentIdSet));

  assert(
    runEvents.some(
      (event) => event.phase === 'Sales' && event.eventType === 'message' && /intake/i.test(event.summary),
    ),
    `${organizationRunId} missing Sales intake event`,
  );
  assert(
    runEvents.some((event) => event.phase === 'architecture' && event.eventType === 'decision'),
    `${organizationRunId} missing architecture decision event`,
  );
  assert(
    runEvents.some((event) => event.phase === 'implementation' && event.eventType === 'handoff'),
    `${organizationRunId} missing implementation handoff event`,
  );
  assert(
    runEvents.some((event) => event.phase === 'review' && event.eventType === 'review'),
    `${organizationRunId} missing review event`,
  );

  assert(Array.isArray(tokenUsage), `${organizationRunId} token usage must be an array`);
  tokenUsage.forEach((entry) => validateTokenUsageEntry(entry, organizationRunId, agentIdSet, runEventIdSet));

  assert(Array.isArray(toolCalls), `${organizationRunId} tool calls must be an array`);
  const toolCallIds = toolCalls.map((entry) => entry.eventId);
  assert(new Set(toolCallIds).size === toolCallIds.length, `${organizationRunId} tool call IDs must be unique`);
  toolCalls.forEach((entry) => validateToolCallEntry(entry, organizationRunId, agentIdSet));
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
validateOrganizationFixtures();
console.log(`Validated organization fixtures for ${organizationRunId}.`);
