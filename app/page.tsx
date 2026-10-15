'use client'

import React, { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WorkbenchWorkspace } from '@/features/investigation/WorkbenchWorkspace'
import { EvaluationTab } from '@/features/evaluation/EvaluationTab'
import {
  Activity,
  BarChart3,
  Network,
  Cpu,
  Radio,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

export default function RootPage() {
  const [activeScreen, setActiveScreen] = useState<'workspace' | 'evaluation'>('workspace')

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen flex flex-col bg-background text-foreground antialiased selection:bg-amber-500 selection:text-white">
        {/* Global Navigation Header (Top layer removed, rebranded to TRACE with AI-synthetic aesthetics) */}
        <header className="border-b border-border/80 bg-card/90 backdrop-blur-md sticky top-0 z-40 px-4 py-2.5 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-6">
            <div
              className="flex items-center gap-3 cursor-pointer group"
              onClick={() => setActiveScreen('workspace')}
            >
              <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-amber-500/20 via-amber-600/10 to-transparent border border-amber-500/50 flex items-center justify-center text-amber-400 shadow-md shadow-amber-950/40 group-hover:border-amber-400 transition-all">
                <Activity className="h-5 w-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-base tracking-wider text-white font-mono bg-gradient-to-r from-amber-200 via-amber-400 to-amber-500 bg-clip-text text-transparent">
                    TRACE
                  </span>
                  <Badge variant="outline" className="text-[10px] py-0 px-1.5 border-amber-500/40 text-amber-300 font-mono bg-amber-950/40">
                    SYNTH-NEURAL v2.4
                  </Badge>
                </div>
                <p className="text-[10px] text-muted-foreground leading-none font-mono tracking-tight">
                  Autonomous Graph Anomaly & Ring Inference Engine
                </p>
              </div>
            </div>

            {/* Navigation Tabs */}
            <nav className="flex items-center gap-1 bg-muted/40 p-1 rounded-md border border-border/60">
              <button
                onClick={() => setActiveScreen('workspace')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold tracking-wide transition-all ${
                  activeScreen === 'workspace'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                <Network className="h-3.5 w-3.5" />
                <span>Neural Topology Workspace</span>
              </button>

              <button
                onClick={() => setActiveScreen('evaluation')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold tracking-wide transition-all ${
                  activeScreen === 'evaluation'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                <BarChart3 className="h-3.5 w-3.5" />
                <span>Synthetic Model Benchmark</span>
              </button>
            </nav>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="hidden sm:flex items-center gap-2 font-mono text-[11px] bg-slate-900/80 px-3 py-1 rounded-md border border-border/80 text-amber-300">
              <Cpu className="h-3.5 w-3.5 text-amber-400" />
              <span>SYNTH-AGENT: ACTIVE</span>
              <span className="text-muted-foreground">•</span>
              <span className="text-muted-foreground">LATENCY: 14ms</span>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-emerald-950/40 border border-emerald-800/60 text-emerald-400 text-[10px] font-mono">
              <Radio className="h-3 w-3 animate-pulse" />
              <span>SIM-STREAM LIVE</span>
            </div>
          </div>
        </header>

        {/* Viewport content */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {activeScreen === 'workspace' ? <WorkbenchWorkspace /> : <EvaluationTab />}
        </main>
      </div>
    </QueryClientProvider>
  )
}
