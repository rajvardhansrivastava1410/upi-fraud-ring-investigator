'use client';

import { useState } from 'react';
import GraphView from '@/components/GraphView';
import TimeSlider from '@/components/TimeSlider';
import LoadingState from '@/components/LoadingState';
import EmptyState from '@/components/EmptyState';
import { useAlertGraphAsOf } from '@/lib/useAlertGraphAsOf';
import { describeEdge, fmtDuration, fmtTime } from '@/lib/format';
import { useStore } from '@/lib/store';

const LEGEND = [
  { symbol: '●', label: 'Account' },
  { symbol: '◆', label: 'Device' },
  { symbol: '▬', label: 'Merchant' },
  { symbol: '▲', label: 'Complaint' },
];

export default function GraphPane() {
  const alertId = useStore((s) => s.selectedAlertId);
  const selectedEdgeId = useStore((s) => s.selectedEdgeId);

  // useAlertGraphAsOf returns time-filtered graph while preserving the full graph for the slider.
  const { data: graph, error, isLoading } = useAlertGraphAsOf(alertId ?? '');

  const [layoutKey, setLayoutKey] = useState(0);
  const [showIncomplete, setShowIncomplete] = useState(true);
  const [minAmount, setMinAmount] = useState(0);

  if (!alertId) {
    return <EmptyState icon="graph" title="No alert selected" description="Select an alert from the queue to explore its transaction graph." />;
  }
  if (isLoading) return <LoadingState variant="graph" label={`Loading graph for ${alertId}…`} />;
  if (error || !graph) {
    return (
      <EmptyState
        icon="search"
        title={`No graph for ${alertId}`}
        description="The demo fixtures include A-014 and A-051. Other alerts show a generic fallback."
      />
    );
  }

  const labelOf = (id: string) => graph.nodes.find((n) => n.id === id)?.label ?? id;
  const selected = graph.edges.find((e) => e.id === selectedEdgeId);
  const lagMs = selected ? Date.parse(selected.ingest_time) - Date.parse(selected.event_time) : 0;

  // Filter edges based on control settings
  const filteredEdges = graph.edges.filter(edge => {
    if (!showIncomplete && edge.incomplete) return false;
    if (edge.amount && edge.amount < minAmount) return false;
    return true;
  });

  const filteredGraph = { ...graph, edges: filteredEdges };

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-slate-800 px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-100">Graph explorer · {alertId}</h2>
            <p className="text-xs text-slate-400">
              {filteredGraph.nodes.length} nodes, {filteredGraph.edges.length} edges. Amber edges are the evidence
              path; grey edges are context.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setLayoutKey((k) => k + 1)}
            className="rounded border border-slate-700 px-2.5 py-1 text-xs text-slate-200 hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-amber-400"
          >
            Reset view
          </button>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-4 text-xs mt-2 p-2 bg-slate-900 rounded-md border border-slate-800">
          <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={showIncomplete}
              onChange={(e) => setShowIncomplete(e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-amber-500 focus:ring-amber-500"
            />
            Show Incomplete/Missing Edges
          </label>
          <label className="flex items-center gap-2 text-slate-300">
            Min Amount: ₹
            <input
              type="number"
              step="1000"
              value={minAmount}
              onChange={(e) => setMinAmount(Number(e.target.value))}
              className="bg-slate-950 border border-slate-700 rounded px-2 py-1 w-24 focus:border-amber-500 outline-none"
            />
          </label>
        </div>
      </div>

      <div className="relative min-h-0 flex-1">
        <GraphView graph={filteredGraph} layoutKey={layoutKey} />
        <ul className="absolute right-3 top-2 flex gap-3 rounded bg-slate-900/90 px-2.5 py-1.5 text-[11px] text-slate-300">
          {LEGEND.map((l) => (
            <li key={l.label}>
              <span className="mr-1 text-slate-400">{l.symbol}</span>
              {l.label}
            </li>
          ))}
        </ul>
      </div>

      {/* Time Slider */}
      <TimeSlider alertId={alertId} />

      <div className="border-t border-slate-800 px-4 py-2 text-xs" aria-live="polite">
        {selected ? (
          <>
            <p className="text-slate-100">
              {selected.id} · {describeEdge(selected, labelOf)}
            </p>
            <p className="text-slate-400">
              Event {fmtTime(selected.event_time)} · Ingested {fmtTime(selected.ingest_time)}
              {lagMs > 3_600_000 && (
                <span className="text-amber-300"> · arrived {fmtDuration(lagMs)} after the event</span>
              )}
              {selected.incomplete && <span className="text-amber-300"> · incomplete record</span>}
            </p>
          </>
        ) : (
          <p className="text-slate-500">Click an edge to see its event and ingest times.</p>
        )}
      </div>
    </div>
  );
}