import { OklabColor, RGBColor, MediaFrame } from '@/types';

export function hexToRgb(hex: string): RGBColor {
  let cleanHex = hex.replace('#', '');
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map((c) => c + c).join('');
  }
  const num = parseInt(cleanHex, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

function srgbToLinear(c: number): number {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

function linearToSrgb(c: number): number {
  const abs = Math.max(0, Math.min(1, c));
  return abs <= 0.0031308 ? 12.92 * abs : 1.055 * Math.pow(abs, 1 / 2.4) - 0.055;
}

export function rgbToOklab(color: RGBColor): OklabColor {
  const rLin = srgbToLinear(color.r);
  const gLin = srgbToLinear(color.g);
  const bLin = srgbToLinear(color.b);

  const l = Math.cbrt(0.4122214708 * rLin + 0.5363325363 * gLin + 0.0514459929 * bLin);
  const m = Math.cbrt(0.2119034982 * rLin + 0.6806995451 * gLin + 0.1073969566 * bLin);
  const s = Math.cbrt(0.0883024619 * rLin + 0.2817188376 * gLin + 0.6299787005 * bLin);

  return {
    L: 0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
    a: 1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
    b: 0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s,
  };
}

export function oklabToRgb(oklab: OklabColor): RGBColor {
  const l_ = oklab.L + 0.3963377774 * oklab.a + 0.2158037573 * oklab.b;
  const m_ = oklab.L - 0.1055613458 * oklab.a - 0.0638541728 * oklab.b;
  const s_ = oklab.L - 0.0894841775 * oklab.a - 1.2914855480 * oklab.b;

  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;

  const rLin = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const gLin = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const bLin = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s;

  return {
    r: Math.round(linearToSrgb(rLin) * 255),
    g: Math.round(linearToSrgb(gLin) * 255),
    b: Math.round(linearToSrgb(bLin) * 255),
  };
}

export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (c: number) => Math.min(255, Math.max(0, c)).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function oklabToHex(oklab: OklabColor): string {
  const rgb = oklabToRgb(oklab);
  return rgbToHex(rgb.r, rgb.g, rgb.b);
}

// Generates a 9D vector query from up to 2 primary accent colors
export function buildQueryVector(primaryHex: string, secondaryHex: string): number[] {
  const c1 = rgbToOklab(hexToRgb(primaryHex));
  const c2 = rgbToOklab(hexToRgb(secondaryHex));

  // A neutral ambient third tone synthesized from the midpoint
  const midRgb: RGBColor = {
    r: Math.round((hexToRgb(primaryHex).r + hexToRgb(secondaryHex).r) / 4),
    g: Math.round((hexToRgb(primaryHex).g + hexToRgb(secondaryHex).g) / 4),
    b: Math.round((hexToRgb(primaryHex).b + hexToRgb(secondaryHex).b) / 4),
  };
  const c3 = rgbToOklab(midRgb);

  return [
    Number(c1.L.toFixed(4)),
    Number(c1.a.toFixed(4)),
    Number(c1.b.toFixed(4)),
    Number(c2.L.toFixed(4)),
    Number(c2.a.toFixed(4)),
    Number(c2.b.toFixed(4)),
    Number(c3.L.toFixed(4)),
    Number(c3.a.toFixed(4)),
    Number(c3.b.toFixed(4)),
  ];
}

/**
 * Extracts the two most expressive accent colors from a frame's telemetry.
 * 
 * Uses a Chroma-Sorted strategy:
 * - Prioritizes colors with high chromatic saturation (sqrt(a^2 + b^2))
 *   so neutral blacks, grays, and whites don't overwrite user accent inputs.
 * - Falls back to Key Accent + Highlight contrast if frame is monochromatic/noir.
 */
export function extractDualAccents(frame: MediaFrame): { accentA: string; accentB: string } {
  const swatches: { hex: string; chroma: number; weight: number; L: number }[] = [];

  if (frame.dominant_clusters && frame.dominant_clusters.length > 0) {
    for (const c of frame.dominant_clusters) {
      const hex = rgbToHex(c.rgb.r, c.rgb.g, c.rgb.b);
      const chroma = Math.sqrt(c.oklab.a * c.oklab.a + c.oklab.b * c.oklab.b);
      swatches.push({ hex, chroma, weight: c.weight, L: c.oklab.L });
    }
  } else if (frame.raw_vector) {
    try {
      const v: number[] = typeof frame.raw_vector === 'string'
        ? JSON.parse(frame.raw_vector)
        : frame.raw_vector;
      if (Array.isArray(v) && v.length >= 6) {
        for (let i = 0; i < v.length; i += 3) {
          const oklab: OklabColor = { L: v[i], a: v[i + 1], b: v[i + 2] };
          const hex = oklabToHex(oklab);
          const chroma = Math.sqrt(oklab.a * oklab.a + oklab.b * oklab.b);
          swatches.push({ hex, chroma, weight: 1 / (i / 3 + 1), L: oklab.L });
        }
      }
    } catch (e) {
      console.warn('Failed to parse frame raw_vector', e);
    }
  }

  if (swatches.length === 0) {
    return { accentA: '#008b8b', accentB: '#ff8c00' };
  }

  if (swatches.length === 1) {
    return { accentA: swatches[0].hex, accentB: swatches[0].hex };
  }

  // Strategy 1: Chroma-Sorted (Highest saturation / visual expressiveness)
  const chromaSorted = [...swatches].sort((a, b) => b.chroma - a.chroma);

  if (chromaSorted[0].chroma > 0.035) {
    const accentA = chromaSorted[0].hex;
    const distinctSecondary = chromaSorted.slice(1).find(
      (s) => s.hex.toLowerCase() !== accentA.toLowerCase()
    );
    const accentB = distinctSecondary ? distinctSecondary.hex : (chromaSorted[1]?.hex || accentA);
    return { accentA, accentB };
  }

  // Strategy 2: Key Accent + Highlight (for moody noir or monochromatic images)
  const accentA = swatches[1]?.hex || swatches[0].hex;
  const accentB = swatches[2]?.hex || swatches[swatches.length - 1].hex;
  return { accentA, accentB };
}
