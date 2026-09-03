import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import dotenv from 'dotenv';
import { checkDbConnection } from './config/db.js';
import { ingestRoute } from './routes/ingest.route.js';
import { searchRoute } from './routes/search.route.js';

dotenv.config();

const server = Fastify({
    logger: true,
    bodyLimit: 25 * 1024 * 1024, // 25MB max limit
});

server.get('/health', async () => {
    return { status: 'ok', service: 'frame-hunter-backend' };
});

const start = async () => {
    try {
        const isDbConnected = await checkDbConnection();
        if (!isDbConnected) {
            console.error('❌ Could not connect to PostgreSQL. Ensure Docker container is running.');
            process.exit(1);
        }
        console.log('✅ PostgreSQL connection verified.');

        // Register Plugins
        await server.register(cors, {
            origin: '*',
        });

        await server.register(multipart, {
            limits: {
                fileSize: 25 * 1024 * 1024,
            },
        });

        // Register Endpoints
        await server.register(ingestRoute);
        await server.register(searchRoute);

        const port = Number(process.env.PORT) || 5000;
        await server.listen({ port, host: '0.0.0.0' });
        console.log(`🚀 FrameHunter server listening on http://localhost:${port}`);
    } catch (err) {
        server.log.error(err);
        process.exit(1);
    }
};

start();