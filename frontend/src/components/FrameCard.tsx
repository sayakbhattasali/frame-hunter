'use client';

import React, { useState, useEffect } from 'react';
import { MediaFrame } from '@/types';
import { rgbToHex } from '@/lib/colorUtils';
import { ScanSearch, Maximize2, Trash2, Check, X, SunMedium, Moon } from 'lucide-react';

interface FrameCardProps {
  frame: MediaFrame;
  onMatchShot: (vector: number[], frame: MediaFrame) => void;
  onSelectColor: (hex: string) => void;
  onDelete?: (id: string) => void;
}

export const FrameCard: React.FC<FrameCardProps> = ({
  frame,
  onMatchShot,
  onSelectColor,
  onDelete,
}) => {
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const clusters = frame.dominant_clusters || [];

  const handleMatchClick = () => {
    let vector: number[] = [];
    if (frame.raw_vector) {
      vector = typeof frame.raw_vector === 'string' 
        ? JSON.parse(frame.raw_vector) 
        : frame.raw_vector;
    }
    onMatchShot(vector, frame);
  };

  // Close lightbox on Escape key
  useEffect(() => {
    if (!isLightboxOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsLightboxOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLightboxOpen]);

  return (
    <>
      <div className="group relative rounded-2xl overflow-hidden border border-neutral-800/80 bg-[#12141c] hover:border-cyan-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-cyan-950/20 flex flex-col justify-between">
        <div>
          <div className="relative aspect-[16/9] w-full overflow-hidden bg-black flex items-center justify-center">
            <img
              src={frame.storage_url}
              alt={frame.file_name}
              className="max-w-full max-h-full w-auto h-auto object-contain transition-transform duration-500 group-hover:scale-102"
            />

            {/* Aesthetic Distance Tag */}
            {frame.aesthetic_distance !== undefined && (
              <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-black/75 backdrop-blur-md border border-neutral-700 text-cyan-300">
                ΔE {(Number(frame.aesthetic_distance) * 100).toFixed(1)}
              </div>
            )}

            {/* Custom In-App Delete Confirmation */}
            <div className="absolute top-2 left-2 z-20">
              {!showConfirm ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowConfirm(true);
                  }}
                  className="p-1.5 rounded-lg bg-black/70 hover:bg-rose-600/90 text-neutral-400 hover:text-white border border-neutral-700/80 transition-all opacity-0 group-hover:opacity-100"
                  title="Delete Frame"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              ) : (
                <div 
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-1 bg-[#161922] border border-rose-500/60 rounded-xl p-1 shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-150"
                >
                  <span className="text-[10px] font-mono text-rose-300 pl-1.5 pr-1 font-medium">Delete?</span>
                  <button
                    type="button"
                    onClick={() => onDelete?.(frame.id)}
                    className="p-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white transition-colors cursor-pointer"
                    title="Confirm Delete"
                  >
                    <Check className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowConfirm(false)}
                    className="p-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors cursor-pointer"
                    title="Cancel"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>

            {/* Quick Actions Hover Overlay */}
            {!showConfirm && (
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-xs p-2">
                <button
                  type="button"
                  onClick={handleMatchClick}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-xs tracking-wide shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-all cursor-pointer"
                >
                  <ScanSearch className="w-3.5 h-3.5" />
                  Match This Shot
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsLightboxOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900/90 hover:bg-neutral-800 text-neutral-200 hover:text-white border border-neutral-700/80 font-medium text-xs tracking-wide shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-all cursor-pointer backdrop-blur-sm"
                  title="View High-Res Frame"
                >
                  <Maximize2 className="w-3.5 h-3.5 text-cyan-400" />
                  View Full
                </button>
              </div>
            )}
          </div>

          {/* 3-Swatch Interactive Harmony Strip */}
          {clusters.length > 0 && (
            <div className="flex h-3 w-full">
              {clusters.map((c, i) => {
                const hex = rgbToHex(c.rgb.r, c.rgb.g, c.rgb.b);
                return (
                  <button
                    key={i}
                    type="button"
                    title={`Select tone: ${hex} (${Math.round(c.weight * 100)}%)`}
                    style={{ backgroundColor: hex, width: `${(c.weight || 0.33) * 100}%` }}
                    onClick={() => onSelectColor(hex)}
                    className="h-full hover:brightness-125 transition-all cursor-pointer relative group/swatch"
                  />
                );
              })}
            </div>
          )}

          {/* Telemetry Metrics */}
          <div className="p-3 space-y-2">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="truncate max-w-[140px] text-neutral-300 font-medium">{frame.file_name}</span>
              <span className="text-[10px] text-neutral-500">{frame.aspect_ratio}:1</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[10px] font-mono bg-neutral-900/80 p-1.5 rounded-lg border border-neutral-800">
              <div>
                <span className="text-neutral-500 block">Avg Lum</span>
                <span className="text-neutral-200">{(frame.avg_luminance * 100).toFixed(0)}%</span>
              </div>
              <div>
                <span className="text-neutral-500 block">Crushed</span>
                <span className="text-indigo-300">{(frame.shadow_crush_ratio * 100).toFixed(0)}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox / Modal View */}
      {isLightboxOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-black/90 backdrop-blur-md p-4 md:p-6 animate-in fade-in duration-200"
          onClick={() => setIsLightboxOpen(false)}
        >
          {/* Top Navigation Strip */}
          <div 
            className="w-full max-w-6xl flex items-center justify-between pb-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2.5 text-xs font-mono text-neutral-300 truncate">
              <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400" />
              <span className="truncate font-semibold text-sm text-neutral-100">{frame.file_name}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-neutral-800/80 border border-neutral-700 text-neutral-400">
                Aspect {frame.aspect_ratio}:1
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsLightboxOpen(false)}
              className="p-2 rounded-xl bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 hover:text-white transition-all cursor-pointer"
              title="Close (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Natural Uncropped Frame Display */}
          <div
            className="relative flex-1 flex items-center justify-center max-w-6xl w-full my-auto overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={frame.storage_url}
              alt={frame.file_name}
              className="max-h-[74vh] max-w-full w-auto h-auto object-contain rounded-xl shadow-2xl border border-neutral-800"
            />
            {frame.aesthetic_distance !== undefined && (
              <div className="absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-mono font-semibold bg-black/80 backdrop-blur-md border border-neutral-700 text-cyan-300 shadow-lg">
                ΔE {(Number(frame.aesthetic_distance) * 100).toFixed(1)}
              </div>
            )}
          </div>

          {/* Bottom Telemetry & Color Harmony HUD */}
          <div
            className="w-full max-w-6xl mt-3 p-3.5 rounded-2xl bg-[#12141c]/95 border border-neutral-800/90 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Photometric Stats */}
            <div className="flex items-center gap-3 text-xs font-mono">
              <div className="flex items-center gap-2 bg-neutral-900/80 px-3 py-1.5 rounded-xl border border-neutral-800">
                <SunMedium className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-neutral-500">Luminance:</span>
                <span className="text-neutral-200 font-semibold">{(frame.avg_luminance * 100).toFixed(1)}%</span>
              </div>

              <div className="flex items-center gap-2 bg-neutral-900/80 px-3 py-1.5 rounded-xl border border-neutral-800">
                <Moon className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-neutral-500">Shadow Crush:</span>
                <span className="text-indigo-300 font-semibold">{(frame.shadow_crush_ratio * 100).toFixed(1)}%</span>
              </div>
            </div>

            {/* Dominant Color Swatches & Action Button */}
            <div className="flex items-center gap-3">
              {clusters.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-neutral-500 uppercase hidden md:inline">Harmonies:</span>
                  <div className="flex items-center gap-1.5">
                    {clusters.map((c, i) => {
                      const hex = rgbToHex(c.rgb.r, c.rgb.g, c.rgb.b);
                      return (
                        <button
                          key={i}
                          type="button"
                          onClick={() => {
                            onSelectColor(hex);
                            setIsLightboxOpen(false);
                          }}
                          className="group/swatch relative flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-neutral-800 bg-neutral-900/80 hover:border-cyan-500/60 transition-all cursor-pointer"
                          title={`Set Deck Tone: ${hex} (${Math.round(c.weight * 100)}%)`}
                        >
                          <span className="w-3 h-3 rounded-full shrink-0 shadow-xs" style={{ backgroundColor: hex }} />
                          <span className="text-[11px] font-mono text-neutral-300 uppercase">{hex}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={() => {
                  handleMatchClick();
                  setIsLightboxOpen(false);
                }}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-xs font-mono tracking-wide transition-all cursor-pointer shrink-0 shadow-md shadow-cyan-500/20"
              >
                <ScanSearch className="w-3.5 h-3.5" />
                Match Shot
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
