import { useMemo } from 'react';
import { useAlertGraph } from '@/lib/api';
import { filterGraph } from '@/lib/asof';
import { useTimeStore } from '@/lib/timeStore';

/**
 * Drop-in replacement for useAlertGraph in the graph pane.
 * Returns the same shape, but `data` only contains what was visible at the
 * chosen time. `full` is the unfiltered graph.
 */
export function useAlertGraphAsOf(alertId: string) {
  const res = useAlertGraph(alertId);
  const asOf = useTimeStore((s) => (s.alertId === alertId ? s.asOf : null));
  const mode = useTimeStore((s) => s.mode);

  const data = useMemo(
    () => (res.data ? filterGraph(res.data, asOf, mode) : res.data),
    [res.data, asOf, mode],
  );

  return { ...res, data, full: res.data };
}