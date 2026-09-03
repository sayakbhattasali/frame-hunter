export interface RGBColor {
  r: number;
  g: number;
  b: number;
}

export interface OklabColor {
  L: number;
  a: number;
  b: number;
}

export interface ColorCluster {
  rgb: RGBColor;
  oklab: OklabColor;
  weight: number;
}

export interface FrameTelemetry {
  aspectRatio: number;
  avgLuminance: number;
  shadowCrushRatio: number;
  dominantClusters: ColorCluster[];
  paletteVector: number[];
}

export interface MediaFrame {
  id: string;
  file_name: string;
  storage_url: string;
  aspect_ratio: number;
  avg_luminance: number;
  shadow_crush_ratio: number;
  dominant_clusters?: ColorCluster[];
  is_sample?: boolean;
  raw_vector?: string;
  aesthetic_distance?: number;
}

export interface SearchFilters {
  targetPalette: number[];
  minShadowCrush: number;
  maxShadowCrush: number;
  minLuminance: number;
  maxLuminance: number;
  limit: number;
  isSample?: boolean;
}
