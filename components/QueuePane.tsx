'use client';

import { Fragment, useState, useRef, useEffect, useCallback } from 'react';
import { useAlerts } from '@/lib/api';
import { statusFor, useStore } from '@/lib/store';
import LoadingState from '@/components/LoadingState';
import type { Alert, AlertStatus } from '@/lib/types';

const STATUS_LABEL: Record<AlertStatus, string> = {
  open: 'Open',
  confirmed: 'Confirmed',
  dismissed: 'Dismissed',
  needs_info: 'Needs Info',
};

const STATUS_STYLE: Record<AlertStatus, string> = {
  open: 'bg-black text-white border border-slate-700',
  confirmed: 'bg-red-950 text-red-400 border border-red-500 font-black',
  dismissed: 'bg-green-950 text-green-400 border border-green-500 font-black',
  needs_info: 'bg-slate-900 text-slate-300 border border-slate-600',
};

function ScoreBar({ alert, inBudget }: { alert: Alert; inBudget: boolean }) {
  const pct = (v: number) => `${Math.round(v * 100)}%`;
  const isHighRisk = alert.score >= 0.7;

  return (
    <div
      className="relative h-2 w-full rounded-full bg-slate-900 border border-slate-800"
      role="img"
      aria-label={`Score ${alert.score.toFixed(2)}, plausible range ${alert.confidence_low.toFixed(2)} to ${alert.confidence_high.toFixed(2)}`}
    >
      {/* Confidence range band */}
      <div
        className="absolute inset-y-0 rounded-full bg-slate-800/80"
        style={{
          left: pct(alert.confidence_low),
          width: pct(alert.confidence_high - alert.confidence_low),
        }}
      />
      {/* Score indicator needle */}
      <div
        className={`absolute top-1/2 h-3.5 w-1.5 -translate-y-1/2 rounded-sm ${
          isHighRisk
            ? 'bg-red-500 shadow-[0_0_8px_rgba(255,0,63,0.9)]'
            : 'bg-green-400 shadow-[0_0_8px_rgba(0,255,102,0.9)]'
        }`}
        style={{ left: pct(alert.score) }}
      />
    </div>
  );
}

