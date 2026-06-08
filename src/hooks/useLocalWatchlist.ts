import { useCallback, useMemo, useState } from 'react';

const STORAGE_KEY = 'vn-stock-insight.watchlist';

function normalizeSymbol(symbol: string): string {
  return symbol.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
}

function uniqueSymbols(symbols: string[]): string[] {
  return Array.from(new Set(symbols.map(normalizeSymbol).filter(Boolean)));
}

function readStoredSymbols(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return uniqueSymbols(parsed.filter((value): value is string => typeof value === 'string'));
  } catch {
    return [];
  }
}

export interface LocalWatchlist {
  symbols: string[];
  customSymbols: string[];
  addSymbol: (symbol: string) => void;
  removeSymbol: (symbol: string) => void;
  hasSymbol: (symbol: string) => boolean;
  isCustomSymbol: (symbol: string) => boolean;
}

export function useLocalWatchlist(defaultSymbols: string[]): LocalWatchlist {
  const [customSymbols, setCustomSymbols] = useState<string[]>(readStoredSymbols);

  const normalizedDefaults = useMemo(() => uniqueSymbols(defaultSymbols), [defaultSymbols]);
  const normalizedCustomSymbols = useMemo(
    () => customSymbols.filter((symbol) => !normalizedDefaults.includes(symbol)),
    [customSymbols, normalizedDefaults],
  );

  const persist = useCallback(
    (nextSymbols: string[]) => {
      const normalized = uniqueSymbols(nextSymbols).filter((symbol) => !normalizedDefaults.includes(symbol));
      setCustomSymbols(normalized);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    },
    [normalizedDefaults],
  );

  const symbols = useMemo(
    () => uniqueSymbols([...normalizedDefaults, ...normalizedCustomSymbols]),
    [normalizedCustomSymbols, normalizedDefaults],
  );

  const addSymbol = useCallback(
    (symbol: string) => {
      const normalized = normalizeSymbol(symbol);
      if (!normalized) return;
      persist([...normalizedCustomSymbols, normalized]);
    },
    [normalizedCustomSymbols, persist],
  );

  const removeSymbol = useCallback(
    (symbol: string) => {
      const normalized = normalizeSymbol(symbol);
      persist(normalizedCustomSymbols.filter((item) => item !== normalized));
    },
    [normalizedCustomSymbols, persist],
  );

  const hasSymbol = useCallback(
    (symbol: string) => symbols.includes(normalizeSymbol(symbol)),
    [symbols],
  );

  const isCustomSymbol = useCallback(
    (symbol: string) => normalizedCustomSymbols.includes(normalizeSymbol(symbol)),
    [normalizedCustomSymbols],
  );

  return {
    symbols,
    customSymbols: normalizedCustomSymbols,
    addSymbol,
    removeSymbol,
    hasSymbol,
    isCustomSymbol,
  };
}
