'use client';

import React, { useEffect, useRef, useState } from 'react';
import type { GlobeNode, GlobeLink } from './CyberGlobe3D';

interface ImpossibleTravel {
  anomaly_id: string;
  entity_id: string;
  from_city: string;
  from_country: string;
  to_city: string;
  to_country: string;
  from_lat: number;
  from_lng: number;
  to_lat: number;
  to_lng: number;
  distance_km: number;
  velocity_kmh: number;
  explanation: string;
}

interface LocationPattern {
  city: string;
  state: string;
  threat_score: number;
  threat_level: string;
  pattern_name: string;
  modus_operandi: string;
  key_motifs: string[];
  hotspot_badge: string;
  primary_banks: string[];
  risk_volume: number;
  lat: number;
  lng: number;
  active_mules_detected?: number;
  flagged_accounts?: string[];
  total_monitored_nodes?: number;
  detected_suspicious_volume_inr?: number;
  status?: string;
}

interface CartoWorldMapProps {
  nodes: GlobeNode[];
  links: GlobeLink[];
  impossibleTravel?: ImpossibleTravel[];
  onSelectNode?: (node: GlobeNode) => void;
  onSelectLink?: (link: GlobeLink) => void;
  selectedAlertId?: string | null;
}

const TOP_INDIAN_HOTSPOTS = [
  { name: 'Jamtara, JH', query: 'Jamtara', lat: 23.9633, lng: 86.8029, tag: 'PHISHING FAN-IN' },
  { name: 'Mewat/Nuh, HR', query: 'Mewat', lat: 28.1132, lng: 77.0028, tag: 'DEVICE CONCURRENCY' },
  { name: 'Alwar, RJ', query: 'Alwar', lat: 27.553, lng: 76.6346, tag: 'PASSTHROUGH MULE' },
  { name: 'Bharatpur, RJ', query: 'Bharatpur', lat: 27.2152, lng: 77.493, tag: 'SIM-BOX SYNDICATE' },
  { name: 'Deoghar, JH', query: 'Deoghar', lat: 24.4826, lng: 86.7001, tag: 'OTP INTERCEPT' },
  { name: 'Mumbai, MH', query: 'Mumbai', lat: 19.076, lng: 72.8777, tag: 'COMMERCIAL FUNNEL' },
  { name: 'Delhi NCR', query: 'Delhi', lat: 28.6139, lng: 77.209, tag: 'QR CODE DIVERT' },
  { name: 'Bengaluru, KA', query: 'Bengaluru', lat: 12.9716, lng: 77.5946, tag: 'CRYPTO EXIT' },
  { name: 'Kolkata, WB', query: 'Kolkata', lat: 22.5726, lng: 88.3639, tag: 'RENTED PASSBOOKS' },
  { name: 'Pune, MH', query: 'Pune', lat: 18.5204, lng: 73.8567, tag: 'RETAIL DIVERT' },
];

