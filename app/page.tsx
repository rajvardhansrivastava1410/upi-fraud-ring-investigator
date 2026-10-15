'use client';

import React, { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import CyberGlobe3D, { type GlobeNode, type GlobeLink } from '@/components/CyberGlobe3D';
import PipelineSequenceController from '@/components/PipelineSequenceController';
import KaggleDataHub from '@/components/KaggleDataHub';
import ConnectionInspectorDrawer from '@/components/ConnectionInspectorDrawer';
import LiveRupeeTransactionFeed from '@/components/LiveRupeeTransactionFeed';

// Leaflet and Cytoscape require dynamic import with ssr: false
const CartoWorldMap = dynamic(() => import('@/components/CartoWorldMap'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-black">
      <div className="flex items-center gap-2 font-mono text-xs text-green-400">
        <span className="w-2.5 h-2.5 rounded-full bg-green-400 animate-ping" />
        LOADING CARTO INDIA BASEMAP...
      </div>
    </div>
  ),
});

const GraphPane = dynamic(() => import('@/components/GraphPane'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-black">
      <p className="text-xs font-mono text-green-400">LOADING GRAPH ENGINE...</p>
    </div>
  ),
});

const EvidencePane = dynamic(() => import('@/components/EvidencePane'), { ssr: false });
const QueuePane = dynamic(() => import('@/components/QueuePane'), { ssr: false });

type ViewMode = '3d-globe' | 'carto-map' | 'split-hud' | 'workbench';

