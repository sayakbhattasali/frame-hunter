import { RGBColor, OklabColor } from '../types/index.js';

// Convert non-linear sRGB channel (0-255) to linear RGB (0.0 - 1.0)
function srgbToLinear(c: number): number {
    const v = c / 255;
    return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

// Convert linear RGB to Oklab coordinates (L, a, b)
export function rgbToOklab(color: RGBColor): OklabColor {
    const rLin = srgbToLinear(color.r);
    const gLin = srgbToLinear(color.g);
    const bLin = srgbToLinear(color.b);

    // Approximate cone responses (LMS)
    const l = Math.cbrt(0.4122214708 * rLin + 0.5363325363 * gLin + 0.0514459929 * bLin);
    const m = Math.cbrt(0.2119034982 * rLin + 0.6806995451 * gLin + 0.1073969566 * bLin);
    const s = Math.cbrt(0.0883024619 * rLin + 0.2817188376 * gLin + 0.6299787005 * bLin);

    return {
        L: 0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
        a: 1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
        b: 0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s,
    };
}