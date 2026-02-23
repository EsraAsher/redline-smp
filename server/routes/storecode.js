import { Router } from 'express';
import StoreCode from '../models/StoreCode.js';

const router = Router();

// POST /api/storecode/generate
// Called by Minecraft plugin only
router.post('/generate', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const serverSecret = process.env.SERVER_SECRET;

    if (!serverSecret) {
      return res.status(500).json({ success: false });
    }

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false });
    }

    const token = authHeader.split(' ')[1];
    if (token !== serverSecret) {
      return res.status(401).json({ success: false });
    }

    const { username, code } = req.body;

    if (!username || !code) {
      return res.status(400).json({ success: false });
    }

    await StoreCode.deleteMany({ username, used: false });

    await StoreCode.create({
      username,
      code,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      used: false,
    });

    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ success: false });
  }
});

// POST /api/storecode/verify
// Called by website before payment
router.post('/verify', async (req, res) => {
  try {
    const { username, code } = req.body;

    if (!username || !code) {
      return res.json({ success: false });
    }

    const found = await StoreCode.findOne({
      username,
      code,
      used: false,
      expiresAt: { $gt: new Date() },
    });

    if (!found) {
      return res.json({ success: false });
    }

    found.used = true;
    await found.save();

    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ success: false });
  }
});

export default router;
