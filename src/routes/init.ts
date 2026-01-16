import { Router, Request, Response } from 'express';
import { SettingsModel } from '../models/Settings';
import crypto from 'crypto';
import { User } from '../models/User';

const router = Router();

function generateApiKey(): string {
  const prefixes = ['C_master', 'R_H', 'PC_CAP', 'NH', 'LOL'];
  const randomPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  return randomPrefix + '.' + crypto.randomBytes(32).toString('hex');
}

router.get('/setup', async (req: Request, res: Response) => {
  try {
    // Create default settings
    let settings = await SettingsModel.findOne();
    if (!settings) {
      settings = await SettingsModel.create({});
    }

    const user = await User.create({
      name: 'Md Rijon Hossain Jibon YT',
      email: 'mastaronline80@gmail.com'
    });

    return res.json({
      message: 'Database initialized successfully',
      data: settings,
      admin: user
    });

  } catch (error: unknown) {
    console.error('Error initializing database:', error);
    return res.status(500).json({
      error: 'Internal server error'
    });
  }
});

export const initRoutes = router;
