# VN Stock Insight Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the `VN Stock Insight` GitHub Pages web app with stock analysis, organization workflow visualization, CI/CD, role-based governance, and static-data-first market refresh.

**Architecture:** Use a static-first React + TypeScript app built by Vite and deployed to GitHub Pages. Static JSON in `public/data` is the production source of truth; GitHub Actions validates/builds it, while a manual browser refresh is best-effort and falls back safely. The organization visualizer replays sanitized trace JSON artifacts so the app can show AI company workflows without a backend.

**Tech Stack:** React, TypeScript, Vite, Vitest, Testing Library, ESLint, GitHub Actions, GitHub Pages, localStorage, SVG charts, static JSON.

---

## Scope Check

The approved spec contains one integrated MVP with distinct agent-owned slices. This plan keeps one release plan but splits implementation into independently reviewable tasks with narrow write scopes:

- DevOps/Foundation Agent: project scaffold, CI/CD, governance.
- Data Engineer Agent: schemas, fixtures, validation, ETL fallback.
- Quant Analyst Agent: indicators, scoring, recommendation rules.
- Frontend Agent: stock dashboard, detail view, watchlist.
- Organization Visualizer Agent: agent profile, timeline, token/tool ledgers.
- QA Agent: tests, smoke checks, release validation.

## File Structure

Create the repository as a Vite React TypeScript app. Responsibilities are intentionally split so sub-agents can work on disjoint files.

```text
.github/
  CODEOWNERS
  ISSUE_TEMPLATE/bug_report.md
  ISSUE_TEMPLATE/feature_request.md
  pull_request_template.md
  workflows/ci.yml
  workflows/daily-etl.yml
  workflows/pages.yml
docs/
  ai-organization.md
  architecture.md
  data-pipeline.md
  organization-visualizer.md
  release-process.md
  scoring.md
  telemetry-schema.md
public/
  data/data-health.json
  data/fundamentals/ACB.json
  data/fundamentals/FPT.json
  data/fundamentals/VCB.json
  data/indicators/ACB.json
  data/indicators/FPT.json
  data/indicators/VCB.json
  data/organization/agents.json
  data/organization/runs/demo-run.json
  data/organization/token-usage/demo-run.json
  data/organization/tool-calls/demo-run.json
  data/prices/ACB.json
  data/prices/FPT.json
  data/prices/VCB.json
  data/recommendations.json
  data/stocks.json
scripts/
  generate-static-data.mjs
  validate-data.mjs
src/
  App.tsx
  main.tsx
  styles.css
  components/AppShell.tsx
  components/DataStatus.tsx
  components/MetricBadge.tsx
  components/OrganizationVisualizer.tsx
  components/PriceChart.tsx
  components/StockDashboard.tsx
  components/StockDetail.tsx
  data/loaders.ts
  data/manualRefresh.ts
  domain/indicators.ts
  domain/organization.ts
  domain/recommendations.ts
  domain/scoring.ts
  domain/types.ts
  hooks/useLocalWatchlist.ts
  test/setup.ts
tests/
  data/validate-data.test.ts
  domain/indicators.test.ts
  domain/organization.test.ts
  domain/scoring.test.ts
  ui/watchlist.test.tsx
.gitignore
eslint.config.js
index.html
package.json
tsconfig.json
tsconfig.node.json
vite.config.ts
vitest.config.ts
```

## Agent Execution Order

Run implementation tasks sequentially to avoid conflicting edits. Within each task, the assigned role can be represented by a sub-agent.

1. Task 1: DevOps/Foundation Agent
2. Task 2: Data Engineer Agent
3. Task 3: Quant Analyst Agent
4. Task 4: Organization Visualizer Agent
5. Task 5: Frontend Agent
6. Task 6: Data Engineer + Frontend Agent
7. Task 7: DevOps Agent
8. Task 8: QA Agent

## Task 1: Project Foundation

**Agent Role:** DevOps/Foundation Agent

**Files:**
- Create: `package.json`
- Create: `.gitignore`
- Create: `eslint.config.js`
- Create: `index.html`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `vite.config.ts`
- Create: `vitest.config.ts`
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `src/styles.css`
- Create: `src/test/setup.ts`

- [ ] **Step 1: Create the package manifest**

Create `package.json` with this content:

```json
{
  "name": "vn-stock-insight",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite --host 127.0.0.1",
    "build": "tsc -b && vite build",
    "preview": "vite preview --host 127.0.0.1",
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc -b --pretty false",
    "lint": "eslint .",
    "data:generate": "node scripts/generate-static-data.mjs",
    "data:validate": "node scripts/validate-data.mjs"
  },
  "dependencies": {
    "@vitejs/plugin-react": "^5.0.0",
    "lucide-react": "^0.468.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "vite": "^7.0.0"
  },
  "devDependencies": {
    "@eslint/js": "^9.0.0",
    "@testing-library/jest-dom": "^6.0.0",
    "@testing-library/react": "^16.0.0",
    "@types/node": "^24.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "eslint": "^9.0.0",
    "globals": "^15.0.0",
    "jsdom": "^25.0.0",
    "typescript": "^5.8.0",
    "typescript-eslint": "^8.0.0",
    "vitest": "^3.0.0"
  }
}
```

- [ ] **Step 2: Create repository ignore rules and ESLint config**

Create `.gitignore`:

```gitignore
node_modules/
dist/
dist-data-check/
coverage/
.env
.env.local
```

Create `eslint.config.js`:

```js
import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: {
        ...globals.browser,
        ...globals.es2022,
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  {
    files: ['**/*.{js,mjs,cjs}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.es2022,
      },
    },
  },
  {
    ignores: ['dist', 'dist-data-check', 'coverage', 'node_modules'],
  },
);
```

- [ ] **Step 3: Create TypeScript and Vite configs**

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "allowJs": false,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx"
  },
  "include": ["src", "tests", "vite.config.ts", "vitest.config.ts"]
}
```

Create `tsconfig.node.json`:

```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "allowSyntheticDefaultImports": true,
    "strict": true
  },
  "include": ["vite.config.ts", "vitest.config.ts"]
}
```

Create `vite.config.ts`:

```ts
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  base: process.env.GITHUB_PAGES === 'true' ? '/vn-stock-insight/' : '/',
  plugins: [react()],
});
```

Create `vitest.config.ts`:

```ts
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
    coverage: {
      reporter: ['text', 'json-summary'],
    },
  },
});
```

- [ ] **Step 4: Create the React entry point**

Create `index.html`:

```html
<!doctype html>
<html lang="vi">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta
      name="description"
      content="VN Stock Insight - dashboard phân tích cổ phiếu Việt Nam và quy trình đội AI phần mềm."
    />
    <title>VN Stock Insight</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

Create `src/main.tsx`:

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';

const root = document.getElementById('root');

if (!root) {
  throw new Error('Missing root element');
}

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

Create `src/App.tsx`:

```tsx
export default function App() {
  return (
    <main className="app-shell">
      <section className="empty-state" aria-label="VN Stock Insight loading shell">
        <h1>VN Stock Insight</h1>
        <p>Đang khởi tạo dashboard phân tích cổ phiếu và workflow đội AI.</p>
      </section>
    </main>
  );
}
```

Create `src/test/setup.ts`:

```ts
import '@testing-library/jest-dom/vitest';
```

- [ ] **Step 5: Create base CSS**

Create `src/styles.css`:

```css
:root {
  color: #14213d;
  background: #f5f7fb;
  font-family:
    Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI",
    sans-serif;
  font-synthesis: none;
  text-rendering: optimizeLegibility;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-width: 320px;
  min-height: 100vh;
}

button,
input,
select {
  font: inherit;
}

button {
  cursor: pointer;
}

.app-shell {
  min-height: 100vh;
}

.empty-state {
  display: grid;
  min-height: 100vh;
  place-items: center;
  padding: 32px;
  text-align: center;
}

.empty-state h1 {
  margin: 0 0 12px;
  font-size: clamp(2rem, 4vw, 3.5rem);
}

.empty-state p {
  margin: 0;
  color: #526174;
}
```

- [ ] **Step 6: Install dependencies**

Run:

```bash
npm install
```

Expected: `package-lock.json` is created and dependencies install successfully.

- [ ] **Step 7: Verify foundation build**

Run:

```bash
npm run typecheck
npm run build
```

Expected: both commands pass and `dist/` is generated.

- [ ] **Step 8: Commit foundation**

Run:

```bash
git add .gitignore package.json package-lock.json index.html eslint.config.js tsconfig.json tsconfig.node.json vite.config.ts vitest.config.ts src
git commit -m "chore: scaffold react vite foundation"
```

