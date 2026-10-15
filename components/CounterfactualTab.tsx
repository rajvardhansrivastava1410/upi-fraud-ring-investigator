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
    if (!queue || queue.alerts.length === 0) return null;
    const exact = queue.alerts.find((a) => a.rank === queue.budget_k);
    if (exact) return exact.score;
    const sorted = [...queue.alerts].sort((a, b) => b.rank - a.rank);
    return sorted[0]?.score ?? null;
  }, [queue]);

  const req: CounterfactualRequest = useMemo(
    () => ({ remove_edges: removed, hypothesis: hypId ?? undefined, impute: imputed }),
    [removed, hypId, imputed],
  );

  const local = useMemo(
    () => computeLocal(alert, req, hyp?.hypotheses ?? [], hyp?.what_ifs ?? [], cutoff),
    [alert, req, hyp, cutoff],
  );

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
    <div className="space-y-4 p-3 font-mono text-xs text-white bg-black">
      <p className="text-[10px] text-slate-400">
        Simulate counterfactual graph removals to verify causal attribution of fraud rules.
      </p>

      {/* Result Card */}
      <section aria-live="polite" className="rounded-lg border border-green-500/50 bg-black p-3">
        <div className="flex items-baseline gap-4">
          <div>
            <div className="text-[10px] text-slate-400 uppercase">Current Score</div>
            <div className="text-sm font-bold text-white">{fmt(alert.score)}</div>
          </div>
          <div aria-hidden className="text-green-400 font-bold">➔</div>
          <div>
            <div className="text-[10px] text-green-400 uppercase font-bold">Simulated Score</div>
            <div className="text-xl font-black text-green-400">{fmt(result.new_score)}</div>
          </div>
          <div className="ml-auto text-right">
            <div className="text-[10px] text-slate-400 uppercase">Delta</div>
            <div className={`font-bold ${result.delta < 0 ? 'text-green-400' : 'text-red-400'}`}>
              {fmtDelta(result.delta)}
            </div>
          </div>
        </div>

        <div
          className={`mt-2 rounded px-2 py-1 text-[10px] font-bold ${
            nowBelow && !wasBelow
              ? 'border border-red-500 text-red-300 bg-red-950/40'
              : 'border border-green-500/40 text-green-300 bg-green-950/20'
          }`}
        >
          {cutoffMsg}
          {cutoff !== null && <span className="text-slate-400"> (Cutoff: {fmt(cutoff)})</span>}
        </div>

        {err && <div className="mt-2 text-[10px] text-red-400">{err}</div>}
        {changed && (
          <button
            type="button"
            className="mt-2 text-[10px] text-green-400 hover:text-white underline"
            onClick={() => { setRemoved([]); setHypId(null); setImputed([]); }}
          >
            Reset all assumptions
          </button>
        )}
      </section>

      {/* Edge removal */}
      <section>
        <h3 className="mb-1 text-xs font-black tracking-wider text-green-400 uppercase">
          EVIDENCE EDGE PERMUTATIONS
        </h3>
        <p className="mb-2 text-[10px] text-slate-400">
          Uncheck any edge to inspect counterfactual score change if that transfer never occurred:
        </p>
        {edgeIds.length === 0 ? (
          <p className="text-[10px] text-slate-500">No graph is available for this alert yet.</p>
        ) : (
          <ul className="space-y-1.5">
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
                  <label className="flex cursor-pointer items-start gap-2 rounded border border-slate-800 p-2 hover:border-green-500/50 bg-black">
                    <input
                      type="checkbox"
                      className="mt-0.5 rounded bg-black border-green-500/60 text-green-500"
                      checked={on}
                      onChange={() => toggleEdge(id)}
                    />
                    <span className={on ? 'text-white' : 'text-slate-600 line-through'}>
                      <span className="font-bold">{e ? e.type.replace(/_/g, ' ') : id}</span>
                      {e?.amount != null && (
                        <span className="text-green-400 font-bold"> · ₹{e.amount.toLocaleString('en-IN')}</span>
                      )}
                      {when && <span className="text-slate-500"> · {when}</span>}
                      <span className="block text-[10px] text-slate-400 mt-0.5">
                        {rules ? `Feeds: ${rules.join(', ')}` : 'Contextual Edge'}
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
        <h3 className="mb-1 text-xs font-black tracking-wider text-green-400 uppercase">
          BENIGN EXPLANATION HYPOTHESES
        </h3>
        <p className="mb-2 text-[10px] text-slate-400">
          Assume an alternative benign narrative to test if the score drops below threshold:
        </p>
        {!hyp ? (
          <p className="text-[10px] text-slate-500">Loading hypotheses…</p>
        ) : hyp.hypotheses.length === 0 ? (
          <p className="text-[10px] text-slate-500">No alternative benign hypotheses recorded for this alert.</p>
        ) : (
          <ul className="space-y-2">
            {hyp.hypotheses.map((h) => {
              const sel = hypId === h.id;
              return (
                <li key={h.id}>
                  <label
                    className={`block cursor-pointer rounded border p-2.5 transition-all ${
                      sel
                        ? 'border-green-400 bg-green-950/30 shadow-[0_0_10px_rgba(0,255,102,0.2)]'
                        : 'border-slate-800 bg-black hover:border-slate-600'
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
                      <span className="font-bold text-white">{h.name}</span>
                      <span className="ml-auto text-[10px] font-bold text-green-400">−{fmt(h.points)} pts</span>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-300">{h.summary}</p>
                    <p className="mt-1 text-[10px] text-slate-400">
                      <span className="text-slate-500 font-bold">Distinguishing audit: </span>
                      {h.check}
                    </p>
                  </label>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
