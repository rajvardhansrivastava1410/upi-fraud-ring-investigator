import React, { useEffect, useRef } from 'react'
import cytoscape from 'cytoscape'
import { GraphNodeData, GraphEdgeData } from '@/types/api'
import { formatCurrencyINR } from '@/lib/utils'
import { useWorkbenchStore } from '@/store/workbenchStore'
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Clock,
  Filter,
  Layers,
  Info,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface FraudGraphPaneProps {
  nodes: GraphNodeData[]
  edges: GraphEdgeData[]
  removedEdgeIds?: string[]
}

export const FraudGraphPane: React.FC<FraudGraphPaneProps> = ({
  nodes,
  edges,
  removedEdgeIds = [],
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const cyRef = useRef<cytoscape.Core | null>(null)

  const {
    selectedEdgeId,
    selectedNodeId,
    highlightedEdgeId,
    timeMode,
    hops,
    filterType,
    setSelectedEdgeId,
    setSelectedNodeId,
    setTimeMode,
    setHops,
    setFilterType,
  } = useWorkbenchStore()

  useEffect(() => {
    if (!containerRef.current) return

    // Apply filter types (accounts, devices, merchants)
    let filteredNodes = [...nodes]
    if (filterType !== 'all') {
      filteredNodes = filteredNodes.filter((n) => n.type === filterType)
    }
    const nodeIds = new Set(filteredNodes.map((n) => n.id))

    // Filter edges connected to existing nodes and exclude removed counterfactual edges
    const activeEdges = edges.filter(
      (e) =>
        nodeIds.has(e.source) &&
        nodeIds.has(e.target) &&
        !removedEdgeIds.includes(e.id)
    )

    const elements: cytoscape.ElementDefinition[] = [
      ...filteredNodes.map((n) => ({
        data: {
          id: n.id,
          label: n.label,
          type: n.type,
          is_focal: n.is_focal ? 'true' : 'false',
          incomplete: n.incomplete ? 'true' : 'false',
          risk_score: n.risk_score || 0.5,
          rawNode: n,
        },
      })),
      ...activeEdges.map((e) => ({
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
          is_dimmed: e.is_dimmed ? 'true' : 'false',
          incomplete: e.incomplete ? 'true' : 'false',
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
            width: 36,
            height: 36,
          },
        },
        // Focal account (amber review tone)
        {
          selector: 'node[is_focal = "true"]',
          style: {
            'background-color': '#78350f',
            'border-color': '#f59e0b',
            'border-width': 3,
            width: 44,
            height: 44,
          },
        },
        // Device nodes
        {
          selector: 'node[type = "device"]',
          style: {
            shape: 'diamond',
            'background-color': '#581c87',
            'border-color': '#c084fc',
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
            'border-color': '#34d399',
            width: 44,
            height: 34,
          },
        },
        // Incomplete records styling (dashed border)
        {
          selector: 'node[incomplete = "true"]',
          style: {
            'border-style': 'dashed',
            'border-color': '#f59e0b',
          },
        },
        // Default edge
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
        // Evidence path edges (Amber highlight)
        {
          selector: 'edge[is_evidence_path = "true"]',
          style: {
            'line-color': '#f59e0b',
            'target-arrow-color': '#f59e0b',
            width: 3.5,
          },
        },
        // Dimmed unrelated edges
        {
          selector: 'edge[is_dimmed = "true"]',
          style: {
            opacity: 0.25,
            'line-color': '#475569',
            'target-arrow-color': '#475569',
            width: 1.5,
          },
        },
        // Shared device dashed links
        {
          selector: 'edge[evidence_type = "shared_device"]',
          style: {
            'line-style': 'dashed',
            'line-color': '#c084fc',
            'target-arrow-shape': 'none',
            width: 2,
          },
        },
        // Incomplete edge (dashed amber)
        {
          selector: 'edge[incomplete = "true"]',
          style: {
            'line-style': 'dashed',
            'line-color': '#fbbf24',
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
      setSelectedNodeId(node.id())
    })

    // Click handler for edges
    cy.on('tap', 'edge', (evt) => {
      const edge = evt.target
      setSelectedEdgeId(edge.id())
    })

    // Clear selection on background tap
    cy.on('tap', (evt) => {
      if (evt.target === cy) {
        setSelectedNodeId(null)
        setSelectedEdgeId(null)
      }
    })

    cyRef.current = cy

    return () => {
      cy.destroy()
    }
  }, [nodes, edges, filterType, removedEdgeIds])

  // Update dynamic highlight when timeline item or selection changes
  useEffect(() => {
    if (!cyRef.current) return
    const cy = cyRef.current

    cy.elements().removeClass('highlighted-elem')
    const targetEdge = highlightedEdgeId || selectedEdgeId

    if (targetEdge) {
      const edgeElem = cy.$(`edge[id = "${targetEdge}"]`)
      if (edgeElem.length > 0) {
        edgeElem.style({
          'line-color': '#38bdf8',
          'target-arrow-color': '#38bdf8',
          width: 5,
        })
      }
    }

    if (selectedNodeId) {
      const nodeElem = cy.$(`node[id = "${selectedNodeId}"]`)
      if (nodeElem.length > 0) {
        nodeElem.style({
          'border-color': '#38bdf8',
          'border-width': 4,
        })
      }
    }
  }, [highlightedEdgeId, selectedEdgeId, selectedNodeId])

  const handleZoomIn = () => cyRef.current?.zoom(cyRef.current.zoom() * 1.25)
  const handleZoomOut = () => cyRef.current?.zoom(cyRef.current.zoom() * 0.8)
  const handleFit = () => cyRef.current?.fit(undefined, 30)

  return (
    <div className="flex flex-col h-full bg-slate-950/70 border-r border-border overflow-hidden">
      {/* Top Toolbar */}
      <div className="p-2.5 border-b border-border/80 flex flex-wrap items-center justify-between gap-2 bg-card/90">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-amber-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-100">
            Graph Explorer (1–2 Hops)
          </span>
          <Badge variant="outline" className="text-[10px] font-mono">
            {nodes.length} Nodes • {edges.length} Edges
          </Badge>
        </div>

        {/* Controls: Hops, Time-Mode, Filter, Zoom */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          {/* Hops toggle */}
          <div className="flex items-center border border-border rounded overflow-hidden text-[11px]">
            <button
              onClick={() => setHops(1)}
              className={`px-2 py-0.5 ${
                hops === 1 ? 'bg-primary text-white font-bold' : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              1 Hop
            </button>
            <button
              onClick={() => setHops(2)}
              className={`px-2 py-0.5 ${
                hops === 2 ? 'bg-primary text-white font-bold' : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              2 Hops
            </button>
          </div>

          {/* Time mode toggle */}
          <div className="flex items-center border border-border rounded overflow-hidden text-[11px]">
            <button
              onClick={() => setTimeMode('event_time')}
              className={`flex items-center gap-1 px-2 py-0.5 ${
                timeMode === 'event_time'
                  ? 'bg-amber-600 text-white font-bold'
                  : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              <Clock className="h-3 w-3" />
              <span>Event-Time</span>
            </button>
            <button
              onClick={() => setTimeMode('ingest_time')}
              className={`flex items-center gap-1 px-2 py-0.5 ${
                timeMode === 'ingest_time'
                  ? 'bg-amber-600 text-white font-bold'
                  : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              <Clock className="h-3 w-3" />
              <span>Ingest-Time</span>
            </button>
          </div>

          {/* Entity filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="h-6 text-[11px] bg-card border border-border rounded px-1 text-slate-200"
          >
            <option value="all">All Entities</option>
            <option value="account">Accounts Only</option>
            <option value="device">Devices Only</option>
            <option value="merchant">Merchants Only</option>
          </select>

          {/* Zoom controls */}
          <div className="flex items-center gap-1">
            <button
              onClick={handleZoomIn}
              className="p-1 rounded text-muted-foreground hover:text-white hover:bg-muted"
              title="Zoom In"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={handleZoomOut}
              className="p-1 rounded text-muted-foreground hover:text-white hover:bg-muted"
              title="Zoom Out"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={handleFit}
              className="p-1 rounded text-muted-foreground hover:text-white hover:bg-muted"
              title="Fit View"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Cytoscape Canvas Container */}
      <div className="relative flex-1 bg-slate-950/80 min-h-[380px]">
        <div ref={containerRef} className="w-full h-full min-h-[380px]" />

        {/* Legend */}
        <div className="absolute bottom-2 left-2 bg-card/95 border border-border rounded p-2 text-[10px] space-y-1 shadow-lg pointer-events-none">
          <div className="font-semibold text-slate-200 uppercase tracking-wider text-[9px]">Legend</div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            <span>Focal / Layered Account</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rotate-45 bg-purple-400" />
            <span>Hardware Fingerprint (SYN-DEV)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded bg-emerald-400" />
            <span>Merchant Cashout</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-amber-400" />
            <span>Evidence Path Edge</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 border-b border-dashed border-amber-300" />
            <span>Incomplete / Late Record</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-slate-600 opacity-40" />
            <span>Dimmed Unrelated Edge</span>
          </div>
        </div>

        {/* Active Time Mode Badge */}
        <div className="absolute top-2 right-2 bg-card/90 border border-border text-[10px] px-2 py-0.5 rounded font-mono text-amber-300">
          Showing: {timeMode === 'event_time' ? 'Event-Time (UTC)' : 'Ingest-Time Pipeline (UTC)'}
        </div>
      </div>
    </div>
  )
}
