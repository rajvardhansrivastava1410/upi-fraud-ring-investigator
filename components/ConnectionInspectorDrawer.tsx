'use client';

import React from 'react';
import type { GlobeNode, GlobeLink } from './CyberGlobe3D';

interface Props {
  selectedNode: GlobeNode | null;
  selectedLink: GlobeLink | null;
  onClose: () => void;
}

const COUNTRY_FLAGS: Record<string, string> = {
  India: '🇮🇳',
  'United States': '🇺🇸',
  'United Arab Emirates': '🇦🇪',
  'United Kingdom': '🇬🇧',
  Singapore: '🇸🇬',
  Switzerland: '🇨🇭',
  Nigeria: '🇳🇬',
  Romania: '🇷🇴',
  Germany: '🇩🇪',
  'Hong Kong': '🇭🇰',
  'Cayman Islands': '🇰🇾',
  Panama: '🇵🇦',
};

export default function ConnectionInspectorDrawer({ selectedNode, selectedLink, onClose }: Props) {
  if (!selectedNode && !selectedLink) return null;

  return (
    <div className="absolute right-4 top-20 z-40 w-80 md:w-96 bg-black/95 border-2 border-green-500 p-4 rounded-lg shadow-[0_0_30px_rgba(0,0,0,0.95)] backdrop-blur-xl font-mono text-xs text-white animate-in slide-in-from-right duration-300">
      <div className="flex items-center justify-between border-b border-green-500/40 pb-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />
          <span className="font-bold tracking-widest text-sm text-white">
            {selectedLink ? 'PIPELINE CONNECTION' : 'ACCOUNT TELEMETRY'}
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white px-2 py-0.5 rounded border border-slate-800 hover:border-slate-600"
        >
          ✕
        </button>
      </div>

      {/* When a Link / Pipeline is selected */}
      {selectedLink && (
        <div className="space-y-3">
          <div className="p-2.5 rounded bg-black border border-green-500/30 flex items-center justify-between">
            <div>
              <div className="text-[10px] text-slate-400">TRANSACTION PIPELINE</div>
              <div className="text-base font-bold text-green-400">
                ₹{selectedLink.amount.toLocaleString('en-IN')}
              </div>
            </div>
            <div className={`px-2 py-1 rounded text-[10px] font-bold ${selectedLink.is_flagged ? 'bg-red-950 text-red-400 border border-red-500' : 'bg-green-950 text-green-400 border border-green-500'}`}>
              {selectedLink.is_flagged ? 'FLAGGED CORRIDOR' : 'VERIFIED TRANSIT'}
            </div>
          </div>

          {/* Connection Chain: User ➔ Bank ➔ Target ➔ Bank */}
          <div className="p-3 rounded bg-black border border-slate-800 space-y-2">
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              DOMESTIC UPI CORRIDOR HOP
            </div>
            <div className="flex items-center gap-2">
              <span className="text-base">🇮🇳</span>
              <div className="flex-1 truncate">
                <div className="font-bold text-white truncate">{selectedLink.source}</div>
                <div className="text-[10px] text-slate-400">{selectedLink.from_city} · <strong className="text-green-400">Domestic Account</strong></div>
              </div>
            </div>

            <div className="flex justify-center text-green-400 font-bold text-xs my-1">
              ▼ [ RAPID UPI SETTLEMENT RAIL (₹) ] ▼
            </div>

            <div className="flex items-center gap-2">
              <span className="text-base">🇮🇳</span>
              <div className="flex-1 truncate">
                <div className="font-bold text-white truncate">{selectedLink.target}</div>
                <div className="text-[10px] text-slate-400">{selectedLink.to_city} · <strong className={selectedLink.is_flagged ? 'text-red-400' : 'text-green-400'}>{selectedLink.is_flagged ? 'Flagged Mule' : 'Verified Merchant'}</strong></div>
              </div>
            </div>
          </div>

          <div className="p-2.5 rounded bg-black border border-slate-800 text-[11px] space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-400">TX ID:</span>
              <span className="font-bold">{selectedLink.tx_id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Settlement Rail:</span>
              <span className="font-bold text-green-400">₹ INR (UPI Instant)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Attributed Pattern:</span>
              <span className="font-bold text-red-400">{selectedLink.ring_id || 'R1_COLLECT_FAN_IN'}</span>
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={() => alert(`Freezing UPI Corridor ${selectedLink.tx_id} across domestic NPCI/bank rails.`)}
              className="flex-1 py-1.5 bg-red-950 border border-red-500 text-red-300 hover:bg-red-900 rounded font-bold text-center transition-colors"
            >
              ⛔ INTERCEPT CORRIDOR
            </button>
          </div>
        </div>
      )}

      {/* When a Node is selected */}
      {selectedNode && !selectedLink && (
        <div className="space-y-3">
          <div className="p-2.5 rounded bg-black border border-green-500/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{COUNTRY_FLAGS[selectedNode.country] || '🌐'}</span>
              <div>
                <div className="font-bold text-sm text-white">{selectedNode.label}</div>
                <div className="text-[10px] text-slate-400">{selectedNode.city}, {selectedNode.country}</div>
              </div>
            </div>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${selectedNode.is_flagged ? 'bg-red-950 text-red-400 border border-red-500' : 'bg-green-950 text-green-400 border border-green-500'}`}>
              {selectedNode.is_flagged ? 'FLAGGED MULE' : 'VERIFIED'}
            </span>
          </div>

          <div className="p-2.5 rounded bg-black border border-slate-800 text-[11px] space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-400">Bank Rail:</span>
              <span className="font-bold text-white px-1.5 py-0.5 bg-slate-900 border border-slate-700 rounded">
                {selectedNode.bank}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Account ID:</span>
              <span className="font-bold">{selectedNode.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Category:</span>
              <span className="font-bold text-green-300">{selectedNode.category || selectedNode.type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Currency Rail:</span>
              <span className="font-bold">{selectedNode.currency} ({selectedNode.currency_symbol})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Coordinates:</span>
              <span className="font-mono text-slate-300">{selectedNode.lat.toFixed(4)}, {selectedNode.lng.toFixed(4)}</span>
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={() => alert(`Account ${selectedNode.id} [${selectedNode.bank}] flagged for priority investigation.`)}
              className="flex-1 py-1.5 bg-green-950 border border-green-500 text-green-300 hover:bg-green-900 rounded font-bold text-center transition-colors"
            >
              🔍 DEEP KYC AUDIT
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