Expected: commit succeeds with project foundation files.

## Task 2: Domain Types, Static Fixtures, and Data Validation

**Agent Role:** Data Engineer Agent

**Files:**
- Create: `src/domain/types.ts`
- Create: `public/data/stocks.json`
- Create: `public/data/prices/ACB.json`
- Create: `public/data/prices/FPT.json`
- Create: `public/data/prices/VCB.json`
- Create: `public/data/fundamentals/ACB.json`
- Create: `public/data/fundamentals/FPT.json`
- Create: `public/data/fundamentals/VCB.json`
- Create: `public/data/data-health.json`
- Create: `scripts/validate-data.mjs`
- Create: `tests/data/validate-data.test.ts`

- [ ] **Step 1: Write the domain type definitions**

Create `src/domain/types.ts`:

```ts
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
```

- [ ] **Step 2: Add deterministic stock fixtures**

Create `public/data/stocks.json`:

```json
[
  { "symbol": "FPT", "name": "Công ty Cổ phần FPT", "exchange": "HOSE", "sector": "Công nghệ", "isVn30": true, "isDefaultWatchlist": true },
  { "symbol": "VCB", "name": "Ngân hàng TMCP Ngoại thương Việt Nam", "exchange": "HOSE", "sector": "Ngân hàng", "isVn30": true, "isDefaultWatchlist": true },
  { "symbol": "ACB", "name": "Ngân hàng TMCP Á Châu", "exchange": "HOSE", "sector": "Ngân hàng", "isVn30": true, "isDefaultWatchlist": false }
]
```

Create `public/data/data-health.json`:

```json
{
  "updatedAt": "2026-06-08T00:00:00+07:00",
  "source": "static-fixture",
  "status": "healthy",
  "message": "Dữ liệu mẫu ổn định cho MVP và kiểm thử CI.",
  "symbols": ["FPT", "VCB", "ACB"],
  "missingFundamentals": [],
  "missingPrices": []
}
```

- [ ] **Step 3: Add price fixtures**

Create `public/data/prices/FPT.json`:

```json
[
  { "date": "2026-05-25", "open": 118.0, "high": 120.5, "low": 117.2, "close": 120.0, "volume": 3100000 },
  { "date": "2026-05-26", "open": 120.0, "high": 122.0, "low": 119.4, "close": 121.5, "volume": 3450000 },
  { "date": "2026-05-27", "open": 121.5, "high": 123.0, "low": 120.8, "close": 122.8, "volume": 3600000 },
  { "date": "2026-05-28", "open": 122.8, "high": 124.2, "low": 122.0, "close": 123.6, "volume": 3900000 },
  { "date": "2026-05-29", "open": 123.6, "high": 126.4, "low": 123.1, "close": 125.7, "volume": 4200000 },
  { "date": "2026-06-01", "open": 125.7, "high": 127.8, "low": 125.0, "close": 127.2, "volume": 4600000 },
  { "date": "2026-06-02", "open": 127.2, "high": 128.5, "low": 126.3, "close": 127.9, "volume": 4100000 },
  { "date": "2026-06-03", "open": 127.9, "high": 130.0, "low": 127.4, "close": 129.3, "volume": 4800000 },
  { "date": "2026-06-04", "open": 129.3, "high": 131.2, "low": 128.7, "close": 130.8, "volume": 5100000 },
  { "date": "2026-06-05", "open": 130.8, "high": 132.0, "low": 130.1, "close": 131.6, "volume": 4900000 }
]
```

Create `public/data/prices/VCB.json`:

```json
[
  { "date": "2026-05-25", "open": 92.0, "high": 93.4, "low": 91.5, "close": 92.8, "volume": 1800000 },
  { "date": "2026-05-26", "open": 92.8, "high": 93.0, "low": 91.2, "close": 91.8, "volume": 2100000 },
  { "date": "2026-05-27", "open": 91.8, "high": 92.4, "low": 90.9, "close": 91.4, "volume": 1950000 },
  { "date": "2026-05-28", "open": 91.4, "high": 92.2, "low": 90.6, "close": 91.0, "volume": 2050000 },
  { "date": "2026-05-29", "open": 91.0, "high": 91.8, "low": 90.2, "close": 90.7, "volume": 2300000 },
  { "date": "2026-06-01", "open": 90.7, "high": 91.5, "low": 90.0, "close": 90.9, "volume": 2200000 },
  { "date": "2026-06-02", "open": 90.9, "high": 92.0, "low": 90.5, "close": 91.7, "volume": 2400000 },
  { "date": "2026-06-03", "open": 91.7, "high": 92.4, "low": 91.1, "close": 92.1, "volume": 2500000 },
  { "date": "2026-06-04", "open": 92.1, "high": 92.8, "low": 91.4, "close": 91.9, "volume": 2350000 },
  { "date": "2026-06-05", "open": 91.9, "high": 92.6, "low": 91.0, "close": 91.5, "volume": 2250000 }
]
```

Create `public/data/prices/ACB.json`:

```json
[
  { "date": "2026-05-25", "open": 25.4, "high": 25.8, "low": 25.1, "close": 25.6, "volume": 5200000 },
  { "date": "2026-05-26", "open": 25.6, "high": 26.1, "low": 25.5, "close": 26.0, "volume": 6100000 },
  { "date": "2026-05-27", "open": 26.0, "high": 26.4, "low": 25.8, "close": 26.2, "volume": 5900000 },
  { "date": "2026-05-28", "open": 26.2, "high": 26.3, "low": 25.7, "close": 25.9, "volume": 6400000 },
  { "date": "2026-05-29", "open": 25.9, "high": 26.2, "low": 25.6, "close": 26.1, "volume": 5800000 },
  { "date": "2026-06-01", "open": 26.1, "high": 26.6, "low": 26.0, "close": 26.5, "volume": 7000000 },
  { "date": "2026-06-02", "open": 26.5, "high": 26.9, "low": 26.3, "close": 26.8, "volume": 7200000 },
  { "date": "2026-06-03", "open": 26.8, "high": 27.0, "low": 26.4, "close": 26.6, "volume": 6800000 },
  { "date": "2026-06-04", "open": 26.6, "high": 26.9, "low": 26.2, "close": 26.4, "volume": 6600000 },
  { "date": "2026-06-05", "open": 26.4, "high": 26.8, "low": 26.3, "close": 26.7, "volume": 7100000 }
]
```

- [ ] **Step 4: Add fundamental fixtures**

Create `public/data/fundamentals/FPT.json`:

```json
{ "symbol": "FPT", "updatedAt": "2026-06-08T00:00:00+07:00", "pe": 22.4, "pb": 5.2, "roe": 0.255, "epsGrowth": 0.186, "revenueGrowth": 0.164, "debtToEquity": 0.42 }
```

Create `public/data/fundamentals/VCB.json`:

```json
{ "symbol": "VCB", "updatedAt": "2026-06-08T00:00:00+07:00", "pe": 18.6, "pb": 3.1, "roe": 0.214, "epsGrowth": 0.082, "revenueGrowth": 0.074, "debtToEquity": 0.78 }
```

Create `public/data/fundamentals/ACB.json`:

```json
{ "symbol": "ACB", "updatedAt": "2026-06-08T00:00:00+07:00", "pe": 8.9, "pb": 1.55, "roe": 0.238, "epsGrowth": 0.106, "revenueGrowth": 0.094, "debtToEquity": 0.69 }
```

- [ ] **Step 5: Write a data validation script**

Create `scripts/validate-data.mjs`:

