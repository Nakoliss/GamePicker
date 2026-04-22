import { useEffect, useRef, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

export function usePoll<T>(
  fetcher: () => Promise<T>,
  intervalMs: number,
  enabled: boolean
): { data: T | null; error: string | null; refresh: () => void } {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isInflight = useRef(false);
  const appState = useRef<AppStateStatus>(AppState.currentState);

  const runFetch = async () => {
    if (isInflight.current) return;
    isInflight.current = true;
    try {
      const result = await fetcher();
      setData(result);
      setError(null);
    } catch (e: any) {
      setError(e?.message ?? 'Error');
    } finally {
      isInflight.current = false;
    }
  };

  const start = () => {
    runFetch();
    intervalRef.current = setInterval(runFetch, intervalMs);
  };

  const stop = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  useEffect(() => {
    if (!enabled) { stop(); return; }
    start();

    const sub = AppState.addEventListener('change', (next) => {
      if (appState.current !== 'active' && next === 'active') start();
      if (next === 'background' || next === 'inactive') stop();
      appState.current = next;
    });

    return () => {
      stop();
      sub.remove();
    };
  }, [enabled, intervalMs]);

  return { data, error, refresh: runFetch };
}
