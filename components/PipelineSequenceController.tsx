'use client';

import React, { useEffect, useState } from 'react';

interface Props {
  onSequenceStageChange?: (stage: 'GLOBE_INIT' | 'PIPELINE_ENGAGED' | 'NETWORK_ANALYSIS') => void;
  onReplay?: () => void;
}

export default function PipelineSequenceController({ onSequenceStageChange, onReplay }: Props) {
  const [stage, setStage] = useState<'GLOBE_INIT' | 'PIPELINE_ENGAGED' | 'NETWORK_ANALYSIS'>('GLOBE_INIT');
  const [showIntroBanner, setShowIntroBanner] = useState<boolean>(true);
  const [tickerText, setTickerText] = useState<string>('PHASE 1/3: GLOBAL ORBIT SCAN · TARGETING INDIAN SUB-CONTINENT...');

  useEffect(() => {
    // Stage 0: GLOBE_INIT (0s - 2.5s)
    setStage('GLOBE_INIT');
    setShowIntroBanner(true);
    setTickerText('PHASE 1/3: GLOBAL ORBIT SCAN · TARGETING INDIAN SUB-CONTINENT...');
    if (onSequenceStageChange) onSequenceStageChange('GLOBE_INIT');

    // Stage 1: PIPELINE_ENGAGED (2.5s - 5.0s)
    const t1 = setTimeout(() => {
      setStage('PIPELINE_ENGAGED');
      setTickerText('PHASE 2/3: VECTOR ZOOM INTO INDIA · UPI LIQUIDITY PIPELINES ENGAGED...');
      if (onSequenceStageChange) onSequenceStageChange('PIPELINE_ENGAGED');
    }, 2500);

    // Stage 2: NETWORK_ANALYSIS (5.0s+)
    const t2 = setTimeout(() => {
      setStage('NETWORK_ANALYSIS');
      setTickerText('PHASE 3/3: DOMESTIC INDIA FRAUD TOPOLOGY ACTIVE · 180 ACCOUNTS · RUPEE (₹) TELEMETRY');
      if (onSequenceStageChange) onSequenceStageChange('NETWORK_ANALYSIS');
    }, 5000);

    // Hide intro overlay after 6.5s
    const t3 = setTimeout(() => {
      setShowIntroBanner(false);
    }, 6500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onSequenceStageChange]);

  const handleReplay = () => {
    setStage('GLOBE_INIT');
    setShowIntroBanner(true);
    setTickerText('PHASE 1/3: GLOBAL ORBIT SCAN · TARGETING INDIAN SUB-CONTINENT...');
    if (onSequenceStageChange) onSequenceStageChange('GLOBE_INIT');
    if (onReplay) onReplay();

    setTimeout(() => {
      setStage('PIPELINE_ENGAGED');
      setTickerText('PHASE 2/3: VECTOR ZOOM INTO INDIA · UPI LIQUIDITY PIPELINES ENGAGED...');
      if (onSequenceStageChange) onSequenceStageChange('PIPELINE_ENGAGED');
    }, 2500);

    setTimeout(() => {
      setStage('NETWORK_ANALYSIS');
      setTickerText('PHASE 3/3: DOMESTIC INDIA FRAUD TOPOLOGY ACTIVE · 180 ACCOUNTS · RUPEE (₹) TELEMETRY');
      if (onSequenceStageChange) onSequenceStageChange('NETWORK_ANALYSIS');
    }, 5000);

    setTimeout(() => {
      setShowIntroBanner(false);
    }, 6500);
  };

  return (
    <>
      {/* Opening Sequence Cinematic Overlay */}
      {showIntroBanner && (
        <div className="pointer-events-none absolute inset-x-0 top-16 z-50 flex justify-center px-4 animate-in fade-in duration-500">
          <div className="bg-black/95 border-2 border-green-500 px-6 py-3 rounded-lg shadow-[0_0_30px_rgba(0,255,102,0.5)] flex flex-col items-center gap-1 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-green-400 animate-ping" />
              <span className="font-mono text-xs font-black tracking-widest text-white uppercase">
                AEGIS INDIA UPI SURVEILLANCE
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-green-950 text-green-400 border border-green-500 font-bold">
                {stage}
              </span>
            </div>
            <div className="font-mono text-xs text-green-300 font-bold tracking-wider">
              {tickerText}
            </div>
          </div>
        </div>
      )}

      {/* Floating Replay Sequence Button */}
      <button
        onClick={handleReplay}
        className="fixed bottom-12 right-6 z-40 bg-black/90 hover:bg-green-950 border border-green-500/80 text-green-400 hover:text-white px-3 py-1.5 rounded font-mono text-xs shadow-[0_0_15px_rgba(0,255,102,0.3)] transition-all flex items-center gap-2"
        title="Replay opening globe zoom into India"
      >
        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
        <span>REPLAY INDIA ZOOM</span>
      </button>
    </>
  );
}
