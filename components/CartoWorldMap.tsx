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

interface CartoWorldMapProps {
  nodes: GlobeNode[];
  links: GlobeLink[];
  impossibleTravel?: ImpossibleTravel[];
  onSelectNode?: (node: GlobeNode) => void;
  onSelectLink?: (link: GlobeLink) => void;
  selectedAlertId?: string | null;
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
  Australia: '🇦🇺',
  Japan: '🇯🇵',
  Philippines: '🇵🇭',
};

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
  const [selectedHop, setSelectedHop] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !mapContainerRef.current) return;

    let isMounted = true;

    // Dynamically import Leaflet
    import('leaflet').then((L) => {
      if (!isMounted || !mapContainerRef.current) return;

      // Clean up previous instance if any
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      // Initialize map with dark background
      const map = L.map(mapContainerRef.current, {
        center: [22.5, 55.0], // Centered between India, UAE and Europe
        zoom: 3,
        minZoom: 2,
        maxZoom: 12,
        zoomControl: false,
        attributionControl: false,
      });

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // CARTO Dark Matter Tiles
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png', {
        subdomains: 'abcd',
        maxZoom: 19,
      }).addTo(map);

      // 1. Render Links / Pipelines as animated SVG polylines
      const linesGroup = L.layerGroup().addTo(map);

      links.slice(0, 150).forEach((link) => {
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

        const amountFormatted = link.currency === 'USD'
          ? `$${(link.amount_usd || link.amount).toLocaleString('en-US')}`
          : `₹${link.amount.toLocaleString('en-IN')}`;

        line.bindTooltip(
          `
            <div style="font-family: monospace; font-size: 11px;">
              <span style="color: ${color}; font-weight: bold;">${link.from_city} ➔ ${link.to_city}</span><br/>
              <span style="color: #ffffff;">Amount: ${amountFormatted} (${link.currency})</span><br/>
              <span style="color: #94a3b8;">TxID: ${link.tx_id}</span>
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

      // 2. Render Impossible Travel vectors in glowing crimson red
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
            <div style="font-family: monospace; font-size: 11px; color: #ff003f;">
              <strong>⚠️ CRITICAL: IMPOSSIBLE TRAVEL ANOMALY</strong><br/>
              <span>${imp.from_city} (${imp.from_country}) ➔ ${imp.to_city} (${imp.to_country})</span><br/>
              <span>Velocity: <strong>${imp.velocity_kmh.toLocaleString()} km/h</strong></span><br/>
              <span>Distance: ${imp.distance_km.toLocaleString()} km</span><br/>
              <span style="color: #cbd5e1;">${imp.explanation}</span>
            </div>
          `,
          { sticky: true }
        );

        linesGroup.addLayer(impLine);
      });

      // 3. Render Nodes (Accounts / Banks / Mules)
      const nodesGroup = L.layerGroup().addTo(map);

      nodes.forEach((node) => {
        const flag = COUNTRY_FLAGS[node.country] || '🌐';
        const isRed = node.is_flagged;
        const isWhite = node.country !== 'India' && !node.is_flagged;
        const colorClass = isRed ? 'border-red-500 bg-red-950 text-red-300' : isWhite ? 'border-white bg-slate-900 text-white' : 'border-green-400 bg-green-950 text-green-300';
        const ringAnim = isRed ? 'animate-ping' : '';

        const iconHtml = `
          <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 26px; height: 26px;">
            <div style="position: absolute; width: 100%; height: 100%; border-radius: 50%; border: 1.5px solid ${isRed ? '#ff003f' : isWhite ? '#ffffff' : '#00ff66'}; opacity: 0.7;"></div>
            ${isRed ? `<div style="position: absolute; width: 34px; height: 34px; border-radius: 50%; border: 1px dashed #ff003f; opacity: 0.6;" class="${ringAnim}"></div>` : ''}
            <div style="font-size: 12px; z-index: 2;">${flag}</div>
          </div>
        `;

        const customIcon = L.divIcon({
          html: iconHtml,
          className: 'custom-geo-node',
          iconSize: [26, 26],
          iconAnchor: [13, 13],
        });

        const marker = L.marker([node.lat, node.lng], { icon: customIcon });

        marker.bindPopup(`
          <div style="font-family: monospace; font-size: 11px; min-width: 190px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px; border-bottom: 1px solid rgba(0,255,102,0.3); padding-bottom: 4px;">
              <span style="font-size: 14px;">${flag} ${node.city}</span>
              <span style="font-size: 10px; font-weight: bold; color: ${isRed ? '#ff003f' : '#00ff66'}; border: 1px solid ${isRed ? '#ff003f' : '#00ff66'}; padding: 1px 4px; border-radius: 3px;">${node.bank}</span>
            </div>
            <div><strong>ID:</strong> ${node.id}</div>
            <div><strong>VPA:</strong> ${node.label}</div>
            <div><strong>Type:</strong> ${node.type}</div>
            <div><strong>Status:</strong> <span style="color: ${isRed ? '#ff003f' : '#00ff66'};">${isRed ? 'FLAGGED MULE' : 'VERIFIED'}</span></div>
          </div>
        `);

        marker.on('click', () => {
          if (onSelectNode) onSelectNode(node);
        });

        nodesGroup.addLayer(marker);
      });

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

  const flyTo = (lat: number, lng: number, zoom: number) => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([lat, lng], zoom, { duration: 1.5 });
    }
  };

  return (
    <div className="relative w-full h-full bg-black overflow-hidden select-none">
      {/* Map Container */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Cyberpunk Top Controls HUD */}
      <div className="absolute top-4 left-4 z-[1000] flex flex-wrap items-center gap-2 bg-black/90 p-2 border border-green-500/40 rounded shadow-[0_0_15px_rgba(0,0,0,0.8)] backdrop-blur-md">
        <span className="font-mono text-xs font-bold text-white px-2 py-0.5 border-r border-green-500/30">
          🗺️ CARTO BASEMAP HUD
        </span>
        <button
          onClick={() => flyTo(20.0, 15.0, 2.5)}
          className="px-2 py-1 bg-black border border-green-500/50 text-green-300 hover:bg-green-500/20 rounded font-mono text-[10px] transition-colors"
        >
          World
        </button>
        <button
          onClick={() => flyTo(22.5, 79.5, 5)}
          className="px-2 py-1 bg-black border border-green-500/50 text-green-300 hover:bg-green-500/20 rounded font-mono text-[10px] transition-colors"
        >
          🇮🇳 India (UPI)
        </button>
        <button
          onClick={() => flyTo(25.2048, 55.2708, 8)}
          className="px-2 py-1 bg-black border border-green-500/50 text-green-300 hover:bg-green-500/20 rounded font-mono text-[10px] transition-colors"
        >
          🇦🇪 Dubai (AMEX)
        </button>
        <button
          onClick={() => flyTo(40.7128, -74.006, 6)}
          className="px-2 py-1 bg-black border border-green-500/50 text-green-300 hover:bg-green-500/20 rounded font-mono text-[10px] transition-colors"
        >
          🇺🇸 New York (Chase)
        </button>
        <button
          onClick={() => flyTo(47.3769, 8.5417, 7)}
          className="px-2 py-1 bg-black border border-green-500/50 text-green-300 hover:bg-green-500/20 rounded font-mono text-[10px] transition-colors"
        >
          🇨🇭 Zurich
        </button>
        <button
          onClick={() => flyTo(24.2, 86.6, 8)}
          className="px-2 py-1 bg-black border border-red-500/60 text-red-300 hover:bg-red-500/20 rounded font-mono text-[10px] transition-colors"
        >
          ⚠️ Jamtara Ring
        </button>
      </div>

      {/* Selected Hop Banner */}
      {selectedHop && (
        <div className="absolute bottom-4 left-4 z-[1000] bg-black/95 border border-green-400 p-2.5 rounded font-mono text-xs text-white shadow-[0_0_15px_rgba(0,255,102,0.3)] flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span>SELECTED PIPELINE: <strong className="text-green-300">{selectedHop}</strong></span>
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
