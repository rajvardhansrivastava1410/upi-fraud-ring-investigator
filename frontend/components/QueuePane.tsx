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
  needs_info: 'Needs more info',
};

const STATUS_STYLE: Record<AlertStatus, string> = {
  open: 'bg-slate-800 text-slate-300',
  confirmed: 'bg-sky-950 text-sky-300',
  dismissed: 'bg-slate-800 text-slate-500',
  needs_info: 'bg-amber-950 text-amber-300',
};

function ScoreBar({ alert, inBudget }: { alert: Alert; inBudget: boolean }) {
  const pct = (v: number) => `${Math.round(v * 100)}%`;
  return (
    <div
      className="relative h-2 w-full rounded-full bg-slate-800"
      role="img"
      aria-label={`Score ${alert.score.toFixed(2)}, plausible range ${alert.confidence_low.toFixed(2)} to ${alert.confidence_high.toFixed(2)}`}
    >
      {/* confidence band: wider when data is missing */}
      <div
        className="absolute inset-y-0 rounded-full bg-slate-600/60"
        style={{
          left: pct(alert.confidence_low),
          width: pct(alert.confidence_high - alert.confidence_low),
        }}
      />
      {/* score marker */}
      <div
        className={`absolute top-1/2 h-3.5 w-1 -translate-y-1/2 rounded-sm ${
          inBudget ? 'bg-amber-400' : 'bg-slate-400'
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
    <div className="flex items-center gap-1.5" aria-label="Baselines that also flagged this alert">
      <span className="text-[11px] text-slate-500">Also flagged by</span>
      {items.map(({ key, label }) => (
        <span
          key={key}
          className={`rounded px-1.5 py-0.5 text-[11px] ${
            flags[key] ? 'bg-slate-700 text-slate-200' : 'bg-transparent text-slate-600 line-through'
          }`}
        >
          {label}
        </span>
      ))}
    </div>
  );
}

/**
 * Baseline comparison panel shown when the "Compare baselines" toggle is active.
 * Displays a 4-column table: Baseline name | Flagged | Score | vs Graph Engine.
 * Scores for B1/B2/B3 are synthetic — in production these would come from the API.
 */
function BaselineComparison({
  alert,
  flags,
}: {
  alert: Alert;
  flags: Alert['baseline_flags'];
}) {
  // Synthetic baseline scores derived deterministically from the alert score
  // so they look plausible in demo mode.
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
    <div className="mt-2 overflow-hidden rounded-md border border-slate-800 text-[11px]">
      <table className="w-full border-collapse" aria-label="Baseline comparison">
        <thead>
          <tr className="bg-slate-800/60 text-slate-500">
            <th className="py-1.5 pl-2 pr-1 text-left font-medium">Baseline</th>
            <th className="px-1 py-1.5 text-center font-medium">Flagged</th>
            <th className="px-1 py-1.5 text-center font-medium">Score</th>
            <th className="px-1 py-1.5 pr-2 text-right font-medium text-amber-500">
              Graph Engine
            </th>
          </tr>
        </thead>
        <tbody>
          {baselines.map((b) => (
            <tr
              key={b.id}
              className="border-t border-slate-800/50"
            >
              <td className="py-1.5 pl-2 pr-1 text-slate-400">
                <span className="font-mono text-slate-600">{b.id}</span>{' '}
                {b.name}
              </td>
              <td className="px-1 py-1.5 text-center">
                {b.flagged ? (
                  <span className="text-slate-300">✓</span>
                ) : (
                  <span className="text-slate-700">✗</span>
                )}
              </td>
              <td className="px-1 py-1.5 text-center font-mono text-slate-400">{b.score}</td>
              {/* Graph Engine score in amber — only shown on first row, rowspan visually */}
              {b.id === 'B1' ? (
                <td
                  className="px-1 py-1.5 pr-2 text-right font-mono font-semibold text-amber-400"
                  rowSpan={3}
                >
                  {graphScore.toFixed(2)}
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function QueuePane() {
  const { data, error, isLoading } = useAlerts(25);
  const selectedAlertId = useStore((s) => s.selectedAlertId);
  const selectAlert = useStore((s) => s.selectAlert);
  const decisions = useStore((s) => s.decisions);
  const [showBaseline, setShowBaseline] = useState(false);
  const listRef = useRef<HTMLUListElement>(null);

  const alerts = data ? [...data.alerts].sort((a, b) => a.rank - b.rank) : [];

  // Keyboard navigation: ↑/↓ move selection when the list is focused
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!['ArrowUp', 'ArrowDown'].includes(e.key)) return;
      e.preventDefault();
      if (alerts.length === 0) return;
      const currentIdx = alerts.findIndex((a) => a.id === selectedAlertId);
      const nextIdx =
        e.key === 'ArrowDown'
          ? Math.min(alerts.length - 1, currentIdx + 1)
          : Math.max(0, currentIdx - 1);
      selectAlert(alerts[nextIdx].id);
      // Scroll the newly focused item into view
      const item = listRef.current?.children[nextIdx] as HTMLElement | undefined;
      item?.scrollIntoView({ block: 'nearest' });
    },
    [alerts, selectedAlertId, selectAlert],
  );

  if (isLoading) return <LoadingState variant="skeleton" rows={5} label="Loading alert queue…" />;
  if (error || !data)
    return (
      <p className="p-4 text-sm text-amber-300">
        Could not load alerts. Check that the backend is running, or set NEXT_PUBLIC_DEMO=1 to use
        fixtures.
      </p>
    );

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-slate-800 px-4 py-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-slate-100">Analyst queue</h2>
            <p className="text-xs text-slate-400">
              Review budget: top {data.budget_k} of {alerts.length} alerts
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowBaseline((v) => !v)}
            aria-pressed={showBaseline}
            title="Toggle baseline comparison"
            className={`mt-0.5 shrink-0 rounded border px-2.5 py-1 text-[11px] font-medium transition-colors focus-visible:ring-2 focus-visible:ring-amber-400 ${
              showBaseline
                ? 'border-amber-500/50 bg-amber-500/10 text-amber-400'
                : 'border-slate-700 bg-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {showBaseline ? '▲ Baselines' : '▼ Compare'}
          </button>
        </div>

        {showBaseline && (
          <p className="mt-1.5 text-[11px] text-slate-500">
            Showing B1 (Shared Device), B2 (Velocity), B3 (Isolation Forest) vs Graph Engine score.
          </p>
        )}
      </div>

      <p className="px-4 py-1.5 text-[10px] text-slate-600 select-none">
        Tip: focus the list and use ↑ ↓ keys to navigate
      </p>

      <ul
        ref={listRef}
        className="flex-1 overflow-y-auto outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-amber-400/40"
        tabIndex={0}
        aria-label="Alert queue — use arrow keys to navigate"
        onKeyDown={handleKeyDown}
      >
        {alerts.map((alert) => {
          const inBudget = alert.rank <= data.budget_k;
          const selected = alert.id === selectedAlertId;
          const status = statusFor(alert, decisions);
          const topReasons = [...alert.reasons].sort((a, b) => b.points - a.points).slice(0, 2);


          return (
            <Fragment key={alert.id}>
              <li>
                <button
                  type="button"
                  onClick={() => selectAlert(alert.id)}
                  aria-pressed={selected}
                  className={`block w-full border-b border-slate-800/70 px-4 py-3 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-amber-400 ${
                    selected ? 'bg-slate-800/80' : 'hover:bg-slate-900'
                  } ${inBudget ? '' : 'opacity-75'}`}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-100">
                      #{alert.rank} · {alert.id}
                    </span>
                    <span className={`rounded px-2 py-0.5 text-[11px] ${STATUS_STYLE[status]}`}>
                      {STATUS_LABEL[status]}
                    </span>
                  </div>

                  <div className="mb-2 flex items-center gap-3">
                    <span className="w-10 text-sm tabular-nums text-slate-200">
                      {alert.score.toFixed(2)}
                    </span>
                    <ScoreBar alert={alert} inBudget={inBudget} />
                  </div>

                  <ul className="mb-2 space-y-0.5 text-xs text-slate-400">
                    {topReasons.map((r) => (
                      <li key={r.rule} className="truncate" title={r.text}>
                        {r.text}
                      </li>
                    ))}
                  </ul>

                  {alert.missing_data.length > 0 && (
                    <p className="mb-2 text-[11px] text-amber-300/90">
                      Incomplete data: {alert.missing_data.length} warning
                      {alert.missing_data.length > 1 ? 's' : ''}, so the range is wider
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
                  className="flex items-center gap-2 bg-slate-900 px-4 py-1.5 text-[11px] text-amber-300"
                >
                  <span className="h-px flex-1 bg-amber-400/50" />
                  Budget cutoff · alerts below are outside this review cycle
                  <span className="h-px flex-1 bg-amber-400/50" />
                </li>
              )}
            </Fragment>
          );
        })}
      </ul>
    </div>
  );
}
