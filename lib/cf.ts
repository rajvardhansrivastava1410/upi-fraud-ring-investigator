import useSWR from 'swr';
import { DEMO } from '@/lib/api';
import type {
  CounterfactualRequest, CounterfactualResult, HypothesesResponse,
} from '@/lib/types';

const fetchJson = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
};

export function useHypotheses(alertId?: string) {
  const url = alertId
    ? DEMO
      ? `/api/mock/alerts/${alertId}/hypotheses`
      : `/api/alerts/${alertId}/hypotheses`
    : null;
  return useSWR<HypothesesResponse>(url, fetchJson);
}

export async function postCounterfactual(
  alertId: string,
  body: CounterfactualRequest,
): Promise<CounterfactualResult> {
  const res = await fetch(`/api/alerts/${alertId}/counterfactual`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}