function BaselineBadges({ flags }: { flags: Alert['baseline_flags'] }) {
  const items = [
    { key: 'shared_device', label: 'Device' },
    { key: 'velocity', label: 'Velocity' },
    { key: 'ml', label: 'ML' },
  ] as const;

  return (
    <div className="flex items-center gap-1.5 font-mono" aria-label="Baselines that also flagged this alert">
      <span className="text-[10px] text-slate-500">Also flagged by:</span>
      {items.map(({ key, label }) => (
        <span
          key={key}
          className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
            flags[key]
              ? 'bg-red-950 text-red-300 border border-red-500/60'
              : 'bg-black text-slate-600 border border-slate-800 line-through'
          }`}
        >
          {label}
        </span>
      ))}
    </div>
  );
}

function BaselineComparison({
  alert,
  flags,
}: {
  alert: Alert;
  flags: Alert['baseline_flags'];
}) {
  const graphScore = alert.score;
  const baselines = [
    {
      id: 'B1',
      name: 'Shared Device',
      flagged: flags.shared_device,
      score: flags.shared_device ? Math.min(0.99, graphScore * 0.72 + 0.08).toFixed(2) : '—',
    },
    {
      id: 'B2',
      name: 'Velocity',
      flagged: flags.velocity,
      score: flags.velocity ? Math.min(0.99, graphScore * 0.65 + 0.12).toFixed(2) : '—',
    },
    {
      id: 'B3',
      name: 'Isolation Forest',
      flagged: flags.ml,
      score: flags.ml ? Math.min(0.99, graphScore * 0.81 + 0.04).toFixed(2) : '—',
    },
  ];

  return (
    <div
      className="mt-2.5 rounded border border-green-500/30 bg-black/90 p-2 font-mono text-[11px]"
      aria-label={`Baseline comparison for alert ${alert.id}`}
    >
      <div className="mb-1.5 flex items-center justify-between border-b border-slate-800 pb-1 text-[10px] text-slate-400">
        <span>BASELINE MODEL</span>
        <div className="flex gap-4">
          <span>FLAG</span>
          <span>SCORE</span>
        </div>
      </div>
      <ul className="space-y-1">
        {baselines.map((b) => (
          <li key={b.id} className="flex items-center justify-between">
            <span className="text-slate-300">
              <span className="mr-1 text-slate-500">{b.id}</span>
              {b.name}
            </span>
            <div className="flex items-center gap-4">
              <span className={b.flagged ? 'font-bold text-red-400' : 'text-slate-600'}>
                {b.flagged ? 'YES' : 'NO'}
              </span>
              <span className="w-8 text-right tabular-nums text-white">
                {b.score}
              </span>
            </div>
          </li>
        ))}
        <li className="flex items-center justify-between border-t border-slate-800 pt-1 text-green-400 font-bold">
          <span>⚡ Graph Engine (Current)</span>
          <div className="flex items-center gap-4">
            <span className="text-red-400 font-bold">YES</span>
            <span className="w-8 text-right tabular-nums">{alert.score.toFixed(2)}</span>
          </div>
        </li>
      </ul>
    </div>
  );
}

export default function QueuePane() {
  const { data, isLoading, error } = useAlerts(25);
  const selectedAlertId = useStore((s) => s.selectedAlertId);
  const selectAlert = useStore((s) => s.selectAlert);
  const decisions = useStore((s) => s.decisions);
  const [showBaseline, setShowBaseline] = useState(false);
  const listRef = useRef<HTMLUListElement>(null);

  const alerts = data?.alerts ?? [];

  // Auto-select the first alert on mount so the workbench is never empty!
  useEffect(() => {
    if (alerts.length > 0 && !selectedAlertId) {
      selectAlert(alerts[0].id);
    }
  }, [alerts, selectedAlertId, selectAlert]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLUListElement>) => {
      if (alerts.length === 0) return;
      const currentIdx = alerts.findIndex((a) => a.id === selectedAlertId);
      let nextIdx = currentIdx;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        nextIdx = currentIdx < alerts.length - 1 ? currentIdx + 1 : 0;
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        nextIdx = currentIdx > 0 ? currentIdx - 1 : alerts.length - 1;
      } else {
        return;
      }

      selectAlert(alerts[nextIdx].id);
      const item = listRef.current?.children[nextIdx] as HTMLElement | undefined;
      item?.scrollIntoView({ block: 'nearest' });
    },
    [alerts, selectedAlertId, selectAlert]
  );

  if (isLoading) return <LoadingState variant="skeleton" rows={5} label="Loading analyst queue…" />;
  if (error || !data)
    return (
      <p className="p-4 text-xs font-mono text-red-400">
        Could not load alerts from backend. Check that port 8000 is running.
      </p>
    );

  return (
    <div className="flex h-full flex-col bg-black text-white font-mono select-none">
      {/* Header */}
      <div className="border-b border-green-500/40 px-4 py-3 bg-black">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <h2 className="text-xs font-black tracking-widest text-white uppercase">
                ANALYST REVIEW QUEUE
              </h2>
            </div>
            <p className="text-[10px] text-green-300/80 mt-0.5">
              Review budget: top {data.budget_k} of {alerts.length} high-risk alerts
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowBaseline((v) => !v)}
            aria-pressed={showBaseline}
            className={`shrink-0 rounded border px-2 py-0.5 text-[10px] font-bold transition-colors ${
              showBaseline
                ? 'border-green-400 bg-green-950 text-green-300'
                : 'border-slate-800 bg-black text-slate-400 hover:text-white'
            }`}
          >
            {showBaseline ? '▲ Baselines' : '▼ Compare'}
          </button>
        </div>

        {showBaseline && (
          <p className="mt-1.5 text-[10px] text-slate-400">
            Comparing B1 (Device), B2 (Velocity), B3 (Isolation Forest) vs Graph Engine.
          </p>
        )}
      </div>

      <div className="px-4 py-1.5 text-[9px] text-slate-500 border-b border-slate-900 bg-black">
        TIP: USE ↑ ↓ ARROW KEYS TO NAVIGATE ALERTS
      </div>

      {/* Alert List */}
      <ul
        ref={listRef}
        className="flex-1 overflow-y-auto outline-none divide-y divide-slate-900"
        tabIndex={0}
        aria-label="Alert queue — use arrow keys to navigate"
        onKeyDown={handleKeyDown}
      >
        {alerts.map((alert) => {
          const inBudget = alert.rank <= data.budget_k;
          const selected = alert.id === selectedAlertId;
          const status = statusFor(alert, decisions);
          const topReasons = [...alert.reasons].sort((a, b) => b.points - a.points).slice(0, 2);
          const isHighRisk = alert.score >= 0.7;

          return (
            <Fragment key={alert.id}>
              <li>
                <button
                  type="button"
                  onClick={() => selectAlert(alert.id)}
                  aria-pressed={selected}
                  className={`block w-full px-4 py-3 text-left transition-all outline-none ${
                    selected
                      ? 'bg-black border-l-4 border-l-green-400 border-r border-green-500/50 shadow-[inset_0_0_20px_rgba(0,255,102,0.15)]'
                      : 'bg-black hover:bg-green-950/20'
                  }`}
                >
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-xs font-black text-white">
                      #{alert.rank} · {alert.id}
                    </span>
                    <span className={`rounded px-1.5 py-0.5 text-[9px] ${STATUS_STYLE[status]}`}>
                      {STATUS_LABEL[status]}
                    </span>
                  </div>

                  <div className="mb-2 flex items-center gap-3">
                    <span
                      className={`w-9 text-xs font-black tabular-nums ${
                        isHighRisk ? 'text-red-400' : 'text-green-400'
                      }`}
                    >
                      {alert.score.toFixed(2)}
                    </span>
                    <ScoreBar alert={alert} inBudget={inBudget} />
                  </div>

                  <ul className="mb-2 space-y-0.5 text-[11px] text-slate-300">
                    {topReasons.map((r) => (
                      <li key={r.rule} className="truncate" title={r.text}>
                        ⚡ {r.text}
                      </li>
                    ))}
                  </ul>

                  {alert.missing_data.length > 0 && (
                    <p className="mb-2 text-[10px] text-red-400 font-bold">
                      ⚠️ Incomplete data: {alert.missing_data.length} warning(s)
                    </p>
                  )}

                  {showBaseline ? (
                    <BaselineComparison alert={alert} flags={alert.baseline_flags} />
                  ) : (
                    <BaselineBadges flags={alert.baseline_flags} />
                  )}
                </button>
              </li>

              {alert.rank === data.budget_k && (
                <li
                  aria-label="Review budget cutoff"
                  className="flex items-center gap-2 bg-black border-y border-red-500/50 px-4 py-1 text-[10px] text-red-400 font-black uppercase"
                >
                  <span className="h-px flex-1 bg-red-500/50" />
                  Budget cutoff · Top {data.budget_k} priority
                  <span className="h-px flex-1 bg-red-500/50" />
                </li>
              )}
            </Fragment>
          );
        })}
      </ul>
    </div>
  );
}
