import { OklabColor, RGBColor } from '@/types';

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

export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (c: number) => Math.min(255, Math.max(0, c)).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
