import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';

import axios from 'axios';

import { SettingsModel } from '../models/Settings';
import { ApiKeyModel } from '../models/ApiKey';
import { TaskModel } from '../models/Task';
import { User } from '../models/User';

const createTaskSchema = z.object({
  apiKey: z.string(), // device api key
  task: z.any()
});

interface CaptchaSonicResponse {
  code: number;
  msg: string;
  answers?: any[];
  meta?: {
    pass_report: boolean;
    fail_report: boolean;
    data: string;
  };
  questionType?: string;
  error?: string;
}

export async function createTaskRoutes(fastify: FastifyInstance) {

  fastify.post<{ Body: z.infer<typeof createTaskSchema> }>(
    '/',
    async (
      request: FastifyRequest<{ Body: z.infer<typeof createTaskSchema> }>,
      reply: FastifyReply
    ) => {
      try {
        // 1️⃣ Validate request
        const { apiKey: visitorId, task } = createTaskSchema.parse(request.body);

        // 2️⃣ Maintenance check
        let settings = await SettingsModel.findOne();
        if (!settings) {
          settings = await SettingsModel.create({});
        }

        if (settings.maintenanceMode) {
          return reply.status(503).send({
            error: 'The extension is currently under maintenance.',
            status: 'maintenance_mode'
          });
        }
 

              const user = await User.findOne({ visitorId });
        
        
                if (!user) {
                  return reply.status(404).send({
                    error: 'User not found',
                    status: 'user_not_found'
                  });
                }
        
                if (user.status === 'suespend') {
                  return reply.status(403).send({
                    error: 'This device is currently inactive. Please contact admin to activate it.',
                    status: 'suespend'
                  });
                }
        

     const apiKeyDoc = await ApiKeyModel.findOne({ visitorId });

        if (!apiKeyDoc) {
          return reply.status(400).send({
            error: 'No API key found',
            status: 'api_error'
          });
        }

        if (apiKeyDoc.status === 'inactive') {
          return reply.status(403).send({
            error: 'This device is currently inactive. Please contact admin to activate it.',
            status: 'inactive'
          });
        }

        if (apiKeyDoc.status === 'expire' || (apiKeyDoc.expiresAt && new Date() > apiKeyDoc.expiresAt)) {
          return reply.status(403).send({
            error: 'API key has expired. Please contact admin to renew it.',
            status: 'expire'
          });
        }


      /*   // 6️⃣ Check existing completed task
        const existingTask = await TaskModel.findOne({
          'task.question': task.question, 'task.queries': { $in: task.queries }
        })


        if (existingTask) {
          return reply.send(existingTask.result);
        }
 */
        // 8️⃣ Call external CaptchaSonic API

        try {

          const response = await axios.post<CaptchaSonicResponse>(
            'https://api.captchasonic.com/createTask',
            {
              apiKey: settings.key,
              task
            },
            { timeout: 10000 }
          );

          if (response.data.code === 200) {

            // 7️⃣ Create new task (only if not exists)
            await TaskModel.create({  task, status: 'completed' , result : response.data});

            return reply.send(response.data);
          }


          return reply.status(400).send({
            error: response.data.msg || 'Task failed',
            code: response.data.code,
            response: response.data
          });

        } catch (apiError: any) {
          fastify.log.error(apiError, 'CaptchaSonic API error');

          return reply.status(500).send({
            error: 'Failed to connect to external service'
          });
        }

      } catch (error: any) {
        if (error instanceof z.ZodError) {
          return reply.status(400).send({ error: error.errors });
        }

        fastify.log.error(error, 'createTask error');
        return reply.status(500).send({ error: 'Internal server error' });
      }
    }
  );

  // 🔍 List tasks (admin/debug)
  fastify.get('/tasks', async (_req, reply) => {
    const tasks = await TaskModel.find().sort({ createdAt: -1 });

    return reply.send({
      tasks: tasks.map(t => ({
        id: t._id,
        status: t.status,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt
      }))
    });
  });
}
