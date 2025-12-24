import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { SettingsModel } from '../models/Settings';
import crypto from 'crypto';
import { User } from '../models/User';
 

function generateApiKey(): string {
  const prefixes = ['C_master', 'R_H', 'PC_CAP', 'NH', 'LOL'];
  const randomPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  return randomPrefix + '.' + crypto.randomBytes(32).toString('hex');
}



export async function initRoutes(fastify: FastifyInstance) {



  fastify.get(
    '/setup',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        // Create default settings
        let settings = await SettingsModel.findOne();
        if (!settings) {
          settings = await SettingsModel.create({

          });
        }

     
  const user = await User.create({ name : 'Md Rijon Hossain Jibon YT'    , email : 'mastaronline80@gmail.com'})

        return reply.send({
          message: 'Database initialized successfully',
          data: settings , admin : user
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
