import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { DeviceModel, IDevice } from '../models/Device';
import { SettingsModel, ISettings } from '../models/Settings';
import { ApiKeyModel, IApiKey } from '../models/ApiKey';
import axios from 'axios';
import { User } from '../models/User';

const accessQuerySchema = z.object({
  visitorId: z.string(),
  app: z.string().optional(),
});

interface CaptchaSonicResponse {
  status: string;
  balance?: number;
  plan?: string;
  error?: string;
}

export async function accessRoutes(fastify: FastifyInstance) {


  fastify.get<{ Querystring: z.infer<typeof accessQuerySchema> }>(
    '/',
    async (request: FastifyRequest<{ Querystring: z.infer<typeof accessQuerySchema> }>, reply: FastifyReply) => {
      try {
        // Validate query parameters
        const { visitorId, app } = accessQuerySchema.parse(request.query);

        // Check if maintenance mode is enabled
        let settings = await SettingsModel.findOne();
        if (!settings) {
          settings = await SettingsModel.create({});
        }

        if (settings.maintenanceMode) {
          return reply.status(503).send({
            error: 'The extension is currently under maintenance. Please try again later.',
            status: 'maintenance_mode'
          });
        }

        // Check app version
        if (app && app !== settings.app_version) {
          return reply.status(426).send({
            error: 'App update required',
            status: 'update_required',
            current_version: settings.app_version,
            client_version: app
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

        // Get API key
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

        // Make API call to CaptchaSonic
        try {
          const response = await axios.get<CaptchaSonicResponse>('https://api.captchasonic.com/balance', {
            params: { apiKey: settings.key },
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

  
}