export default function CartoWorldMap({
  nodes,
  links,
  impossibleTravel = [],
  onSelectNode,
  onSelectLink,
  selectedAlertId,
}: CartoWorldMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const hotspotLayerRef = useRef<any>(null);

  // Search portal states
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedPattern, setSelectedPattern] = useState<LocationPattern | null>(null);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [selectedHop, setSelectedHop] = useState<string | null>(null);

  // Strict India Bounding Box: [South-West, North-East]
  // Lat: 6.5N to 36.5N, Lng: 68.0E to 97.5E
  const INDIA_BOUNDS: [[number, number], [number, number]] = [
    [6.5, 68.0],
    [36.5, 97.5],
  ];

  useEffect(() => {
    if (typeof window === 'undefined' || !mapContainerRef.current) return;

    let isMounted = true;

    import('leaflet').then((L) => {
      if (!isMounted || !mapContainerRef.current) return;

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      // Initialize map bounded strictly to India
      const map = L.map(mapContainerRef.current, {
        center: [22.8, 79.2], // Geometric center of India
        zoom: 5,
        minZoom: 4.5,
        maxZoom: 14,
        maxBounds: INDIA_BOUNDS,
        maxBoundsViscosity: 1.0, // Hard stop at boundaries
        zoomControl: false,
        attributionControl: false,
      });

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // Authenticated CARTO Dark Matter Tiles with API Key (no watermark)
      const cartoKey = 'cb1_4lfs_1_877e963395929fdf32bcaa9c';
      L.tileLayer(
        `https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png?key=${cartoKey}`,
        {
          subdomains: 'abcd',
          maxZoom: 19,
          attribution: '&copy; OpenStreetMap &copy; CARTO',
        }
      ).addTo(map);

      // 1. Transaction Pipeline Arcs (strictly Indian Corridors & ₹ Rupee)
      const linesGroup = L.layerGroup().addTo(map);

      links.slice(0, 180).forEach((link) => {
        const isFlagged = link.is_flagged || (selectedAlertId != null && link.ring_id === selectedAlertId);
        const color = isFlagged ? '#ff003f' : '#00ff66';
        const weight = isFlagged ? 2.5 : 1.2;
        const opacity = isFlagged ? 0.9 : 0.45;

        const line = L.polyline(
          [
            [link.from_lat, link.from_lng],
            [link.to_lat, link.to_lng],
          ],
          {
            color,
            weight,
            opacity,
            dashArray: isFlagged ? '6, 6' : undefined,
          }
        );

        const amountFormatted = `₹${link.amount.toLocaleString('en-IN')}`;

        line.bindTooltip(
          `
            <div style="font-family: monospace; font-size: 11px; background: #000000; color: #ffffff; padding: 6px; border: 1px solid ${color}; border-radius: 4px;">
              <span style="color: ${color}; font-weight: bold;">${link.from_city} ➔ ${link.to_city}</span><br/>
              <span style="color: #ffffff; font-weight: bold;">Amount: ${amountFormatted}</span><br/>
              <span style="color: #94a3b8;">TxID: ${link.tx_id}</span><br/>
              <span style="color: ${isFlagged ? '#ff003f' : '#00ff66'}; font-size: 10px;">${isFlagged ? '⚠️ FLAGGED UPI CORRIDOR' : '✓ VERIFIED DOMESTIC UPI'}</span>
            </div>
          `,
          { sticky: true }
        );

        line.on('click', () => {
          setSelectedHop(`${link.from_city} ➔ ${link.to_city} (${amountFormatted})`);
          if (onSelectLink) onSelectLink(link);
        });

        linesGroup.addLayer(line);
      });

      // 2. Impossible Travel vectors across Indian cities
      impossibleTravel.forEach((imp) => {
        const impLine = L.polyline(
          [
            [imp.from_lat, imp.from_lng],
            [imp.to_lat, imp.to_lng],
          ],
          {
            color: '#ff003f',
            weight: 3.5,
            opacity: 0.95,
            dashArray: '8, 8',
          }
        );

        impLine.bindTooltip(
          `
            <div style="font-family: monospace; font-size: 11px; color: #ff003f; background: #000000; padding: 6px; border: 1px solid #ff003f; border-radius: 4px;">
              <strong>⚠️ CRITICAL: CONCURRENT UPI IMPOSSIBLE VELOCITY</strong><br/>
              <span>${imp.from_city} ➔ ${imp.to_city}</span><br/>
              <span>Velocity: <strong>${imp.velocity_kmh.toLocaleString()} km/h</strong></span><br/>
              <span>Distance: ${imp.distance_km.toLocaleString()} km</span><br/>
              <span style="color: #ffffff;">${imp.explanation}</span>
            </div>
          `,
          { sticky: true }
        );

        linesGroup.addLayer(impLine);
      });

      // 3. Indian Bank Accounts & Mule Nodes
      const nodesGroup = L.layerGroup().addTo(map);

      nodes.forEach((node) => {
        const isRed = node.is_flagged;
        const colorHex = isRed ? '#ff003f' : '#00ff66';

        const iconHtml = `
          <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 24px; height: 24px;">
            <div style="position: absolute; width: 100%; height: 100%; border-radius: 50%; border: 1.5px solid ${colorHex}; background: ${isRed ? 'rgba(255,0,63,0.3)' : 'rgba(0,255,102,0.2)'};"></div>
            ${isRed ? `<div style="position: absolute; width: 34px; height: 34px; border-radius: 50%; border: 1px dashed #ff003f; opacity: 0.8; animation: spin 4s linear infinite;"></div>` : ''}
            <div style="font-size: 10px; font-weight: bold; color: ${colorHex}; z-index: 2;">₹</div>
          </div>
        `;

        const customIcon = L.divIcon({
          html: iconHtml,
          className: 'custom-indian-node',
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });

        const marker = L.marker([node.lat, node.lng], { icon: customIcon });

        marker.bindPopup(`
          <div style="font-family: monospace; font-size: 11px; min-width: 200px; background: #000000; color: #ffffff; padding: 4px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px; border-bottom: 1px solid rgba(0,255,102,0.3); padding-bottom: 4px;">
              <span style="font-size: 13px; font-weight: bold; color: #ffffff;">🇮🇳 ${node.city}</span>
              <span style="font-size: 10px; font-weight: bold; color: ${isRed ? '#ff003f' : '#00ff66'}; border: 1px solid ${isRed ? '#ff003f' : '#00ff66'}; padding: 1px 4px; border-radius: 3px;">${node.bank}</span>
            </div>
            <div><strong>VPA / ID:</strong> ${node.label || node.id}</div>
            <div><strong>Type:</strong> ${node.type}</div>
            <div><strong>State:</strong> ${node.state || 'India'}</div>
            <div><strong>Currency Rail:</strong> ₹ INR (UPI)</div>
            <div><strong>Classification:</strong> <span style="color: ${isRed ? '#ff003f' : '#00ff66'}; font-weight: bold;">${isRed ? 'FLAGGED MULE ACCOUNT' : 'VERIFIED RETAIL USER'}</span></div>
          </div>
        `);

        marker.on('click', () => {
          if (onSelectNode) onSelectNode(node);
        });

        nodesGroup.addLayer(marker);
      });

      // Layer for highlighted criminal pattern search radar
      const hotspotLayer = L.layerGroup().addTo(map);
      hotspotLayerRef.current = hotspotLayer;

      mapInstanceRef.current = map;
    });

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [nodes, links, impossibleTravel, selectedAlertId, onSelectNode, onSelectLink]);

  // Handle Location Search
  const handleLocationSearch = async (locQuery: string) => {
    if (!locQuery || !locQuery.trim()) return;
    setIsSearching(true);
    const q = locQuery.trim();

    try {
      const res = await fetch(`/geo/pattern-by-location?location=${encodeURIComponent(q)}`);
      if (!res.ok) throw new Error('Pattern fetch failed');
      const data: LocationPattern = await res.json();
      setSelectedPattern(data);

      if (mapInstanceRef.current) {
        // Fly directly to target location in India
        mapInstanceRef.current.flyTo([data.lat, data.lng], 9, {
          duration: 1.8,
          easeLinearity: 0.25,
        });

        // Add dynamic radar ring marker at the queried location
        if (hotspotLayerRef.current) {
          import('leaflet').then((L) => {
            hotspotLayerRef.current.clearLayers();

            const isCritical = data.threat_score >= 0.8;
            const color = isCritical ? '#ff003f' : '#00ff66';

            // Radar Circle
            const radarCircle = L.circle([data.lat, data.lng], {
              radius: 25000,
              color,
              weight: 2,
              fillColor: color,
              fillOpacity: 0.15,
            });

            // Prominent beacon pin
            const beaconIcon = L.divIcon({
              html: `
                <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
                  <div style="padding: 2px 6px; background: #000000; border: 1.5px solid ${color}; border-radius: 4px; font-family: monospace; font-size: 10px; font-weight: bold; color: ${color}; white-space: nowrap; box-shadow: 0 0 10px ${color};">
                    ⚠️ ${data.city} [${Math.round(data.threat_score * 100)}%]
                  </div>
                  <div style="width: 2px; height: 16px; background: ${color};"></div>
                  <div style="width: 8px; height: 8px; border-radius: 50%; background: ${color};"></div>
                </div>
              `,
              className: 'custom-search-beacon',
              iconSize: [120, 40],
              iconAnchor: [60, 40],
            });

            const beaconMarker = L.marker([data.lat, data.lng], { icon: beaconIcon });

            hotspotLayerRef.current.addLayer(radarCircle);
            hotspotLayerRef.current.addLayer(beaconMarker);
          });
        }
      }
    } catch (err) {
      console.error('Error fetching pattern for location:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const resetToAllIndia = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([22.8, 79.2], 5, { duration: 1.5 });
    }
    if (hotspotLayerRef.current) {
      hotspotLayerRef.current.clearLayers();
    }
    setSelectedPattern(null);
  };

  return (
    <div className="relative w-full h-full bg-black overflow-hidden select-none font-mono">
      {/* Map Container */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* 1. Indian City & State Search Portal & HUD Banner */}
      <div className="absolute top-4 left-4 z-[1000] w-full max-w-xl flex flex-col gap-2 pointer-events-auto">
        <div className="bg-black/95 border-2 border-green-500/80 p-3 rounded-lg shadow-[0_0_25px_rgba(0,0,0,0.9)] backdrop-blur-md">
          {/* Header */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-green-500/30">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-green-400 animate-ping" />
              <span className="text-xs font-black tracking-widest text-white uppercase">
                🇮🇳 INDIA UPI SURVEILLANCE & PATTERN RADAR
              </span>
            </div>
            <button
              onClick={resetToAllIndia}
              className="text-[10px] text-green-400 hover:text-white border border-green-500/40 px-2 py-0.5 rounded bg-black hover:bg-green-950 transition-colors"
            >
              Reset All-India View
            </button>
          </div>

          {/* Search Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleLocationSearch(searchQuery);
            }}
            className="flex items-center gap-2"
          >
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Enter Indian City or State (e.g. Jamtara, Mewat, Alwar, Mumbai, Rajasthan, Jharkhand...)"
                className="w-full bg-black border border-green-500/60 rounded px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-green-400 focus:ring-1 focus:ring-green-400"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1.5 text-xs text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              )}
            </div>
            <button
              type="submit"
              disabled={isSearching}
              className="px-3 py-1.5 bg-green-500 hover:bg-green-400 text-black font-black text-xs rounded transition-all shadow-[0_0_12px_rgba(0,255,102,0.6)] disabled:opacity-50"
            >
              {isSearching ? 'SCANNING...' : 'SCAN PATTERN'}
            </button>
          </form>

          {/* Quick Hotspot Filter Chips */}
          <div className="flex items-center gap-1.5 flex-wrap pt-2 mt-2 border-t border-slate-800">
            <span className="text-[10px] text-slate-400 font-bold uppercase shrink-0">Hotspots:</span>
            {TOP_INDIAN_HOTSPOTS.map((h) => (
              <button
                key={h.query}
                onClick={() => {
                  setSearchQuery(h.query);
                  handleLocationSearch(h.query);
                }}
                className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors ${
                  selectedPattern?.city.toLowerCase().includes(h.query.toLowerCase())
                    ? 'bg-red-950 border-red-500 text-red-300 shadow-[0_0_8px_rgba(255,0,63,0.5)]'
                    : 'bg-black border-slate-800 text-slate-300 hover:border-green-500/60 hover:text-green-300'
                }`}
              >
                {h.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Detected Criminal Pattern Activity Card */}
      {selectedPattern && (
        <div className="absolute top-44 left-4 z-[1000] w-full max-w-lg bg-black/95 border-2 border-red-500 p-4 rounded-lg shadow-[0_0_35px_rgba(255,0,63,0.4)] backdrop-blur-xl animate-in slide-in-from-left duration-300">
          {/* Card Header */}
          <div className="flex items-start justify-between border-b border-red-500/40 pb-2 mb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                <span className="text-base font-black text-white">
                  🇮🇳 {selectedPattern.city}, {selectedPattern.state}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-black bg-red-950 text-red-400 border border-red-500">
                  {selectedPattern.hotspot_badge || 'CRITICAL SYNDICATE HOTSPOT'}
                </span>
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                JURISDICTION: Domestic UPI Rail · Geo Coordinates: {selectedPattern.lat.toFixed(4)}°N, {selectedPattern.lng.toFixed(4)}°E
              </div>
            </div>

            <button
              onClick={() => setSelectedPattern(null)}
              className="text-slate-400 hover:text-white px-2 py-0.5 rounded border border-slate-800 hover:border-slate-600 text-xs"
            >
              ✕
            </button>
          </div>

          {/* Threat Metric Bar */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="p-2 rounded bg-black border border-red-500/40 text-center">
              <div className="text-[10px] text-slate-400 uppercase">THREAT SCORE</div>
              <div className="text-lg font-black text-red-400">
                {Math.round(selectedPattern.threat_score * 100)}%
              </div>
            </div>
            <div className="p-2 rounded bg-black border border-red-500/40 text-center">
              <div className="text-[10px] text-slate-400 uppercase">FLAGGED VOLUME</div>
              <div className="text-lg font-black text-green-400">
                ₹{((selectedPattern.detected_suspicious_volume_inr || selectedPattern.risk_volume) / 100000).toFixed(2)}L
              </div>
            </div>
            <div className="p-2 rounded bg-black border border-red-500/40 text-center">
              <div className="text-[10px] text-slate-400 uppercase">ACTIVE MULES</div>
              <div className="text-lg font-black text-white">
                {selectedPattern.active_mules_detected || 4} Nodes
              </div>
            </div>
          </div>

          {/* Crime Pattern Name & Modus Operandi */}
          <div className="space-y-2 mb-3">
            <div className="p-2.5 rounded bg-black border border-slate-800">
              <div className="text-[10px] text-red-400 font-bold uppercase tracking-wider mb-1">
                DETECTED SYNDICATE PATTERN
              </div>
              <div className="text-xs font-bold text-white">
                {selectedPattern.pattern_name}
              </div>
            </div>

            <div className="p-2.5 rounded bg-black border border-slate-800">
              <div className="text-[10px] text-green-400 font-bold uppercase tracking-wider mb-1">
                MODUS OPERANDI BREAKDOWN
              </div>
              <p className="text-[11px] leading-relaxed text-slate-300">
                {selectedPattern.modus_operandi}
              </p>
            </div>
          </div>

          {/* Key Algorithmic Motifs */}
          <div className="mb-3">
            <div className="text-[10px] text-slate-400 font-bold uppercase mb-1.5">
              KEY GRAPH MOTIFS & DETECTION RULES:
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {selectedPattern.key_motifs.map((motif, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-950 text-green-300 border border-green-500/50"
                >
                  ⚡ {motif}
                </span>
              ))}
            </div>
          </div>

          {/* Primary Exploited Banks & Flagged Mules */}
          <div className="p-2.5 rounded bg-black border border-slate-800 text-[10px] flex items-center justify-between">
            <div>
              <span className="text-slate-400 font-bold">EXPLOITED BANKS: </span>
              <span className="text-white font-bold">{selectedPattern.primary_banks.join(', ')}</span>
            </div>
            <div>
              <span className="text-slate-400 font-bold">STATUS: </span>
              <span className="text-red-400 font-black animate-pulse">CRIMINAL PATTERN CONFIRMED</span>
            </div>
          </div>
        </div>
      )}

      {/* 3. Selected Hop Banner */}
      {selectedHop && (
        <div className="absolute bottom-4 left-4 z-[1000] bg-black/95 border border-green-400 p-2.5 rounded font-mono text-xs text-white shadow-[0_0_15px_rgba(0,255,102,0.3)] flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span>SELECTED UPI CORRIDOR: <strong className="text-green-300">{selectedHop}</strong></span>
          <button
            onClick={() => setSelectedHop(null)}
            className="text-[10px] text-slate-400 hover:text-white underline ml-2"
          >
            Clear
          </button>
        </div>
      )}
    </div>
  );
}
