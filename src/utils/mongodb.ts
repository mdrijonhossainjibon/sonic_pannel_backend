import { FastifyInstance } from 'fastify';

export async function getMongoDBCollection(fastify: FastifyInstance, collectionName: string) {
  const db = fastify.mongo.db;
  if (!db) {
    throw new Error('MongoDB connection not established');
  }
  return db.collection(collectionName);
}

export async function getMongoDBDatabase(fastify: FastifyInstance) {
  const db = fastify.mongo.db;
  if (!db) {
    throw new Error('MongoDB connection not established');
  }
  return db;
}
