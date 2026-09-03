import { RGBColor } from '../types/index.js';

export function calculatePhotometrics(pixels: RGBColor[]) {
    if (pixels.length === 0) {
        return { avgLuminance: 0, shadowCrushRatio: 0 };
    }

    let totalLuminance = 0;
    let crushedPixels = 0;

    for (const p of pixels) {
        // Relative luminance formula (ITU-R BT.709)
        const lum = (0.2126 * p.r + 0.7152 * p.g + 0.0722 * p.b) / 255.0;
        totalLuminance += lum;
        if (lum < 0.15) {
            crushedPixels++;
        }
    }

    return {
        avgLuminance: Number((totalLuminance / pixels.length).toFixed(4)),
        shadowCrushRatio: Number((crushedPixels / pixels.length).toFixed(4))
    };
}