```js
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const dataRoot = join(root, 'public', 'data');

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function validateStock(stock) {
  assert(typeof stock.symbol === 'string' && stock.symbol.length > 0, 'stock.symbol is required');
  assert(typeof stock.name === 'string' && stock.name.length > 0, `${stock.symbol}.name is required`);
  assert(['HOSE', 'HNX', 'UPCOM'].includes(stock.exchange), `${stock.symbol}.exchange is invalid`);
  assert(typeof stock.sector === 'string' && stock.sector.length > 0, `${stock.symbol}.sector is required`);
  assert(typeof stock.isVn30 === 'boolean', `${stock.symbol}.isVn30 must be boolean`);
  assert(typeof stock.isDefaultWatchlist === 'boolean', `${stock.symbol}.isDefaultWatchlist must be boolean`);
}

function validatePriceBar(symbol, bar) {
  assert(/^\d{4}-\d{2}-\d{2}$/.test(bar.date), `${symbol}.price.date is invalid`);
  for (const key of ['open', 'high', 'low', 'close', 'volume']) {
    assert(Number.isFinite(bar[key]), `${symbol}.price.${key} must be numeric`);
  }
  assert(bar.high >= bar.low, `${symbol}.price high must be >= low`);
  assert(bar.volume >= 0, `${symbol}.price volume must be >= 0`);
}

function validateFundamental(symbol, fundamental) {
  assert(fundamental.symbol === symbol, `${symbol}.fundamentals symbol mismatch`);
  assert(typeof fundamental.updatedAt === 'string', `${symbol}.fundamentals updatedAt is required`);
  for (const key of ['pe', 'pb', 'roe', 'epsGrowth', 'revenueGrowth', 'debtToEquity']) {
    assert(fundamental[key] === null || Number.isFinite(fundamental[key]), `${symbol}.fundamentals.${key} invalid`);
  }
}

const stocks = readJson(join(dataRoot, 'stocks.json'));
assert(Array.isArray(stocks), 'stocks.json must be an array');
assert(stocks.length >= 3, 'stocks.json must include at least three MVP symbols');

for (const stock of stocks) {
  validateStock(stock);
  const pricePath = join(dataRoot, 'prices', `${stock.symbol}.json`);
  const fundamentalPath = join(dataRoot, 'fundamentals', `${stock.symbol}.json`);
  assert(existsSync(pricePath), `${stock.symbol} prices file missing`);
  assert(existsSync(fundamentalPath), `${stock.symbol} fundamentals file missing`);
  const prices = readJson(pricePath);
  assert(Array.isArray(prices) && prices.length >= 10, `${stock.symbol} must have at least 10 price bars`);
  prices.forEach((bar) => validatePriceBar(stock.symbol, bar));
  validateFundamental(stock.symbol, readJson(fundamentalPath));
}

const dataHealth = readJson(join(dataRoot, 'data-health.json'));
assert(['static-fixture', 'github-actions-etl', 'manual-browser-refresh'].includes(dataHealth.source), 'data-health.source invalid');
assert(['healthy', 'partial', 'failed'].includes(dataHealth.status), 'data-health.status invalid');
assert(Array.isArray(dataHealth.symbols), 'data-health.symbols must be an array');

console.log(`Validated ${stocks.length} stock fixture(s).`);
```

- [ ] **Step 6: Write validation test**

Create `tests/data/validate-data.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';

describe('static data validation', () => {
  it('passes the repository data validation script', () => {
    const output = execFileSync('node', ['scripts/validate-data.mjs'], {
      encoding: 'utf8',
    });

    expect(output).toContain('Validated 3 stock fixture(s).');
  });
});
```

- [ ] **Step 7: Run validation**

Run:

```bash
npm run data:validate
npm test -- tests/data/validate-data.test.ts
```

Expected:

- `npm run data:validate` prints `Validated 3 stock fixture(s).`
- Vitest reports one passing test file.

- [ ] **Step 8: Commit data foundation**

Run:

```bash
git add public/data scripts/validate-data.mjs src/domain/types.ts tests/data/validate-data.test.ts
git commit -m "feat: add market data fixtures and validation"
```

Expected: commit succeeds.

## Task 3: Indicators, Scoring, and Recommendations

**Agent Role:** Quant Analyst Agent

**Files:**
- Create: `src/domain/indicators.ts`
- Create: `src/domain/scoring.ts`
- Create: `src/domain/recommendations.ts`
- Create: `tests/domain/indicators.test.ts`
- Create: `tests/domain/scoring.test.ts`

- [ ] **Step 1: Write indicator tests first**

Create `tests/domain/indicators.test.ts`:

```ts
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
```

- [ ] **Step 2: Implement indicators**

Create `src/domain/indicators.ts`:

```ts
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
```

- [ ] **Step 3: Write scoring tests first**

Create `tests/domain/scoring.test.ts`:

```ts
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
});
```

- [ ] **Step 4: Implement scoring**

Create `src/domain/scoring.ts`:

```ts
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

  addMetricScore(metrics.pe, metrics.pe !== null && metrics.pe > 0 && metrics.pe <= 22, 10, 'P/E trong vùng hợp lý', 'P/E cao hoặc không hợp lệ', result);
  addMetricScore(metrics.pb, metrics.pb !== null && metrics.pb > 0 && metrics.pb <= 3.5, 8, 'P/B không quá cao', 'P/B cao so với ngưỡng MVP', result);
  addMetricScore(metrics.roe, metrics.roe !== null && metrics.roe >= 0.15, 14, 'ROE mạnh', 'ROE dưới ngưỡng hấp dẫn', result);
  addMetricScore(metrics.epsGrowth, metrics.epsGrowth !== null && metrics.epsGrowth >= 0.08, 10, 'EPS tăng trưởng tốt', 'EPS tăng trưởng yếu', result);
  addMetricScore(metrics.revenueGrowth, metrics.revenueGrowth !== null && metrics.revenueGrowth >= 0.06, 8, 'Doanh thu tăng trưởng tích cực', 'Doanh thu tăng trưởng thấp', result);
  addMetricScore(metrics.debtToEquity, metrics.debtToEquity !== null && metrics.debtToEquity <= 1.2, 8, 'Đòn bẩy tài chính trong vùng kiểm soát', 'Đòn bẩy tài chính cao', result);

  return { ...result, score: clampScore(result.score) };
}

export function scoreTechnical(indicators: TechnicalIndicators, latestClose: number): ScoreResult {
  const result: ScoreResult = { score: 50, positives: [], negatives: [], warnings: [] };

  addMetricScore(indicators.sma20, indicators.sma20 !== null && latestClose >= indicators.sma20, 10, 'Giá trên SMA20', 'Giá dưới SMA20', result);
  addMetricScore(indicators.sma50, indicators.sma50 !== null && latestClose >= indicators.sma50, 10, 'Giá trên SMA50', 'Giá dưới SMA50', result);
  addMetricScore(indicators.sma200, indicators.sma200 !== null && latestClose >= indicators.sma200, 8, 'Giá trên SMA200', 'Giá dưới SMA200', result);
  addMetricScore(indicators.rsi14, indicators.rsi14 !== null && indicators.rsi14 >= 45 && indicators.rsi14 <= 70, 10, 'RSI trong vùng khỏe', 'RSI quá yếu hoặc quá nóng', result);
  addMetricScore(indicators.volumeRatio20, indicators.volumeRatio20 !== null && indicators.volumeRatio20 >= 1, 8, 'Thanh khoản xác nhận xu hướng', 'Thanh khoản chưa xác nhận', result);
  addMetricScore(indicators.volatility20, indicators.volatility20 !== null && indicators.volatility20 <= 0.035, 7, 'Biến động trong vùng kiểm soát', 'Biến động cao', result);
  addMetricScore(indicators.drawdown60, indicators.drawdown60 !== null && indicators.drawdown60 >= -0.12, 7, 'Drawdown gần đây được kiểm soát', 'Drawdown gần đây lớn', result);

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
  return {
    symbol,
    totalScore: score,
    fundamentalScore: clampScore(fundamentalScore),
    technicalScore: clampScore(technicalScore),
    softLabel: labelFor(score),
    action: actionFor(score, confidence),
    confidence,
    reasons: [`Điểm tổng hợp ${score}/100 dựa trên 50% cơ bản và 50% kỹ thuật.`],
    positiveSignals: positives,
    negativeSignals: negatives,
    risks: negatives.length > 0 ? negatives : ['Rủi ro chính đến từ biến động thị trường chung và độ trễ dữ liệu.'],
    dataWarnings: warnings,
  };
}
```

- [ ] **Step 5: Implement recommendation assembly**

Create `src/domain/recommendations.ts`:

```ts
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
```

- [ ] **Step 6: Run domain tests**

Run:

```bash
npm test -- tests/domain/indicators.test.ts tests/domain/scoring.test.ts
```

Expected: both test files pass.

- [ ] **Step 7: Commit scoring**

Run:

```bash
git add src/domain/indicators.ts src/domain/scoring.ts src/domain/recommendations.ts tests/domain
git commit -m "feat: add scoring and recommendation engine"
```

Expected: commit succeeds.

## Task 4: Organization Trace Model and Visualizer Data

**Agent Role:** Organization Visualizer Agent

**Files:**
- Create: `src/domain/organization.ts`
- Create: `public/data/organization/agents.json`
- Create: `public/data/organization/runs/demo-run.json`
- Create: `public/data/organization/token-usage/demo-run.json`
- Create: `public/data/organization/tool-calls/demo-run.json`
- Create: `tests/domain/organization.test.ts`

- [ ] **Step 1: Write organization tests first**

