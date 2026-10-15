import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getHypotheses,
  runCounterfactual,
  submitDecision,
  getDecisionHistory,
} from '@/lib/api/client'
import { useWorkbenchStore } from '@/store/workbenchStore'
import {
  SubgraphResponse,
  AlertSummary,
  DecisionRequest,
} from '@/types/api'
import { formatCurrencyINR, formatDateTime } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import {
  FileText,
  Sparkles,
  CheckCircle,
  AlertTriangle,
  History,
  TrendingDown,
  Layers,
  ArrowRight,
  ShieldCheck,
  Send,
} from 'lucide-react'

interface RightDetailPaneProps {
  alert: AlertSummary
  subgraph: SubgraphResponse
  onRemovedEdgesChange: (edgeIds: string[]) => void
}

export const RightDetailPane: React.FC<RightDetailPaneProps> = ({
  alert,
  subgraph,
  onRemovedEdgesChange,
}) => {
  const queryClient = useQueryClient()
  const {
    activeTab,
    setActiveTab,
    timeMode,
    selectedEdgeId,
    selectedNodeId,
    setHighlightedEdgeId,
  } = useWorkbenchStore()

  // Counterfactual edge toggles
  const [removedEdges, setRemovedEdges] = useState<string[]>([])

  // Decision form state
  const [decisionType, setDecisionType] = useState<
    'confirm' | 'dismiss' | 'needs_more_info'
  >('confirm')
  const [decisionNote, setDecisionNote] = useState<string>('')
  const [decisionError, setDecisionError] = useState<string | null>(null)
  const [successBanner, setSuccessBanner] = useState<string | null>(null)

  // Fetch benign hypotheses
  const { data: hypotheses = [] } = useQuery({
    queryKey: ['hypotheses', alert.id],
    queryFn: () => getHypotheses(alert.id),
  })

  // Fetch append-only decision history
  const { data: decisionHistory = [] } = useQuery({
    queryKey: ['decisions', alert.id],
    queryFn: () => getDecisionHistory(alert.id),
  })

  // Counterfactual mutation
  const counterfactualMutation = useMutation({
    mutationFn: (edgeIds: string[]) =>
      runCounterfactual(alert.id, { removed_edge_ids: edgeIds }),
  })

  // Decision submit mutation
  const decisionMutation = useMutation({
    mutationFn: (payload: DecisionRequest) => submitDecision(alert.id, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['decisions', alert.id] })
      queryClient.invalidateQueries({ queryKey: ['alerts'] })
      setDecisionNote('')
      setDecisionError(null)
      setSuccessBanner(
        `Decision '${data.decision}' recorded to audit log (${data.id}).`
      )
      setTimeout(() => setSuccessBanner(null), 4000)
    },
  })

  const handleToggleEdge = (edgeId: string) => {
    const next = removedEdges.includes(edgeId)
      ? removedEdges.filter((id) => id !== edgeId)
      : [...removedEdges, edgeId]

    setRemovedEdges(next)
    onRemovedEdgesChange(next)
    counterfactualMutation.mutate(next)
  }

  const handleResetCounterfactual = () => {
    setRemovedEdges([])
    onRemovedEdgesChange([])
    counterfactualMutation.mutate([])
  }

  const handleSubmitDecision = (e: React.FormEvent) => {
    e.preventDefault()
    if (!decisionNote.trim()) {
      setDecisionError('Analyst note is mandatory before submitting a decision.')
      return
    }
    decisionMutation.mutate({
      decision: decisionType,
      note: decisionNote.trim(),
    })
  }

  const simulated = counterfactualMutation.data

  return (
    <div className="flex flex-col h-full bg-card/80 overflow-hidden">
      {/* Tab Switcher */}
      <div className="flex border-b border-border/80 bg-card/90">
        <button
          onClick={() => setActiveTab('evidence')}
          className={`flex-1 py-2.5 px-3 text-xs font-semibold flex items-center justify-center gap-1.5 border-b-2 transition-all ${
            activeTab === 'evidence'
              ? 'border-amber-400 text-amber-300 bg-amber-950/20'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <FileText className="h-3.5 w-3.5" />
          <span>Evidence</span>
        </button>

        <button
          onClick={() => setActiveTab('counterfactual')}
          className={`flex-1 py-2.5 px-3 text-xs font-semibold flex items-center justify-center gap-1.5 border-b-2 transition-all ${
            activeTab === 'counterfactual'
              ? 'border-amber-400 text-amber-300 bg-amber-950/20'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>Counterfactual</span>
        </button>

        <button
          onClick={() => setActiveTab('decision')}
          className={`flex-1 py-2.5 px-3 text-xs font-semibold flex items-center justify-center gap-1.5 border-b-2 transition-all ${
            activeTab === 'decision'
              ? 'border-amber-400 text-amber-300 bg-amber-950/20'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <CheckCircle className="h-3.5 w-3.5" />
          <span>Decision</span>
        </button>
      </div>

      {/* Tab Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* ================= EVIDENCE TAB ================= */}
        {activeTab === 'evidence' && (
          <div className="space-y-4 text-xs">
            {/* Missing Data Warnings */}
            {subgraph.missing_data_warnings.length > 0 && (
              <div className="p-3 bg-amber-950/40 border border-amber-800/80 rounded-md text-amber-200 space-y-1">
                <div className="flex items-center gap-1.5 font-semibold text-[11px] uppercase tracking-wider text-amber-300">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  <span>Missing Data & Pipeline Latency Warning</span>
                </div>
                {subgraph.missing_data_warnings.map((w, i) => (
                  <p key={i} className="text-[11px] leading-relaxed text-amber-200/90">
                    • {w}
                  </p>
                ))}
              </div>
            )}

            {/* Selected Graph Edge or Node Inspection Card */}
            {selectedEdgeId && (
              <div className="p-3 bg-slate-900/90 border-2 border-amber-400/90 rounded-md space-y-2 shadow-lg">
                <div className="flex items-center justify-between border-b border-border/80 pb-1.5">
                  <span className="font-mono font-bold text-amber-300 flex items-center gap-1.5">
                    <Layers className="h-3.5 w-3.5" />
                    <span>Selected Edge: {selectedEdgeId}</span>
                  </span>
                  <Badge variant="warning" className="text-[10px]">Graph Inspection</Badge>
                </div>
                {(() => {
                  const edge = subgraph.edges.find((e) => e.id === selectedEdgeId)
                  if (!edge) return <p className="text-muted-foreground">Edge data unavailable.</p>
                  return (
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <span className="text-muted-foreground block text-[10px]">TRANSACTION ID:</span>
                        <span className="font-mono text-slate-100 font-semibold">{edge.transaction_id}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[10px]">AMOUNT:</span>
                        <span className="font-mono text-emerald-300 font-semibold">
                          {edge.amount_minor > 0 ? formatCurrencyINR(edge.amount_minor) : 'Non-financial Signal'}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[10px]">EVIDENCE TYPE:</span>
                        <span className="font-mono text-amber-300">{edge.evidence_type}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[10px]">TIME (UTC):</span>
                        <span className="text-slate-300 font-mono text-[10px]">
                          {formatDateTime(timeMode === 'event_time' ? edge.occurred_at : edge.ingested_at)}
                        </span>
                      </div>
                    </div>
                  )
                })()}
              </div>
            )}

            {/* Score Breakdown Waterfall */}
            <div className="p-3 bg-muted/40 border border-border rounded-md space-y-2">
              <div className="font-semibold text-slate-100 flex items-center justify-between">
                <span>Score-Breakdown Waterfall</span>
                <span className="font-mono text-amber-300 text-xs">
                  Priority: {(alert.risk_score * 100).toFixed(0)}%
                </span>
              </div>
              <div className="space-y-1.5 text-[11px]">
                {subgraph.waterfall.map((wf, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <span className="text-slate-300">{wf.factor}</span>
                    <span
                      className={`font-mono font-semibold ${
                        wf.impact > 0 ? 'text-amber-400' : 'text-emerald-400'
                      }`}
                    >
                      {wf.impact > 0 ? `+${wf.impact} pts` : `${wf.impact} pts`}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Ordered Timeline with Rule Tags */}
            <div className="space-y-2">
              <div className="font-semibold text-slate-100 uppercase tracking-wider text-[11px] flex items-center justify-between">
                <span>Chronological Evidence Timeline</span>
                <span className="text-[10px] text-muted-foreground font-mono">
                  Mode: {timeMode}
                </span>
              </div>

              <div className="space-y-2">
                {subgraph.timeline.map((step) => {
                  const displayTime =
                    timeMode === 'event_time' ? step.event_time : step.ingest_time
                  const isEdgeActive =
                    step.edge_id &&
                    (selectedEdgeId === step.edge_id ||
                      (step.node_id && selectedNodeId === step.node_id))

                  return (
                    <div
                      key={step.step}
                      onClick={() => {
                        if (step.edge_id) setHighlightedEdgeId(step.edge_id)
                      }}
                      onMouseEnter={() => setHighlightedEdgeId(step.edge_id || null)}
                      onMouseLeave={() => setHighlightedEdgeId(null)}
                      className={`p-2.5 rounded transition-all cursor-pointer group ${
                        isEdgeActive
                          ? 'bg-amber-950/40 border-2 border-amber-400 shadow-md shadow-amber-950/50'
                          : 'bg-muted/20 border border-border/70 hover:border-amber-400/80'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-amber-400">
                            #{step.step}
                          </span>
                          <span className="text-[10px] bg-slate-800 text-slate-300 px-1 rounded font-mono">
                            {step.rule_tag}
                          </span>
                        </div>
                        <span className="font-mono text-[10px] text-amber-400 font-semibold">
                          +{step.points} pts
                        </span>
                      </div>

                      <p className="text-slate-300 text-[11px] leading-relaxed mb-1.5">
                        {step.description}
                      </p>

                      <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono">
                        <span>{formatDateTime(displayTime)}</span>
                        {step.amount_minor && (
                          <span className="text-slate-200 font-semibold">
                            {formatCurrencyINR(step.amount_minor)}
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* ================= COUNTERFACTUAL TAB ================= */}
        {activeTab === 'counterfactual' && (
          <div className="space-y-4 text-xs">
            {/* Warning banner */}
            <div className="p-2 bg-amber-950/30 border border-amber-800/60 rounded text-[11px] text-amber-300 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 shrink-0" />
              <span>
                Hypothetical simulation: severing edges recalculates review priority without altering the underlying synthetic ledger.
              </span>
            </div>

            {/* Per-Edge Removal Toggles */}
            <div className="space-y-2">
              <div className="font-semibold text-slate-100 uppercase tracking-wider text-[11px]">
                Per-Edge Removal Toggles:
              </div>
              <div className="space-y-1.5">
                {subgraph.edges.map((edge) => {
                  const isRemoved = removedEdges.includes(edge.id)
                  return (
                    <div
                      key={edge.id}
                      onClick={() => handleToggleEdge(edge.id)}
                      className={`p-2 rounded border cursor-pointer text-[11px] flex items-center justify-between transition-colors ${
                        isRemoved
                          ? 'bg-destructive/20 border-destructive/60 text-red-200'
                          : 'bg-muted/30 border-border text-slate-300 hover:bg-muted/60'
                      }`}
                    >
                      <div className="truncate max-w-[200px]">
                        <span className="font-mono font-semibold">
                          {edge.transaction_id}:
                        </span>{' '}
                        <span>
                          {edge.amount_minor > 0
                            ? formatCurrencyINR(edge.amount_minor)
                            : edge.evidence_type}
                        </span>
                      </div>
                      <span className="font-mono text-[10px]">
                        {isRemoved ? '[Severed]' : '[Active]'}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Simulated Score Outcome */}
            {simulated && (
              <div className="p-3 bg-muted/40 border border-amber-500/60 rounded-md space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">What-If Review Priority:</span>
                  <div className="flex items-center gap-1.5 font-mono">
                    <span className="line-through text-muted-foreground">
                      {simulated.original_risk_score.toFixed(2)}
                    </span>
                    <ArrowRight className="h-3 w-3 text-amber-400" />
                    <span className="text-amber-300 font-bold text-sm">
                      {simulated.new_risk_score.toFixed(2)}
                    </span>
                    <Badge variant={simulated.below_cutoff ? 'success' : 'warning'}>
                      {simulated.score_delta}
                    </Badge>
                  </div>
                </div>

                <div className="text-[11px] text-slate-200 leading-normal">
                  {simulated.explanation}
                </div>

                {simulated.below_cutoff ? (
                  <div className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    <span>Falls below review cutoff threshold (0.60)</span>
                  </div>
                ) : (
                  <div className="text-[11px] text-amber-400 font-semibold flex items-center gap-1">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    <span>Remains above review cutoff threshold</span>
                  </div>
                )}

                <button
                  onClick={handleResetCounterfactual}
                  className="text-[11px] text-primary underline block pt-1"
                >
                  Reset all edge removals
                </button>
              </div>
            )}

            {/* Benign Hypothesis Cards */}
            <div className="space-y-2 pt-2 border-t border-border/80">
              <div className="font-semibold text-slate-100 uppercase tracking-wider text-[11px]">
                Benign Alternative Hypotheses:
              </div>
              {hypotheses.map((hyp) => (
                <div
                  key={hyp.id}
                  className="p-2.5 rounded bg-card border border-border space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-200">{hyp.title}</span>
                    <Badge variant="outline" className="text-[10px]">
                      {hyp.confidence} plausibility
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-normal">
                    {hyp.description}
                  </p>
                  <div className="space-y-1 pt-1">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">
                      Distinguishing Checks:
                    </span>
                    {hyp.distinguishing_checks.map((check, ci) => (
                      <div key={ci} className="text-[10px] text-amber-200/90 pl-1.5">
                        • {check}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= DECISION TAB ================= */}
        {activeTab === 'decision' && (
          <div className="space-y-4 text-xs">
            {successBanner && (
              <div className="p-2.5 bg-emerald-950/60 border border-emerald-800 text-emerald-300 rounded flex items-center gap-1.5 text-xs">
                <CheckCircle className="h-4 w-4" />
                <span>{successBanner}</span>
              </div>
            )}

            {/* Decision Submission Form */}
            <form
              onSubmit={handleSubmitDecision}
              className="p-3 bg-muted/30 border border-border rounded-md space-y-3"
            >
              <div className="font-semibold text-slate-100 uppercase tracking-wider text-[11px]">
                Record Investigation Outcome:
              </div>

              {/* Action selection */}
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => setDecisionType('confirm')}
                  className={`p-2 rounded text-center border text-[11px] font-semibold transition-all ${
                    decisionType === 'confirm'
                      ? 'bg-amber-950/70 border-amber-500 text-amber-300'
                      : 'bg-card border-border text-muted-foreground hover:text-white'
                  }`}
                >
                  Consistent Pattern
                </button>

                <button
                  type="button"
                  onClick={() => setDecisionType('dismiss')}
                  className={`p-2 rounded text-center border text-[11px] font-semibold transition-all ${
                    decisionType === 'dismiss'
                      ? 'bg-emerald-950/70 border-emerald-500 text-emerald-300'
                      : 'bg-card border-border text-muted-foreground hover:text-white'
                  }`}
                >
                  Dismiss (Benign)
                </button>

                <button
                  type="button"
                  onClick={() => setDecisionType('needs_more_info')}
                  className={`p-2 rounded text-center border text-[11px] font-semibold transition-all ${
                    decisionType === 'needs_more_info'
                      ? 'bg-blue-950/70 border-blue-500 text-blue-300'
                      : 'bg-card border-border text-muted-foreground hover:text-white'
                  }`}
                >
                  Needs More Info
                </button>
              </div>

              {/* Mandatory Note */}
              <div className="space-y-1">
                <label className="text-[11px] text-slate-300 flex items-center justify-between">
                  <span>Mandatory Rationale Note:</span>
                  <span className="text-[10px] text-muted-foreground">Required</span>
                </label>
                <textarea
                  value={decisionNote}
                  onChange={(e) => {
                    setDecisionNote(e.target.value)
                    if (decisionError) setDecisionError(null)
                  }}
                  rows={3}
                  placeholder="Record why this alert is consistent with coordinated behaviour or matches a benign commercial pattern..."
                  className="w-full bg-slate-900 border border-input rounded p-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-amber-400"
                />
                {decisionError && (
                  <p className="text-[11px] text-destructive">{decisionError}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={decisionMutation.isPending}
                className="w-full py-2 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Submit Outcome to Audit Trail</span>
              </button>
            </form>

            {/* Append-Only Decision History */}
            <div className="space-y-2 pt-2 border-t border-border">
              <div className="font-semibold text-slate-100 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <History className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Append-Only Decision Log:</span>
              </div>

              {decisionHistory.length === 0 ? (
                <p className="text-muted-foreground text-[11px]">
                  No prior analyst decisions recorded for this synthetic entity.
                </p>
              ) : (
                <div className="space-y-2">
                  {decisionHistory.map((rec) => (
                    <div
                      key={rec.id}
                      className="p-2.5 rounded bg-card border border-border space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-amber-300 capitalize">
                          {rec.decision.replace('_', ' ')}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {formatDateTime(rec.timestamp)}
                        </span>
                      </div>
                      <p className="text-slate-300 text-[11px] leading-relaxed">
                        "{rec.note}"
                      </p>
                      <div className="text-[10px] text-muted-foreground">
                        Actor: {rec.actor}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
