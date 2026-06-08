import { useCallback, useEffect, useState } from 'react';
import { AppShell } from './components/AppShell';
import { OrganizationVisualizer } from './components/OrganizationVisualizer';
import { StockDashboard } from './components/StockDashboard';
import { loadMarketDataset } from './data/loaders';
import { manualRefreshWithFallback } from './data/manualRefresh';
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

  async function handleRefresh() {
    if (!dataset) return;

    setRefreshState('Đang chạy manual refresh...');

    try {
      const result = await manualRefreshWithFallback(dataset);
      setDataset(result.dataset);
      setRefreshState(result.state);
    } catch {
      setRefreshState('Manual refresh không khả dụng; tiếp tục dùng dữ liệu ETL tĩnh.');
    }
  }

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
          onRefresh={handleRefresh}
        />
      }
      organizationVisualizer={<OrganizationVisualizer />}
    />
  );
}