Create `tests/domain/organization.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { groupEventsByPhase, summarizeAgentUsage } from '../../src/domain/organization';
import type { AgentProfile, OrganizationEvent } from '../../src/domain/organization';

const agents: AgentProfile[] = [
  { agentId: 'tech-lead', role: 'Tech Lead', responsibility: 'Review implementation quality', status: 'reviewing', ownership: ['src/domain'], reviewAuthority: ['feature/* -> dev'] },
  { agentId: 'qa', role: 'QA Engineer', responsibility: 'Verify release quality', status: 'idle', ownership: ['tests'], reviewAuthority: ['dev -> main'] },
];

const events: OrganizationEvent[] = [
  { eventId: 'e1', runId: 'demo', timestamp: '2026-06-08T00:00:00+07:00', phase: 'implementation', agentId: 'tech-lead', role: 'Tech Lead', eventType: 'tool_call', summary: 'Ran tests', status: 'passed', durationMs: 1200, tokenUsage: { prompt: 100, completion: 40, total: 140 }, telemetryQuality: 'actual' },
  { eventId: 'e2', runId: 'demo', timestamp: '2026-06-08T00:01:00+07:00', phase: 'QA', agentId: 'qa', role: 'QA Engineer', eventType: 'review', summary: 'Approved smoke test', status: 'approved', telemetryQuality: 'unavailable' },
];

describe('organization trace model', () => {
  it('groups events by phase', () => {
    const grouped = groupEventsByPhase(events);
    expect(grouped.implementation).toHaveLength(1);
    expect(grouped.QA).toHaveLength(1);
  });

  it('summarizes token and tool usage by agent', () => {
    const summary = summarizeAgentUsage(agents, events);
    expect(summary[0].agentId).toBe('tech-lead');
    expect(summary[0].toolCalls).toBe(1);
    expect(summary[0].tokens.total).toBe(140);
    expect(summary[1].tokens.quality).toBe('unavailable');
  });
});
```

- [ ] **Step 2: Implement organization domain model**

Create `src/domain/organization.ts`:

```ts
import type { TelemetryQuality } from './types';

export type AgentStatus = 'idle' | 'working' | 'reviewing' | 'blocked' | 'approved';
export type OrganizationPhase = 'Sales' | 'discovery' | 'architecture' | 'implementation' | 'review' | 'QA' | 'release';
export type OrganizationEventType = 'message' | 'handoff' | 'decision' | 'tool_call' | 'artifact' | 'review' | 'approval' | 'ci_check' | 'token_usage';
export type OrganizationEventStatus = 'pending' | 'running' | 'passed' | 'failed' | 'blocked' | 'approved' | 'rejected';

export interface AgentProfile {
  agentId: string;
  role: string;
  responsibility: string;
  status: AgentStatus;
  ownership: string[];
  reviewAuthority: string[];
}

export interface TokenUsage {
  prompt: number;
  completion: number;
  total: number;
}

export interface OrganizationEvent {
  eventId: string;
  runId: string;
  timestamp: string;
  phase: OrganizationPhase;
  agentId: string;
  role: string;
  eventType: OrganizationEventType;
  summary: string;
  status: OrganizationEventStatus;
  fromAgentId?: string;
  toAgentId?: string;
  artifactRefs?: string[];
  toolName?: string;
  durationMs?: number;
  tokenUsage?: TokenUsage;
  telemetryQuality: TelemetryQuality;
}

export interface AgentUsageSummary {
  agentId: string;
  role: string;
  status: AgentStatus;
  toolCalls: number;
  tokens: TokenUsage & { quality: TelemetryQuality };
}

export function groupEventsByPhase(events: OrganizationEvent[]): Record<string, OrganizationEvent[]> {
  return events.reduce<Record<string, OrganizationEvent[]>>((groups, event) => {
    groups[event.phase] = groups[event.phase] ?? [];
    groups[event.phase].push(event);
    return groups;
  }, {});
}

export function summarizeAgentUsage(
  agents: AgentProfile[],
  events: OrganizationEvent[],
): AgentUsageSummary[] {
  return agents.map((agent) => {
    const agentEvents = events.filter((event) => event.agentId === agent.agentId);
    const tokenEvents = agentEvents.filter((event) => event.tokenUsage);
    const tokens = tokenEvents.reduce(
      (sum, event) => ({
        prompt: sum.prompt + (event.tokenUsage?.prompt ?? 0),
        completion: sum.completion + (event.tokenUsage?.completion ?? 0),
        total: sum.total + (event.tokenUsage?.total ?? 0),
      }),
      { prompt: 0, completion: 0, total: 0 },
    );
    const quality: TelemetryQuality = tokenEvents.length > 0 ? 'actual' : 'unavailable';

    return {
      agentId: agent.agentId,
      role: agent.role,
      status: agent.status,
      toolCalls: agentEvents.filter((event) => event.eventType === 'tool_call').length,
      tokens: { ...tokens, quality },
    };
  });
}
```

- [ ] **Step 3: Create organization fixture files**

Create `public/data/organization/agents.json`:

```json
[
  { "agentId": "sales", "role": "Sales Agent", "responsibility": "Tiếp nhận yêu cầu, lập proposal và báo giá mô phỏng.", "status": "approved", "ownership": ["proposal", "scope"], "reviewAuthority": ["customer approval gate"] },
  { "agentId": "architect", "role": "Architect Agent", "responsibility": "Thiết kế kiến trúc, data flow và review thay đổi lớn.", "status": "reviewing", "ownership": ["docs/architecture.md", "src/domain"], "reviewAuthority": ["architecture-impacting PRs", "dev -> main"] },
  { "agentId": "tech-lead", "role": "Tech Lead Agent", "responsibility": "Điều phối implementation và review chất lượng code.", "status": "working", "ownership": ["src", "tests"], "reviewAuthority": ["feature/* -> dev", "dev -> main"] },
  { "agentId": "data-engineer", "role": "Data Engineer Agent", "responsibility": "ETL, schema, data validation và data health.", "status": "working", "ownership": ["public/data", "scripts"], "reviewAuthority": ["data PRs"] },
  { "agentId": "quant", "role": "Quant Analyst Agent", "responsibility": "Scoring cơ bản/kỹ thuật và recommendation rules.", "status": "working", "ownership": ["src/domain/scoring.ts"], "reviewAuthority": ["scoring changes"] },
  { "agentId": "frontend", "role": "Frontend Engineer Agent", "responsibility": "Dashboard, visualizer và tương tác người dùng.", "status": "working", "ownership": ["src/components"], "reviewAuthority": ["UI changes"] },
  { "agentId": "qa", "role": "QA Engineer Agent", "responsibility": "Test plan, regression và release sign-off.", "status": "idle", "ownership": ["tests"], "reviewAuthority": ["QA sign-off"] },
  { "agentId": "devops", "role": "DevOps Engineer Agent", "responsibility": "CI/CD, GitHub Pages, branch governance.", "status": "working", "ownership": [".github"], "reviewAuthority": ["workflow changes", "release sign-off"] }
]
```

Create `public/data/organization/runs/demo-run.json`:

```json
[
  { "eventId": "evt-001", "runId": "demo-run", "timestamp": "2026-06-08T09:00:00+07:00", "phase": "Sales", "agentId": "sales", "role": "Sales Agent", "eventType": "message", "summary": "Tiếp nhận yêu cầu xây web app phân tích cổ phiếu Việt Nam.", "status": "passed", "telemetryQuality": "unavailable" },
  { "eventId": "evt-002", "runId": "demo-run", "timestamp": "2026-06-08T09:15:00+07:00", "phase": "architecture", "agentId": "architect", "role": "Architect Agent", "eventType": "decision", "summary": "Chọn kiến trúc static-first, GitHub Actions ETL và GitHub Pages.", "status": "approved", "artifactRefs": ["docs/superpowers/specs/2026-06-07-vn-stock-insight-design.md"], "telemetryQuality": "unavailable" },
  { "eventId": "evt-003", "runId": "demo-run", "timestamp": "2026-06-08T09:45:00+07:00", "phase": "implementation", "agentId": "tech-lead", "role": "Tech Lead Agent", "eventType": "handoff", "summary": "Tách delivery thành các slice: foundation, data, scoring, visualizer, dashboard, CI/CD.", "status": "passed", "fromAgentId": "tech-lead", "toAgentId": "data-engineer", "telemetryQuality": "estimated", "tokenUsage": { "prompt": 420, "completion": 180, "total": 600 } },
  { "eventId": "evt-004", "runId": "demo-run", "timestamp": "2026-06-08T10:15:00+07:00", "phase": "review", "agentId": "qa", "role": "QA Engineer Agent", "eventType": "review", "summary": "Xác nhận quality gate cần lint, typecheck, tests, data validation và build.", "status": "approved", "telemetryQuality": "unavailable" }
]
```

