'use client';

import { useMemo } from 'react';
import { useAlerts, useAlertGraph } from '@/lib/api';
import { useTimeStore } from '@/lib/timeStore';
import {
  hiddenEdgeIds, indexAtOrBefore, pendingEdges, timePoints,
} from '@/lib/asof';
import { computeLocal } from '@/lib/counterfactual';

const fmtT = (ms: number) =>
  new Date(ms).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  });
const fmt = (n: number) => Number(n.toFixed(2)).toString();

export default function TimeSlider({ alertId }: { alertId: string }) {
  const { data: queue } = useAlerts();
  const { data: graph } = useAlertGraph(alertId);
  const mode = useTimeStore((s) => s.mode);
  const asOf = useTimeStore((s) => (s.alertId === alertId ? s.asOf : null));
  const setAsOf = useTimeStore((s) => s.setAsOf);
  const setMode = useTimeStore((s) => s.setMode);

  const alert = queue?.alerts.find((a) => a.id === alertId);
  const cutoff = queue
    ? queue.alerts.find((a) => a.rank === queue.budget_k)?.score ?? null
    : null;

  const points = useMemo(() => (graph ? timePoints(graph, mode) : []), [graph, mode]);
  const last = points.length - 1;
  const idx = asOf == null ? last : indexAtOrBefore(points, asOf);

  const hidden = useMemo(
    () => (graph && asOf != null ? hiddenEdgeIds(graph, asOf, mode) : []),
    [graph, asOf, mode],
  );
  const pending = useMemo(
    () => (graph && asOf != null && mode === 'ingest' ? pendingEdges(graph, asOf) : []),
    [graph, asOf, mode],
  );
  const asOfScore = useMemo(() => {
    if (!alert || asOf == null || mode !== 'ingest') return null;
    return computeLocal(alert, { remove_edges: hidden }, [], [], cutoff);
  }, [alert, asOf, mode, hidden, cutoff]);

  if (!graph || points.length === 0) {
    return (
      <div className="border-t border-slate-800 px-4 py-2 text-xs text-slate-500">
        Time replay unavailable: no graph for this alert yet.
      </div>
    );
  }

  const go = (i: number) => {
    const clamped = Math.min(last, Math.max(0, i));
    setAsOf(alertId, clamped >= last ? null : points[clamped]);
  };

  const total = graph.edges.length;
  const visible = total - hidden.length;
  const shownTime = points[idx];

  const pendingByType = new Map<string, number>();
  for (const e of pending) {
    const k = e.type.replace(/_/g, ' ');
    pendingByType.set(k, (pendingByType.get(k) ?? 0) + 1);
  }
  const pendingText = [...pendingByType.entries()]
    .map(([k, n]) => `${n} ${k}${n > 1 ? 's' : ''}`)
    .join(', ');

  const modeBtn = (m: 'ingest' | 'event', label: string) => (
    <button
      type="button"
      role="radio"
      aria-checked={mode === m}
      onClick={() => setMode(m)}
      className={`rounded px-2 py-1 text-xs ${
        mode === m
          ? 'bg-slate-700 text-amber-300'
          : 'text-slate-400 hover:bg-slate-800'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-2 border-t border-slate-800 px-4 py-3 text-sm text-slate-200">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-slate-400">Replay</span>
        <div role="radiogroup" aria-label="Time basis" className="flex gap-1">
          {modeBtn('ingest', 'What the analyst knew')}
          {modeBtn('event', 'When events happened')}
        </div>
        <span className="ml-auto text-xs text-slate-400" aria-live="polite">
          {asOf == null ? 'Latest' : `As of ${fmtT(shownTime)}`} · {visible} of {total} edges
        </span>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="Previous time step"
          disabled={idx <= 0}
          onClick={() => go(idx - 1)}
          className="rounded border border-slate-700 px-2 py-0.5 text-xs disabled:opacity-40"
        >
          ‹
        </button>
        <input
          type="range"
          min={0}
          max={last}
          step={1}
          value={idx}
          onChange={(e) => go(Number(e.target.value))}
          aria-label="Replay time"
          aria-valuetext={asOf == null ? 'Latest' : fmtT(shownTime)}
          className="flex-1 accent-amber-400"
        />
        <button
          type="button"
          aria-label="Next time step"
          disabled={idx >= last}
          onClick={() => go(idx + 1)}
          className="rounded border border-slate-700 px-2 py-0.5 text-xs disabled:opacity-40"
        >
          ›
        </button>
        <button
          type="button"
          onClick={() => go(last)}
          disabled={asOf == null}
          className="rounded border border-slate-700 px-2 py-0.5 text-xs disabled:opacity-40"
        >
          Latest
        </button>
      </div>

      <div className="flex justify-between text-[11px] text-slate-500">
        <span>{fmtT(points[0])}</span>
        <span>{fmtT(points[last])}</span>
      </div>

      {mode === 'event' && (
        <p className="text-xs text-slate-400">
          Event timeline: shows when things happened, regardless of when they were reported.
        </p>
      )}

      {mode === 'ingest' && asOf != null && pending.length > 0 && (
        <p className="rounded border border-amber-500/60 px-2 py-1 text-xs text-amber-300">
          {pending.length} event{pending.length > 1 ? 's' : ''} had already happened but had not
          been reported yet ({pendingText}).
        </p>
      )}

      {asOfScore && alert && (
        <p className="text-xs text-slate-300">
          Score from evidence known at this time:{' '}
          <span className="text-amber-300">{fmt(asOfScore.new_score)}</span>{' '}
          (current {fmt(alert.score)}).
          {asOfScore.below_cutoff && ' Below the review budget cutoff at this time.'}
          <span className="block text-slate-500">
            Demo estimate: drops the evidence that had not yet arrived. The backend&apos;s
            as-of score will replace this.
          </span>
        </p>
      )}
    </div>
  );
}
