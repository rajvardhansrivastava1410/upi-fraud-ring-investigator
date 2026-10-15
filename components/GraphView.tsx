'use client';

import { useEffect, useRef, useState } from 'react';
import cytoscape, { type Core, type ElementDefinition } from 'cytoscape';
import { useStore } from '@/lib/store';
import { fmtINR } from '@/lib/format';
import type { AlertGraph, GraphEdge } from '@/lib/types';

// Node type is encoded by SHAPE:
// account = circle (green / red if flagged), device = diamond (white),
// merchant = rounded box (green), complaint = triangle (red).
// Evidence path edges are glowing crimson red (#ff003f).
const STYLE = [
  {
    selector: 'node',
    style: {
      label: 'data(label)',
      'font-size': 10,
      color: '#ffffff',
      'font-family': 'monospace',
      'font-weight': 'bold',
      'text-valign': 'bottom',
      'text-margin-y': 4,
      'text-wrap': 'ellipsis',
      'text-max-width': 90,
      'background-color': '#001a0a',
      'border-width': 2,
      'border-color': '#00ff66',
      width: 28,
      height: 28,
      'text-background-color': '#000000',
      'text-background-opacity': 0.9,
      'text-background-padding': 2,
    },
  },
  { selector: 'node[type = "account"]', style: { shape: 'ellipse' } },
  { selector: 'node[type = "device"]', style: { shape: 'diamond', width: 30, height: 30, 'border-color': '#ffffff', 'background-color': '#111111' } },
  { selector: 'node[type = "merchant"]', style: { shape: 'round-rectangle', width: 36, height: 24, 'border-color': '#00ff66' } },
  { selector: 'node[type = "complaint"]', style: { shape: 'triangle', width: 26, height: 26, 'border-color': '#ff003f', 'background-color': '#33000d' } },
  {
    selector: 'node.flagged',
    style: {
      'background-color': '#33000d',
      'border-color': '#ff003f',
      'border-width': 3,
      color: '#ff4d6d',
    },
  },
  {
    selector: 'edge',
    style: {
      width: 1.5,
      'line-color': '#005522',
      'target-arrow-color': '#00aa44',
      'target-arrow-shape': 'triangle',
      'arrow-scale': 0.9,
      'curve-style': 'bezier',
      opacity: 0.65,
      label: 'data(label)',
      'font-size': 9,
      color: '#00ff66',
      'font-family': 'monospace',
      'text-rotation': 'autorotate',
      'text-background-color': '#000000',
      'text-background-opacity': 0.9,
      'text-background-padding': 2,
    },
  },
  { selector: 'edge[type = "uses_device"]', style: { 'line-style': 'dotted', 'target-arrow-shape': 'none', 'line-color': '#888888' } },
  { selector: 'edge.incomplete', style: { 'line-style': 'dashed', 'line-color': '#ff003f' } },
  {
    selector: 'edge.evidence',
    style: {
      width: 3.5,
      'line-color': '#ff003f',
      'target-arrow-color': '#ff003f',
      opacity: 1,
      color: '#ff4d6d',
      'font-weight': 'bold',
      'z-index': 500,
    },
  },
  {
    selector: 'edge.selected',
    style: {
      width: 5,
      'line-color': '#ffffff',
      'target-arrow-color': '#ffffff',
      opacity: 1,
      'z-index': 999,
      color: '#ffffff',
      'font-weight': 'bold',
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
  const [tooltip, setTooltip] = useState<Tooltip>(null);

  const selectedEdgeId = useStore((s) => s.selectedEdgeId);
  const selectEdge = useStore((s) => s.selectEdge);

  useEffect(() => {
    if (!containerRef.current) return;

    const evidenceEdgeIds = new Set(graph.evidence_path);

    const elements: ElementDefinition[] = [
      ...graph.nodes.map((n) => ({
        group: 'nodes' as const,
        data: { id: n.id, label: n.label, type: n.type },
        classes: `${n.type} ${n.flagged ? 'flagged' : ''}`,
      })),
      ...graph.edges.map((e) => {
        const isEvidence = evidenceEdgeIds.has(e.id);
        const classes = [
          e.type,
          isEvidence ? 'evidence' : '',
          e.incomplete ? 'incomplete' : '',
        ]
          .filter(Boolean)
          .join(' ');
        return {
          group: 'edges' as const,
          data: {
            id: e.id,
            source: e.source,
            target: e.target,
            label: edgeLabel(e),
            type: e.type,
          },
          classes,
        };
      }),
    ];

    const cy = cytoscape({
      container: containerRef.current,
      elements,
      style: STYLE as cytoscape.StylesheetStyle[],
      layout: LAYOUT,
      wheelSensitivity: 0.25,
      minZoom: 0.3,
      maxZoom: 3,
    });

    cyRef.current = cy;

    cy.on('tap', 'edge', (evt) => {
      selectEdge(evt.target.id());
    });
    cy.on('tap', (evt) => {
      if (evt.target === cy) selectEdge(null);
    });

    cy.on('mouseover', 'node', (evt) => {
      const node = evt.target;
      const pos = node.renderedPosition();
      setTooltip({
        x: pos.x,
        y: pos.y - 15,
        label: node.data('label') as string,
        type: node.data('type') as string,
      });
    });
    cy.on('mouseout', 'node', () => setTooltip(null));

    return () => {
      cy.destroy();
      cyRef.current = null;
      setTooltip(null);
    };
  }, [graph, selectEdge]);

  // Reflect the selected edge
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;
    cy.edges().removeClass('selected');
    if (selectedEdgeId) {
      const edge = cy.getElementById(selectedEdgeId);
      if (edge.nonempty()) edge.addClass('selected');
    }
  }, [selectedEdgeId, graph]);

  // "Reset view" button
  useEffect(() => {
    if (layoutKey === 0) return;
    cyRef.current?.layout(LAYOUT).run();
  }, [layoutKey]);

  return (
    <div ref={containerRef} className="relative h-full w-full bg-black">
      {tooltip && (
        <div
          className="pointer-events-none absolute z-10 rounded bg-black/95 border border-green-500/80 px-2.5 py-1.5 text-xs text-white shadow-[0_0_15px_rgba(0,255,102,0.4)] font-mono"
          style={{ left: tooltip.x, top: tooltip.y, transform: 'translate(-50%, -100%)' }}
          aria-hidden="true"
        >
          <p className="font-bold text-white">{tooltip.label}</p>
          <p className="text-green-400 text-[10px]">{NODE_TYPE_LABEL[tooltip.type] ?? tooltip.type}</p>
        </div>
      )}
    </div>
  );
}
