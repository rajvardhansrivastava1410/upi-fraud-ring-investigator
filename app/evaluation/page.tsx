'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Tooltip as PieTooltip,
} from 'recharts';

// Synthetic benchmark data for TRACE Graph Engine
const mockSummary = {
  metrics: [
    { k: 10, precision: 0.9, recall: 0.15 },
    { k: 25, precision: 0.76, recall: 0.35 },
    { k: 50, precision: 0.62, recall: 0.58 },
  ],
  lateArrival: [
    { lagHours: 0, jaccard: 1.0 },
    { lagHours: 12, jaccard: 0.92 },
    { lagHours: 24, jaccard: 0.85 },
    { lagHours: 48, jaccard: 0.71 },
  ],
  fpr: [
    { scenario: "Family Shared Phone", rate: 0.02 },
    { scenario: "Cyber Cafe", rate: 0.05 },
    { scenario: "Wedding Pool", rate: 0.01 },
    { scenario: "Shop Suppliers", rate: 0.04 },
  ],
  // Cyber Black / Red / Green / White palette for class distribution
  classBalance: [
    { name: "Coordinated behaviour (Fraud Ring)", value: 412, fill: "#ff003f" },
    { name: "Benign — shared device", value: 1340, fill: "#00ff66" },
    { name: "Benign — velocity only", value: 2180, fill: "#ffffff" },
    { name: "Benign — other commercial", value: 1068, fill: "#333333" },
  ],
  baselineComparison: [
    { metric: "Precision@25", graphEngine: 0.76, b1Device: 0.44, b2Velocity: 0.51, b3IsoForest: 0.58 },
    { metric: "Recall@25",    graphEngine: 0.35, b1Device: 0.18, b2Velocity: 0.27, b3IsoForest: 0.31 },
    { metric: "FPR",          graphEngine: 0.03, b1Device: 0.12, b2Velocity: 0.09, b3IsoForest: 0.07 },
  ],
};

const CYBER_TOOLTIP_STYLE = {
  backgroundColor: '#000000',
  borderColor: '#00ff66',
  borderWidth: '1px',
  color: '#ffffff',
  fontFamily: 'monospace',
  fontSize: '11px',
  boxShadow: '0 0 15px rgba(0, 255, 102, 0.3)',
};

