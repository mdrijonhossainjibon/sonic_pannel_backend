import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { User } from '../models/User';
import { authenticate } from '../middleware/auth';

const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  role: z.enum(['admin', 'user', 'moderator']).optional(),
  status: z.enum(['active', 'inactive']).optional(),
});

export async function userRoutes(fastify: FastifyInstance) {
  fastify.get(
    '/',
    { onRequest: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const users = await User.find().select('-password');
        return reply.send(users);
      } catch (error) {
        return reply.status(500).send({ error: 'Internal server error' });
      }
    }
  );

  fastify.get<{ Params: { id: string } }>(
    '/:id',
    { onRequest: [authenticate] },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        const user = await User.findById(request.params.id).select('-password');
        if (!user) {
          return reply.status(404).send({ error: 'User not found' });
        }
        return reply.send(user);
      } catch (error) {
        return reply.status(500).send({ error: 'Internal server error' });
      }
    }
  );

  fastify.put<{ Params: { id: string }; Body: z.infer<typeof updateUserSchema> }>(
    '/:id',
    { onRequest: [authenticate] },
    async (request: FastifyRequest<{ Params: { id: string }; Body: z.infer<typeof updateUserSchema> }>, reply: FastifyReply) => {
      try {
        const body = updateUserSchema.parse(request.body);
        const user = await User.findByIdAndUpdate(request.params.id, body, {
          new: true,
        }).select('-password');

        if (!user) {
          return reply.status(404).send({ error: 'User not found' });
        }

        return reply.send(user);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return reply.status(400).send({ error: error.errors });
        }
        return reply.status(500).send({ error: 'Internal server error' });
      }
    }
  );

  fastify.delete<{ Params: { id: string } }>(
    '/:id',
    { onRequest: [authenticate] },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        const user = await User.findByIdAndDelete(request.params.id);
        if (!user) {
          return reply.status(404).send({ error: 'User not found' });
        }
        return reply.send({ message: 'User deleted successfully' });
      } catch (error) {
        return reply.status(500).send({ error: 'Internal server error' });
      }
    }
  );
}
