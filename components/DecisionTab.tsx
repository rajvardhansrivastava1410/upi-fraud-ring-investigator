'use client';

import { useState } from 'react';
import { DEMO, postDecision } from '@/lib/api';
import { fmtTime } from '@/lib/format';
import { useStore } from '@/lib/store';
import type { Alert, Decision, DecisionKind } from '@/lib/types';

const OPTIONS: { kind: DecisionKind; label: string; hint: string }[] = [
  { kind: 'confirm', label: 'Confirm', hint: 'Worth escalating for investigation' },
  { kind: 'dismiss', label: 'Dismiss', hint: 'A benign explanation fits the evidence' },
  { kind: 'needs_info', label: 'Needs more info', hint: 'Cannot decide yet' },
];

const OUTCOME: Record<DecisionKind, string> = {
  confirm: 'Confirmed',
  dismiss: 'Dismissed',
  needs_info: 'Needs more info',
};

const MIN_NOTE = 10;

const newId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

export default function DecisionTab({ alert }: { alert: Alert }) {
  const decisions = useStore((s) => s.decisions);
  const addDecision = useStore((s) => s.addDecision);
  const clearDecisions = useStore((s) => s.clearDecisions);

  const [kind, setKind] = useState<DecisionKind | null>(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const history = decisions.filter((d) => d.alert_id === alert.id).reverse();
  const noteOk = note.trim().length >= MIN_NOTE;
  const canSubmit = kind !== null && noteOk && !busy;

  async function submit() {
    if (!kind || !noteOk) return;
    setBusy(true);
    setError(null);
    const record: Decision = {
      id: newId(),
      alert_id: alert.id,
      decision: kind,
      note: note.trim(),
      analyst: 'demo-analyst',
      created_at: new Date().toISOString(),
      score_at_decision: alert.score,
      rank_at_decision: alert.rank,
    };
    try {
      await postDecision(record);
      addDecision(record);
      setKind(null);
      setNote('');
    } catch {
      setError('The decision could not be saved, so nothing was recorded. Try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4 px-4 py-3">
      <section aria-label="Record a decision">
        <h3 className="mb-1 text-xs font-semibold text-slate-200">Your decision</h3>
        <p className="mb-2 text-xs text-slate-400">
          Decisions are logged for audit. They never change the score or ranking.
        </p>

        <div role="radiogroup" aria-label="Decision" className="grid gap-1.5">
          {OPTIONS.map((o) => {
            const active = kind === o.kind;
            return (
              <button
                key={o.kind}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setKind(o.kind)}
                className={`flex items-baseline justify-between rounded border px-3 py-2 text-left text-xs outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
                  active
                    ? 'border-amber-400 bg-slate-800 text-slate-100'
                    : 'border-slate-700 text-slate-300 hover:bg-slate-900'
                }`}
              >
                <span className="font-medium">{o.label}</span>
                <span className="text-slate-400">{o.hint}</span>
              </button>
            );
          })}
        </div>

        <label htmlFor="decision-note" className="mt-3 block text-xs text-slate-300">
          Note (required, at least {MIN_NOTE} characters)
        </label>
        <textarea
          id="decision-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          placeholder="What did you check, and why did you decide this?"
          className="mt-1 w-full resize-none rounded border border-slate-700 bg-slate-900 px-2.5 py-2 text-xs text-slate-100 placeholder:text-slate-500 outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
        />

        {error && <p className="mt-1 text-xs text-amber-300">{error}</p>}

        <button
          type="button"
          onClick={submit}
          disabled={!canSubmit}
          className="mt-2 w-full rounded bg-amber-400 px-3 py-2 text-xs font-medium text-slate-950 outline-none hover:bg-amber-300 focus-visible:ring-2 focus-visible:ring-amber-200 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-500"
        >
          {busy ? 'Saving…' : 'Save decision'}
        </button>
        {!canSubmit && !busy && (
          <p className="mt-1 text-[11px] text-slate-500">
            {kind === null ? 'Choose a decision, then add a note.' : 'Add a note to save.'}
          </p>
        )}
      </section>

      <section aria-label="Decision history" className="border-t border-slate-800 pt-3">
        <h3 className="mb-2 text-xs font-semibold text-slate-200">History for {alert.id}</h3>
        {history.length === 0 ? (
          <p className="text-xs text-slate-500">No decisions recorded yet.</p>
        ) : (
          <ol className="space-y-2">
            {history.map((d) => (
              <li key={d.id} className="rounded bg-slate-900 px-3 py-2 text-xs">
                <p className="flex justify-between text-slate-100">
                  <span className="font-medium">{OUTCOME[d.decision]}</span>
                  <span className="text-slate-400">{fmtTime(d.created_at)}</span>
                </p>
                <p className="mt-1 whitespace-pre-wrap text-slate-300">{d.note}</p>
                <p className="mt-1 text-[11px] text-slate-500">
                  {d.analyst} · score {d.score_at_decision.toFixed(2)} · rank #{d.rank_at_decision} at
                  the time
                </p>
              </li>
            ))}
          </ol>
        )}
        {DEMO && decisions.length > 0 && (
          <button
            type="button"
            onClick={clearDecisions}
            className="mt-3 text-[11px] text-slate-500 underline hover:text-slate-300"
          >
            Reset demo decisions
          </button>
        )}
      </section>
    </div>
  );
}
