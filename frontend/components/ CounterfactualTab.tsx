'use client';

import { useEffect, useMemo, useState } from 'react';
import type {
  Alert, CounterfactualRequest, CounterfactualResult,
} from '@/lib/types';
import { DEMO, useAlerts, useAlertGraph } from '@/lib/api';
import { useHypotheses, postCounterfactual } from '@/lib/cf';
import { computeLocal } from '@/lib/counterfactual';
import { ruleLabel } from '@/lib/format';

const fmt = (n: number) => Number(n.toFixed(2)).toString();
const fmtDelta = (n: number) => (n > 0 ? `+${fmt(n)}` : fmt(n));

export default function CounterfactualTab({ alert }: { alert: Alert }) {
  const { data: queue } = useAlerts();
  const { data: graph } = useAlertGraph(alert.id);
  const { data: hyp } = useHypotheses(alert.id);

  const [removed, setRemoved] = useState<string[]>([]);
  const [hypId, setHypId] = useState<string | null>(null);
  const [imputed, setImputed] = useState<string[]>([]);
  const [remote, setRemote] = useState<CounterfactualResult | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const cutoff = useMemo(() => {
    if (!queue) return null;
    return queue.alerts.find((a) => a.rank === queue.budget_k)?.score ?? null;
  }, [queue]);

  const req: CounterfactualRequest = useMemo(
    () => ({ remove_edges: removed, hypothesis: hypId ?? undefined, impute: imputed }),
    [removed, hypId, imputed],
  );

  const local = useMemo(
    () => computeLocal(alert, req, hyp?.hypotheses ?? [], hyp?.what_ifs ?? [], cutoff),
    [alert, req, hyp, cutoff],
  );

  // Real mode: debounced call to the backend. Demo mode: local only.
  useEffect(() => {
    if (DEMO) return;
    let cancelled = false;
    const t = setTimeout(async () => {
      try {
        const r = await postCounterfactual(alert.id, req);
        if (!cancelled) { setRemote(r); setErr(null); }
      } catch {
        if (!cancelled) setErr('Could not recompute. Showing the last available result.');
      }
    }, 300);
    return () => { cancelled = true; clearTimeout(t); };
  }, [alert.id, req]);

  const result = DEMO ? local : remote ?? local;

  // Edges that can be toggled: evidence path first, then any other edge a rule cites.
  const edgeRules = useMemo(() => {
    const m = new Map<string, string[]>();
    for (const r of alert.reasons) {
      for (const id of r.edge_ids ?? []) {
        m.set(id, [...(m.get(id) ?? []), ruleLabel(r.rule)]);
      }
    }
    return m;
  }, [alert]);

  const edgeIds = useMemo(() => {
    const ordered = [...(graph?.evidence_path ?? [])];
    for (const id of edgeRules.keys()) if (!ordered.includes(id)) ordered.push(id);
    return ordered;
  }, [graph, edgeRules]);

  const edgeById = useMemo(
    () => new Map((graph?.edges ?? []).map((e) => [e.id, e])),
    [graph],
  );

  const toggleEdge = (id: string) =>
    setRemoved((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  const toggleImpute = (id: string) =>
    setImputed((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));

  const wasBelow = cutoff !== null && alert.score < cutoff;
  const nowBelow = result.below_cutoff;
  let cutoffMsg = 'Stays within the review budget.';
  if (cutoff === null) cutoffMsg = 'Budget cutoff unavailable.';
  else if (!wasBelow && nowBelow) cutoffMsg = 'Would fall below the review budget cutoff.';
  else if (wasBelow && nowBelow) cutoffMsg = 'Already below the review budget cutoff.';
  else if (wasBelow && !nowBelow) cutoffMsg = 'Would rise into the review budget.';

  const changed = removed.length > 0 || hypId !== null || imputed.length > 0;

  return (
    <div className="space-y-5 p-3 text-sm text-slate-200">
      <p className="text-xs text-slate-400">
        Synthetic scenario. This panel shows how the proposed explanation changes under
        different assumptions. It does not change the stored score, rank or decision log.
      </p>

      {/* Result */}
      <section aria-live="polite" className="rounded border border-slate-700 bg-slate-900 p-3">
        <div className="flex items-baseline gap-4">
          <div>
            <div className="text-xs text-slate-400">Current score</div>
            <div className="text-lg">{fmt(alert.score)}</div>
          </div>
          <div aria-hidden className="text-slate-500">→</div>
          <div>
            <div className="text-xs text-slate-400">Under these assumptions</div>
            <div className="text-2xl font-semibold text-amber-400">{fmt(result.new_score)}</div>
          </div>
          <div className="ml-auto text-right">
            <div className="text-xs text-slate-400">Change</div>
            <div>{fmtDelta(result.delta)}</div>
          </div>
        </div>
        <div
          className={`mt-2 rounded px-2 py-1 text-xs ${
            nowBelow && !wasBelow
              ? 'border border-amber-500 text-amber-300'
              : 'border border-slate-700 text-slate-300'
          }`}
        >
          {cutoffMsg}
          {cutoff !== null && <span className="text-slate-500"> (cutoff score {fmt(cutoff)})</span>}
        </div>
        {err && <div className="mt-2 text-xs text-amber-300">{err}</div>}
        {changed && (
          <button
            type="button"
            className="mt-2 text-xs text-slate-400 underline"
            onClick={() => { setRemoved([]); setHypId(null); setImputed([]); }}
          >
            Reset assumptions
          </button>
        )}
      </section>

      {/* Edge removal */}
      <section>
        <h3 className="mb-1 font-medium">Evidence edges</h3>
        <p className="mb-2 text-xs text-slate-400">
          Uncheck an edge to see how the score changes without it.
        </p>
        {edgeIds.length === 0 ? (
          <p className="text-xs text-slate-500">No graph is available for this alert yet.</p>
        ) : (
          <ul className="space-y-1">
            {edgeIds.map((id) => {
              const e = edgeById.get(id);
              const rules = edgeRules.get(id);
              const on = !removed.includes(id);
              const when = e
                ? new Date(e.event_time).toLocaleString('en-IN', {
                    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                  })
                : '';
              return (
                <li key={id}>
                  <label className="flex cursor-pointer items-start gap-2 rounded px-1 py-1 hover:bg-slate-800">
                    <input
                      type="checkbox"
                      className="mt-0.5"
                      checked={on}
                      onChange={() => toggleEdge(id)}
                    />
                    <span className={on ? '' : 'text-slate-500 line-through'}>
                      {e ? e.type.replace(/_/g, ' ') : id}
                      {e?.amount != null && ` · ₹${e.amount.toLocaleString('en-IN')}`}
                      {when && <span className="text-slate-500"> · {when}</span>}
                      <span className="block text-xs text-slate-500">
                        {rules ? `Feeds: ${rules.join(', ')}` : 'Not tied to a scoring term'}
                      </span>
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Benign hypotheses */}
      <section>
        <h3 className="mb-1 font-medium">Benign explanations that could fit</h3>
        <p className="mb-2 text-xs text-slate-400">
          Select one to assume it holds. The check shows what would tell it apart from
          coordinated behaviour.
        </p>
        {!hyp ? (
          <p className="text-xs text-slate-500">Loading…</p>
        ) : hyp.hypotheses.length === 0 ? (
          <p className="text-xs text-slate-500">No benign hypotheses recorded for this alert.</p>
        ) : (
          <ul className="space-y-2">
            {hyp.hypotheses.map((h) => {
              const sel = hypId === h.id;
              return (
                <li key={h.id}>
                  <label
                    className={`block cursor-pointer rounded border p-2 ${
                      sel ? 'border-amber-500 bg-slate-800' : 'border-slate-700 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name={`hyp-${alert.id}`}
                        checked={sel}
                        onChange={() => setHypId(h.id)}
                        onClick={() => sel && setHypId(null)}
                      />
                      <span className="font-medium">{h.name}</span>
                      <span className="ml-auto text-xs text-slate-400">−{fmt(h.points)}</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-300">{h.summary}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      <span className="text-slate-500">Distinguishing check: </span>
                      {h.check}
                    </p>
                  </label>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Missing-data what-ifs */}
      {hyp && hyp.what_ifs.length > 0 && (
        <section>
          <h3 className="mb-1 font-medium">If missing records turned up</h3>
          <ul className="space-y-1">
            {hyp.what_ifs.map((w) => (
              <li key={w.id}>
                <label className="flex cursor-pointer items-start gap-2 rounded px-1 py-1 hover:bg-slate-800">
                  <input
                    type="checkbox"
                    className="mt-0.5"
                    checked={imputed.includes(w.id)}
                    onChange={() => toggleImpute(w.id)}
                  />
                  <span>
                    {w.text}
                    <span className="ml-2 text-xs text-slate-400">{fmtDelta(w.points)}</span>
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
