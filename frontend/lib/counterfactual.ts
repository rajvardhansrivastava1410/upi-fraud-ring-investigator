import type {
  Alert, BenignHypothesis, CounterfactualRequest,
  CounterfactualResult, MissingDataWhatIf,
} from './types';

const round2 = (n: number) => Math.round(n * 100) / 100;

export function computeLocal(
  alert: Alert,
  req: CounterfactualRequest,
  hypotheses: BenignHypothesis[],
  whatIfs: MissingDataWhatIf[],
  cutoff: number | null,
): CounterfactualResult {
  const removed = new Set(req.remove_edges);
  let score = 0;

  // Each rule keeps points in proportion to the evidence edges that remain.
  for (const r of alert.reasons) {
    const ids = r.edge_ids ?? [];
    if (ids.length === 0) { score += r.points; continue; }
    const kept = ids.filter((id) => !removed.has(id)).length;
    score += r.points * (kept / ids.length);
  }
  for (const d of alert.benign_discounts) score -= Math.abs(d.points);

  if (req.hypothesis) {
    const h = hypotheses.find((x) => x.id === req.hypothesis);
    if (h) score -= Math.abs(h.points);
  }
  for (const id of req.impute ?? []) {
    const w = whatIfs.find((x) => x.id === id);
    if (w) score += w.points;
  }

  score = Math.max(0, round2(score));
  return {
    new_score: score,
    delta: round2(score - alert.score),
    below_cutoff: cutoff !== null && score < cutoff,
  };
}
