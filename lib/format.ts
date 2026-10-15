import type { GraphEdge } from './types';

export const RULE_LABEL: Record<string, string> = {
  R1_collect_fan_in: 'Collect fan-in',
  R2_pass_through: 'Pass-through',
  R3_device_sharing: 'Device sharing',
  R4_complaint_convergence: 'Complaint convergence',
  R5_fresh_velocity: 'Fresh-account velocity',
};

export const ruleLabel = (rule: string) => RULE_LABEL[rule] ?? rule;

export const fmtINR = (n?: number) => (n == null ? '' : `₹${n.toLocaleString('en-IN')}`);

export const fmtSigned = (p: number) => (p >= 0 ? `+${p.toFixed(2)}` : `\u2212${Math.abs(p).toFixed(2)}`);

export function fmtTime(iso: string) {
  return new Date(iso).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export function fmtDuration(ms: number) {
  const mins = Math.round(ms / 60000);
  if (mins < 60) return `${mins} min`;
  const hours = Math.round(mins / 60);
  if (hours < 48) return `${hours} h`;
  return `${Math.round(hours / 24)} days`;
}

export function describeEdge(e: GraphEdge, label: (id: string) => string): string {
  const s = label(e.source);
  const t = label(e.target);
  switch (e.type) {
    case 'transfer':
      return `${s} paid ${t} ${fmtINR(e.amount)}`.trim();
    case 'collect_request':
      return `${s} sent a collect request to ${t}${e.amount ? ` for ${fmtINR(e.amount)}` : ''}`;
    case 'uses_device':
      return `${s} used device ${t}`;
    case 'complaint_about':
      return `${s} was filed against ${t}`;
    case 'pays_merchant':
      return `${s} paid merchant ${t} ${fmtINR(e.amount)}`.trim();
    default:
      return `${s} → ${t}`;
  }
}
