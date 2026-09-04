import { OklabColor } from '../types/index.js';
import { rgbToOklab } from './colorSpace.js';

export type OklabTuple = [number, number, number];

/**
 * Converts a hex string ('#ff007f' or 'ff007f') into an Oklab tuple [L, a, b].
 */
export function hexToOklab(hex: string): OklabTuple {
  let cleanHex = hex.replace('#', '');
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map((c) => c + c).join('');
  }
  const num = parseInt(cleanHex, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;

  const oklab = rgbToOklab({ r, g, b });
  return [
    Number(oklab.L.toFixed(4)),
    Number(oklab.a.toFixed(4)),
    Number(oklab.b.toFixed(4)),
  ];
}

/**
 * Chroma-Weighted Oklab Perceptual Distance
 * 
 * - wLum: Lower weight (0.35) so shadows, highlights, and exposure differences don't overpower hues.
 * - wChroma: Higher weight (1.6) to heavily penalize missing or opposing colors.
 */
export function oklabPerceptualDistance(
  c1: OklabTuple | OklabColor,
  c2: OklabTuple | OklabColor,
  wLum: number = 0.35,
  wChroma: number = 1.6
): number {
  const L1 = Array.isArray(c1) ? c1[0] : c1.L;
  const a1 = Array.isArray(c1) ? c1[1] : c1.a;
  const b1 = Array.isArray(c1) ? c1[2] : c1.b;

  const L2 = Array.isArray(c2) ? c2[0] : c2.L;
  const a2 = Array.isArray(c2) ? c2[1] : c2.a;
  const b2 = Array.isArray(c2) ? c2[2] : c2.b;

  const dL = L1 - L2;
  const da = a1 - a2;
  const db = b1 - b2;

  // Perceptually scaled Euclidean distance with amplified chroma sensitivity
  return Math.sqrt(
    (wLum * dL) ** 2 +
    (wChroma * da) ** 2 +
    (wChroma * db) ** 2
  ) * 100.0;
}

/**
 * Chamfer (Best-Match) Scoring for Query Accents against Frame Candidate Palette
 * 
 * For each query accent color, finds the closest matching cluster in the frame's palette.
 * Returns the average Delta E across the chosen accents.
 * 
 * This ensures that if a shot contains accent tones (e.g. cyan and neon pink) anywhere in its palette,
 * it scores near 0 for those colors, even if 70% of the image is dark shadow or ambient background.
 */
export function computeFrameColorScore(
  queryAccents: (OklabTuple | OklabColor)[],
  framePalette: (OklabTuple | OklabColor)[]
): number {
  if (!queryAccents || queryAccents.length === 0 || !framePalette || framePalette.length === 0) {
    return 100.0;
  }

  let totalDelta = 0.0;
  for (const queryCol of queryAccents) {
    let bestDelta = Infinity;
    for (const frameCol of framePalette) {
      const delta = oklabPerceptualDistance(queryCol, frameCol);
      if (delta < bestDelta) {
        bestDelta = delta;
      }
    }
    totalDelta += bestDelta;
  }

  return Number((totalDelta / queryAccents.length).toFixed(1));
}
