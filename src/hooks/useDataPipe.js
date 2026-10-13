/**
 * HisabKitab 360 - useDataPipe (SWR Hook)
 * --------------------------------------
 * Stale-While-Revalidate data hook with:
 * - Instant rendering from L1 memory / IndexedDB
 * - Silent background revalidation
 * - Auto-revalidation on window focus and network reconnect
 * - Manual mutate / refresh capability
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { swrDataPipe } from '../services/swrDataPipe';

export function useDataPipe(key, fetcher, options = {}) {
  const {
    ttl = 300000,
    revalidateOnFocus = true,
    revalidateOnReconnect = true,
    enabled = true
  } = options;

  const [data, setData] = useState(null);
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState(null);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const loadData = useCallback(async (forceRefresh = false) => {
    if (!key || !enabled || !fetcherRef.current) return;
    setIsValidating(true);
    try {
      const response = await swrDataPipe.swrFetch(key, fetcherRef.current, {
        ttl,
        forceRefresh
      });
      setData(response.data);
      setError(null);
    } catch (err) {
      console.warn(`[useDataPipe] Error fetching ${key}:`, err);
      setError(err);
    } finally {
      setIsValidating(false);
    }
  }, [key, ttl, enabled]);

  // Initial fetch and subscription to updates
  useEffect(() => {
    if (!key || !enabled) return;

    loadData(false);

    // Subscribe to background broadcast changes
    const unsubscribe = swrDataPipe.subscribe(key, (freshData) => {
      setData(freshData);
    });

    // Auto-revalidate on focus
    const handleFocus = () => {
      if (revalidateOnFocus) {
        loadData(false);
      }
    };

    // Auto-revalidate on reconnect
    const handleOnline = () => {
      if (revalidateOnReconnect) {
        loadData(true);
      }
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('online', handleOnline);

    return () => {
      unsubscribe();
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('online', handleOnline);
    };
  }, [key, enabled, loadData, revalidateOnFocus, revalidateOnReconnect]);

  const mutate = useCallback((updater, shouldRevalidate = true) => {
    if (typeof updater === 'function') {
      setData((prev) => updater(prev));
    } else {
      setData(updater);
    }
    if (shouldRevalidate) {
      loadData(true);
    }
  }, [loadData]);

  return {
    data,
    isValidating,
    error,
    refresh: () => loadData(true),
    mutate
  };
}
