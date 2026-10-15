import { create } from 'zustand';
import type { TimeMode } from './asof';

interface TimeState {
  alertId: string | null;   // the alert the asOf value belongs to
  asOf: number | null;      // ms since epoch; null = latest (everything)
  mode: TimeMode;           // 'ingest' = what the analyst knew, 'event' = when it happened
  setAsOf: (alertId: string, asOf: number | null) => void;
  setMode: (mode: TimeMode) => void;
}

export const useTimeStore = create<TimeState>((set) => ({
  alertId: null,
  asOf: null,
  mode: 'ingest',
  setAsOf: (alertId, asOf) => set({ alertId, asOf }),
  setMode: (mode) => set({ mode }),
}));