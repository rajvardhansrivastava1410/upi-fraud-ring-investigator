import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { getAlerts } from '@/lib/api/client'
import { useWorkbenchStore } from '@/store/workbenchStore'
import { ConfidenceBand, AlertStatus } from '@/types/api'
import { formatCurrencyINR } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import {
  ListFilter,
  RefreshCw,
  AlertTriangle,
  HelpCircle,
} from 'lucide-react'

export const AlertQueuePane: React.FC = () => {
  const { selectedAlertId, setSelectedAlertId } = useWorkbenchStore()

  const {
    data: alerts = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['alerts'],
    queryFn: () => getAlerts({ k: 25 }),
  })

  // Confidence band styling
  const renderConfidenceBadge = (band: ConfidenceBand) => {
    switch (band) {
      case 'high':
        return <Badge variant="warning">High Conf</Badge>
      case 'medium':
        return <Badge variant="secondary">Med Conf</Badge>
      case 'low':
        return <Badge variant="outline">Low Conf</Badge>
    }
  }

  // Baseline badges
  const renderBaselineBadge = (tag?: string) => {
    switch (tag) {
      case 'ring_relay':
        return <span className="text-[10px] bg-amber-950/70 text-amber-300 px-1.5 py-0.5 rounded border border-amber-800/60 font-mono">Layering Ring</span>
      case 'shared_device':
        return <span className="text-[10px] bg-purple-950/70 text-purple-300 px-1.5 py-0.5 rounded border border-purple-800/60 font-mono">Shared POS/Kiosk</span>
      case 'shop_supplier':
        return <span className="text-[10px] bg-emerald-950/70 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-800/60 font-mono">Commercial Batch</span>
      case 'mule_burst':
        return <span className="text-[10px] bg-red-950/70 text-red-300 px-1.5 py-0.5 rounded border border-red-800/60 font-mono">Mule Burst</span>
      default:
        return null
    }
  }

  const renderStatusBadge = (status: AlertStatus) => {
    switch (status) {
      case 'open':
        return <Badge variant="warning">Open</Badge>
      case 'investigating':
        return <Badge variant="info">In Review</Badge>
      case 'acknowledged':
        return <Badge variant="secondary">Ack</Badge>
      case 'escalated':
        return <Badge variant="critical">Escalated</Badge>
      case 'closed':
        return <Badge variant="success">Closed</Badge>
    }
  }

  return (
    <div className="flex flex-col h-full border-r border-border bg-card/60 overflow-hidden">
      {/* Pane Header */}
      <div className="p-3 border-b border-border/80 flex items-center justify-between bg-card/90">
        <div className="flex items-center gap-2">
          <ListFilter className="h-4 w-4 text-amber-400" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-100">
            Ranked Queue
          </h2>
          <Badge variant="outline" className="text-[10px] font-mono">
            {alerts.length}
          </Badge>
        </div>

        <button
          onClick={() => refetch()}
          className="text-muted-foreground hover:text-white p-1 rounded transition-colors"
          title="Refresh Queue"
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Alert list body */}
      <div className="flex-1 overflow-y-auto divide-y divide-border/60">
        {isLoading && (
          <div className="py-16 text-center space-y-2">
            <RefreshCw className="h-5 w-5 text-amber-400 animate-spin mx-auto" />
            <p className="text-xs text-muted-foreground">Loading queue from synthetic feed...</p>
          </div>
        )}

        {isError && (
          <div className="p-4 text-center space-y-2">
            <AlertTriangle className="h-5 w-5 text-destructive mx-auto" />
            <p className="text-xs text-destructive">Failed to fetch alerts</p>
            <button
              onClick={() => refetch()}
              className="text-[11px] text-primary underline"
            >
              Retry
            </button>
          </div>
        )}

        {!isLoading && !isError && alerts.length === 0 && (
          <div className="p-6 text-center space-y-2">
            <HelpCircle className="h-6 w-6 text-muted-foreground/60 mx-auto" />
            <p className="text-xs text-slate-300 font-medium">No Alerts Pending</p>
            <p className="text-[11px] text-muted-foreground">Queue is currently clear.</p>
          </div>
        )}

        {!isLoading &&
          !isError &&
          alerts.map((alert) => {
            const isSelected = selectedAlertId === alert.id
            const priorityPercentage = Math.round(alert.risk_score * 100)

            return (
              <div
                key={alert.id}
                onClick={() => setSelectedAlertId(alert.id)}
                className={`p-3 cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-amber-950/30 border-l-4 border-amber-500 shadow-sm'
                    : 'hover:bg-accent/40 border-l-4 border-transparent'
                }`}
              >
                {/* Top line: Score, status, baseline badge */}
                <div className="flex items-center justify-between gap-1 mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-xs font-bold text-amber-400">
                      #{alert.id}
                    </span>
                    {renderStatusBadge(alert.status)}
                  </div>

                  <div className="flex items-center gap-1">
                    {renderConfidenceBadge(alert.confidence_band)}
                  </div>
                </div>

                {/* Score bar & Review Priority (Amber tone, never guilt red) */}
                <div className="space-y-1 mb-2">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-muted-foreground">Review Priority:</span>
                    <span className="font-mono font-semibold text-amber-300">
                      {priorityPercentage}% ({alert.risk_score.toFixed(2)})
                    </span>
                  </div>
                  <div className="w-full bg-muted/60 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        alert.risk_score >= 0.8
                          ? 'bg-amber-500'
                          : alert.risk_score >= 0.5
                          ? 'bg-amber-400/80'
                          : 'bg-slate-500'
                      }`}
                      style={{ width: `${priorityPercentage}%` }}
                    />
                  </div>
                </div>

                {/* Primary VPA & Volume */}
                <div className="text-[11px] text-slate-200 font-mono truncate mb-1">
                  {alert.primary_vpa}
                </div>

                <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-2">
                  <span>{formatCurrencyINR(alert.total_volume_minor)}</span>
                  <span>
                    {alert.node_count} nodes • {alert.hop_count} hops
                  </span>
                </div>

                {/* Top Reason summary */}
                {alert.explanation[0] && (
                  <div className="bg-card/70 p-1.5 rounded text-[10px] text-slate-300 border border-border/60 mb-2 leading-tight">
                    <span className="font-semibold text-amber-300">• </span>
                    {alert.explanation[0].text}
                  </div>
                )}

                {/* Baseline & Incomplete Tags */}
                <div className="flex items-center gap-1 flex-wrap">
                  {renderBaselineBadge(alert.baseline_tag)}
                  {alert.incomplete_records && (
                    <span className="text-[10px] bg-slate-800 text-slate-300 px-1 rounded font-mono">
                      Incomplete
                    </span>
                  )}
                  {alert.missing_data_warnings && alert.missing_data_warnings.length > 0 && (
                    <span className="text-[10px] text-amber-400/90 flex items-center gap-0.5">
                      <AlertTriangle className="h-2.5 w-2.5" />
                      <span>Missing Telemetry</span>
                    </span>
                  )}
                </div>
              </div>
            )
          })}
      </div>
    </div>
  )
}
