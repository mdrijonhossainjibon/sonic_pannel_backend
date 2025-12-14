import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { SettingsModel } from '../models/Settings';
import { ApiKeyModel } from '../models/ApiKey';
import { DeviceModel } from '../models/Device';

export async function initRoutes(fastify: FastifyInstance) {
  const settingsModel = new SettingsModel(fastify.mongo.db);
  const apiKeyModel = new ApiKeyModel(fastify.mongo.db);
  const deviceModel = new DeviceModel(fastify.mongo.db);

  fastify.get(
    '/setup',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        // Create default settings
        let settings = await settingsModel.findOne();
        if (!settings) {
          settings = await settingsModel.create({
            maintenanceMode: false,
            freeTrialAllowed: false,
          });
        }

        // Create default API key
        let apiKey = await apiKeyModel.findOne({});
        if (!apiKey) {
          apiKey = await apiKeyModel.create({
            key: 'sonic_c5962f486d9d22c7f70266c8',
            name: 'Default Test API Key',
            isActive: true,
          });
        }

        // Create test device
        const testIp = '172.21.64.1';
        let device = await deviceModel.findOne({ ipAddress: testIp });
        if (!device) {
          device = await deviceModel.create({
            ipAddress: testIp,
            status: 'active',
          });
        }

        return reply.send({
          message: 'Database initialized successfully',
          data: {
            settings,
            apiKey: { key: apiKey.key, name: apiKey.name, isActive: apiKey.isActive },
            device: { ipAddress: device.ipAddress, status: device.status }
          }
        });

      } catch (error: unknown) {
        fastify.log.error({ error }, 'Error initializing database');
        return reply.status(500).send({
          error: 'Internal server error'
        });
      }
    }
  );
}