export default function EvaluationPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const total = mockSummary.classBalance.reduce((s, d) => s + d.value, 0);
  const posRate = ((mockSummary.classBalance[0].value / total) * 100).toFixed(1);

  return (
    <div className="min-h-screen bg-black text-slate-100 font-mono select-none">
      {/* Top Cyber HUD Bar */}
      <header className="flex items-center justify-between border-b border-green-500/40 bg-black px-6 py-3.5 z-30 shadow-[0_4px_20px_rgba(0,0,0,0.9)]">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs text-green-400 hover:text-white bg-black border border-green-500/40 hover:border-green-400 px-3 py-1.5 rounded transition-colors font-bold uppercase tracking-wider"
          >
            ← Back to Workbench
          </Link>
          <div className="h-5 w-[1px] bg-green-500/30 hidden sm:block" />
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-green-400 animate-ping" />
            <h1 className="text-sm font-black tracking-widest text-white uppercase flex items-center gap-2">
              <span className="text-green-400">TRACE</span> · ENGINE EVALUATION &amp; BENCHMARKS
            </h1>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-2 text-[10px]">
          <span className="px-2 py-0.5 rounded bg-black text-white border border-slate-700 font-bold">
            SYNTHETIC DATASET ONLY
          </span>
          <span className="px-2 py-0.5 rounded bg-green-950 text-green-400 border border-green-500 font-bold">
            ₹ INR DOMESTIC BENCHMARKS
          </span>
        </div>
      </header>

      <div className="max-w-6xl mx-auto space-y-6 p-6">
        {/* Row 1: Imbalance & Baseline Comparison */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card 1: Dataset Class Imbalance */}
          <div className="bg-black border border-green-500/30 rounded p-6 shadow-[0_0_25px_rgba(0,255,102,0.06)] relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-red-500 via-green-500 to-white opacity-70" />
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <span className="text-red-400">■</span> Dataset Class Imbalance
              </h2>
              <span className="text-[10px] text-slate-400 font-mono">5,000 CANDIDATES</span>
            </div>
            <p className="text-xs text-slate-300 mb-5 leading-relaxed">
              Only <span className="text-red-400 font-bold font-mono px-1 py-0.2 bg-red-950 border border-red-500/50 rounded">{posRate}%</span> of candidates are labelled
              coordinated behaviour (fraud rings) — the remaining 91.8% are benign hard-negatives.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="h-48 w-48 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={mockSummary.classBalance}
                      cx="50%"
                      cy="50%"
                      innerRadius={46}
                      outerRadius={74}
                      dataKey="value"
                      strokeWidth={1}
                      stroke="#000000"
                    >
                      {mockSummary.classBalance.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Pie>
                    <PieTooltip
                      contentStyle={CYBER_TOOLTIP_STYLE}
                      formatter={(v: any) => [`${v} (${(((Number(v) || 0) / total) * 100).toFixed(1)}%)`, '']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="space-y-2.5 text-xs min-w-0 w-full">
                {mockSummary.classBalance.map((d) => (
                  <li key={d.name} className="flex items-center justify-between gap-2 border-b border-zinc-900 pb-1.5">
                    <div className="flex items-center gap-2 truncate">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-sm"
                        style={{ backgroundColor: d.fill, border: '1px solid rgba(255,255,255,0.3)' }}
                      />
                      <span className="text-slate-300 truncate">{d.name}</span>
                    </div>
                    <span className="font-mono text-white font-bold shrink-0">
                      {d.value.toLocaleString('en-IN')}
                    </span>
                  </li>
                ))}
                <li className="pt-2 flex justify-between text-xs text-slate-400 font-bold">
                  <span>TOTAL REVIEW POOL</span>
                  <span className="font-mono text-green-400">{total.toLocaleString('en-IN')}</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Card 2: Baseline Comparison */}
          <div className="bg-black border border-green-500/30 rounded p-6 shadow-[0_0_25px_rgba(0,255,102,0.06)] relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-green-500 to-white opacity-70" />
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <span className="text-green-400">■</span> Graph Engine vs Baselines
              </h2>
              <span className="text-[10px] text-green-400 font-mono font-bold bg-green-950 px-1.5 py-0.5 rounded border border-green-500/40">
                TRACE ADVANTAGE
              </span>
            </div>
            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              At fixed K=25 review budget. Baselines: B1 (Shared Device rule), B2 (Velocity rule), B3 (Isolation Forest).
            </p>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mockSummary.baselineComparison} layout="vertical">
                  <CartesianGrid strokeDasharray="2 2" stroke="#1f2937" horizontal={false} />
                  <XAxis type="number" stroke="#00ff66" domain={[0, 1]} tickFormatter={(v) => v.toFixed(1)} tick={{ fontSize: 10, fill: '#9ca3af' }} />
                  <YAxis type="category" dataKey="metric" stroke="#00ff66" width={90} tick={{ fontSize: 11, fill: '#ffffff' }} />
                  <Tooltip contentStyle={CYBER_TOOLTIP_STYLE} />
                  <Legend wrapperStyle={{ fontSize: 11, paddingTop: '10px' }} />
                  <Bar dataKey="graphEngine" fill="#00ff66" name="TRACE Graph Engine" />
                  <Bar dataKey="b3IsoForest" fill="#ffffff" name="B3 IsoForest" />
                  <Bar dataKey="b2Velocity" fill="#666666" name="B2 Velocity" />
                  <Bar dataKey="b1Device" fill="#333333" name="B1 Device" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Row 2: Precision/Recall Tradeoff & Complaint Lag */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card 3: PR at Budget K */}
          <div className="bg-black border border-green-500/30 rounded p-6 shadow-[0_0_25px_rgba(0,255,102,0.06)] relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-green-500 to-white opacity-70" />
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <span className="text-green-400">■</span> Precision / Recall at Budget (K)
              </h2>
              <span className="text-[10px] text-slate-400 font-mono">ANALYST BANDWIDTH</span>
            </div>
            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              Detection tradeoff as queue size K expands. Low K achieves 90% precision with zero wasted alerts.
            </p>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mockSummary.metrics}>
                  <CartesianGrid strokeDasharray="2 2" stroke="#1f2937" />
                  <XAxis dataKey="k" stroke="#00ff66" tickFormatter={(val) => `K=${val}`} tick={{ fontSize: 11, fill: '#9ca3af' }} />
                  <YAxis stroke="#00ff66" domain={[0, 1]} tick={{ fontSize: 10, fill: '#9ca3af' }} />
                  <Tooltip contentStyle={CYBER_TOOLTIP_STYLE} />
                  <Legend wrapperStyle={{ fontSize: 11, paddingTop: '8px' }} />
                  <Bar dataKey="precision" fill="#00ff66" name="Precision" />
                  <Bar dataKey="recall" fill="#ffffff" name="Recall" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Card 4: Complaint Lag Stability */}
          <div className="bg-black border border-green-500/30 rounded p-6 shadow-[0_0_25px_rgba(0,255,102,0.06)] relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-green-500 to-white opacity-70" />
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <span className="text-green-400">■</span> Stability vs. Complaint Lag
              </h2>
              <span className="text-[10px] text-green-400 font-mono font-bold bg-green-950 px-1.5 py-0.5 rounded border border-green-500/40">
                0.85 AT 24H
              </span>
            </div>
            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              Top-K Jaccard rank stability as victim complaints arrive delayed. High agreement (&gt;0.70) even at 48h lag.
            </p>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={mockSummary.lateArrival}>
                  <CartesianGrid strokeDasharray="2 2" stroke="#1f2937" />
                  <XAxis dataKey="lagHours" stroke="#00ff66" tickFormatter={(val) => `${val}h`} tick={{ fontSize: 11, fill: '#9ca3af' }} />
                  <YAxis stroke="#00ff66" domain={[0, 1]} tick={{ fontSize: 10, fill: '#9ca3af' }} />
                  <Tooltip contentStyle={CYBER_TOOLTIP_STYLE} />
                  <Legend wrapperStyle={{ fontSize: 11, paddingTop: '8px' }} />
                  <Line
                    type="monotone"
                    dataKey="jaccard"
                    stroke="#00ff66"
                    strokeWidth={2.5}
                    name="Top-K Agreement"
                    dot={{ fill: '#00ff66', stroke: '#ffffff', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, fill: '#ffffff', stroke: '#00ff66' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Card 5: False Positive Rates on Hard Negatives Table */}
        <div className="bg-black border border-green-500/30 rounded p-6 shadow-[0_0_25px_rgba(0,255,102,0.06)] relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-green-500 via-white to-green-500 opacity-70" />
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              <span className="text-green-400">■</span> Benign Typology Evasion (Hard Negatives)
            </h2>
            <span className="text-[10px] text-green-400 font-mono font-bold bg-green-950 px-2 py-0.5 rounded border border-green-500/40">
              TARGET: FPR &lt; 5.0%
            </span>
          </div>
          <p className="text-xs text-slate-300 mb-5 leading-relaxed">
            False positive rates across synthetic Indian benign scenarios that mimic coordinated velocity patterns.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-mono text-xs">
              <thead>
                <tr className="border-b border-green-500/40 text-green-400 bg-zinc-950/60 uppercase">
                  <th className="py-3 px-4 font-bold">Benign Scenario</th>
                  <th className="py-3 px-4 font-bold">Description</th>
                  <th className="py-3 px-4 font-bold">False Positive Rate</th>
                  <th className="py-3 px-4 font-bold">Evaluation Status</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { scenario: "Family Shared Phone", desc: "4 family members sharing single Android handset for UPI", rate: 0.02 },
                  { scenario: "Cyber Cafe / Public Terminal", desc: "Multi-user terminal with dozens of unrelated bank logins", rate: 0.05 },
                  { scenario: "Wedding Pool Fund", desc: "High-velocity collect fan-in for a legitimate family ceremony", rate: 0.01 },
                  { scenario: "Wholesale Shop Suppliers", desc: "Continuous rapid morning batch payouts to market vendors", rate: 0.04 },
                ].map((row, i) => (
                  <tr key={i} className="border-b border-zinc-900 hover:bg-zinc-950/80 transition-colors">
                    <td className="py-3 px-4 text-white font-bold">{row.scenario}</td>
                    <td className="py-3 px-4 text-slate-400">{row.desc}</td>
                    <td className="py-3 px-4 text-green-400 font-bold font-mono">{(row.rate * 100).toFixed(1)}%</td>
                    <td className="py-3 px-4">
                      {row.rate < 0.05 ? (
                        <span className="px-2 py-0.5 bg-green-950 text-green-400 border border-green-500 font-bold text-[10px] rounded uppercase">
                          PASS (&lt;5%)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-red-950 text-red-400 border border-red-500 font-bold text-[10px] rounded uppercase">
                          THRESHOLD REVIEW
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Audit Notice */}
        <p className="text-center text-[11px] text-slate-500 pb-4 font-mono">
          TRACE UPI SURVEILLANCE · EVALUATION SUITE RUNNING ON SYNTHETIC GRAPH DATA (₹ INR CORRIDORS)
        </p>
      </div>
    </div>
  );
}
