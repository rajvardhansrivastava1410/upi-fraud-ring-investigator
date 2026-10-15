'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useCallback, useEffect } from 'react';
import EvidencePane from '@/components/EvidencePane';
import QueuePane from '@/components/QueuePane';
import { DEMO, useAlerts } from '@/lib/api';
import { useStore } from '@/lib/store';

// Cytoscape needs `window`, so the graph pane is client-only.
const GraphPane = dynamic(() => import('@/components/GraphPane'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center">
      <p className="text-sm text-slate-400">Loading graph…</p>
    </div>
  ),
});

function useDecisionCsvExport() {
  const decisions = useStore((s) => s.decisions);
  return useCallback(() => {
    if (decisions.length === 0) return;
    const header = 'id,alert_id,decision,note,analyst,created_at,score_at_decision,rank_at_decision';
    const rows = decisions.map((d) =>
      [
        d.id,
        d.alert_id,
        d.decision,
        `"${d.note.replace(/"/g, '""')}"`,
        d.analyst,
        d.created_at,
        d.score_at_decision,
        d.rank_at_decision,
      ].join(',')
    );
    const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `decisions-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [decisions]);
}

export default function Home() {
  const { data } = useAlerts(25);
  const selectedAlertId = useStore((s) => s.selectedAlertId);
  const selectAlert = useStore((s) => s.selectAlert);
  const hydrate = useStore((s) => s.hydrate);
  const decisions = useStore((s) => s.decisions);
  const exportCsv = useDecisionCsvExport();

  // Restore logged decisions from this browser after mount.
  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // Select the top-ranked alert once the queue loads.
  useEffect(() => {
    if (data && !selectedAlertId && data.alerts.length > 0) {
      const top = [...data.alerts].sort((a, b) => a.rank - b.rank)[0];
      selectAlert(top.id);
    }
  }, [data, selectedAlertId, selectAlert]);

  return (
    <div className="flex h-screen flex-col">
      <header className="flex shrink-0 items-center justify-between border-b border-slate-800 px-4 py-2 gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <h1 className="text-sm font-semibold text-slate-100 shrink-0">UPI Ring Investigator</h1>
          <p className="hidden text-xs text-slate-400 sm:block truncate">
            Synthetic data only{DEMO ? ' · demo fixtures' : ''} · Patterns are consistent with
            coordinated behaviour, not proof. Every decision is human-reviewed.
          </p>
        </div>
        <nav className="flex items-center gap-2 shrink-0">
          {decisions.length > 0 && (
            <button
              type="button"
              onClick={exportCsv}
              title={`Export ${decisions.length} decision${decisions.length > 1 ? 's' : ''} as CSV`}
              className="flex items-center gap-1.5 rounded border border-slate-700 px-2.5 py-1 text-xs text-slate-300 hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-amber-400"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                <path d="M6 1v7M3 6l3 3 3-3M1 10h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Export decisions ({decisions.length})
            </button>
          )}
          <Link
            href="/evaluation"
            className="rounded border border-slate-700 px-2.5 py-1 text-xs text-slate-300 hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-amber-400"
          >
            Benchmarks ↗
          </Link>
        </nav>
      </header>

      {/*
        Mobile: stacked vertically. Desktop (lg+): three-column side-by-side layout.
        The queue is hidden on mobile in favour of the graph + evidence panes.
      */}
      <main className="min-h-0 flex-1 flex flex-col lg:grid lg:grid-cols-[320px_1fr_380px]">
        <section
          className="hidden lg:flex min-h-0 flex-col border-r border-slate-800 overflow-y-auto"
          aria-label="Analyst queue"
        >
          <QueuePane />
        </section>

        {/* On mobile, show queue as a horizontal scroll strip above the graph */}
        <section
          className="lg:hidden border-b border-slate-800 shrink-0 overflow-x-auto"
          aria-label="Analyst queue (mobile)"
        >
          <div className="flex gap-2 px-3 py-2">
            {data?.alerts
              .slice()
              .sort((a, b) => a.rank - b.rank)
              .map((alert) => (
                <button
                  key={alert.id}
                  type="button"
                  onClick={() => selectAlert(alert.id)}
                  aria-pressed={alert.id === selectedAlertId}
                  className={`shrink-0 rounded border px-2.5 py-1.5 text-xs text-left transition-colors ${
                    alert.id === selectedAlertId
                      ? 'border-amber-500 bg-amber-500/10 text-amber-300'
                      : 'border-slate-700 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <span className="block font-medium">{alert.id}</span>
                  <span className="block text-[10px] tabular-nums text-slate-400">
                    #{alert.rank} · {alert.score.toFixed(2)}
                  </span>
                </button>
              ))}
          </div>
        </section>

        <section className="min-h-0 flex-1 lg:flex-initial h-full overflow-hidden flex flex-col" aria-label="Graph explorer">
          <GraphPane />
        </section>

        <section
          className="min-h-0 border-t border-slate-800 lg:border-t-0 lg:border-l h-full overflow-hidden flex flex-col"
          aria-label="Evidence panel"
        >
          <EvidencePane />
        </section>
      </main>
    </div>
  );
}
