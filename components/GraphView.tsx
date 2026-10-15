'use client';

import { useEffect, useRef, useState } from 'react';
import cytoscape, { type Core, type ElementDefinition } from 'cytoscape';
import { useStore } from '@/lib/store';
import { fmtINR } from '@/lib/format';
import type { AlertGraph, GraphEdge } from '@/lib/types';

// Node type is encoded by SHAPE (account = circle, device = diamond,
// merchant = rounded box, complaint = triangle). Amber means "on the evidence
// path", not "guilty".
const STYLE = [
  {
    selector: 'node',
    style: {
      label: 'data(label)',
      'font-size': 10,
      color: '#cbd5e1',
      'text-valign': 'bottom',
      'text-margin-y': 4,
      'text-wrap': 'ellipsis',
      'text-max-width': 90,
      'background-color': '#334155',
      'border-width': 1.5,
      'border-color': '#64748b',
      width: 26,
      height: 26,
      'text-background-color': '#020617',
      'text-background-opacity': 0.75,
      'text-background-padding': 2,
    },
  },
  { selector: 'node[type = "account"]', style: { shape: 'ellipse' } },
  { selector: 'node[type = "device"]', style: { shape: 'diamond', width: 30, height: 30 } },
  { selector: 'node[type = "merchant"]', style: { shape: 'round-rectangle', width: 36, height: 24 } },
  { selector: 'node[type = "complaint"]', style: { shape: 'triangle', width: 24, height: 24 } },
  {
    selector: 'node.flagged',
    style: { 'background-color': '#92400e', 'border-color': '#fbbf24', 'border-width': 2.5 },
  },
  {
    selector: 'edge',
    style: {
      width: 1.2,
      'line-color': '#475569',
      'target-arrow-color': '#475569',
      'target-arrow-shape': 'triangle',
      'arrow-scale': 0.9,
      'curve-style': 'bezier',
      opacity: 0.55,
      label: 'data(label)',
      'font-size': 9,
      color: '#94a3b8',
      'text-rotation': 'autorotate',
      'text-background-color': '#020617',
      'text-background-opacity': 0.85,
      'text-background-padding': 2,
    },
  },
  { selector: 'edge[type = "uses_device"]', style: { 'line-style': 'dotted', 'target-arrow-shape': 'none' } },
  { selector: 'edge.incomplete', style: { 'line-style': 'dashed' } },
  {
    selector: 'edge.evidence',
    style: { width: 3, 'line-color': '#fbbf24', 'target-arrow-color': '#fbbf24', opacity: 1, color: '#fde68a' },
  },
  {
    selector: 'edge.selected',
    style: {
      width: 5,
      'line-color': '#fef3c7',
      'target-arrow-color': '#fef3c7',
      opacity: 1,
      'z-index': 999,
      color: '#ffffff',
    },
  },
];

function edgeLabel(e: GraphEdge) {
  switch (e.type) {
    case 'transfer':
    case 'pays_merchant':
      return fmtINR(e.amount);
    case 'collect_request':
      return 'collect';
    case 'uses_device':
      return 'uses';
    case 'complaint_about':
      return 'complaint';
    default:
      return '';
  }
}

const LAYOUT = {
  name: 'cose',
  animate: false,
  fit: true,
  padding: 50,
  randomize: true,
  nodeDimensionsIncludeLabels: true,
  idealEdgeLength: 150,
  nodeRepulsion: 60000,
  edgeElasticity: 100,
  gravity: 0.25,
  numIter: 2000,
  componentSpacing: 80,
} as cytoscape.LayoutOptions;

type Props = { graph: AlertGraph; layoutKey: number };

type Tooltip = { x: number; y: number; label: string; type: string } | null;

const NODE_TYPE_LABEL: Record<string, string> = {
  account: 'Account',
  device: 'Device',
  merchant: 'Merchant',
  complaint: 'Complaint',
};

export default function GraphView({ graph, layoutKey }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | null>(null);
  const selectedEdgeId = useStore((s) => s.selectedEdgeId);
  const selectEdge = useStore((s) => s.selectEdge);
  const [tooltip, setTooltip] = useState<Tooltip>(null);

  // Build the graph whenever the alert's data changes.
  useEffect(() => {
    if (!containerRef.current) return;

    const evidence = new Set(graph.evidence_path);
    const flagged = new Set<string>();
    graph.edges.forEach((e) => {
      if (evidence.has(e.id)) {
        flagged.add(e.source);
        flagged.add(e.target);
      }
    });

    const elements: ElementDefinition[] = [
      ...graph.nodes.map((n) => ({
        group: 'nodes' as const,
        data: { id: n.id, label: n.label, type: n.type },
        classes: flagged.has(n.id) ? 'flagged' : '',
      })),
      ...graph.edges.map((e) => ({
        group: 'edges' as const,
        data: { id: e.id, source: e.source, target: e.target, type: e.type, label: edgeLabel(e) },
        classes: [evidence.has(e.id) ? 'evidence' : '', e.incomplete ? 'incomplete' : '']
          .filter(Boolean)
          .join(' '),
      })),
    ];

    const cy = cytoscape({
      container: containerRef.current,
      elements,
      style: STYLE as never, // cytoscape's stylesheet typing is stricter than needed here
      layout: LAYOUT,
      wheelSensitivity: 0.25,
      minZoom: 0.3,
      maxZoom: 3,
    });

    cy.on('tap', 'edge', (evt) => selectEdge(evt.target.id()));
    cy.on('tap', (evt) => {
      if (evt.target === cy) selectEdge(null);
    });

    // Node tooltips
    cy.on('mouseover', 'node', (evt) => {
      const node = evt.target;
      const pos = node.renderedPosition();
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      setTooltip({
        x: pos.x,
        y: pos.y - 20,
        label: node.data('label') as string,
        type: node.data('type') as string,
      });
    });
    cy.on('mouseout', 'node', () => setTooltip(null));
    cy.on('tap', 'node', () => setTooltip(null));

    const ro = new ResizeObserver(() => {
      cy.resize();
    });
    if (containerRef.current) {
      ro.observe(containerRef.current);
    }

    cyRef.current = cy;
    return () => {
      ro.disconnect();
      cy.destroy();
      cyRef.current = null;
      setTooltip(null);
    };
  }, [graph, selectEdge]);

  // Reflect the selected edge (set from the graph or from the evidence timeline).
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;
    cy.edges().removeClass('selected');
    if (selectedEdgeId) {
      const edge = cy.getElementById(selectedEdgeId);
      if (edge.nonempty()) edge.addClass('selected');
    }
  }, [selectedEdgeId, graph]);

  // "Reset view" button.
  useEffect(() => {
    if (layoutKey === 0) return;
    cyRef.current?.layout(LAYOUT).run();
  }, [layoutKey]);

  return (
    <div ref={containerRef} className="relative h-full w-full">
      {tooltip && (
        <div
          className="pointer-events-none absolute z-10 rounded bg-slate-800 border border-slate-700 px-2.5 py-1.5 text-xs shadow-lg"
          style={{ left: tooltip.x, top: tooltip.y, transform: 'translate(-50%, -100%)' }}
          aria-hidden="true"
        >
          <p className="font-medium text-slate-100">{tooltip.label}</p>
          <p className="text-slate-400">{NODE_TYPE_LABEL[tooltip.type] ?? tooltip.type}</p>
        </div>
      )}
    </div>
  );
}

