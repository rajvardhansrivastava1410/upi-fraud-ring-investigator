'use client';

import { useMemo, useState } from 'react';
import { useAlertGraph, useAlerts } from '@/lib/api';
import { describeEdge, fmtDuration, fmtSigned, fmtTime, ruleLabel } from '@/lib/format';
import { useStore } from '@/lib/store';
import DecisionTab from '@/components/DecisionTab';
import type { Alert } from '@/lib/types';
import CounterfactualTab from './ CounterfactualTab';

type Tab = 'evidence' | 'counterfactual' | 'decision';
const TABS: { id: Tab; label: string }[] = [
  { id: 'evidence', label: 'Evidence' },
  { id: 'counterfactual', label: 'Counterfactual' },
  { id: 'decision', label: 'Decision' },
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
    <section aria-label="Score breakdown" className="px-4 py-3">
      <h3 className="mb-2 text-xs font-semibold text-slate-200">Why this score</h3>
      <ul className="space-y-1.5">
        {terms.map((t) => (
          <li key={t.key} className="grid grid-cols-[170px_1fr_44px] items-center gap-2 text-xs">
            <span className="truncate text-slate-300" title={t.label}>
              {t.label}
            </span>
            <div className="h-2 rounded-full bg-slate-800">
              <div
                className={`h-2 rounded-full ${t.points >= 0 ? 'bg-amber-400' : 'bg-sky-400'}`}
                style={{ width: `${(Math.abs(t.points) / max) * 100}%` }}
              />
            </div>
            <span className="text-right tabular-nums text-slate-200">{fmtSigned(t.points)}</span>
          </li>
        ))}
      </ul>
      <p className="mt-2 flex justify-between border-t border-slate-800 pt-2 text-xs text-slate-300">
        <span>Total (each term maps to evidence edges)</span>
        <span className="tabular-nums text-slate-100">{alert.score.toFixed(2)}</span>
      </p>
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
    <div className="overflow-y-auto">
      {alert.missing_data.length > 0 && (
        <div className="mx-4 mt-3 rounded border border-amber-400/40 bg-amber-950/40 px-3 py-2 text-xs text-amber-200">
          <p className="mb-1 font-medium">Incomplete data, so the score range is wider</p>
          <ul className="list-disc space-y-0.5 pl-4">
            {alert.missing_data.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        </div>
      )}

      <ScoreBreakdown alert={alert} />

      <section aria-label="Evidence timeline" className="border-t border-slate-800 px-4 py-3">
        <h3 className="mb-2 text-xs font-semibold text-slate-200">Evidence path</h3>
        {isLoading && <p className="text-xs text-slate-400">Loading evidence…</p>}
        {error && (
          <p className="text-xs text-amber-300">No evidence path available for this alert in demo mode.</p>
        )}
        <ol className="space-y-1">
          {steps.map((edge, i) => {
            const prev = steps[i - 1];
            const rules = alert.reasons.filter((r) => r.edge_ids.includes(edge.id));
            const lagMs = Date.parse(edge.ingest_time) - Date.parse(edge.event_time);
            const gapMs =
              prev && prev.type === 'transfer' && edge.type === 'transfer'
                ? Date.parse(edge.event_time) - Date.parse(prev.event_time)
                : null;
            const selected = edge.id === selectedEdgeId;

            return (
              <li key={edge.id}>
                {gapMs !== null && gapMs > 0 && (
                  <p className="py-0.5 pl-8 text-[11px] text-amber-300/80">+{fmtDuration(gapMs)}</p>
                )}
                <button
                  type="button"
                  onClick={() => selectEdge(selected ? null : edge.id)}
                  aria-pressed={selected}
                  className={`flex w-full gap-2 rounded border-l-2 px-2 py-1.5 text-left text-xs outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
                    selected
                      ? 'border-amber-400 bg-slate-800'
                      : 'border-transparent hover:bg-slate-900'
                  }`}
                >
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-800 text-[11px] text-slate-300">
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-slate-100">{describeEdge(edge, labelOf)}</span>
                    <span className="block text-slate-400">
                      {fmtTime(edge.event_time)}
                      {lagMs > 3_600_000 && (
                        <span className="text-amber-300"> · arrived {fmtDuration(lagMs)} late</span>
                      )}
                    </span>
                    {rules.length > 0 && (
                      <span className="mt-1 flex flex-wrap gap-1">
                        {rules.map((r) => (
                          <span
                            key={r.rule}
                            className="rounded bg-slate-800 px-1.5 py-0.5 text-[11px] text-slate-300"
                          >
                            {ruleLabel(r.rule)}
                          </span>
                        ))}
                      </span>
                    )}
                  </span>
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
  const alert = queue?.alerts.find((a) => a.id === alertId);

  if (!alert) {
    return <p className="p-6 text-sm text-slate-400">Select an alert in the queue to see its evidence.</p>;
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-slate-800 px-4 py-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-semibold text-slate-100">Alert {alert.id}</h2>
          <span className="text-xs text-slate-400">Review priority #{alert.rank}</span>
        </div>
        <p className="text-xs text-slate-400">
          Score {alert.score.toFixed(2)} (plausible range {alert.confidence_low.toFixed(2)} to{' '}
          {alert.confidence_high.toFixed(2)}). Consistent with coordinated behaviour, not proof.
        </p>
      </div>

      <div role="tablist" aria-label="Evidence sections" className="flex border-b border-slate-800">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 px-3 py-2 text-xs outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-amber-400 ${
              tab === t.id
                ? 'border-b-2 border-amber-400 text-slate-100'
                : 'border-b-2 border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto" role="tabpanel">
        {tab === 'evidence' && <EvidenceTab alert={alert} />}
        {tab === 'counterfactual' && (
          <CounterfactualTab key={alert.id} alert={alert} />
        )}
        {tab === 'decision' && <DecisionTab key={alert.id} alert={alert} />}
      </div>
    </div>
  );
}
