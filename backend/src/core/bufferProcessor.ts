import sharp from 'sharp';
import { RGBColor, FrameTelemetry } from '../types/index.js';
import { extractDominantClusters } from './colorQuantizer.js';
import { calculatePhotometrics } from './telemetry.js';

export async function processImageBuffer(inputBuffer: Buffer): Promise<FrameTelemetry> {
    const metadata = await sharp(inputBuffer).metadata();
    const width = metadata.width || 1;
    const height = metadata.height || 1;
    const aspectRatio = Number((width / height).toFixed(2));

    // Downsample to 64x64 for sub-millisecond median cut clustering
    const { data, info } = await sharp(inputBuffer)
        .resize(64, 64, { fit: 'cover' })
        .removeAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });

    const pixels: RGBColor[] = [];
    for (let i = 0; i < data.length; i += 3) {
        pixels.push({
            r: data[i],
            g: data[i + 1],
            b: data[i + 2]
        });
    }

    const { avgLuminance, shadowCrushRatio } = calculatePhotometrics(pixels);
    const dominantClusters = extractDominantClusters(pixels, 3);

    // Flatten into 9D vector: [L1, a1, b1, L2, a2, b2, L3, a3, b3]
    const paletteVector: number[] = [];
    for (const cluster of dominantClusters) {
        paletteVector.push(
            Number(cluster.oklab.L.toFixed(4)),
            Number(cluster.oklab.a.toFixed(4)),
            Number(cluster.oklab.b.toFixed(4))
        );
    }

    return {
        aspectRatio,
        avgLuminance,
        shadowCrushRatio,
        dominantClusters,
        paletteVector
    };
}