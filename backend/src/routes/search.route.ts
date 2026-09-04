import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { pool } from '../config/db.js';
import pgvector from 'pgvector';
import { hexToOklab, computeFrameColorScore, OklabTuple } from '../core/colorDistance.js';

interface SearchBody {
  targetPalette: number[]; // 9D Oklab Vector [L1, a1, b1, L2, a2, b2, L3, a3, b3]
  accentColors?: string[]; // Optional user hex accents e.g. ['#ff007f', '#00f0ff']
  minShadowCrush?: number;
  maxShadowCrush?: number;
  minLuminance?: number;
  maxLuminance?: number;
  limit?: number;
  isSample?: boolean; // undefined = all, true = curated only, false = user frames only
}

export const searchRoute: FastifyPluginAsync = async (server: FastifyInstance) => {
  const handler = async (request: any, reply: any) => {
    const {
      targetPalette,
      accentColors,
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

      // Coarse pre-filter candidate pool size (fetch 3x requested limit, minimum 60)
      const candidateLimit = Math.max(limit * 3, 60);

      let sampleClause = '';
      const values: any[] = [
        vectorSql,
        minShadowCrush,
        maxShadowCrush,
        minLuminance,
        maxLuminance,
        candidateLimit,
      ];

      if (typeof isSample === 'boolean') {
        values.push(isSample);
        sampleClause = `AND is_sample = $${values.length}`;
      }

      // 1. PostgreSQL coarse pre-filter: filters by photometric bounds & L2 vector proximity
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
          (color_palette <-> $1) AS coarse_distance
        FROM media_frames
        WHERE shadow_crush_ratio BETWEEN $2 AND $3
          AND avg_luminance BETWEEN $4 AND $5
          ${sampleClause}
        ORDER BY coarse_distance ASC
        LIMIT $6;
      `;

      const res = await pool.query(query, values);
      const candidates = res.rows;

      if (candidates.length === 0) {
        return reply.send({
          total: 0,
          results: [],
        });
      }

      // 2. Resolve query accent coordinates
      let queryAccents: OklabTuple[] = [];
      if (Array.isArray(accentColors) && accentColors.length > 0) {
        queryAccents = accentColors.map((hex: string) => hexToOklab(hex));
      } else {
        // Unpack primary and secondary accent centroids from 9D vector
        queryAccents = [
          [targetPalette[0], targetPalette[1], targetPalette[2]],
          [targetPalette[3], targetPalette[4], targetPalette[5]],
        ];
      }

      // 3. Re-rank candidate frames using Chroma-Weighted Oklab Chamfer Best-Match score
      const scoredResults = candidates.map((frame: any) => {
        let framePalette: OklabTuple[] = [];

        if (Array.isArray(frame.dominant_clusters) && frame.dominant_clusters.length > 0) {
          framePalette = frame.dominant_clusters.map((c: any) => [
            Number(c.oklab.L),
            Number(c.oklab.a),
            Number(c.oklab.b),
          ]);
        } else if (frame.raw_vector) {
          try {
            const v = typeof frame.raw_vector === 'string'
              ? JSON.parse(frame.raw_vector)
              : frame.raw_vector;
            if (Array.isArray(v) && v.length >= 6) {
              framePalette = [
                [v[0], v[1], v[2]],
                [v[3], v[4], v[5]],
                ...(v.length >= 9 ? [[v[6], v[7], v[8]] as OklabTuple] : []),
              ];
            }
          } catch (e) {
            // fallback if parse fails
          }
        }

        // Compute Chamfer best-match Delta E
        const deltaE = computeFrameColorScore(queryAccents, framePalette);
        
        // aesthetic_distance formatted for Delta E badges (e.g. 0.084 -> Delta E 8.4)
        const aestheticDistance = Number((deltaE / 100.0).toFixed(4));

        return {
          ...frame,
          aesthetic_distance: aestheticDistance,
          delta_e: deltaE,
        };
      });

      // 4. Sort strictly ascending (lowest perceptual Delta E first)
      scoredResults.sort((a: any, b: any) => a.delta_e - b.delta_e);

      // 5. Slice to requested limit
      const finalResults = scoredResults.slice(0, limit);

      return reply.send({
        total: finalResults.length,
        results: finalResults,
      });
    } catch (err: any) {
      server.log.error(err);
      return reply.code(500).send({ error: 'Search failed', details: err.message });
    }
  };

  // Register main endpoint and match-shot alias
  server.post<{ Body: SearchBody }>('/api/frames/search', handler);
  server.post<{ Body: SearchBody }>('/api/match-shot', handler);
};