'use client';

import React from 'react';
import { SunMedium, Moon } from 'lucide-react';

interface MoodSlidersProps {
  maxLuminance: number;
  setMaxLuminance: (val: number) => void;
  minShadowCrush: number;
  setMinShadowCrush: (val: number) => void;
}

export const MoodSliders: React.FC<MoodSlidersProps> = ({
  maxLuminance,
  setMaxLuminance,
  minShadowCrush,
  setMinShadowCrush,
}) => {
  return (
    <div className="space-y-4 pt-2 border-t border-neutral-800/80">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-neutral-400">
        <SunMedium className="w-3.5 h-3.5 text-amber-400" />
        Photometric Telemetry Filters
      </div>

      {/* Exposure / Luminance Cap */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs font-mono">
          <span className="text-neutral-400">Max Brightness</span>
          <span className="text-cyan-400">{Math.round(maxLuminance * 100)}%</span>
        </div>
        <input
          type="range"
          min="0.05"
          max="1.0"
          step="0.05"
          value={maxLuminance}
          onChange={(e) => setMaxLuminance(parseFloat(e.target.value))}
          className="w-full accent-cyan-400 h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
        />
        <div className="flex justify-between text-[10px] text-neutral-500 font-mono">
          <span>Midnight Noir</span>
          <span>High Noon</span>
        </div>
      </div>

      {/* Shadow Crush Ratio */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs font-mono">
          <span className="text-neutral-400 flex items-center gap-1">
            <Moon className="w-3 h-3 text-indigo-400" />
            Min Shadow Crush
          </span>
          <span className="text-indigo-400">{Math.round(minShadowCrush * 100)}%</span>
        </div>
        <input
          type="range"
          min="0.0"
          max="0.8"
          step="0.05"
          value={minShadowCrush}
          onChange={(e) => setMinShadowCrush(parseFloat(e.target.value))}
          className="w-full accent-indigo-400 h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
        />
        <div className="flex justify-between text-[10px] text-neutral-500 font-mono">
          <span>Flat Tone Curve</span>
          <span>Crushed Shadows</span>
        </div>
      </div>
    </div>
  );
};
