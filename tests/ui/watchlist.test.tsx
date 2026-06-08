import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useLocalWatchlist } from '../../src/hooks/useLocalWatchlist';

const STORAGE_KEY = 'vn-stock-insight.watchlist';

describe('useLocalWatchlist', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('includes normalized default and stored custom symbols', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([' vcb ', 'fpt', '***']));

    const { result } = renderHook(() => useLocalWatchlist(['fpt', 'acb']));

    expect(result.current.symbols).toEqual(['FPT', 'ACB', 'VCB']);
    expect(result.current.customSymbols).toEqual(['VCB']);
  });

  it('adds and removes custom symbols in localStorage while preserving defaults', () => {
    const { result } = renderHook(() => useLocalWatchlist(['FPT']));

    expect(result.current.symbols).toEqual(['FPT']);

    act(() => result.current.addSymbol(' v-c-b '));

    expect(result.current.symbols).toEqual(['FPT', 'VCB']);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')).toEqual(['VCB']);

    act(() => result.current.removeSymbol('VCB'));

    expect(result.current.symbols).toEqual(['FPT']);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')).toEqual([]);
  });
});