// Dedicated self-contained footer ticker component to isolate re-renders from the main scene
function LiveFooterTicker({ accountsCount, corridorsCount }: { accountsCount: number; corridorsCount: number }) {
  const [tickerIndex, setTickerIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setTickerIndex((prev) => prev + 1);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const activeTickers = [
    { source: 'user-hdfc-3b1c [Mumbai]', target: 'mule-sbi-jamtara [Jamtara]', amt: '₹85,000', status: 'COLLECT_FAN_IN_FLAGGED', isAlert: true },
    { source: 'user-icici-8d42 [Delhi]', target: 'mule-kotak-mewat [Mewat]', amt: '₹1,20,000', status: 'SHARED_DEVICE_BURST', isAlert: true },
    { source: 'user-axis-c07e [Bengaluru]', target: 'mule-sbi-alwar [Alwar]', amt: '₹48,000', status: 'RAPID_DRAIN_INTERCEPTED', isAlert: true },
    { source: 'user-pnb-kolkata [Kolkata]', target: 'mule-sbi-deoghar [Deoghar]', amt: '₹65,000', status: 'OTP_TROJAN_FORWARD', isAlert: true },
    { source: 'user-kotak-pune [Pune]', target: 'user-hdfc-mum [Mumbai]', amt: '₹14,500', status: 'VERIFIED_DOMESTIC_P2P', isAlert: false },
  ];
  const currentTicker = activeTickers[tickerIndex % activeTickers.length];

  return (
    <footer className="h-10 shrink-0 border-t border-green-500/40 bg-black px-4 flex items-center justify-between z-30 font-mono text-xs">
      <div className="flex items-center gap-3 overflow-hidden">
        <div className="flex items-center gap-1.5 shrink-0 text-green-400 font-bold">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span>LIVE UPI CORRIDOR:</span>
        </div>

        <div className="flex items-center gap-2 truncate text-xs">
          <span className="text-white font-bold">{currentTicker.source}</span>
          <span className="text-green-400 font-bold">─── {currentTicker.amt} ───▶</span>
          <span className="text-white font-bold">{currentTicker.target}</span>
          <span
            className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
              currentTicker.isAlert ? 'bg-red-950 text-red-400 border border-red-500 animate-pulse' : 'bg-green-950 text-green-400 border border-green-500'
            }`}
          >
            [{currentTicker.status}]
          </span>
        </div>
      </div>

      <div className="hidden sm:flex items-center gap-4 shrink-0 text-[11px] text-slate-400">
        <div>
          DATABASE: <span className="text-white font-bold">{accountsCount} ACCOUNTS · {corridorsCount} CORRIDORS</span>
        </div>
        <div>
          CURRENCY: <span className="text-green-400 font-bold">₹ INR ONLY</span>
        </div>
        <div>
          CARTO API: <span className="text-green-400 font-bold">AUTHENTICATED</span>
        </div>
      </div>
    </footer>
  );
}

export default function Home() {
  const [viewMode, setViewMode] = useState<ViewMode>('3d-globe');
  const [geoData, setGeoData] = useState<{
    nodes: GlobeNode[];
    links: GlobeLink[];
    impossible_travel: any[];
    syndicate_hotspots: any[];
  }>({
    nodes: [],
    links: [],
    impossible_travel: [],
    syndicate_hotspots: [],
  });

  const [selectedNode, setSelectedNode] = useState<GlobeNode | null>(null);
  const [selectedLink, setSelectedLink] = useState<GlobeLink | null>(null);
  const [showKaggleHub, setShowKaggleHub] = useState(false);

  // Fetch live domestic Indian nodes, links, and impossible travel from FastAPI backend
  useEffect(() => {
    fetch('/geo/surveillance')
      .then((res) => {
        if (!res.ok) throw new Error('API not ready');
        return res.json();
      })
      .then((data) => {
        if (data.nodes && data.links) {
          const enhancedNodes = data.nodes.map((n: GlobeNode) => {
            const indianBanks = ['HDFC', 'SBI', 'ICICI', 'AXIS', 'KOTAK', 'PAYTM_PB'];
            let bank = n.bank;
            if (!bank || bank === 'UPI' || bank === 'AMEX' || bank === 'CHASE' || bank === 'HSBC') {
              bank = indianBanks[Math.abs(n.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)) % indianBanks.length];
            }
            const label = n.is_flagged ? `mule-${bank.toLowerCase()}-${n.id.slice(-4)}` : `user-${bank.toLowerCase()}-${n.id.slice(-4)}`;
            return {
              ...n,
              bank,
              label,
              country: 'India',
              currency: 'INR',
              currency_symbol: '₹',
            };
          });

          setGeoData({
            nodes: enhancedNodes,
            links: data.links,
            impossible_travel: data.impossible_travel || [],
            syndicate_hotspots: data.syndicate_hotspots || [],
          });
        }
      })
      .catch(() => {
        const fallbackNodes: GlobeNode[] = [
          { id: 'ACC_0001', label: 'user-hdfc-3b1c', type: 'INDIVIDUAL', bank: 'HDFC', city: 'Mumbai', state: 'Maharashtra', country: 'India', currency: 'INR', currency_symbol: '₹', lat: 19.076, lng: 72.8777, is_flagged: false },
          { id: 'ACC_0002', label: 'mule-sbi-jamtara', type: 'INDIVIDUAL', bank: 'SBI', city: 'Jamtara', state: 'Jharkhand', country: 'India', currency: 'INR', currency_symbol: '₹', lat: 23.9633, lng: 86.8029, is_flagged: true },
          { id: 'ACC_0003', label: 'mule-kotak-mewat', type: 'MERCHANT', bank: 'KOTAK', city: 'Mewat/Nuh', state: 'Haryana', country: 'India', currency: 'INR', currency_symbol: '₹', lat: 28.1132, lng: 77.0028, is_flagged: true },
          { id: 'ACC_0004', label: 'user-icici-delhi', type: 'INDIVIDUAL', bank: 'ICICI', city: 'Delhi NCR', state: 'Delhi', country: 'India', currency: 'INR', currency_symbol: '₹', lat: 28.6139, lng: 77.209, is_flagged: false },
          { id: 'ACC_0005', label: 'mule-sbi-alwar', type: 'INDIVIDUAL', bank: 'SBI', city: 'Alwar', state: 'Rajasthan', country: 'India', currency: 'INR', currency_symbol: '₹', lat: 27.553, lng: 76.6346, is_flagged: true },
          { id: 'ACC_0006', label: 'user-axis-blr', type: 'MERCHANT', bank: 'AXIS', city: 'Bengaluru', state: 'Karnataka', country: 'India', currency: 'INR', currency_symbol: '₹', lat: 12.9716, lng: 77.5946, is_flagged: false },
          { id: 'ACC_0007', label: 'mule-pnb-kolkata', type: 'INDIVIDUAL', bank: 'PNB', city: 'Kolkata', state: 'West Bengal', country: 'India', currency: 'INR', currency_symbol: '₹', lat: 22.5726, lng: 88.3639, is_flagged: true },
        ];

        const fallbackLinks: GlobeLink[] = [
          { tx_id: 'TX_01', source: 'ACC_0001', target: 'ACC_0002', amount: 85000, currency: 'INR', currency_symbol: '₹', from_city: 'Mumbai', to_city: 'Jamtara', from_country: 'India', to_country: 'India', from_lat: 19.076, from_lng: 72.8777, to_lat: 23.9633, to_lng: 86.8029, is_flagged: true, ring_id: 'R1_COLLECT_FAN_IN' },
          { tx_id: 'TX_02', source: 'ACC_0004', target: 'ACC_0003', amount: 120000, currency: 'INR', currency_symbol: '₹', from_city: 'Delhi NCR', to_city: 'Mewat/Nuh', from_country: 'India', to_country: 'India', from_lat: 28.6139, from_lng: 77.209, to_lat: 28.1132, to_lng: 77.0028, is_flagged: true, ring_id: 'R3_DEVICE_CONCURRENCY' },
          { tx_id: 'TX_03', source: 'ACC_0006', target: 'ACC_0005', amount: 48000, currency: 'INR', currency_symbol: '₹', from_city: 'Bengaluru', to_city: 'Alwar', from_country: 'India', to_country: 'India', from_lat: 12.9716, from_lng: 77.5946, to_lat: 27.553, to_lng: 76.6346, is_flagged: true, ring_id: 'R2_RAPID_DRAIN' },
          { tx_id: 'TX_04', source: 'ACC_0007', target: 'ACC_0002', amount: 65000, currency: 'INR', currency_symbol: '₹', from_city: 'Kolkata', to_city: 'Jamtara', from_country: 'India', to_country: 'India', from_lat: 22.5726, from_lng: 88.3639, to_lat: 23.9633, to_lng: 86.8029, is_flagged: true, ring_id: 'R1_COLLECT_FAN_IN' },
        ];

        setGeoData({
          nodes: fallbackNodes,
          links: fallbackLinks,
          impossible_travel: [
            {
              anomaly_id: 'IMP_01',
              entity_id: 'DEV_SYNDICATE_01',
              from_city: 'Mumbai',
              from_country: 'India',
              to_city: 'Jamtara',
              to_country: 'India',
              from_lat: 19.076,
              from_lng: 72.8777,
              to_lat: 23.9633,
              to_lng: 86.8029,
              distance_km: 1582.4,
              velocity_kmh: 15824,
              explanation: 'Simultaneous UPI authorization between Mumbai and Jamtara (1,582 km in 6 min). Account takeover.',
            },
          ],
          syndicate_hotspots: [],
        });
      });
  }, []);

  const handleSelectNode = useCallback((node: GlobeNode) => {
    setSelectedNode(node);
    setSelectedLink(null);
  }, []);

  const handleSelectLink = useCallback((link: GlobeLink) => {
    setSelectedLink(link);
    setSelectedNode(null);
  }, []);

  return (
    <div className="flex h-screen w-screen flex-col bg-black text-white font-mono overflow-hidden select-none">
      {/* Top Cyber Command Header */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-green-500/40 bg-black px-4 z-30 shadow-[0_4px_20px_rgba(0,0,0,0.8)]">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-green-400 animate-ping" />
            <h1 className="text-sm font-black tracking-widest text-white uppercase flex items-center gap-2">
              <span className="text-green-400">AEGIS</span> INDIA UPI SURVEILLANCE
            </h1>
          </div>
          <div className="hidden lg:flex items-center gap-1.5 border-l border-green-500/30 pl-3 text-[10px]">
            <span className="px-1.5 py-0.5 rounded bg-black text-white border border-slate-700">⬛ VOID</span>
            <span className="px-1.5 py-0.5 rounded bg-red-950 text-red-400 border border-red-500 font-bold">🟥 FLAGGED MULE</span>
            <span className="px-1.5 py-0.5 rounded bg-green-950 text-green-400 border border-green-500 font-bold">🟩 VERIFIED UPI</span>
            <span className="px-1.5 py-0.5 rounded bg-slate-900 text-white border border-white font-bold">⬜ BANK RAIL</span>
          </div>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-1 bg-black p-1 rounded border border-green-500/40">
          <button
            onClick={() => setViewMode('3d-globe')}
            className={`px-3 py-1 rounded text-xs font-bold transition-all ${
              viewMode === '3d-globe'
                ? 'bg-green-500 text-black shadow-[0_0_12px_rgba(0,255,102,0.8)]'
                : 'text-green-400 hover:bg-green-950/60'
            }`}
          >
            🌐 3D CYBER GLOBE
          </button>
          <button
            onClick={() => setViewMode('carto-map')}
            className={`px-3 py-1 rounded text-xs font-bold transition-all ${
              viewMode === 'carto-map'
                ? 'bg-green-500 text-black shadow-[0_0_12px_rgba(0,255,102,0.8)]'
                : 'text-green-400 hover:bg-green-950/60'
            }`}
          >
            🗺️ CARTO INDIA MAP
          </button>
          <button
            onClick={() => setViewMode('split-hud')}
            className={`px-3 py-1 rounded text-xs font-bold transition-all ${
              viewMode === 'split-hud'
                ? 'bg-green-500 text-black shadow-[0_0_12px_rgba(0,255,102,0.8)]'
                : 'text-green-400 hover:bg-green-950/60'
            }`}
          >
            ⚡ SPLIT HUD
          </button>
          <button
            onClick={() => setViewMode('workbench')}
            className={`px-3 py-1 rounded text-xs font-bold transition-all ${
              viewMode === 'workbench'
                ? 'bg-green-500 text-black shadow-[0_0_12px_rgba(0,255,102,0.8)]'
                : 'text-green-400 hover:bg-green-950/60'
            }`}
          >
            🔍 WORKBENCH
          </button>
        </div>

        {/* Kaggle Toggle & Benchmarks Link */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowKaggleHub((prev) => !prev)}
            className={`px-2.5 py-1 rounded text-xs border transition-colors ${
              showKaggleHub
                ? 'bg-green-500 text-black border-green-400 font-bold'
                : 'bg-black text-green-400 border-green-500/60 hover:bg-green-950'
            }`}
          >
            ⚡ KAGGLE FEED
          </button>
          <Link
            href="/evaluation"
            className="rounded border border-green-500/50 bg-black px-2.5 py-1 text-xs text-white hover:bg-green-950 transition-colors"
          >
            Benchmarks ↗
          </Link>
        </div>
      </header>

      {/* Main Interactive Stage */}
      <main className="relative flex-1 w-full h-[calc(100vh-56px-40px)] bg-black overflow-hidden">
        {/* VIEW 1: 3D CYBER GLOBE (Side-by-side with Live Rupee Transaction Feed & Pattern Panel) */}
        {viewMode === '3d-globe' && (
          <div className="flex flex-col lg:flex-row w-full h-full divide-y lg:divide-y-0 lg:divide-x divide-green-500/40">
            {/* Left Stage: 3D Cyber Globe (Zooming directly into India and staying) */}
            <div className="relative flex-1 h-full min-h-[400px]">
              <CyberGlobe3D
                nodes={geoData.nodes}
                links={geoData.links}
                onSelectNode={handleSelectNode}
                onSelectLink={handleSelectLink}
              />
              <PipelineSequenceController />
            </div>

            {/* Right Stage: Side-by-Side Live Rupee Transaction Feed & Pattern Panel */}
            <div className="w-full lg:w-[420px] xl:w-[460px] h-full shrink-0">
              <LiveRupeeTransactionFeed
                links={geoData.links}
                nodes={geoData.nodes}
                onSelectLink={handleSelectLink}
                onSelectHotspot={(city) => {
                  setViewMode('carto-map');
                }}
              />
            </div>
          </div>
        )}

        {/* VIEW 2: CARTO INDIA MAP (Bounded strictly to India with City & State Pattern Search Portal) */}
        {viewMode === 'carto-map' && (
          <div className="relative w-full h-full">
            <CartoWorldMap
              nodes={geoData.nodes}
              links={geoData.links}
              impossibleTravel={geoData.impossible_travel}
              onSelectNode={handleSelectNode}
              onSelectLink={handleSelectLink}
            />
          </div>
        )}

        {/* VIEW 3: SPLIT HUD (Globe Left, CARTO Map Right) */}
        {viewMode === 'split-hud' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 w-full h-full divide-y lg:divide-y-0 lg:divide-x divide-green-500/40">
            <div className="relative w-full h-full">
              <CyberGlobe3D
                nodes={geoData.nodes}
                links={geoData.links}
                onSelectNode={handleSelectNode}
                onSelectLink={handleSelectLink}
              />
            </div>
            <div className="relative w-full h-full">
              <CartoWorldMap
                nodes={geoData.nodes}
                links={geoData.links}
                impossibleTravel={geoData.impossible_travel}
                onSelectNode={handleSelectNode}
                onSelectLink={handleSelectLink}
              />
            </div>
          </div>
        )}

        {/* VIEW 4: WORKBENCH (Arranged properly with 3 cyber columns: Queue, Graph Explorer, Evidence Analysis) */}
        {viewMode === 'workbench' && (
          <div className="min-h-0 flex-1 grid grid-cols-1 lg:grid-cols-[330px_1fr_390px] w-full h-full divide-y lg:divide-y-0 lg:divide-x divide-green-500/40 bg-black">
            <section className="min-h-0 h-full overflow-hidden flex flex-col bg-black">
              <QueuePane />
            </section>
            <section className="min-h-0 flex-1 h-full overflow-hidden flex flex-col bg-black">
              <GraphPane />
            </section>
            <section className="min-h-0 h-full overflow-hidden flex flex-col bg-black">
              <EvidencePane />
            </section>
          </div>
        )}

        {/* Kaggle Data Ingestion Modal / Drawer */}
        {showKaggleHub && (
          <div className="absolute left-4 bottom-4 z-40 w-full max-w-xl animate-in slide-in-from-bottom duration-300">
            <KaggleDataHub />
          </div>
        )}

        {/* Connection and Account Detail Drawer */}
        <ConnectionInspectorDrawer
          selectedNode={selectedNode}
          selectedLink={selectedLink}
          onClose={() => {
            setSelectedNode(null);
            setSelectedLink(null);
          }}
        />
      </main>

      {/* Bottom Live Pipeline Stream Ticker */}
      <LiveFooterTicker
        accountsCount={geoData.nodes.length}
        corridorsCount={geoData.links.length}
      />
    </div>
  );
}
