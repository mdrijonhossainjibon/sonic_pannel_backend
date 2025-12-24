import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import useragent from 'useragent';
import { TaskModel } from '../models/Task';
 

export async function welcomeRoutes(fastify: FastifyInstance) {
  fastify.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // 1️⃣ Client IP
      const ip = request.ip;

      // 2️⃣ Headers
      const uaString = request.headers['user-agent'] || '';
      const agent = useragent.parse(uaString);
      const os = agent.os.toString();
      const browser = agent.toAgent();
      const device = agent.device.toString();

      // 3️⃣ Fetch task
      const task = await TaskModel.findOne({ status: 'completed' }).lean();
      if (!task) return reply.send({ error: 'Task not found' });

      // 4️⃣ Get base64 image
      const base64 = task.task.queries[0];
 
      // 6️⃣ Send response
      reply.send({
      
        task,
        client: { ip, os, browser, device },
      });
    } catch (err) {
      console.error(err);
      reply.status(500).send({ error: 'Server error' });
    }
  });
}
