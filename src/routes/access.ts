import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { DeviceModel, IDevice } from '../models/Device';
import { SettingsModel, ISettings } from '../models/Settings';
import { ApiKeyModel, IApiKey } from '../models/ApiKey';
import axios from 'axios';
import { User } from '../models/User';

const router = Router();

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

router.get('/', async (req: Request, res: Response) => {
  try {
    // Validate query parameters
    const { visitorId, app } = accessQuerySchema.parse(req.query);

    // Check if maintenance mode is enabled
    let settings = await SettingsModel.findOne();
    if (!settings) {
      settings = await SettingsModel.create({});
    }

    if (settings.maintenanceMode) {
      return res.status(503).json({
        error: 'The extension is currently under maintenance. Please try again later.',
        status: 'maintenance_mode'
      });
    }

    // Check app version
    if (app && app !== settings.app_version) {
      return res.status(426).json({
        error: 'App update required',
        status: 'update_required',
        current_version: settings.app_version,
        client_version: app
      });
    }

    const user = await User.findOne({ visitorId });

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        status: 'user_not_found'
      });
    }

    if (user.status === 'suespend') {
      return res.status(403).json({
        error: 'This device is currently inactive. Please contact admin to activate it.',
        status: 'suespend'
      });
    }

    // Get API key
    const apiKeyDoc = await ApiKeyModel.findOne({ visitorId });

    if (!apiKeyDoc) {
      return res.status(400).json({
        error: 'No API key found',
        status: 'api_error'
      });
    }

    if (apiKeyDoc.status === 'inactive') {
      return res.status(403).json({
        error: 'This device is currently inactive. Please contact admin to activate it.',
        status: 'inactive'
      });
    }

    if (apiKeyDoc.status === 'expire' || (apiKeyDoc.expiresAt && new Date() > apiKeyDoc.expiresAt)) {
      return res.status(403).json({
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
        return res.json({
          balance: response.data.balance,
          plan: response.data.plan,
          status: 'active'
        });
      }

      return res.status(response.status || 400).json({
        error: response.data.error || 'Failed to fetch balance'
      });

    } catch (apiError: unknown) {
      console.error('CaptchaSonic API error:', apiError);
      return res.status(500).json({
        error: 'Failed to connect to external service'
      });
    }

  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }

    console.error('Error in access endpoint:', error);
    return res.status(500).json({
      error: 'Internal server error'
    });
  }
});

export const accessRoutes = router;
