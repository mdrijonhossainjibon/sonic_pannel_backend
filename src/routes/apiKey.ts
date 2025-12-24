import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ApiKeyModel, IApiKey } from '../models/ApiKey';
import { User } from '../models/User';

export async function apiKeyRoutes(fastify: FastifyInstance) {
  // GET endpoint to retrieve API key
  fastify.get('/',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const apiKeyDoc = await ApiKeyModel.findOne({});

        if (!apiKeyDoc) {
          return reply.status(404).send({
            error: 'No API key found',
            status: 'not_found'
          });
        }

        return reply.send({
          apiKey: apiKeyDoc.key,
          status: 'success'
        });

      } catch (error: unknown) {
        fastify.log.error({ error }, 'Error fetching API key');
        return reply.status(500).send({
          error: 'Internal server error'
        });
      }
    }
  );

  // POST endpoint to create/update API key
  fastify.post('/',
    async (request: FastifyRequest<{ Body: { key: string, visitorId: string } }>, reply: FastifyReply) => {
      try {
        const { key, visitorId } = request.body;

        if (!key) {
          return reply.status(400).send({
            error: 'API key is required',
            status: 'invalid_request'
          });
        }

        // Update existing or create new API key
        // Check if visitorId is already associated with another key
        const existingKeyForVisitor = await ApiKeyModel.findOne({ visitorId });
        if (existingKeyForVisitor && existingKeyForVisitor.key !== key) {
          return reply.status(409).send({
            status: 'conflict',
            message: 'Visitor ID is already associated with another API key.'
          });
        }

        let apiKeyDoc = await ApiKeyModel.findOne({ key });

        const user = await User.findOne({ visitorId });

        if (apiKeyDoc) {
          // Check if API key is expired
          if (apiKeyDoc.status === 'expire' || (apiKeyDoc.expiresAt && new Date() > apiKeyDoc.expiresAt)) {
            return reply.status(403).send({
              status: 'expire',
              message: 'API key has expired'
            });
          }

          // Check if API key is not used yet or used by same visitor
          if (!apiKeyDoc.visitorId || apiKeyDoc.visitorId === visitorId) {
            // API key available - update or create user with API key name
            if (!user) {
              await User.create({ name: apiKeyDoc.name || 'Unknown User', visitorId, })
            } else {
              user.name = apiKeyDoc.name || 'Unknown User';
              user.visitorId = visitorId
              await user.save()
            }

            // Mark API key as used
            apiKeyDoc.lastUsedAt = new Date();
            apiKeyDoc.visitorId = visitorId;
            await apiKeyDoc.save();

            return reply.send({
              status: 'valid',
              message: 'API key is valid',
              apiKey: apiKeyDoc.key,
              name: apiKeyDoc.name,
              lastUsedAt: apiKeyDoc.lastUsedAt,
              visitorId: apiKeyDoc.visitorId
            });
          } else {
            // API key is used by different visitor - not available
            return reply.status(403).send({
              status: 'unavailable',
              message: 'API key is already used by another user'
            });
          }
        } else {
          // API key doesn't exist
          return reply.status(404).send({
            status: 'invalid',
            message: 'API key not found'
          });
        }
      } catch (error: unknown) {
        console.log(error)
        return reply.status(500).send({
          error: 'Internal server error'
        });
      }
    }
  );


}
