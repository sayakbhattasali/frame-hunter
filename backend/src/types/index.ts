export interface RGBColor {
    r: number; // 0 - 255
    g: number; // 0 - 255
    b: number; // 0 - 255
}

export interface OklabColor {
    L: number; // Luminance: ~0.0 to 1.0
    a: number; // Green (-) to Red (+)
    b: number; // Blue (-) to Yellow (+)
}

export interface ColorCluster {
    rgb: RGBColor;
    oklab: OklabColor;
    weight: number; // Percentage of total image area (0.0 to 1.0)
}

export interface FrameTelemetry {
    aspectRatio: number;
    avgLuminance: number;
    shadowCrushRatio: number;
    dominantClusters: ColorCluster[];
    paletteVector: number[]; // 9D Vector: [L1, a1, b1, L2, a2, b2, L3, a3, b3]
}