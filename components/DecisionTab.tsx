'use client';

import { useState } from 'react';
import { DEMO, postDecision } from '@/lib/api';
import { fmtTime } from '@/lib/format';
import { useStore } from '@/lib/store';
import type { Alert, Decision, DecisionKind } from '@/lib/types';

const OPTIONS: { kind: DecisionKind; label: string; hint: string; color: string }[] = [
  { kind: 'confirm', label: '🟥 CONFIRM FRAUD RING', hint: 'Escalate to Indian cybercrime / NPCI rails', color: 'border-red-500 text-red-400 bg-red-950/40' },
  { kind: 'dismiss', label: '🟩 DISMISS AS BENIGN', hint: 'A benign retail explanation fits evidence', color: 'border-green-500 text-green-400 bg-green-950/40' },
  { kind: 'needs_info', label: '⬜ REQUEST BANK KYC', hint: 'More branch records required', color: 'border-white text-white bg-slate-900/50' },
];

const OUTCOME: Record<DecisionKind, string> = {
  confirm: 'Confirmed Fraud Ring',
  dismiss: 'Dismissed as Benign',
  needs_info: 'Needs More Info / KYC',
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
      setError('The decision could not be saved. Try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4 px-4 py-3 font-mono text-white bg-black">
      <section aria-label="Record a decision">
        <h3 className="mb-1 text-xs font-black tracking-wider text-green-400 uppercase">
          RECORD ANALYST DISPOSITION
        </h3>
        <p className="mb-2 text-[10px] text-slate-400">
          Decisions are immutably logged for NPCI regulatory audit.
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
                className={`flex items-baseline justify-between rounded p-2.5 text-left text-xs outline-none border transition-all ${
                  active
                    ? `${o.color} ring-1 ring-white shadow-[0_0_15px_rgba(0,255,102,0.2)]`
                    : 'border-slate-800 bg-black text-slate-300 hover:border-slate-600'
                }`}
              >
                <span className="font-bold">{o.label}</span>
                <span className="text-[10px] text-slate-400">{o.hint}</span>
              </button>
            );
          })}
        </div>

        <label htmlFor="decision-note" className="mt-3 block text-xs font-bold text-slate-300">
          Analyst Justification Note (at least {MIN_NOTE} characters)
        </label>
        <textarea
          id="decision-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          placeholder="E.g., Confirmed rapid drain to Jamtara micro-ATM corridor within 4 min of collect fan-in."
          className="mt-1 w-full resize-none rounded border border-green-500/50 bg-black p-2 text-xs text-white placeholder-slate-600 outline-none focus:border-green-400"
        />

        {error && <p className="mt-1 text-xs text-red-400">{error}</p>}

        <button
          type="button"
          onClick={submit}
          disabled={!canSubmit}
          className="mt-2 w-full rounded bg-green-500 py-2 text-xs font-black text-black outline-none hover:bg-green-400 disabled:opacity-40 transition-all shadow-[0_0_12px_rgba(0,255,102,0.6)]"
        >
          {busy ? 'COMMITTING TO NPCI AUDIT LOG…' : '✓ COMMIT AUDIT DISPOSITION'}
        </button>
      </section>

      <section aria-label="Decision history" className="border-t border-slate-800 pt-3">
        <h3 className="mb-2 text-xs font-black tracking-wider text-green-400 uppercase">
          AUDIT LOG FOR {alert.id}
        </h3>
        {history.length === 0 ? (
          <p className="text-[11px] text-slate-500">No previous analyst decisions recorded for this alert.</p>
        ) : (
          <ol className="space-y-2">
            {history.map((d) => (
              <li key={d.id} className="rounded border border-slate-800 bg-black p-2.5 text-xs">
                <p className="flex justify-between font-bold">
                  <span className={d.decision === 'confirm' ? 'text-red-400' : 'text-green-400'}>
                    {OUTCOME[d.decision]}
                  </span>
                  <span className="text-[10px] text-slate-500">{fmtTime(d.created_at)}</span>
                </p>
                <p className="mt-1 text-slate-300">{d.note}</p>
                <p className="mt-1 text-[10px] text-slate-500">
                  By {d.analyst} · Score at decision: {d.score_at_decision.toFixed(2)}
                </p>
              </li>
            ))}
          </ol>
        )}
        {DEMO && decisions.length > 0 && (
          <button
            type="button"
            onClick={clearDecisions}
            className="mt-3 text-[10px] text-slate-500 underline hover:text-white"
          >
            Reset demo decisions
          </button>
        )}
      </section>
    </div>
  );
}