Create `public/data/organization/token-usage/demo-run.json`:

```json
[
  { "agentId": "tech-lead", "role": "Tech Lead Agent", "task": "Delivery decomposition", "prompt": 420, "completion": 180, "total": 600, "telemetryQuality": "estimated" },
  { "agentId": "sales", "role": "Sales Agent", "task": "Proposal intake", "prompt": 0, "completion": 0, "total": 0, "telemetryQuality": "unavailable" }
]
```

Create `public/data/organization/tool-calls/demo-run.json`:

```json
[
  { "eventId": "tool-001", "runId": "demo-run", "agentId": "tech-lead", "role": "Tech Lead Agent", "toolName": "shell_command", "purpose": "Inspect repository status", "status": "passed", "durationMs": 1100, "summary": "Confirmed repository contains approved design spec and is clean." }
]
```

- [ ] **Step 4: Run organization tests**

Run:

```bash
npm test -- tests/domain/organization.test.ts
```

Expected: organization tests pass.

- [ ] **Step 5: Commit organization trace model**

Run:

```bash
git add src/domain/organization.ts public/data/organization tests/domain/organization.test.ts
git commit -m "feat: add organization trace model"
```

Expected: commit succeeds.

## Task 5: Data Loading, Watchlist, and Stock Dashboard UI

**Agent Role:** Frontend Engineer Agent

**Files:**
- Create: `src/data/loaders.ts`
- Create: `src/hooks/useLocalWatchlist.ts`
- Create: `src/components/AppShell.tsx`
- Create: `src/components/DataStatus.tsx`
- Create: `src/components/MetricBadge.tsx`
- Create: `src/components/PriceChart.tsx`
- Create: `src/components/StockDashboard.tsx`
- Create: `src/components/StockDetail.tsx`
- Modify: `src/App.tsx`
- Modify: `src/styles.css`
- Create: `tests/ui/watchlist.test.tsx`

- [ ] **Step 1: Write watchlist test first**

Create `tests/ui/watchlist.test.tsx`:

```tsx
import { renderHook, act } from '@testing-library/react';
import { describe, expect, it, beforeEach } from 'vitest';
import { useLocalWatchlist } from '../../src/hooks/useLocalWatchlist';

describe('useLocalWatchlist', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('adds and removes symbols in localStorage', () => {
    const { result } = renderHook(() => useLocalWatchlist(['FPT']));

    expect(result.current.symbols).toEqual(['FPT']);

    act(() => result.current.addSymbol('vcb'));
    expect(result.current.symbols).toEqual(['FPT', 'VCB']);

    act(() => result.current.removeSymbol('FPT'));
    expect(result.current.symbols).toEqual(['VCB']);
  });
});
```

- [ ] **Step 2: Implement local watchlist hook**

Create `src/hooks/useLocalWatchlist.ts`:

```ts
import { useCallback, useMemo, useState } from 'react';

const STORAGE_KEY = 'vn-stock-insight.watchlist';

function normalize(symbol: string): string {
  return symbol.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
}

function readStored(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((value) => typeof value === 'string') : [];
  } catch {
    return [];
  }
}

export function useLocalWatchlist(defaultSymbols: string[]) {
  const [customSymbols, setCustomSymbols] = useState<string[]>(readStored);

  const persist = useCallback((symbols: string[]) => {
    setCustomSymbols(symbols);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(symbols));
  }, []);

  const symbols = useMemo(
    () => Array.from(new Set([...defaultSymbols.map(normalize), ...customSymbols.map(normalize)])).filter(Boolean),
    [customSymbols, defaultSymbols],
  );

  const addSymbol = useCallback(
    (symbol: string) => {
      const normalized = normalize(symbol);
      if (!normalized) return;
      persist(Array.from(new Set([...customSymbols, normalized])));
    },
    [customSymbols, persist],
  );

  const removeSymbol = useCallback(
    (symbol: string) => {
      const normalized = normalize(symbol);
      persist(customSymbols.filter((item) => item !== normalized));
    },
    [customSymbols, persist],
  );

  return { symbols, addSymbol, removeSymbol };
}
```

- [ ] **Step 3: Implement data loader**

Create `src/data/loaders.ts`:

