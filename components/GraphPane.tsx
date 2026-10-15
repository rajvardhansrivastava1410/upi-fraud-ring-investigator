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
  { symbol: '●', label: 'Account', color: 'text-green-400' },
  { symbol: '◆', label: 'Device', color: 'text-white' },
  { symbol: '▬', label: 'Merchant', color: 'text-green-400' },
  { symbol: '▲', label: 'Complaint', color: 'text-red-400' },
  { symbol: '━', label: 'Fraud Path', color: 'text-red-500 font-bold' },
];

export default function GraphPane() {
  const alertId = useStore((s) => s.selectedAlertId);
  const selectedEdgeId = useStore((s) => s.selectedEdgeId);

  const { data: graph, error, isLoading } = useAlertGraphAsOf(alertId ?? '');

  const [layoutKey, setLayoutKey] = useState(0);
  const [showIncomplete, setShowIncomplete] = useState(true);
  const [minAmount, setMinAmount] = useState(0);

  if (!alertId) {
    return (
      <EmptyState
        icon="graph"
        title="No alert selected"
        description="Select an alert from the queue to explore its transaction graph."
      />
    );
  }
  if (isLoading) return <LoadingState variant="graph" label={`Loading graph for ${alertId}…`} />;
  if (error || !graph) {
    return (
      <EmptyState
        icon="search"
        title={`No graph for ${alertId}`}
        description="Select another alert from the queue to explore its transaction graph."
      />
    );
  }

  const labelOf = (id: string) => graph.nodes.find((n) => n.id === id)?.label ?? id;
  const selected = graph.edges.find((e) => e.id === selectedEdgeId);
  const lagMs = selected ? Date.parse(selected.ingest_time) - Date.parse(selected.event_time) : 0;

  // Filter edges based on control settings
  const filteredEdges = graph.edges.filter((edge) => {
    if (!showIncomplete && edge.incomplete) return false;
    if (edge.amount && edge.amount < minAmount) return false;
    return true;
  });

  const filteredGraph = { ...graph, edges: filteredEdges };

  return (
    <div className="flex h-full flex-col bg-black text-white font-mono select-none">
      {/* Header Bar */}
      <div className="border-b border-green-500/40 px-4 py-3 bg-black">
        <div className="flex items-center justify-between mb-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-ping" />
              <h2 className="text-xs font-black tracking-widest text-white uppercase">
                GRAPH TOPOLOGY EXPLORER · {alertId}
              </h2>
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">
              {filteredGraph.nodes.length} nodes, {filteredGraph.edges.length} edges ·{' '}
              <span className="text-red-400 font-bold">Crimson edges</span> are fraud evidence;{' '}
              <span className="text-green-400 font-bold">Green edges</span> are verified flows.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setLayoutKey((k) => k + 1)}
            className="rounded border border-green-500/60 bg-black px-2.5 py-1 text-[10px] font-bold text-green-300 hover:bg-green-950 transition-colors"
          >
            ↺ Reset View
          </button>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-4 text-[10px] mt-2 p-2 bg-black rounded border border-green-500/30">
          <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={showIncomplete}
              onChange={(e) => setShowIncomplete(e.target.checked)}
              className="rounded bg-black border-green-500/60 text-green-500 focus:ring-0"
            />
            Show Incomplete Edges
          </label>
          <label className="flex items-center gap-2 text-slate-300">
            Min Amount: ₹
            <input
              type="number"
              step="1000"
              value={minAmount}
              onChange={(e) => setMinAmount(Number(e.target.value))}
              className="bg-black border border-green-500/50 rounded px-2 py-0.5 w-24 text-white focus:border-green-400 outline-none"
            />
          </label>
        </div>
      </div>

      {/* Main Cytoscape Graph Canvas */}
      <div className="relative min-h-[350px] flex-1 bg-black">
        <GraphView graph={filteredGraph} layoutKey={layoutKey} />
        {/* Floating Legend */}
        <ul className="absolute right-3 top-2 flex items-center gap-3 rounded bg-black/95 border border-green-500/40 px-2.5 py-1 text-[10px] text-white backdrop-blur-md shadow-[0_0_15px_rgba(0,0,0,0.8)]">
          {LEGEND.map((l) => (
            <li key={l.label} className="flex items-center gap-1">
              <span className={l.color}>{l.symbol}</span>
              <span>{l.label}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Time Slider */}
      <TimeSlider alertId={alertId} />

      {/* Edge Inspection Status Bar */}
      <div className="border-t border-green-500/30 px-4 py-2 text-[10px] bg-black" aria-live="polite">
        {selected ? (
          <div className="flex items-center justify-between">
            <span className="text-white font-bold">
              TX: {selected.id} · {describeEdge(selected, labelOf)}
            </span>
            <span className="text-slate-400">
              Event {fmtTime(selected.event_time)} · Ingested {fmtTime(selected.ingest_time)}
              {lagMs > 3_600_000 && (
                <span className="text-red-400 font-bold"> · Arrived {fmtDuration(lagMs)} late</span>
              )}
            </span>
          </div>
        ) : (
          <p className="text-slate-500">CLICK ANY DIRECTED EDGE TO INSPECT SETTLEMENT & INGESTION TELEMETRY</p>
        )}
      </div>
    </div>
  );
}