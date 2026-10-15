'use client';

import { useMemo, useState } from 'react';
import { useAlertGraph, useAlerts } from '@/lib/api';
import { describeEdge, fmtDuration, fmtSigned, fmtTime, ruleLabel } from '@/lib/format';
import { useStore } from '@/lib/store';
import type { Alert } from '@/lib/types';
import DecisionTab from '@/components/DecisionTab';
import CounterfactualTab from '@/components/CounterfactualTab';

type Tab = 'evidence' | 'counterfactual' | 'decision';
const TABS: { id: Tab; label: string }[] = [
  { id: 'evidence', label: '⚡ EVIDENCE' },
  { id: 'counterfactual', label: '🔮 COUNTERFACTUAL' },
  { id: 'decision', label: '⚖️ DECISION' },
];

function ScoreBreakdown({ alert }: { alert: Alert }) {
  const terms = [
    ...alert.reasons.map((r) => ({ key: r.rule, label: ruleLabel(r.rule), points: r.points })),
    ...alert.benign_discounts
      .filter((d) => d.points !== 0)
      .map((d) => ({ key: d.name, label: d.name.replace(/_/g, ' '), points: d.points })),
  ];
  const max = Math.max(...terms.map((t) => Math.abs(t.points)), 0.01);

  return (
    <section aria-label="Score breakdown" className="px-4 py-3 border-b border-green-500/20 bg-black">
      <h3 className="mb-2 text-xs font-black tracking-wider text-green-400 uppercase">
        SCORE BREAKDOWN & ATTRIBUTION
      </h3>
      <ul className="space-y-1.5 font-mono">
        {terms.map((t) => (
          <li key={t.key} className="grid grid-cols-[160px_1fr_44px] items-center gap-2 text-[11px]">
            <span className="truncate text-slate-300 font-bold" title={t.label}>
              {t.label}
            </span>
            <div className="h-2 rounded-full bg-slate-900 border border-slate-800">
              <div
                className={`h-full rounded-full ${
                  t.points >= 0
                    ? 'bg-red-500 shadow-[0_0_8px_rgba(255,0,63,0.8)]'
                    : 'bg-green-400 shadow-[0_0_8px_rgba(0,255,102,0.8)]'
                }`}
                style={{ width: `${(Math.abs(t.points) / max) * 100}%` }}
              />
            </div>
            <span
              className={`text-right tabular-nums font-bold ${
                t.points >= 0 ? 'text-red-400' : 'text-green-400'
              }`}
            >
              {fmtSigned(t.points)}
            </span>
          </li>
        ))}
      </ul>
      <div className="mt-2.5 flex justify-between border-t border-slate-800 pt-2 text-xs font-mono font-bold">
        <span className="text-slate-400">TOTAL RISK ATTRIBUTION:</span>
        <span className="tabular-nums text-white text-sm">
          {alert.score.toFixed(2)}
        </span>
      </div>
    </section>
  );
}

