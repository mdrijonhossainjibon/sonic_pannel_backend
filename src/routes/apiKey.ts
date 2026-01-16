import { Router, Request, Response } from 'express';
import { ApiKeyModel, IApiKey } from '../models/ApiKey';
import { User } from '../models/User';

const router = Router();

// GET endpoint to retrieve API key
router.get('/', async (req: Request, res: Response) => {
  try {
    const apiKeyDoc = await ApiKeyModel.findOne({});

    if (!apiKeyDoc) {
      return res.status(404).json({
        error: 'No API key found',
        status: 'not_found'
      });
    }

    return res.json({
      apiKey: apiKeyDoc.key,
      status: 'success'
    });

  } catch (error: unknown) {
    console.error('Error fetching API key:', error);
    return res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// POST endpoint to create/update API key
router.post('/', async (req: Request, res: Response) => {
  try {
    const { key, visitorId } = req.body;

    if (!key) {
      return res.status(400).json({
        error: 'API key is required',
        status: 'invalid_request'
      });
    }

    // Update existing or create new API key
    // Check if visitorId is already associated with another key
    const existingKeyForVisitor = await ApiKeyModel.findOne({ visitorId });
    if (existingKeyForVisitor && existingKeyForVisitor.key !== key) {
      return res.status(409).json({
        status: 'conflict',
        message: 'Visitor ID is already associated with another API key.'
      });
    }

    let apiKeyDoc = await ApiKeyModel.findOne({ key });

    const user = await User.findOne({ visitorId });

    if (apiKeyDoc) {
      // Check if API key is expired
      if (apiKeyDoc.status === 'expire' || (apiKeyDoc.expiresAt && new Date() > apiKeyDoc.expiresAt)) {
        return res.status(403).json({
          status: 'expire',
          message: 'API key has expired'
        });
      }

      // Check if API key is not used yet or used by same visitor
      if (!apiKeyDoc.visitorId || apiKeyDoc.visitorId === visitorId) {
        // API key available - update or create user with API key name
        if (!user) {
          await User.create({ name: apiKeyDoc.name || 'Unknown User', visitorId });
        } else {
          user.name = apiKeyDoc.name || 'Unknown User';
          user.visitorId = visitorId;
          await user.save();
        }

        // Mark API key as used
        apiKeyDoc.lastUsedAt = new Date();
        apiKeyDoc.visitorId = visitorId;
        await apiKeyDoc.save();

        return res.json({
          status: 'valid',
          message: 'API key is valid',
          apiKey: apiKeyDoc.key,
          name: apiKeyDoc.name,
          lastUsedAt: apiKeyDoc.lastUsedAt,
          visitorId: apiKeyDoc.visitorId
        });
      } else {
        // API key is used by different visitor - not available
        return res.status(403).json({
          status: 'unavailable',
          message: 'API key is already used by another user'
        });
      }
    } else {
      // API key doesn't exist
      return res.status(404).json({
        status: 'invalid',
        message: 'API key not found'
      });
    }
  } catch (error: unknown) {
    console.log(error);
    return res.status(500).json({
      error: 'Internal server error'
    });
  }
});

export const apiKeyRoutes = router;
