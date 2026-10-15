'use client';

import React, { useState, useEffect } from 'react';
import type { GlobeLink, GlobeNode } from './CyberGlobe3D';

interface Props {
  links: GlobeLink[];
  nodes: GlobeNode[];
  onSelectLink?: (link: GlobeLink) => void;
  onSelectHotspot?: (city: string) => void;
}

const INDIAN_CRIME_MOTIFS: Record<string, string> = {
  Jamtara: 'COLLECT FAN-IN (R1)',
  'Mewat/Nuh': 'SHARED DEVICE BURST (R3)',
  Mewat: 'SHARED DEVICE BURST (R3)',
  Alwar: 'LAYER-2 MULE PASSTHROUGH',
  Bharatpur: 'SIM-BOX MULTI-VPA',
  Deoghar: 'OTP IMPERSONATION TROJAN',
  Mumbai: 'COMMERCIAL SHELL FUNNEL',
  'Delhi NCR': 'DYNAMIC QR CODE DIVERT',
  Delhi: 'DYNAMIC QR CODE DIVERT',
  Bengaluru: 'CRYPTO P2P ON-RAMP EXIT',
  Kolkata: 'RENTED PASSBOOK FEEDER',
  Pune: 'MERCHANT PASSTHROUGH HOP',
};

export default function LiveRupeeTransactionFeed({
  links,
  nodes,
  onSelectLink,
  onSelectHotspot,
}: Props) {
  const [filterMode, setFilterMode] = useState<'all' | 'flagged'>('all');
  const [streamIndex, setStreamIndex] = useState<number>(0);
  const [paused, setPaused] = useState<boolean>(false);

  // Increment live stream feed tick every 1.8 seconds to simulate real-time UPI traffic
  useEffect(() => {
    if (paused) return;
    const interval = setInterval(() => {
      setStreamIndex((prev) => prev + 1);
    }, 1800);
    return () => clearInterval(interval);
  }, [paused]);

  const flaggedCount = links.filter((l) => l.is_flagged).length;
  const totalVolumeInr = links.reduce((sum, l) => sum + l.amount, 0);
  const flaggedVolumeInr = links.filter((l) => l.is_flagged).reduce((sum, l) => sum + l.amount, 0);

  // Prepare active transaction slice with rotation
  const displayPool = links.length > 0 ? links : [];
  const filtered = filterMode === 'flagged' ? displayPool.filter((l) => l.is_flagged) : displayPool;

  // Window of currently visible live transactions
  const visibleCount = 12;
  const startIndex = filtered.length > 0 ? (streamIndex % filtered.length) : 0;
  const visibleTxs: GlobeLink[] = [];
  if (filtered.length > 0) {
    for (let i = 0; i < Math.min(visibleCount, filtered.length); i++) {
      const idx = (startIndex + i) % filtered.length;
      visibleTxs.push(filtered[idx]);
    }
  }

  const getMotif = (link: GlobeLink) => {
    return (
      INDIAN_CRIME_MOTIFS[link.to_city] ||
      INDIAN_CRIME_MOTIFS[link.from_city] ||
      (link.is_flagged ? 'SUSPICIOUS VELOCITY HOP' : 'DOMESTIC P2P TRANSFER')
    );
  };

  return (
    <div className="flex flex-col h-full bg-black/95 border-l border-green-500/40 text-white font-mono select-none overflow-hidden backdrop-blur-md">
      {/* 1. Header Bar */}
      <div className="shrink-0 p-3.5 border-b border-green-500/40 bg-black">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
            <h2 className="text-xs font-black tracking-widest text-white uppercase">
              LIVE UPI RUPEE TRANSACTION STREAM
            </h2>
          </div>
          <span className="px-2 py-0.5 rounded bg-green-950 text-green-300 border border-green-500 text-[10px] font-black">
            ₹ INR RAIL
          </span>
        </div>

        <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
          <span>SOURCE: FED RUPEE DATASET · 180 ACCOUNTS</span>
          <button
            onClick={() => setPaused(!paused)}
            className="text-[9px] px-1.5 py-0.5 rounded border border-slate-700 hover:border-slate-500 text-slate-300"
          >
            {paused ? '▶ RESUME' : '⏸ PAUSE'}
          </button>
        </div>

        {/* Real-Time Metrics Strip */}
        <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-slate-900 text-center">
          <div className="p-1.5 rounded bg-black border border-green-500/30">
            <div className="text-[9px] text-slate-400 uppercase">TOTAL UPI FLOW</div>
            <div className="text-xs font-black text-green-400">
              ₹{(totalVolumeInr / 100000).toFixed(1)}L
            </div>
          </div>
          <div className="p-1.5 rounded bg-black border border-red-500/40">
            <div className="text-[9px] text-slate-400 uppercase">FLAGGED CRIME</div>
            <div className="text-xs font-black text-red-400">
              ₹{(flaggedVolumeInr / 100000).toFixed(1)}L
            </div>
          </div>
          <div className="p-1.5 rounded bg-black border border-red-500/40">
            <div className="text-[9px] text-slate-400 uppercase">FLAGGED HOPS</div>
            <div className="text-xs font-black text-red-400">
              {flaggedCount} Corridors
            </div>
          </div>
        </div>
      </div>

      {/* 2. Detected Indian Criminal Pattern Quick Bar */}
      <div className="shrink-0 p-2.5 bg-black border-b border-green-500/30">
        <div className="text-[10px] font-bold text-slate-400 uppercase mb-1.5 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
            ACTIVE SYNDICATE PATTERN HOTSPOTS:
          </span>
          <span className="text-[9px] text-green-400">NPCI SURVEILLANCE</span>
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {[
            { city: 'Jamtara', tag: 'Phishing Fan-In', risk: '96%' },
            { city: 'Mewat', tag: 'Device Burst', risk: '94%' },
            { city: 'Alwar', tag: 'Passthrough Hop', risk: '88%' },
            { city: 'Bharatpur', tag: 'SIM-Box', risk: '85%' },
            { city: 'Deoghar', tag: 'OTP Trojans', risk: '91%' },
            { city: 'Mumbai', tag: 'Commercial Funnel', risk: '76%' },
          ].map((h) => (
            <button
              key={h.city}
              onClick={() => onSelectHotspot && onSelectHotspot(h.city)}
              className="shrink-0 px-2 py-1 rounded bg-black border border-red-500/60 hover:bg-red-950 text-left transition-colors"
            >
              <div className="text-[10px] font-black text-white flex items-center justify-between gap-1">
                <span>{h.city}</span>
                <span className="text-red-400 text-[9px]">{h.risk}</span>
              </div>
              <div className="text-[8px] text-slate-400 truncate">{h.tag}</div>
            </button>
          ))}
        </div>
      </div>

      {/* 3. Filter Toggle Chips */}
      <div className="shrink-0 px-3 py-1.5 bg-black border-b border-slate-900 flex items-center justify-between text-[10px]">
        <span className="text-slate-400 font-bold uppercase">LIVE FEED STREAM:</span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setFilterMode('all')}
            className={`px-2 py-0.5 rounded font-bold transition-colors ${
              filterMode === 'all'
                ? 'bg-green-500 text-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All Transactions
          </button>
          <button
            onClick={() => setFilterMode('flagged')}
            className={`px-2 py-0.5 rounded font-bold transition-colors ${
              filterMode === 'flagged'
                ? 'bg-red-500 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Flagged Only ({flaggedCount})
          </button>
        </div>
      </div>

      {/* 4. Auto-Streaming Transaction List */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
        {visibleTxs.map((tx, idx) => {
          const isFlagged = tx.is_flagged;
          const motif = getMotif(tx);
          const isLatest = idx === 0;

          return (
            <div
              key={`${tx.tx_id}-${idx}`}
              onClick={() => onSelectLink && onSelectLink(tx)}
              className={`p-2.5 rounded-lg border transition-all cursor-pointer hover:scale-[1.01] ${
                isFlagged
                  ? 'bg-black border-red-500/80 hover:border-red-400 shadow-[0_0_10px_rgba(255,0,63,0.25)]'
                  : 'bg-black border-green-500/40 hover:border-green-400 shadow-[0_0_8px_rgba(0,255,102,0.15)]'
              } ${isLatest ? 'animate-in fade-in slide-in-from-top duration-300 ring-1 ring-green-400' : ''}`}
            >
              {/* Header Line: Status + Amount in ₹ */}
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isFlagged ? 'bg-red-500 animate-pulse' : 'bg-green-400'
                    }`}
                  />
                  <span className="text-[10px] font-bold text-slate-400">
                    {tx.tx_id}
                  </span>
                </div>
                <div
                  className={`text-sm font-black tracking-wider ${
                    isFlagged ? 'text-red-400' : 'text-green-400'
                  }`}
                >
                  ₹{tx.amount.toLocaleString('en-IN')}
                </div>
              </div>

              {/* Hop Linkage: From City/Account ➔ To City/Account */}
              <div className="text-[11px] font-bold text-white flex items-center justify-between gap-1 my-1">
                <span className="truncate max-w-[130px] text-slate-200">
                  {tx.from_city} ({tx.source.slice(-6)})
                </span>
                <span className="text-green-400 font-black shrink-0">──▶</span>
                <span className="truncate max-w-[130px] text-right text-slate-200">
                  {tx.to_city} ({tx.target.slice(-6)})
                </span>
              </div>

              {/* Crime Motif Tag / Status Badge */}
              <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-900 text-[9px]">
                <span
                  className={`px-1.5 py-0.5 rounded font-black ${
                    isFlagged
                      ? 'bg-red-950 text-red-300 border border-red-500'
                      : 'bg-green-950 text-green-300 border border-green-500'
                  }`}
                >
                  {isFlagged ? `⚠️ ${motif}` : '✓ VERIFIED DOMESTIC UPI'}
                </span>
                <span className="text-slate-500">
                  {tx.timestamp ? tx.timestamp.slice(11, 19) : 'LIVE SETTLED'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
