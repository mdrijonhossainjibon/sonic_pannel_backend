import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { DeviceModel, IDevice } from '../models/Device';
import { SettingsModel, ISettings } from '../models/Settings';
import { ApiKeyModel, IApiKey } from '../models/ApiKey';
import axios from 'axios';

const accessQuerySchema = z.object({
  ip: z.string().ip()
});

interface CaptchaSonicResponse {
  status: string;
  balance?: number;
  plan?: string;
  error?: string;
}

export async function accessRoutes(fastify: FastifyInstance) {
  const deviceModel = new DeviceModel(fastify.mongo.db);
  const settingsModel = new SettingsModel(fastify.mongo.db);
  const apiKeyModel = new ApiKeyModel(fastify.mongo.db);

  fastify.get<{ Querystring: z.infer<typeof accessQuerySchema> }>(
    '/',
    async (request: FastifyRequest<{ Querystring: z.infer<typeof accessQuerySchema> }>, reply: FastifyReply) => {
      try {
        // Validate query parameters
        const { ip } = accessQuerySchema.parse(request.query);

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

        // Get API key
        const apiKeyDoc = await apiKeyModel.findOne({ isActive: true });

        if (!apiKeyDoc) {
          return reply.status(400).send({
            error: 'No API key found',
            status : 'api_error'
          });
        }

        // Check device
        const device = await deviceModel.findOne({ ipAddress: ip });

        if (!device) {
          return reply.status(400).send({
            error: 'You have not eligible this extension. Please contact admin for assistance.',
            status: 'ip_not_found'
          });
        }

        if (device.status === 'inactive') {
          return reply.status(403).send({
            error: 'This device is currently inactive. Please contact admin to activate it.',
            status: 'ban'
          });
        }

        // Make API call to CaptchaSonic
        try {
          const response = await axios.get<CaptchaSonicResponse>('https://api.captchasonic.com/balance', {
            params: { apiKey: apiKeyDoc.key },
            timeout: 10000
          });

          if (response.status === 200 && response.data.status === 'ok') {
            return reply.send({
              balance: response.data.balance,
              plan: response.data.plan,
              status: 'active'
            });
          }

          return reply.status(response.status || 400).send({
            error: response.data.error || 'Failed to fetch balance'
          });

        } catch (apiError: unknown) {
          fastify.log.error({ error: apiError }, 'CaptchaSonic API error');
          return reply.status(500).send({
            error: 'Failed to connect to external service'
          });
        }

      } catch (error: unknown) {
        if (error instanceof z.ZodError) {
          return reply.status(400).send({ error: error.errors });
        }

        fastify.log.error({ error }, 'Error in access endpoint');
        return reply.status(500).send({
          error: 'Internal server error'
        });
      }
    }
  );

  // POST endpoint to add new device
  fastify.post<{ Body: { ipAddress: string; status?: 'active' | 'inactive' } }>(
    '/',
    async (request: FastifyRequest<{ Body: { ipAddress: string; status?: 'active' | 'inactive' } }>, reply: FastifyReply) => {
      try {
        const { ipAddress, status = 'active' } = request.body;

        // Check if device already exists
        const existingDevice = await deviceModel.findOne({ ipAddress });
        if (existingDevice) {
          return reply.status(400).send({
            error: 'Device with this IP address already exists'
          });
        }

        // Create new device
        const device = await deviceModel.create({
          ipAddress,
          status
        });

        return reply.status(201).send({
          message: 'Device created successfully',
          device: {
            id: device._id,
            ipAddress: device.ipAddress,
            status: device.status,
            createdAt: device.createdAt
          }
        });

      } catch (error: unknown) {
        fastify.log.error({ error }, 'Error creating device');
        return reply.status(500).send({
          error: 'Internal server error'
        });
      }
    }
  );

  // PUT endpoint to update device status
  fastify.put<{ Params: { id: string }; Body: { status: 'active' | 'inactive' } }>(
    '/:id',
    async (request: FastifyRequest<{ Params: { id: string }; Body: { status: 'active' | 'inactive' } }>, reply: FastifyReply) => {
      try {
        const { id } = request.params;
        const { status } = request.body;

        const device = await deviceModel.findByIdAndUpdate(
          id,
          { status }
        );

        if (!device) {
          return reply.status(404).send({
            error: 'Device not found'
          });
        }

        return reply.send({
          message: 'Device updated successfully',
          device: {
            id: device._id,
            ipAddress: device.ipAddress,
            status: device.status,
            updatedAt: device.updatedAt
          }
        });

      } catch (error: unknown) {
        fastify.log.error({ error }, 'Error updating device');
        return reply.status(500).send({
          error: 'Internal server error'
        });
      }
    }
  );

  // DELETE endpoint to remove device
  fastify.delete<{ Params: { id: string } }>(
    '/:id',
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        const { id } = request.params;

        const device = await deviceModel.findByIdAndDelete(id);

        if (!device) {
          return reply.status(404).send({
            error: 'Device not found'
          });
        }

        return reply.send({
          message: 'Device deleted successfully'
        });

      } catch (error: unknown) {
        fastify.log.error({ error }, 'Error deleting device');
        return reply.status(500).send({
          error: 'Internal server error'
        });
      }
    }
  );

  // GET endpoint to list all devices
  fastify.get(
    '/devices',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const devices = await deviceModel.find();

        return reply.send({
          devices: devices.map(device => ({
            id: device._id,
            ipAddress: device.ipAddress,
            status: device.status,
            createdAt: device.createdAt,
            updatedAt: device.updatedAt
          }))
        });

      } catch (error: unknown) {
        fastify.log.error({ error }, 'Error fetching devices');
        return reply.status(500).send({
          error: 'Internal server error'
        });
      }
    }
  );
}
