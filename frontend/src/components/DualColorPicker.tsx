'use client';

import React from 'react';
import { Palette } from 'lucide-react';

interface DualColorPickerProps {
  primaryColor: string;
  setPrimaryColor: (c: string) => void;
  secondaryColor: string;
  setSecondaryColor: (c: string) => void;
}

const PRESET_PAIRS = [
  { label: 'Cyberpunk', c1: '#ff007f', c2: '#00f0ff' },
  { label: 'Teal & Orange', c1: '#008b8b', c2: '#ff8c00' },
  { label: 'Golden Hour', c1: '#ffb703', c2: '#fb8500' },
  { label: 'Neo-Noir', c1: '#14213d', c2: '#e63946' },
  { label: 'Matrix Acid', c1: '#00ff66', c2: '#052b14' },
];

export const DualColorPicker: React.FC<DualColorPickerProps> = ({
  primaryColor,
  setPrimaryColor,
  secondaryColor,
  setSecondaryColor,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-neutral-400">
        <Palette className="w-3.5 h-3.5 text-cyan-400" />
        Dominant Color Harmonies
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Primary Color */}
        <div className="flex items-center gap-3 p-2.5 rounded-xl border border-neutral-800 bg-[#12141c]/60">
          <input
            type="color"
            value={primaryColor}
            onChange={(e) => setPrimaryColor(e.target.value)}
            className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-none"
          />
          <div>
            <div className="text-[10px] text-neutral-500 uppercase font-mono">Accent A</div>
            <div className="text-xs font-mono font-semibold text-neutral-200 uppercase">{primaryColor}</div>
          </div>
        </div>

        {/* Secondary Color */}
        <div className="flex items-center gap-3 p-2.5 rounded-xl border border-neutral-800 bg-[#12141c]/60">
          <input
            type="color"
            value={secondaryColor}
            onChange={(e) => setSecondaryColor(e.target.value)}
            className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-none"
          />
          <div>
            <div className="text-[10px] text-neutral-500 uppercase font-mono">Accent B</div>
            <div className="text-xs font-mono font-semibold text-neutral-200 uppercase">{secondaryColor}</div>
          </div>
        </div>
      </div>

      {/* Preset Pills */}
      <div className="flex flex-wrap gap-1.5 pt-1">
        {PRESET_PAIRS.map((p) => (
          <button
            key={p.label}
            type="button"
            onClick={() => {
              setPrimaryColor(p.c1);
              setSecondaryColor(p.c2);
            }}
            className="text-[11px] px-2.5 py-1 rounded-full border border-neutral-800 bg-neutral-900/60 hover:border-neutral-700 hover:bg-neutral-800/80 transition-all flex items-center gap-1.5"
          >
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.c1 }} />
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.c2 }} />
            <span className="text-neutral-300">{p.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
