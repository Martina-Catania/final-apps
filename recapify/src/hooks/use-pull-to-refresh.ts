import { useCallback, useEffect, useRef, useState } from "react";

type UsePullToRefreshOptions = {
  minDurationMs?: number;
};

const DEFAULT_MIN_DURATION_MS = 300;

function wait(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function usePullToRefresh(
  refreshAction: () => void | Promise<void>,
  options: UsePullToRefreshOptions = {},
) {
  const { minDurationMs = DEFAULT_MIN_DURATION_MS } = options;
  const [refreshing, setRefreshing] = useState(false);
  const isMountedRef = useRef(true);
  const isRefreshingRef = useRef(false);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const onRefresh = useCallback(async () => {
    if (isRefreshingRef.current) {
      return;
    }

    const startedAt = Date.now();
    isRefreshingRef.current = true;

    if (isMountedRef.current) {
      setRefreshing(true);
    }

    try {
      await refreshAction();
    } finally {
      const elapsed = Date.now() - startedAt;
      const remainingMs = minDurationMs - elapsed;

      if (remainingMs > 0) {
        await wait(remainingMs);
      }

      isRefreshingRef.current = false;

      if (isMountedRef.current) {
        setRefreshing(false);
      }
    }
  }, [minDurationMs, refreshAction]);

  return {
    refreshing,
    onRefresh,
  };
}
