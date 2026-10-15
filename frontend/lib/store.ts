import { create } from 'zustand';
import type { Alert, AlertStatus, Decision, DecisionKind } from './types';

const STORAGE_KEY = 'upi-decisions-v1';

type State = {
  selectedAlertId: string | null;
  selectedEdgeId: string | null;
  decisions: Decision[]; // append-only
  selectAlert: (id: string | null) => void;
  selectEdge: (id: string | null) => void;
  hydrate: () => void;
  addDecision: (d: Decision) => void;
  clearDecisions: () => void; // demo convenience only
};

function persist(decisions: Decision[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(decisions));
  } catch {
    /* storage unavailable: keep in-memory only */
  }
}

export const useStore = create<State>((set) => ({
  selectedAlertId: null,
  selectedEdgeId: null,
  decisions: [],
  selectAlert: (id) => set({ selectedAlertId: id, selectedEdgeId: null }),
  selectEdge: (id) => set({ selectedEdgeId: id }),
  // Call once after mount (not during render) to avoid hydration mismatches.
  hydrate: () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) set({ decisions: JSON.parse(raw) as Decision[] });
    } catch {
      /* ignore corrupt or unavailable storage */
    }
  },
  addDecision: (d) =>
    set((s) => {
      const next = [...s.decisions, d];
      persist(next);
      return { decisions: next };
    }),
  clearDecisions: () => {
    persist([]);
    set({ decisions: [] });
  },
}));

const KIND_TO_STATUS: Record<DecisionKind, AlertStatus> = {
  confirm: 'confirmed',
  dismiss: 'dismissed',
  needs_info: 'needs_info',
};

// The status shown in the queue is the latest decision for the alert, if any.
// It is display-only: it never touches score or rank.
export function statusFor(alert: Alert, decisions: Decision[]): AlertStatus {
  for (let i = decisions.length - 1; i >= 0; i--) {
    if (decisions[i].alert_id === alert.id) return KIND_TO_STATUS[decisions[i].decision];
  }
  return alert.status;
}
