import { useCallback, useEffect, useState } from 'react';
import { AppShell } from './components/AppShell';
import { StockDashboard } from './components/StockDashboard';
import { loadMarketDataset } from './data/loaders';
import type { MarketDataset } from './domain/types';

export default function App() {
  const [dataset, setDataset] = useState<MarketDataset | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshState, setRefreshState] = useState('Dữ liệu ETL tĩnh');

  const loadDataset = useCallback(() => {
    setError(null);
    setRefreshState('Đang tải dữ liệu');

    loadMarketDataset()
      .then((nextDataset) => {
        setDataset(nextDataset);
        setRefreshState('Dữ liệu ETL tĩnh');
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Không tải được dữ liệu');
        setRefreshState('Lỗi tải dữ liệu');
      });
  }, []);

  useEffect(() => {
    loadDataset();
  }, [loadDataset]);

  if (error) {
    return (
      <main className="empty-state">
        <h1>Lỗi dữ liệu</h1>
        <p>{error}</p>
        <button type="button" className="primary-button" onClick={loadDataset}>
          Tải lại
        </button>
      </main>
    );
  }

  if (!dataset) {
    return (
      <main className="empty-state">
        <h1>VN Stock Insight</h1>
        <p>Đang tải dữ liệu...</p>
      </main>
    );
  }

  return (
    <AppShell
      stockDashboard={
        <StockDashboard
          dataset={dataset}
          refreshState={refreshState}
          onRefresh={() => setRefreshState('Làm mới thủ công sẽ được bật ở bước tiếp theo')}
        />
      }
      organizationVisualizer={
        <section className="workspace">
          <span className="eyebrow">Trình trực quan quy trình đội AI</span>
          <h1>Quy trình đội AI</h1>
          <p>Phần trực quan chi tiết sẽ được triển khai ở bước tiếp theo.</p>
        </section>
      }
    />
  );
}
