import { Router, Request, Response } from 'express';
import useragent from 'useragent';
import { TaskModel } from '../models/Task';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    // 1️⃣ Client IP
    const ip = req.ip || req.socket.remoteAddress;

    // 2️⃣ Headers
    const uaString = req.headers['user-agent'] || '';
    const agent = useragent.parse(uaString);
    const os = agent.os.toString();
    const browser = agent.toAgent();
    const device = agent.device.toString();

    // 3️⃣ Fetch task
    const task = await TaskModel.findOne({ status: 'completed' }).lean();
    if (!task) return res.json({ error: 'Task not found' });

    // 4️⃣ Get base64 image
    const base64 = task.task.queries[0];

    // 6️⃣ Send response
    res.json({
      task,
      client: { ip, os, browser, device },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

export const welcomeRoutes = router;
