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
        <button
          type="button"
          className={active === 'stocks' ? 'active' : undefined}
          onClick={() => setActive('stocks')}
        >
          Cổ phiếu
        </button>
        <button
          type="button"
          className={active === 'organization' ? 'active' : undefined}
          onClick={() => setActive('organization')}
        >
          Đội AI
        </button>
      </nav>
      <section className="main-pane">{active === 'stocks' ? stockDashboard : organizationVisualizer}</section>
    </main>
  );
}
