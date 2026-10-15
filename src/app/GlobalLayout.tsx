import React from 'react'
import {
  ShieldAlert,
  ListFilter,
  BarChart3,
  Network,
  Terminal,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface LayoutProps {
  children: React.ReactNode
  currentTab: 'queue' | 'investigation' | 'evaluation'
  onSelectTab: (tab: 'queue' | 'investigation' | 'evaluation') => void
  selectedAlertId?: string | null
}

export const GlobalLayout: React.FC<LayoutProps> = ({
  children,
  currentTab,
  onSelectTab,
  selectedAlertId,
}) => {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground antialiased selection:bg-primary selection:text-white">
      {/* Synthetic Demo Banner (Mandatory UX rule) */}
      <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-amber-950 border-b border-amber-800/40 px-4 py-1 text-[11px] font-medium text-amber-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
          <span>
            SYNTHETIC DATA ENVIRONMENT — STRICTLY SIMULATED UPI TRANSACTIONS & NON-PERSONAL IDENTIFIERS (HACKATHON PROTOTYPE)
          </span>
        </div>
        <div className="hidden md:flex items-center gap-3 text-[10px] text-amber-300/80">
          <span>Contract: Proposed (API v1)</span>
          <span>Seed: 4242</span>
          <span>Zero Real PII</span>
        </div>
      </div>

      {/* Main App Header */}
      <header className="border-b border-border bg-card/70 backdrop-blur-md sticky top-0 z-40 px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => onSelectTab('queue')}>
            <div className="h-8 w-8 rounded-lg bg-primary/20 border border-primary/40 flex items-center justify-center text-primary shadow-sm shadow-primary/20">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm tracking-tight text-white">RingLens</span>
                <Badge variant="outline" className="text-[10px] py-0 px-1 border-primary/40 text-primary">
                  v0.1-proto
                </Badge>
              </div>
              <p className="text-[10px] text-muted-foreground leading-none">
                UPI Fraud-Ring Investigation & Graph Workspace
              </p>
            </div>
          </div>

          {/* Navigation Bar */}
          <nav className="flex items-center gap-1 bg-muted/30 p-1 rounded-md border border-border/60">
            <button
              onClick={() => onSelectTab('queue')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-all ${
                currentTab === 'queue'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              <ListFilter className="h-3.5 w-3.5" />
              <span>Analyst Queue</span>
            </button>

            <button
              onClick={() => onSelectTab('investigation')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-all ${
                currentTab === 'investigation'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              <Network className="h-3.5 w-3.5" />
              <span>Investigation Workspace</span>
              {selectedAlertId && (
                <span className="text-[10px] bg-black/40 px-1 rounded text-slate-300 font-mono">
                  {selectedAlertId.replace('alert_demo_', '#')}
                </span>
              )}
            </button>

            <button
              onClick={() => onSelectTab('evaluation')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-all ${
                currentTab === 'evaluation'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              <BarChart3 className="h-3.5 w-3.5" />
              <span>Evaluation & Quality</span>
            </button>
          </nav>
        </div>

        {/* Right side status items */}
        <div className="flex items-center gap-3 text-xs">
          <div className="hidden sm:flex items-center gap-1.5 text-muted-foreground font-mono text-[11px] bg-card px-2.5 py-1 rounded border border-border">
            <Terminal className="h-3.5 w-3.5 text-emerald-400" />
            <span>FastAPI: Mock Fallback Active</span>
          </div>
          <div className="h-2 w-2 rounded-full bg-emerald-500" title="System Operational" />
        </div>
      </header>

      {/* Main Content Viewport */}
      <main className="flex-1 p-4 md:p-6 max-w-[1600px] w-full mx-auto overflow-x-hidden">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-border/80 bg-card/40 px-4 py-2 text-[11px] text-muted-foreground flex flex-col sm:flex-row justify-between items-center gap-2">
        <div>
          RingLens Synthetic Intelligence Engine • Evaluation and explainability for synthetic financial crime detection
        </div>
        <div className="flex items-center gap-4">
          <span>Docs: <code className="text-slate-300">docs/API_CONTRACT.md</code></span>
          <span>Privacy: No PII stored</span>
        </div>
      </footer>
    </div>
  )
}
