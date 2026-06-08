import { useMemo, useState } from 'react';
import { Plus, RefreshCcw, Search, Star, StarOff } from 'lucide-react';
import type { MarketDataset, Recommendation, StockMeta } from '../domain/types';
import { useLocalWatchlist } from '../hooks/useLocalWatchlist';
import { DataStatus } from './DataStatus';
import { MetricBadge } from './MetricBadge';
import { StockDetail } from './StockDetail';

interface StockDashboardProps {
  dataset: MarketDataset;
  refreshState: string;
  onRefresh: () => void;
}

function actionTone(action: Recommendation['action']): 'positive' | 'warning' | 'danger' {
  if (action === 'Buy') return 'positive';
  if (action === 'Hold') return 'warning';
  return 'danger';
}

function findStock(stocksBySymbol: Map<string, StockMeta>, symbol: string): StockMeta | undefined {
  return stocksBySymbol.get(symbol);
}

export function StockDashboard({ dataset, refreshState, onRefresh }: StockDashboardProps) {
  const defaultSymbols = useMemo(
    () => dataset.stocks.filter((stock) => stock.isDefaultWatchlist).map((stock) => stock.symbol),
    [dataset.stocks],
  );
  const watchlist = useLocalWatchlist(defaultSymbols);
  const [query, setQuery] = useState('');
  const [watchlistDraft, setWatchlistDraft] = useState('');
  const [showWatchlistOnly, setShowWatchlistOnly] = useState(false);
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(
    dataset.recommendations[0]?.symbol ?? null,
  );

  const stocksBySymbol = useMemo(
    () => new Map(dataset.stocks.map((stock) => [stock.symbol, stock])),
    [dataset.stocks],
  );

  const filteredRecommendations = useMemo(() => {
    const normalized = query.trim().toUpperCase();
    return dataset.recommendations.filter((recommendation) => {
      const stock = findStock(stocksBySymbol, recommendation.symbol);
      const matchesQuery =
        !normalized ||
        recommendation.symbol.includes(normalized) ||
        stock?.name.toUpperCase().includes(normalized) ||
        stock?.sector.toUpperCase().includes(normalized);
      const matchesWatchlist = !showWatchlistOnly || watchlist.hasSymbol(recommendation.symbol);
      return matchesQuery && matchesWatchlist;
    });
  }, [dataset.recommendations, query, showWatchlistOnly, stocksBySymbol, watchlist]);

  const selected = selectedSymbol
    ? dataset.recommendations.find((item) => item.symbol === selectedSymbol) ?? null
    : null;

  const submitWatchlist = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    watchlist.addSymbol(watchlistDraft);
    setWatchlistDraft('');
  };

  return (
    <section className="workspace">
      <header className="topbar">
        <div>
          <span className="eyebrow">Stock Insight Dashboard</span>
          <h1>Phân tích cổ phiếu Việt Nam</h1>
        </div>
        <button type="button" className="primary-button" onClick={onRefresh}>
          <RefreshCcw size={18} />
          Refresh
        </button>
      </header>

      <DataStatus dataHealth={dataset.dataHealth} refreshState={refreshState} />

      <div className="summary-grid" aria-label="Tổng quan khuyến nghị">
        <MetricBadge
          label="Buy"
          value={dataset.recommendations.filter((item) => item.action === 'Buy').length}
          tone="positive"
        />
        <MetricBadge
          label="Hold"
          value={dataset.recommendations.filter((item) => item.action === 'Hold').length}
          tone="warning"
        />
        <MetricBadge
          label="Sell/Avoid"
          value={dataset.recommendations.filter((item) => item.action === 'Sell/Avoid').length}
          tone="danger"
        />
        <MetricBadge label="Watchlist" value={watchlist.symbols.length} />
      </div>

      <section className="watchlist-panel" aria-label="Watchlist">
        <form className="watchlist-form" onSubmit={submitWatchlist}>
          <label htmlFor="watchlist-symbol">Watchlist</label>
          <div>
            <input
              id="watchlist-symbol"
              value={watchlistDraft}
              onChange={(event) => setWatchlistDraft(event.target.value)}
              placeholder="Thêm mã"
            />
            <button type="submit" className="icon-button" aria-label="Thêm mã vào watchlist">
              <Plus size={18} />
            </button>
          </div>
        </form>
        <div className="watchlist-chips">
          {watchlist.symbols.map((symbol) => (
            <span className="watchlist-chip" key={symbol}>
              <span>{symbol}</span>
              {watchlist.isCustomSymbol(symbol) ? (
                <button type="button" onClick={() => watchlist.removeSymbol(symbol)} aria-label={`Bỏ ${symbol} khỏi watchlist`}>
                  <StarOff size={14} />
                </button>
              ) : (
                <small>Mặc định</small>
              )}
            </span>
          ))}
        </div>
      </section>

      <div className="toolbar">
        <label className="search-field" htmlFor="stock-search">
          <Search size={18} />
          <input
            id="stock-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Tìm mã, tên hoặc ngành"
          />
        </label>
        <button
          type="button"
          className={showWatchlistOnly ? 'segmented-button active' : 'segmented-button'}
          onClick={() => setShowWatchlistOnly((current) => !current)}
        >
          Watchlist
        </button>
      </div>

      <div className="content-grid">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Mã</th>
                <th>Ngành</th>
                <th>Điểm</th>
                <th>Cơ bản</th>
                <th>Kỹ thuật</th>
                <th>Nhãn</th>
                <th>Hành động</th>
                <th>Confidence</th>
                <th aria-label="Watchlist" />
              </tr>
            </thead>
            <tbody>
              {filteredRecommendations.map((item) => {
                const stock = findStock(stocksBySymbol, item.symbol);
                const inWatchlist = watchlist.hasSymbol(item.symbol);
                return (
                  <tr
                    key={item.symbol}
                    className={selectedSymbol === item.symbol ? 'selected-row' : undefined}
                    onClick={() => setSelectedSymbol(item.symbol)}
                  >
                    <td>
                      <button type="button" className="symbol-button">
                        <strong>{item.symbol}</strong>
                        <span>{stock?.name ?? 'Không rõ tên'}</span>
                      </button>
                    </td>
                    <td>{stock?.sector ?? 'N/A'}</td>
                    <td>{item.totalScore}</td>
                    <td>{item.fundamentalScore}</td>
                    <td>{item.technicalScore}</td>
                    <td>{item.softLabel}</td>
                    <td>
                      <span className={`action-pill action-pill--${actionTone(item.action)}`}>{item.action}</span>
                    </td>
                    <td>{Math.round(item.confidence * 100)}%</td>
                    <td>
                      {inWatchlist ? (
                        <button
                          type="button"
                          className="icon-button table-action"
                          onClick={(event) => {
                            event.stopPropagation();
                            watchlist.removeSymbol(item.symbol);
                          }}
                          aria-label={`Bỏ ${item.symbol} khỏi watchlist`}
                          disabled={!watchlist.isCustomSymbol(item.symbol)}
                        >
                          <Star size={16} />
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="icon-button table-action"
                          onClick={(event) => {
                            event.stopPropagation();
                            watchlist.addSymbol(item.symbol);
                          }}
                          aria-label={`Thêm ${item.symbol} vào watchlist`}
                        >
                          <StarOff size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredRecommendations.length === 0 ? (
            <p className="table-empty">Không có mã phù hợp.</p>
          ) : null}
        </div>

        {selected ? (
          <StockDetail
            symbol={selected.symbol}
            prices={dataset.pricesBySymbol[selected.symbol] ?? []}
            fundamentals={dataset.fundamentalsBySymbol[selected.symbol]}
            indicators={dataset.indicatorsBySymbol[selected.symbol]}
            recommendation={selected}
            onClose={() => setSelectedSymbol(null)}
          />
        ) : (
          <aside className="detail-panel detail-panel--empty">
            <span className="eyebrow">Chi tiết mã</span>
            <p>Chọn một mã trong bảng.</p>
          </aside>
        )}
      </div>
    </section>
  );
}