```ts
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

async function loadJson<T>(path: string): Promise<T> {
  const response = await fetch(`${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`);
  if (!response.ok) {
    throw new Error(`Cannot load ${path}: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export async function loadMarketDataset(): Promise<MarketDataset> {
  const stocks = await loadJson<StockMeta[]>('data/stocks.json');
  const dataHealth = await loadJson<DataHealth>('data/data-health.json');
  const pricesBySymbol: Record<string, PriceBar[]> = {};
  const fundamentalsBySymbol: Record<string, FundamentalMetrics> = {};
  const indicatorsBySymbol: Record<string, TechnicalIndicators> = {};
  const recommendations: Recommendation[] = [];

  for (const stock of stocks) {
    const prices = await loadJson<PriceBar[]>(`data/prices/${stock.symbol}.json`);
    const fundamentals = await loadJson<FundamentalMetrics>(`data/fundamentals/${stock.symbol}.json`);
    const indicators = buildIndicatorsForSymbol(stock.symbol, prices, dataHealth.updatedAt);
    pricesBySymbol[stock.symbol] = prices;
    fundamentalsBySymbol[stock.symbol] = fundamentals;
    indicatorsBySymbol[stock.symbol] = indicators;
    recommendations.push(buildRecommendationForSymbol(stock.symbol, prices, fundamentals, indicators));
  }

  recommendations.sort((a, b) => b.totalScore - a.totalScore);
  return { stocks, pricesBySymbol, fundamentalsBySymbol, indicatorsBySymbol, recommendations, dataHealth };
}
```

- [ ] **Step 4: Implement reusable UI components**

Create `src/components/MetricBadge.tsx`:

```tsx
interface MetricBadgeProps {
  label: string;
  value: string | number;
  tone?: 'neutral' | 'positive' | 'warning' | 'danger';
}

export function MetricBadge({ label, value, tone = 'neutral' }: MetricBadgeProps) {
  return (
    <span className={`metric-badge metric-badge--${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </span>
  );
}
```

Create `src/components/DataStatus.tsx`:

```tsx
import type { DataHealth } from '../domain/types';

interface DataStatusProps {
  dataHealth: DataHealth;
  refreshState: string;
}

export function DataStatus({ dataHealth, refreshState }: DataStatusProps) {
  return (
    <div className={`data-status data-status--${dataHealth.status}`}>
      <span>{dataHealth.message}</span>
      <strong>{new Date(dataHealth.updatedAt).toLocaleString('vi-VN')}</strong>
      <small>{refreshState}</small>
    </div>
  );
}
```

Create `src/components/PriceChart.tsx`:

```tsx
import type { PriceBar } from '../domain/types';

interface PriceChartProps {
  prices: PriceBar[];
}

export function PriceChart({ prices }: PriceChartProps) {
  if (prices.length === 0) return <div className="chart-empty">Không có dữ liệu giá.</div>;
  const closes = prices.map((bar) => bar.close);
  const min = Math.min(...closes);
  const max = Math.max(...closes);
  const range = max - min || 1;
  const points = prices
    .map((bar, index) => {
      const x = (index / Math.max(1, prices.length - 1)) * 100;
      const y = 100 - ((bar.close - min) / range) * 100;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg className="price-chart" viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label="Biểu đồ giá">
      <polyline points={points} fill="none" stroke="currentColor" strokeWidth="3" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
```

- [ ] **Step 5: Implement dashboard and detail UI**

Create `src/components/StockDetail.tsx`:

```tsx
import { PriceChart } from './PriceChart';
import { MetricBadge } from './MetricBadge';
import type { FundamentalMetrics, PriceBar, Recommendation, TechnicalIndicators } from '../domain/types';

interface StockDetailProps {
  symbol: string;
  prices: PriceBar[];
  fundamentals: FundamentalMetrics;
  indicators: TechnicalIndicators;
  recommendation: Recommendation;
  onClose: () => void;
}

export function StockDetail({ symbol, prices, fundamentals, indicators, recommendation, onClose }: StockDetailProps) {
  return (
    <aside className="detail-panel" aria-label={`Chi tiết ${symbol}`}>
      <div className="detail-header">
        <div>
          <span className="eyebrow">Chi tiết mã</span>
          <h2>{symbol}</h2>
        </div>
        <button type="button" className="icon-button" onClick={onClose} aria-label="Đóng chi tiết">×</button>
      </div>
      <PriceChart prices={prices} />
      <div className="metric-grid">
        <MetricBadge label="P/E" value={fundamentals.pe ?? 'N/A'} />
        <MetricBadge label="P/B" value={fundamentals.pb ?? 'N/A'} />
        <MetricBadge label="ROE" value={fundamentals.roe !== null ? `${Math.round(fundamentals.roe * 100)}%` : 'N/A'} />
        <MetricBadge label="RSI" value={indicators.rsi14 !== null ? Math.round(indicators.rsi14) : 'N/A'} />
      </div>
      <section className="recommendation-copy">
        <h3>{recommendation.action} · {recommendation.softLabel}</h3>
        {recommendation.reasons.map((reason) => <p key={reason}>{reason}</p>)}
        <h4>Tín hiệu tích cực</h4>
        <ul>{recommendation.positiveSignals.map((signal) => <li key={signal}>{signal}</li>)}</ul>
        <h4>Rủi ro</h4>
        <ul>{recommendation.risks.map((risk) => <li key={risk}>{risk}</li>)}</ul>
      </section>
    </aside>
  );
}
```

Create `src/components/StockDashboard.tsx`:

```tsx
import { useMemo, useState } from 'react';
import { RefreshCcw, Search } from 'lucide-react';
import { DataStatus } from './DataStatus';
import { MetricBadge } from './MetricBadge';
import { StockDetail } from './StockDetail';
import { useLocalWatchlist } from '../hooks/useLocalWatchlist';
import type { MarketDataset } from '../domain/types';

interface StockDashboardProps {
  dataset: MarketDataset;
  refreshState: string;
  onRefresh: () => void;
}

export function StockDashboard({ dataset, refreshState, onRefresh }: StockDashboardProps) {
  const defaultSymbols = dataset.stocks.filter((stock) => stock.isDefaultWatchlist).map((stock) => stock.symbol);
  const watchlist = useLocalWatchlist(defaultSymbols);
  const [query, setQuery] = useState('');
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(dataset.recommendations[0]?.symbol ?? null);

  const filtered = useMemo(() => {
    const normalized = query.trim().toUpperCase();
    return dataset.recommendations.filter((recommendation) => {
      const inQuery = !normalized || recommendation.symbol.includes(normalized);
      return inQuery;
    });
  }, [dataset.recommendations, query]);

  const selected = selectedSymbol ? dataset.recommendations.find((item) => item.symbol === selectedSymbol) : null;

  return (
    <section className="workspace">
      <header className="topbar">
        <div>
          <span className="eyebrow">Stock Insight Dashboard</span>
          <h1>Phân tích cổ phiếu Việt Nam</h1>
        </div>
        <button type="button" className="primary-button" onClick={onRefresh}>
          <RefreshCcw size={18} /> Refresh
        </button>
      </header>
      <DataStatus dataHealth={dataset.dataHealth} refreshState={refreshState} />
      <div className="summary-grid">
        <MetricBadge label="Buy" value={dataset.recommendations.filter((item) => item.action === 'Buy').length} tone="positive" />
        <MetricBadge label="Hold" value={dataset.recommendations.filter((item) => item.action === 'Hold').length} tone="warning" />
        <MetricBadge label="Sell/Avoid" value={dataset.recommendations.filter((item) => item.action === 'Sell/Avoid').length} tone="danger" />
        <MetricBadge label="Watchlist" value={watchlist.symbols.length} />
      </div>
      <div className="toolbar">
        <Search size={18} />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm mã cổ phiếu" />
      </div>
      <div className="content-grid">
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Mã</th><th>Điểm</th><th>Cơ bản</th><th>Kỹ thuật</th><th>Nhãn</th><th>Hành động</th><th>Confidence</th></tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.symbol} onClick={() => setSelectedSymbol(item.symbol)}>
                  <td>{item.symbol}</td>
                  <td>{item.totalScore}</td>
                  <td>{item.fundamentalScore}</td>
                  <td>{item.technicalScore}</td>
                  <td>{item.softLabel}</td>
                  <td>{item.action}</td>
                  <td>{Math.round(item.confidence * 100)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {selected && (
          <StockDetail
            symbol={selected.symbol}
            prices={dataset.pricesBySymbol[selected.symbol]}
            fundamentals={dataset.fundamentalsBySymbol[selected.symbol]}
            indicators={dataset.indicatorsBySymbol[selected.symbol]}
            recommendation={selected}
            onClose={() => setSelectedSymbol(null)}
          />
        )}
      </div>
    </section>
  );
}
```

- [ ] **Step 6: Implement App shell**

Create `src/components/AppShell.tsx`:

```tsx
import { useState } from 'react';
import type { ReactNode } from 'react';

interface AppShellProps {
  stockDashboard: ReactNode;
  organizationVisualizer: ReactNode;
}

export function AppShell({ stockDashboard, organizationVisualizer }: AppShellProps) {
  const [active, setActive] = useState<'stocks' | 'organization'>('stocks');

  return (
    <main className="app-shell">
      <nav className="side-nav" aria-label="Điều hướng chính">
        <h1>VN Stock Insight</h1>
        <button className={active === 'stocks' ? 'active' : ''} onClick={() => setActive('stocks')}>Cổ phiếu</button>
        <button className={active === 'organization' ? 'active' : ''} onClick={() => setActive('organization')}>Đội AI</button>
      </nav>
      <section className="main-pane">
        {active === 'stocks' ? stockDashboard : organizationVisualizer}
      </section>
    </main>
  );
}
```

Modify `src/App.tsx`:

```tsx
import { useEffect, useState } from 'react';
import { AppShell } from './components/AppShell';
import { StockDashboard } from './components/StockDashboard';
import { loadMarketDataset } from './data/loaders';
import type { MarketDataset } from './domain/types';

export default function App() {
  const [dataset, setDataset] = useState<MarketDataset | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshState, setRefreshState] = useState('Dữ liệu ETL tĩnh');

  useEffect(() => {
    loadMarketDataset()
      .then(setDataset)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Không tải được dữ liệu'));
  }, []);

  if (error) return <main className="empty-state"><h1>Lỗi dữ liệu</h1><p>{error}</p></main>;
  if (!dataset) return <main className="empty-state"><h1>VN Stock Insight</h1><p>Đang tải dữ liệu...</p></main>;

  return (
    <AppShell
      stockDashboard={
        <StockDashboard
          dataset={dataset}
          refreshState={refreshState}
          onRefresh={() => setRefreshState('Manual refresh sẽ được bật ở task Manual Browser Refresh')}
        />
      }
      organizationVisualizer={
        <section className="workspace">
          <span className="eyebrow">Organization Runtime Visualizer</span>
          <h1>Quy trình đội AI</h1>
          <p>Visualizer chi tiết sẽ được triển khai ở task tiếp theo.</p>
        </section>
      }
    />
  );
}
```

- [ ] **Step 7: Run UI hook test and build**

Run:

```bash
npm test -- tests/ui/watchlist.test.tsx
npm run build
```

Expected: watchlist test passes and production build succeeds.

- [ ] **Step 8: Commit dashboard**

Run:

```bash
git add src tests/ui
git commit -m "feat: add stock dashboard UI"
```

Expected: commit succeeds.

## Task 6: Organization Visualizer UI and Manual Refresh

**Agent Role:** Organization Visualizer Agent + Frontend Agent

**Files:**
- Create: `src/components/OrganizationVisualizer.tsx`
- Create: `src/data/manualRefresh.ts`
- Modify: `src/App.tsx`
- Modify: `src/styles.css`

- [ ] **Step 1: Implement organization visualizer component**

Create `src/components/OrganizationVisualizer.tsx`:

```tsx
import { useEffect, useMemo, useState } from 'react';
import { groupEventsByPhase, summarizeAgentUsage } from '../domain/organization';
import type { AgentProfile, OrganizationEvent } from '../domain/organization';

async function loadJson<T>(path: string): Promise<T> {
  const response = await fetch(`${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`);
  if (!response.ok) throw new Error(`Cannot load ${path}`);
  return response.json() as Promise<T>;
}

export function OrganizationVisualizer() {
  const [agents, setAgents] = useState<AgentProfile[]>([]);
  const [events, setEvents] = useState<OrganizationEvent[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      loadJson<AgentProfile[]>('data/organization/agents.json'),
      loadJson<OrganizationEvent[]>('data/organization/runs/demo-run.json'),
    ])
      .then(([agentData, eventData]) => {
        setAgents(agentData);
        setEvents(eventData);
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Không tải được workflow đội AI'));
  }, []);

  const grouped = useMemo(() => groupEventsByPhase(events), [events]);
  const usage = useMemo(() => summarizeAgentUsage(agents, events), [agents, events]);

  if (error) return <section className="workspace"><h1>Workflow đội AI</h1><p>{error}</p></section>;

  return (
    <section className="workspace">
      <header className="topbar">
        <div>
          <span className="eyebrow">Organization Runtime Visualizer</span>
          <h1>Quy trình công ty phần mềm AI</h1>
        </div>
      </header>
      <div className="agent-grid">
        {agents.map((agent) => (
          <article key={agent.agentId} className="agent-card">
            <span>{agent.role}</span>
            <h3>{agent.responsibility}</h3>
            <p>Trạng thái: {agent.status}</p>
            <small>Ownership: {agent.ownership.join(', ')}</small>
          </article>
        ))}
      </div>
      <div className="content-grid">
        <section className="timeline">
          <h2>Workflow events</h2>
          {Object.entries(grouped).map(([phase, phaseEvents]) => (
            <div key={phase} className="phase-block">
              <h3>{phase}</h3>
              {phaseEvents.map((event) => (
                <article key={event.eventId} className="event-row">
                  <strong>{event.role}</strong>
                  <p>{event.summary}</p>
                  <small>{event.status} · {event.telemetryQuality}</small>
                </article>
              ))}
            </div>
          ))}
        </section>
        <section className="ledger">
          <h2>Token & tool ledger</h2>
          {usage.map((item) => (
            <article key={item.agentId} className="event-row">
              <strong>{item.role}</strong>
              <p>Tool calls: {item.toolCalls}</p>
              <small>Tokens: {item.tokens.total} · {item.tokens.quality}</small>
            </article>
          ))}
        </section>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Implement manual refresh module**

Create `src/data/manualRefresh.ts`:

```ts
import type { MarketDataset } from '../domain/types';

export interface ManualRefreshResult {
  dataset: MarketDataset;
  state: string;
}

const CACHE_KEY = 'vn-stock-insight.manual-refresh';

export async function manualRefreshWithFallback(current: MarketDataset): Promise<ManualRefreshResult> {
  try {
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({
        savedAt: new Date().toISOString(),
        symbols: current.recommendations.map((item) => item.symbol),
      }),
    );

    return {
      dataset: {
        ...current,
        dataHealth: {
          ...current.dataHealth,
          source: 'manual-browser-refresh',
          message: 'Manual refresh chạy ở chế độ best-effort; dữ liệu hiện tại vẫn dùng static JSON đã validate.',
        },
      },
      state: 'Manual refresh hoàn tất với dữ liệu static đã cache cục bộ',
    };
  } catch {
    return {
      dataset: current,
      state: 'Manual refresh không khả dụng; tiếp tục dùng dữ liệu ETL tĩnh',
    };
  }
}
```

- [ ] **Step 3: Wire manual refresh into App**

Modify `src/App.tsx` so the full file is:

```tsx
import { useEffect, useState } from 'react';
import { AppShell } from './components/AppShell';
import { StockDashboard } from './components/StockDashboard';
import { OrganizationVisualizer } from './components/OrganizationVisualizer';
import { loadMarketDataset } from './data/loaders';
import { manualRefreshWithFallback } from './data/manualRefresh';
import type { MarketDataset } from './domain/types';

export default function App() {
  const [dataset, setDataset] = useState<MarketDataset | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshState, setRefreshState] = useState('Dữ liệu ETL tĩnh');

  useEffect(() => {
    loadMarketDataset()
      .then(setDataset)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Không tải được dữ liệu'));
  }, []);

  async function handleRefresh() {
    if (!dataset) return;
    setRefreshState('Đang chạy manual refresh...');
    const result = await manualRefreshWithFallback(dataset);
    setDataset(result.dataset);
    setRefreshState(result.state);
  }

  if (error) return <main className="empty-state"><h1>Lỗi dữ liệu</h1><p>{error}</p></main>;
  if (!dataset) return <main className="empty-state"><h1>VN Stock Insight</h1><p>Đang tải dữ liệu...</p></main>;

  return (
    <AppShell
      stockDashboard={<StockDashboard dataset={dataset} refreshState={refreshState} onRefresh={handleRefresh} />}
      organizationVisualizer={<OrganizationVisualizer />}
    />
  );
}
```

- [ ] **Step 4: Extend CSS for the complete UI**

Append to `src/styles.css`:

```css
.app-shell {
  display: grid;
  grid-template-columns: 240px 1fr;
  min-height: 100vh;
}

.side-nav {
  background: #ffffff;
  border-right: 1px solid #dde4ef;
  padding: 24px;
}

.side-nav h1 {
  font-size: 1.1rem;
  margin: 0 0 24px;
}

.side-nav button {
  display: block;
  width: 100%;
  margin-bottom: 8px;
  border: 1px solid #dde4ef;
  border-radius: 8px;
  background: #ffffff;
  color: #14213d;
  padding: 10px 12px;
  text-align: left;
}

.side-nav button.active {
  background: #14213d;
  color: #ffffff;
}

.main-pane {
  min-width: 0;
}

.workspace {
  padding: 24px;
}

.topbar {
  align-items: center;
  display: flex;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.eyebrow {
  color: #65758b;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
}

.topbar h1,
.detail-header h2 {
  margin: 4px 0 0;
}

.primary-button,
.icon-button {
  align-items: center;
  border: 0;
  border-radius: 8px;
  display: inline-flex;
  gap: 8px;
  padding: 10px 14px;
}

.primary-button {
  background: #2563eb;
  color: #ffffff;
}

.icon-button {
  background: #eef2f7;
}

.data-status,
.toolbar,
.table-wrap,
.detail-panel,
.agent-card,
.timeline,
.ledger {
  background: #ffffff;
  border: 1px solid #dde4ef;
  border-radius: 8px;
}

.data-status {
  display: flex;
  gap: 16px;
  justify-content: space-between;
  margin-bottom: 16px;
  padding: 12px 14px;
}

.summary-grid,
.agent-grid,
.metric-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  margin-bottom: 16px;
}

.metric-badge {
  background: #ffffff;
  border: 1px solid #dde4ef;
  border-radius: 8px;
  display: grid;
  gap: 4px;
  padding: 12px;
}

.metric-badge strong {
  font-size: 1.25rem;
}

.metric-badge--positive { border-color: #22c55e; }
.metric-badge--warning { border-color: #f59e0b; }
.metric-badge--danger { border-color: #ef4444; }

.toolbar {
  align-items: center;
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  padding: 10px 12px;
}

.toolbar input {
  border: 0;
  flex: 1;
  outline: 0;
}

.content-grid {
  display: grid;
  gap: 16px;
  grid-template-columns: minmax(0, 1fr) minmax(320px, 420px);
}

.table-wrap {
  overflow: auto;
}

table {
  border-collapse: collapse;
  width: 100%;
}

th,
td {
  border-bottom: 1px solid #eef2f7;
  padding: 12px;
  text-align: left;
  white-space: nowrap;
}

tbody tr {
  cursor: pointer;
}

tbody tr:hover {
  background: #f8fafc;
}

.detail-panel,
.timeline,
.ledger,
.agent-card {
  padding: 16px;
}

.detail-header {
  align-items: center;
  display: flex;
  justify-content: space-between;
}

.price-chart {
  color: #2563eb;
  display: block;
  height: 180px;
  margin: 16px 0;
  width: 100%;
}

.event-row {
  border-top: 1px solid #eef2f7;
  padding: 12px 0;
}

.phase-block h3 {
  margin-top: 18px;
}

@media (max-width: 900px) {
  .app-shell {
    grid-template-columns: 1fr;
  }

  .side-nav {
    border-bottom: 1px solid #dde4ef;
    border-right: 0;
  }

  .content-grid {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 5: Run visualizer and build checks**

Run:

```bash
npm run typecheck
npm run build
```

Expected: both commands pass.

- [ ] **Step 6: Commit visualizer and refresh**

Run:

```bash
git add src/components/OrganizationVisualizer.tsx src/data/manualRefresh.ts src/App.tsx src/styles.css
git commit -m "feat: add organization visualizer and manual refresh"
```

Expected: commit succeeds.

## Task 7: Static Data Generation, CI/CD, and Governance

**Agent Role:** DevOps Engineer Agent

**Files:**
- Create: `scripts/generate-static-data.mjs`
- Create: `.github/workflows/ci.yml`
- Create: `.github/workflows/pages.yml`
- Create: `.github/workflows/daily-etl.yml`
- Create: `.github/pull_request_template.md`
- Create: `.github/ISSUE_TEMPLATE/feature_request.md`
- Create: `.github/ISSUE_TEMPLATE/bug_report.md`
- Create: `.github/CODEOWNERS`

- [ ] **Step 1: Add static data generator**

Create `scripts/generate-static-data.mjs`:

```js
import { copyFileSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

const root = process.cwd();
const dataRoot = join(root, 'public', 'data');
const generatedRoot = join(root, 'dist-data-check');

function copyDir(source, target) {
  mkdirSync(target, { recursive: true });
  for (const entry of readdirSync(source)) {
    const from = join(source, entry);
    const to = join(target, entry);
    if (statSync(from).isDirectory()) {
      copyDir(from, to);
    } else {
      copyFileSync(from, to);
    }
  }
}

copyDir(dataRoot, generatedRoot);
execFileSync('node', ['scripts/validate-data.mjs'], { stdio: 'inherit' });
console.log('Generated static data check artifacts.');
```

- [ ] **Step 2: Add CI workflow**

Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  pull_request:
    branches: [dev, main]
  push:
    branches: [dev, main]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: npm
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm test
      - run: npm run data:validate
      - run: npm run build
```

Create `.github/workflows/pages.yml`:

```yaml
name: Deploy GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: npm
      - run: npm ci
      - run: npm run data:validate
      - run: GITHUB_PAGES=true npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

Create `.github/workflows/daily-etl.yml`:

```yaml
name: Daily ETL

on:
  schedule:
    - cron: "30 10 * * 1-5"
  workflow_dispatch:

jobs:
  generate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: npm
      - run: npm ci
      - run: npm run data:generate
      - run: npm run data:validate
```

- [ ] **Step 3: Add governance templates**

Create `.github/pull_request_template.md`:

```markdown
## Scope

- 

## Acceptance Criteria

- [ ] Requirement is covered
- [ ] Tests or validation evidence included
- [ ] Risk note included

## Role-Based Review Gate

- [ ] Author self-check completed
- [ ] Tech Lead Agent reviewed
- [ ] Architect Agent reviewed if architecture-impacting
- [ ] Domain reviewer reviewed
- [ ] QA sign-off for release PR
- [ ] DevOps sign-off for release PR

## Verification

- [ ] `npm run lint`
- [ ] `npm run typecheck`
- [ ] `npm test`
- [ ] `npm run data:validate`
- [ ] `npm run build`
```

Create `.github/ISSUE_TEMPLATE/feature_request.md`:

```markdown
---
name: Feature request
about: Request a new product capability or workflow change
title: "[Feature] "
labels: enhancement
---

## Customer Need

## Expected Workflow

## Acceptance Criteria
```

Create `.github/ISSUE_TEMPLATE/bug_report.md`:

```markdown
---
name: Bug report
about: Report a defect or broken workflow
title: "[Bug] "
labels: bug
---

## Observed Behavior

## Expected Behavior

## Reproduction Steps

## Evidence
```

Create `.github/CODEOWNERS`:

```text
* @anhtnt90dev
/src/domain/ @anhtnt90dev
/src/data/ @anhtnt90dev
/src/components/ @anhtnt90dev
/public/data/ @anhtnt90dev
/.github/ @anhtnt90dev
/docs/ @anhtnt90dev
```

- [ ] **Step 4: Run workflow-equivalent commands locally**

Run:

```bash
npm run data:generate
npm run data:validate
npm run build
```

Expected:

- `npm run data:generate` prints `Generated static data check artifacts.`
- data validation passes.
- production build passes.

- [ ] **Step 5: Commit CI/CD and governance**

Run:

```bash
git add scripts/generate-static-data.mjs .github
git commit -m "ci: add quality gates and pages workflows"
```

Expected: commit succeeds.

## Task 8: Documentation, Final Verification, and Release Readiness

**Agent Role:** QA Engineer Agent

**Files:**
- Create: `docs/architecture.md`
- Create: `docs/data-pipeline.md`
- Create: `docs/scoring.md`
- Create: `docs/ai-organization.md`
- Create: `docs/organization-visualizer.md`
- Create: `docs/telemetry-schema.md`
- Create: `docs/release-process.md`
- Modify: `README.md`

- [ ] **Step 1: Add architecture documentation**

Create `docs/architecture.md`:

```markdown
# Architecture

VN Stock Insight is a static-first React application deployed to GitHub Pages. The browser reads validated JSON from `public/data`, renders the stock dashboard, and replays organization workflow traces from `public/data/organization`.

Production data is generated and validated by GitHub Actions. Browser manual refresh is best-effort and cannot store API keys.
```

Create `docs/data-pipeline.md`:

```markdown
# Data Pipeline

The MVP uses deterministic static fixtures and validation scripts. The future ETL adapter can replace fixture generation while preserving the same JSON contracts.

Required validation command:

```bash
npm run data:validate
```
```

Create `docs/scoring.md`:

```markdown
# Scoring

Scores are calculated from 50% fundamental score and 50% technical score. Recommendation labels are:

- 80-100: Rất tiềm năng / Buy
- 65-79: Theo dõi / Buy or Hold depending on confidence
- 50-64: Trung lập / Hold
- 0-49: Rủi ro cao / Sell/Avoid

The app is a decision-support tool and does not provide personalized financial advice.
```

- [ ] **Step 2: Add organization documentation**

Create `docs/ai-organization.md`:

```markdown
# AI Organization

The AI team is modeled as role-based agents: Sales, Presales, BA/PO, Architect, Tech Lead, Data Engineer, Quant Analyst, Frontend Engineer, QA Engineer, and DevOps Engineer.

The orchestrator coordinates work, records trace events, reviews outputs, and integrates delivery.
```

Create `docs/organization-visualizer.md`:

```markdown
# Organization Runtime Visualizer

The visualizer reads static JSON trace artifacts and displays:

- Workflow phases
- Agent roles and ownership
- Conversation and handoff summaries
- Tool call summaries
- Token usage when available
- Review and approval status

Exact token values are shown only when the runtime exposes them. Otherwise the UI must mark token telemetry as estimated or unavailable.
```

Create `docs/telemetry-schema.md`:

```markdown
# Telemetry Schema

Organization events use append-only JSON records with these key fields:

- `eventId`
- `runId`
- `timestamp`
- `phase`
- `agentId`
- `role`
- `eventType`
- `summary`
- `status`
- `tokenUsage`
- `telemetryQuality`

Tool call artifacts must redact secrets, credentials, and unsafe raw payloads.
```

- [ ] **Step 3: Add release documentation and README**

Create `docs/release-process.md`:

```markdown
# Release Process

1. Work on `feature/*`.
2. Open PR into `dev`.
3. Pass lint, typecheck, tests, data validation, and build.
4. Complete Tech Lead and domain review.
5. Open `dev` to `main` release PR.
6. Complete Tech Lead, Architect, QA, and DevOps sign-off.
7. Merge to `main`.
8. GitHub Pages deploys from `main`.
9. Run post-deploy smoke check.
```

Create `README.md`:

```markdown
# VN Stock Insight

Vietnamese stock analysis dashboard with AI software-company workflow visualization.

## Run Locally

```bash
npm install
npm run dev
```

## Quality Gates

```bash
npm run lint
npm run typecheck
npm test
npm run data:validate
npm run build
```

## Deployment

GitHub Pages deploys from `main` through `.github/workflows/pages.yml`.

## Disclaimer

This app is a decision-support tool. It is not personalized financial advice and does not guarantee investment returns.
```

- [ ] **Step 4: Run final verification**

Run:

```bash
npm run lint
npm run typecheck
npm test
npm run data:validate
npm run build
```

Expected:

- lint passes.
- typecheck passes.
- all tests pass.
- data validation passes.
- build passes.

- [ ] **Step 5: Commit documentation**

Run:

```bash
git add README.md docs
git commit -m "docs: add project operation documentation"
```

Expected: commit succeeds.

## Self-Review Checklist

Spec coverage:

- Public repo target and GitHub Pages deployment are covered by Task 7.
- Branch governance and role-based review gates are covered by Task 7 templates and documentation.
- VN30/watchlist and static data are covered by Task 2 and Task 5.
- Scoring and recommendations are covered by Task 3.
- Organization Runtime Visualizer and telemetry are covered by Task 4 and Task 6.
- Manual Refresh is covered by Task 6.
- CI/CD and quality gates are covered by Task 7 and Task 8.
- Documentation and release readiness are covered by Task 8.

Placeholder scan:

- The plan avoids placeholder markers and undefined task references.
- Token telemetry is explicitly marked as `actual`, `estimated`, or `unavailable`.
- Browser refresh is explicitly best-effort and safe to fail.

Type consistency:

- Domain types in `src/domain/types.ts` are used by loaders, scoring, recommendations, and UI.
- Organization types in `src/domain/organization.ts` are used by the visualizer and tests.
- Recommendation labels match the approved Vietnamese labels.
