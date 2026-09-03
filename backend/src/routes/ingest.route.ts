import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { pool } from '../config/db.js';
import { processImageBuffer } from '../core/bufferProcessor.js';
import pgvector from 'pgvector';

export const ingestRoute: FastifyPluginAsync = async (server: FastifyInstance) => {
  server.post('/api/frames/ingest', async (request, reply) => {
    const data = await request.file();

    if (!data) {
      return reply.code(400).send({ error: 'No image file uploaded' });
    }

    try {
      const buffer = await data.toBuffer();
      const telemetry = await processImageBuffer(buffer);

      const mimeType = data.mimetype || 'image/jpeg';
      const storageUrl = `data:${mimeType};base64,${buffer.toString('base64')}`;
      const fileName = data.filename || 'frame.jpg';
      const collectionId = '00000000-0000-0000-0000-000000000001';

      const vectorSql = pgvector.toSql(telemetry.paletteVector);

      const isSample = data.fields?.is_sample ? (data.fields.is_sample as any).value === 'true' : false;

      const query = `
        INSERT INTO media_frames (
          collection_id,
          file_name,
          storage_url,
          aspect_ratio,
          avg_luminance,
          shadow_crush_ratio,
          color_palette,
          dominant_clusters,
          is_sample
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id, file_name, aspect_ratio, avg_luminance, shadow_crush_ratio, dominant_clusters, is_sample, created_at;
      `;

      const values = [
        collectionId,
        fileName,
        storageUrl,
        telemetry.aspectRatio,
        telemetry.avgLuminance,
        telemetry.shadowCrushRatio,
        vectorSql,
        JSON.stringify(telemetry.dominantClusters),
        isSample,
      ];

      const res = await pool.query(query, values);

      return reply.code(201).send({
        success: true,
        frame: res.rows[0],
        telemetry,
      });
    } catch (err: any) {
      server.log.error(err);
      return reply.code(500).send({ error: 'Failed to ingest frame', details: err.message });
    }
  });

  server.delete<{ Params: { id: string } }>('/api/frames/:id', async (request, reply) => {
    const { id } = request.params;
    try {
      const res = await pool.query('DELETE FROM media_frames WHERE id = $1 RETURNING id;', [id]);
      if (res.rowCount === 0) {
        return reply.code(404).send({ error: 'Frame not found' });
      }
      return reply.send({ success: true, deletedId: id });
    } catch (err: any) {
      server.log.error(err);
      return reply.code(500).send({ error: 'Failed to delete frame', details: err.message });
    }
  });
};