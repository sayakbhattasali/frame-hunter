import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { pool } from '../config/db.js';
import pgvector from 'pgvector';

interface SearchBody {
  targetPalette: number[];
  minShadowCrush?: number;
  maxShadowCrush?: number;
  minLuminance?: number;
  maxLuminance?: number;
  limit?: number;
  isSample?: boolean; // undefined = all, true = curated only, false = user frames only
}

export const searchRoute: FastifyPluginAsync = async (server: FastifyInstance) => {
  server.post<{ Body: SearchBody }>('/api/frames/search', async (request, reply) => {
    const {
      targetPalette,
      minShadowCrush = 0.0,
      maxShadowCrush = 1.0,
      minLuminance = 0.0,
      maxLuminance = 1.0,
      limit = 18,
      isSample,
    } = request.body || {};

    if (!targetPalette || targetPalette.length !== 9) {
      return reply.code(400).send({
        error: 'targetPalette must be a 9-dimensional vector [L1, a1, b1, L2, a2, b2, L3, a3, b3]',
      });
    }

    try {
      const vectorSql = pgvector.toSql(targetPalette);

      let sampleClause = '';
      const values: any[] = [
        vectorSql,
        minShadowCrush,
        maxShadowCrush,
        minLuminance,
        maxLuminance,
        limit,
      ];

      if (typeof isSample === 'boolean') {
        values.push(isSample);
        sampleClause = `AND is_sample = $${values.length}`;
      }

      const query = `
        SELECT 
          id, 
          file_name, 
          storage_url, 
          aspect_ratio,
          avg_luminance, 
          shadow_crush_ratio,
          dominant_clusters,
          is_sample,
          color_palette::text AS raw_vector,
          (color_palette <-> $1) AS aesthetic_distance
        FROM media_frames
        WHERE shadow_crush_ratio BETWEEN $2 AND $3
          AND avg_luminance BETWEEN $4 AND $5
          ${sampleClause}
        ORDER BY aesthetic_distance ASC
        LIMIT $6;
      `;

      const res = await pool.query(query, values);

      return reply.send({
        total: res.rowCount,
        results: res.rows,
      });
    } catch (err: any) {
      server.log.error(err);
      return reply.code(500).send({ error: 'Search failed', details: err.message });
    }
  });
};