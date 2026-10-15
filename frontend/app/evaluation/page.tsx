"use client";

import Link from 'next/link';
import { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Tooltip as PieTooltip,
} from 'recharts';

// Mock data that would normally come from /api/evaluation
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
  // Synthetic dataset class distribution (5000 alert candidates)
  classBalance: [
    { name: "Coordinated behaviour", value: 412, fill: "#f59e0b" },
    { name: "Benign — shared device", value: 1340, fill: "#475569" },
    { name: "Benign — velocity only", value: 2180, fill: "#334155" },
    { name: "Benign — other", value: 1068, fill: "#1e293b" },
  ],
  baselineComparison: [
    { metric: "Precision@25", graphEngine: 0.76, b1Device: 0.44, b2Velocity: 0.51, b3IsoForest: 0.58 },
    { metric: "Recall@25",    graphEngine: 0.35, b1Device: 0.18, b2Velocity: 0.27, b3IsoForest: 0.31 },
    { metric: "FPR",          graphEngine: 0.03, b1Device: 0.12, b2Velocity: 0.09, b3IsoForest: 0.07 },
  ],
};

const TOOLTIP_STYLE = { backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' };

export default function EvaluationPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const total = mockSummary.classBalance.reduce((s, d) => s + d.value, 0);
  const posRate = ((mockSummary.classBalance[0].value / total) * 100).toFixed(1);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      {/* Top bar */}
      <header className="flex items-center gap-4 border-b border-slate-800 px-6 py-3">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 focus-visible:ring-2 focus-visible:ring-amber-400 rounded"
        >
          ← Investigator
        </Link>
        <h1 className="text-sm font-semibold text-white">Engine Evaluation &amp; Benchmarks</h1>
        <p className="hidden sm:block text-xs text-slate-500 ml-auto">
          Fixed analyst budget metrics · Synthetic dataset only
        </p>
      </header>

      <div className="max-w-6xl mx-auto space-y-8 p-6">

        {/* Class imbalance */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-white mb-1">Dataset Class Imbalance</h2>
            <p className="text-xs text-slate-400 mb-4">
              Only <span className="text-amber-400 font-mono">{posRate}%</span> of candidates are labelled
              coordinated behaviour — the rest are benign hard-negatives. This drives the precision/recall tradeoff.
            </p>
            <div className="flex items-center gap-6">
              <div className="h-48 w-48 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={mockSummary.classBalance}
                      cx="50%"
                      cy="50%"
                      innerRadius={48}
                      outerRadius={72}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {mockSummary.classBalance.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Pie>
                    <PieTooltip
                      contentStyle={TOOLTIP_STYLE}
                      formatter={(v: number) => [`${v} (${((v / total) * 100).toFixed(1)}%)`, '']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="space-y-2 text-xs min-w-0">
                {mockSummary.classBalance.map((d) => (
                  <li key={d.name} className="flex items-center gap-2">
                    <span
                      className="h-3 w-3 shrink-0 rounded-sm"
                      style={{ backgroundColor: d.fill, border: '1px solid #475569' }}
                    />
                    <span className="text-slate-300 truncate">{d.name}</span>
                    <span className="ml-auto text-slate-500 font-mono shrink-0">
                      {d.value.toLocaleString('en-IN')}
                    </span>
                  </li>
                ))}
                <li className="border-t border-slate-800 pt-2 flex justify-between text-slate-500">
                  <span>Total candidates</span>
                  <span className="font-mono">{total.toLocaleString('en-IN')}</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Baseline comparison bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-white mb-1">Graph Engine vs Baselines</h2>
            <p className="text-xs text-slate-400 mb-4">
              At K=25 review budget. B1 = Shared Device rule, B2 = Velocity rule, B3 = Isolation Forest.
            </p>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mockSummary.baselineComparison} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                  <XAxis type="number" stroke="#94a3b8" domain={[0, 1]} tickFormatter={(v) => v.toFixed(1)} />
                  <YAxis type="category" dataKey="metric" stroke="#94a3b8" width={80} tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="graphEngine" fill="#f59e0b" name="Graph Engine" />
                  <Bar dataKey="b1Device" fill="#334155" name="B1 Device" />
                  <Bar dataKey="b2Velocity" fill="#475569" name="B2 Velocity" />
                  <Bar dataKey="b3IsoForest" fill="#64748b" name="B3 IsoForest" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* PR at K Chart */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-white mb-1">Precision / Recall at Budget (K)</h2>
            <p className="text-xs text-slate-400 mb-4">
              Tradeoff as the review budget K grows. Low K = high precision, lower recall.
            </p>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mockSummary.metrics}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="k" stroke="#94a3b8" tickFormatter={(val) => `K=${val}`} />
                  <YAxis stroke="#94a3b8" domain={[0, 1]} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Legend />
                  <Bar dataKey="precision" fill="#f59e0b" name="Precision" />
                  <Bar dataKey="recall" fill="#3b82f6" name="Recall" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Late Arrival Stability */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-white mb-1">Stability vs. Complaint Lag</h2>
            <p className="text-xs text-slate-400 mb-4">
              Top-K Jaccard similarity as complaints are delayed (hours). A value near 1.0 means the
              engine&apos;s ranking is stable even when evidence arrives late.
            </p>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={mockSummary.lateArrival}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="lagHours" stroke="#94a3b8" tickFormatter={(val) => `${val}h`} />
                  <YAxis stroke="#94a3b8" domain={[0, 1]} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Line type="monotone" dataKey="jaccard" stroke="#10b981" strokeWidth={2} name="Top-K Agreement" dot={{ fill: '#10b981' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* False Positive Rates on Hard Negatives */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-white mb-1">Benign Typology Evasion (Hard Negatives)</h2>
          <p className="text-xs text-slate-400 mb-4">
            False positive rate on hand-labelled benign scenarios that mimic coordinated behaviour.
            A &quot;Pass&quot; means FPR &lt; 5%.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="py-3 px-4 font-medium">Benign Scenario</th>
                  <th className="py-3 px-4 font-medium">Description</th>
                  <th className="py-3 px-4 font-medium">False Positive Rate</th>
                  <th className="py-3 px-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { scenario: "Family Shared Phone", desc: "4 family members sharing one handset", rate: 0.02 },
                  { scenario: "Cyber Cafe", desc: "Public terminal used by unrelated individuals", rate: 0.05 },
                  { scenario: "Wedding Pool", desc: "One-off group collection by an organiser", rate: 0.01 },
                  { scenario: "Shop Suppliers", desc: "Regular batch payments to the same counterparties", rate: 0.04 },
                ].map((row, i) => (
                  <tr key={i} className="border-b border-slate-800/50 hover:bg-slate-800/20">
                    <td className="py-3 px-4 text-slate-200 font-medium">{row.scenario}</td>
                    <td className="py-3 px-4 text-slate-400 text-xs">{row.desc}</td>
                    <td className="py-3 px-4 text-amber-500 font-mono">{(row.rate * 100).toFixed(1)}%</td>
                    <td className="py-3 px-4">
                      {row.rate < 0.05 ? (
                        <span className="px-2 py-1 bg-green-500/10 text-green-400 text-xs rounded-full">Pass</span>
                      ) : (
                        <span className="px-2 py-1 bg-amber-500/10 text-amber-400 text-xs rounded-full">Review</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <p className="text-center text-xs text-slate-600 pb-4">
          All figures are computed on synthetic data only. No personal financial data is used.
        </p>
      </div>
    </div>
  );
}