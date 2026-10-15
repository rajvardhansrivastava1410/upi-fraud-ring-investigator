import React, { useEffect, useRef } from 'react'
import cytoscape from 'cytoscape'
import { GraphNodeData, GraphEdgeData } from '@/types/api'
import { formatCurrencyINR } from '@/lib/utils'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Info,
  Layers,
} from 'lucide-react'

interface FraudGraphProps {
  nodes: GraphNodeData[]
  edges: GraphEdgeData[]
  selectedElement: GraphNodeData | GraphEdgeData | null
  onSelectNode: (node: GraphNodeData) => void
  onSelectEdge: (edge: GraphEdgeData) => void
  onClearSelection: () => void
}

export const FraudGraph: React.FC<FraudGraphProps> = ({
  nodes,
  edges,
  selectedElement,
  onSelectNode,
  onSelectEdge,
  onClearSelection,
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const cyRef = useRef<cytoscape.Core | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    // Transform API node/edge shapes to Cytoscape element definitions
    const elements: cytoscape.ElementDefinition[] = [
      ...nodes.map((n) => ({
        data: {
          id: n.id,
          label: n.label,
          type: n.type,
          is_focal: n.is_focal ? 'true' : 'false',
          risk_score: n.risk_score || 0.5,
          rawNode: n,
        },
      })),
      ...edges.map((e) => ({
        data: {
          id: e.id,
          source: e.source,
          target: e.target,
          label:
            e.amount_minor > 0
              ? formatCurrencyINR(e.amount_minor)
              : e.evidence_type === 'shared_device'
              ? 'Shared Device'
              : '',
          evidence_type: e.evidence_type,
          is_evidence_path: e.is_evidence_path ? 'true' : 'false',
          rawEdge: e,
        },
      })),
    ]

    const cy = cytoscape({
      container: containerRef.current,
      elements,
      style: [
        {
          selector: 'node',
          style: {
            'background-color': '#1e293b',
            'border-width': 2,
            'border-color': '#475569',
            label: 'data(label)',
            color: '#f8fafc',
            'font-size': '11px',
            'font-family': 'monospace',
            'text-valign': 'bottom',
            'text-margin-y': 6,
            width: 38,
            height: 38,
          },
        },
        // Focal node (compromised source)
        {
          selector: 'node[is_focal = "true"]',
          style: {
            'background-color': '#7f1d1d',
            'border-color': '#ef4444',
            'border-width': 3,
            width: 46,
            height: 46,
          },
        },
        // Device nodes
        {
          selector: 'node[type = "device"]',
          style: {
            shape: 'diamond',
            'background-color': '#581c87',
            'border-color': '#a855f7',
            width: 36,
            height: 36,
          },
        },
        // Merchant nodes
        {
          selector: 'node[type = "merchant"]',
          style: {
            shape: 'round-rectangle',
            'background-color': '#064e3b',
            'border-color': '#10b981',
            width: 44,
            height: 36,
          },
        },
        // Edge defaults
        {
          selector: 'edge',
          style: {
            width: 2.5,
            'line-color': '#334155',
            'target-arrow-color': '#334155',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            label: 'data(label)',
            'font-size': '10px',
            'font-family': 'monospace',
            color: '#94a3b8',
            'text-background-opacity': 0.85,
            'text-background-color': '#020617',
            'text-background-padding': '2px',
          },
        },
        // Evidence path edges
        {
          selector: 'edge[is_evidence_path = "true"]',
          style: {
            'line-color': '#ef4444',
            'target-arrow-color': '#ef4444',
            width: 3.5,
          },
        },
        // Device association edges (dashed)
        {
          selector: 'edge[evidence_type = "shared_device"]',
          style: {
            'line-style': 'dashed',
            'line-color': '#a855f7',
            'target-arrow-shape': 'none',
            width: 2,
          },
        },
        // Selected element styling
        {
          selector: ':selected',
          style: {
            'border-width': 4,
            'border-color': '#38bdf8',
            'line-color': '#38bdf8',
            'target-arrow-color': '#38bdf8',
          },
        },
      ],
      layout: {
        name: 'breadthfirst',
        directed: true,
        padding: 40,
        spacingFactor: 1.35,
      },
    })

    // Click handler for nodes
    cy.on('tap', 'node', (evt) => {
      const node = evt.target
      const raw = node.data('rawNode') as GraphNodeData
      if (raw) onSelectNode(raw)
    })

    // Click handler for edges
    cy.on('tap', 'edge', (evt) => {
      const edge = evt.target
      const raw = edge.data('rawEdge') as GraphEdgeData
      if (raw) onSelectEdge(raw)
    })

    // Background click to clear
    cy.on('tap', (evt) => {
      if (evt.target === cy) {
        onClearSelection()
      }
    })

    cyRef.current = cy

    return () => {
      cy.destroy()
    }
  }, [nodes, edges])

  // Center/Zoom controls
  const handleZoomIn = () => cyRef.current?.zoom(cyRef.current.zoom() * 1.25)
  const handleZoomOut = () => cyRef.current?.zoom(cyRef.current.zoom() * 0.8)
  const handleFit = () => cyRef.current?.fit(undefined, 30)

  return (
    <Card className="flex flex-col h-full overflow-hidden">
      <CardHeader className="py-2 px-3 border-b border-border/80 flex flex-row items-center justify-between bg-card/60">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-primary" />
          <CardTitle className="text-xs font-semibold">
            Interactive Fraud-Ring Topology Graph (Cytoscape.js)
          </CardTitle>
          <Badge variant="outline" className="text-[10px]">
            {nodes.length} Nodes • {edges.length} Edges
          </Badge>
        </div>

        {/* Viewport Control Buttons */}
        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            onClick={handleZoomIn}
            className="h-7 w-7 text-slate-300"
            title="Zoom In"
            aria-label="Zoom in on graph"
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={handleZoomOut}
            className="h-7 w-7 text-slate-300"
            title="Zoom Out"
            aria-label="Zoom out on graph"
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={handleFit}
            className="h-7 w-7 text-slate-300"
            title="Fit to Viewport"
            aria-label="Fit graph to viewport"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardHeader>

      {/* Graph canvas container */}
      <div className="relative flex-1 bg-slate-950/80 min-h-[420px]">
        <div
          ref={containerRef}
          className="w-full h-full min-h-[420px]"
          aria-label="Cytoscape network graph canvas"
        />

        {/* Legend Overlay */}
        <div className="absolute bottom-2 left-2 bg-card/90 border border-border/80 rounded p-2 text-[10px] space-y-1 shadow-md pointer-events-none">
          <div className="font-semibold text-slate-300 uppercase tracking-wider text-[9px]">Legend</div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-red-600" />
            <span>Focal / Layered Account</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rotate-45 bg-purple-500" />
            <span>Shared Device (SYN-DEV)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded bg-emerald-500" />
            <span>Merchant Cashout</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-red-500" />
            <span>Evidence Path Edge</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 border-b border-dashed border-purple-400" />
            <span>Hardware Association</span>
          </div>
        </div>

        {/* Selection helper hint */}
        {!selectedElement && (
          <div className="absolute top-2 right-2 bg-card/80 border border-border/60 text-[10px] text-muted-foreground px-2 py-1 rounded flex items-center gap-1 pointer-events-none">
            <Info className="h-3 w-3 text-sky-400" />
            <span>Click any node or transaction edge to inspect evidence</span>
          </div>
        )}
      </div>
    </Card>
  )
}
