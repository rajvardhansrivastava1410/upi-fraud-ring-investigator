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
      <div className="border-t border-green-500/30 px-4 py-2 text-xs text-slate-500 font-mono bg-black">
        Time replay unavailable for this alert.
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
      className={`rounded px-2 py-0.5 text-[10px] font-bold transition-colors ${
        mode === m
          ? 'bg-green-950 text-green-300 border border-green-500'
          : 'text-slate-400 hover:text-white border border-transparent'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-2 border-t border-green-500/30 px-4 py-2.5 text-xs text-white font-mono bg-black">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[10px] font-bold text-green-400 uppercase">TIMELINE REPLAY:</span>
        <div role="radiogroup" aria-label="Time basis" className="flex gap-1">
          {modeBtn('ingest', 'Analyst Ingest Knowledge')}
          {modeBtn('event', 'Real Event Time')}
        </div>
        <span className="ml-auto text-[10px] text-slate-400" aria-live="polite">
          {asOf == null ? '⚡ LATEST' : `AS OF ${fmtT(shownTime)}`} · {visible} of {total} edges
        </span>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="Previous time step"
          disabled={idx <= 0}
          onClick={() => go(idx - 1)}
          className="rounded border border-green-500/50 bg-black px-2 py-0.5 text-xs text-green-300 hover:bg-green-950 disabled:opacity-30"
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
          className="flex-1 accent-green-400"
        />
        <button
          type="button"
          aria-label="Next time step"
          disabled={idx >= last}
          onClick={() => go(idx + 1)}
          className="rounded border border-green-500/50 bg-black px-2 py-0.5 text-xs text-green-300 hover:bg-green-950 disabled:opacity-30"
        >
          ›
        </button>
        <button
          type="button"
          onClick={() => go(last)}
          disabled={asOf == null}
          className="rounded border border-green-500/50 bg-black px-2 py-0.5 text-[10px] font-bold text-green-300 hover:bg-green-950 disabled:opacity-30"
        >
          Latest
        </button>
      </div>

      {asOfScore && (
        <div className="text-[10px] text-green-300 border-t border-slate-900 pt-1 flex items-center justify-between">
          <span>
            Simulated score at this time: <strong className="text-white">{fmt(asOfScore.new_score)}</strong> ({asOfScore.delta > 0 ? `+${fmt(asOfScore.delta)}` : fmt(asOfScore.delta)})
          </span>
          {pendingText && (
            <span className="text-red-400 font-bold">⚠️ Pending ingestion: {pendingText}</span>
          )}
        </div>
      )}
    </div>
  );
}
