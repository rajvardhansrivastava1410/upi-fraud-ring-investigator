'use client'

import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { getEvaluationData } from '@/lib/api/client'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import {
  TrendingUp,
  AlertCircle,
  Clock,
  Layers,
  ShieldCheck,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export const EvaluationTab: React.FC = () => {
  const { data: evalData, isLoading, isError } = useQuery({
    queryKey: ['evaluation'],
    queryFn: () => getEvaluationData(),
  })

  if (isLoading || !evalData) {
    return (
      <div className="py-24 text-center space-y-2">
        <p className="text-xs text-muted-foreground">Loading evaluation benchmarks...</p>
      </div>
    )
  }

  const {
    run_id,
    scoring_version,
    pr_at_k,
    benign_false_positives,
    late_arrival_stability,
    baseline_comparisons,
    failure_cases,
  } = evalData

  return (
    <div className="p-6 max-w-[1500px] mx-auto space-y-6 overflow-y-auto">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>Detection Quality & Evaluation Benchmarks</span>
            <Badge variant="outline" className="font-mono text-xs">
              {run_id}
            </Badge>
          </h1>
          <p className="text-xs text-muted-foreground">
            Synthetic precision, recall, benign shared-device false positive analyses, and late-arrival stability.
          </p>
        </div>

        <Badge variant="secondary" className="font-mono text-xs">
          Scoring Version: {scoring_version}
        </Badge>
      </div>

      {/* Baseline Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="p-4 rounded-lg bg-card border border-amber-500/60 space-y-1">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-amber-300 flex items-center justify-between">
            <span>RingLens Weighted Graph</span>
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div className="text-3xl font-bold font-mono text-amber-400">
            {(baseline_comparisons.ringlens_f1 * 100).toFixed(1)}%
          </div>
          <p className="text-[11px] text-muted-foreground">
            F1-score with hardware collision and velocity decay
          </p>
        </div>

        <div className="p-4 rounded-lg bg-card border border-border space-y-1">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span>Unweighted Graph Baseline</span>
            <Layers className="h-4 w-4" />
          </div>
          <div className="text-3xl font-bold font-mono text-slate-300">
            {(baseline_comparisons.unweighted_graph_f1 * 100).toFixed(1)}%
          </div>
          <p className="text-[11px] text-muted-foreground">
            Topology cycles without multi-hop velocity weighting
          </p>
        </div>

        <div className="p-4 rounded-lg bg-card border border-border space-y-1">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span>Standard Rule Heuristics</span>
            <AlertCircle className="h-4 w-4" />
          </div>
          <div className="text-3xl font-bold font-mono text-slate-300">
            {(baseline_comparisons.rule_heuristic_f1 * 100).toFixed(1)}%
          </div>
          <p className="text-[11px] text-muted-foreground">
            Simple velocity thresholds without graph context
          </p>
        </div>
      </div>

      {/* Recharts: Precision @ K / Recall @ K & Late Arrival Drift */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* P@K Chart */}
        <div className="p-4 rounded-lg bg-card border border-border space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-100 flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4 text-amber-400" />
              <span>Precision @ K / Recall @ K Ranked Curve</span>
            </span>
            <span className="text-[10px] text-muted-foreground font-mono">Top-K Alerts</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={pr_at_k}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="k" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} domain={[0, 1]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    fontSize: '11px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Line
                  type="monotone"
                  dataKey="precision"
                  name="RingLens Precision"
                  stroke="#f59e0b"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="recall"
                  name="RingLens Recall"
                  stroke="#34d399"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="baseline_precision"
                  name="Baseline Heuristic"
                  stroke="#64748b"
                  strokeDasharray="3 3"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Late Arrival Stability Chart */}
        <div className="p-4 rounded-lg bg-card border border-border space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-100 flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-amber-400" />
              <span>Late-Arrival Pipeline Telemetry Stability</span>
            </span>
            <span className="text-[10px] text-muted-foreground font-mono">Delay (Mins)</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={late_arrival_stability}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="delay_minutes" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    fontSize: '11px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Line
                  type="monotone"
                  dataKey="classification_stability_pct"
                  name="Classification Stability (%)"
                  stroke="#38bdf8"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="score_drift"
                  name="Score Drift (Delta)"
                  stroke="#f43f5e"
                  strokeWidth={1.5}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Benign Shared-Device False-Positive Analysis Table */}
      <div className="p-4 rounded-lg bg-card border border-border space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-100 flex items-center gap-1.5">
            <Layers className="h-4 w-4 text-purple-400" />
            <span>Benign Shared-Device False-Positive Mitigation Table</span>
          </span>
          <span className="text-[10px] text-muted-foreground font-mono">
            {benign_false_positives.length} High-Density Kiosks
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/30 text-muted-foreground font-semibold">
                <th className="py-2 px-3">Cluster ID</th>
                <th className="py-2 px-3">Hardware Signature</th>
                <th className="py-2 px-3 text-center">Accounts</th>
                <th className="py-2 px-3 text-center">Transactions</th>
                <th className="py-2 px-3">Identified Benign Commercial Pattern</th>
                <th className="py-2 px-3">Mitigation / Discount Rule</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {benign_false_positives.map((row) => (
                <tr key={row.cluster_id} className="hover:bg-accent/30">
                  <td className="py-2.5 px-3 font-mono font-semibold text-amber-300">
                    {row.cluster_id}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-[11px] text-slate-300">
                    {row.device_fingerprint}
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono">{row.account_count}</td>
                  <td className="py-2.5 px-3 text-center font-mono">{row.tx_count}</td>
                  <td className="py-2.5 px-3 text-slate-200">{row.benign_pattern}</td>
                  <td className="py-2.5 px-3 text-emerald-300 font-medium">
                    {row.recommended_discount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Failure Analysis Table */}
      <div className="p-4 rounded-lg bg-card border border-border space-y-3">
        <span className="text-xs font-semibold text-slate-100 flex items-center gap-1.5">
          <AlertCircle className="h-4 w-4 text-destructive" />
          <span>Failure Analysis & Boundary Edge Cases</span>
        </span>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/30 text-muted-foreground font-semibold">
                <th className="py-2 px-3">Case ID</th>
                <th className="py-2 px-3">Scenario</th>
                <th className="py-2 px-3">Expected Priority</th>
                <th className="py-2 px-3">Actual Model Output</th>
                <th className="py-2 px-3">Root Cause Analysis</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {failure_cases.map((fc) => (
                <tr key={fc.case_id} className="hover:bg-accent/30">
                  <td className="py-2.5 px-3 font-mono text-destructive font-bold">
                    {fc.case_id}
                  </td>
                  <td className="py-2.5 px-3 text-slate-200 font-medium">{fc.scenario}</td>
                  <td className="py-2.5 px-3 text-muted-foreground">{fc.expected}</td>
                  <td className="py-2.5 px-3 font-mono text-amber-400 font-semibold">
                    {fc.actual}
                  </td>
                  <td className="py-2.5 px-3 text-slate-300 text-[11px]">{fc.root_cause}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
