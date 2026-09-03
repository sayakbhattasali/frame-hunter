import sharp from 'sharp';
import { processImageBuffer } from './core/bufferProcessor.js';

async function run() {
  console.log('⚡ Generating mock frame buffer...');
  // Create a 500x300 gradient image (cyan to dark orange)
  const mockBuffer = await sharp({
    create: {
      width: 500,
      height: 300,
      channels: 3,
      background: { r: 10, g: 150, b: 200 }
    }
  }).png().toBuffer();

  console.log('🧪 Processing buffer through FrameHunter engine...');
  const start = performance.now();
  const telemetry = await processImageBuffer(mockBuffer);
  const elapsed = (performance.now() - start).toFixed(2);

  console.log(`\n✅ Completed in ${elapsed}ms:`);
  console.log(`- Aspect Ratio: ${telemetry.aspectRatio}`);
  console.log(`- Average Luminance: ${telemetry.avgLuminance}`);
  console.log(`- Shadow Crush Ratio: ${telemetry.shadowCrushRatio}`);
  console.log(`- 9D Oklab Vector: [${telemetry.paletteVector.join(', ')}]`);
  console.log('- Dominant RGB Clusters:', telemetry.dominantClusters.map(c => c.rgb));
}

run().catch(console.error);
