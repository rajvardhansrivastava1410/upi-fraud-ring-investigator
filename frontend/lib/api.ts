import useSWR from 'swr';
import type { AlertGraph, AlertQueue, Decision } from './types';

// NEXT_PUBLIC_DEMO=1 serves fixtures from app/api/mock/* (no backend needed).
export const DEMO = process.env.NEXT_PUBLIC_DEMO === '1';
const base = DEMO ? '/api/mock' : '/api';

const fetcher = async (url: string) => {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return res.json();
};

export function useAlerts(k = 25) {
  return useSWR<AlertQueue>(`${base}/alerts?k=${k}`, fetcher);
}

export function useAlertGraph(alertId: string | null) {
  return useSWR<AlertGraph>(
    alertId ? `${base}/alerts/${alertId}/graph?hops=2` : null,
    fetcher,
  );
}

// Logs an analyst decision. In demo mode there is no backend, so it is a no-op
// and the decision is kept locally. The server stamps the time and analyst.
export async function postDecision(d: Decision): Promise<void> {
  if (DEMO) return;
  const res = await fetch(`/api/alerts/${d.alert_id}/decision`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ decision: d.decision, note: d.note }),
  });
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
}
