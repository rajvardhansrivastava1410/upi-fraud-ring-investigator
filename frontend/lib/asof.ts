import type { AlertGraph } from './types';

export type TimeMode = 'ingest' | 'event';
type Edge = AlertGraph['edges'][number];

const edgeTime = (e: Edge, mode: TimeMode) =>
  Date.parse(mode === 'ingest' ? e.ingest_time : e.event_time);

/** Sorted unique timestamps (ms) the slider can snap to. */
export function timePoints(g: AlertGraph, mode: TimeMode): number[] {
  const set = new Set<number>();
  for (const e of g.edges) {
    const t = edgeTime(e, mode);
    if (!Number.isNaN(t)) set.add(t);
  }
  return [...set].sort((a, b) => a - b);
}

/** Index of the last point at or before ms (0 if ms is earlier than all points). */
export function indexAtOrBefore(points: number[], ms: number): number {
  let idx = 0;
  for (let i = 0; i < points.length; i++) {
    if (points[i] <= ms) idx = i;
    else break;
  }
  return idx;
}

/** Edges not yet visible at asOf. */
export function hiddenEdgeIds(g: AlertGraph, asOf: number, mode: TimeMode): string[] {
  return g.edges.filter((e) => edgeTime(e, mode) > asOf).map((e) => e.id);
}

/** Subgraph visible at asOf. asOf = null means "latest": return the full graph. */
export function filterGraph(g: AlertGraph, asOf: number | null, mode: TimeMode): AlertGraph {
  if (asOf == null) return g;
  const edges = g.edges.filter((e) => edgeTime(e, mode) <= asOf);
  const keep = new Set(edges.map((e) => e.id));
  const touched = new Set<string>();
  for (const e of edges) { touched.add(e.source); touched.add(e.target); }
  return {
    ...g,
    nodes: g.nodes.filter((n) => touched.has(n.id)),
    edges,
    evidence_path: g.evidence_path.filter((id) => keep.has(id)),
  };
}

/** Events that had already happened at asOf but had not yet been ingested. */
export function pendingEdges(g: AlertGraph, asOf: number): Edge[] {
  return g.edges.filter(
    (e) => Date.parse(e.event_time) <= asOf && Date.parse(e.ingest_time) > asOf,
  );
}
