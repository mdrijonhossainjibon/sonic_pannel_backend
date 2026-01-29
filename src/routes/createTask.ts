import { Router, Request, Response } from 'express';
import { z } from 'zod';

import { SettingsModel } from '../models/Settings';
import { ApiKeyModel } from '../models/ApiKey';
import { User } from '../models/User';
import { API_CALL } from 'auth-fingerprint';
const router = Router();


router.post('/', async (req: Request, res: Response) => {

  try {
    // 1️⃣ Validate request

    const { apiKey: visitorId, task, version, source, appID } = req.body;

    // 2️⃣ Maintenance check
    let settings = await SettingsModel.findOne({});
    if (!settings) {
      settings = await SettingsModel.create({});
    }

    if (settings.maintenanceMode) {
      return res.status(503).json({
        error: 'The extension is currently under maintenance.',
        status: 'maintenance_mode'
      });
    }

    const user = await User.findOne({ visitorId });
    console.log('👤 User lookup result:', user ? `Found user: ${user._id}` : 'User not found');

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

    const apiKeyDoc = await ApiKeyModel.findOne({ visitorId });
    console.log('🔑 API Key lookup result:', apiKeyDoc ? `Found key with status: ${apiKeyDoc.status}` : 'API key not found');

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

    const { response, status } = await API_CALL({ baseURL: 'https://api.captchasonic.com', body: { apiKey: settings.key, task, version, source, appID }, method: 'POST', url: '/createTask' })

  

    if (status === 200 && response.code === 200) {
     
      return res.json(response);
    }


    return res.status(400).json({
      error: response.msg || 'Task failed',
      code: response.code,
      response: response.data
    });

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('❌ Internal server error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export const createTaskRoutes = router;
