import Fastify, { FastifyInstance } from 'fastify'
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import jwt from '@fastify/jwt';
import fastifyMongodb from '@fastify/mongodb';
import dotenv from 'dotenv';
import { authRoutes } from './routes/auth';
import { userRoutes } from './routes/users';
import { accessRoutes } from './routes/access';
import { initRoutes } from './routes/init';
import { createTaskRoutes } from './routes/createTask';
import { authenticateToken } from './middleware/auth';

dotenv.config();

const PORT = parseInt(process.env.PORT || '3001', 10);
 

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://admin:secret@localhost:27017/AdminHub?authSource=admin';

/* ------------------ Server ------------------ */
const fastify: FastifyInstance = Fastify({
    logger: true,
    trustProxy: true
})

/* ------------------ MongoDB & JWT Setup ------------------ */
fastify.register(fastifyMongodb, { forceClose: true, url: MONGODB_URI });
 
fastify.register(helmet);
fastify.register(cors, {
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});
////fastify.register(authenticateToken);

/* ------------------ Routes ------------------ */
fastify.register(authRoutes, { prefix: '/api/auth' });
fastify.register(userRoutes, { prefix: '/api/users' });
fastify.register(accessRoutes, { prefix: '/api/access' });
fastify.register(initRoutes, { prefix: '/api/init' });
fastify.register(createTaskRoutes, { prefix: '/api/createTask' });
async function start() {
    try {
        await fastify.listen({ port: PORT, host: '0.0.0.0' });
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
}

start();
