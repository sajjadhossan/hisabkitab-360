/**
 * HisabKitab 360 - useOptimisticAction Hook
 * -----------------------------------------
 * React hook to wrap mutations with instantaneous UI feedback and graceful rollbacks.
 */

import { useState, useCallback } from 'react';
import { optimisticUiService } from '../services/optimisticUiService';

export function useOptimisticAction() {
  const [isPending, setIsPending] = useState(false);
  const [lastError, setLastError] = useState(null);

  const execute = useCallback(async ({
    type = 'ACTION',
    applyOptimistic,
    commitAsync,
    rollback,
    onSuccess,
    onError
  }) => {
    setIsPending(true);
    setLastError(null);

    const outcome = await optimisticUiService.runMutation({
      type,
      applyOptimistic,
      commitAsync,
      rollback,
      onSuccess: (res) => {
        setIsPending(false);
        if (onSuccess) onSuccess(res);
      },
      onError: (err) => {
        setIsPending(false);
        setLastError(err);
        if (onError) onError(err);
      }
    });

    return outcome;
  }, []);

  return { execute, isPending, lastError };
}
