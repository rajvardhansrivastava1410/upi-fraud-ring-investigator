import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getAlertGraph, getAlerts } from '@/lib/api/client'
import { useWorkbenchStore } from '@/store/workbenchStore'
import { AlertQueuePane } from '@/features/queue/AlertQueuePane'
import { FraudGraphPane } from '@/features/graph/FraudGraphPane'
import { RightDetailPane } from '@/features/investigation/RightDetailPane'
import { RefreshCw, AlertOctagon } from 'lucide-react'

export const WorkbenchWorkspace: React.FC = () => {
  const { selectedAlertId, hops } = useWorkbenchStore()
  const [removedEdges, setRemovedEdges] = useState<string[]>([])

  // Fetch list to find current selected alert
  const { data: alerts = [] } = useQuery({
    queryKey: ['alerts'],
    queryFn: () => getAlerts({ k: 25 }),
  })

  const currentAlert =
    alerts.find((a) => a.id === selectedAlertId) || alerts[0]

  // Fetch graph for current alert
  const {
    data: subgraph,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['graph', currentAlert?.id, hops],
    queryFn: () => getAlertGraph(currentAlert.id, { hops }),
    enabled: !!currentAlert?.id,
  })

  if (!currentAlert) {
    return (
      <div className="py-24 text-center space-y-2">
        <p className="text-slate-300 text-sm">No alert selected</p>
      </div>
    )
  }

  return (
    <div className="flex-1 grid grid-cols-1 md:grid-cols-12 h-[calc(100vh-84px)] overflow-hidden">
      {/* Pane 1 (Left): Ranked Queue (3 cols) */}
      <div className="md:col-span-3 h-full overflow-hidden">
        <AlertQueuePane />
      </div>

      {/* Pane 2 (Centre): Interactive Cytoscape Graph (5 cols) */}
      <div className="md:col-span-5 h-full overflow-hidden">
        {isLoading && (
          <div className="h-full flex flex-col items-center justify-center space-y-2 bg-slate-950/80">
            <RefreshCw className="h-6 w-6 text-amber-400 animate-spin" />
            <p className="text-xs text-muted-foreground">Rendering 1–2 hop subgraph...</p>
          </div>
        )}

        {isError && (
          <div className="h-full flex flex-col items-center justify-center p-6 space-y-2 bg-slate-950/80">
            <AlertOctagon className="h-6 w-6 text-destructive" />
            <p className="text-xs text-destructive">Error loading graph</p>
            <button
              onClick={() => refetch()}
              className="text-xs text-primary underline"
            >
              Retry
            </button>
          </div>
        )}

        {!isLoading && !isError && subgraph && (
          <FraudGraphPane
            nodes={subgraph.nodes}
            edges={subgraph.edges}
            removedEdgeIds={removedEdges}
          />
        )}
      </div>

      {/* Pane 3 (Right): Evidence, Counterfactual & Decision (4 cols) */}
      <div className="md:col-span-4 h-full overflow-hidden">
        {subgraph && (
          <RightDetailPane
            alert={currentAlert}
            subgraph={subgraph}
            onRemovedEdgesChange={(edges) => setRemovedEdges(edges)}
          />
        )}
      </div>
    </div>
  )
}
