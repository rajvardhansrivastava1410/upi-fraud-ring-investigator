'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import CyberGlobe3D, { type GlobeNode, type GlobeLink } from '@/components/CyberGlobe3D';
import PipelineSequenceController from '@/components/PipelineSequenceController';
import KaggleDataHub from '@/components/KaggleDataHub';
import ConnectionInspectorDrawer from '@/components/ConnectionInspectorDrawer';

// Leaflet and Cytoscape require dynamic import with ssr: false
const CartoWorldMap = dynamic(() => import('@/components/CartoWorldMap'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-black">
      <div className="flex items-center gap-2 font-mono text-xs text-green-400">
        <span className="w-2.5 h-2.5 rounded-full bg-green-400 animate-ping" />
        LOADING CARTO DARK MATTER BASEMAP...
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
  const [tickerIndex, setTickerIndex] = useState(0);
  const [showKaggleHub, setShowKaggleHub] = useState(false);

  // Fetch live global nodes, links, and impossible travel from FastAPI backend
  useEffect(() => {
    fetch('/geo/surveillance')
      .then((res) => {
        if (!res.ok) throw new Error('API not ready');
        return res.json();
      })
      .then((data) => {
        if (data.nodes && data.links) {
          // Enhance domestic and offshore bank labels so user-hdfc and user-amex are prominent
          const enhancedNodes = data.nodes.map((n: GlobeNode) => {
            const isOffshore = n.country !== 'India' || n.currency === 'USD';
            let bank = n.bank;
            let label = n.label;
            if (isOffshore) {
              if (n.city === 'Dubai' || n.city === 'George Town') bank = 'AMEX';
              else if (n.city === 'New York') bank = 'CHASE';
              else if (n.city === 'London' || n.city === 'Zurich') bank = 'HSBC';
              else bank = 'AMEX';
              label = `user-amex-${n.id.slice(-4)}`;
            } else {
              if (n.bank === 'UPI' || n.bank === 'PAYTM_PB') bank = 'HDFC';
              label = `user-hdfc-${n.id.slice(-4)}`;
            }
            return { ...n, bank, label };
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
        // Fallback demo fixtures if backend is busy
        const fallbackNodes: GlobeNode[] = [
          { id: 'ACC_0001', label: 'user-hdfc-3b1c', type: 'INDIVIDUAL', bank: 'HDFC', city: 'Mumbai', country: 'India', currency: 'INR', currency_symbol: '₹', lat: 19.076, lng: 72.8777, is_flagged: false },
          { id: 'ACC_0002', label: 'user-hdfc-8d42', type: 'INDIVIDUAL', bank: 'HDFC', city: 'Delhi NCR', country: 'India', currency: 'INR', currency_symbol: '₹', lat: 28.6139, lng: 77.209, is_flagged: true },
          { id: 'ACC_0003', label: 'user-amex-dubai', type: 'MERCHANT', bank: 'AMEX', city: 'Dubai', country: 'United Arab Emirates', currency: 'USD', currency_symbol: '$', lat: 25.2048, lng: 55.2708, is_flagged: true },
          { id: 'ACC_0004', label: 'user-chase-ny', type: 'INDIVIDUAL', bank: 'CHASE', city: 'New York', country: 'United States', currency: 'USD', currency_symbol: '$', lat: 40.7128, lng: -74.006, is_flagged: true },
          { id: 'ACC_0005', label: 'user-hsbc-london', type: 'INDIVIDUAL', bank: 'HSBC', city: 'London', country: 'United Kingdom', currency: 'USD', currency_symbol: '$', lat: 51.5074, lng: -0.1278, is_flagged: false },
          { id: 'ACC_0006', label: 'user-amex-sg', type: 'MERCHANT', bank: 'AMEX', city: 'Singapore', country: 'Singapore', currency: 'USD', currency_symbol: '$', lat: 1.3521, lng: 103.8198, is_flagged: true },
          { id: 'ACC_0007', label: 'user-hsbc-zurich', type: 'INDIVIDUAL', bank: 'HSBC', city: 'Zurich', country: 'Switzerland', currency: 'USD', currency_symbol: '$', lat: 47.3769, lng: 8.5417, is_flagged: true },
        ];

        const fallbackLinks: GlobeLink[] = [
          { tx_id: 'TX_01', source: 'ACC_0001', target: 'ACC_0003', amount: 85000, amount_usd: 1018, currency: 'USD', currency_symbol: '$', from_city: 'Mumbai', to_city: 'Dubai', from_country: 'India', to_country: 'United Arab Emirates', from_lat: 19.076, from_lng: 72.8777, to_lat: 25.2048, to_lng: 55.2708, is_flagged: true },
          { tx_id: 'TX_02', source: 'ACC_0003', target: 'ACC_0004', amount: 980, amount_usd: 980, currency: 'USD', currency_symbol: '$', from_city: 'Dubai', to_city: 'New York', from_country: 'United Arab Emirates', to_country: 'United States', from_lat: 25.2048, from_lng: 55.2708, to_lat: 40.7128, to_lng: -74.006, is_flagged: true },
          { tx_id: 'TX_03', source: 'ACC_0002', target: 'ACC_0005', amount: 45000, amount_usd: 538, currency: 'USD', currency_symbol: '$', from_city: 'Delhi NCR', to_city: 'London', from_country: 'India', to_country: 'United Kingdom', from_lat: 28.6139, from_lng: 77.209, to_lat: 51.5074, to_lng: -0.1278, is_flagged: false },
          { tx_id: 'TX_04', source: 'ACC_0005', target: 'ACC_0007', amount: 520, amount_usd: 520, currency: 'USD', currency_symbol: '$', from_city: 'London', to_city: 'Zurich', from_country: 'United Kingdom', to_country: 'Switzerland', from_lat: 51.5074, from_lng: -0.1278, to_lat: 47.3769, to_lng: 8.5417, is_flagged: true },
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
              to_city: 'New York',
              to_country: 'United States',
              from_lat: 19.076,
              from_lng: 72.8777,
              to_lat: 40.7128,
              to_lng: -74.006,
              distance_km: 12540.8,
              velocity_kmh: 88518,
              explanation: 'Device transacted from Mumbai then New York in 8.5 min (88,518 km/h). Proof of offshore VPN / account takeover.',
            },
          ],
          syndicate_hotspots: [],
        });
      });
  }, []);

  // Cycle the live transaction ticker every 3.5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setTickerIndex((prev) => prev + 1);
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  const activeTickers = [
    { source: 'user-hdfc-3b1c [Mumbai 🇮🇳]', target: 'user-amex-dubai [Dubai 🇦🇪]', amt: '₹85,000 ➔ $1,018', status: 'CRITICAL_CORRIDOR_FLAGGED', isAlert: true },
    { source: 'user-hdfc-8d42 [Delhi 🇮🇳]', target: 'user-chase-ny [New York 🇺🇸]', amt: '$1,250.00', status: 'IMPOSSIBLE_VELOCITY (88,518 km/h)', isAlert: true },
    { source: 'user-hdfc-c07e [Bengaluru 🇮🇳]', target: 'user-hsbc-london [London 🇬🇧]', amt: '₹140,000', status: 'VERIFIED_CORRESPONDENT_CLEARING', isAlert: false },
    { source: 'user-amex-dubai [Dubai 🇦🇪]', target: 'user-hsbc-zurich [Zurich 🇨🇭]', amt: '$42,500.00', status: 'HAWALA_DRAIN_INTERCEPTED', isAlert: true },
  ];
  const currentTicker = activeTickers[tickerIndex % activeTickers.length];

  return (
    <div className="flex h-screen w-screen flex-col bg-black text-white font-mono overflow-hidden select-none">
      {/* Top Cyber Command Header */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-green-500/40 bg-black px-4 z-30 shadow-[0_4px_20px_rgba(0,0,0,0.8)]">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-green-400 animate-ping" />
            <h1 className="text-sm font-black tracking-widest text-white uppercase flex items-center gap-2">
              <span className="text-green-400">AEGIS</span> GLOBAL TELEMETRY
            </h1>
          </div>
          <div className="hidden lg:flex items-center gap-1.5 border-l border-green-500/30 pl-3 text-[10px]">
            <span className="px-1.5 py-0.5 rounded bg-black text-white border border-slate-700">⬛ VOID</span>
            <span className="px-1.5 py-0.5 rounded bg-red-950 text-red-400 border border-red-500 font-bold">🟥 FLAGGED</span>
            <span className="px-1.5 py-0.5 rounded bg-green-950 text-green-400 border border-green-500 font-bold">🟩 VERIFIED</span>
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
            🗺️ CARTO BASEMAP
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
        {/* VIEW 1: 3D CYBER GLOBE */}
        {viewMode === '3d-globe' && (
          <div className="relative w-full h-full">
            <CyberGlobe3D
              nodes={geoData.nodes}
              links={geoData.links}
              onSelectNode={(node) => {
                setSelectedNode(node);
                setSelectedLink(null);
              }}
              onSelectLink={(link) => {
                setSelectedLink(link);
                setSelectedNode(null);
              }}
            />
            <PipelineSequenceController />
          </div>
        )}

        {/* VIEW 2: CARTO WORLD MAP */}
        {viewMode === 'carto-map' && (
          <div className="relative w-full h-full">
            <CartoWorldMap
              nodes={geoData.nodes}
              links={geoData.links}
              impossibleTravel={geoData.impossible_travel}
              onSelectNode={(node) => {
                setSelectedNode(node);
                setSelectedLink(null);
              }}
              onSelectLink={(link) => {
                setSelectedLink(link);
                setSelectedNode(null);
              }}
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
                onSelectNode={setSelectedNode}
                onSelectLink={setSelectedLink}
              />
            </div>
            <div className="relative w-full h-full">
              <CartoWorldMap
                nodes={geoData.nodes}
                links={geoData.links}
                impossibleTravel={geoData.impossible_travel}
                onSelectNode={setSelectedNode}
                onSelectLink={setSelectedLink}
              />
            </div>
          </div>
        )}

        {/* VIEW 4: WORKBENCH (Cytoscape 3-pane) */}
        {viewMode === 'workbench' && (
          <div className="min-h-0 flex-1 flex flex-col lg:grid lg:grid-cols-[320px_1fr_380px] w-full h-full">
            <section className="hidden lg:flex min-h-0 flex-col border-r border-green-500/30 overflow-y-auto bg-black">
              <QueuePane />
            </section>
            <section className="min-h-0 flex-1 h-full overflow-hidden flex flex-col bg-black">
              <GraphPane />
            </section>
            <section className="min-h-0 border-t border-green-500/30 lg:border-t-0 lg:border-l h-full overflow-hidden flex flex-col bg-black">
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
      <footer className="h-10 shrink-0 border-t border-green-500/40 bg-black px-4 flex items-center justify-between z-30 font-mono text-xs">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="flex items-center gap-1.5 shrink-0 text-green-400 font-bold">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span>LIVE CORRIDOR STREAM:</span>
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
            DATABASE: <span className="text-white font-bold">{geoData.nodes.length} ACCOUNTS · {geoData.links.length} CORRIDORS</span>
          </div>
          <div>
            CARTO API: <span className="text-green-400 font-bold">AUTHENTICATED</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
