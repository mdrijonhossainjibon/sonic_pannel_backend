import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { DeviceModel, IDevice } from '../models/Device';
import { SettingsModel, ISettings } from '../models/Settings';
import { ApiKeyModel, IApiKey } from '../models/ApiKey';
import { TaskModel, ITask } from '../models/Task';

import axios from 'axios';

const createTaskSchema = z.object({
  apiKey: z.string(),
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
  const deviceModel = new DeviceModel(fastify.mongo.db);
  const settingsModel = new SettingsModel(fastify.mongo.db);
  const apiKeyModel = new ApiKeyModel(fastify.mongo.db);
  const taskModel = new TaskModel(fastify.mongo.db);

  

  fastify.post<{ Body: z.infer<typeof createTaskSchema> }>(
    '/',
    async (request: FastifyRequest<{ Body: z.infer<typeof createTaskSchema> }>, reply: FastifyReply) => {
      try {
        // Validate request body
        const { apiKey: deviceApiKey, task } = createTaskSchema.parse(request.body);

        // Check if maintenance mode is enabled
        let settings = await settingsModel.findOne();
        if (!settings) {
          settings = await settingsModel.create({
            maintenanceMode: false,
            freeTrialAllowed: false,
          });
        }

        if (settings.maintenanceMode) {
          return reply.status(503).send({
            error: 'The extension is currently under maintenance. Please try again later.',
            status: 'maintenance_mode'
          });
        }

        // Check device by API key
        const device = await deviceModel.findOne({ ipAddress: deviceApiKey });

        if (!device) {
          return reply.status(400).send({
            error: 'You have not eligible this extension. Please contact admin for assistance.',
            status: 'ip_not_found'
          });
        }

        if (device.status === 'inactive') {
          return reply.status(403).send({
            error: 'This device is currently inactive. Please contact admin to activate it.',
            status: 'device_inactive'
          });
        }

        // Get API key
        const apiKeyDoc = await apiKeyModel.findOne({ isActive: true });

        if (!apiKeyDoc) {
          return reply.status(400).send({
            error: 'No active API key found'
          });
        }

        // Create task record
        const taskRecord = await taskModel.create({
          apiKey: deviceApiKey,
          task,
          status: 'pending'
        });

        // Call CaptchaSonic API
        try {
          const response = await axios.post<CaptchaSonicResponse>('https://api.captchasonic.com/createTask', {
            apiKey: apiKeyDoc.key,
            task
          }, {
            timeout: 10000
          });

          
          if (response.data.code === 200) {
            // Update task status
            await taskModel.findByIdAndUpdate(taskRecord._id!, {
              status: 'completed',
              result: response.data
            });

            // Update device credit usage
            await deviceModel.incrementCredit(device._id!, 1);
            return reply.send(response.data);
          } else {
            // Update task status to failed
            await taskModel.findByIdAndUpdate(taskRecord._id!, {
              status: 'failed',
              result: response.data
            });

            return reply.status(400).send({
              error: response.data.msg || 'Failed to create task',
              code: response.data.code,
              response: response.data
            });
          }

        } catch (apiError: unknown) {
            console.log(apiError)
          fastify.log.error({ error: apiError }, 'CaptchaSonic API error');
          
          // Update task status to failed
          await taskModel.findByIdAndUpdate(taskRecord._id!, {
            status: 'failed',
            result: apiError instanceof Error ? apiError.message : String(apiError)
          });

          return reply.status(500).send({
            error: 'Failed to connect to external service'
          });
        }

      } catch (error: unknown) {
        if (error instanceof z.ZodError) {
          return reply.status(400).send({ error: error.errors });
        }

        fastify.log.error({ error }, 'Error in createTask endpoint');
        return reply.status(500).send({
          error: error
        });
      }
    }
  );

  // GET endpoint to list tasks
  fastify.get(
    '/tasks',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const tasks = await taskModel.find();

        return reply.send({
          tasks: tasks.map(task => ({
            id: task._id,
            apiKey: task.apiKey,
            status: task.status,
            result: task.result,
            createdAt: task.createdAt,
            updatedAt: task.updatedAt
          }))
        });

      } catch (error: unknown) {
        fastify.log.error({ error }, 'Error fetching tasks');
        return reply.status(500).send({
          error: 'Internal server error'
        });
      }
    }
  );
}
