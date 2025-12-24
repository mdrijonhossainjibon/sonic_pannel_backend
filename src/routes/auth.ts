import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { User } from '../models/User';
import { authenticate } from '../middleware/auth';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
});

const loginSchema = z.object({   
  email: z.string().email(),
  password: z.string(),
});

export async function authRoutes(fastify: FastifyInstance) {
  fastify.post<{ Body: z.infer<typeof registerSchema> }>(
    '/register',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const body = registerSchema.parse(request.body);

        const existingUser = await User.findOne({ email: body.email });
        if (existingUser) {
          return reply.status(400).send({ error: 'User already exists' });
        }

        const user = new User({
          email: body.email,
          password: body.password,
          name: body.name,
        });

        await user.save();

        const token = fastify.jwt.sign({ id: user._id, email: user.email });

        return reply.status(201).send({
          message: 'User registered successfully',
          token,
          user: {
            id: user._id,
            email: user.email,
            name: user.name,
            role: user.role,
          },
        });
      } catch (error) {
        if (error instanceof z.ZodError) {
          return reply.status(400).send({ error: error.errors });
        }
        return reply.status(500).send({ error: 'Internal server error' });
      }
    }
  );

  fastify.post<{ Body: z.infer<typeof loginSchema> }>(
    '/login',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const body = loginSchema.parse(request.body);

        const user = await User.findOne({ email: body.email });
        if (!user) {
          return reply.status(401).send({ error: 'Invalid credentials' });
        }

        const isPasswordValid = await user.comparePassword(body.password);
        if (!isPasswordValid) {
          return reply.status(401).send({ error: 'Invalid credentials' });
        }

        const token = fastify.jwt.sign({ id: user._id, email: user.email });

        return reply.send({
          message: 'Login successful',
          token,
          user: {
            id: user._id,
            email: user.email,
            name: user.name,
            role: user.role,
          },
        });
      } catch (error) {
        if (error instanceof z.ZodError) {
          return reply.status(400).send({ error: error.errors });
        }
        return reply.status(500).send({ error: 'Internal server error' });
      }
    }
  );

  fastify.get(
    '/me',
    { onRequest: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = await User.findById((request.user as any).id).select('-password');
        if (!user) {
          return reply.status(404).send({ error: 'User not found' });
        }
        return reply.send(user);
      } catch (error) {
        return reply.status(500).send({ error: 'Internal server error' });
      }
    }
  );
}
