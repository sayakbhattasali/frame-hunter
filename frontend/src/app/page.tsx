'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { DualColorPicker } from '@/components/DualColorPicker';
import { MoodSliders } from '@/components/MoodSliders';
import { InspoDropzone } from '@/components/InspoDropzone';
import { FrameCard } from '@/components/FrameCard';
import { buildQueryVector, extractDualAccents } from '@/lib/colorUtils';
import { searchFrames, deleteFrame } from '@/lib/api';
import { MediaFrame } from '@/types';
import { 
  SlidersHorizontal, 
  RefreshCw, 
  Layers, 
  PlusCircle, 
  Film, 
  FolderSearch 
} from 'lucide-react';

export default function Home() {
  const [primaryColor, setPrimaryColor] = useState('#008b8b');
  const [secondaryColor, setSecondaryColor] = useState('#ff8c00');
  const [maxLuminance, setMaxLuminance] = useState(0.95);
  const [minShadowCrush, setMinShadowCrush] = useState(0.0);
  
  const [frames, setFrames] = useState<MediaFrame[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeVector, setActiveVector] = useState<number[] | null>(null);

  // 'curated' = reference library (is_sample = true); 'workspace' = custom library (is_sample = false)
  const [activeWorkspace, setActiveWorkspace] = useState<'curated' | 'workspace'>('curated');

  const executeSearch = useCallback(async (customVector?: number[]) => {
    setLoading(true);
    try {
      const targetPalette = customVector || activeVector || buildQueryVector(primaryColor, secondaryColor);
      const results = await searchFrames({
        targetPalette,
        accentColors: [primaryColor, secondaryColor],
        minShadowCrush,
        maxShadowCrush: 1.0,
        minLuminance: 0.0,
        maxLuminance,
        limit: 24,
        isSample: activeWorkspace === 'curated',
      });
      setFrames(results);
    } catch (err) {
      console.error('Vector query execution error:', err);
    } finally {
      setLoading(false);
    }
  }, [primaryColor, secondaryColor, maxLuminance, minShadowCrush, activeVector, activeWorkspace]);

  useEffect(() => {
    const timer = setTimeout(() => {
      executeSearch();
    }, 200);
    return () => clearTimeout(timer);
  }, [executeSearch]);

  const handleMatchShot = (vector: number[], matchedFrame?: MediaFrame) => {
    if (matchedFrame) {
      const { accentA, accentB } = extractDualAccents(matchedFrame);
      setPrimaryColor(accentA);
      setSecondaryColor(accentB);
    }
    setActiveVector(vector);
    executeSearch(vector);
  };

  const handleSelectColor = (hex: string) => {
    setActiveVector(null);
    setPrimaryColor(hex);
  };

  const handleDeleteFrame = async (id: string) => {
    try {
      await deleteFrame(id);
      setFrames((prev) => prev.filter((f) => f.id !== id));
    } catch (err) {
      console.error('Frame deletion failed:', err);
    }
  };

  return (
    <main className="min-h-screen flex flex-col md:flex-row bg-[#090a0f]">
      {/* Control Deck Sidebar */}
      <aside className="w-full md:w-80 lg:w-96 border-b md:border-b-0 md:border-r border-neutral-800/80 bg-[#0d0f17]/95 p-6 flex flex-col gap-6 shrink-0 z-10 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400/50" />
            <h1 className="text-base font-bold tracking-wider uppercase text-neutral-100 font-mono">FrameHunter</h1>
          </div>
          <p className="text-xs text-neutral-500 mt-1">Aesthetic Color & Luminance Telemetry Engine</p>
        </div>

        <InspoDropzone onIngestSuccess={() => executeSearch()} />

        <div className="space-y-2">
          <DualColorPicker
            primaryColor={primaryColor}
            setPrimaryColor={(c) => { setActiveVector(null); setPrimaryColor(c); }}
            secondaryColor={secondaryColor}
            setSecondaryColor={(c) => { setActiveVector(null); setSecondaryColor(c); }}
          />

          {activeVector && (
            <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-xs font-mono text-cyan-300 animate-in fade-in duration-200">
              <span className="flex items-center gap-1.5 text-[11px]">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                Synced with Shot DNA
              </span>
              <button
                type="button"
                onClick={() => {
                  setActiveVector(null);
                  executeSearch();
                }}
                className="text-[10px] text-neutral-400 hover:text-white underline cursor-pointer"
              >
                Reset
              </button>
            </div>
          )}
        </div>

        <MoodSliders
          maxLuminance={maxLuminance}
          setMaxLuminance={setMaxLuminance}
          minShadowCrush={minShadowCrush}
          setMinShadowCrush={setMinShadowCrush}
        />

        <div className="mt-auto pt-4 border-t border-neutral-800 flex justify-between items-center text-[10px] font-mono text-neutral-500">
          <span>Engine: PostgreSQL + pgvector</span>
          <span>Metric: Oklab L2 HNSW</span>
        </div>
      </aside>

      {/* Main Results Canvas */}
      <section className="flex-1 p-6 md:p-8 overflow-y-auto">
        <header className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-6 border-b border-neutral-800/60 mb-6">
          <div className="flex items-center gap-2 text-xs font-mono text-neutral-400">
            <SlidersHorizontal className="w-4 h-4 text-cyan-400" />
            <span>Vector Match Library ({frames.length} results)</span>
          </div>

          <div className="flex items-center gap-3">
            {/* Mode Selector */}
            <div className="flex items-center bg-[#12141c] border border-neutral-800 rounded-xl p-0.5">
              <button
                type="button"
                onClick={() => setActiveWorkspace('curated')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                  activeWorkspace === 'curated'
                    ? 'bg-neutral-800 text-cyan-300 font-semibold shadow-xs'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <Film className="w-3.5 h-3.5" />
                Reference Archive
              </button>

              <button
                type="button"
                onClick={() => setActiveWorkspace('workspace')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                  activeWorkspace === 'workspace'
                    ? 'bg-neutral-800 text-cyan-300 font-semibold shadow-xs'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <PlusCircle className="w-3.5 h-3.5" />
                Custom Curation
              </button>
            </div>

            <button
              type="button"
              onClick={() => { setActiveVector(null); executeSearch(); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-800 bg-neutral-900/60 hover:border-neutral-700 text-xs font-mono text-neutral-300 hover:text-white transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
              Re-Query
            </button>
          </div>
        </header>

        {frames.length === 0 && !loading ? (
          <div className="flex flex-col items-center justify-center h-80 rounded-2xl border border-dashed border-neutral-800/80 p-8 text-center">
            {activeWorkspace === 'workspace' ? (
              <>
                <Layers className="w-8 h-8 text-neutral-600 mb-2" />
                <h3 className="text-sm font-semibold text-neutral-300 font-mono">Custom Workspace Empty</h3>
                <p className="text-xs text-neutral-500 mt-1 max-w-sm">
                  Drop images into the left dropzone to build and query your own aesthetic dataset.
                </p>
              </>
            ) : (
              <>
                <FolderSearch className="w-8 h-8 text-neutral-600 mb-2" />
                <h3 className="text-sm font-semibold text-neutral-300 font-mono">No Reference Matches</h3>
                <p className="text-xs text-neutral-500 mt-1 max-w-sm">
                  No frames match the current photometric sliders. Widen the luminance or shadow crush limits.
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {frames.map((frame) => (
              <FrameCard
                key={frame.id}
                frame={frame}
                onMatchShot={handleMatchShot}
                onSelectColor={handleSelectColor}
                onDelete={handleDeleteFrame}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
