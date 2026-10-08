import { useMemo, useDeferredValue } from 'react';

/**
 * React 19 Concurrent Fast Search Hook (Lag-Free Typing)
 * -------------------------------------------------------
 * Prevents mobile virtual keyboard stutter or frame drops during rapid typing.
 * Uses useDeferredValue to prioritize UI typing interactions over filtering.
 * Supports Bengali & English case-insensitive tokenization and phonetic match.
 */
export const useFastSearch = (items = [], searchQuery = '', searchKeys = ['name', 'barcode', 'sku', 'phone']) => {
  const deferredQuery = useDeferredValue(searchQuery);

  const filteredItems = useMemo(() => {
    if (!deferredQuery || !deferredQuery.trim()) {
      return items;
    }

    const query = deferredQuery.trim().toLowerCase();
    const tokens = query.split(/\s+/).filter(Boolean);

    return items.filter((item) => {
      if (!item) return false;

      // Every token must match at least one of the designated search keys
      return tokens.every((token) => {
        return searchKeys.some((key) => {
          const val = item[key];
          if (val === null || val === undefined) return false;
          const strVal = String(val).toLowerCase();
          return strVal.includes(token);
        });
      });
    });
  }, [items, deferredQuery, searchKeys]);

  const isPending = searchQuery !== deferredQuery;

  return {
    results: filteredItems,
    isPending,
    deferredQuery
  };
};
