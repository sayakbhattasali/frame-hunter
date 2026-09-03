import { RGBColor, ColorCluster } from '../types/index.js';
import { rgbToOklab } from './colorSpace.js';

interface ColorBox {
    pixels: RGBColor[];
}

function findWidestChannel(pixels: RGBColor[]): 'r' | 'g' | 'b' {
    let minR = 255, maxR = 0;
    let minG = 255, maxG = 0;
    let minB = 255, maxB = 0;

    for (const p of pixels) {
        if (p.r < minR) minR = p.r;
        if (p.r > maxR) maxR = p.r;
        if (p.g < minG) minG = p.g;
        if (p.g > maxG) maxG = p.g;
        if (p.b < minB) minB = p.b;
        if (p.b > maxB) maxB = p.b;
    }

    const rangeR = maxR - minR;
    const rangeG = maxG - minG;
    const rangeB = maxB - minB;

    if (rangeR >= rangeG && rangeR >= rangeB) return 'r';
    if (rangeG >= rangeR && rangeG >= rangeB) return 'g';
    return 'b';
}

function splitBox(box: ColorBox): [ColorBox, ColorBox] {
    const channel = findWidestChannel(box.pixels);
    box.pixels.sort((a, b) => a[channel] - b[channel]);
    const mid = Math.floor(box.pixels.length / 2);
    return [
        { pixels: box.pixels.slice(0, mid) },
        { pixels: box.pixels.slice(mid) }
    ];
}

export function extractDominantClusters(pixels: RGBColor[], targetClusters = 3): ColorCluster[] {
    if (pixels.length === 0) return [];

    let boxes: ColorBox[] = [{ pixels: [...pixels] }];

    // Split boxes until we reach at least targetClusters boxes
    while (boxes.length < targetClusters) {
        boxes.sort((a, b) => b.pixels.length - a.pixels.length);
        const boxToSplit = boxes.shift();
        if (!boxToSplit || boxToSplit.pixels.length === 0) break;
        const [b1, b2] = splitBox(boxToSplit);
        boxes.push(b1, b2);
    }

    const totalPixels = pixels.length;

    const clusters: ColorCluster[] = boxes.map((box) => {
        let sumR = 0, sumG = 0, sumB = 0;
        for (const p of box.pixels) {
            sumR += p.r;
            sumG += p.g;
            sumB += p.b;
        }
        const count = box.pixels.length || 1;
        const rgb: RGBColor = {
            r: Math.round(sumR / count),
            g: Math.round(sumG / count),
            b: Math.round(sumB / count)
        };
        return {
            rgb,
            oklab: rgbToOklab(rgb),
            weight: Number((box.pixels.length / totalPixels).toFixed(4))
        };
    });

    // Sort descending by weight for deterministic 9D vector ordering
    clusters.sort((a, b) => b.weight - a.weight);

    // Pad to targetClusters if downsampled image was monochrome
    while (clusters.length < targetClusters) {
        const fallback = clusters[0] || {
            rgb: { r: 0, g: 0, b: 0 },
            oklab: { L: 0, a: 0, b: 0 },
            weight: 0
        };
        clusters.push({ ...fallback });
    }

    return clusters.slice(0, targetClusters);
}