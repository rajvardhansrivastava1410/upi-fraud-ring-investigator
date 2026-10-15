import { create } from 'zustand'

interface WorkbenchState {
  selectedAlertId: string | null
  selectedEdgeId: string | null
  selectedNodeId: string | null
  highlightedEdgeId: string | null
  timeMode: 'event_time' | 'ingest_time'
  hops: number
  filterType: string // all, account, device, merchant
  activeTab: 'evidence' | 'counterfactual' | 'decision'
  
  setSelectedAlertId: (id: string | null) => void
  setSelectedEdgeId: (id: string | null) => void
  setSelectedNodeId: (id: string | null) => void
  setHighlightedEdgeId: (id: string | null) => void
  setTimeMode: (mode: 'event_time' | 'ingest_time') => void
  setHops: (hops: number) => void
  setFilterType: (type: string) => void
  setActiveTab: (tab: 'evidence' | 'counterfactual' | 'decision') => void
}

export const useWorkbenchStore = create<WorkbenchState>((set) => ({
  selectedAlertId: 'alert_syn_high_01',
  selectedEdgeId: null,
  selectedNodeId: null,
  highlightedEdgeId: null,
  timeMode: 'event_time',
  hops: 2,
  filterType: 'all',
  activeTab: 'evidence',

  setSelectedAlertId: (id) =>
    set({
      selectedAlertId: id,
      selectedEdgeId: null,
      selectedNodeId: null,
      highlightedEdgeId: null,
    }),
  setSelectedEdgeId: (id) => set({ selectedEdgeId: id, selectedNodeId: null }),
  setSelectedNodeId: (id) => set({ selectedNodeId: id, selectedEdgeId: null }),
  setHighlightedEdgeId: (id) => set({ highlightedEdgeId: id }),
  setTimeMode: (mode) => set({ timeMode: mode }),
  setHops: (hops) => set({ hops }),
  setFilterType: (type) => set({ filterType: type }),
  setActiveTab: (tab) => set({ activeTab: tab }),
}))