function EvidenceTab({ alert }: { alert: Alert }) {
  const { data: graph, isLoading, error } = useAlertGraph(alert.id);
  const selectedEdgeId = useStore((s) => s.selectedEdgeId);
  const selectEdge = useStore((s) => s.selectEdge);

  const steps = useMemo(() => {
    if (!graph) return [];
    const edgeById = new Map(graph.edges.map((e) => [e.id, e]));
    return graph.evidence_path.flatMap((id) => {
      const edge = edgeById.get(id);
      return edge ? [edge] : [];
    });
  }, [graph]);

  const labelOf = (id: string) => graph?.nodes.find((n) => n.id === id)?.label ?? id;

  return (
    <div className="overflow-y-auto font-mono bg-black text-white">
      {alert.missing_data.length > 0 && (
        <div className="mx-4 mt-3 rounded border border-red-500/60 bg-red-950/30 px-3 py-2 text-xs text-red-300">
          <p className="mb-1 font-bold">⚠️ INCOMPLETE DATA: CONFIDENCE BAND WIDENED</p>
          <ul className="list-disc space-y-0.5 pl-4 text-[10px]">
            {alert.missing_data.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        </div>
      )}

      <ScoreBreakdown alert={alert} />

      <section aria-label="Evidence timeline" className="px-4 py-3">
        <h3 className="mb-2 text-xs font-black tracking-wider text-green-400 uppercase">
          EVIDENCE CORRIDOR PATH ({steps.length} HOPS)
        </h3>
        {isLoading && <p className="text-xs text-slate-400">Loading evidence timeline…</p>}
        {error && (
          <p className="text-xs text-red-400">No evidence path available for this alert in demo mode.</p>
        )}
        <ol className="space-y-2">
          {steps.map((edge, i) => {
            const rules = alert.reasons.filter((r) => r.edge_ids.includes(edge.id));
            const selected = edge.id === selectedEdgeId;

            return (
              <li key={edge.id}>
                <button
                  type="button"
                  onClick={() => selectEdge(edge.id)}
                  aria-pressed={selected}
                  className={`w-full rounded-lg p-2.5 text-left border transition-all ${
                    selected
                      ? 'border-2 border-green-400 bg-black shadow-[0_0_15px_rgba(0,255,102,0.3)]'
                      : 'border-slate-800 bg-black hover:border-green-500/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-black text-green-400">
                      HOP #{i + 1} · {edge.id}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {fmtTime(edge.event_time)}
                    </span>
                  </div>

                  <div className="text-xs font-bold text-white mb-1">
                    {describeEdge(edge, labelOf)}
                  </div>

                  {rules.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {rules.map((r) => (
                        <span
                          key={r.rule}
                          className="rounded bg-red-950 text-red-300 border border-red-500/60 px-1.5 py-0.5 text-[9px] font-bold"
                        >
                          ⚠️ {ruleLabel(r.rule)}
                        </span>
                      ))}
                    </div>
                  )}
                </button>
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}

export default function EvidencePane() {
  const [tab, setTab] = useState<Tab>('evidence');
  const alertId = useStore((s) => s.selectedAlertId);
  const { data: queue } = useAlerts(25);
  // Default to first alert if none is selected yet
  const alert = queue?.alerts.find((a) => a.id === alertId) ?? queue?.alerts[0];

  if (!alert) {
    return (
      <div className="p-6 text-xs font-mono text-slate-400 bg-black h-full flex items-center justify-center">
        Select an alert in the queue to inspect evidence.
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-black text-white font-mono select-none">
      {/* Header */}
      <div className="border-b border-green-500/40 px-4 py-3 bg-black">
        <div className="flex items-baseline justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            <h2 className="text-xs font-black tracking-widest text-white uppercase">
              ALERT DOSSIER · {alert.id}
            </h2>
          </div>
          <span className="px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-500 text-[10px] font-black">
            PRIORITY #{alert.rank}
          </span>
        </div>
        <p className="text-[10px] text-slate-400 mt-1">
          THREAT SCORE: <strong className="text-red-400">{alert.score.toFixed(2)}</strong> (CONFIDENCE RANGE{' '}
          {alert.confidence_low.toFixed(2)} - {alert.confidence_high.toFixed(2)})
        </p>
      </div>

      {/* Navigation Tabs */}
      <div role="tablist" aria-label="Evidence sections" className="flex border-b border-green-500/30 bg-black">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 px-3 py-2 text-[10px] font-black tracking-wider transition-colors outline-none ${
              tab === t.id
                ? 'border-b-2 border-green-400 bg-green-950/20 text-green-300 shadow-[0_2px_10px_rgba(0,255,102,0.2)]'
                : 'border-b-2 border-transparent text-slate-400 hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Active Tab Panel */}
      <div className="min-h-0 flex-1 overflow-y-auto bg-black" role="tabpanel">
        {tab === 'evidence' && <EvidenceTab alert={alert} />}
        {tab === 'counterfactual' && <CounterfactualTab key={alert.id} alert={alert} />}
        {tab === 'decision' && <DecisionTab key={alert.id} alert={alert} />}
      </div>
    </div>
  );
}
